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

/**
 * Generates a cycle-by-cycle execution table for the given instructions.
 * Introduces STALL states for Read-After-Write hazards without forwarding.
 */
export function generatePipeline(
  parsedInstructions: ParsedInstruction[], 
  pipelineType: "4-stage" | "5-stage",
  hazards: Hazard[]
): PipelineExecutionRow[] {
  const stages = pipelineType === "5-stage" 
    ? ["IF", "ID", "EX", "MEM", "WB"] 
    : ["IF", "ID", "EX", "MEM/WB"];
  
  const executionTable: PipelineExecutionRow[] = [];
  
  // Track which cycle a register is written. Maps register name to 0-based cycle index.
  const registerReadyCycle: Record<string, number> = {};

  for (let i = 0; i < parsedInstructions.length; i++) {
    const inst = parsedInstructions[i];
    const cells: string[] = [];
    
    // First inst starts at cycle index 0, subsequent start consecutive
    const startCycle = i;
    
    // Pad empty cycles before instruction start
    for (let c = 0; c < startCycle; c++) {
      cells.push("");
    }
    
    // IF Stage
    cells.push("IF");
    let currentCycle = startCycle + 1; // Expected cycle for ID stage
    
    let requiredReadyCycle = -1;
    
    // Check RAW hazards for strictly this instruction
    const instHazards = hazards.filter(h => h.to === inst.id);
    for (const hazard of instHazards) {
      if (registerReadyCycle[hazard.register] !== undefined) {
        requiredReadyCycle = Math.max(requiredReadyCycle, registerReadyCycle[hazard.register]);
      }
    }
    
    // Insert stalls if resolving in the same cycle (ID in second half, WB in first half)
    while (currentCycle < requiredReadyCycle) {
      cells.push("STALL");
      currentCycle++;
    }
    
    // ID Stage
    cells.push("ID");
    currentCycle++; // Cycle for EX stage
    
    // Execute remaining stages
    for (let s = 2; s < stages.length; s++) { // start at EX
      cells.push(stages[s]);
      
      // Mark register as written and readable at the current cycle
      if (stages[s] === "WB" || stages[s] === "MEM/WB") {
        if (inst.dest && inst.dest.trim() !== "") {
          registerReadyCycle[inst.dest] = currentCycle;
        }
      }
      
      currentCycle++;
    }
    
    executionTable.push({
      instructionId: inst.id,
      cells
    });
  }

  return executionTable;
}
