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
