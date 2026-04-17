"use client";

import { useState } from "react";
import { Play, StepForward, RotateCcw, Plus, Calculator, Server } from "lucide-react";
import { RawInstruction, Hazard, InstructionType, parseInstructions, detectRAW } from "@/lib/hazardDetection";

export default function PipelineDeck() {
  const [numInstructionsInput, setNumInstructionsInput] = useState<string>("5");
  const [instructions, setInstructions] = useState<RawInstruction[]>([]);
  const [pipelineType, setPipelineType] = useState<"4-stage" | "5-stage">("5-stage");
  const [forwardingEnabled, setForwardingEnabled] = useState<boolean>(true);
  const [hazards, setHazards] = useState<Hazard[] | null>(null);

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
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[250px] flex flex-col">
                <h2 className="text-lg font-semibold mb-4 text-slate-800">Pipeline Execution Table</h2>
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-slate-400 text-sm font-medium">Simulation output will appear here</p>
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[200px] flex flex-col">
                <h2 className="text-lg font-semibold mb-4 text-slate-800">Detected Hazards</h2>
                <div className="flex-1 flex flex-col border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-4 overflow-y-auto max-h-[200px] scrollbar-thin scrollbar-thumb-slate-200">
                  {hazards === null ? (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-slate-400 text-sm font-medium">Simulation output will appear here</p>
                    </div>
                  ) : hazards.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-emerald-600 text-sm font-medium flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        No hazards detected
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {hazards.map((hazard, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm font-medium text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          RAW Hazard: {hazard.from} → {hazard.to} on {hazard.register}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
