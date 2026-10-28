import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, getImageUrl } from '../apiConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Activity, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw,
  Layers,
  Info,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MedicalTerm from '../components/MedicalTerm';
import TriageBanner from '../components/TriageBanner';
import MedicalReportDocument from '../components/MedicalReportDocument';
import ReportPreviewModal from '../components/ReportPreviewModal';

const DiagnosticPage = ({ title, endpoint, framework, sampleScans = [] }) => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState(45);
  const [patientGender, setPatientGender] = useState("Female");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeImageKey, setActiveImageKey] = useState("processed"); // 'original', 'processed', or copy key
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select or drop a medical scan image.");
    if (!patientName.trim()) return alert("Please enter a patient reference name or ID.");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("patient_name", patientName.trim());
    formData.append("patient_age", patientAge);
    formData.append("patient_gender", patientGender);

    setLoading(true);
    setResult(null);
    setActiveImageKey("processed");
    
    try {
      const res = await axios.post(`${API_BASE_URL}${endpoint}`, formData);
      if (res.data && res.data.record) {
        setResult(res.data.record);
      } else {
        alert("Unexpected response format from server.");
      }
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || err.message;
      alert(`Inference Engine Error: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getActiveImageData = () => {
    if (!result) return { url: preview, title: "Original Acquisition", desc: "Source image preview." };
    if (activeImageKey === "original") {
      return {
        url: preview,
        title: "Original Natural Scan",
        desc: "Source medical acquisition without algorithmic modulation."
      };
    }
    if (activeImageKey === "processed") {
      return {
        url: result.processed_image_base64 || result.processed_image_url || preview,
        title: "Primary Pathology Attention Map",
        desc: "Full-spectrum CLAHE equalization and primary lesion attention heatmap."
      };
    }
    if (result.multi_copies && result.multi_copies.length > 0) {
      const found = result.multi_copies.find(c => c.key === activeImageKey);
      if (found) {
        return {
          url: found.image_base64 || found.url,
          title: found.title,
          desc: found.description
        };
      }
    }
    return {
      url: result.processed_image_base64 || result.processed_image_url || preview,
      title: "Diagnostic Visualization",
      desc: "Processed clinical analysis."
    };
  };

  const activeImage = getActiveImageData();

  return (
    <>
      <div className="p-6 md:p-8 w-full h-full overflow-y-auto bg-[#060b13] text-slate-100 no-print screen-only">
        <div className="max-w-[1300px] mx-auto space-y-6">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print pb-1">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1">
              <Sparkles className="w-3.5 h-3.5" /> DEEP LEARNING DIAGNOSTIC TERMINAL
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">{title}</h2>
            <p className="text-[#718da8] text-xs sm:text-sm mt-0.5">
              Automated Pathology Detection & Clinical Report Generator Powered by <span className="text-white font-semibold">{framework}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate("/")}
              className="btn-secondary text-xs px-3.5 py-2"
            >
              <FileText className="w-4 h-4 text-cyan-400" /> Patient Registry
            </button>
          </div>
        </div>

        {/* Diagnostic Workbench Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Intake Form & File Upload */}
          <div className="lg:col-span-4 space-y-5 no-print">
            <div className="bg-[#0a1322] border border-[#162842] rounded-2xl p-5 sm:p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between border-b border-[#162842] pb-3">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00e5ff]"></span>
                  Patient Intake
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-[#0c1726] border border-[#1a2d45]">{framework}</span>
              </h3>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                    Patient Reference Name / ID
                  </label>
                  <input 
                    type="text" 
                    className="glass-input text-xs sm:text-sm" 
                    value={patientName} 
                    onChange={(e) => setPatientName(e.target.value)} 
                    required 
                    placeholder="e.g. PT-94021 / Sarah Jenkins" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                      Age
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      max="120"
                      className="glass-input font-mono text-xs sm:text-sm" 
                      value={patientAge} 
                      onChange={(e) => setPatientAge(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                      Gender
                    </label>
                    <select 
                      className="glass-input text-xs sm:text-sm cursor-pointer" 
                      value={patientGender} 
                      onChange={(e) => setPatientGender(e.target.value)}
                    >
                      <option value="Female" className="bg-[#0a1322]">Female</option>
                      <option value="Male" className="bg-[#0a1322]">Male</option>
                      <option value="Other" className="bg-[#0a1322]">Other</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                    <MedicalTerm term="DICOM">DICOM</MedicalTerm> / Scan Imagery
                  </label>
                  <div className="glass-input relative overflow-hidden flex items-center p-3 border-dashed border-2 border-[#1e3552] hover:border-cyan-400 transition-colors cursor-pointer bg-[#0c1726] rounded-xl">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                      onChange={(e) => setFile(e.target.files[0])} 
                      required 
                    />
                    <div className="flex-1 text-slate-200 truncate text-xs flex items-center gap-2">
                      <Upload className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{file ? file.name : "Choose or drag image scan..."}</span>
                    </div>
                  </div>
                </div>

                {preview && (
                  <div className="rounded-xl overflow-hidden border border-[#162842] bg-[#070d18] p-2 flex items-center justify-center">
                    <img 
                      src={preview} 
                      alt="Thumbnail Preview" 
                      className="max-h-36 object-contain rounded-lg"
                    />
                  </div>
                )}

                <button 
                  disabled={loading} 
                  type="submit" 
                  className="btn-primary w-full py-3 text-xs tracking-wider uppercase font-bold mt-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      RUNNING NEURAL PIPELINE...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" />
                      GENERATE MEDICAL REPORT
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick Diagnostic Protocol Note */}
            <div className="p-4 rounded-2xl bg-[#0a1322] border border-[#162842] text-xs text-slate-400 space-y-1.5">
              <div className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Info className="w-3.5 h-3.5 text-cyan-400" /> Clinical Protocol Guide
              </div>
              <p className="text-[11px] leading-relaxed text-[#718da8]">
                Every upload automatically passes through green-channel CLAHE equalization, lesion contour detection, and the certified <strong className="text-white">{framework}</strong> inference engine.
              </p>
            </div>
          </div>

          {/* RIGHT: Comprehensive Medical Diagnostic Report */}
          <div className="lg:col-span-8 flex flex-col">
            {loading ? (
              <div className="bg-[#0a1322] border border-[#162842] rounded-2xl flex-1 min-h-[520px] flex flex-col items-center justify-center p-8 text-center space-y-5">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-cyan-950 border-t-cyan-400 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-cyan-400">
                    AI
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">Executing Deep Learning Pathology Screen</h4>
                  <p className="text-xs text-slate-400 tracking-wider uppercase animate-pulse">
                    Filtering noise • Evaluating feature activations • Computing triage urgency
                  </p>
                </div>
              </div>
            ) : result ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0a1322] border border-[#162842] rounded-2xl p-6 md:p-8 flex-1 flex flex-col space-y-5 relative"
                id="medical-report-card"
              >
                {/* Official Clinical Report Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#162842]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950/40 text-cyan-400 border border-cyan-800/60 uppercase">
                        OFFICIAL AI SCREENING REPORT
                      </span>
                      <span className="text-xs text-slate-400 font-mono">ID: #{String(result.id).padStart(5, '0')}</span>
                    </div>
                    <h3 className="text-2xl font-black text-white mt-1 tracking-tight">Diagnostic Pathology Report</h3>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Patient: <strong className="text-cyan-400">{result.patient_name}</strong></span>
                      <span>Demographics: <strong className="text-white">{result.patient_age}y / {result.patient_gender}</strong></span>
                      <span>Framework: <strong className="text-white">{framework}</strong></span>
                      <span>Date: <strong className="text-white">{new Date(result.timestamp).toLocaleDateString()}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto no-print">
                    <button 
                      onClick={() => setShowPreviewModal(true)}
                      className="btn-secondary text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-300 hover:text-white"
                      title="Preview Official Clinical Report"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" /> Preview
                    </button>
                    <button 
                      onClick={handlePrint}
                      className="btn-secondary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/40"
                      title="Print or Save as PDF"
                    >
                      <Printer className="w-3.5 h-3.5 text-cyan-400" /> Print Report
                    </button>
                  </div>
                </div>

                {/* Triage Urgency Banner */}
                <TriageBanner 
                  level={result.triage_level || 'routine'} 
                  primaryDiagnosis={result.diagnosis}
                  actionText={result.clinical_recommendation}
                />

                {/* Imagery & Pathology Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: Multi-Copy Imagery Viewer */}
                  <div className="md:col-span-6 flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" /> Multi-Copy Pathology Decomposition
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/60">
                        {(result.multi_copies?.length || 0) + 2} Layers Available
                      </span>
                    </div>

                    {/* Main Active Image Container */}
                    <div className="relative rounded-xl overflow-hidden border border-[#162842] bg-[#070d18] flex flex-col items-center justify-center min-h-[250px] p-2">
                      <img 
                        src={getImageUrl(activeImage.url)} 
                        alt={activeImage.title} 
                        className="max-h-[250px] w-auto object-contain rounded-lg transition-all duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-cyan-500/40 text-[10px] font-mono text-cyan-400 uppercase shadow-lg">
                        {activeImage.title.split("(")[0]}
                      </div>
                    </div>

                    {/* Active Layer Details */}
                    <div className="p-2.5 rounded-xl bg-[#0c1726] border border-[#162842] text-xs flex items-start gap-2">
                      <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white text-[11px]">{activeImage.title}</div>
                        <div className="text-[10px] text-slate-400 leading-snug">{activeImage.desc}</div>
                      </div>
                    </div>

                    {/* Multi-Copy Interactive Thumbnails Gallery */}
                    <div className="space-y-1.5 no-print">
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
                        <span>Select Pathology Layer</span>
                        <span className="text-[9px] font-mono text-slate-500">Click to Inspect</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {/* 1. Original */}
                        <button
                          type="button"
                          onClick={() => setActiveImageKey("original")}
                          className={`p-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                            activeImageKey === 'original'
                              ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                              : 'bg-[#0c1726] border-[#162842] hover:border-slate-600'
                          }`}
                        >
                          <img src={preview} alt="Original" className="w-full h-8 object-cover rounded" />
                          <span className="text-[8px] font-bold text-slate-300 truncate w-full text-center">Original</span>
                        </button>

                        {/* 2. Primary Heatmap */}
                        {(result.processed_image_base64 || result.processed_image_url) && (
                          <button
                            type="button"
                            onClick={() => setActiveImageKey("processed")}
                            className={`p-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                              activeImageKey === 'processed'
                                ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                                : 'bg-[#0c1726] border-[#162842] hover:border-slate-600'
                            }`}
                          >
                            <img src={getImageUrl(result.processed_image_base64 || result.processed_image_url)} alt="Heatmap" className="w-full h-8 object-cover rounded" />
                            <span className="text-[8px] font-bold text-cyan-400 truncate w-full text-center">Heatmap</span>
                          </button>
                        )}

                        {/* 3+. Dynamic Specialized Copies */}
                        {result.multi_copies && result.multi_copies.map((copy) => (
                          <button
                            key={copy.key}
                            type="button"
                            onClick={() => setActiveImageKey(copy.key)}
                            className={`p-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                              activeImageKey === copy.key
                                ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                                : 'bg-[#0c1726] border-[#162842] hover:border-slate-600'
                            }`}
                          >
                            <img src={getImageUrl(copy.thumbnail_base64 || copy.image_base64 || copy.url)} alt={copy.title} className="w-full h-8 object-cover rounded" />
                            <span className="text-[8px] font-bold text-slate-300 truncate w-full text-center">
                              {copy.key === "vasculature" ? "Vessels" :
                               copy.key === "hemorrhages" ? "Hemorrhages" :
                               copy.key === "exudates" ? "Exudates" :
                               copy.key === "optic_nerve" ? "Optic CDR" :
                               copy.key === "anatomy_ctr" ? "CTR / Ribs" :
                               copy.key === "consolidation" ? "Airspace" :
                               copy.key === "pleural" ? "Pleural" :
                               copy.key === "infiltration" ? "Infiltration" : copy.key}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image Classification & Clinical Biometrics Bar */}
                    <div className="p-3 rounded-xl bg-[#0c1726] border border-[#162842] text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Modality Classification:</span>
                        <span className="font-semibold text-white font-mono text-[11px]">{result.image_type || "Standard Capture"}</span>
                      </div>

                      {result.quality_metrics && (
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#162842]">
                          {/* CDR if Eye */}
                          {result.quality_metrics.cdr !== undefined && (
                            <div className="bg-[#070d18] p-2 rounded-lg border border-[#162842]">
                              <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Cup-to-Disc Ratio (CDR)</div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="font-mono font-bold text-white text-xs">{result.quality_metrics.cdr}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                  result.quality_metrics.cdr > 0.50 
                                    ? 'bg-[#450a0a] text-[#f87171] border border-[#b91c1c]' 
                                    : 'bg-[#052e16] text-[#22c55e] border border-[#15803d]'
                                }`}>
                                  {result.quality_metrics.cdr > 0.50 ? 'GLAUCOMA RISK' : 'NORMAL CUP'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* CTR if Radiograph */}
                          {result.quality_metrics.ctr !== undefined && (
                            <div className="bg-[#070d18] p-2 rounded-lg border border-[#162842]">
                              <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Cardiothoracic Ratio (CTR)</div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="font-mono font-bold text-white text-xs">{result.quality_metrics.ctr}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono ${
                                  result.quality_metrics.ctr > 0.50 
                                    ? 'bg-[#450a0a] text-[#f87171] border border-[#b91c1c]' 
                                    : 'bg-[#052e16] text-[#22c55e] border border-[#15803d]'
                                }`}>
                                  {result.quality_metrics.ctr > 0.50 ? 'CARDIOMEGALY' : 'NORMAL CTR'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Vessel Density if Eye */}
                          {result.quality_metrics.vessel_density_pct !== undefined && (
                            <div className="bg-[#070d18] p-2 rounded-lg border border-[#162842]">
                              <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Vessel Arborization</div>
                              <div className="font-mono font-bold text-cyan-400 text-xs mt-1">
                                {result.quality_metrics.vessel_density_pct}% density
                              </div>
                            </div>
                          )}

                          {/* Contrast & SNR */}
                          <div className="bg-[#070d18] p-2 rounded-lg border border-[#162842]">
                            <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Diagnostic Quality</div>
                            <div className="font-mono text-white text-[10px] mt-1 truncate">
                              {result.quality_metrics.contrast_range} levels • {result.quality_metrics.snr_db} dB
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Detailed Pathological Probabilities */}
                  <div className="md:col-span-6 flex flex-col space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>PATHOLOGICAL FINDING PROBABILITIES</span>
                      <span className="font-mono text-cyan-400">{(result.confidence * 100).toFixed(1)}% Peak</span>
                    </div>

                    <div className="space-y-3 flex-1">
                      {result.findings && result.findings.map((finding, idx) => {
                        const isSevere = finding.confidence > 0.40 && !finding.name.toLowerCase().includes("normal") && !finding.name.toLowerCase().includes("clear");
                        let barGradient = "bg-gradient-to-r from-teal-400 to-cyan-400";
                        if (idx === 1) barGradient = "bg-gradient-to-r from-cyan-500 to-blue-500";
                        else if (idx === 2) barGradient = "bg-gradient-to-r from-indigo-500 to-purple-500";
                        else if (idx >= 3) barGradient = "bg-gradient-to-r from-purple-500 to-pink-500";

                        return (
                          <div key={idx} className="p-2.5 rounded-xl bg-[#0c1726] border border-[#162842] space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-medium text-slate-200 flex items-center gap-1.5">
                                <MedicalTerm term={finding.name.split(" ")[0]}>{finding.name}</MedicalTerm>
                                {finding.grade !== undefined && (
                                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/50 text-cyan-400 border border-cyan-800/60">
                                    Grade {finding.grade}
                                  </span>
                                )}
                              </span>
                              <span className={`font-mono font-bold ${isSevere ? 'text-[#f87171]' : 'text-cyan-400'}`}>
                                {(finding.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                            
                            {/* Animated Confidence Bar */}
                            <div className="w-full bg-[#070d18] rounded-full h-1.5 overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(finding.confidence * 100, 2)}%` }}
                                transition={{ duration: 0.8, delay: idx * 0.1 }}
                                className={`h-full rounded-full ${barGradient}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* DR Grade Indicator Bar if Applicable */}
                    {result.scan_type.includes("Diabetic Retinopathy") && (
                      <div className="p-3 rounded-xl bg-[#0c1726] border border-[#162842]">
                        <div className="text-[11px] uppercase font-bold text-slate-400 mb-2 flex justify-between">
                          <span>ICDR Diabetic Retinopathy Grade</span>
                          <span className="text-cyan-400 font-mono">{result.diagnosis}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
                          {['G0: None', 'G1: Mild', 'G2: Mod', 'G3: Sev', 'G4: PDR'].map((lbl, g) => (
                            <div 
                              key={g} 
                              className={`py-1 rounded border ${
                                result.diagnosis.toLowerCase().includes(lbl.split(':')[1].trim().toLowerCase()) 
                                  ? 'bg-[#450a0a] border-[#b91c1c] text-red-400 font-bold' 
                                  : 'bg-[#070d18] border-[#162842] text-slate-400'
                              }`}
                            >
                              {lbl}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Clinical Conclusion Box */}
                <div className="p-4 rounded-xl bg-[#0c1726] border border-[#162842] space-y-1.5">
                  <div className="text-xs uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Clinical Diagnostic Synthesis
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    AI screening inference has finalized. The primary classification corresponds to 
                    <strong className="text-white ml-1 underline decoration-cyan-400">{result.diagnosis}</strong> with an aggregate model confidence of 
                    <strong className="text-cyan-400 font-mono ml-1">{(result.confidence * 100).toFixed(1)}%</strong>. 
                    {" "}{result.clinical_recommendation}
                  </div>
                </div>

                {/* Regulatory / Diagnostic Disclaimer */}
                <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-[#162842] flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span>Diagnostic Module: {result.scan_type} | Antigravity AI Engine v2.5</span>
                  <span className="font-mono">Generated: {new Date(result.timestamp).toUTCString()}</span>
                </div>
              </motion.div>
            ) : (
              /* Awaiting Scan State */
              <div className="bg-[#0a1322] border border-[#162842] rounded-2xl flex-1 min-h-[520px] flex flex-col items-center justify-center p-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#0c1726] border border-[#162842] flex items-center justify-center text-slate-400">
                  <FileText className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="max-w-md">
                  <h4 className="text-base font-bold text-white mb-1">Awaiting Diagnostic Imagery</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter the patient identification parameters on the left and select an ocular fundus or thoracic radiograph to generate the comprehensive pathology report.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>

    {/* Screen Preview Modal */}
    <ReportPreviewModal 
      isOpen={showPreviewModal}
      onClose={() => setShowPreviewModal(false)}
      record={result}
    />

    {/* Dedicated Print-Only Document */}
    <div className="print-only">
      {result && <MedicalReportDocument record={result} />}
    </div>
  </>
);
};

export default DiagnosticPage;
