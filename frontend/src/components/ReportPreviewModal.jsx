import React from 'react';
import { Printer, X, FileText, Download } from 'lucide-react';
import MedicalReportDocument from './MedicalReportDocument';

const ReportPreviewModal = ({ isOpen, onClose, record }) => {
  if (!isOpen || !record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm no-print">
      <div className="bg-[#0a1322] border border-[#1a2d45] rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-3.5 border-b border-[#162842] bg-[#070e1b] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Official Clinical Diagnostic Report Preview
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  RECORD #{String(record.id || 1).padStart(5, '0')}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Patient: <span className="text-white font-medium">{record.patient_name}</span> • Ready for high-resolution medical PDF export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Virtual Paper Document */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#040810]/90 flex justify-center">
          <div className="w-full max-w-[210mm] shadow-2xl rounded-xl overflow-hidden bg-white text-slate-900 border border-slate-300">
            <MedicalReportDocument record={record} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-2.5 border-t border-[#162842] bg-[#070e1b] flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
          <span>Tip: In the print dialog, select <strong>"Save as PDF"</strong> and ensure <strong>"Background graphics"</strong> is checked.</span>
          <button 
            onClick={onClose}
            className="text-cyan-400 hover:underline"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReportPreviewModal;
