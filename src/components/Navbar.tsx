import React from 'react';
import { ShieldAlert, ShieldCheck, Eye, Cpu, Database, Activity, Landmark, Building2, Stethoscope, PhoneCall, GraduationCap } from 'lucide-react';
import { VerificationSector } from '../types';

interface NavbarProps {
  activeTab: 'portal' | 'xai' | 'simulator' | 'soc';
  setActiveTab: (tab: 'portal' | 'xai' | 'simulator' | 'soc') => void;
  sector: VerificationSector;
  setSector: (sector: VerificationSector) => void;
  totalVerifications: number;
  interceptedDeepfakes: number;
}

const SECTOR_CONFIG: Record<VerificationSector, { name: string; icon: React.ReactNode; badge: string }> = {
  banking: { name: 'Banking & Fintech', icon: <Landmark className="w-4 h-4" />, badge: 'KYC / AML Level 3' },
  egov: { name: 'E-Governance', icon: <Building2 className="w-4 h-4" />, badge: 'eIDAS / Citizen Portal' },
  healthcare: { name: 'Healthcare', icon: <Stethoscope className="w-4 h-4" />, badge: 'HIPAA Identity Verification' },
  telecom: { name: 'Telecom & eSIM', icon: <PhoneCall className="w-4 h-4" />, badge: 'RICA / SIM Activation' },
  education: { name: 'Online Education', icon: <GraduationCap className="w-4 h-4" />, badge: 'Proctoring & Exams' },
};

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  sector,
  setSector,
  totalVerifications,
  interceptedDeepfakes,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl shadow-md flex items-center justify-center text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">yv3</span>
                <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-2 py-0.5 rounded-full font-medium">
                  Multimodal XAI v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Deepfake, Voice Clone & Synthetic Identity Prevention Platform
              </p>
            </div>
          </div>

          {/* Sector Selector */}
          <div className="hidden lg:flex items-center space-x-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400 px-2 font-medium">Sector:</span>
            {(Object.keys(SECTOR_CONFIG) as VerificationSector[]).map((secKey) => {
              const conf = SECTOR_CONFIG[secKey];
              const isSelected = sector === secKey;
              return (
                <button
                  key={secKey}
                  onClick={() => setSector(secKey)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title={conf.badge}
                >
                  {conf.icon}
                  <span>{conf.name}</span>
                </button>
              );
            })}
          </div>

          {/* System Telemetry Badges */}
          <div className="hidden md:flex items-center space-x-4 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Engine: <strong className="text-emerald-400 font-mono">ONLINE</strong></span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Deepfakes Intercepted: <strong className="text-amber-400 font-mono">{interceptedDeepfakes}</strong></span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-1 pb-2">
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('portal')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'portal'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Verification Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('xai')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'xai'
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>XAI Forensic Inspector</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'simulator'
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span>Attack Simulation Suite</span>
            </button>

            <button
              onClick={() => setActiveTab('soc')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'soc'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>SOC Logs & Audit</span>
            </button>
          </nav>

          {/* Sector Badge for mobile */}
          <div className="lg:hidden text-xs bg-blue-900/40 text-blue-300 border border-blue-800 px-2 py-1 rounded">
            {SECTOR_CONFIG[sector].name}
          </div>
        </div>
      </div>
    </header>
  );
};
