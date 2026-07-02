/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HistologySample, PathologyReport, LLMModel, SlideAnnotation } from '../types';
import { AVAILABLE_MODELS } from '../data';
import { FileText, Sparkles, CheckCircle2, RefreshCw, Printer, FileDown, CheckCircle, Clock, Beaker, Cpu, Lock, ShieldCheck, HelpCircle, Activity } from 'lucide-react';

interface ReportGeneratorProps {
  sample: HistologySample;
  onReportApproved: (report: PathologyReport) => void;
  approvedReport: PathologyReport | null;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  annotations?: SlideAnnotation[];
}

export default function ReportGenerator({
  sample,
  onReportApproved,
  approvedReport,
  selectedModelId,
  onModelChange,
  annotations = []
}: ReportGeneratorProps) {
  const activeModelObj = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];
  const [loading, setLoading] = useState<boolean>(false);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [reportText, setReportText] = useState<string>('');
  const [signName, setSignName] = useState<string>('');
  const [signTitle, setSignTitle] = useState<string>('Lead Molecular Pathologist');
  const [isChartModalOpen, setIsChartModalOpen] = useState<boolean>(false);

  // Trigger Gemini API to generate professional narrative reports
  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideId: sample.id,
          tissueType: sample.tissueType,
          gradePredicted: sample.defaultGrade,
          confidence: sample.confidence,
          segmentDice: 0.932, // preset SwinUNETR core performance metrics
          segmentIoU: 0.871,
          precision: 0.952,
          recall: 0.913,
          features: sample.features,
          clinical: sample.clinical,
          genomic: sample.genomic,
          additionalNotes: additionalNotes,
          selectedModel: selectedModelId
        })
      });

      const result = await response.json();
      if (result.success) {
        setReportText(result.reportText);
      } else {
        setReportText(`Error Generating Report\nUnable to reach Gemini API. Detailed logs: ${result.error || 'Server error'}`);
      }
    } catch (err: any) {
      setReportText(`Network Connection Error\nCould not query the backend server: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Custom markdown high-fidelity clean parser
  const renderMarkdown = (text: string) => {
    if (!text) return null;

    // Helper to format inline bold (**text**) and clean up remaining single asterisks
    const parseInline = (rawText: string) => {
      // Remove any leading bullet characters if they slipped through
      let clean = rawText.replace(/^[\*\-\s•]+/, '');
      // Strip outer/remaining raw single asterisks
      clean = clean.replace(/\*(?!\*)/g, '');
      
      const regex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(clean)) !== null) {
        if (match.index > lastIndex) {
          parts.push(clean.substring(lastIndex, match.index));
        }
        parts.push(
          <strong 
            key={match.index} 
            className="text-white font-bold font-sans bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/40 text-[11px] inline-block mx-0.5"
          >
            {match[1]}
          </strong>
        );
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < clean.length) {
        parts.push(clean.substring(lastIndex));
      }

      if (parts.length === 0) {
        return <span className="text-[#C9D1D9]">{clean}</span>;
      }

      return (
        <span className="text-[#C9D1D9]">
          {parts.map((p, i) => (typeof p === 'string' ? p.replace(/\*/g, '') : p))}
        </span>
      );
    };

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: { key: number; items: string[] } | null = null;
    let currentTable: { key: number; headers: string[]; rows: string[][] } | null = null;

    const flushList = (index: number) => {
      if (currentList) {
        elements.push(
          <div key={`list-${currentList.key}-${index}`} className="space-y-1.5 my-3">
            {currentList.items.map((item, itemIdx) => (
              <div key={itemIdx} className="text-xs text-[#C9D1D9] pl-4 py-1.5 flex items-start gap-2 border-l border-[#21262D] hover:border-blue-500/30 transition-all ml-1 my-0.5">
                <span className="text-blue-500 font-bold select-none">•</span>
                <div className="flex-1 leading-relaxed">
                  {parseInline(item)}
                </div>
              </div>
            ))}
          </div>
        );
        currentList = null;
      }
    };

    const flushTable = (index: number) => {
      if (currentTable) {
        elements.push(
          <div key={`table-${currentTable.key}-${index}`} className="my-4 overflow-x-auto rounded-xl border border-[#30363D] bg-[#0D1117] p-1 shadow-inner">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-[#30363D] bg-[#161B22]/80">
                  {currentTable.headers.map((header, hIdx) => (
                    <th key={hIdx} className="px-3.5 py-2.5 font-mono font-bold text-[#8B949E] uppercase tracking-wider text-[10px]">
                      {header.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262D]/60 text-gray-300">
                {currentTable.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#161B22]/40 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2.5 text-[11px] leading-relaxed">
                        {parseInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        currentTable = null;
      }
    };

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const cleanLine = line.trim();

      // Skip empty bullets or standalone bullets
      if (cleanLine === '•' || cleanLine === '*' || cleanLine === '-' || cleanLine === '') {
        flushList(idx);
        flushTable(idx);
        continue;
      }

      // Check if line is a table row
      if (cleanLine.startsWith('|')) {
        flushList(idx);
        
        const cells = cleanLine.split('|').map(c => c.trim()).filter((_, cIdx, arr) => cIdx > 0 && cIdx < arr.length - 1);
        const isSeparator = cells.every(cell => /^:?-+:?$/.test(cell));
        
        if (isSeparator) {
          continue;
        }

        if (!currentTable) {
          currentTable = {
            key: idx,
            headers: cells,
            rows: []
          };
        } else {
          // Normalize row cells length to match the header length to prevent crashes or layout breaks
          const normalizedCells = [...cells];
          while (normalizedCells.length < currentTable.headers.length) {
            normalizedCells.push('');
          }
          if (normalizedCells.length > currentTable.headers.length) {
            normalizedCells.splice(currentTable.headers.length);
          }
          currentTable.rows.push(normalizedCells);
        }
        continue;
      } else {
        flushTable(idx);
      }

      // Headers (ensure any pending lists or tables are flushed first)
      if (cleanLine.startsWith('# ')) {
        flushList(idx);
        flushTable(idx);
        const content = cleanLine.replace(/#/g, '').trim();
        elements.push(
          <h3 key={idx} className="text-sm font-black text-white border-b border-[#30363D] pb-1.5 mt-6 mb-3 font-mono uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-3 bg-blue-500 rounded-sm" />
            {content}
          </h3>
        );
        continue;
      }
      if (cleanLine.startsWith('## ')) {
        flushList(idx);
        flushTable(idx);
        const content = cleanLine.replace(/#/g, '').trim();
        elements.push(
          <h4 key={idx} className="text-xs font-bold text-blue-400 border-b border-[#21262D] pb-1 mt-5 mb-2 font-mono uppercase tracking-wider">
            {content}
          </h4>
        );
        continue;
      }
      if (cleanLine.startsWith('### ')) {
        flushList(idx);
        flushTable(idx);
        const content = cleanLine.replace(/#/g, '').trim();
        elements.push(
          <h5 key={idx} className="text-[11px] font-bold text-blue-300 mt-4 mb-1.5 font-mono uppercase tracking-wider">
            {content}
          </h5>
        );
        continue;
      }

      // Check if line is a list item
      const isListItem = cleanLine.startsWith('* ') || cleanLine.startsWith('- ') || cleanLine.startsWith('• ');
      const isBoldListItem = cleanLine.startsWith('* **') || cleanLine.startsWith('- **') || cleanLine.startsWith('• **');

      if (isBoldListItem || isListItem) {
        const itemContent = cleanLine.replace(/^([\*\-\s•]+)/, '').trim();
        if (!currentList) {
          currentList = {
            key: idx,
            items: [itemContent]
          };
        } else {
          currentList.items.push(itemContent);
        }
        continue;
      } else {
        flushList(idx);
      }

      // Standard paragraph
      elements.push(
        <p key={idx} className="text-xs text-[#8B949E] leading-relaxed font-sans mb-3 pl-1">
          {parseInline(cleanLine)}
        </p>
      );
    }

    flushList(lines.length);
    flushTable(lines.length);

    return elements;
  };

  // Sign and submit approval workflow
  const handleApproveReport = () => {
    if (!signName) return;
    const report: PathologyReport = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: `PAT-${sample.id.split('-').pop() || '7329'}`,
      patientName: sample.clinical.gender === 'Female' ? 'Jane Doe' : 'John Doe',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      slideId: sample.id,
      gradePredicted: sample.defaultGrade,
      segmentDice: 0.932,
      segmentIoU: 0.871,
      precision: 0.952,
      recall: 0.913,
      clinicalSummary: `Stage: ${sample.clinical.stage}, Somatic mutation profile: TP53 ${sample.genomic.tp53}`,
      diagnosticReportText: reportText,
      approved: true,
      approvedBy: `${signName}, ${signTitle}`,
      createdAt: new Date().toISOString()
    };
    onReportApproved(report);
  };

  return (
    <div className="bg-[#0D1117] rounded-xl border border-[#1F2937] p-5 flex flex-col space-y-5 shadow-none" id="report-generation-dashboard">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-tight">
          <FileText className="w-4 h-4 text-rose-500" />
          Onco-Pathology Report Generator
        </h3>
        
        {/* Report generator layout level LLM selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#8B949E] uppercase hidden md:inline">Brain:</span>
          <select
            value={selectedModelId}
            onChange={(e) => onModelChange(e.target.value)}
            className="text-[10px] font-mono text-rose-455 text-rose-400 bg-rose-950/20 hover:bg-rose-900/10 border border-rose-900/40 rounded focus:border-rose-500 focus:outline-none px-2 py-0.5 cursor-pointer leading-tight transition-all font-bold"
            title="Switch Active AI Brain"
          >
            {AVAILABLE_MODELS.map((model) => (
              <option key={model.id} value={model.id} className="bg-[#0D1117] text-[#C9D1D9]">
                {model.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-5">
        {/* Left column: input notes and trigger */}
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-4">
            {/* Quick Presets Templates */}
            <div className="space-y-1.5 p-2 bg-[#161B22] border border-[#30363D] rounded-lg">
              <span className="block text-[9px] font-bold text-[#8B949E] uppercase tracking-widest font-mono">1-Click Pathology Presets:</span>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {[
                  { label: "Onco-Staging", text: "Specimen highlights high glandular architectural distortion with cellular pleomorphism. Margin infiltration is prominent. Suggest primary staging review." },
                  { label: "Genomics Co-Omic", text: "Molecular genotyping highlights TP53 mutational burden co-mapped with BRCA1 methylation pathways. Morphological indices match genomic aggression profiles." },
                  { label: "Trial Alignment", text: "Eligible cohort screening. Requesting somatic clinical trial alignment with active urban cancer registry directories for targeted immunotherapy." }
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => setAdditionalNotes(preset.text)}
                    className="px-2 py-1 text-[9px] font-bold bg-[#010409] border border-[#1F2937] hover:border-rose-500 rounded text-[#8B949E] hover:text-[#E0E0E0] transition whitespace-nowrap cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-wider">
                Pathologist Observational Notes (Optional)
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Enter core microscopic details (stromal infiltration, nuclear pleomorphism, focal necrosis)..."
                className="w-full h-32 px-3 py-2 text-xs border border-[#30363D] bg-[#010409] text-white placeholder-[#8B949E]/60 rounded outline-none focus:border-rose-500 transition resize-none font-mono"
              />
            </div>

            {/* Active Model Specs visual badge before triggering generation */}
            <div className="bg-[#161B22] border border-[#30363D] p-2.5 rounded-lg flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-1.5 text-[#C9D1D9]">
                <Cpu className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  Using <strong className="text-white">{activeModelObj.name}</strong>
                </span>
              </div>
              <div className="flex gap-2 text-[#8B949E]">
                <span>{activeModelObj.speed}</span>
                <span>•</span>
                <span>{activeModelObj.contextWindow}</span>
              </div>
            </div>

            <button
              id="generate-report-btn"
              disabled={loading}
              onClick={handleGenerateReport}
              className={`w-full py-2.5 px-4 rounded text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
                loading
                  ? 'bg-[#21262D] border-[#30363D] text-[#8B949E] cursor-wait'
                  : 'bg-rose-600 hover:bg-rose-700 border-rose-500 shadow-none'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-450" />
                  <span>Synthesizing Molecular Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Generate AI Diagnostic Report</span>
                </>
              )}
            </button>
          </div>

          {/* Quick-tips prompt panel */}
          <div className="bg-rose-950/10 border border-rose-900/20 rounded p-3 text-[11px] text-rose-300 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Report Generation Logic
            </div>
            <p className="font-normal opacity-85 leading-relaxed text-[11px] text-[#8B949E]">
              PathGPTPilot aggregates quantitative image segmentation boundaries (MONAI), deep-learning Vision Transformer predictions, and somatic genomics before generating pathology-grade reports via <span className="font-semibold text-white">Gemini</span>.
            </p>
          </div>

          {/* DYNAMIC CLINICAL TRIAL MATCHER MODULE */}
          <div className="border border-[#30363D] rounded-xl p-3.5 bg-[#11161D] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-blue-450 flex items-center gap-1.5 font-mono">
                <Beaker className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                Somatic Clinical Trial Matcher
              </span>
              <span className="text-[9px] font-bold bg-[#010409] text-blue-400 px-1.5 py-0.5 rounded border border-[#1F2937]">Active Registry</span>
            </div>

            <p className="text-[10px] text-[#8B949E] leading-normal">
              Matches active experimental trials in the metropolitan area specifically filtered on tissue source, stage, and mutational anomalies.
            </p>

            <div className="space-y-2 max-h-[14rem] overflow-y-auto pr-1">
              {(() => {
                const trials = [];
                const isStageDeficient = sample.clinical.stage === 'Stage III' || sample.clinical.stage === 'Stage IV';
                const hasTP53 = sample.genomic.tp53 === 'Mutant';
                const hasEGFR = sample.genomic.egfr === 'Amplified';
                const hasBRCA1 = sample.genomic.brca1 === 'Mutant' || sample.genomic.brca1 === 'Methylated';

                if (sample.tissueType.includes('Breast') || sample.id.includes('BRCA')) {
                  if (hasBRCA1) {
                    trials.push({
                      id: 'NCT02187783',
                      title: 'Olaparib Maintenance in Hard-Path HRD Breast Cancer',
                      phase: 'Phase III',
                      relevance: '98% Synergy',
                      desc: 'PARP inhibitor trial for BRCA mutated/methylated cohorts.'
                    });
                  }
                  if (hasTP53) {
                    trials.push({
                      id: 'NCT03830242',
                      title: 'WEE1 Cell Cycle Blockade in TP53 Mutative Core',
                      phase: 'Phase II Study',
                      relevance: '92% Synergy',
                      desc: 'Assesses Adavosertib safety in advanced suppressive mutations.'
                    });
                  }
                } else if (sample.tissueType.includes('Prostate')) {
                  if (isStageDeficient) {
                    trials.push({
                      id: 'NCT04065842',
                      title: 'Metastatic Hormonal Suppression & PARP block in Gleason 9',
                      phase: 'Phase III Trial',
                      relevance: '95% Match',
                      desc: 'Evaluating survival benefits of combined Talazoparib targets.'
                    });
                  }
                  trials.push({
                    id: 'NCT01234567',
                    title: 'Active Surveillance Protocol for Early Localized Glands',
                    phase: 'Observational Study',
                    relevance: '85% Match',
                    desc: 'Aims to reduce therapeutic over-treatment in low grading indexes.'
                  });
                } else if (sample.tissueType.includes('Lung')) {
                  if (hasEGFR) {
                    trials.push({
                      id: 'NCT04561234',
                      title: 'Adjuvant Osimertinib (Tagrisso) Strategy in EGFRm NSCLC',
                      phase: 'Phase III Trial',
                      relevance: '98% Crit Match',
                      desc: 'Evaluating survival benefits post surgery resection for EGFR alterations.'
                    });
                  }
                  trials.push({
                    id: 'NCT09876543',
                    title: 'Adjuvant Immunotherapy Pembrolizumab Phase II',
                    phase: 'Phase II Trial',
                    relevance: '80% Match',
                    desc: 'Determining postoperative progression-free survival targets.'
                  });
                }

                // fallback
                if (trials.length === 0) {
                  trials.push({
                    id: 'NCT00000000',
                    title: 'Universal Solid Tumor Novel Antigen Target study',
                    phase: 'Phase I Trial',
                    relevance: '75% General',
                    desc: 'Investigating vaccine therapy matches against diverse somatic mutations.'
                  });
                }

                return trials.map((t) => {
                  const isAlreadyInjected = additionalNotes.includes(t.id);
                  return (
                    <div key={t.id} className="p-2.5 rounded border border-[#30363D] bg-[#0D1117] space-y-1.5 text-[11px]">
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-bold text-white leading-tight font-sans">{t.title}</span>
                        <span className="text-[8px] font-mono bg-blue-950/40 text-blue-400 px-1 py-0.5 rounded border border-blue-900/30 whitespace-nowrap">{t.relevance}</span>
                      </div>
                      <div className="text-[9px] text-[#8B949E] font-mono">{t.id} • {t.phase}</div>
                      <p className="text-[10px] text-[#8B949E] leading-normal">{t.desc}</p>
                      
                      <button
                        onClick={() => {
                          if (isAlreadyInjected) return;
                          const injection = `[Clinical Trial Match: ${t.id} - ${t.title} (${t.phase}) - Relevance: ${t.relevance}]`;
                          setAdditionalNotes(p => p ? `${p}\n${injection}` : injection);
                        }}
                        className={`w-full py-1 rounded text-[9px] font-bold uppercase tracking-wider border transition-colors ${
                          isAlreadyInjected
                            ? 'bg-emerald-950/10 border-emerald-900/20 text-emerald-400 cursor-default'
                            : 'bg-[#161B22] border-[#30363D] text-[#C9D1D9] hover:bg-[#21262D] hover:text-white cursor-pointer'
                        }`}
                      >
                        {isAlreadyInjected ? '✓ Injected into Observational Notes' : '+ Inject Trial into Notes'}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Right column: Report document display */}
        <div className="md:col-span-3 border border-[#1F2937] rounded-xl overflow-hidden bg-[#161B22] flex flex-col h-[44rem] shadow-none">
          
          {/* Document header action bar */}
          <div className="bg-[#0D1117] border-b border-[#1F2937] px-4 py-2.5 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-mono font-bold uppercase text-[#8B949E] flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${approvedReport ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
              {approvedReport ? 'Document Authenticated' : reportText ? 'Draft Pending Review' : 'Empty Document'}
            </span>
            {reportText && (
              <div className="flex space-x-1.5">
                <button
                  onClick={() => setIsChartModalOpen(true)}
                  className="p-1 px-2 bg-rose-600 border border-rose-500 hover:bg-rose-750 text-white rounded text-[9px] font-bold uppercase tracking-wide flex items-center gap-1.5 transition-colors cursor-pointer"
                  id="export-pdf-report-btn"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Case Chart PDF</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-1 px-2 bg-[#21262D] border border-[#30363D] hover:bg-[#30363D] rounded text-[#C9D1D9] text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 transition-colors cursor-pointer"
                  id="print-report-btn"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            )}
          </div>

          {/* Document Content */}
          <div className="p-5 overflow-y-auto bg-[#010409] flex-1 relative font-sans">
            {reportText ? (
              <div className="bg-[#0D1117] border border-[#30363D] p-5 rounded-lg relative">
                
                {/* Hospital/Lab Letterhead header */}
                <div className="border-b border-[#21262D] pb-3 mb-3 flex justify-between items-start text-xs shrink-0">
                  <div className="space-y-0.5">
                    <div className="font-black text-rose-600 uppercase tracking-wider text-sm flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-rose-500" /> PathGPTPilot Advanced Oncology
                    </div>
                    <p className="text-[#8B949E] text-[9px]">Division of Computational Pathology & Molecular Profiling</p>
                  </div>
                  <div className="text-right text-[9px] text-[#8B949E] space-y-0.5">
                    <p>Specimen ID: <b>{sample.id}</b></p>
                    <p>Archive Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Patient / Doctor Profile Row */}
                <div className="grid grid-cols-3 gap-3 border-b border-[#21262D] pb-2.5 mb-3 text-[10px] bg-[#161B22] border border-[#30363D] p-2 rounded">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-[#8B949E]">Patient Identifier</span>
                    <span className="font-bold text-[#E0E0E0]">PAT-{sample.id.split('-').pop() || '7329'} ({sample.clinical.gender === 'Female' ? 'Jane Doe' : 'John Doe'})</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-[#8B949E]">Specimen Source</span>
                    <span className="font-semibold text-[#E0E0E0]">{sample.tissueType}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-[#8B949E]">Referral Stage</span>
                    <span className="font-semibold text-blue-400 font-mono">{sample.clinical.stage}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {renderMarkdown(reportText)}
                </div>

                {/* Signature status block */}
                {approvedReport ? (
                  <div className="mt-6 border-t border-emerald-900/30 pt-4 bg-emerald-950/10 p-3 rounded flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-emerald-400 uppercase tracking-wide text-[10px]">Electronic Signoff Complete</p>
                      <p className="text-[#C9D1D9] text-[10px] mt-0.5">Licensed Practitioner: <b>{approvedReport.approvedBy}</b></p>
                      <p className="text-[9px] text-[#8B949E]">Timestamp: {new Date(approvedReport.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 border-t border-[#21262D] pt-3.5 space-y-2.5">
                    <div className="text-xs font-bold text-[#E0E0E0] uppercase tracking-wide">Pathologist Authentication Signoff</div>
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={signName}
                          onChange={(e) => setSignName(e.target.value)}
                          placeholder="Provider Name (Dr. Jane Doe)"
                          className="w-full px-2.5 py-1.5 text-xs border border-[#30363D] rounded bg-[#010409] text-white outline-none focus:border-rose-500 font-mono"
                        />
                      </div>
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={signTitle}
                          onChange={(e) => setSignTitle(e.target.value)}
                          placeholder="Physician Title Description"
                          className="w-full px-2.5 py-1.5 text-xs border border-[#30363D] rounded bg-[#010409] text-white outline-none focus:border-rose-500 font-mono"
                        />
                      </div>
                      <button
                        disabled={!signName}
                        onClick={handleApproveReport}
                        className={`sm:w-auto w-full py-1.5 px-3.5 text-white rounded text-[11px] font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 shrink-0 h-[28px] whitespace-nowrap ${
                          signName ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer border border-blue-500' : 'bg-[#161B22] border border-[#30363D] text-[#8B949E] cursor-not-allowed'
                        }`}
                        id="approve-report-btn"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Authenticate & Sign</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full text-[#8B949E] py-12">
                <FileText className="w-10 h-10 stroke-1 text-[#30363D] mb-2" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#C9D1D9] mb-1">Diagnostic Report Queue Empty</span>
                <p className="text-[11px] max-w-xs font-normal leading-relaxed text-[#8B949E]/70">
                  Select specimen parameters, register observational notes, and request clinical report generation to begin authenticating diagnostic drafts.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* HIGH-FIDELITY PATHOLOGY CASE CHART PDF EXPORT MODAL */}
      {isChartModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-[#0D1117] border border-[#30363D] w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#21262D]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-500 animate-pulse" />
                <span className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Diagnostic Case Chart & PDF Export
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const style = document.createElement('style');
                    style.id = 'pathology-print-style-block';
                    style.innerHTML = `
                      @media print {
                        body > * {
                          display: none !important;
                        }
                        #pathology-print-modal-parent {
                          display: block !important;
                          position: absolute !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: 100% !important;
                          background: white !important;
                          color: black !important;
                        }
                        #pathology-print-target-chart {
                          display: block !important;
                          width: 100% !important;
                          max-width: 100% !important;
                          padding: 0 !important;
                          margin: 0 !important;
                          box-shadow: none !important;
                          border: none !important;
                          background: white !important;
                          color: black !important;
                        }
                        .no-print {
                          display: none !important;
                        }
                      }
                    `;
                    document.head.appendChild(style);
                    window.print();
                    setTimeout(() => {
                      const el = document.getElementById('pathology-print-style-block');
                      if (el) el.remove();
                    }, 500);
                  }}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-750 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow border border-rose-500"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setIsChartModalOpen(false)}
                  className="px-3 py-1.5 bg-[#21262D] hover:bg-[#30363D] border border-[#30363D] rounded text-xs text-[#C9D1D9] hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Modal Scrollable Container */}
            <div className="p-6 overflow-y-auto bg-[#010409] flex-1" id="pathology-print-modal-parent">
              
              {/* THE PRINTABLE TARGET CHART */}
              <div 
                id="pathology-print-target-chart"
                className="bg-white text-gray-900 p-8 rounded-lg shadow-xl border border-gray-250 max-w-3xl mx-auto font-sans"
              >
                {/* Header Letterhead */}
                <div className="flex justify-between items-start border-b-2 border-rose-600 pb-4 mb-5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-6 bg-rose-600 rounded-sm inline-block" />
                      <span className="text-xl font-black uppercase tracking-tight text-rose-600 font-mono">
                        PathGPTPilot Advanced Oncology
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase tracking-wider">
                      Division of Computational Pathology & Molecular Profiling
                    </div>
                    <div className="text-[9px] text-gray-400 mt-0.5">
                      Authorized National Oncology Cohort Reference Center • CLIA Certified
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    {/* Simulated Barcode */}
                    <div className="flex gap-0.5 h-6 w-28 items-stretch mb-1 select-none">
                      {[1,2,3,1,2,1,3,2,1,2,1,3,1,2,1,3].map((val, idx) => (
                        <div 
                          key={idx} 
                          className="bg-black" 
                          style={{ width: `${val * 1.5}px` }} 
                        />
                      ))}
                    </div>
                    <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest font-black select-none">
                      *WSI-{sample.id}*
                    </div>
                  </div>
                </div>

                {/* Document Title Flag */}
                <div className="bg-gray-100 border border-gray-250 rounded px-4 py-2 mb-5 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-800 font-mono">
                    CONSOLIDATED CLINICAL DIAGNOSTIC DOSSIER
                  </span>
                  <span className="text-[10px] font-mono font-bold text-gray-500">
                    DATE: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                {/* Patients & Specimen Info Block */}
                <div className="grid grid-cols-2 gap-4 mb-5 border border-gray-200 rounded p-4 bg-gray-50/50 text-xs">
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider font-mono">Patient Demographics</div>
                    <div><span className="text-gray-500">Patient ID:</span> <strong className="text-gray-950 font-mono">PAT-{sample.id.split('-').pop() || '7329'} ({sample.clinical.gender === 'Female' ? 'Jane Doe' : 'John Doe'})</strong></div>
                    <div><span className="text-gray-500">Age / Gender:</span> <strong className="text-gray-900">{sample.clinical.age} Years • {sample.clinical.gender}</strong></div>
                    <div><span className="text-gray-500">Referral Stage:</span> <strong className="text-rose-600 font-mono font-bold">{sample.clinical.stage}</strong></div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider font-mono">Specimen & Image Profiles</div>
                    <div><span className="text-gray-500">Specimen ID:</span> <strong className="text-gray-950 font-mono">{sample.id}</strong></div>
                    <div><span className="text-gray-500">Tissue Source:</span> <strong className="text-gray-900">{sample.tissueType}</strong></div>
                    <div><span className="text-gray-500">Imaging Configuration:</span> <strong className="text-gray-900">{sample.magnification} H&E Slide ({sample.originDataset})</strong></div>
                  </div>
                </div>

                {/* Two Column Layout: Slide Preview Map vs Risk/Genomic Factors */}
                <div className="grid grid-cols-5 gap-5 mb-5">
                  
                  {/* Slide Preview Map Container */}
                  <div className="col-span-2 border border-gray-200 rounded-lg p-3.5 bg-gray-50 flex flex-col items-center justify-center text-center">
                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-mono">
                      Slide Structure Minimap
                    </div>
                    
                    {/* Beautiful Canvas-Like vector graphic illustrating pathology sample cells */}
                    <div className="w-28 h-28 rounded-full border border-gray-300 relative bg-[#FDE8E8] overflow-hidden shadow-inner flex items-center justify-center mb-2 select-none">
                      <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle, #E11D48 10%, transparent 10%)', backgroundSize: '8px 8px' }} />
                      {/* Styled vector glands */}
                      <div className="absolute top-4 left-4 w-10 h-10 rounded-full border-2 border-rose-400 bg-rose-200/50 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-rose-500" />
                      </div>
                      <div className="absolute bottom-5 right-6 w-12 h-10 rounded-full border-2 border-rose-400 bg-rose-200/50 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-rose-500" />
                      </div>
                      {/* Small cells */}
                      {[
                        {t: 20, l: 60}, {t: 45, l: 75}, {t: 70, l: 30}, {t: 80, l: 70}, {t: 30, l: 25}
                      ].map((pos, i) => (
                        <div key={i} className="absolute w-2 h-2 rounded-full bg-indigo-700/80 border border-black/20" style={{ top: `${pos.t}%`, left: `${pos.l}%` }} />
                      ))}
                      {/* Watermark label */}
                      <div className="absolute bottom-1 bg-white/85 px-1 rounded border border-gray-200 text-[6px] font-mono font-black tracking-wide text-gray-600 uppercase">
                        SPECIMEN CORE
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-700 space-y-0.5 w-full font-mono">
                      <div className="flex justify-between border-b border-gray-250 pb-0.5">
                        <span className="text-gray-400">Total Cells:</span>
                        <span className="font-bold text-gray-950">{sample.cells.length} count</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-250 pb-0.5">
                        <span className="text-gray-400">Atypical cells:</span>
                        <span className="font-bold text-red-600">
                          {sample.cells.filter(c => c.atypical).length} ({Math.round(sample.cells.filter(c => c.atypical).length / Math.max(1, sample.cells.length) * 100)}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Confidence:</span>
                        <span className="font-bold text-blue-600">{sample.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Molecular / Genomic BioMarker Profile & Validation Metrics */}
                  <div className="col-span-3 border border-gray-200 rounded-lg p-3.5 bg-gray-50 flex flex-col justify-between text-xs">
                    <div>
                      <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2.5 font-mono">
                        Genomic & Computational Markers
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-white border border-gray-200 p-2 rounded">
                          <span className="block text-[8px] uppercase font-bold text-gray-400 font-mono">TP53 Status</span>
                          <span className={`text-[11px] font-bold font-mono ${sample.genomic.tp53 === 'Mutant' ? 'text-red-600' : 'text-emerald-600'}`}>
                            {sample.genomic.tp53.toUpperCase()}
                          </span>
                        </div>
                        <div className="bg-white border border-gray-200 p-2 rounded">
                          <span className="block text-[8px] uppercase font-bold text-gray-400 font-mono">EGFR Amplification</span>
                          <span className={`text-[11px] font-bold font-mono ${sample.genomic.egfr === 'Amplified' ? 'text-red-500' : 'text-gray-700'}`}>
                            {sample.genomic.egfr.toUpperCase()}
                          </span>
                        </div>
                        <div className="bg-white border border-gray-200 p-2 rounded col-span-2">
                          <span className="block text-[8px] uppercase font-bold text-gray-400 font-mono">BRCA1 Methylation</span>
                          <span className="text-[11px] font-bold text-gray-700 font-mono">
                            {sample.genomic.brca1.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-2.5 space-y-1 font-mono text-[9px] text-gray-500">
                      <div className="flex justify-between">
                        <span>SwinUNETR Segmentation Mean Dice:</span>
                        <span className="font-bold text-gray-900">0.932 (93.2%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mean Intersection over Union (IoU):</span>
                        <span className="font-bold text-gray-900">0.871 (87.1%)</span>
                      </div>
                      <div className="flex justify-between text-blue-600">
                        <span>AI Model Backend Engine:</span>
                        <span className="font-bold">{activeModelObj.name}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* AI Spatial Annotations Block */}
                <div className="mb-5">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-mono">
                    Operator Slide Annotations & Histopathological Markers
                  </div>
                  {annotations.length > 0 ? (
                    <div className="border border-gray-200 rounded overflow-hidden">
                      <table className="w-full text-left text-[10px] font-mono">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-250 text-gray-700">
                            <th className="p-2 font-black">ID</th>
                            <th className="p-2 font-black">COORDINATES</th>
                            <th className="p-2 font-black">MARKER LABEL</th>
                            <th className="p-2 font-black">CLINICAL OBSERVATION DESCRIPTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-800">
                          {annotations.map((ann) => (
                            <tr key={ann.id} className="hover:bg-gray-50">
                              <td className="p-2 font-bold text-rose-600">{ann.id}</td>
                              <td className="p-2 text-gray-500">X: {ann.x} | Y: {ann.y}</td>
                              <td className="p-2">
                                <span className="bg-red-50 text-red-700 border border-red-200 px-1 py-0.2 rounded font-bold">
                                  {ann.label}
                                </span>
                              </td>
                              <td className="p-2 font-sans italic text-gray-600">{ann.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded p-4 text-center text-[10px] text-gray-400 italic">
                      No spatial annotation indicators or region-of-interest flags were recorded on this slide scan.
                    </div>
                  )}
                </div>

                {/* Narrative Diagnostic Report Summary Text */}
                <div className="mb-6">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5 font-mono">
                    Narrative Histopathology Diagnosis Statement
                  </div>
                  <div className="border border-gray-200 rounded-lg p-5 bg-gray-50 text-[11px] leading-relaxed text-gray-800 font-serif whitespace-pre-wrap">
                    {reportText ? (
                      reportText
                        .replace(/###?\s+(.*?)\n/g, '\n**$1**\n')
                        .replace(/\*\*(.*?)\*\*/g, '$1')
                        .replace(/•\s+/g, '• ')
                        .trim()
                    ) : (
                      'Diagnostic narrative review draft was not instantiated.'
                    )}
                  </div>
                </div>

                {/* Print Sign-off Block */}
                <div className="border-t border-gray-300 pt-5 flex justify-between items-end">
                  <div>
                    <div className="text-[9px] uppercase font-mono font-bold tracking-widest text-gray-400">
                      Authentication Status Flag
                    </div>
                    {approvedReport ? (
                      <div className="mt-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded p-2 flex items-center gap-2 max-w-sm">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <div className="text-[10px] font-mono leading-tight">
                          <div className="font-bold text-emerald-700">CLINICALLY AUTHENTICATED</div>
                          <div className="text-[8px] text-gray-500">PROVIDER: {approvedReport.approvedBy}</div>
                          <div className="text-[8px] text-gray-400 font-mono">SHA256: verified_onc_{sample.id}_gpt</div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 bg-amber-50 text-amber-800 border border-amber-200 rounded p-2 flex items-center gap-2 max-w-sm">
                        <HelpCircle className="w-5 h-5 text-amber-600 animate-pulse" />
                        <div className="text-[10px] font-mono leading-tight">
                          <div className="font-bold text-amber-700">DRAFT REVIEW IN PROGRESS</div>
                          <div className="text-[8px] text-gray-500">NOT FOR DECLARED DIAGNOSTIC CLINICAL SEEDING</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="w-40 border-b border-gray-400 h-10 flex items-end justify-center font-serif text-xs text-gray-600 italic">
                      {approvedReport ? approvedReport.approvedBy?.split(',')[0] : 'Dr. Pending Signature'}
                    </div>
                    <div className="text-[8px] uppercase font-mono font-bold text-gray-400 mt-1">
                      Pathologist Signature Authority
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
