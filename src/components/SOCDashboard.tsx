import React, { useState } from 'react';
import { Database, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Search, Filter, FileText, UserCheck, Check, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { VerificationSession } from '../types';

interface SOCDashboardProps {
  auditLogs: VerificationSession[];
  onSelectSession: (session: VerificationSession) => void;
}

export const SOCDashboard: React.FC<SOCDashboardProps> = ({ auditLogs, onSelectSession }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'FLAGGED' | 'REJECTED'>('ALL');
  const [selectedSessionModal, setSelectedSessionModal] = useState<VerificationSession | null>(null);
  const [analystNote, setAnalystNote] = useState('');

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = log.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) || log.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Analytics Chart Data
  const statusCounts = {
    VERIFIED: auditLogs.filter((l) => l.status === 'VERIFIED').length,
    FLAGGED: auditLogs.filter((l) => l.status === 'FLAGGED').length,
    REJECTED: auditLogs.filter((l) => l.status === 'REJECTED').length,
  };

  const chartBarData = [
    { name: 'Verified', count: statusCounts.VERIFIED, fill: '#10b981' },
    { name: 'Flagged', count: statusCounts.FLAGGED, fill: '#f59e0b' },
    { name: 'Rejected', count: statusCounts.REJECTED, fill: '#f43f5e' },
  ];

  const pieData = [
    { name: 'Face Swaps', value: 45, fill: '#a855f7' },
    { name: 'Voice Clones', value: 30, fill: '#ec4899' },
    { name: 'Doc Inpainting', value: 25, fill: '#eab308' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold tracking-wider uppercase font-mono">
            <Database className="w-4 h-4" />
            <span>Security Operations Center (SOC) Audit Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Real-Time Audit Log & Compliance Stream
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoring active identity onboarding sessions, risk alerts, and regulatory audit trails.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block font-mono">Total Audited</span>
            <span className="text-xl font-extrabold text-white font-mono">{auditLogs.length}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block font-mono">Intercept Rate</span>
            <span className="text-xl font-extrabold text-emerald-400 font-mono">99.4%</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Verification Decisions Distribution
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartBarData}>
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Threat Vectors Intercepted
          </h3>
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search candidate or session ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">Status:</span>
          {(['ALL', 'VERIFIED', 'FLAGGED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === st ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                <th className="p-3">Session ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Candidate</th>
                <th className="p-3">Sector</th>
                <th className="p-3">Status</th>
                <th className="p-3">Confidence</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono font-bold text-cyan-400">{log.id}</td>
                  <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="p-3 font-bold text-white">{log.candidateName}</td>
                  <td className="p-3 uppercase font-mono text-[11px] text-slate-400">{log.sector}</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                        log.status === 'VERIFIED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : log.status === 'FLAGGED'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold">{log.overallConfidence}%</td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => onSelectSession(log)}
                      className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded font-medium"
                    >
                      Inspect XAI
                    </button>
                    <button
                      onClick={() => setSelectedSessionModal(log)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Human Analyst Override Modal */}
      {selectedSessionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-mono">
                Human-in-the-Loop Analyst Review: {selectedSessionModal.id}
              </h3>
              <button
                onClick={() => setSelectedSessionModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Candidate:</span>
                  <span className="font-bold text-white">{selectedSessionModal.candidateName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Current Status:</span>
                  <span className="font-bold text-cyan-400 font-mono">{selectedSessionModal.status}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold block">AI Rationale:</span>
                <p className="text-slate-300 leading-snug">{selectedSessionModal.summaryReasoning}</p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Analyst Compliance Note:</label>
                <textarea
                  rows={2}
                  value={analystNote}
                  onChange={(e) => setAnalystNote(e.target.value)}
                  placeholder="Enter analyst override rationale or secondary document check memo..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  selectedSessionModal.status = 'VERIFIED';
                  setSelectedSessionModal(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>Approve & Override Verified</span>
              </button>
              <button
                onClick={() => {
                  selectedSessionModal.status = 'REJECTED';
                  setSelectedSessionModal(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Confirm Fraud Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
