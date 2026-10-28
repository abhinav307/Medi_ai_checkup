import React from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const TriageBanner = ({ level = 'routine', actionText, primaryDiagnosis }) => {
  const configs = {
    routine: {
      color: '#22c55e',
      bg: '#04271a',
      border: '#15803d',
      badgeClass: 'badge-routine',
      badgeText: 'ROUTINE',
      title: 'TRIAGE STATUS: ROUTINE SURVEILLANCE',
      icon: <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />,
      pulse: false
    },
    monitor: {
      color: '#facc15',
      bg: '#361804',
      border: '#b45309',
      badgeClass: 'badge-monitor',
      badgeText: 'MONITOR',
      title: 'TRIAGE STATUS: CLINICAL FOLLOW-UP RECOMMENDED',
      icon: <Info className="w-5 h-5 text-[#facc15]" />,
      pulse: false
    },
    urgent: {
      color: '#f87171',
      bg: '#3b0811',
      border: '#b91c1c',
      badgeClass: 'badge-urgent',
      badgeText: 'URGENT',
      title: 'TRIAGE STATUS: URGENT ATTENTION REQUIRED',
      icon: <AlertTriangle className="w-5 h-5 text-[#f87171]" />,
      pulse: true
    }
  };

  const config = configs[level] || configs.routine;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 border transition-all ${config.pulse ? 'pulse-emergency' : ''}`}
      style={{
        backgroundColor: config.bg,
        borderColor: config.border
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-1 rounded-full bg-black/40">
            {config.icon}
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: config.color }}>
              {config.title}
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              Primary Finding: {primaryDiagnosis || 'Screening Evaluation Complete'}
            </div>
            {actionText && (
              <div className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-xl">
                {actionText}
              </div>
            )}
          </div>
        </div>

        <span className={config.badgeClass}>
          {config.badgeText}
        </span>
      </div>
    </motion.div>
  );
};

export default TriageBanner;
