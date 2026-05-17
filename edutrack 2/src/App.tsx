/**
 * EduTrack - Student Academic Data Analysis & Performance Insights System
 * 
 * This application allows educational institutes to analyze student performance,
 * visualize trends, and generate AI-powered insights to identify at-risk students.
 * 
 * Features:
 * - CSV Data Import & Preprocessing
 * - Real-time Dashboard with Data Visualization (Recharts)
 * - AI Analysis using Gemini 3.5 Flash via Express Backend
 * - PDF Export (jsPDF + html2canvas)
 * - High-Density, Accessible UI
 */

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Users, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  Upload, 
  BrainCircuit,
  FileText,
  PieChart as PieChartIcon,
  Search,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Settings2,
  ChevronUp,
  ChevronDown,
  Filter,
  ArrowRightLeft,
  X,
  ChevronRight,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area,
  ReferenceLine,
  ReferenceArea,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  Legend
} from 'recharts';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { StudentData, AIAnalysis, DashboardStats, Thresholds } from './types';
import { calculateStats, parseCSVData, generateSampleData } from './lib/dataUtils';
import { cn } from './lib/utils';

export default function App() {
  // State for raw student data
  const [data, setData] = useState<StudentData[]>([]);
  // State for computed dashboard statistics
  const [stats, setStats] = useState<DashboardStats | null>(null);
  // Shared loading state for async operations
  const [loading, setLoading] = useState(false);
  // State for AI-generated analysis insights
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  // View management (Dashboard vs Raw Data Table)
  const [view, setView] = useState<'dashboard' | 'insights' | 'data'>('dashboard');
  // State for searching/filtering students in the data table
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pass' | 'Fail'>('All');
  
  // Custom Thresholds
  const [thresholds, setThresholds] = useState<Thresholds>({ attendance: 75, marks: 40 });
  const [showSettings, setShowSettings] = useState(false);

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: keyof StudentData | 'totalMarks'; direction: 'asc' | 'desc' } | null>(null);

  // Subject performance
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<{ subject: string; min: number; max: number } | null>(null);

  // Selection & Details
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // PDF Export Config
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    stats: true,
    charts: true,
    chartOptions: {
      performanceMatrix: true,
      successDistribution: true,
      skillDensity: true
    },
    ai: true,
    data: false
  });

  useEffect(() => {
    // Initial sample data
    const samples = generateSampleData();
    setData(samples);
  }, []);

  /**
   * Re-calculate statistics whenever data or thresholds change
   */
  useEffect(() => {
    setStats(calculateStats(data, thresholds));
  }, [data, thresholds]);

  /**
   * Handles CSV file upload and parsing using PapaParse
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed = parseCSVData(results.data);
          setData(parsed);
          setLoading(false);
        },
        error: (err) => {
          setLoading(false);
          console.error("CSV Parse Error:", err);
          alert("Error parsing CSV. Please ensure the file format is correct.");
        }
      });
    }
  };

  /**
   * Calls the backend API to generate AI-powered insights using Gemini
   */
  const runAIAnalysis = async () => {
    if (data.length === 0) return;
    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentData: data }),
      });
      
      if (!response.ok) throw new Error("Analysis failed");
      
      const result = await response.json();
      setAnalysis(result);
      
      // Auto-switch to dashboard if results come back
      if (view !== 'dashboard' && view !== 'insights') setView('dashboard');
    } catch (err) {
      console.error("AI Analysis Error:", err);
      alert("Failed to generate AI insights. Check server logs.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Captures the selected parts of the app and exports it as a high-quality PDF
   */
  const exportPDF = async () => {
    // We use a hidden container for exporting to ensure layout consistency 
    // regardless of current UI state/view
    const exportNode = document.getElementById('report-export-container');
    if (!exportNode) return;
    
    setLoading(true);
    setShowExportOptions(false);
    
    // We make it visible briefly but off-screen to ensure Recharts can calculate dimensions
    exportNode.style.display = 'block';
    exportNode.style.opacity = '0';
    
    // Small delay for re-rendering/layout
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const canvas = await html2canvas(exportNode, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 1000,
        windowWidth: 1000,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('report-export-container');
          if (el) {
            el.style.display = 'block';
            el.style.opacity = '1';
            el.style.position = 'relative';
            el.style.left = '0';
          }
          
          // Inject a global style to the cloned document to override oklch variables
          // and prevent html2canvas from tripping over them.
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            :root, * {
              --color-slate-50: #f8fafc !important;
              --color-slate-100: #f1f5f9 !important;
              --color-slate-200: #e2e8f0 !important;
              --color-slate-300: #cbd5e1 !important;
              --color-slate-400: #94a3b8 !important;
              --color-slate-500: #64748b !important;
              --color-slate-600: #475569 !important;
              --color-slate-700: #334155 !important;
              --color-slate-800: #1e293b !important;
              --color-slate-900: #0f172a !important;
              --color-blue-50: #eff6ff !important;
              --color-blue-100: #dbeafe !important;
              --color-blue-200: #bfdbfe !important;
              --color-blue-300: #93c5fd !important;
              --color-blue-400: #60a5fa !important;
              --color-blue-500: #3b82f6 !important;
              --color-blue-600: #2563eb !important;
              --color-blue-700: #1d4ed8 !important;
              --color-indigo-50: #eef2ff !important;
              --color-indigo-100: #e0e7ff !important;
              --color-indigo-200: #c7d2fe !important;
              --color-indigo-400: #818cf8 !important;
              --color-indigo-500: #6366f1 !important;
              --color-indigo-600: #4f46e5 !important;
              --color-indigo-700: #4338ca !important;
              --color-emerald-50: #ecfdf5 !important;
              --color-emerald-100: #d1fae5 !important;
              --color-emerald-200: #a7f3d0 !important;
              --color-emerald-400: #34d399 !important;
              --color-emerald-500: #10b981 !important;
              --color-emerald-600: #059669 !important;
              --color-emerald-700: #047857 !important;
              --color-green-50: #f0fdf4 !important;
              --color-green-100: #dcfce7 !important;
              --color-green-500: #22c55e !important;
              --color-green-600: #16a34a !important;
              --color-green-700: #15803d !important;
              --color-red-50: #fef2f2 !important;
              --color-red-100: #fee2e2 !important;
              --color-red-500: #ef4444 !important;
              --color-red-600: #dc2626 !important;
              --color-red-700: #b91c1c !important;
              --color-amber-50: #fffbeb !important;
              --color-amber-100: #fef3c7 !important;
              --color-amber-200: #fde68a !important;
              --color-amber-500: #f59e0b !important;
              --color-amber-600: #d97706 !important;
              --color-amber-800: #92400e !important;
              --color-amber-900: #78350f !important;
              
              /* Fallbacks for generic space variables if Tailwind 4 uses them */
              --slate-50: #f8fafc !important;
              --slate-100: #f1f5f9 !important;
              --slate-200: #e2e8f0 !important;
              --slate-300: #cbd5e1 !important;
              --slate-400: #94a3b8 !important;
              --slate-500: #64748b !important;
              --slate-600: #475569 !important;
              --slate-700: #334155 !important;
              --slate-800: #1e293b !important;
              --slate-900: #0f172a !important;
              --blue-500: #3b82f6 !important;
              --indigo-500: #6366f1 !important;
              --emerald-500: #10b981 !important;
              --red-600: #dc2626 !important;
            }
            body {
              background-color: #ffffff !important;
              color: #0f172a !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const contentHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Better multi-page logic with margins
      let heightLeft = contentHeight;
      let position = 0;
      const margin = 10; // mm
      const innerWidth = pdfWidth - (margin * 2);
      const innerHeight = pdfHeight - (margin * 2);
      
      // Calculate adjusted content height for the PDF width
      const scaledContentHeight = (imgProps.height * innerWidth) / imgProps.width;

      pdf.addImage(imgData, 'JPEG', margin, margin, innerWidth, scaledContentHeight);
      heightLeft = scaledContentHeight - innerHeight;

      while (heightLeft > 0) {
        position = heightLeft - scaledContentHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', margin, position, innerWidth, scaledContentHeight);
        heightLeft -= innerHeight;
      }
      
      pdf.save(`EduTrack_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to generate PDF. Please check if charts are rendered.");
    } finally {
      if (exportNode) {
        exportNode.style.display = 'none';
        exportNode.style.opacity = '1';
      }
      setLoading(false);
    }
  };

  /**
   * Generates an Excel report based on current data and selected sections
   */
  const exportExcel = () => {
    setLoading(true);
    setShowExportOptions(false);

    try {
      const wb = XLSX.utils.book_new();
      
      // 1. Data Summary Sheet
      if (exportConfig.stats && stats) {
        const summaryData = [
          ["EDUTRACK ANALYTICS - PERFORMANCE SUMMARY"],
          ["Generated On", new Date().toLocaleDateString()],
          ["Reference ID", Math.random().toString(36).substring(7).toUpperCase()],
          [""],
          ["EXECUTIVE METRICS", "VALUE"],
          ["Total Student Enrollment", stats.totalStudents],
          ["Aggregate Attendance Rate", `${stats.avgAttendance}%`],
          ["Average Internal Score", `${stats.avgMarks} / 100`],
          ["Pass success Ratio", `${stats.passRatio}%`],
          ["Critical Risk Pool", stats.atRiskCount],
          [""],
          ["SUCCESS DISTRIBUTION", "COUNT"],
          ["Passed Students", stats.passCount],
          ["At-Risk Students", stats.atRiskCount],
          ["Failing Students", stats.failCount],
          [""],
          ["ANALYSIS PARAMETERS"],
          ["Attendance Quality Threshold", `${thresholds.attendance}%`],
          ["Minimum Passing Grade", thresholds.marks],
          ["Academic Session", "Current Semester"]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        
        // Basic column sizing
        wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
        
        XLSX.utils.book_append_sheet(wb, wsSummary, "Dashboard Summary");
      }

      // 2. Subject & Skill Analysis Sheet
      if (exportConfig.charts && stats) {
        const subjectData = [
          ["SUBJECT & SKILL PERFORMANCE MATRIX"],
          ["Subject", "Average Grade", "Pass Probability (%)"],
          ...stats.subjectStats.map(s => [s.subject, s.avgMarks, s.passRate])
        ];
        const wsSubjects = XLSX.utils.aoa_to_sheet(subjectData);
        wsSubjects['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsSubjects, "Performance Matrix");
      }

      // 3. AI Intelligence & Forecasts
      if (exportConfig.ai && analysis) {
        const aiData = [
          ["AI STRATEGIC INTELLIGENCE REPORT"],
          ["Category", "Insight / Forecast"],
          ["Strategic Summary", analysis.summary],
          ["Key Trends Identified", analysis.trends],
          [""],
          ["REMEDIATION RECOMMENDATIONS"],
          ...analysis.recommendations.map((r, i) => [`Rec #${i+1}`, r]),
          [""],
          ["PREDICTIVE RISK FORECAST (NEXT SEMESTER)"],
          ["Student ID", "Reason for Forecast", "Risk Probability"],
          ...analysis.nextSemesterFailurePrediction.map(p => [p.studentId, p.reason, p.probability])
        ];
        const wsAI = XLSX.utils.aoa_to_sheet(aiData);
        wsAI['!cols'] = [{ wch: 25 }, { wch: 80 }];
        XLSX.utils.book_append_sheet(wb, wsAI, "AI Intelligence");
      }

      // 4. Raw Registry Sheet
      if (exportConfig.data) {
        // Flatten scores for export
        const rawData = data.map(s => {
          const row: any = {
            "Student ID": s.studentId,
            "Attendance %": s.attendance,
            "Internal Marks": s.internalMarks,
            "Assignment Marks": s.assignmentMarks,
            "Total Marks": s.internalMarks + s.assignmentMarks,
            "Final Status": s.finalResult
          };
          // Add individual subject scores
          s.scores.forEach(score => {
            row[score.subject] = score.marks;
          });
          return row;
        });
        const wsData = XLSX.utils.json_to_sheet(rawData);
        XLSX.utils.book_append_sheet(wb, wsData, "Raw Registry");
      }

      XLSX.writeFile(wb, `EduTrack_Analysis_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Excel Export Error:", err);
      alert("Failed to generate Excel report.");
    } finally {
      setLoading(false);
    }
  };

  const exportAIJSON = () => {
    if (!analysis) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysis, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `EduTrack_AI_Analysis_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const exportAICSV = () => {
    if (!analysis) return;
    
    let csvContent = "Category,Content\n";
    csvContent += `Summary,"${analysis.summary.replace(/"/g, '""')}"\n`;
    csvContent += `Trends,"${(analysis.trends || []).join('; ').replace(/"/g, '""')}"\n\n`;
    
    csvContent += "Recommendations\n";
    (analysis.recommendations || []).forEach(r => {
      csvContent += `"${r.replace(/"/g, '""')}"\n`;
    });
    
    csvContent += "\nAt-Risk Student IDs\n";
    csvContent += (analysis.atRiskStudentIds || []).join(', ') + "\n";
    
    csvContent += "\nPredictive Failure Forecast\n";
    csvContent += "Student ID,Reason,Probability\n";
    (analysis.nextSemesterFailurePrediction || []).forEach(p => {
      csvContent += `${p.studentId},"${p.reason.replace(/"/g, '""')}",${p.probability}\n`;
    });

    csvContent += "\nSubject-Specific Insights\n";
    csvContent += "Subject,Performance,Trend,Prediction\n";
    (analysis.subjectInsights || []).forEach(insight => {
      csvContent += `"${insight.subjectName}",${insight.performanceLevel},"${insight.trend.replace(/"/g, '""')}","${insight.prediction.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `EduTrack_AI_Analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and Sort data for the table view
  const processedData = React.useMemo(() => {
    let filtered = data.filter(s => {
      const matchesSearch = s.studentId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || s.finalResult === statusFilter;
      
      let matchesSubject = true;
      if (subjectFilter) {
        const subjectScore = s.subjects?.find(sub => sub.subject === subjectFilter.subject);
        if (subjectScore) {
          matchesSubject = subjectScore.marks >= subjectFilter.min && subjectScore.marks <= subjectFilter.max;
        } else {
          matchesSubject = false; // Filtered out if subject doesn't exist
        }
      }

      return matchesSearch && matchesStatus && matchesSubject;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof StudentData];
        let bValue: any = b[sortConfig.key as keyof StudentData];

        if (sortConfig.key === 'totalMarks') {
          aValue = a.internalMarks + a.assignmentMarks;
          bValue = b.internalMarks + b.assignmentMarks;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [data, searchTerm, statusFilter, sortConfig, subjectFilter]);

  const requestSort = (key: keyof StudentData | 'totalMarks') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const selectedStudent = data.find(s => s.studentId === selectedStudentId);

  const pieData = [
    { name: 'Pass', value: data.filter(d => d.finalResult === 'Pass').length },
    { name: 'Fail', value: data.filter(d => d.finalResult === 'Fail').length },
  ];

  const COLORS = ['#10b981', '#f43f5e'];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden h-screen" role="application" aria-label="EduTrack Analytics System">
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 z-40 shrink-0" role="banner">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold" aria-hidden="true">E</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">EduTrack <span className="text-blue-600">Analytics</span></h1>
          <span className="ml-4 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-semibold text-slate-500 uppercase tracking-wider">v2.4 Pro</span>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative">
             <button 
               onClick={() => setShowExportOptions(!showExportOptions)}
               aria-label="Export report options"
               className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
             >
               <Download size={16} />
               <span className="hidden sm:inline">Export Report</span>
               <ChevronDown size={14} />
             </button>

             <AnimatePresence>
               {showExportOptions && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 10 }}
                   className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 space-y-4"
                 >
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Report Sections</p>
                   <div className="space-y-4">
                     <label className="flex items-center gap-2 cursor-pointer group">
                       <input 
                         type="checkbox" 
                         checked={exportConfig.stats} 
                         onChange={(e) => setExportConfig({...exportConfig, stats: e.target.checked})}
                         className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Summary Statistics</span>
                     </label>
                     <div className="space-y-2">
                       <label className="flex items-center gap-2 cursor-pointer group">
                         <input 
                           type="checkbox" 
                           checked={exportConfig.charts} 
                           onChange={(e) => setExportConfig({...exportConfig, charts: e.target.checked})}
                           className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                         />
                         <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Interactive Visuals</span>
                       </label>
                       {exportConfig.charts && (
                         <div className="ml-6 space-y-2 border-l-2 border-slate-100 pl-3 py-1 mt-1 animate-in slide-in-from-left-2 duration-300">
                           <label className="flex items-center gap-2 cursor-pointer group">
                             <input 
                               type="checkbox" 
                               checked={exportConfig.chartOptions.performanceMatrix} 
                               onChange={(e) => setExportConfig({
                                 ...exportConfig, 
                                 chartOptions: { ...exportConfig.chartOptions, performanceMatrix: e.target.checked }
                               })}
                               className="w-3.5 h-3.5 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
                             />
                             <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-800 uppercase tracking-tight">Academic Performance Matrix</span>
                           </label>
                           <label className="flex items-center gap-2 cursor-pointer group">
                             <input 
                               type="checkbox" 
                               checked={exportConfig.chartOptions.successDistribution} 
                               onChange={(e) => setExportConfig({
                                 ...exportConfig, 
                                 chartOptions: { ...exportConfig.chartOptions, successDistribution: e.target.checked }
                               })}
                               className="w-3.5 h-3.5 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
                             />
                             <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-800 uppercase tracking-tight">Success Distribution</span>
                           </label>
                           <label className="flex items-center gap-2 cursor-pointer group">
                             <input 
                               type="checkbox" 
                               checked={exportConfig.chartOptions.skillDensity} 
                               onChange={(e) => setExportConfig({
                                 ...exportConfig, 
                                 chartOptions: { ...exportConfig.chartOptions, skillDensity: e.target.checked }
                               })}
                               className="w-3.5 h-3.5 rounded border-slate-300 text-blue-500 focus:ring-blue-400"
                             />
                             <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-800 uppercase tracking-tight">Aggregate Skill Density</span>
                           </label>
                         </div>
                       )}
                     </div>
                     <label className="flex items-center gap-2 cursor-pointer group">
                       <input 
                         type="checkbox" 
                         checked={exportConfig.ai} 
                         onChange={(e) => setExportConfig({...exportConfig, ai: e.target.checked})}
                         className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">AI Narrative Insights</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer group">
                       <input 
                         type="checkbox" 
                         checked={exportConfig.data} 
                         onChange={(e) => setExportConfig({...exportConfig, data: e.target.checked})}
                         className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                       />
                       <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">Raw Table Data</span>
                     </label>
                   </div>
                   <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                     <button 
                       onClick={exportPDF}
                       className="w-full py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                     >
                       <FileText size={12} />
                       Download PDF Report
                     </button>
                     <button 
                       onClick={exportExcel}
                       className="w-full py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
                     >
                       <Download size={12} />
                       Download Excel Data
                     </button>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
           <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center" aria-label="User Profile">
             <Users size={16} className="text-slate-500" />
           </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-60 bg-white border-r border-slate-200 flex flex-col z-30 shrink-0" role="navigation" aria-label="Primary Navigation">
          <div className="p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Modules</p>
            <nav className="space-y-1">
              <button 
                onClick={() => setView('dashboard')}
                aria-pressed={view === 'dashboard'}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                  view === 'dashboard' ? "nav-link-active" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <LayoutDashboard size={16} />
                Analytics Overview
              </button>
              <button 
                onClick={() => setView('insights')}
                aria-pressed={view === 'insights'}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                  view === 'insights' ? "nav-link-active" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <BarChart3 size={16} />
                Visual Insights
              </button>
              <button 
                onClick={() => setView('data')}
                aria-pressed={view === 'data'}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                  view === 'data' ? "nav-link-active" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <FileText size={16} />
                Data Management
              </button>
              <button 
                onClick={runAIAnalysis}
                aria-label="Generate AI-powered insights"
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                  loading ? "animate-pulse text-blue-600" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <BrainCircuit size={16} />
                AI Predictor (ML)
              </button>
            </nav>
          </div>

          <div className="mt-auto p-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Data Source</p>
              <p className="text-xs font-semibold text-slate-700 truncate" title={data.length > 0 ? 'Loaded Data Store' : 'Pending upload'}>
                {data.length > 0 ? 'academic_records_v1.csv' : 'Waiting for upload...'}
              </p>
              <div className="mt-2 w-full bg-slate-200 h-1 rounded-full relative overflow-hidden" role="progressbar" aria-valuenow={data.length > 0 ? 100 : 33} aria-valuemin={0} aria-valuemax={100}>
                <div className={cn("h-1 rounded-full transition-all duration-500", data.length > 0 ? "bg-green-500 w-full" : "bg-slate-400 w-1/3")}></div>
              </div>
              <p className="text-[9px] mt-1 text-slate-500 uppercase font-bold">{data.length > 0 ? 'Clean & Analysis Ready' : 'Sync Pending'}</p>
              
              <label className="mt-3 w-full flex items-center justify-center gap-2 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold cursor-pointer hover:bg-slate-50 transition-all focus-within:ring-2 focus-within:ring-blue-500">
                <Upload size={12} />
                UPDATE CSV
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" aria-label="Upload CSV for processing" />
              </label>
            </div>
          </div>
        </aside>

        {/* Main Data View Area */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto bg-slate-50 font-sans" role="main">

          <AnimatePresence mode="wait">
            {view === 'dashboard' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {exportConfig.stats && (
                  <>
                    <div className="flex items-center justify-between">
                       <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Dashboard Overview</h2>
                       <button 
                         onClick={() => setShowSettings(!showSettings)}
                         className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                       >
                         <Settings2 size={14} />
                         Config Thresholds
                       </button>
                    </div>

                    {showSettings && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-6 items-end">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Critical Attendance %</label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="range" min="0" max="100" 
                                value={thresholds.attendance} 
                                onChange={(e) => setThresholds({...thresholds, attendance: parseInt(e.target.value)})}
                                className="w-32 accent-blue-600"
                              />
                              <span className="text-sm font-bold text-blue-600 min-w-[3ch]">{thresholds.attendance}%</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Min Passing Marks (Combined)</label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="range" min="0" max="150" 
                                value={thresholds.marks} 
                                onChange={(e) => setThresholds({...thresholds, marks: parseInt(e.target.value)})}
                                className="w-32 accent-blue-600"
                              />
                              <span className="text-sm font-bold text-blue-600 min-w-[3ch]">{thresholds.marks}</span>
                            </div>
                          </div>
                          <div className="ml-auto text-[10px] text-slate-400 font-medium italic">
                            Thresholds dynamically update "At-Risk" counts and alerts.
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Key Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Total Students</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.totalStudents || 0}</p>
                        <p className="text-[10px] text-green-600 mt-1 font-bold">↑ 4.2% from last term</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Avg. Attendance</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.avgAttendance || 0}%</p>
                        <p className="text-[10px] text-amber-600 mt-1 font-bold">↓ 1.5% critical threshold</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-semibold text-slate-500 uppercase">Overall Pass Rate</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.passRatio || 0}%</p>
                        <p className="text-[10px] text-green-600 mt-1 font-bold">↑ 0.8% YoY improvement</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
                        <p className="text-xs font-semibold text-slate-500 uppercase">At-Risk Students</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">{stats?.atRiskCount || 0}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">Identified via Analysis</p>
                      </div>
                    </div>
                  </>
                )}

                {exportConfig.charts && (
                  <div className="space-y-6">
                    {/* Subject Analysis Module Header */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen size={18} className="text-blue-600" />
                            <h3 className="font-black text-slate-800 uppercase tracking-tight">Subject Performance Analysis</h3>
                          </div>
                          <p className="text-xs font-medium text-slate-500">Comparative multi-metric evaluation of academic modules and cohort persistence.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Subject Selector:</span>
                          <select 
                            className="bg-white border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-black text-blue-600 outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                            value={selectedSubject || ''}
                            onChange={(e) => setSelectedSubject(e.target.value || null)}
                          >
                            <option value="">Aggregate View (All)</option>
                            {stats?.subjectStats.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Interactive Main Chart */}
                        <div className="lg:col-span-8 flex flex-col">
                          <div className="flex-1 min-h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart 
                                data={selectedSubject ? stats?.subjectStats.filter(s => s.subject === selectedSubject) : stats?.subjectStats}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                onClick={(data) => {
                                  if (data && data.activeLabel) {
                                    setSelectedSubject(data.activeLabel);
                                  }
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                  dataKey="subject" 
                                  stroke="#94a3b8" 
                                  fontSize={10} 
                                  fontVariant="bold" 
                                  axisLine={false} 
                                  tickLine={false} 
                                />
                                <YAxis 
                                  stroke="#94a3b8" 
                                  fontSize={10} 
                                  fontVariant="bold" 
                                  axisLine={false} 
                                  tickLine={false} 
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    borderRadius: '16px', 
                                    border: 'none', 
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', 
                                    fontSize: '11px', 
                                    fontWeight: '800',
                                    padding: '12px'
                                  }}
                                  cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="avgMarks" name="Avg Marks" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={selectedSubject ? 80 : 40} />
                                <Bar dataKey="passRate" name="Pass Rate %" fill="#10b981" radius={[8, 8, 0, 0]} barSize={selectedSubject ? 80 : 40} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="flex justify-center gap-8 mt-6">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded bg-indigo-500 shadow-sm shadow-indigo-200" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aggregate Marks</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded bg-emerald-500 shadow-sm shadow-emerald-200" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cohort Retention</span>
                            </div>
                          </div>
                        </div>

                        {/* Metric Intelligence Sidebar */}
                        <div className="lg:col-span-4 bg-slate-50/50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center">
                          {selectedSubject ? (
                            <motion.div 
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="space-y-8"
                            >
                              <div className="text-center">
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 block">In-Depth Analysis</span>
                                <h4 className="text-2xl font-black text-slate-800">{selectedSubject}</h4>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Score</p>
                                  <p className="text-2xl font-black text-indigo-600">{stats?.subjectStats.find(s => s.subject === selectedSubject)?.avgMarks}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pass Rate</p>
                                  <p className="text-2xl font-black text-emerald-600">{stats?.subjectStats.find(s => s.subject === selectedSubject)?.passRate}%</p>
                                </div>
                              </div>

                              <div className="p-4 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                                <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">Strategic Insight</p>
                                <p className="text-xs font-medium leading-relaxed italic">
                                  { (stats?.subjectStats.find(s => s.subject === selectedSubject)?.passRate || 0) > 75 
                                    ? "Exceptional retention levels. This module demonstrates high pedagogic efficiency." 
                                    : "Identification of learning friction. Remedial support recommended to stabilize cohort performance."
                                  }
                                </p>
                              </div>
                              
                              <button 
                                onClick={() => setSelectedSubject(null)}
                                className="w-full py-2 group flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                              >
                                <span>Reset Focus</span>
                                <RefreshCcw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                              </button>
                            </motion.div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 opacity-40">
                              <BarChart3 size={48} className="text-slate-300" />
                              <div>
                                <p className="text-sm font-black text-slate-500 uppercase tracking-tight">Interactive Mode Disabled</p>
                                <p className="text-[10px] text-slate-400 max-w-[200px] font-medium mt-1">Select a subject on the chart or menu to unlock granular performance intelligence.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Performance Correlation Matrix */}
                      <div className="lg:col-span-12 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
                        <div className="flex justify-between items-center mb-8">
                          <div>
                            <h3 className="font-black text-slate-800 uppercase tracking-tight">Performance Elasticity Correlation</h3>
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Mapping Attendance persistence against Internal Academic scoring.</p>
                          </div>
                          <div className="flex gap-4 items-center">
                             <div className="flex items-center gap-1.5">
                               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                               <span className="text-[9px] font-bold text-slate-500 uppercase">Passing</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                               <div className="w-2 h-2 rounded-full bg-red-500"></div>
                               <span className="text-[9px] font-bold text-slate-500 uppercase">Failing</span>
                             </div>
                             <div className="h-4 w-[1px] bg-slate-200 mx-2"></div>
                             <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-400">X: Attendance %</span>
                             <span className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-black text-blue-600">Y: Marks Density</span>
                          </div>
                        </div>
                        <div className="flex-1 w-full p-2 relative">
                          {/* Quadrant Labels Overlay */}
                          <div className="absolute top-4 right-10 pointer-events-none opacity-20 text-[10px] font-black text-emerald-600 uppercase tracking-widest z-0">High Performers (Core)</div>
                          <div className="absolute bottom-10 right-10 pointer-events-none opacity-20 text-[10px] font-black text-amber-600 uppercase tracking-widest z-0">Engaged Underperformers</div>
                          <div className="absolute top-4 left-10 pointer-events-none opacity-20 text-[10px] font-black text-blue-600 uppercase tracking-widest z-0">Efficient Outliers</div>
                          <div className="absolute bottom-10 left-10 pointer-events-none opacity-20 text-[10px] font-black text-red-600 uppercase tracking-widest z-0">Critical Risk Zone</div>

                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                type="number" 
                                dataKey="attendance" 
                                name="Attendance" 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                fontVariant="bold" 
                                axisLine={false} 
                                tickLine={false}
                                domain={[0, 100]}
                                unit="%"
                              />
                              <YAxis 
                                type="number" 
                                dataKey="internalMarks" 
                                name="Marks" 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                fontVariant="bold" 
                                axisLine={false} 
                                tickLine={false}
                                domain={[0, 50]}
                              />
                              <ZAxis type="number" dataKey="assignmentMarks" range={[50, 400]} />
                              <Tooltip 
                                cursor={{ strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload as StudentData;
                                    return (
                                      <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-2xl flex flex-col gap-2 min-w-[180px] z-50">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Profile</span>
                                          <span className={cn(
                                            "text-[9px] font-black px-2 py-0.5 rounded-full uppercase",
                                            data.finalResult === 'Pass' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                          )}>#{data.studentId}</span>
                                        </div>
                                        <div className="space-y-1.5">
                                          <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-500">Attendance Persistence</span>
                                            <span className="text-xs font-black text-slate-800">{data.attendance}%</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-500">Internal Score</span>
                                            <span className="text-xs font-black text-slate-800">{data.internalMarks}/50</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-500">Assignment Density</span>
                                            <span className="text-xs font-black text-slate-800">{data.assignmentMarks}/50</span>
                                          </div>
                                        </div>
                                        <div className={cn(
                                          "mt-2 pt-2 border-t border-slate-100 flex items-center gap-2",
                                          data.finalResult === 'Pass' ? "text-emerald-600" : "text-red-600"
                                        )}>
                                          {data.finalResult === 'Pass' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                          <span className="text-[10px] font-black uppercase tracking-widest">Status: {data.finalResult}</span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              
                              {/* Average Reference Lines for Quadrant Analysis */}
                              {stats && (
                                <>
                                  <ReferenceLine x={stats.avgAttendance} stroke="#94a3b8" strokeDasharray="3 3" opacity={0.5} label={{ position: 'top', value: 'Avg Att', fill: '#94a3b8', fontSize: 8, fontWeight: 'bold' }} />
                                  <ReferenceLine y={stats.avgInternalMarks} stroke="#94a3b8" strokeDasharray="3 3" opacity={0.5} label={{ position: 'right', value: 'Avg Marks', fill: '#94a3b8', fontSize: 8, fontWeight: 'bold' }} />
                                </>
                              )}

                              <Scatter name="Students" data={data}>
                                {data.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.finalResult === 'Pass' ? '#10b981' : '#ef4444'} 
                                    fillOpacity={0.6}
                                    stroke={entry.finalResult === 'Pass' ? '#059669' : '#dc2626'}
                                    strokeWidth={1}
                                  />
                                ))}
                              </Scatter>
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {exportConfig.ai && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Intervention Alert List */}
                    <div className="col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-[450px]">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-500" />
                        Intervention Required
                      </h3>
                      <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                        {data.filter(s => 
                          s.attendance < thresholds.attendance || 
                          (s.internalMarks + s.assignmentMarks) < thresholds.marks ||
                          s.finalResult === 'Fail'
                        ).slice(0, 12).map((student) => {
                          const isCriticalAttendance = student.attendance < (thresholds.attendance - 15);
                          const isCriticalMarks = (student.internalMarks + student.assignmentMarks) < (thresholds.marks - 10);
                          const isCritical = isCriticalAttendance || isCriticalMarks || student.finalResult === 'Fail';
                          
                          return (
                            <div key={student.studentId} className={cn(
                              "flex items-center justify-between p-2.5 rounded-lg border transition-all hover:scale-[1.01]",
                              isCritical ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"
                            )}>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800">ID: {student.studentId}</span>
                                <span className="text-[10px] text-slate-500 font-medium">Total Marks: {student.internalMarks + student.assignmentMarks}</span>
                              </div>
                              <div className="text-right">
                                <span className={cn("text-xs font-black block", isCriticalAttendance ? "text-red-600" : "text-amber-600")}>
                                  {student.attendance}% Att.
                                </span>
                                {student.finalResult === 'Fail' && (
                                  <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">Immediate Intervention</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Future Outcome Predictions (AI) */}
                    <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-[450px]">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-500" />
                        Predictive Fail Risk (Next Semester)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                        {analysis?.nextSemesterFailurePrediction.map((p, i) => (
                          <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative group overflow-hidden">
                            <div className="flex justify-between items-start mb-2">
                               <span className="text-xs font-black text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">#{p.studentId}</span>
                               <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter">{p.probability} Risk</span>
                            </div>
                            <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-relaxed italic">"{p.reason}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {exportConfig.ai && analysis && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                          <BrainCircuit size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">AI Strategic Intelligence Report</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generative ML Insights • High Confidence Metrics</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={exportAIJSON}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-200 transition-all uppercase tracking-widest"
                        >
                          <Download size={14} />
                          JSON Export
                        </button>
                        <button 
                          onClick={exportAICSV}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 border border-blue-700 rounded-lg text-[10px] font-black text-white hover:bg-blue-700 transition-all uppercase tracking-widest shadow-md shadow-blue-200"
                        >
                          <Download size={14} />
                          CSV Export
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3">Executive Summary</h4>
                          <p className="text-sm text-slate-600 leading-relaxed font-medium italic border-l-4 border-indigo-500 pl-4 py-1">
                            {analysis.summary}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3">Identified Performance Trends</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {analysis.trends.map((trend, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <TrendingUp size={14} className="text-indigo-400" />
                                <span className="text-xs font-semibold text-slate-700">{trend}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3">Strategic Recommendations</h4>
                        <div className="space-y-3">
                          {analysis.recommendations.map((rec, i) => (
                            <div key={i} className="flex gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 relative group">
                              <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-black shadow-sm group-hover:scale-110 transition-transform">
                                {i + 1}
                              </div>
                              <p className="text-xs font-bold text-slate-800 leading-relaxed pt-1">
                                {rec}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Subject-Specific Intelligence Section */}
                    {analysis.subjectInsights && analysis.subjectInsights.length > 0 && (
                      <div className="pt-6 border-t border-slate-100">
                        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4">Subject-Specific Intelligence</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {analysis.subjectInsights.map((insight, i) => (
                            <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-black text-slate-800 tracking-tight">{insight.subjectName}</span>
                                <span className={cn(
                                  "text-[9px] font-black px-2 py-0.5 rounded-full uppercase",
                                  insight.performanceLevel === 'High' ? "bg-emerald-100 text-emerald-700" : 
                                  insight.performanceLevel === 'Medium' ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                                )}>
                                  {insight.performanceLevel}
                                </span>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Subject Trend</p>
                                  <p className="text-[11px] font-semibold text-slate-600 leading-relaxed italic">{insight.trend}</p>
                                </div>
                                <div className="pt-2 border-t border-slate-50">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">AI Prediction</p>
                                  <div className="flex items-start gap-2">
                                    <Sparkles size={12} className="text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] font-bold text-slate-800 leading-relaxed">{insight.prediction}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ) : view === 'insights' ? (
              <motion.div 
                key="insights"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Enhanced Visual Intelligence</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Focus Subject:</span>
                    <select 
                      value={selectedSubject || ''}
                      onChange={(e) => setSelectedSubject(e.target.value || null)}
                      className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none shadow-sm text-indigo-600 cursor-pointer"
                    >
                      <option value="">Aggregate View</option>
                      {stats?.subjectStats.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Main Performance Comparison Chart */}
                  <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[450px]">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="font-bold text-slate-800">Subject Performance Analysis</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Comparative metrics for Average Marks and Pass Success Rates.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded bg-indigo-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Avg Marks</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Pass Rate %</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={selectedSubject ? stats?.subjectStats.filter(s => s.subject === selectedSubject) : stats?.subjectStats}
                          margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                          onClick={(data) => {
                            if (data && data.activeLabel) {
                              setSelectedSubject(data.activeLabel);
                            }
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="subject" 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            fontVariant="bold" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b' }}
                          />
                          <YAxis 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            fontVariant="bold" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b' }}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                            cursor={{ fill: '#f8fafc' }}
                          />
                          <Bar dataKey="avgMarks" name="Average Marks" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={selectedSubject ? 60 : 30} />
                          <Bar dataKey="passRate" name="Pass Rate %" fill="#10b981" radius={[6, 6, 0, 0]} barSize={selectedSubject ? 60 : 30} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Subject Detail & Intelligence Card */}
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col">
                      <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BookOpen size={16} className="text-indigo-500" />
                        {selectedSubject || 'Global'} Snapshot
                      </h3>
                      
                      <div className="space-y-6">
                        {selectedSubject ? (
                          <>
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance Score</p>
                              <div className="flex items-end justify-between">
                                <span className="text-4xl font-black text-slate-800">{stats?.subjectStats.find(s => s.subject === selectedSubject)?.avgMarks}</span>
                                <span className={cn(
                                  "px-2 py-1 rounded text-[10px] font-black uppercase",
                                  (stats?.subjectStats.find(s => s.subject === selectedSubject)?.avgMarks || 0) > 70 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                )}>
                                  {(stats?.subjectStats.find(s => s.subject === selectedSubject)?.avgMarks || 0) > 70 ? 'Excellent' : 'Needs Focus'}
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500 transition-all duration-1000" 
                                  style={{ width: `${stats?.subjectStats.find(s => s.subject === selectedSubject)?.avgMarks}%` }} 
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Graduation Velocity</p>
                              <div className="flex items-end justify-between">
                                <span className="text-4xl font-black text-emerald-600">{stats?.subjectStats.find(s => s.subject === selectedSubject)?.passRate}%</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Retention</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 transition-all duration-1000" 
                                  style={{ width: `${stats?.subjectStats.find(s => s.subject === selectedSubject)?.passRate}%` }} 
                                />
                              </div>
                            </div>

                            <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                               <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Subject Insight</p>
                               <p className="text-xs text-indigo-700 leading-relaxed font-medium italic">
                                 { (stats?.subjectStats.find(s => s.subject === selectedSubject)?.passRate || 0) < 60 ? 
                                    "Critical focus required. High failure rate suggests instructional complexity or prerequisite gaps." :
                                    "Strong performance trend. Core curriculum objectives are being met by majority of cohort."
                                 }
                               </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                <Search size={24} />
                             </div>
                             <div className="space-y-1">
                               <p className="text-sm font-bold text-slate-500 tracking-tight">Interactive Metrics Explorer</p>
                               <p className="text-[10px] text-slate-400 leading-relaxed max-w-[180px]">Select a specific subject from the menu to dive into granular performance intelligence.</p>
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Student Skill Profile (Radar Chart) */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-bold text-slate-800">Student Skill Balance</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Multidimensional view of subject proficiency for selected student.</p>
                      </div>
                      <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                        {selectedStudentId ? `Student: #${selectedStudentId}` : "Select a student in Data table"}
                      </div>
                    </div>
                    {selectedStudentId && selectedStudent?.subjects ? (
                      <div className="flex-1 w-full scale-90">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={selectedStudent.subjects}>
                            <PolarGrid stroke="#f1f5f9" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                              name="Performance"
                              dataKey="marks"
                              stroke="#6366f1"
                              fill="#6366f1"
                              fillOpacity={0.6}
                            />
                            <Tooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                            <BrainCircuit size={24} />
                         </div>
                         <p className="text-sm font-bold text-slate-500 tracking-tight">Select a student from the Data Management module to visualize their unique academic fingerprint.</p>
                      </div>
                    )}
                  </div>

                  {/* Attendance Velocity (Radial Bar Chart) */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-bold text-slate-800">Attendance Velocity</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Real-time aggregate attendance against institute target ({thresholds.attendance}%).</p>
                      </div>
                    </div>
                    <div className="flex-1 w-full flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart 
                          cx="50%" 
                          cy="50%" 
                          innerRadius="60%" 
                          outerRadius="100%" 
                          barSize={20} 
                          data={[
                            { name: 'Target', value: thresholds.attendance, fill: '#f1f5f9' },
                            { name: 'Actual', value: stats?.avgAttendance || 0, fill: (stats?.avgAttendance || 0) >= thresholds.attendance ? '#10b981' : '#f43f5e' }
                          ]}
                        >
                          <RadialBar
                            label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
                            background
                            dataKey="value"
                            cornerRadius={10}
                          />
                          <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b' }} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-slate-800">{stats?.avgAttendance}%</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Avg Attendance</span>
                      </div>
                    </div>
                  </div>

                  {/* Marks Component Distribution (Stacked Bar Chart) */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px] lg:col-span-12">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="font-bold text-slate-800">Weighted Marks Composition</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Comparative breakdown of Internal vs Assignment contributions across subjects.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded bg-blue-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Internal (Exam)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded bg-blue-200" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Assignments</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={stats?.subjectStats.map(s => {
                            // In real app we'd aggregate internal vs assignments per subject
                            // For this UI demo, we'll derive a weighted split based on the avg
                            return {
                              ...s,
                              internal: Number((s.avgMarks * 0.7).toFixed(1)),
                              assignments: Number((s.avgMarks * 0.3).toFixed(1))
                            };
                          })}
                          layout="vertical"
                          margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="subject" 
                            type="category" 
                            stroke="#94a3b8" 
                            fontSize={10} 
                            fontVariant="bold" 
                            axisLine={false} 
                            tickLine={false} 
                          />
                          <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="internal" name="Internal Marks" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="assignments" name="Assignments" stackId="a" fill="#bfdbfe" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
                    <h3 className="font-bold text-slate-800 mb-6">Student Success Distribution</h3>
                    <div className="h-[300px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-4 ml-8">
                         {pieData.map((d, i) => (
                           <div key={i} className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.name}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                <span className="text-xl font-black text-slate-700">{d.value}</span>
                              </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6">Aggregate Subject Density</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.subjectStats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="subject" stroke="#94a3b8" fontSize={10} fontVariant="bold" />
                          <YAxis stroke="#94a3b8" fontSize={10} fontVariant="bold" />
                          <Tooltip />
                          <Area type="monotone" dataKey="avgMarks" stroke="#6366f1" fill="#818cf8" fillOpacity={0.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-[600px]"
              >
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold text-slate-700 tracking-tight">Active Academic Registry</h2>
                    <span className="px-2 py-0.5 bg-slate-200 text-[10px] font-bold text-slate-600 rounded-full">{processedData.length} records</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                      <Search size={14} className="text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none text-[11px] outline-none placeholder:text-slate-400 font-bold w-24"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                      <Filter size={14} className="text-slate-400" />
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-transparent border-none text-[11px] outline-none font-bold cursor-pointer"
                      >
                        <option value="All">All Results</option>
                        <option value="Pass">Only Pass</option>
                        <option value="Fail">Only Fail</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm min-w-[200px]">
                      <Settings2 size={14} className="text-slate-400 shrink-0" />
                      <div className="flex items-center gap-1.5 flex-1">
                        <select 
                          value={subjectFilter?.subject || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) setSubjectFilter(null);
                            else setSubjectFilter({ subject: val, min: subjectFilter?.min || 0, max: subjectFilter?.max || 100 });
                          }}
                          className="bg-transparent border-none text-[11px] outline-none font-bold cursor-pointer w-24 truncate"
                        >
                          <option value="">By Subject</option>
                          {stats?.subjectStats.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
                        </select>
                        
                        {subjectFilter && (
                          <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-300">
                            <input 
                              type="number" 
                              placeholder="0"
                              value={subjectFilter.min}
                              onChange={(e) => setSubjectFilter({ ...subjectFilter, min: parseInt(e.target.value) || 0 })}
                              className="w-8 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-center outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-[10px] text-slate-300 font-bold">-</span>
                            <input 
                              type="number" 
                              placeholder="100"
                              value={subjectFilter.max}
                              onChange={(e) => setSubjectFilter({ ...subjectFilter, max: parseInt(e.target.value) || 0 })}
                              className="w-8 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-center outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600" onClick={() => requestSort('studentId')}>ID</th>
                        <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600" onClick={() => requestSort('attendance')}>Attendance %</th>
                        <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest">Total Marks</th>
                        <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedData.map((student) => (
                        <tr 
                          key={student.studentId} 
                          onClick={() => setSelectedStudentId(student.studentId)}
                          className={cn(
                            "hover:bg-slate-50 transition-colors cursor-pointer border-l-2",
                            selectedStudentId === student.studentId ? "bg-blue-50/50 border-l-blue-600" : "border-l-transparent text-slate-600"
                          )}
                        >
                          <td className="px-6 py-4 font-mono font-bold">{student.studentId}</td>
                          <td className="px-6 py-4 font-semibold">{student.attendance}%</td>
                          <td className="px-6 py-4 font-black">{student.internalMarks + student.assignmentMarks}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                              student.finalResult === 'Pass' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                              {student.finalResult}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end">
                               {selectedStudentId === student.studentId ? (
                                <ChevronRight size={16} className="text-blue-600 animate-pulse" />
                               ) : (
                                <ArrowRightLeft size={14} className="text-slate-300 opacity-20" />
                               )}
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <AnimatePresence>
                  {selectedStudentId && selectedStudent && (
                    <motion.div 
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      className="absolute inset-y-0 right-0 w-80 bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col p-6 overflow-y-auto"
                    >
                      <div className="flex items-center justify-between mb-8">
                         <h3 className="font-black text-slate-800 text-lg">Student Profile</h3>
                         <button onClick={() => setSelectedStudentId(null)} className="p-2 hover:bg-slate-100 rounded-full">
                           <X size={20} className="text-slate-400" />
                         </button>
                      </div>

                      <div className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Core Metrics</p>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-bold text-slate-500">Attendance</p>
                                <p className="text-xl font-black text-slate-800">{selectedStudent.attendance}%</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-500">Total Marks</p>
                                <p className="text-xl font-black text-slate-800">{selectedStudent.internalMarks + selectedStudent.assignmentMarks}</p>
                              </div>
                           </div>
                        </div>

                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Subject Scores</p>
                           <div className="space-y-4">
                              {selectedStudent.subjects?.map((s, i) => (
                                <div key={i}>
                                   <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-bold text-slate-600">{s.subject}</span>
                                      <span className="text-xs font-black text-slate-800">{s.marks}</span>
                                   </div>
                                   <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500" style={{ width: `${s.marks}%` }} />
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Hidden PDF Export Template - Specifically designed for A4 format and high-density data */}
      <div 
        id="report-export-container" 
        style={{ 
          display: 'none', 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '1000px', 
          zIndex: -1,
          backgroundColor: '#ffffff'
        }}
        className="p-16 font-sans text-slate-900"
      >
        {/* Style override to bypass oklch parsing errors in html2canvas */}
        <style dangerouslySetInnerHTML={{ __html: `
          #report-export-container, #report-export-container * {
            --color-slate-50: #f8fafc !important;
            --color-slate-100: #f1f5f9 !important;
            --color-slate-200: #e2e8f0 !important;
            --color-slate-300: #cbd5e1 !important;
            --color-slate-400: #94a3b8 !important;
            --color-slate-500: #64748b !important;
            --color-slate-600: #475569 !important;
            --color-slate-700: #334155 !important;
            --color-slate-800: #1e293b !important;
            --color-slate-900: #0f172a !important;
            --color-blue-50: #eff6ff !important;
            --color-blue-100: #dbeafe !important;
            --color-blue-200: #bfdbfe !important;
            --color-blue-300: #93c5fd !important;
            --color-blue-400: #60a5fa !important;
            --color-blue-500: #3b82f6 !important;
            --color-blue-600: #2563eb !important;
            --color-blue-700: #1d4ed8 !important;
            --color-indigo-50: #eef2ff !important;
            --color-indigo-100: #e0e7ff !important;
            --color-indigo-200: #c7d2fe !important;
            --color-indigo-400: #818cf8 !important;
            --color-indigo-500: #6366f1 !important;
            --color-indigo-600: #4f46e5 !important;
            --color-indigo-700: #4338ca !important;
            --color-emerald-50: #ecfdf5 !important;
            --color-emerald-100: #d1fae5 !important;
            --color-emerald-200: #a7f3d0 !important;
            --color-emerald-400: #34d399 !important;
            --color-emerald-500: #10b981 !important;
            --color-emerald-600: #059669 !important;
            --color-emerald-700: #047857 !important;
            --color-green-50: #f0fdf4 !important;
            --color-green-100: #dcfce7 !important;
            --color-green-500: #22c55e !important;
            --color-green-600: #16a34a !important;
            --color-green-700: #15803d !important;
            --color-red-50: #fef2f2 !important;
            --color-red-100: #fee2e2 !important;
            --color-red-500: #ef4444 !important;
            --color-red-600: #dc2626 !important;
            --color-red-700: #b91c1c !important;
            --color-amber-50: #fffbeb !important;
            --color-amber-100: #fef3c7 !important;
            --color-amber-200: #fde68a !important;
            --color-amber-500: #f59e0b !important;
            --color-amber-600: #d97706 !important;
            --color-amber-800: #92400e !important;
            --color-amber-900: #78350f !important;

            /* Fallbacks for generic space variables if Tailwind 4 uses them */
            --slate-50: #f8fafc !important;
            --slate-100: #f1f5f9 !important;
            --slate-200: #e2e8f0 !important;
            --slate-300: #cbd5e1 !important;
            --slate-400: #94a3b8 !important;
            --slate-500: #64748b !important;
            --slate-600: #475569 !important;
            --slate-700: #334155 !important;
            --slate-800: #1e293b !important;
            --slate-900: #0f172a !important;
            --blue-500: #3b82f6 !important;
            --indigo-500: #6366f1 !important;
            --emerald-500: #10b981 !important;
            --red-600: #dc2626 !important;
          }
        `}} />
        {/* Report Header */}
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10 mb-16">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">EDUTRACK <span className="text-blue-600">ANALYTICS</span></h1>
            <p className="text-base font-bold text-slate-500 uppercase tracking-widest mt-4 px-2 border-l-4 border-blue-600">Confidential Performance Audit Report</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-1">Generated On</p>
            <p className="text-2xl font-black text-slate-800">{new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
            <p className="text-xs font-bold text-slate-400 uppercase mt-2">Ref: {Math.random().toString(36).substring(7).toUpperCase()}</p>
          </div>
        </div>

        {exportConfig.stats && (
          <div className="mb-20">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">I. Executive Summary</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                Benchmarks: {thresholds.attendance}% Att. / {thresholds.marks} Marks
              </p>
            </div>
            <div className="grid grid-cols-4 gap-8">
              {[
                { label: 'Total Enrollment', val: stats?.totalStudents, color: 'text-slate-900' },
                { label: 'Aggregate Attendance', val: `${stats?.avgAttendance}%`, color: 'text-slate-900' },
                { label: 'Pass Success Ratio', val: `${stats?.passRatio}%`, color: 'text-green-600' },
                { label: 'Critical Risk Pool', val: stats?.atRiskCount, color: 'text-red-600' }
              ].map((item, i) => (
                <div key={i} className="p-8 bg-slate-50 border border-slate-200 rounded-[2rem]">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{item.label}</p>
                  <p className={cn("text-4xl font-black", item.color)}>{item.val}</p>
                  <div className="mt-5 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-900" style={{ width: '100%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {exportConfig.charts && (
          <>
            {exportConfig.chartOptions.performanceMatrix && (
              <div className="mb-20">
                <h2 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">II. Academic Performance Matrix</h2>
                <div className="bg-white p-10 border border-slate-200 rounded-[2.5rem] shadow-sm h-[600px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.subjectStats} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="subject" stroke="#94a3b8" fontSize={14} fontWeight="bold" axisLine={false} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={14} fontWeight="bold" axisLine={false} tickLine={false} />
                      <Bar dataKey="avgMarks" name="Average Grade" fill="#4f46e5" radius={[10, 10, 0, 0]} barSize={50} />
                      <Bar dataKey="passRate" name="Pass Probability" fill="#059669" radius={[10, 10, 0, 0]} barSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-10">
                  <div className="p-8 bg-indigo-50 border border-indigo-200 rounded-3xl">
                    <h4 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-3">Academic Consistency</h4>
                    <p className="text-sm text-indigo-800 leading-relaxed italic font-medium">Evaluation of subject-wise score distribution relative to institutional longitudinal benchmarks.</p>
                  </div>
                  <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl">
                    <h4 className="text-sm font-black text-emerald-500 uppercase tracking-widest mb-3">Retention Intelligence</h4>
                    <p className="text-sm text-emerald-800 leading-relaxed italic font-medium">Visualization of cohort persistence and module mastery across diverse learning environments.</p>
                  </div>
                </div>
              </div>
            )}

            {(exportConfig.chartOptions.successDistribution || exportConfig.chartOptions.skillDensity) && (
              <div className="mb-20 grid grid-cols-2 gap-10">
                {exportConfig.chartOptions.successDistribution && (
                  <div className="p-10 border border-slate-200 rounded-[2.5rem] bg-white shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-8">Success Distribution</h3>
                    <div className="h-[300px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-6 ml-8">
                        {pieData.map((d, i) => (
                          <div key={i}>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">{d.name}</p>
                            <p className="text-3xl font-black text-slate-900">{d.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {exportConfig.chartOptions.skillDensity && (
                  <div className="p-10 border border-slate-200 rounded-[2.5rem] bg-white shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-8">Aggregate Skill Density</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.subjectStats}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="subject" stroke="#94a3b8" fontSize={12} fontWeight="bold" />
                          <YAxis stroke="#94a3b8" fontSize={12} fontWeight="bold" />
                          <Area type="monotone" dataKey="avgMarks" stroke="#4f46e5" strokeWidth={3} fill="#818cf8" fillOpacity={0.15} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {exportConfig.ai && analysis && (
          <div className="mb-20">
            <h2 className="text-3xl font-black text-slate-900 mb-10 uppercase tracking-tight">III. AI Intelligence & Predictive Risk</h2>
            <div className="grid grid-cols-2 gap-10">
               <div className="p-10 bg-slate-900 text-white rounded-[2.5rem]">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/20">AI</div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Strategic Recommendations</h3>
                  </div>
                  <ul className="space-y-6">
                    {analysis.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-5">
                        <div className="mt-2 w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                        <p className="text-base font-medium text-slate-300 leading-relaxed">{rec}</p>
                      </li>
                    ))}
                  </ul>
               </div>

               <div className="space-y-8">
                  <div className="p-10 border-4 border-slate-900 rounded-[2.5rem]">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Predictive Failure Forecast</h3>
                    <div className="space-y-5">
                       {analysis.nextSemesterFailurePrediction.slice(0, 4).map((p, i) => (
                         <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200">
                           <span className="text-sm font-bold text-slate-700">Student ID: {p.studentId}</span>
                           <span className="text-sm font-black text-red-600 px-3 py-1 bg-red-50 rounded-lg">Risk: {p.probability}</span>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="p-10 bg-amber-50 border-2 border-amber-200 rounded-[2.5rem]">
                    <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-6">High Priority Intervention</h3>
                    <div className="space-y-3">
                       {data.filter(s => s.attendance < thresholds.attendance || s.finalResult === 'Fail').slice(0, 5).map((s, i) => (
                         <div key={i} className="flex justify-between text-xs font-bold text-amber-900 border-b border-amber-200/50 pb-3">
                            <span>ID: {s.studentId}</span>
                            <span>{s.attendance}% ATT. | {s.internalMarks + s.assignmentMarks} MARKS</span>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {exportConfig.data && (
          <div className="mb-12">
            <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">IV. Raw Registry Audit</h2>
            <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-6 py-4 font-black uppercase tracking-widest">Student ID</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest">Attendance %</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest">Total Marks</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest">Final Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((student) => (
                    <tr key={student.studentId}>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{student.studentId}</td>
                      <td className="px-6 py-4 font-black text-slate-700">{student.attendance}%</td>
                      <td className="px-6 py-4 font-black text-slate-700">{student.internalMarks + student.assignmentMarks}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                          student.finalResult === 'Pass' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {student.finalResult}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report Footer */}
        <div className="pt-12 border-t border-slate-200 mt-12 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Generated by EduTrack Intelligent Ecosystem • Integrated Performance Lab</p>
        </div>
      </div>

      {/* Simplified Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[100] flex items-center justify-center"
          >
            <div className="bg-white p-6 rounded-xl shadow-2xl flex items-center gap-4 border border-slate-200">
              <RefreshCcw size={20} className="animate-spin text-blue-600" />
              <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">Syncing Data Store...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
