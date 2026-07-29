import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { VerificationFlow } from './components/VerificationFlow';
import { XAIInspector } from './components/XAIInspector';
import { AttackSimulator } from './components/AttackSimulator';
import { SOCDashboard } from './components/SOCDashboard';
import { SAMPLE_SCENARIOS } from './utils/mockData';
import { VerificationSector, VerificationSession } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'portal' | 'xai' | 'simulator' | 'soc'>('portal');
  const [sector, setSector] = useState<VerificationSector>('banking');

  // Initial audit logs pre-populated with realistic test cases
  const [auditLogs, setAuditLogs] = useState<VerificationSession[]>(() =>
    SAMPLE_SCENARIOS.map((sc) => sc.presetSession)
  );

  // Active session being inspected in the XAI Forensic tab
  const [inspectSession, setInspectSession] = useState<VerificationSession | null>(
    SAMPLE_SCENARIOS[0].presetSession
  );

  const handleVerificationComplete = (session: VerificationSession) => {
    setAuditLogs((prev) => [session, ...prev]);
    setInspectSession(session);
  };

  const handleInspectXAI = (session: VerificationSession) => {
    setInspectSession(session);
    setActiveTab('xai');
  };

  const handleSelectScenario = (session: VerificationSession) => {
    setInspectSession(session);
    setAuditLogs((prev) => [session, ...prev]);
    setActiveTab('xai');
  };

  const interceptedDeepfakes = auditLogs.filter(
    (l) => l.scores.deepfakeRiskScore > 40 || l.status === 'REJECTED'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sector={sector}
        setSector={setSector}
        totalVerifications={auditLogs.length}
        interceptedDeepfakes={interceptedDeepfakes}
      />

      {/* Main Container View Area */}
      <main className="flex-1 pb-12 pt-4">
        {activeTab === 'portal' && (
          <VerificationFlow
            sector={sector}
            onVerificationComplete={handleVerificationComplete}
            onInspectXAI={handleInspectXAI}
          />
        )}

        {activeTab === 'xai' && (
          <XAIInspector session={inspectSession} />
        )}

        {activeTab === 'simulator' && (
          <AttackSimulator onSelectScenario={handleSelectScenario} />
        )}

        {activeTab === 'soc' && (
          <SOCDashboard
            auditLogs={auditLogs}
            onSelectSession={handleInspectXAI}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 text-xs font-mono text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>yv3 Multimodal Identity & Deepfake Protection Platform</span>
          <span className="text-slate-500">
            Powered by Gemini 3.6 Flash • Subcutaneous rPPG • Fourier Spectral Classifier • XAI
          </span>
        </div>
      </footer>
    </div>
  );
}
