export type VerificationSector = 'banking' | 'egov' | 'healthcare' | 'telecom' | 'education';

export type VerificationStatus = 'VERIFIED' | 'FLAGGED' | 'REJECTED' | 'PROCESSING' | 'PENDING';

export interface ModalityScore {
  documentScore: number;         // 0-100 (Authenticity of ID)
  faceLivenessScore: number;     // 0-100 (Live human presence)
  deepfakeRiskScore: number;     // 0-100 (Higher = more synthetic/deepfake)
  voiceAuthenticityScore: number; // 0-100 (Human vs cloned voice)
  behavioralScore: number;       // 0-100 (Natural human interaction cadence)
}

export interface XAIFeatureAttribution {
  feature: string;
  modality: 'document' | 'liveness' | 'deepfake' | 'voice' | 'behavior';
  impact: number; // -100 to +100
  description: string;
  status: 'normal' | 'suspicious' | 'anomaly';
}

export interface XAIDecisionNode {
  id: string;
  step: string;
  condition: string;
  result: 'pass' | 'fail' | 'warn';
  confidence: number;
  reasoning: string;
}

export interface DocumentOcrData {
  fullName: string;
  documentType: string;
  documentNumber: string;
  dateOfBirth: string;
  expiryDate: string;
  issuingCountry: string;
  mrzChecksumValid: boolean;
  fontConsistency: string;
  hologramRefractionDetected: boolean;
}

export interface LivenessCheckData {
  headTurnVerified: boolean;
  blinkCount: number;
  microExpressionsDetected: string[];
  rPPGPulseBpm: number | null;
  skinTextureAuthenticity: number;
  spatialArtifactScore: number;
}

export interface VoiceVerificationData {
  passphraseSpoken: string;
  audioDurationSec: number;
  pitchVarianceHz: number;
  syntheticAcousticGlitchDetected: boolean;
  phaseCoherenceScore: number;
}

export interface BehavioralData {
  mouseCurvatureEntropy: number;
  keypressDynamicsMs: number;
  cognitiveResponseDelaySec: number;
  botPatternProbability: number;
}

export interface VerificationSession {
  id: string;
  timestamp: string;
  sector: VerificationSector;
  candidateName: string;
  overallConfidence: number;
  status: VerificationStatus;
  scores: ModalityScore;
  documentData: DocumentOcrData;
  livenessData: LivenessCheckData;
  voiceData: VoiceVerificationData;
  behavioralData: BehavioralData;
  xaiAttributions: XAIFeatureAttribution[];
  decisionNodes: XAIDecisionNode[];
  summaryReasoning: string;
  complianceBadges: string[];
  riskFactors: string[];
  documentImageBase64?: string;
  faceImageBase64?: string;
}

export interface AttackScenario {
  id: string;
  title: string;
  type: 'deepfake_face' | 'voice_clone' | 'document_forge' | 'bot_attack' | 'authentic_person';
  threatLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';
  description: string;
  attackTechnique: string;
  presetSession: VerificationSession;
}
