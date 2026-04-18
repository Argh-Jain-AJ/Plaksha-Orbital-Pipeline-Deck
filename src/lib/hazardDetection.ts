export type InstructionType = "ADD" | "SUB" | "LW" | "SW" | "";

export interface RawInstruction {
  id: number;
  type: InstructionType;
  rd: string;
  rs1: string;
  rs2: string;
  offset: string;
}

export interface ParsedInstruction {
  id: string; // e.g. "I1"
  type: InstructionType;
  dest: string | null;
  src1: string | null;
  src2: string | null;
  base: string | null;
  offset: number | null;
}

export interface Hazard {
  from: string;
  to: string;
  register: string;
}

/**
 * Parses the raw UI input instructions into a structured format
 * mapping architectural roles (destination, sources) based on the instruction type.
 */
export function parseInstructions(rawInstructions: RawInstruction[]): ParsedInstruction[] {
  return rawInstructions.map(inst => {
    let dest: string | null = null;
    let src1: string | null = null;
    let src2: string | null = null;
    let base: string | null = null;
    let offset: number | null = null;

    if (inst.type === "ADD" || inst.type === "SUB") {
      // ADD/SUB writes to dest, reads from src1 and src2
      dest = inst.rd;
      src1 = inst.rs1;
      src2 = inst.rs2;
    } else if (inst.type === "LW") {
      // LW writes to dest, reads from the base register
      dest = inst.rd;
      base = inst.rs1;
      offset = parseInt(inst.offset, 10);
      if (isNaN(offset)) offset = 0;
    } else if (inst.type === "SW") {
      // SW has no destination register.
      // It reads the source register (rd in the UI) to store into memory at the base register.
      src1 = inst.rd;
      base = inst.rs1;
      offset = parseInt(inst.offset, 10);
      if (isNaN(offset)) offset = 0;
    }

    return {
      id: `I${inst.id}`,
      type: inst.type,
      dest,
      src1,
      src2,
      base,
      offset
    };
  });
}

/**
 * Detects Read-After-Write (RAW) hazards by comparing each instruction's 
 * source registers with the destination registers of preceding instructions.
 */
export function detectRAW(parsedInstructions: ParsedInstruction[]): Hazard[] {
  const hazards: Hazard[] = [];

  // For each instruction Ii
  for (let i = 0; i < parsedInstructions.length; i++) {
    const Ii = parsedInstructions[i];
    
    // Compare with all previous instructions Ij (j < i)
    for (let j = 0; j < i; j++) {
      const Ij = parsedInstructions[j];
      
      // If Ij doesn't write to a destination, it can't cause a RAW dependency
      if (!Ij.dest) continue;
      
      // Ignore an empty destination name
      if (Ij.dest.trim() === "") continue;

      // Check if Ii reads a register that Ij writes
      // We check src1, src2, and base. We use else if to avoid double reporting
      // the same dependency if a register is somehow used multiple times.
      
      if (Ii.src1 && Ii.src1 === Ij.dest) {
        hazards.push({
          from: Ij.id,
          to: Ii.id,
          register: Ij.dest
        });
      } else if (Ii.src2 && Ii.src2 === Ij.dest) {
        hazards.push({
          from: Ij.id,
          to: Ii.id,
          register: Ij.dest
        });
      } else if (Ii.base && Ii.base === Ij.dest) {
        hazards.push({
          from: Ij.id,
          to: Ii.id,
          register: Ij.dest
        });
      }
    }
  }

  return hazards;
}

export interface PipelineExecutionRow {
  instructionId: string;
  cells: string[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Forwarding helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if this instruction type produces its result after the EX stage.
 * LW produces at MEM; everything else (ADD, SUB) produces at EX.
 */
function producesAtMEM(type: InstructionType): boolean {
  return type === "LW";
}

/**
 * Returns true if the consumer instruction needs its source data by the EX stage.
 * SW needs data by MEM (for the value being stored), not EX.
 * ADD/SUB/LW need sources at EX.
 *
 * Note: for the base-address register of LW/SW we always need it at EX
 * (address calculation). Only the *data* register of SW is needed at MEM.
 * We pass isDataReg=true only for SW's src1 (the value to store).
 */
function neededAtMEM(consumerType: InstructionType, isDataReg: boolean): boolean {
  return consumerType === "SW" && isDataReg;
}

/**
 * Compute the minimum number of stalls required for one dependency edge
 * (producer instruction producing `producerType`,  consumer instruction of
 * `consumerType`) given the current scheduling state.
 *
 * @param producerType  - type of the producing instruction
 * @param consumerType  - type of the consuming instruction
 * @param isDataReg     - true when the consumed register is the SW data register
 *                        (src1), not a base-address register
 * @param exCycleOfProducer - the 0-based cycle index in which producer reaches EX
 * @param exCycleOfConsumer - the 0-based cycle index in which consumer would
 *                            reach EX if zero stalls are added
 * @param forwarding    - whether data forwarding is enabled
 * @param stages        - pipeline stage array (needed to find MEM offset from EX)
 */
function computeStallsNeeded(
  producerType: InstructionType,
  consumerType: InstructionType,
  isDataReg: boolean,
  exCycleOfProducer: number,
  exCycleOfConsumer: number,
  forwarding: boolean,
  stages: string[]
): number {
  // With forwarding disabled the consumer can only start EX once the producer
  // has completed WB (same-cycle WB→ID assumption means WB cycle == ready cycle).
  // WB is the last stage; its 0-based offset from EX = stages.length − 1 − 2 = stages.length − 3
  // (stages[0]=IF, stages[1]=ID, stages[2]=EX, …)
  const stagesAfterEX = stages.length - 3; // number of stages after EX (MEM, WB etc.)
  const wbOffsetFromEX = stagesAfterEX;    // cycles after EX that WB occurs

  // Cycle at which producer completes WB (same-cycle assumption: available same cycle)
  const producerWBCycle = exCycleOfProducer + wbOffsetFromEX;

  if (!forwarding) {
    // No forwarding: consumer's EX must be >= producerWBCycle
    const stallsNeeded = producerWBCycle - exCycleOfConsumer;
    return Math.max(0, stallsNeeded);
  }

  // ── Forwarding enabled ─────────────────────────────────────────────────────

  // Determine when the producer's result is *available* for forwarding.
  // ADD/SUB → result is ready at the *end* of EX  → forwardable *into* EX of consumer
  // LW      → result is ready at the *end* of MEM → forwardable *into* EX (or MEM) of consumer
  const memOffsetFromEX = 1; // MEM is 1 cycle after EX (in both 4- and 5-stage)
  const producerForwardReadyCycle = producesAtMEM(producerType)
    ? exCycleOfProducer + memOffsetFromEX  // LW: result ready after MEM
    : exCycleOfProducer;                   // ALU: result ready after EX (end-of-cycle)

  // Determine which cycle the consumer *needs* the data.
  const consumerNeedsAtMEM = neededAtMEM(consumerType, isDataReg);
  const consumerNeedsCycle = consumerNeedsAtMEM
    ? exCycleOfConsumer + memOffsetFromEX  // SW data reg: needed at MEM
    : exCycleOfConsumer;                   // all others: needed at EX

  // Stalls = how many cycles we must push the consumer so that
  //          producerForwardReadyCycle <= consumerNeedsCycle
  const stallsNeeded = producerForwardReadyCycle - consumerNeedsCycle;
  return Math.max(0, stallsNeeded);
}

// ──────────────────────────────────────────────────────────────────────────────
// Main pipeline generator
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Generates a cycle-by-cycle execution table for the given instructions.
 *
 * When forwardingEnabled=false → stall until WB (conservative).
 * When forwardingEnabled=true  → apply forwarding rules to minimise stalls:
 *   Case A  ALU → ALU : 0 stalls  (EX→EX forward)
 *   Case B  LW  → ALU : 1 stall   (MEM→EX forward, load-use hazard)
 *   Case C  ALU → SW  : 0 stalls  (EX→MEM forward for data reg)
 *   Case D  LW  → SW  : 0 stalls  (MEM→MEM forward; timing works out)
 */
export function generatePipeline(
  parsedInstructions: ParsedInstruction[],
  pipelineType: "4-stage" | "5-stage",
  hazards: Hazard[],
  forwardingEnabled: boolean = false
): PipelineExecutionRow[] {
  const stages = pipelineType === "5-stage"
    ? ["IF", "ID", "EX", "MEM", "WB"]
    : ["IF", "ID", "EX", "MEM/WB"];

  const executionTable: PipelineExecutionRow[] = [];

  // Track per-register: the EX cycle of the instruction that last wrote it,
  // plus the type of that instruction (so we know ALU vs LW for forwarding).
  interface RegInfo {
    exCycle: number;      // 0-based cycle when producer started EX
    wbCycle: number;      // 0-based cycle when producer completed WB
    type: InstructionType;
  }
  const registerInfo: Record<string, RegInfo> = {};

  for (let i = 0; i < parsedInstructions.length; i++) {
    const inst = parsedInstructions[i];
    const cells: string[] = [];

    // Instruction i's IF starts at cycle i (0-based)
    const ifCycle = i;

    // Pad empty columns before IF
    for (let c = 0; c < ifCycle; c++) cells.push("");

    // IF Stage (cycle: ifCycle)
    cells.push("IF");

    // ID normally follows IF
    let idCycle = ifCycle + 1;

    // EX would normally follow ID with no stalls
    let exCycle = idCycle + 1;

    // ── Compute total stalls for this instruction ────────────────────────────
    // Gather all RAW hazards that affect this instruction and find the maximum
    // number of stalls forced by any single dependency.
    const instHazards = hazards.filter(h => h.to === inst.id);
    let maxStalls = 0;

    for (const hazard of instHazards) {
      const info = registerInfo[hazard.register];
      if (!info) continue; // producer not yet scheduled (shouldn't happen)

      // Is this register SW's *data* operand (src1) rather than a base address?
      // SW uses: src1 = data register to store, base = address register.
      const isDataReg =
        inst.type === "SW" && inst.src1 === hazard.register;

      const stalls = computeStallsNeeded(
        info.type,
        inst.type,
        isDataReg,
        info.exCycle,
        exCycle,        // consumer EX with zero extra stalls
        forwardingEnabled,
        stages
      );

      maxStalls = Math.max(maxStalls, stalls);
    }

    // ── Build cell array ─────────────────────────────────────────────────────
    // ID is written first, then stalls, then EX and beyond.
    cells.push("ID");

    for (let s = 0; s < maxStalls; s++) cells.push("STALL");

    // Actual EX cycle after stalls
    exCycle = idCycle + 1 + maxStalls;
    let currentCycle = exCycle;

    // EX + remaining stages
    for (let s = 2; s < stages.length; s++) {
      cells.push(stages[s]);

      // When the instruction writes its destination, record info for forwarding
      if (stages[s] === "WB" || stages[s] === "MEM/WB") {
        if (inst.dest && inst.dest.trim() !== "") {
          registerInfo[inst.dest] = {
            exCycle,
            wbCycle: currentCycle,
            type: inst.type,
          };
        }
      }

      currentCycle++;
    }

    executionTable.push({ instructionId: inst.id, cells });
  }

  return executionTable;
}
