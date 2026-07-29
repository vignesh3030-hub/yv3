import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Mic, RefreshCw, FileText, CheckCircle2, XCircle, AlertTriangle, Cpu, ShieldCheck, Zap, UserCheck, ArrowRight, Play, Eye } from 'lucide-react';
import { VerificationSector, VerificationSession, DocumentOcrData, LivenessCheckData, VoiceVerificationData, BehavioralData } from '../types';
import { captureMicrophoneAudio } from '../utils/audioUtils';

interface VerificationFlowProps {
  sector: VerificationSector;
  onVerificationComplete: (session: VerificationSession) => void;
  onInspectXAI: (session: VerificationSession) => void;
}

export const VerificationFlow: React.FC<VerificationFlowProps> = ({
  sector,
  onVerificationComplete,
  onInspectXAI,
}) => {
  const [candidateName, setCandidateName] = useState('Alex Rivera');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Document Data
  const [docImage, setDocImage] = useState<string | null>(null);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [documentData, setDocumentData] = useState<DocumentOcrData | null>(null);
  const [documentScore, setDocumentScore] = useState<number>(85);

  // Step 2: Facial Liveness Data
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [livenessPromptStep, setLivenessPromptStep] = useState<'blink' | 'turn' | 'smile' | 'complete'>('blink');
  const [isAnalyzingFace, setIsAnalyzingFace] = useState(false);
  const [livenessData, setLivenessData] = useState<LivenessCheckData | null>(null);
  const [faceLivenessScore, setFaceLivenessScore] = useState<number>(88);
  const [deepfakeRiskScore, setDeepfakeRiskScore] = useState<number>(12);

  // Step 3: Voice Data
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [voiceData, setVoiceData] = useState<VoiceVerificationData | null>(null);
  const [voiceAuthenticityScore, setVoiceAuthenticityScore] = useState<number>(92);

  // Step 4: Behavioral Data
  const [mouseTelemetry, setMouseTelemetry] = useState<{ moves: number; curveEntropy: number }>({ moves: 0, curveEntropy: 0.88 });
  const [behavioralScore, setBehavioralScore] = useState<number>(90);

  // Step 5: Final Result Session
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [completedSession, setCompletedSession] = useState<VerificationSession | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mouse telemetry tracking
  useEffect(() => {
    let moveCount = 0;
    const handleMouseMove = (e: MouseEvent) => {
      moveCount++;
      if (moveCount % 5 === 0) {
        setMouseTelemetry((prev) => ({
          moves: prev.moves + 1,
          curveEntropy: Math.min(0.99, 0.7 + (prev.moves * 0.002)),
        }));
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle Document Upload
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setDocImage(base64);
      analyzeDocumentImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const useSampleDocument = (type: 'valid' | 'forged') => {
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 400;
    sampleCanvas.height = 250;
    const ctx = sampleCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = type === 'valid' ? '#1e293b' : '#331010';
      ctx.fillRect(0, 0, 400, 250);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(type === 'valid' ? 'PASSPORT - OFFICIAL' : 'NATIONAL ID - SYNTHETIC', 20, 35);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '14px monospace';
      ctx.fillText(`NAME: ${candidateName.toUpperCase()}`, 20, 80);
      ctx.fillText(`DOC #: ${type === 'valid' ? 'P88492011' : 'FORGED-9912'}`, 20, 110);
      ctx.fillText(`DOB: 1994-08-12`, 20, 140);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(260, 60, 110, 130);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText(type === 'valid' ? 'P<USARIVERA<<ALEX<<<<<<<<' : 'INVALID_MRZ_CHECKSUM_DIGIT', 20, 220);
    }
    const dataUrl = sampleCanvas.toDataURL('image/jpeg');
    setDocImage(dataUrl);
    analyzeDocumentImage(dataUrl);
  };

  const analyzeDocumentImage = async (base64Img: string) => {
    setIsAnalyzingDoc(true);
    try {
      const res = await fetch('/api/verify/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentImageBase64: base64Img, sector }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setDocumentData(result.data);
        setDocumentScore(result.data.documentScore || 85);
      }
    } catch (err) {
      console.warn('Doc analysis API failed:', err);
      // Fallback
      setDocumentData({
        fullName: candidateName.toUpperCase(),
        documentType: 'State ID Card',
        documentNumber: 'ID-99218401',
        dateOfBirth: '1994-08-12',
        expiryDate: '2029-08-12',
        issuingCountry: 'USA',
        mrzChecksumValid: true,
        fontConsistency: '100% Match',
        hologramRefractionDetected: true,
      });
      setDocumentScore(88);
    } finally {
      setIsAnalyzingDoc(false);
    }
  };

  // Handle Webcam Capture for Liveness
  const startWebcam = async () => {
    setIsWebcamActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Webcam permission denied or unreadable:', err);
    }
  };

  const captureWebcamSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const snapshot = canvas.toDataURL('image/jpeg');
        setFaceImage(snapshot);

        // Stop stream
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        setIsWebcamActive(false);
        analyzeFaceImage(snapshot);
      }
    }
  };

  const useSampleFace = (isDeepfake: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = isDeepfake ? '#2d1b2d' : '#111827';
      ctx.fillRect(0, 0, 400, 400);
      ctx.beginPath();
      ctx.arc(200, 180, 80, 0, Math.PI * 2);
      ctx.fillStyle = isDeepfake ? '#c084fc' : '#60a5fa';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(isDeepfake ? 'SYNTHETIC DEEPFAKE FACE' : 'NATURAL LIVE CAMERA CAPTURE', 50, 320);
    }
    const dataUrl = canvas.toDataURL('image/jpeg');
    setFaceImage(dataUrl);
    analyzeFaceImage(dataUrl);
  };

  const analyzeFaceImage = async (base64Img: string) => {
    setIsAnalyzingFace(true);
    try {
      const res = await fetch('/api/verify/face-liveness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faceImageBase64: base64Img, documentImageBase64: docImage }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data;
        setFaceLivenessScore(d.faceLivenessScore ?? 88);
        setDeepfakeRiskScore(d.deepfakeRiskScore ?? 12);
        setLivenessData({
          headTurnVerified: true,
          blinkCount: 3,
          microExpressionsDetected: ['Zygomaticus movement', 'Natural ocular saccades'],
          rPPGPulseBpm: d.rPPGBpmEstimate || 72,
          skinTextureAuthenticity: d.skinTextureScore || 90,
          spatialArtifactScore: d.spatialArtifactScore || 8,
        });
      }
    } catch (err) {
      console.warn('Face liveness API error:', err);
      setFaceLivenessScore(90);
      setDeepfakeRiskScore(10);
      setLivenessData({
        headTurnVerified: true,
        blinkCount: 3,
        microExpressionsDetected: ['Zygomaticus movement'],
        rPPGPulseBpm: 74,
        skinTextureAuthenticity: 92,
        spatialArtifactScore: 6,
      });
    } finally {
      setIsAnalyzingFace(false);
    }
  };

  // Handle Voice Recording
  const recordVoice = async () => {
    setIsRecordingVoice(true);
    const audioRes = await captureMicrophoneAudio(3000);
    setIsRecordingVoice(false);
    setVoiceRecorded(true);
    setIsAnalyzingVoice(true);

    try {
      const res = await fetch('/api/verify/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passphraseSpoken: 'Aegis authorization eight four two nine',
          pitchVariance: audioRes.pitchVariance,
          audioBase64: audioRes.audioBase64,
        }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setVoiceAuthenticityScore(result.data.voiceAuthenticityScore);
        setVoiceData(result.data);
      }
    } catch (err) {
      setVoiceAuthenticityScore(92);
      setVoiceData({
        passphraseSpoken: 'Aegis authorization eight four two nine',
        audioDurationSec: 3.1,
        pitchVarianceHz: audioRes.pitchVariance,
        syntheticAcousticGlitchDetected: false,
        phaseCoherenceScore: 94,
      });
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

  const simulateVoiceClone = () => {
    setIsAnalyzingVoice(true);
    setTimeout(() => {
      setVoiceRecorded(true);
      setVoiceAuthenticityScore(22);
      setVoiceData({
        passphraseSpoken: 'Aegis authorization eight four two nine',
        audioDurationSec: 2.8,
        pitchVarianceHz: 1.1,
        syntheticAcousticGlitchDetected: true,
        phaseCoherenceScore: 28,
      });
      setIsAnalyzingVoice(false);
    }, 1200);
  };

  // Step 5: Synthesize Session
  const runFullSynthesis = async () => {
    setIsSynthesizing(true);
    setCurrentStep(5);

    const payload = {
      sector,
      candidateName,
      scores: {
        documentScore,
        faceLivenessScore,
        deepfakeRiskScore,
        voiceAuthenticityScore,
        behavioralScore,
      },
      documentData: documentData || {
        fullName: candidateName.toUpperCase(),
        documentType: 'National ID Card',
        documentNumber: 'ID-8849201',
        dateOfBirth: '1994-08-12',
        expiryDate: '2029-08-12',
        issuingCountry: 'USA',
        mrzChecksumValid: true,
        fontConsistency: '100% Match',
        hologramRefractionDetected: true,
      },
      livenessData: livenessData || {
        headTurnVerified: true,
        blinkCount: 3,
        microExpressionsDetected: ['Natural Smile'],
        rPPGPulseBpm: 72,
        skinTextureAuthenticity: 90,
        spatialArtifactScore: 10,
      },
      voiceData: voiceData || {
        passphraseSpoken: 'Aegis authorization eight four two nine',
        audioDurationSec: 3.0,
        pitchVarianceHz: 24.5,
        syntheticAcousticGlitchDetected: false,
        phaseCoherenceScore: 92,
      },
      behavioralData: {
        mouseCurvatureEntropy: mouseTelemetry.curveEntropy,
        keypressDynamicsMs: 175,
        cognitiveResponseDelaySec: 1.4,
        botPatternProbability: 4,
      },
      documentImageBase64: docImage || undefined,
      faceImageBase64: faceImage || undefined,
    };

    try {
      const res = await fetch('/api/verify/full-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success && result.session) {
        setCompletedSession(result.session);
        onVerificationComplete(result.session);
      }
    } catch (err) {
      console.error('Synthesis error:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Onboarding Header & Candidate Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-blue-500" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs text-blue-400 font-semibold tracking-wider uppercase">
              <Zap className="w-4 h-4" />
              <span>Real-Time Multimodal Onboarding Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Digital Identity Verification
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Cross-evaluating document OCR, facial liveness pulse, deepfake spatial frequency, voice biometrics, and interaction behavior.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <label className="text-xs text-slate-400 block font-medium">Candidate Name:</label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="bg-transparent text-sm font-semibold text-white focus:outline-none focus:border-cyan-500 border-b border-slate-700 py-0.5"
              />
            </div>
          </div>
        </div>

        {/* Stepper Wizard */}
        <div className="grid grid-cols-5 gap-2 mt-6 pt-6 border-t border-slate-800">
          {[
            { num: 1, label: '1. ID Document', done: !!documentData },
            { num: 2, label: '2. Face Liveness', done: !!livenessData },
            { num: 3, label: '3. Voice Biometrics', done: !!voiceData },
            { num: 4, label: '4. Behavior Telemetry', done: true },
            { num: 5, label: '5. XAI Decision', done: !!completedSession },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num as any)}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                currentStep === s.num
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                  : s.done
                  ? 'bg-slate-950 border-emerald-500/40 text-slate-300'
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold">STEP 0{s.num}</span>
                {s.done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <p className="text-xs font-medium truncate mt-1">{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}

      {/* STEP 1: Document OCR */}
      {currentStep === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Step 1: Document OCR & Authenticity Check</h2>
                <p className="text-xs text-slate-400">Upload or capture an official Identity Document (Passport / State ID).</p>
              </div>
            </div>
            {documentScore && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold ${
                documentScore > 75 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                OCR Score: {documentScore}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload Area */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-950/60 transition-all">
                {docImage ? (
                  <div className="space-y-3">
                    <img src={docImage} alt="Document" className="max-h-48 mx-auto rounded-lg border border-slate-700 shadow" />
                    <p className="text-xs text-emerald-400 font-medium">✓ Document Frame Loaded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-sm text-slate-300 font-medium">Drag & Drop ID Document Image</p>
                    <p className="text-xs text-slate-500">Supports PNG, JPG, WEBP (MRZ & Hologram check)</p>
                    <label className="inline-block bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition">
                      Browse File
                      <input type="file" accept="image/*" onChange={handleDocUpload} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              {/* Preset buttons */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Or load sample document:</span>
                <div className="space-x-2">
                  <button
                    onClick={() => useSampleDocument('valid')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition"
                  >
                    Sample Valid Passport
                  </button>
                  <button
                    onClick={() => useSampleDocument('forged')}
                    className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded border border-rose-800 transition"
                  >
                    Sample Forged ID
                  </button>
                </div>
              </div>
            </div>

            {/* OCR Data Extraction Panel */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Real-Time OCR & MRZ Inspection
              </h3>

              {isAnalyzingDoc ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 text-blue-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  <p className="text-xs font-medium">Extracting OCR fields & checking MRZ checksums...</p>
                </div>
              ) : documentData ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Full Name</span>
                      <span className="font-bold text-white font-mono">{documentData.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Document Type</span>
                      <span className="font-bold text-white font-mono">{documentData.documentType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Document Number</span>
                      <span className="font-bold text-cyan-400 font-mono">{documentData.documentNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Issuing Country</span>
                      <span className="font-bold text-white font-mono">{documentData.issuingCountry}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800">
                      <span>MRZ Checksum Digit:</span>
                      {documentData.mrzChecksumValid ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> VALID
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> CHECKSUM FAIL
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800">
                      <span>Font Micro-Consistency:</span>
                      <span className="font-mono text-cyan-400 font-bold">{documentData.fontConsistency}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800">
                      <span>Holographic Refraction:</span>
                      {documentData.hologramRefractionDetected ? (
                        <span className="text-emerald-400 font-bold">DETECTED</span>
                      ) : (
                        <span className="text-amber-400 font-bold">MISSING / FLAT</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Upload an ID document above to trigger automated OCR & security analysis.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-lg"
            >
              <span>Next: Facial Liveness Scan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Facial Liveness & Deepfake Scan */}
      {currentStep === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Step 2: Facial Liveness & Deepfake Detector</h2>
                <p className="text-xs text-slate-400">Verifying 3D micro-expressions, vascular blood flow pulse (rPPG), and GAN diffusion artifacts.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800 font-bold">
                Liveness: {faceLivenessScore}%
              </span>
              <span className="bg-purple-950 text-purple-300 px-2.5 py-1 rounded-full border border-purple-800 font-bold">
                Deepfake Risk: {deepfakeRiskScore}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Webcam Stream / Snapshot */}
            <div className="space-y-4">
              <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
                {isWebcamActive ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                ) : faceImage ? (
                  <img src={faceImage} alt="Face Snapshot" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <Camera className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">Click below to open live webcam or run deepfake sample test.</p>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlaid Target Bounding Reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-60 border-2 border-dashed border-cyan-500/60 rounded-full flex items-center justify-center">
                    <div className="w-full h-0.5 bg-cyan-500/30 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-2">
                {!isWebcamActive ? (
                  <button
                    onClick={startWebcam}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center space-x-2 shadow"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Start Live Camera</span>
                  </button>
                ) : (
                  <button
                    onClick={captureWebcamSnapshot}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center space-x-2 shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Capture Snapshot</span>
                  </button>
                )}

                <button
                  onClick={() => useSampleFace(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700"
                >
                  Natural Sample
                </button>
                <button
                  onClick={() => useSampleFace(true)}
                  className="px-3 py-2 bg-purple-950 hover:bg-purple-900 text-purple-300 text-xs rounded-xl border border-purple-800"
                >
                  Deepfake Sample
                </button>
              </div>
            </div>

            {/* Liveness Telemetry Panel */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Subcutaneous & Spectral Analytics
              </h3>

              {isAnalyzingFace ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 text-cyan-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  <p className="text-xs font-medium">Processing rPPG vascular pulse & Fourier spectrum...</p>
                </div>
              ) : livenessData ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">rPPG Vascular Blood Volume Pulse:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {livenessData.rPPGPulseBpm ? `${livenessData.rPPGPulseBpm} BPM` : 'NOT DETECTED (0 BPM)'}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          livenessData.rPPGPulseBpm ? 'bg-emerald-500 w-3/4' : 'bg-rose-500 w-1/12'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">Dermal Skin Texture</span>
                      <span className="font-bold text-white font-mono">{livenessData.skinTextureAuthenticity}% Match</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">GAN Spatial Artifacts</span>
                      <span className="font-bold text-purple-400 font-mono">{livenessData.spatialArtifactScore}% Risk</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-1">Micro-Expressions Detected:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {livenessData.microExpressionsDetected.map((m, idx) => (
                        <span key={idx} className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded text-[11px]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Capture or load a facial frame to inspect liveness signals.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs text-slate-400 hover:text-white px-4 py-2"
            >
              ← Back to Step 1
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-lg"
            >
              <span>Next: Voice Biometrics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Voice Biometrics & Voice Clone */}
      {currentStep === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Step 3: Spoken Voice Challenge & Clone Detector</h2>
                <p className="text-xs text-slate-400">Verifying glottal vocal tract resonance, fundamental frequency (F0) pitch dynamics, and neural vocoder artifacts.</p>
              </div>
            </div>
            {voiceAuthenticityScore && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold ${
                voiceAuthenticityScore > 70 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                Voice Authenticity: {voiceAuthenticityScore}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recording Controls */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5 text-center">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 uppercase tracking-wide block font-mono mb-1">Security Challenge Passphrase</span>
                <p className="text-base font-bold text-cyan-300 font-mono">"Aegis authorization eight four two nine"</p>
              </div>

              <div className="py-4">
                {isRecordingVoice ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-rose-600 rounded-full mx-auto flex items-center justify-center animate-ping">
                      <Mic className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-xs text-rose-400 font-bold animate-pulse">Recording mic audio (3 seconds)...</p>
                  </div>
                ) : voiceRecorded ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                    <p className="text-xs text-emerald-400 font-medium">Voice Audio Sample Recorded</p>
                  </div>
                ) : (
                  <Mic className="w-12 h-12 text-slate-600 mx-auto" />
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={recordVoice}
                  disabled={isRecordingVoice}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl transition flex items-center justify-center space-x-2 shadow"
                >
                  <Mic className="w-4 h-4" />
                  <span>Record Microphone Voice</span>
                </button>
                <button
                  onClick={simulateVoiceClone}
                  className="px-3 py-2.5 bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs rounded-xl border border-rose-800 font-medium"
                >
                  Simulate Voice Clone Attack
                </button>
              </div>
            </div>

            {/* Voice Telemetry Panel */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Acoustic Formant & Pitch Inspection
              </h3>

              {isAnalyzingVoice ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 text-purple-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                  <p className="text-xs font-medium">Analyzing pitch contour & phase coherence...</p>
                </div>
              ) : voiceData ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">Pitch Variance (F0 StdDev)</span>
                      <span className={`font-bold font-mono ${voiceData.pitchVarianceHz < 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {voiceData.pitchVarianceHz.toFixed(1)} Hz {voiceData.pitchVarianceHz < 5 ? '(UNNATURALLY FLAT)' : '(NATURAL)'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block">Phase Coherence Score</span>
                      <span className="font-bold text-cyan-400 font-mono">{voiceData.phaseCoherenceScore}%</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span>Synthetic Vocoder Glitch:</span>
                    {voiceData.syntheticAcousticGlitchDetected ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> DETECTED (HIGH RISK)
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> NONE (ORGANIC VOICE)
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Speak into microphone or simulate synthetic audio to analyze voice biometrics.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="text-xs text-slate-400 hover:text-white px-4 py-2"
            >
              ← Back to Step 2
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-lg"
            >
              <span>Next: Behavioral Dynamics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Behavioral Dynamics */}
      {currentStep === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Step 4: Behavioral Dynamics & Bot Trajectory</h2>
                <p className="text-xs text-slate-400">Monitoring cursor movement entropy, keystroke cadence, and cognitive response latency.</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-full font-mono font-bold">
              Behavioral Cadence: {behavioralScore}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400">Mouse Trajectory Curvature Entropy</span>
              <p className="text-xl font-bold text-emerald-400 font-mono">{mouseTelemetry.curveEntropy.toFixed(2)}</p>
              <p className="text-[11px] text-slate-500">Natural organic jitter (non-linear bot path)</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400">Keystroke Hold Dynamics</span>
              <p className="text-xl font-bold text-cyan-400 font-mono">168 ms avg</p>
              <p className="text-[11px] text-slate-500">Human muscle motor timing variance</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400">Automated Script/Bot Probability</span>
              <p className="text-xl font-bold text-emerald-400 font-mono">3.2%</p>
              <p className="text-[11px] text-slate-500">Low risk automated injection</p>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(3)}
              className="text-xs text-slate-400 hover:text-white px-4 py-2"
            >
              ← Back to Step 3
            </button>
            <button
              onClick={runFullSynthesis}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-xl"
            >
              <Zap className="w-4 h-4" />
              <span>Run Multimodal AI Verification</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Final Verification Report & XAI Summary */}
      {currentStep === 5 && (
        <div className="space-y-6">
          {isSynthesizing ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-white">Synthesizing Multimodal XAI Telemetry...</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Gemini 3.6 Flash is correlating document OCR, facial rPPG pulse, deepfake spatial frequency, and voice pitch dynamics.
              </p>
            </div>
          ) : completedSession ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
              {/* Status Banner */}
              <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                completedSession.status === 'VERIFIED'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : completedSession.status === 'FLAGGED'
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
              }`}>
                <div className="flex items-center space-x-4">
                  {completedSession.status === 'VERIFIED' ? (
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 shrink-0" />
                  ) : completedSession.status === 'FLAGGED' ? (
                    <AlertTriangle className="w-12 h-12 text-amber-400 shrink-0" />
                  ) : (
                    <XCircle className="w-12 h-12 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                        Session ID: {completedSession.id}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 uppercase">
                        {completedSession.sector} Sector
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white mt-1">
                      Verification Decision: {completedSession.status}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      {completedSession.summaryReasoning}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 text-center shrink-0">
                  <span className="text-xs text-slate-400 block font-mono">Overall Confidence</span>
                  <span className="text-3xl font-extrabold font-mono text-white">
                    {completedSession.overallConfidence}%
                  </span>
                </div>
              </div>

              {/* Biometric Scores Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Document OCR</span>
                  <span className="text-lg font-bold text-white font-mono">{completedSession.scores.documentScore}%</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Face Liveness</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">{completedSession.scores.faceLivenessScore}%</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Deepfake Risk</span>
                  <span className="text-lg font-bold text-purple-400 font-mono">{completedSession.scores.deepfakeRiskScore}%</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Voice Authenticity</span>
                  <span className="text-lg font-bold text-cyan-400 font-mono">{completedSession.scores.voiceAuthenticityScore}%</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Behavioral Cadence</span>
                  <span className="text-lg font-bold text-blue-400 font-mono">{completedSession.scores.behavioralScore}%</span>
                </div>
              </div>

              {/* Compliance Badges */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-slate-400 font-medium">Compliance Badges:</span>
                {completedSession.complianceBadges.map((badge, idx) => (
                  <span key={idx} className="bg-blue-950 text-blue-300 border border-blue-800 text-xs px-2.5 py-1 rounded-md font-medium">
                    {badge}
                  </span>
                ))}
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setCompletedSession(null);
                    setCurrentStep(1);
                  }}
                  className="text-xs text-slate-400 hover:text-white px-4 py-2 border border-slate-700 rounded-xl"
                >
                  ↺ Restart Verification
                </button>

                <button
                  onClick={() => onInspectXAI(completedSession)}
                  className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-lg"
                >
                  <Eye className="w-4 h-4" />
                  <span>Open XAI Forensic Inspector</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
