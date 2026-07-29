import React, { useState } from 'react';
import { Eye, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Layers, FileJson, Download, HelpCircle } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { VerificationSession } from '../types';

interface XAIInspectorProps {
  session: VerificationSession | null;
}

export const XAIInspector: React.FC<XAIInspectorProps> = ({ session }) => {
  const [activeLayer, setActiveLayer] = useState<'rppg' | 'gan_grid' | 'pupil_symmetry' | 'mrz_font'>('rppg');

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 space-y-3">
          <Eye className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-xl font-bold text-white">No Verification Session Loaded</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Please run a verification in the Verification Portal or select an attack scenario from the Attack Simulator to view XAI forensic feature attribution.
          </p>
        </div>
      </div>
    );
  }

  // Format data for Recharts Radar
  const radarData = [
    { dimension: 'Document OCR', score: session.scores.documentScore },
    { dimension: 'Face Liveness', score: session.scores.faceLivenessScore },
    { dimension: 'Deepfake Defense', score: Math.max(0, 100 - session.scores.deepfakeRiskScore) },
    { dimension: 'Voice Authenticity', score: session.scores.voiceAuthenticityScore },
    { dimension: 'Behavioral Cadence', score: session.scores.behavioralScore },
  ];

  const downloadJSONReport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(session, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `yv3_XAI_Report_${session.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Title & Metadata Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-cyan-400 font-semibold tracking-wider uppercase font-mono">
            <Eye className="w-4 h-4" />
            <span>Explainable AI (XAI) Forensic Inspector</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Verification Rationale & Feature Attribution
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspecting SHAP/LIME feature weights, subcutaneous vascular pulse (rPPG), and GAN spectral lattice artifacts for Session{' '}
            <strong className="text-white font-mono">{session.id}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={downloadJSONReport}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition"
          >
            <FileJson className="w-4 h-4 text-cyan-400" />
            <span>Export XAI JSON Report</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow"
          >
            <Download className="w-4 h-4" />
            <span>Print Compliance Summary</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart & Biometric Multi-Vector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between">
            <span>5-Dimension Biometric Radar</span>
            <span className="text-xs text-cyan-400 font-normal">Confidence: {session.overallConfidence}%</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="dimension" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar
                  name="Biometric Score"
                  dataKey="score"
                  stroke="#38bdf8"
                  fill="#0284c7"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
            <span className="text-slate-400 font-bold block">XAI Decision Summary Rationale:</span>
            <p className="text-slate-200 leading-relaxed">{session.summaryReasoning}</p>
          </div>
        </div>

        {/* Feature Attribution (SHAP / LIME style weights) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between">
            <span>Feature Attribution (SHAP / LIME Weights)</span>
            <span className="text-xs text-slate-400 font-normal">Positive vs Negative Evidence</span>
          </h3>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {session.xaiAttributions.map((attr, idx) => {
              const isPositive = attr.impact >= 0;
              return (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {isPositive ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      {attr.feature}
                    </span>
                    <span className={`font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? `+${attr.impact}%` : `${attr.impact}%`}
                    </span>
                  </div>

                  <p className="text-slate-400 text-[11px] leading-snug">{attr.description}</p>

                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, Math.abs(attr.impact))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Forensic Visual Layer Simulator & Anomaly Overlays */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Forensic Neural Feature Overlay Inspector</span>
            </h3>
            <p className="text-xs text-slate-400">Toggle underlying visual feature channels to inspect AI detection heatmaps.</p>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {[
              { id: 'rppg', label: 'rPPG Blood Flow Pulse' },
              { id: 'gan_grid', label: 'GAN Diffusion Grid' },
              { id: 'pupil_symmetry', label: 'Catchlight Optics' },
              { id: 'mrz_font', label: 'MRZ Font Kerning' },
            ].map((layer) => (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  activeLayer === layer.id
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Visual Canvas Simulator */}
          <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden border border-slate-800 flex items-center justify-center">
            {session.faceImageBase64 ? (
              <img src={session.faceImageBase64} alt="Target Face" className="w-full h-full object-cover" />
            ) : (
              <div className="w-32 h-40 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 font-mono text-xs">
                FACE MESH
              </div>
            )}

            {/* Simulated Overlay Highlights */}
            {activeLayer === 'rppg' && (
              <div className="absolute inset-0 bg-rose-500/10 pointer-events-none flex items-center justify-center">
                <div className="border-2 border-rose-500/60 rounded-full w-48 h-56 animate-pulse p-2 text-center text-xs font-mono font-bold text-rose-300">
                  Subcutaneous Capillary Micro-Pulse
                </div>
              </div>
            )}

            {activeLayer === 'gan_grid' && (
              <div className="absolute inset-0 bg-purple-900/20 pointer-events-none grid grid-cols-8 grid-rows-8 gap-1 p-4">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className="border border-purple-500/30 text-[8px] text-purple-400 font-mono">
                    {i % 3 === 0 ? '0.84' : ''}
                  </div>
                ))}
              </div>
            )}

            {activeLayer === 'pupil_symmetry' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center space-x-12">
                <div className="w-6 h-6 border-2 border-cyan-400 rounded-full animate-ping" />
                <div className="w-6 h-6 border-2 border-cyan-400 rounded-full animate-ping" />
              </div>
            )}

            {activeLayer === 'mrz_font' && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-950/90 p-2 border border-emerald-500/60 font-mono text-xs text-emerald-300">
                OCR_KERNING_MATCH: 100% | CHECK_DIGIT: VALID
              </div>
            )}
          </div>

          {/* Description Box */}
          <div className="space-y-3 text-xs">
            {activeLayer === 'rppg' && (
              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">Photoplethysmography (rPPG) Pulse Extraction</h4>
                <p className="text-slate-300 leading-relaxed">
                  Measures tiny periodic changes in skin light absorption caused by arterial blood pulsation. Real human skin exhibits a consistent 60-100 BPM vascular rhythm. Deepfakes or 2D screen replays lack subcutaneous blood volume pulse.
                </p>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-cyan-300">
                  Detected Pulse Rate: {session.livenessData.rPPGPulseBpm ? `${session.livenessData.rPPGPulseBpm} BPM` : '0 BPM (Missing Vascular Signal)'}
                </div>
              </div>
            )}

            {activeLayer === 'gan_grid' && (
              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">High-Frequency Fourier Lattice Classifier</h4>
                <p className="text-slate-300 leading-relaxed">
                  Generative models (Midjourney, Flux, DeepFaceLive) leave high-frequency grid-like artifacts in the spectral frequency domain during image upsampling and face boundary blending.
                </p>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-purple-300">
                  Spatial Artifact Risk: {session.scores.deepfakeRiskScore}% Probability
                </div>
              </div>
            )}

            {activeLayer === 'pupil_symmetry' && (
              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">Catchlight & Optical Reflection Geometry</h4>
                <p className="text-slate-300 leading-relaxed">
                  Analyzes specular light reflections in the left vs right pupil. Synthetic deepfakes often generate asymmetric catchlights or reflections that contradict the surrounding light environment.
                </p>
              </div>
            )}

            {activeLayer === 'mrz_font' && (
              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">Machine Readable Zone (MRZ) & Font Micro-Print</h4>
                <p className="text-slate-300 leading-relaxed">
                  Verifies check digit calculations using 7-3-1 weight modulus algorithms on document number, date of birth, and expiration fields, while checking font aliasing for Photoshop manipulation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decision Tree Pathways */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Sequential XAI Decision Tree Pathway
        </h3>

        <div className="space-y-3 text-xs">
          {session.decisionNodes.map((node, index) => (
            <div key={node.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-slate-900 shrink-0 font-mono font-bold text-slate-400">
                0{index + 1}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{node.step}</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                    node.result === 'pass'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}>
                    {node.result.toUpperCase()} ({node.confidence}%)
                  </span>
                </div>
                <p className="text-slate-400 font-medium">Condition: {node.condition}</p>
                <p className="text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800 mt-1">{node.reasoning}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
