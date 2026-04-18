"use client";

import { useState } from "react";
import { Play, StepForward, RotateCcw, Plus, Calculator, Server } from "lucide-react";
import { RawInstruction, Hazard, PipelineExecutionRow, InstructionType, parseInstructions, detectRAW, generatePipeline } from "@/lib/hazardDetection";

export default function PipelineDeck() {
  const [numInstructionsInput, setNumInstructionsInput] = useState<string>("5");
  const [instructions, setInstructions] = useState<RawInstruction[]>([]);
  const [pipelineType, setPipelineType] = useState<"4-stage" | "5-stage">("5-stage");
  const [forwardingEnabled, setForwardingEnabled] = useState<boolean>(true);
  const [hazards, setHazards] = useState<Hazard[] | null>(null);
  const [pipelineData, setPipelineData] = useState<PipelineExecutionRow[] | null>(null);

  const generateInstructions = () => {
    const num = parseInt(numInstructionsInput);
    if (!isNaN(num) && num >= 1 && num <= 10) {
      const newInstructions: RawInstruction[] = Array.from({ length: num }).map((_, i) => ({
        id: i + 1,
        type: "ADD",
        rd: "",
        rs1: "",
        rs2: "",
        offset: "0",
      }));
      setInstructions(newInstructions);
    } else {
      alert("Please enter a number between 1 and 10.");
    }
  };

  const updateInstruction = (id: number, field: keyof RawInstruction, value: string) => {
    setInstructions(instructions.map(inst => inst.id === id ? { ...inst, [field]: value } : inst));
  };

  const handleRunSimulation = () => {
    const parsed = parseInstructions(instructions);
    const detectedHazards = detectRAW(parsed);
    setHazards(detectedHazards);
    
    const executionData = generatePipeline(parsed, pipelineType, detectedHazards, forwardingEnabled);
    setPipelineData(executionData);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Plaksha Orbital Pipeline Deck</h1>
          <p className="text-slate-500 font-medium">Pipeline Hazard Simulator</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Input state and configs */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Instruction Setup */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-800">
                <Calculator className="w-5 h-5 text-blue-500" />
                Setup
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Number of Instructions</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={numInstructionsInput}
                    onChange={(e) => setNumInstructionsInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                    placeholder="1-10"
                  />
                </div>
                <button 
                  onClick={generateInstructions}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Generate
                </button>
              </div>
            </section>

            {/* Pipeline Configuration */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-800">
                <Server className="w-5 h-5 text-blue-500" />
                Configuration
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Architecture</label>
                  <select 
                    value={pipelineType}
                    onChange={(e) => setPipelineType(e.target.value as "4-stage" | "5-stage")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                  >
                    <option value="4-stage">4-stage (IF, ID, EX, MEM/WB)</option>
                    <option value="5-stage">5-stage (IF, ID, EX, MEM, WB)</option>
                  </select>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={forwardingEnabled}
                      onChange={(e) => setForwardingEnabled(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                  <span className="text-sm font-medium text-slate-700 select-none">Enable Forwarding</span>
                </label>

                <div className="pt-2 grid grid-cols-2 gap-2">
                  <button onClick={handleRunSimulation} className="col-span-2 bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm shadow-sm">
                    <Play className="w-4 h-4" /> Run Simulation
                  </button>
                  <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm shadow-sm">
                    <StepForward className="w-4 h-4" /> Step
                  </button>
                  <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm shadow-sm">
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Instructions and Output */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Instruction Input Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-[350px]">
              <h2 className="text-lg font-semibold mb-4 text-slate-800 shrink-0">Instruction Sequence</h2>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-2 max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200">
                {instructions.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <p className="text-slate-400 text-sm font-medium">Generate instructions to begin setup</p>
                  </div>
                ) : (
                  instructions.map((inst) => (
                    <div key={inst.id} className="flex gap-3 items-center p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <span className="font-semibold text-slate-500 w-6 text-sm shrink-0">I{inst.id}</span>
                      
                      <select 
                        value={inst.type}
                        onChange={(e) => updateInstruction(inst.id, 'type', e.target.value)}
                        className="px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white w-24 shrink-0 font-medium text-slate-700"
                      >
                        <option value="ADD">ADD</option>
                        <option value="SUB">SUB</option>
                        <option value="LW">LW</option>
                        <option value="SW">SW</option>
                      </select>

                      <div className="flex-1 flex gap-2">
                        {['ADD', 'SUB'].includes(inst.type) ? (
                          <>
                            <input type="text" placeholder="Dest (R1)" value={inst.rd} onChange={(e) => updateInstruction(inst.id, 'rd', e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white uppercase font-mono" />
                            <input type="text" placeholder="Src1 (R2)" value={inst.rs1} onChange={(e) => updateInstruction(inst.id, 'rs1', e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white uppercase font-mono" />
                            <input type="text" placeholder="Src2 (R3)" value={inst.rs2} onChange={(e) => updateInstruction(inst.id, 'rs2', e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white uppercase font-mono" />
                          </>
                        ) : (
                          <>
                            <input type="text" placeholder={inst.type === 'LW' ? 'Dest (R1)' : 'Src (R1)'} value={inst.rd} onChange={(e) => updateInstruction(inst.id, 'rd', e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white uppercase font-mono" />
                            <div className="flex items-center gap-1 w-full flex-2">
                              <input type="text" placeholder="Off (0)" value={inst.offset} onChange={(e) => updateInstruction(inst.id, 'offset', e.target.value)} className="w-16 px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white font-mono" />
                              <span className="text-slate-400 font-mono">(</span>
                              <input type="text" placeholder="Base (R2)" value={inst.rs1} onChange={(e) => updateInstruction(inst.id, 'rs1', e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white uppercase font-mono" />
                              <span className="text-slate-400 font-mono">)</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Output Placeholders */}
            <div className="grid grid-cols-1 gap-8">

              {/* ── Pipeline Execution Table ─────────────────────────── */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col overflow-hidden">
                <h2 className="text-lg font-semibold mb-1 text-slate-800">Pipeline Execution Table</h2>

                {pipelineData === null ? (
                  <div className="mt-4 flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 py-12">
                    <p className="text-slate-400 text-sm font-medium">Run simulation to view pipeline execution</p>
                  </div>
                ) : (
                  <>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-2 mt-3 mb-4 text-[0.72rem] font-semibold">
                      {[
                        { label: "IF",    bg: "bg-blue-100",   text: "text-blue-700"   },
                        { label: "ID",    bg: "bg-purple-100", text: "text-purple-700" },
                        { label: "EX",    bg: "bg-green-100",  text: "text-green-700"  },
                        { label: "MEM",   bg: "bg-yellow-100", text: "text-yellow-700" },
                        { label: "WB",    bg: "bg-pink-100",   text: "text-pink-700"   },
                        { label: "STALL", bg: "bg-red-100",    text: "text-red-700"    },
                      ].map(({ label, bg, text }) => (
                        <span key={label} className={`${bg} ${text} px-2.5 py-1 rounded-full`}>
                          {label}
                        </span>
                      ))}
                    </div>

                    {/* Table */}
                    <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
                      <table className="border-collapse min-w-max w-full text-[0.78rem]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-semibold">
                            <th className="px-4 py-2.5 border border-slate-200 text-left sticky left-0 bg-slate-100 z-10 min-w-[90px]">
                              Instruction
                            </th>
                            {Array.from({ length: Math.max(...pipelineData.map(r => r.cells.length)) }).map((_, i) => (
                              <th key={i} className="px-3 py-2.5 border border-slate-200 text-center min-w-[54px]">
                                C{i + 1}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pipelineData.map((row, ri) => {
                            const maxLen = Math.max(...pipelineData.map(r => r.cells.length));
                            return (
                              <tr key={ri} className="group hover:brightness-95 transition-all">
                                {/* Instruction label */}
                                <td className="px-4 py-2 border border-slate-200 font-bold text-slate-700 sticky left-0 bg-white z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">
                                  {row.instructionId}
                                </td>

                                {/* Stage cells */}
                                {row.cells.map((cell, ci) => {
                                  const style = (() => {
                                    switch (cell) {
                                      case "IF":      return "bg-blue-50   text-blue-700   border-blue-200";
                                      case "ID":      return "bg-purple-50 text-purple-700 border-purple-200";
                                      case "EX":      return "bg-green-50  text-green-700  border-green-200";
                                      case "MEM":
                                      case "MEM/WB":  return "bg-yellow-50 text-yellow-700 border-yellow-200";
                                      case "WB":      return "bg-pink-50   text-pink-700   border-pink-200";
                                      case "STALL":   return "bg-red-100   text-red-700    border-red-300";
                                      default:        return "bg-slate-50  text-slate-300  border-slate-200";
                                    }
                                  })();
                                  return (
                                    <td key={ci} className={`border px-2 py-2 text-center font-semibold ${style}`}>
                                      {cell || "·"}
                                    </td>
                                  );
                                })}

                                {/* Trailing empty cells to align rows */}
                                {Array.from({ length: maxLen - row.cells.length }).map((_, ei) => (
                                  <td key={`e-${ei}`} className="border border-slate-100 bg-slate-50 px-2 py-2 text-center text-slate-200 font-semibold">·</td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>

              {/* ── Detected Hazards ─────────────────────────────────── */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <h2 className="text-lg font-semibold mb-4 text-slate-800">Detected Hazards</h2>

                {hazards === null ? (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 py-10">
                    <p className="text-slate-400 text-sm font-medium">Run simulation to view pipeline execution</p>
                  </div>
                ) : hazards.length === 0 ? (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-emerald-700 text-sm font-semibold">No hazards detected — clean pipeline!</span>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {hazards.map((hazard, index) => (
                      <li key={index} className="flex items-start gap-3 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl hover:bg-amber-100 transition-colors">
                        <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm text-amber-800">
                          <span className="font-bold">RAW Hazard:</span>{" "}
                          <span className="font-semibold text-amber-900">{hazard.from}</span>
                          {" → "}
                          <span className="font-semibold text-amber-900">{hazard.to}</span>
                          {" on "}
                          <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{hazard.register}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
