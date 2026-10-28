import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Eye, 
  Activity, 
  Settings, 
  ChevronRight,
  Cpu,
  Stethoscope,
  BrainCircuit
} from 'lucide-react';
import SettingsModal from './SettingsModal';

const LungsIcon = ({ className = "w-4 h-4" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 4v7" />
    <path d="M12 8l-2.5 2.5" />
    <path d="M12 8l2.5 2.5" />
    <path d="M9.5 10.5C7.2 10.5 5 12.3 5 15.5c0 2.8 2 4.5 4.2 4.5 1.6 0 2.8-.8 3.8-2.2" />
    <path d="M14.5 10.5c2.3 0 4.5 1.8 4.5 5 0 2.8-2 4.5-4.2 4.5-1.6 0-2.8-.8-3.8-2.2" />
  </svg>
);

const Sidebar = () => {
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  
  const links = [
    { 
      name: "Records Dashboard", 
      path: "/", 
      icon: FileText
    },
    { 
      name: "AI Symptom Checker", 
      path: "/symptoms", 
      icon: BrainCircuit
    },
    { 
      name: "Eye Scan (TF)", 
      path: "/eye-tf", 
      icon: Eye
    },
    { 
      name: "DR Scan (PyTorch)", 
      path: "/eye-dr", 
      icon: Activity
    },
    { 
      name: "Chest X-Ray (ONNX)", 
      path: "/cxr", 
      icon: LungsIcon
    },
  ];

  return (
    <>
      <aside className="w-72 bg-[#070e1b] min-h-screen p-5 flex flex-col border-r border-[#152338] select-none no-print">
        {/* Brand Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl border border-cyan-400/50 bg-[#0b1b2d] flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.2)]">
              <Stethoscope className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  MedDiag <span className="text-cyan-400">2.0</span>
                </h1>
              </div>
              <div className="text-[9px] text-[#38bdf8] font-bold uppercase tracking-widest mt-0.5">
                Clinical AI Suite
              </div>
            </div>
          </div>
          <div className="mt-2.5 ml-14">
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-900/60 bg-cyan-950/40 text-cyan-400 uppercase tracking-wider">
              DEMO
            </span>
          </div>
        </div>
        
        {/* Navigation Section */}
        <div className="text-[10px] font-bold text-[#52799c] uppercase tracking-wider px-2 mb-3">
          Diagnostic Modules
        </div>
        <nav className="space-y-1.5 flex-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150 group ${
                  isActive 
                    ? "bg-[#0e273c] border border-cyan-500/70 text-cyan-400 font-semibold shadow-[0_0_14px_rgba(0,229,255,0.12)]" 
                    : "text-slate-300 hover:bg-[#0d1a2c] hover:text-white border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="text-sm tracking-tight">{link.name}</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-cyan-400 translate-x-0.5' : 'text-slate-500 group-hover:text-slate-300'}`} />
              </Link>
            );
          })}
        </nav>
        
        {/* System Telemetry & Architecture Box */}
        <div className="mt-auto space-y-3 pt-4">
          <div className="p-3.5 rounded-xl bg-[#0a1526] border border-[#162842] text-xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> AI Architecture
              </span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#052e16] text-[#22c55e] border border-[#15803d]">
                ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-[#718da8] space-y-1.5">
              <div className="flex justify-between items-center">
                <span>TF SavedModel</span>
                <span className="text-white font-mono text-[11px]">4-Class Eye</span>
              </div>
              <div className="flex justify-between items-center">
                <span>PyTorch Lightning</span>
                <span className="text-white font-mono text-[11px]">DR Grade 0-4</span>
              </div>
              <div className="flex justify-between items-center">
                <span>ONNX Runtime</span>
                <span className="text-white font-mono text-[11px]">5-Finding CXR</span>
              </div>
            </div>
          </div>

          {/* Settings Trigger */}
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-transparent hover:border-[#162842] hover:bg-[#0c1726] text-xs text-slate-400 hover:text-white transition-all"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="font-medium">System Settings</span>
          </button>
        </div>
      </aside>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
};

export default Sidebar;
