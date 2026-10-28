import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_BASE_URL, getImageUrl } from '../apiConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Trash2, 
  Printer, 
  Calendar, 
  RefreshCw,
  LayoutGrid,
  ChevronDown,
  Eye,
  Activity,
  BrainCircuit,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  X,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import TriageBanner from '../components/TriageBanner';
import MedicalReportDocument from '../components/MedicalReportDocument';
import ReportPreviewModal from '../components/ReportPreviewModal';

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

const getInitials = (name) => {
  if (!name) return "PT";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = [
    { bg: "bg-[#0d3349]", text: "text-[#38bdf8]" },
    { bg: "bg-[#281c47]", text: "text-[#c084fc]" },
    { bg: "bg-[#38260d]", text: "text-[#fbbf24]" },
    { bg: "bg-[#13382c]", text: "text-[#34d399]" },
    { bg: "bg-[#381622]", text: "text-[#fb7185]" }
  ];
  let sum = 0;
  for (let i = 0; i < (name || "").length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

const getModuleIcon = (scanType = "") => {
  const lower = scanType.toLowerCase();
  if (lower.includes("chest") || lower.includes("cxr") || lower.includes("radiograph")) {
    return <LungsIcon className="w-4 h-4 text-cyan-400" />;
  }
  if (lower.includes("diabetic") || lower.includes("dr")) {
    return <Activity className="w-4 h-4 text-cyan-400" />;
  }
  if (lower.includes("ophthalmic") || lower.includes("eye")) {
    return <Eye className="w-4 h-4 text-cyan-400" />;
  }
  if (lower.includes("symptom")) {
    return <BrainCircuit className="w-4 h-4 text-cyan-400" />;
  }
  return <FileText className="w-4 h-4 text-cyan-400" />;
};

const getShortModuleName = (scanType = "") => {
  const lower = scanType.toLowerCase();
  if (lower.includes("chest") || lower.includes("cxr")) return "Chest Radiograph";
  if (lower.includes("diabetic")) return "Diabetic Retinopathy";
  if (lower.includes("ophthalmic")) return "Ophthalmic Screening";
  if (lower.includes("symptom")) return "Symptom Differential";
  return scanType.split("(")[0].trim();
};

const triageSeverityRank = {
  urgent: 3,
  monitor: 2,
  routine: 1
};

const Dashboard = () => {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeCopyUrl, setActiveCopyUrl] = useState(null);
  const [activeCopyTitle, setActiveCopyTitle] = useState("Primary Heatmap");
  
  // Search, Filter & Sort States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModule, setFilterModule] = useState("all");
  const [filterTriage, setFilterTriage] = useState("all"); // "all", "urgent", "monitor", "routine"
  const [sortBy, setSortBy] = useState("date"); // "date", "name", "module", "confidence", "triage", "id"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc", "desc"
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [nowDate, setNowDate] = useState({ date: "Oct 14, 2026", time: "10:24 AM" });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setNowDate({
        date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/records`);
      setRecords(res.data);
      if (res.data.length > 0) {
        if (!selectedRecord || !res.data.find(r => r.id === selectedRecord.id)) {
          setSelectedRecord(res.data[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load records:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (selectedRecord) {
      setActiveCopyUrl(selectedRecord.processed_image_url || null);
      setActiveCopyTitle("Primary Heatmap");
    }
  }, [selectedRecord]);

  const deleteRecord = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete patient record #${id}?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/records/${id}`);
      const updated = records.filter(r => r.id !== id);
      setRecords(updated);
      if (selectedRecord && selectedRecord.id === id) {
        setSelectedRecord(updated.length > 0 ? updated[0] : null);
      }
    } catch (err) {
      alert("Failed to delete record: " + (err.response?.data?.detail || err.message));
    }
  };

  // Toggle Column Sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder(column === "name" || column === "module" ? "asc" : "desc");
    }
  };

  // Triage Counts for Quick Chips
  const triageCounts = useMemo(() => {
    return {
      all: records.length,
      urgent: records.filter(r => (r.triage_level || "").toLowerCase() === "urgent").length,
      monitor: records.filter(r => (r.triage_level || "").toLowerCase() === "monitor").length,
      routine: records.filter(r => (r.triage_level || "").toLowerCase() === "routine").length,
    };
  }, [records]);

  // Combined Search, Filter and Sort
  const processedRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return records
      .filter((r) => {
        // 1. Search Filter across patient name, ID, diagnosis, module, triage, and recommendations
        const matchSearch =
          !term ||
          (r.patient_name || "").toLowerCase().includes(term) ||
          (r.diagnosis || "").toLowerCase().includes(term) ||
          (r.scan_type || "").toLowerCase().includes(term) ||
          (r.triage_level || "").toLowerCase().includes(term) ||
          (r.clinical_recommendation || "").toLowerCase().includes(term) ||
          String(r.id).includes(term) ||
          `#${String(r.id).padStart(5, '0')}`.toLowerCase().includes(term);

        // 2. Module Filter
        const matchModule =
          filterModule === "all" ||
          (r.scan_type || "").toLowerCase().includes(filterModule.toLowerCase());

        // 3. Triage Status Filter
        const matchTriage =
          filterTriage === "all" ||
          (r.triage_level || "").toLowerCase() === filterTriage.toLowerCase();

        return matchSearch && matchModule && matchTriage;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === "date") {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          comparison = timeA - timeB;
        } else if (sortBy === "name") {
          comparison = (a.patient_name || "").localeCompare(b.patient_name || "");
        } else if (sortBy === "module") {
          comparison = (a.scan_type || "").localeCompare(b.scan_type || "");
        } else if (sortBy === "diagnosis") {
          comparison = (a.diagnosis || "").localeCompare(b.diagnosis || "");
        } else if (sortBy === "confidence") {
          comparison = (a.confidence || 0) - (b.confidence || 0);
        } else if (sortBy === "triage") {
          const rankA = triageSeverityRank[(a.triage_level || "routine").toLowerCase()] || 0;
          const rankB = triageSeverityRank[(b.triage_level || "routine").toLowerCase()] || 0;
          comparison = rankA - rankB;
        } else if (sortBy === "id") {
          comparison = (a.id || 0) - (b.id || 0);
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [records, searchTerm, filterModule, filterTriage, sortBy, sortOrder]);

  // Keep selected record in sync with filtered list
  useEffect(() => {
    if (processedRecords.length > 0) {
      if (!selectedRecord || !processedRecords.some(r => r.id === selectedRecord.id)) {
        setSelectedRecord(processedRecords[0]);
      }
    }
  }, [processedRecords]);

  // Check if any filter is active
  const hasActiveFilters = searchTerm !== "" || filterModule !== "all" || filterTriage !== "all" || sortBy !== "date" || sortOrder !== "desc";

  const resetAllFilters = () => {
    setSearchTerm("");
    setFilterModule("all");
    setFilterTriage("all");
    setSortBy("date");
    setSortOrder("desc");
  };

  return (
    <>
      <div className="p-6 md:p-8 w-full h-full overflow-y-auto bg-[#060b13] text-slate-100 no-print screen-only">
        <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-1 no-print">
          <div>
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest mb-1">
              CLINICAL REGISTRY DATABASE
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Patient Diagnostic Records</h2>
            <p className="text-[#718da8] text-xs sm:text-sm mt-0.5">
              Historical archive of deep learning diagnostic screenings, pathological findings, and triage logs.
            </p>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            <div className="hidden sm:flex items-center gap-2.5 text-right font-mono">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div className="text-xs">
                <div className="text-white font-medium">{nowDate.date}</div>
                <div className="text-[10px] text-slate-400">{nowDate.time}</div>
              </div>
            </div>

            <button 
              onClick={fetchRecords} 
              disabled={loading}
              className="btn-secondary text-xs px-3.5 py-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} /> 
              <span>Refresh Registry</span>
            </button>
          </div>
        </div>

        {/* Filter, Search & Sort Toolbar */}
        <div className="space-y-3 no-print">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            {/* 1. Search Input Bar (6 Cols on desktop) */}
            <div className="md:col-span-6 glass-input flex items-center gap-2.5 px-3.5 py-2.5 bg-[#0c1726] border-[#1a2d45] rounded-xl relative group">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0 group-focus-within:text-cyan-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search patient name, ID, diagnosis, triage..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder-slate-500 w-full"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Diagnostic Module Filter (3 Cols on desktop) */}
            <div className="md:col-span-3 relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <select 
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="glass-input pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#0c1726] border-[#1a2d45] rounded-xl appearance-none cursor-pointer text-slate-200"
              >
                <option value="all" className="bg-[#0a1322]">All Diagnostic Modules</option>
                <option value="ophthalmic" className="bg-[#0a1322]">Ophthalmic Screening (TF)</option>
                <option value="diabetic" className="bg-[#0a1322]">Diabetic Retinopathy (PyTorch)</option>
                <option value="chest" className="bg-[#0a1322]">Chest Radiograph (ONNX)</option>
                <option value="symptom" className="bg-[#0a1322]">Symptom Differential (AI)</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* 3. Sort Order Selector (3 Cols on desktop) */}
            <div className="md:col-span-3 relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="glass-input pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#0c1726] border-[#1a2d45] rounded-xl appearance-none cursor-pointer text-slate-200"
              >
                <option value="date-desc" className="bg-[#0a1322]">Date (Newest First)</option>
                <option value="date-asc" className="bg-[#0a1322]">Date (Oldest First)</option>
                <option value="triage-desc" className="bg-[#0a1322]">Triage (Urgent First)</option>
                <option value="triage-asc" className="bg-[#0a1322]">Triage (Routine First)</option>
                <option value="confidence-desc" className="bg-[#0a1322]">Confidence (Highest First)</option>
                <option value="confidence-asc" className="bg-[#0a1322]">Confidence (Lowest First)</option>
                <option value="name-asc" className="bg-[#0a1322]">Patient Name (A → Z)</option>
                <option value="name-desc" className="bg-[#0a1322]">Patient Name (Z → A)</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

          </div>

          {/* Quick Triage Filter Chips & Results Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#52799c] tracking-wider mr-1">
                Triage Filter:
              </span>

              {/* All */}
              <button
                onClick={() => setFilterTriage("all")}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                  filterTriage === "all"
                    ? "bg-[#0e273c] text-cyan-400 border border-cyan-500 shadow-[0_0_10px_rgba(0,229,255,0.2)]"
                    : "bg-[#0c1726] text-slate-400 border border-[#162842] hover:text-white"
                }`}
              >
                All ({triageCounts.all})
              </button>

              {/* Urgent */}
              <button
                onClick={() => setFilterTriage("urgent")}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  filterTriage === "urgent"
                    ? "bg-[#450a0a] text-red-400 border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] ring-1 ring-red-500"
                    : "bg-[#0c1726] text-slate-400 border border-[#162842] hover:text-red-300"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Urgent ({triageCounts.urgent})
              </button>

              {/* Monitor */}
              <button
                onClick={() => setFilterTriage("monitor")}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  filterTriage === "monitor"
                    ? "bg-[#451a03] text-amber-400 border border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)] ring-1 ring-amber-500"
                    : "bg-[#0c1726] text-slate-400 border border-[#162842] hover:text-amber-300"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Monitor ({triageCounts.monitor})
              </button>

              {/* Routine */}
              <button
                onClick={() => setFilterTriage("routine")}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  filterTriage === "routine"
                    ? "bg-[#052e16] text-emerald-400 border border-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.3)] ring-1 ring-emerald-500"
                    : "bg-[#0c1726] text-slate-400 border border-[#162842] hover:text-emerald-300"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Routine ({triageCounts.routine})
              </button>
            </div>

            {/* Results count & Reset button */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">
                Showing <strong className="text-cyan-400">{processedRecords.length}</strong> of {records.length} records
              </span>

              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline font-mono"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT TABLE (7 Columns) */}
          <div className="lg:col-span-7 bg-[#0a1322] border border-[#162842] rounded-2xl p-4 min-h-[550px] flex flex-col no-print">
            <div className="overflow-x-auto flex-1">
              <table className="glass-table text-left w-full">
                <thead>
                  <tr className="border-b border-[#162842]">
                    {/* PATIENT COLUMN */}
                    <th 
                      onClick={() => handleSort("name")}
                      className="py-2.5 px-3 cursor-pointer hover:text-cyan-400 select-none transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>PATIENT</span>
                        {sortBy === "name" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-cyan-400" /> : <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </th>

                    {/* MODULE COLUMN */}
                    <th 
                      onClick={() => handleSort("module")}
                      className="py-2.5 px-3 cursor-pointer hover:text-cyan-400 select-none transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>MODULE</span>
                        {sortBy === "module" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-cyan-400" /> : <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </th>

                    {/* DIAGNOSIS / CONFIDENCE COLUMN */}
                    <th 
                      onClick={() => handleSort("confidence")}
                      className="py-2.5 px-3 cursor-pointer hover:text-cyan-400 select-none transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>DIAGNOSIS</span>
                        {sortBy === "confidence" || sortBy === "diagnosis" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-cyan-400" /> : <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </th>

                    {/* TRIAGE COLUMN */}
                    <th 
                      onClick={() => handleSort("triage")}
                      className="py-2.5 px-3 cursor-pointer hover:text-cyan-400 select-none transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>TRIAGE</span>
                        {sortBy === "triage" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-cyan-400" /> : <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </th>

                    {/* DATE COLUMN */}
                    <th 
                      onClick={() => handleSort("date")}
                      className="py-2.5 px-3 cursor-pointer hover:text-cyan-400 select-none transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>DATE</span>
                        {sortBy === "date" ? (
                          sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-cyan-400" /> : <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60 group-hover:opacity-100" />
                        )}
                      </div>
                    </th>

                    <th className="py-2.5 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {processedRecords.map((rec) => {
                    const isSelected = selectedRecord && selectedRecord.id === rec.id;
                    const isUrgent = (rec.triage_level || "").toLowerCase() === 'urgent';
                    const isMonitor = (rec.triage_level || "").toLowerCase() === 'monitor';
                    const initials = getInitials(rec.patient_name);
                    const avatarColor = getAvatarColor(rec.patient_name);
                    
                    return (
                      <tr 
                        key={rec.id} 
                        onClick={() => setSelectedRecord(rec)}
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-[#0e273c] border border-cyan-500/80 rounded-xl shadow-[0_0_12px_rgba(0,229,255,0.1)]' 
                            : 'hover:bg-white/[0.03] border border-transparent rounded-xl'
                        }`}
                      >
                        {/* PATIENT */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full ${avatarColor.bg} ${avatarColor.text} font-bold text-xs flex items-center justify-center flex-shrink-0 font-mono`}>
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-white text-xs sm:text-sm tracking-tight">{rec.patient_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">#{String(rec.id).padStart(5, '0')}</div>
                            </div>
                          </div>
                        </td>

                        {/* MODULE */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2 text-slate-300 text-xs">
                            {getModuleIcon(rec.scan_type)}
                            <span className="truncate">{getShortModuleName(rec.scan_type)}</span>
                          </div>
                        </td>

                        {/* DIAGNOSIS */}
                        <td className="py-3 px-3">
                          <div className={`text-xs font-bold leading-tight ${
                            isUrgent ? 'text-[#f87171]' : isMonitor ? 'text-[#facc15]' : 'text-cyan-400'
                          }`}>
                            {rec.diagnosis}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {rec.confidence ? (rec.confidence * 100).toFixed(1) : "—"}% confidence
                          </div>
                        </td>

                        {/* TRIAGE */}
                        <td className="py-3 px-3">
                          <span className={
                            isUrgent 
                              ? 'badge-urgent' 
                              : isMonitor 
                              ? 'badge-monitor' 
                              : 'badge-routine'
                          }>
                            {rec.triage_level || 'routine'}
                          </span>
                        </td>

                        {/* DATE */}
                        <td className="py-3 px-3 whitespace-nowrap text-xs text-slate-400 font-mono">
                          <div>{new Date(rec.timestamp).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* ACTION */}
                        <td className="py-3 px-3 text-right">
                          <button 
                            onClick={(e) => deleteRecord(rec.id, e)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete Record"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {processedRecords.length === 0 && !loading && (
                <div className="py-24 text-center text-slate-500 text-xs sm:text-sm space-y-2">
                  <div className="text-slate-400 font-semibold">No matching patient records found.</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting your search query, switching diagnostic module filter, or clearing the triage status.
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={resetAllFilters}
                      className="btn-secondary text-xs mt-2 px-3 py-1.5 inline-flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT DETAIL PANEL (5 Columns) */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {selectedRecord ? (
                <motion.div 
                  key={selectedRecord.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-[#0a1322] border border-[#162842] rounded-2xl p-6 space-y-5"
                >
                  {/* Detail Header */}
                  <div className="flex justify-between items-start pb-2">
                    <div>
                      <div className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider uppercase">
                        RECORD #{String(selectedRecord.id).padStart(5, '0')}
                      </div>
                      <h3 className="text-2xl font-black text-white mt-0.5 tracking-tight">
                        {selectedRecord.patient_name}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5 font-medium">
                        {selectedRecord.patient_age || 45} yrs • {selectedRecord.patient_gender || "Other"}
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
                        className="btn-secondary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 border-cyan-500/40 hover:bg-cyan-950/40 text-cyan-400"
                        title="Print Official Medical Report"
                      >
                        <Printer className="w-3.5 h-3.5 text-cyan-400" /> Print Report
                      </button>
                    </div>
                  </div>

                  {/* Triage Banner */}
                  <TriageBanner 
                    level={selectedRecord.triage_level || 'routine'}
                    primaryDiagnosis={selectedRecord.diagnosis}
                    actionText={selectedRecord.clinical_recommendation}
                  />

                  {/* Pathology Heatmap Viewer */}
                  {(selectedRecord.processed_image_url || activeCopyUrl) && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                          PATHOLOGY HEATMAP
                        </span>
                        <span className="font-mono text-cyan-400 text-[10px]">
                          {selectedRecord.image_type || "Monochrome / Clinical Radiograph"}
                        </span>
                      </div>

                      {/* Heatmap with Focus Bar */}
                      <div className="rounded-xl overflow-hidden border border-[#162842] bg-[#070d18] p-3 flex items-center justify-center relative min-h-[220px]">
                        <img 
                          src={getImageUrl(activeCopyUrl || selectedRecord.processed_image_url)} 
                          alt="Processed Clinical Scan" 
                          className="max-h-56 w-auto object-contain rounded-lg transition-all"
                        />
                        
                        {/* Focus Colorbar on Right */}
                        <div className="absolute right-3 top-4 bottom-4 flex flex-col items-center justify-between text-[8px] font-mono text-slate-400 select-none">
                          <span className="text-red-400 font-bold">High Focus</span>
                          <div className="w-2 flex-1 my-1 rounded-full bg-gradient-to-b from-red-500 via-yellow-400 via-green-400 via-cyan-400 to-blue-600 shadow"></div>
                          <span className="text-blue-400 font-bold">Low Focus</span>
                        </div>
                      </div>

                      {/* Multi-Copy Thumbnails Selector */}
                      {selectedRecord.multi_copies && selectedRecord.multi_copies.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Pathology Layer Decomposition ({selectedRecord.multi_copies.length + 1})
                          </div>
                          <div className="grid grid-cols-5 gap-1.5">
                            {/* Primary Heatmap button */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveCopyUrl(selectedRecord.processed_image_url);
                                setActiveCopyTitle("Primary Heatmap");
                              }}
                              className={`p-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                                activeCopyUrl === selectedRecord.processed_image_url
                                  ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                                  : 'bg-[#0c1726] border-[#162842] hover:border-slate-600'
                              }`}
                            >
                              <img src={getImageUrl(selectedRecord.processed_image_url)} alt="Heatmap" className="w-full h-8 object-cover rounded" />
                              <span className="text-[8px] text-cyan-400 font-bold truncate w-full text-center">Heatmap</span>
                            </button>

                            {/* Additional specialized copies */}
                            {selectedRecord.multi_copies.map((c) => (
                              <button
                                key={c.key}
                                type="button"
                                onClick={() => {
                                  setActiveCopyUrl(c.url);
                                  setActiveCopyTitle(c.title);
                                }}
                                className={`p-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                                  activeCopyUrl === c.url
                                    ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                                    : 'bg-[#0c1726] border-[#162842] hover:border-slate-600'
                                }`}
                              >
                                <img src={getImageUrl(c.url)} alt={c.title} className="w-full h-8 object-cover rounded" />
                                <span className="text-[8px] text-slate-300 font-bold truncate w-full text-center">
                                  {c.key === "vasculature" ? "Vessels" :
                                   c.key === "hemorrhages" ? "Hemorrhages" :
                                   c.key === "exudates" ? "Exudates" :
                                   c.key === "optic_nerve" ? "Optic CDR" :
                                   c.key === "anatomy_ctr" ? "CTR & Ribs" :
                                   c.key === "consolidation" ? "Airspace" :
                                   c.key === "pleural" ? "Pleural" :
                                   c.key === "infiltration" ? "Infiltration" : c.key}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pathological Findings Section */}
                  <div className="space-y-3 pt-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex justify-between items-center">
                      <span>PATHOLOGICAL FINDINGS</span>
                    </div>

                    <div className="space-y-2.5">
                      {selectedRecord.findings && selectedRecord.findings.length > 0 ? (
                        selectedRecord.findings.map((f, i) => {
                          const confPct = (f.confidence * 100).toFixed(1);
                          let barGradient = "bg-gradient-to-r from-teal-400 to-cyan-400";
                          if (i === 1) barGradient = "bg-gradient-to-r from-cyan-500 to-blue-500";
                          else if (i === 2) barGradient = "bg-gradient-to-r from-indigo-500 to-purple-500";
                          else if (i >= 3) barGradient = "bg-gradient-to-r from-purple-500 to-pink-500";

                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-200 font-medium">{f.name}</span>
                                <span className="font-mono text-cyan-400 font-bold">{confPct}%</span>
                              </div>
                              <div className="w-full bg-[#0c1726] h-1.5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.max(f.confidence * 100, 2)}%` }}
                                  transition={{ duration: 0.6, delay: i * 0.05 }}
                                  className={`h-full ${barGradient} rounded-full`}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-slate-500 italic">No specific sub-finding telemetry recorded.</div>
                      )}
                    </div>
                  </div>

                </motion.div>
              ) : (
                <div className="bg-[#0a1322] border border-[#162842] rounded-2xl p-10 min-h-[450px] flex flex-col items-center justify-center text-center text-slate-500">
                  <FileText className="w-12 h-12 mb-3 text-cyan-400/40" />
                  <p className="text-sm text-slate-400 max-w-xs">
                    Select any patient record from the registry table to inspect the deep learning diagnostic report and pathology heatmap.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>

      {/* Screen Preview Modal */}
      <ReportPreviewModal 
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        record={selectedRecord}
      />

      {/* Dedicated Print-Only Document */}
      <div className="print-only">
        {selectedRecord && <MedicalReportDocument record={selectedRecord} />}
      </div>
    </>
  );
};

export default Dashboard;
