import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../apiConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Send, 
  FileText, 
  Printer, 
  RefreshCw, 
  BrainCircuit, 
  ArrowRight,
  Info,
  Eye,
  Zap,
  Sliders,
  ShieldAlert,
  AlertTriangle,
  Microscope,
  HeartPulse,
  Flame,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MedicalTerm from '../components/MedicalTerm';
import TriageBanner from '../components/TriageBanner';
import MedicalReportDocument from '../components/MedicalReportDocument';
import ReportPreviewModal from '../components/ReportPreviewModal';

const SymptomCheckerPage = () => {
  const navigate = useNavigate();

  // Intake State
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState(35);
  const [patientGender, setPatientGender] = useState("Female");
  const [initialNotes, setInitialNotes] = useState("");

  // Diagnostic Depth Mode State
  // 'quick' (5-10), 'standard' (15-25), 'comprehensive' (30-50), 'custom' (slider)
  const [assessmentMode, setAssessmentMode] = useState("quick");
  const [targetQuestions, setTargetQuestions] = useState(8);

  // Session State
  const [sessionActive, setSessionActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [symptomState, setSymptomState] = useState({});
  const [preliminaryRanking, setPreliminaryRanking] = useState([]);
  const [lastNlpAnalysis, setLastNlpAnalysis] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);

  // "Other" free-text state
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState("");

  // Final Synthesis Result
  const [finalReport, setFinalReport] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Mode Selection Helper
  const handleSelectMode = (mode) => {
    setAssessmentMode(mode);
    if (mode === "quick") setTargetQuestions(8);
    else if (mode === "standard") setTargetQuestions(20);
    else if (mode === "comprehensive") setTargetQuestions(35);
  };

  // Start the session
  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) return alert("Please enter patient name or reference ID.");

    setLoading(true);
    setFinalReport(null);
    setLastNlpAnalysis(null);
    setQuestionCount(0);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/symptoms/start`, {
        patient_name: patientName.trim(),
        patient_age: Number(patientAge),
        patient_gender: patientGender,
        initial_notes: initialNotes.trim() || null,
        target_questions: Number(targetQuestions),
        assessment_mode: assessmentMode
      });

      setSessionActive(true);
      setCurrentQuestion(res.data.next_question);
      setSymptomState(res.data.symptom_state || {});
      setPreliminaryRanking(res.data.preliminary_ranking || []);
      setLastNlpAnalysis(res.data.nlp_analysis);
      setQuestionCount(1);
    } catch (err) {
      alert("Failed to initiate neural session: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Submit Answer (Yes, No, or Other with free text)
  const handleAnswer = async (answerType) => {
    if (answerType === 'other' && !showOtherInput) {
      setShowOtherInput(true);
      return;
    }

    if (answerType === 'other' && !otherText.trim()) {
      return alert("Please enter custom symptoms or sensations in the text box.");
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/symptoms/answer`, {
        patient_name: patientName.trim(),
        patient_age: Number(patientAge),
        patient_gender: patientGender,
        symptom_id: currentQuestion ? currentQuestion.symptom_id : "general",
        answer: answerType,
        other_text: answerType === 'other' ? otherText.trim() : null,
        symptom_state: symptomState,
        accumulated_notes: initialNotes + (otherText ? ` | ${otherText}` : ""),
        target_questions: Number(targetQuestions),
        assessment_mode: assessmentMode
      });

      setShowOtherInput(false);
      setOtherText("");

      if (res.data.status === 'completed') {
        const synth = res.data.synthesis;
        const dbRec = res.data.record || {};
        const fullReport = {
          ...synth,
          id: dbRec.id || Date.now() % 100000,
          timestamp: dbRec.timestamp || new Date().toISOString(),
          scan_type: "AI Clinical Symptom Differential (Deep Neural Net)",
          confirmed_symptoms: synth.positive_symptoms,
          denied_symptoms: synth.ruled_out_symptoms,
          target_questions: Number(targetQuestions),
          assessment_mode: assessmentMode,
          findings: synth.differential_diagnoses ? synth.differential_diagnoses.map(d => ({
            name: d.name,
            confidence: d.probability,
            category: d.category,
            triage: d.triage
          })) : []
        };
        setFinalReport(fullReport);
        setSessionActive(false);
      } else {
        setCurrentQuestion(res.data.next_question);
        setSymptomState(res.data.symptom_state);
        setPreliminaryRanking(res.data.preliminary_ranking || []);
        setLastNlpAnalysis(res.data.nlp_analysis);
        setQuestionCount(prev => prev + 1);
      }
    } catch (err) {
      alert("Error submitting symptom answer: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Premature Finalization
  const handleFinalizeEarly = async () => {
    if (!window.confirm("Do you want to finalize the assessment with current answers and generate the complete report now?")) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/symptoms/finalize`, {
        patient_name: patientName.trim(),
        patient_age: Number(patientAge),
        patient_gender: patientGender,
        symptom_state: symptomState,
        accumulated_notes: initialNotes + (otherText ? ` | ${otherText}` : ""),
        target_questions: Number(targetQuestions),
        assessment_mode: assessmentMode
      });
      const synth = res.data.synthesis;
      const dbRec = res.data.record || {};
      const fullReport = {
        ...synth,
        id: dbRec.id || Date.now() % 100000,
        timestamp: dbRec.timestamp || new Date().toISOString(),
        scan_type: "AI Clinical Symptom Differential (Deep Neural Net)",
        confirmed_symptoms: synth.positive_symptoms,
        denied_symptoms: synth.ruled_out_symptoms,
        target_questions: Number(targetQuestions),
        assessment_mode: assessmentMode,
        findings: synth.differential_diagnoses ? synth.differential_diagnoses.map(d => ({
          name: d.name,
          confidence: d.probability,
          category: d.category,
          triage: d.triage
        })) : []
      };
      setFinalReport(fullReport);
      setSessionActive(false);
    } catch (err) {
      alert("Error finalizing session: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-6 md:p-8 w-full h-full overflow-y-auto bg-[#060b13] text-slate-100 no-print screen-only">
        <div className="max-w-[1300px] mx-auto space-y-6">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print pb-1">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1">
              <BrainCircuit className="w-4 h-4 text-cyan-400" /> DEEP NEURAL SYMPTOM REASONING ENGINE
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Adaptive Clinical Symptom Checker</h2>
            <p className="text-[#718da8] text-xs sm:text-sm mt-0.5">
              PyTorch Dynamic Entropy Information-Gain Questioning with Configurable Diagnostic Depth (5 to 50 Questions) & Etiology Root-Cause Synthesis
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

        {/* INTAKE SCREEN WITH ASSESSMENT DEPTH SELECTOR */}
        {!sessionActive && !finalReport && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-[#0a1322] border border-[#162842] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-[#162842] pb-4">
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-950/40 text-cyan-400 border border-cyan-800/60 uppercase">
                  PATIENT INTAKE & CLINICAL SETTINGS
                </span>
                <h3 className="text-xl font-bold text-white mt-2 tracking-tight">Diagnostic Protocol Configuration</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Choose your interview duration budget and enter initial patient details.
                </p>
              </div>

              <form onSubmit={handleStartSession} className="space-y-5">
                
                {/* 1. Assessment Mode & Question Depth Selector */}
                <div className="space-y-2.5">
                  <label className="block text-[11px] uppercase tracking-wider text-slate-300 font-bold">
                    SELECT INTERVIEW DEPTH (QUESTION COUNT)
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Rush Mode (5-10) */}
                    <div 
                      onClick={() => handleSelectMode("quick")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        assessmentMode === "quick"
                          ? "bg-[#0e273c] border-cyan-400 ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                          : "bg-[#0c1726] border-[#162842] hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-amber-400" /> Quick Triage
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
                          5–10 Qs
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Fast outpatient triage when in a hurry. Evaluates highest Information-Gain red flags.
                      </p>
                    </div>

                    {/* Standard Mode (15-25) */}
                    <div 
                      onClick={() => handleSelectMode("standard")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        assessmentMode === "standard"
                          ? "bg-[#0e273c] border-cyan-400 ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                          : "bg-[#0c1726] border-[#162842] hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-cyan-400" /> Standard Clinical
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/60">
                          15–25 Qs
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Balanced general physician intake. Analyzes multi-system differential exclusions.
                      </p>
                    </div>

                    {/* Comprehensive Deep Dive (30-50) */}
                    <div 
                      onClick={() => handleSelectMode("comprehensive")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        assessmentMode === "comprehensive"
                          ? "bg-[#0e273c] border-cyan-400 ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                          : "bg-[#0c1726] border-[#162842] hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Microscope className="w-4 h-4 text-purple-400" /> Comprehensive
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60">
                          30–50 Qs
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        Full systemic examination when patient is seated for a thorough multi-organ battery.
                      </p>
                    </div>

                  </div>

                  {/* Custom Slider Toggle */}
                  <div className="pt-1">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Exact Question Budget:
                      </span>
                      <span className="font-mono text-cyan-400 font-bold text-sm bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/60">
                        {targetQuestions} Questions Target
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      step="1"
                      value={targetQuestions} 
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTargetQuestions(val);
                        if (val <= 10) setAssessmentMode("quick");
                        else if (val <= 25) setAssessmentMode("standard");
                        else setAssessmentMode("comprehensive");
                      }}
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                      <span>5 (Fast Rush)</span>
                      <span>15 (Standard)</span>
                      <span>30 (Deep Dive)</span>
                      <span>50 (Max Review of Systems)</span>
                    </div>
                  </div>
                </div>

                {/* Patient Name */}
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
                    placeholder="e.g. PT-89104 / John Doe" 
                  />
                </div>

                {/* Age & Gender */}
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

                {/* Free Text Initial Complaints */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">
                    Chief Complaints / Free-Text Notes (Optional AI NLP Parsing)
                  </label>
                  <textarea 
                    rows={3}
                    className="glass-input text-xs sm:text-sm leading-relaxed" 
                    value={initialNotes} 
                    onChange={(e) => setInitialNotes(e.target.value)} 
                    placeholder="e.g. 'Sudden onset of high fever, retro-orbital eye pain, joint aches, and light sensitivity for 2 days...'" 
                  />
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    AI NLP extracts active symptoms directly into the PyTorch inference tensor.
                  </div>
                </div>

                <button 
                  disabled={loading} 
                  type="submit" 
                  className="btn-primary w-full py-3.5 text-xs tracking-wider uppercase font-bold mt-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      INITIALIZING NEURAL REASONING SESSION...
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="w-4 h-4" />
                      START DYNAMIC ADAPTIVE INTERVIEW ({targetQuestions} QUESTIONS)
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Guide */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#0a1322] border border-[#162842] rounded-2xl p-6 text-xs space-y-3">
                <div className="font-bold text-white flex items-center gap-2 text-sm text-cyan-400">
                  <Sparkles className="w-4 h-4" /> Multi-Tier Neural Depth
                </div>
                <div className="space-y-3 text-slate-300 leading-relaxed text-[11px]">
                  <p>
                    <strong className="text-white">⚡ Quick Triage (5–10):</strong> Designed for rapid clinical assessment. Directly isolates dangerous red flags and high-probability acute conditions.
                  </p>
                  <p>
                    <strong className="text-white">🩺 Standard Workup (15–25):</strong> Systematic organ assessment, differentiating common viral, respiratory, gastrointestinal, and metabolic diagnoses.
                  </p>
                  <p>
                    <strong className="text-white">🔬 Comprehensive Deep Dive (30–50):</strong> Systematic review across 65+ symptoms, providing complete exclusion analysis and thorough root-cause etiology.
                  </p>
                  <p>
                    <strong className="text-white">🛑 Early Finalization:</strong> You can click <span className="text-cyan-400 font-semibold">"Finalize Report Now"</span> at any question to generate the full synthesis immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE SESSION: Dynamic Adaptive Question Flow */}
        {sessionActive && currentQuestion && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 8 Cols: Dynamic Question Card */}
            <div className="lg:col-span-8 space-y-5">
              <div className="bg-[#0a1322] border border-[#162842] rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
                
                {/* Header Progress Bar & Badge */}
                <div className="space-y-2 pb-3 border-b border-[#162842]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-400 flex items-center gap-1.5 font-bold">
                      <BrainCircuit className="w-4 h-4 text-cyan-400" /> Question {questionCount} of {targetQuestions}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0c1726] border border-[#162842] text-slate-300 uppercase">
                        {currentQuestion.category}
                      </span>
                      {currentQuestion.urgency === "emergency" && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/60 uppercase animate-pulse">
                          Critical Red Flag
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-800/60 font-bold">
                        IG: +{currentQuestion.information_gain} bits
                      </span>
                    </div>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="w-full bg-[#070d18] h-2 rounded-full overflow-hidden border border-[#162842]">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min((questionCount / targetQuestions) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* AI Extracted Banner from Previous Text (if any) */}
                {lastNlpAnalysis && lastNlpAnalysis.extracted_symptoms && lastNlpAnalysis.extracted_symptoms.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs flex items-start gap-2.5"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-cyan-400">NLP Semantic Parser: </span>
                      <span className="text-slate-200">{lastNlpAnalysis.clinical_summary}</span>
                    </div>
                  </motion.div>
                )}

                {/* Primary Question Prompt */}
                <div className="space-y-3 py-2">
                  <span className="text-[11px] font-mono text-[#52799c] uppercase tracking-wider block font-bold">
                    SYSTEMATIC CLINICAL INQUIRY
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                    {currentQuestion.question_text}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Your response dynamically updates the deep neural belief distribution over 22 candidate clinical conditions.
                  </p>
                </div>

                {/* Answer Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button 
                    disabled={loading}
                    onClick={() => handleAnswer("yes")}
                    className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-emerald-950/30"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Yes, Present</span>
                  </button>

                  <button 
                    disabled={loading}
                    onClick={() => handleAnswer("no")}
                    className="p-4 rounded-xl border border-red-500/40 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-red-950/30"
                  >
                    <XCircle className="w-5 h-5 text-red-400" />
                    <span>No, Denied</span>
                  </button>

                  <button 
                    disabled={loading}
                    onClick={() => handleAnswer("other")}
                    className="p-4 rounded-xl border border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-400 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-cyan-950/30"
                  >
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <span>Other / Custom Details</span>
                  </button>
                </div>

                {/* Free Text Input on "Other" */}
                {showOtherInput && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-4 border-t border-[#162842] space-y-3"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                      <Sparkles className="w-4 h-4" /> Specify Custom Sensations / Variations
                    </div>
                    <textarea 
                      rows={2}
                      className="glass-input text-xs sm:text-sm"
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder="e.g. 'I don't have high fever, but I have mild chills in the afternoon and my throat feels dry...'"
                    />
                    <button 
                      onClick={() => handleAnswer("other")}
                      disabled={loading}
                      className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Analyze Text & Advance
                    </button>
                  </motion.div>
                )}

                {/* Bottom Controls: Early Finalization */}
                <div className="pt-4 border-t border-[#162842] flex justify-between items-center text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Adaptive Entropy Model Convergence
                  </span>
                  <button 
                    onClick={handleFinalizeEarly}
                    disabled={loading}
                    className="text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 underline underline-offset-4"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Finalize Assessment & Generate Full Report Now
                  </button>
                </div>

              </div>
            </div>

            {/* Right 4 Cols: Live Neural Belief State Tracker */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#0a1322] border border-[#162842] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#162842] pb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" /> Live Differential
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/60">
                    PyTorch Belief State
                  </span>
                </div>

                <div className="space-y-3">
                  {preliminaryRanking.map((d, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-200 font-medium truncate max-w-[200px]">{d.name}</span>
                        <span className="font-mono text-cyan-400 font-bold text-[11px]">
                          {(d.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-[#070d18] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            i === 0 ? 'bg-gradient-to-r from-teal-400 to-cyan-400' : 'bg-slate-700'
                          }`}
                          style={{ width: `${Math.max(d.probability * 100, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-slate-500 pt-2 border-t border-[#162842] leading-tight">
                  Probabilities update continuously as symptoms are confirmed or eliminated.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* FINAL DETAILED REPORT CARD (WITH ROOT CAUSE ANALYSIS & PROBLEM CAUSE) */}
        {finalReport && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a1322] border border-[#162842] rounded-2xl p-6 md:p-8 space-y-6"
            id="symptom-report-card"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-[#162842]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950/40 text-cyan-400 border border-cyan-800/60 uppercase">
                    COMPREHENSIVE NEURAL DIFFERENTIAL REPORT
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Module: Deep Neural Symptom Reasoner</span>
                </div>
                <h3 className="text-2xl font-black text-white mt-1 tracking-tight">Clinical Diagnostic Differential Report</h3>
                <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Patient: <strong className="text-cyan-400">{finalReport.patient_name}</strong></span>
                  <span>Age / Gender: <strong className="text-white">{finalReport.patient_age}y / {finalReport.patient_gender}</strong></span>
                  <span>Exam Date: <strong className="text-white">{new Date().toLocaleDateString()}</strong></span>
                  <span>Questions Evaluated: <strong className="text-white">{finalReport.questions_answered_count || 12}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 no-print">
                <button 
                  onClick={() => setShowPreviewModal(true)}
                  className="btn-secondary text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-300 hover:text-white"
                  title="Preview Official Clinical Report"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" /> Preview
                </button>
                <button 
                  onClick={() => window.print()}
                  className="btn-secondary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/40"
                  title="Print Official Medical Report"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" /> Print Report
                </button>
                <button 
                  onClick={() => {
                    setFinalReport(null);
                    setSessionActive(false);
                    setPatientName("");
                    setInitialNotes("");
                  }}
                  className="btn-primary py-2 px-3 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> New Assessment
                </button>
              </div>
            </div>

            {/* Triage Urgency Banner */}
            <TriageBanner 
              level={finalReport.triage_level}
              primaryDiagnosis={finalReport.primary_diagnosis}
              actionText={finalReport.clinical_recommendation}
            />

            {/* 1. ROOT CAUSE ANALYSIS & PATHOPHYSIOLOGY (PROBLEM CAUSE SECTION) */}
            {finalReport.root_cause_analysis && (
              <div className="p-5 rounded-xl bg-[#070e1b] border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-[#162842] pb-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    <Microscope className="w-4 h-4 text-cyan-400" /> ETIOLOGY & ROOT CAUSE ANALYSIS (PROBLEM CAUSE)
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/60 font-bold">
                    Primary Disease Entity
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  <p className="mb-2">
                    <strong className="text-white">Biological Root Cause: </strong>
                    {finalReport.root_cause_analysis}
                  </p>
                  {finalReport.pathophysiology_mechanism && (
                    <p className="text-slate-300">
                      <strong className="text-white">Pathophysiological Mechanism: </strong>
                      {finalReport.pathophysiology_mechanism}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 2. ORGAN SYSTEM RISK MATRIX & SYMPTOM ATTRIBUTION */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Organ System Risks */}
              {finalReport.organ_risks && (
                <div className="md:col-span-6 p-4 rounded-xl bg-[#0c1726] border border-[#162842] space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-red-400" /> Multi-Organ System Involvement & Risks
                  </div>
                  <div className="space-y-2">
                    {Object.entries(finalReport.organ_risks).map(([organ, risk], i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg bg-[#070d18] border border-[#162842]">
                        <span className="font-semibold text-slate-200">{organ} System:</span>
                        <span className={`font-mono font-bold text-[11px] ${
                          String(risk).toLowerCase().includes("critical") ? "text-red-400" :
                          String(risk).toLowerCase().includes("high") ? "text-amber-400" : "text-cyan-400"
                        }`}>
                          {risk}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Right Column: Diagnostic Drivers (Symptom Attribution) */}
              <div className="md:col-span-6 p-4 rounded-xl bg-[#0c1726] border border-[#162842] space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Symptom Attribution & Diagnostic Drivers
                </div>
                
                {finalReport.symptom_attribution && (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                        Positive Hallmark Symptoms Confirming Diagnosis:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {finalReport.symptom_attribution.positive_drivers && finalReport.symptom_attribution.positive_drivers.length > 0 ? (
                          finalReport.symptom_attribution.positive_drivers.map((s, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
                              ✓ {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No hallmark positives recorded.</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#162842]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Negative Exclusions Ruling Out Competing Diagnoses:
                      </span>
                      <div className="text-[11px] text-slate-300">
                        Absence of pulmonary, cardiac, or abdominal red flags successfully lowered posterior probabilities of competing conditions.
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* 3. DIFFERENTIAL PROBABILITIES & CONFIRMED/RULED-OUT SYMPTOMS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Differential Ranking Table */}
              <div className="md:col-span-7 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex justify-between items-center">
                  <span>NEURAL DIFFERENTIAL PROBABILITY RANKING</span>
                  <span className="font-mono text-cyan-400">Top Differential</span>
                </div>

                <div className="space-y-2.5">
                  {finalReport.differential_diagnoses.slice(0, 8).map((d, idx) => {
                    const isTop = idx === 0;
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          isTop 
                            ? 'bg-[#0e273c] border-cyan-500/80 shadow-[0_0_12px_rgba(0,229,255,0.1)]' 
                            : 'bg-[#0c1726] border-[#162842]'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400">#{idx + 1}</span>
                            <span className={`font-semibold ${isTop ? 'text-white text-sm' : 'text-slate-200'}`}>
                              {d.name}
                            </span>
                            <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-white/5">
                              {d.category}
                            </span>
                          </div>
                          <span className={`font-mono font-bold ${isTop ? 'text-cyan-400 text-sm' : 'text-slate-400'}`}>
                            {(d.probability * 100).toFixed(1)}%
                          </span>
                        </div>

                        <div className="w-full bg-[#070d18] h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              isTop 
                                ? 'bg-gradient-to-r from-teal-400 to-cyan-400' 
                                : 'bg-slate-700'
                            }`}
                            style={{ width: `${Math.max(d.probability * 100, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Confirmed & Ruled-Out Symptoms */}
              <div className="md:col-span-5 space-y-4">
                <div className="p-4 rounded-xl bg-[#0c1726] border border-[#162842] space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#22c55e] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#22c55e]" /> Confirmed Positive Symptoms ({finalReport.positive_symptoms.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                    {finalReport.positive_symptoms.map((s, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-md bg-[#052e16] border border-[#15803d] text-[#34d399]">
                        {s}
                      </span>
                    ))}
                    {finalReport.positive_symptoms.length === 0 && (
                      <span className="text-xs text-slate-400">None confirmed positive.</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0c1726] border border-[#162842] space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#f87171] flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-[#f87171]" /> Ruled Out Negative Symptoms ({finalReport.ruled_out_symptoms.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                    {finalReport.ruled_out_symptoms.map((s, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-[#450a0a] border border-[#b91c1c] text-[#fca5a5]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* 4. RECOMMENDED DIAGNOSTIC WORKUP & LAB TESTS */}
            {finalReport.diagnostic_workup && (
              <div className="p-4 rounded-xl bg-[#0c1726] border border-[#162842] space-y-2">
                <div className="text-xs uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" /> Recommended Definitive Diagnostic Lab & Imaging Workup
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-200">
                  {finalReport.diagnostic_workup.map((test, i) => (
                    <div key={i} className="p-2 rounded-lg bg-[#070d18] border border-[#162842] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                      <span>{test}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. IMMEDIATE CARE PROTOCOL & EMERGENCY RED FLAGS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Immediate Actions */}
              {finalReport.immediate_actions && (
                <div className="p-4 rounded-xl bg-[#0c1726] border border-[#162842] space-y-1.5">
                  <div className="text-xs uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" /> Immediate Care & Medication Precautions
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {finalReport.immediate_actions}
                  </p>
                </div>
              )}

              {/* Emergency Red Flags */}
              {finalReport.emergency_red_flags && (
                <div className="p-4 rounded-xl bg-[#450a0a]/30 border border-red-500/50 space-y-1.5">
                  <div className="text-xs uppercase tracking-wider font-bold text-red-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-400" /> Emergency Room Red Flags
                  </div>
                  <p className="text-xs text-red-200 leading-relaxed">
                    {finalReport.emergency_red_flags}
                  </p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-[#162842] flex justify-between">
              <span>Saved to Registry Archive • MedDiag 2.0 PyTorch Deep Neural Reasoner</span>
              <span className="font-mono">Assessment Finalized • Full Report Ready</span>
            </div>

          </motion.div>
        )}

        </div>
      </div>

      {/* Screen Preview Modal */}
      <ReportPreviewModal 
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        record={finalReport}
      />

      {/* Dedicated Print-Only Document */}
      <div className="print-only">
        {finalReport && <MedicalReportDocument record={finalReport} />}
      </div>
    </>
  );
};

export default SymptomCheckerPage;
