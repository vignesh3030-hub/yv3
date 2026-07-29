import React from 'react';
import { ShieldAlert, Play, ArrowRight, Skull, Cpu, Mic, FileText, CheckCircle2 } from 'lucide-react';
import { SAMPLE_SCENARIOS } from '../utils/mockData';
import { VerificationSession } from '../types';

interface AttackSimulatorProps {
  onSelectScenario: (session: VerificationSession) => void;
}

export const AttackSimulator: React.FC<AttackSimulatorProps> = ({ onSelectScenario }) => {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-2 text-xs text-purple-400 font-semibold tracking-wider uppercase font-mono">
          <ShieldAlert className="w-4 h-4" />
          <span>Synthetic Identity & Deepfake Attack Suite</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-1">
          Penetration Testing & Resilience Simulator
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Test yv3's multimodal defense engine against modern generative AI threats including live face swaps, voice clones, and synthetic document inpainting.
        </p>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SAMPLE_SCENARIOS.map((scenario) => {
          const isSafe = scenario.threatLevel === 'SAFE';
          return (
            <div
              key={scenario.id}
              className={`bg-slate-900 border rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all hover:border-slate-600 ${
                isSafe ? 'border-emerald-500/40' : 'border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {scenario.type === 'deepfake_face' && <Skull className="w-5 h-5 text-purple-400" />}
                    {scenario.type === 'voice_clone' && <Mic className="w-5 h-5 text-rose-400" />}
                    {scenario.type === 'document_forge' && <FileText className="w-5 h-5 text-amber-400" />}
                    {scenario.type === 'authentic_person' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    <span className="font-bold text-white text-base">{scenario.title}</span>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold ${
                      scenario.threatLevel === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : scenario.threatLevel === 'HIGH'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {scenario.threatLevel}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{scenario.description}</p>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-500 block">Attack Vector Technique:</span>
                  <span className="font-mono text-cyan-300 font-medium">{scenario.attackTechnique}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Target Sector: <strong className="text-white uppercase font-mono">{scenario.presetSession.sector}</strong>
                </div>

                <button
                  onClick={() => onSelectScenario(scenario.presetSession)}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Test & Inspect XAI</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
