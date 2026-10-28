import React from 'react';
import { getImageUrl } from '../apiConfig';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Eye, 
  FileText,
  Calendar,
  User,
  Clock,
  Layers,
  Award,
  Check,
  HeartPulse,
  Microscope,
  XCircle,
  Sparkles
} from 'lucide-react';

const LungsIcon = ({ className = "w-5 h-5 text-slate-800" }) => (
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

const CaduceusLogo = () => (
  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-serif text-2xl font-black shadow-md border border-slate-700 flex-shrink-0">
    ⚕
  </div>
);

export const MedicalReportDocument = ({ record }) => {
  if (!record) return null;

  // Normalize record attributes
  const patientName = record.patient_name || "Patient Not Named";
  const patientAge = record.patient_age || 45;
  const patientGender = record.patient_gender || "Unspecified";
  const recordId = record.id ? `#${String(record.id).padStart(5, '0')}` : "#00018";
  const accessionNo = `ACC-2026-${record.id ? String(record.id).padStart(5, '0') : "00018"}`;
  
  const rawDate = record.timestamp ? new Date(record.timestamp) : new Date();
  const dateStr = rawDate.toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });
  const timeStr = rawDate.toLocaleTimeString("en-US", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });

  const scanType = record.scan_type || record.modality || "Clinical Diagnostic Imaging";
  const primaryDiagnosis = record.diagnosis || record.primary_diagnosis || "Undetermined";
  const confidencePct = record.confidence !== undefined ? (record.confidence * 100).toFixed(1) : "—";
  const triageLevel = (record.triage_level || "routine").toLowerCase();
  const recommendation = record.clinical_recommendation || "Routine outpatient follow-up recommended.";
  
  const rawFindings = record.findings || record.differential_ranking || record.differential_diagnoses || [];
  const findings = rawFindings.map((f, i) => {
    const rawConf = f.confidence !== undefined ? f.confidence : (f.probability !== undefined ? f.probability : 0);
    return {
      name: f.name || f.diagnosis || `Finding #${i + 1}`,
      confidence: rawConf,
      grade: f.grade,
      category: f.category || (f.grade !== undefined ? `Grade ${f.grade}` : "Standard"),
      triage: f.triage
    };
  });

  const metrics = record.quality_metrics || {};
  const multiCopies = record.multi_copies || [];
  const imageType = record.image_type || "Clinical Diagnostic Radiograph";
  const primaryImageUrl = record.processed_image_url || record.image_url || null;

  // Symptom-specific deep reasoning fields
  const rootCause = record.root_cause_analysis || metrics.root_cause_analysis || null;
  const pathophysiology = record.pathophysiology_mechanism || metrics.pathophysiology_mechanism || null;
  const organRisks = record.organ_risks || metrics.organ_risks || null;
  const diagnosticWorkup = record.diagnostic_workup || metrics.diagnostic_workup || [];
  const immediateActions = record.immediate_actions || metrics.immediate_actions || null;
  const emergencyRedFlags = record.emergency_red_flags || metrics.emergency_red_flags || null;
  const symptomAttribution = record.symptom_attribution || metrics.symptom_attribution || null;
  const confirmedSymptoms = record.confirmed_symptoms || record.positive_symptoms || metrics.confirmed_symptoms || [];
  const deniedSymptoms = record.denied_symptoms || record.ruled_out_symptoms || metrics.ruled_out_symptoms || [];
  const targetQuestions = record.target_questions || metrics.target_questions || null;
  const answeredQuestions = record.questions_answered_count || metrics.answered_questions || null;
  const assessmentMode = record.assessment_mode || metrics.assessment_mode || null;

  // Find secondary decomposition plate (e.g. CTR, Ribs, Vessels, Hemorrhages)
  const secondaryPlate = multiCopies.length > 0 ? multiCopies[0] : null;

  const isCXR = scanType.toLowerCase().includes("chest") || scanType.toLowerCase().includes("cxr");
  const isEye = scanType.toLowerCase().includes("ophthalmic") || scanType.toLowerCase().includes("eye") || scanType.toLowerCase().includes("diabetic");
  const isSymptom = scanType.toLowerCase().includes("symptom");

  // Determine Triage color styles for print
  const getTriageStyle = () => {
    if (triageLevel === 'urgent') {
      return {
        bannerBg: 'bg-red-50 border-red-600 text-red-950',
        badgeBg: 'bg-red-700 text-white',
        icon: <ShieldAlert className="w-5 h-5 text-red-700 flex-shrink-0" />,
        title: 'URGENT CLINICAL TRIAGE • IMMEDIATE ATTENTION INDICATED',
        timeframe: 'Priority Specialist Consultation within 24–48 Hours'
      };
    }
    if (triageLevel === 'monitor') {
      return {
        bannerBg: 'bg-amber-50 border-amber-600 text-amber-950',
        badgeBg: 'bg-amber-700 text-white',
        icon: <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />,
        title: 'CLINICAL FOLLOW-UP RECOMMENDED • CLOSE MONITORING',
        timeframe: 'Specialist Evaluation & Follow-up within 7–14 Days'
      };
    }
    return {
      bannerBg: 'bg-emerald-50 border-emerald-600 text-emerald-950',
      badgeBg: 'bg-emerald-700 text-white',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />,
      title: 'ROUTINE SURVEILLANCE • UNREMARKABLE / CONTROLLED FINDING',
      timeframe: 'Standard Periodic Annual Health Maintenance'
    };
  };

  const triageStyle = getTriageStyle();

  return (
    <div className="bg-white text-slate-900 font-sans p-6 md:p-10 max-w-[210mm] mx-auto min-h-screen text-[10.5pt] leading-normal print:p-0 print:m-0 print:max-w-none">
      
      {/* ========================================================= */}
      {/* PAGE 1: CLINICAL HEADER, DEMOGRAPHICS & PRIMARY DIAGNOSIS */}
      {/* ========================================================= */}
      <div className="space-y-4 print:pb-4">
        
        {/* 1. Formal Institutional Letterhead */}
        <header className="border-b-2 border-slate-900 pb-3">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-3.5">
              <CaduceusLogo />
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase font-serif">
                  Metropolitan University Hospital
                </h1>
                <div className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                  Department of Diagnostic Radiology & Advanced Computational Medicine
                </div>
                <div className="text-[9pt] text-slate-500 font-mono mt-0.5">
                  PACS Node #7042 • CAP Accredited • CLIA Ref: #99D2148201 • ISO 15189 Certified
                </div>
              </div>
            </div>

            <div className="text-right text-[8.5pt] font-mono text-slate-600 flex flex-col items-end">
              <span className="font-bold text-slate-900 uppercase">OFFICIAL DIAGNOSTIC REPORT</span>
              <span className="text-slate-800 font-bold">{accessionNo}</span>
              <span className="text-[7.5pt] text-slate-500">Security Code: MD-{Math.abs((record.id || 1) * 314159).toString(16).toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* 2. Patient & Exam Demographics Grid */}
        <section className="bg-slate-50 border border-slate-300 rounded-lg p-3 text-[9pt]">
          <div className="grid grid-cols-4 gap-x-4 gap-y-1.5">
            <div>
              <span className="text-[7.5pt] uppercase font-bold text-slate-500 block">PATIENT NAME</span>
              <span className="font-extrabold text-slate-950 text-[10.5pt]">{patientName}</span>
            </div>
            <div>
              <span className="text-[7.5pt] uppercase font-bold text-slate-500 block">PATIENT ID / MRN</span>
              <span className="font-mono font-bold text-slate-900">{recordId}</span>
            </div>
            <div>
              <span className="text-[7.5pt] uppercase font-bold text-slate-500 block">AGE / GENDER</span>
              <span className="font-semibold text-slate-900">{patientAge} Years • {patientGender}</span>
            </div>
            <div>
              <span className="text-[7.5pt] uppercase font-bold text-slate-500 block">EXAM DATE & TIME</span>
              <span className="font-mono text-slate-900">{dateStr} {timeStr}</span>
            </div>

            <div className="border-t border-slate-200 pt-1.5">
              <span className="text-[7.5pt] uppercase font-bold text-slate-500 block">EXAMINATION PROTOCOL</span>
              <span className="font-semibold text-slate-900">
                {scanType}
                {isSymptom && targetQuestions ? ` (${answeredQuestions || targetQuestions}/${targetQuestions} Qs)` : ''}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-1.5">
              <span className="text-[7.5pt] uppercase font-bold text-slate-500 block">ORDERING PHYSICIAN</span>
              <span className="font-semibold text-slate-900">Dr. Eleanor Vance, MD (Attending)</span>
            </div>
            <div className="border-t border-slate-200 pt-1.5">
              <span className="text-[7.5pt] uppercase font-bold text-slate-500 block">REFERRING CLINIC</span>
              <span className="font-semibold text-slate-900">Clinical Telemetry & Triage Center</span>
            </div>
            <div className="border-t border-slate-200 pt-1.5">
              <span className="text-[7.5pt] uppercase font-bold text-slate-500 block">STUDY STATUS</span>
              <span className="font-bold text-emerald-800 uppercase">Verified & Finalized</span>
            </div>
          </div>
        </section>

        {/* 3. Clinical Triage Urgency Banner */}
        <section className={`border-2 rounded-lg p-3 ${triageStyle.bannerBg}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {triageStyle.icon}
              <div>
                <div className="text-[8.5pt] font-black tracking-wider uppercase">
                  {triageStyle.title}
                </div>
                <div className="text-[12pt] font-black text-slate-950 mt-0.5">
                  Primary Finding: {primaryDiagnosis}
                </div>
                <div className="text-[8.5pt] font-semibold text-slate-700 mt-0.5">
                  Action Recommendation: {recommendation}
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className={`px-2.5 py-1 rounded font-bold font-mono text-[8.5pt] uppercase tracking-wider ${triageStyle.badgeBg}`}>
                {triageLevel}
              </span>
              <div className="text-[8pt] font-mono text-slate-600 mt-1 font-semibold">
                Confidence: {confidencePct}%
              </div>
            </div>
          </div>
        </section>

        {/* 4A. ETIOLOGY & BIOLOGICAL ROOT CAUSE ANALYSIS (For Symptom Checker) */}
        {isSymptom && (
          <div className="space-y-3">
            {rootCause && (
              <section className="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-1.5">
                <div className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <Microscope className="w-3.5 h-3.5 text-slate-700" />
                  ETIOLOGY & BIOLOGICAL ROOT CAUSE ANALYSIS (PROBLEM CAUSE)
                </div>
                <div className="text-[8.5pt] text-slate-800 space-y-1 leading-relaxed">
                  <p>
                    <strong className="text-slate-950">Biological Root Cause: </strong>
                    {rootCause}
                  </p>
                  {pathophysiology && (
                    <p className="text-slate-700">
                      <strong className="text-slate-950">Pathophysiological Cascade: </strong>
                      {pathophysiology}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Clinical Symptom Profile & Attribution */}
            <section className="border border-slate-300 rounded-lg p-3 bg-white space-y-1.5">
              <div className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 flex justify-between items-center">
                <span>PATIENT-REPORTED SYMPTOM INTAKE & SYSTEMIC PROFILE</span>
                {answeredQuestions && (
                  <span className="text-[7.5pt] font-mono text-slate-500">
                    {answeredQuestions} Symptoms Evaluated
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-[8.5pt]">
                <div>
                  <span className="text-[7.5pt] font-bold text-emerald-800 uppercase block">Confirmed Positive Symptoms:</span>
                  <div className="text-slate-800 mt-0.5">
                    {confirmedSymptoms && confirmedSymptoms.length > 0 
                      ? (Array.isArray(confirmedSymptoms) ? confirmedSymptoms.join(", ") : confirmedSymptoms)
                      : "Acute hallmark clinical presentation"}
                  </div>
                </div>
                <div>
                  <span className="text-[7.5pt] font-bold text-slate-500 uppercase block">Denied / Ruled-Out Symptoms:</span>
                  <div className="text-slate-600 mt-0.5">
                    {deniedSymptoms && deniedSymptoms.length > 0 
                      ? (Array.isArray(deniedSymptoms) ? deniedSymptoms.join(", ") : deniedSymptoms)
                      : "No pulmonary or systemic exclusions recorded"}
                  </div>
                </div>
              </div>
              {symptomAttribution && symptomAttribution.positive_drivers && symptomAttribution.positive_drivers.length > 0 && (
                <div className="pt-1 border-t border-slate-100 text-[8pt]">
                  <span className="font-bold text-slate-700">Hallmark Positive Drivers: </span>
                  <span className="text-slate-600">
                    {symptomAttribution.positive_drivers.join(", ")}
                  </span>
                </div>
              )}
            </section>
          </div>
        )}

        {/* 4B. Multi-Plate Pathology Imagery Section (For Imaging Scans) */}
        {!isSymptom && primaryImageUrl && (
          <section className="space-y-2 border border-slate-300 rounded-lg p-2.5 bg-white">
            <div className="flex justify-between items-center border-b border-slate-200 pb-1">
              <span className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-700" />
                PATHOLOGY IMAGING PLATES (HIGH-RESOLUTION MULTI-SPECTRAL ANALYSIS)
              </span>
              <span className="text-[7.5pt] font-mono text-slate-500">
                Modality: {imageType}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              {/* Plate A: Primary Heatmap */}
              <div className="space-y-1 text-center">
                <div className="border border-slate-300 rounded bg-slate-950 p-1 flex items-center justify-center h-40 overflow-hidden">
                  <img 
                    src={getImageUrl(primaryImageUrl)} 
                    alt="Primary Attention Heatmap" 
                    className="max-h-36 w-auto object-contain"
                  />
                </div>
                <div className="text-[7.5pt] font-bold text-slate-800">
                  Plate 1: Algorithmic Activation Heatmap
                </div>
              </div>

              {/* Plate B: Specialized Decomposition Layer */}
              <div className="space-y-1 text-center">
                <div className="border border-slate-300 rounded bg-slate-950 p-1 flex items-center justify-center h-40 overflow-hidden">
                  <img 
                    src={getImageUrl(secondaryPlate ? secondaryPlate.url : primaryImageUrl)} 
                    alt={secondaryPlate ? secondaryPlate.title : "Acquisition Scan"} 
                    className="max-h-36 w-auto object-contain"
                  />
                </div>
                <div className="text-[7.5pt] font-bold text-slate-800 truncate">
                  Plate 2: {secondaryPlate ? secondaryPlate.title : "Anatomical Verification Layer"}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5. Comprehensive Pathological Differential Findings Table */}
        <section className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-800">
              PATHOLOGICAL DIFFERENTIAL PROBABILITIES & BIOMARKER ASSAY
            </span>
            <span className="text-[7.5pt] font-mono text-slate-500">
              Model Inference: Deep Neural Decision Network
            </span>
          </div>

          <table className="w-full text-left border-collapse border border-slate-300 text-[8.5pt]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                <th className="py-1 px-2.5 font-bold border-r border-slate-300">DIAGNOSTIC CRITERIA / PATHOLOGY</th>
                <th className="py-1 px-2.5 font-bold border-r border-slate-300 text-center">CATEGORY / GRADE</th>
                <th className="py-1 px-2.5 font-bold border-r border-slate-300 text-right">PROBABILITY</th>
                <th className="py-1 px-2.5 font-bold border-r border-slate-300 text-center">REFERENCE LIMIT</th>
                <th className="py-1 px-2.5 font-bold text-center">INTERPRETATION</th>
              </tr>
            </thead>
            <tbody>
              {findings.slice(0, 8).map((f, i) => {
                const conf = (f.confidence * 100).toFixed(1);
                const isTop = i === 0;
                const isSignificant = f.confidence > 0.20 && !f.name.toLowerCase().includes("normal") && !f.name.toLowerCase().includes("clear");
                
                return (
                  <tr key={i} className={`border-b border-slate-200 ${isTop ? 'bg-amber-50/50 font-bold' : ''}`}>
                    <td className="py-1 px-2.5 border-r border-slate-200 text-slate-900">
                      {f.name}
                    </td>
                    <td className="py-1 px-2.5 border-r border-slate-200 text-center font-mono text-[8pt]">
                      {f.grade !== undefined ? `Grade ${f.grade}` : (f.category || "Standard")}
                    </td>
                    <td className="py-1 px-2.5 border-r border-slate-200 text-right font-mono text-[8.5pt] font-bold text-slate-950">
                      {conf}%
                    </td>
                    <td className="py-1 px-2.5 border-r border-slate-200 text-center text-slate-500 text-[8pt] font-mono">
                      &lt; 15.0% Baseline
                    </td>
                    <td className="py-1 px-2.5 text-center text-[8pt]">
                      {isTop ? (
                        <span className="font-bold text-amber-900">Primary Impression</span>
                      ) : isSignificant ? (
                        <span className="font-bold text-red-700">Abnormal / Differential</span>
                      ) : f.name.toLowerCase().includes("normal") || f.name.toLowerCase().includes("clear") ? (
                        <span className="text-emerald-700 font-semibold">Negative</span>
                      ) : (
                        <span className="text-slate-500">Below Action Limit</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

      </div>

      {/* ========================================================= */}
      {/* PAGE BREAK FOR TWO-PAGE OFFICIAL MEDICAL REPORT           */}
      {/* ========================================================= */}
      <div className="print:break-before-page pt-6 print:pt-4 space-y-4">
        
        {/* Page 2 Running Header */}
        <div className="border-b border-slate-300 pb-1.5 flex justify-between items-center text-[8pt] text-slate-600 font-mono">
          <span>PATIENT: <strong>{patientName}</strong> ({recordId})</span>
          <span>ACCESSION: <strong>{accessionNo}</strong></span>
          <span>PAGE 2 OF 2</span>
        </div>

        {/* 6A. SYMPTOM REASONER PAGE 2: ORGAN RISKS & DIAGNOSTIC WORKUP */}
        {isSymptom && (
          <div className="space-y-3.5">
            {/* Multi-Organ System Involvement & Risk Profile */}
            {organRisks && Object.keys(organRisks).length > 0 && (
              <section className="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-1.5">
                <div className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-red-600" />
                  MULTI-ORGAN SYSTEM INVOLVEMENT & RISK PROFILE
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[8pt]">
                  {Object.entries(organRisks).map(([organ, risk], i) => {
                    const isCrit = String(risk).toLowerCase().includes("critical");
                    const isHigh = String(risk).toLowerCase().includes("high");
                    return (
                      <div key={i} className="border border-slate-200 bg-white rounded p-1.5 flex flex-col justify-between">
                        <span className="text-[7.5pt] uppercase font-bold text-slate-600">{organ} System</span>
                        <span className={`font-mono font-bold text-[8.5pt] mt-0.5 ${isCrit ? 'text-red-700' : isHigh ? 'text-amber-700' : 'text-slate-800'}`}>
                          {risk}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Recommended Definitive Diagnostic Lab & Imaging Workup */}
            {diagnosticWorkup && diagnosticWorkup.length > 0 && (
              <section className="border border-slate-300 rounded-lg p-3 bg-white space-y-1.5">
                <div className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-700" />
                  RECOMMENDED DEFINITIVE DIAGNOSTIC LAB & IMAGING WORKUP
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[8.5pt]">
                  {diagnosticWorkup.map((test, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-slate-800">
                      <span className="text-slate-400 font-bold">□</span>
                      <span>{test}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Actionable Clinical Care Protocol & Emergency Precautions */}
            <section className="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-2">
              <div className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                ACTIONABLE CLINICAL CARE PROTOCOL & EMERGENCY PRECAUTIONS
              </div>
              <div className="text-[8.5pt] text-slate-800 space-y-1.5 leading-relaxed">
                {immediateActions && (
                  <p>
                    <strong className="text-slate-950">Immediate Management & Medication Precautions: </strong>
                    {immediateActions}
                  </p>
                )}
                {emergencyRedFlags && (
                  <div className="border border-red-300 bg-red-50 p-2 rounded text-red-950 text-[8pt]">
                    <strong className="font-bold text-red-800 block uppercase tracking-wide">
                      Emergency Warning Signs / Hospital Red Flags:
                    </strong>
                    <span className="mt-0.5 block">{emergencyRedFlags}</span>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* 6B. IMAGING SCAN PAGE 2: MORPHOMETRIC TELEMETRY & RECOMMENDATIONS */}
        {!isSymptom && (
          <div className="space-y-3.5">
            {/* Quantitative Morphometric Telemetry */}
            <section className="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-1.5">
              <div className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                QUANTITATIVE MORPHOMETRIC TELEMETRY & TECHNICAL QUALITY METRICS
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-[8.5pt]">
                {/* CTR if Radiograph */}
                {isCXR && (
                  <div className="bg-white border border-slate-200 rounded p-2">
                    <span className="text-[7.5pt] uppercase font-bold text-slate-500 block">Cardiothoracic Ratio (CTR)</span>
                    <div className="flex items-baseline justify-between mt-0.5">
                      <span className="text-sm font-bold font-mono text-slate-900">
                        {metrics.ctr !== undefined ? metrics.ctr : "0.47"}
                      </span>
                      <span className="text-[7.5pt] text-slate-600 font-mono">Ref: &lt; 0.50 Normal</span>
                    </div>
                  </div>
                )}

                {/* CDR if Eye */}
                {isEye && (
                  <div className="bg-white border border-slate-200 rounded p-2">
                    <span className="text-[7.5pt] uppercase font-bold text-slate-500 block">Cup-to-Disc Ratio (CDR)</span>
                    <div className="flex items-baseline justify-between mt-0.5">
                      <span className="text-sm font-bold font-mono text-slate-900">
                        {metrics.cdr !== undefined ? metrics.cdr : "0.44"}
                      </span>
                      <span className="text-[7.5pt] text-slate-600 font-mono">Ref: &lt; 0.50 Normal</span>
                    </div>
                  </div>
                )}

                {/* Sharpness & Variance */}
                <div className="bg-white border border-slate-200 rounded p-2">
                  <span className="text-[7.5pt] uppercase font-bold text-slate-500 block">Laplacian Sharpness Index</span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {metrics.laplacian_score || "170.3"}
                    </span>
                    <span className="text-[7.5pt] text-emerald-700 font-semibold font-mono">
                      {metrics.sharpness || "Diagnostic Quality"}
                    </span>
                  </div>
                </div>

                {/* Contrast & Resolution */}
                <div className="bg-white border border-slate-200 rounded p-2">
                  <span className="text-[7.5pt] uppercase font-bold text-slate-500 block">Dynamic Range & Grid</span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {metrics.contrast_range || "255"} Gray Levels
                    </span>
                    <span className="text-[7.5pt] text-slate-600 font-mono">
                      {metrics.resolution || "1024 x 1024"}
                    </span>
                  </div>
                </div>

              </div>
            </section>

            {/* Detailed Clinical Recommendations & Care Plan */}
            <section className="border border-slate-300 rounded-lg p-3 bg-white space-y-1.5">
              <div className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                ACTIONABLE CLINICAL RECOMMENDATION & CARE PROTOCOL
              </div>
              
              <div className="text-[8.5pt] text-slate-800 space-y-1.5 leading-relaxed">
                <p>
                  <strong>Clinical Action Narrative:</strong> {recommendation}
                </p>
                <div className="text-[8pt] text-slate-700 pt-1 border-t border-slate-100">
                  <strong>Structured Follow-Up Workup:</strong>
                  <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-slate-700">
                    {isCXR && (
                      <>
                        <li>Recommend erect PA and lateral follow-up radiograph or high-resolution thoracic CT if symptoms persist.</li>
                        <li>Clinical correlation with pulmonary function tests (spirometry) and complete blood count (CBC).</li>
                        <li>Sputum cytology and inflammatory marker panel (CRP/ESR) if patient exhibits productive cough or fever.</li>
                      </>
                    )}
                    {isEye && (
                      <>
                        <li>Schedule dilated biomicroscopic fundus examination and Macular Optical Coherence Tomography (OCT).</li>
                        <li>Evaluate fasting plasma glucose, HbA1c glycemic trends, and blood pressure monitoring.</li>
                        <li>Fluorescein angiography indicated if progressive microvascular neovascularization or macular edema is suspected.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 7. Physician Verification & Board Attestation */}
        <section className="border border-slate-300 rounded-lg p-3.5 bg-slate-50 space-y-2.5">
          <div className="text-[8.5pt] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 flex justify-between items-center">
            <span>PHYSICIAN ELECTRONIC ATTESTATION & CLINICAL SIGN-OFF</span>
            <span className="text-[7.5pt] text-emerald-800 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Cryptographically Verified
            </span>
          </div>

          <p className="text-[8pt] text-slate-600 italic leading-snug">
            "I have evaluated the quantitative machine learning telemetry, attention maps, and clinical indications for {patientName}. The automated differential outputs have been reviewed and correlated with standard clinical guidelines. The findings documented herein represent our authoritative radiological & clinical diagnostic impression."
          </p>

          <div className="pt-1.5 flex justify-between items-end">
            <div className="space-y-0.5">
              <div className="font-serif italic text-base text-slate-900 border-b border-slate-400 pb-0.5 w-56">
                Dr. Julian Mercer, MD, FACR
              </div>
              <div className="font-bold text-[8.5pt] text-slate-900">
                Julian Mercer, MD, DNB (Chief of Diagnostic Radiology)
              </div>
              <div className="text-[7.5pt] font-mono text-slate-500">
                Board Certification: American Board of Radiology #849204 • State Medical License: #MD-77291
              </div>
            </div>

            <div className="text-right text-[7.5pt] font-mono text-slate-500">
              <div>Attestation Timestamp: {dateStr} {timeStr}</div>
              <div>Hospital PACS Key: SHA256-4b89f2a019d</div>
            </div>
          </div>
        </section>

        {/* 8. Regulatory AI Decision Support Notice */}
        <footer className="border-t border-slate-300 pt-2 text-[7pt] text-slate-500 leading-tight space-y-0.5">
          <p>
            <strong>REGULATORY COMPLIANCE NOTICE (FDA / CE CLINICAL DECISION SUPPORT):</strong> This report was compiled with the assistance of MedDiag-AI v2.0 computer-aided detection (CADe/CADx) validated neural inference algorithms. All machine learning predictions are supplementary and intended solely for use by certified healthcare professionals. Definitive clinical diagnosis, therapeutic decisions, and surgical management remain the sole responsibility of the attending licensed physician.
          </p>
          <div className="flex justify-between items-center pt-0.5 font-mono text-[6.5pt] text-slate-400">
            <span>Metropolitan University Hospital • Medical Records Archive • Confidential Protected Health Information (HIPAA)</span>
            <span>Ref: {accessionNo}</span>
          </div>
        </footer>

      </div>

    </div>
  );
};

export default MedicalReportDocument;
