import React from 'react';
import { X, Server, Cpu, Database, ShieldCheck, Activity } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0a1322] w-full max-w-lg p-6 relative border border-[#162842] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl border border-cyan-400/50 bg-[#0b1b2d] flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.2)]">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">System Diagnostics & Settings</h3>
            <p className="text-xs text-slate-400 font-medium">MedDiag 2.0 Tri-Framework Clinical Infrastructure</p>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="p-4 rounded-xl bg-[#0c1726] border border-[#162842]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" /> Backend Service
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#052e16] text-[#22c55e] border border-[#15803d]">
                ONLINE (Port 8000)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              FastAPI RESTful Microservice with SQLite / SQLAlchemy persistence and asynchronous inference pipelines.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1726] border border-[#162842]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" /> Multi-Framework AI Stack
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">3 Core Engines</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
              <li><strong className="text-white">TensorFlow:</strong> 4-Class Ophthalmic Screening (Cataract, DR, Glaucoma, Normal)</li>
              <li><strong className="text-white">PyTorch Lightning:</strong> DenseNet-121 DR Grade 0–4 Severity Staging</li>
              <li><strong className="text-white">ONNX Runtime:</strong> 5-Class Pulmonary Radiograph Screening (Consolidation, Cardiomegaly, Effusion, Infiltration, Clear)</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1726] border border-[#162842]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-[#facc15]" /> Pathology Filter Telemetry
              </span>
              <span className="text-[10px] font-mono text-[#22c55e] font-bold">ACTIVE</span>
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              Green-channel CLAHE, morphological top-hat lesion enhancement, and Laplacian variance sharpness checking enabled on every scan.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#450a0a]/50 border border-[#b91c1c]/40 flex items-center gap-2.5 text-xs text-red-300">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-[#f87171]" />
            <span className="text-[11px] leading-relaxed">Clinical Notice: Designed as an AI clinical decision-support screening aid. Professional medical confirmation is mandatory.</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#162842] flex justify-end">
          <button 
            onClick={onClose}
            className="btn-primary text-xs py-2 px-5"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
