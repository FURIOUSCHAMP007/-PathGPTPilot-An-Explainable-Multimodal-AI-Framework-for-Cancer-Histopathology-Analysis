/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HistologySample, PathologyReport, LLMModel } from '../types';
import { AVAILABLE_MODELS } from '../data';
import { FileText, Sparkles, CheckCircle2, RefreshCw, Printer, FileDown, CheckCircle, Clock, Beaker, Cpu } from 'lucide-react';

interface ReportGeneratorProps {
  sample: HistologySample;
  onReportApproved: (report: PathologyReport) => void;
  approvedReport: PathologyReport | null;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
}

export default function ReportGenerator({
  sample,
  onReportApproved,
  approvedReport,
  selectedModelId,
  onModelChange
}: ReportGeneratorProps) {
  const activeModelObj = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];
  const [loading, setLoading] = useState<boolean>(false);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [reportText, setReportText] = useState<string>('');
  const [signName, setSignName] = useState<string>('');
  const [signTitle, setSignTitle] = useState<string>('Lead Molecular Pathologist');

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

  // Simple, elegant parser to render markdown summaries natively
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const cleanLine = line.trim();
      const contentWithoutHashes = cleanLine.replace(/#/g, '').trim();
      if (cleanLine.startsWith('# ')) {
        return <h3 key={idx} className="text-sm font-black text-white border-b border-[#30363D] pb-1.5 mt-5 mb-2.5 font-mono uppercase tracking-wide">{contentWithoutHashes}</h3>;
      }
      if (cleanLine.startsWith('## ')) {
        return <h4 key={idx} className="text-xs font-bold text-[#E0E0E0] uppercase tracking-wider border-b border-[#21262D] pb-1 mt-4 mb-2">{contentWithoutHashes}</h4>;
      }
      if (cleanLine.startsWith('### ')) {
        return <h5 key={idx} className="text-[11px] font-bold text-blue-400 uppercase tracking-wide mt-3 mb-1">{contentWithoutHashes}</h5>;
      }
      if (cleanLine.startsWith('* **') || cleanLine.startsWith('- **')) {
        // Parse bullets with bold
        const parts = contentWithoutHashes.split('**');
        return (
          <div key={idx} className="text-xs text-[#C9D1D9] pl-3 py-0.5 flex items-start gap-1.5">
            <span className="text-blue-500 font-bold">•</span>
            <span>
              <strong className="text-white font-black">{parts[1]}</strong>
              {parts.slice(2).join('')}
            </span>
          </div>
        );
      }
      if (cleanLine.startsWith('* ') || cleanLine.startsWith('- ')) {
        return (
          <div key={idx} className="text-xs text-[#C9D1D9] pl-3 py-0.5 flex items-start gap-1.5">
            <span className="text-blue-500 font-bold">•</span>
            <span>{contentWithoutHashes}</span>
          </div>
        );
      }
      if (cleanLine.startsWith('**')) {
        return <p key={idx} className="text-xs text-blue-300 bg-blue-950/20 rounded p-2 my-2 font-medium border-l-2 border-blue-500">{contentWithoutHashes.replace(/\*\*/g, '')}</p>;
      }
      if (cleanLine === '') {
        return <div key={idx} className="h-1.5" />;
      }
      return <p key={idx} className="text-xs text-[#C9D1D9] leading-relaxed font-normal mb-1.5">{contentWithoutHashes}</p>;
    });
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
        <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
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
        <div className="md:col-span-3 border border-[#1F2937] rounded-xl overflow-hidden bg-[#161B22] flex flex-col min-h-[24rem] shadow-none">
          
          {/* Document header action bar */}
          <div className="bg-[#0D1117] border-b border-[#1F2937] px-4 py-2.5 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-mono font-bold uppercase text-[#8B949E] flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${approvedReport ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
              {approvedReport ? 'Document Authenticated' : reportText ? 'Draft Pending Review' : 'Empty Document'}
            </span>
            {reportText && (
              <div className="flex space-x-1.5">
                <button
                  onClick={() => window.print()}
                  className="p-1 px-2 bg-[#21262D] border border-[#30363D] hover:bg-[#30363D] rounded text-[#C9D1D9] text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 transition-colors"
                  id="print-report-btn"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            )}
          </div>

          {/* Document Content */}
          <div className="p-5 overflow-y-auto max-h-[22rem] bg-[#010409] flex-1 relative font-sans">
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
                    <span className="font-bold text-[#E0E0E0]">PAT-7329 (Jane Doe)</span>
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
                  <div className="mt-6 border-t border-[#21262D] pt-3.5 space-y-3">
                    <div className="text-xs font-bold text-[#E0E0E0] uppercase tracking-wide">Pathologist Authentication Signoff</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={signName}
                          onChange={(e) => setSignName(e.target.value)}
                          placeholder="Provider Name (Dr. Jane Doe)"
                          className="w-full px-2.5 py-1.5 text-xs border border-[#30363D] rounded bg-[#010409] text-white outline-none focus:border-rose-500 font-mono"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={signTitle}
                          onChange={(e) => setSignTitle(e.target.value)}
                          placeholder="Physician Title Description"
                          className="w-full px-2.5 py-1.5 text-xs border border-[#30363D] rounded bg-[#010409] text-white outline-none focus:border-rose-500 font-mono"
                        />
                      </div>
                    </div>
                    <button
                      disabled={!signName}
                      onClick={handleApproveReport}
                      className={`w-full py-2 px-3 text-white rounded text-[11px] font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 ${
                        signName ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer border border-blue-500' : 'bg-[#161B22] border border-[#30363D] text-[#8B949E] cursor-not-allowed'
                      }`}
                      id="approve-report-btn"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Authenticate & Sign Medical Record</span>
                    </button>
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
    </div>
  );
}
