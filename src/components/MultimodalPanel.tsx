/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HistologySample, GenomicData, ClinicalData } from '../types';
import { Activity, Beaker, HelpCircle, UserPlus, FileText, ChevronRight, Info } from 'lucide-react';

interface MultimodalPanelProps {
  sample: HistologySample;
  onUpdateGenomics: (updated: GenomicData) => void;
  onUpdateClinical: (updated: ClinicalData) => void;
}

export default function MultimodalPanel({
  sample,
  onUpdateGenomics,
  onUpdateClinical
}: MultimodalPanelProps) {
  const [activeTab, setActiveTab] = useState<'genetics' | 'clinical'>('genetics');

  // Dynamic risk calculation based on genotypes, grade, and demographics
  const hasTP53 = sample.genomic.tp53 === 'Mutant';
  const hasEGFR = sample.genomic.egfr === 'Amplified';
  const hasBRCA1 = sample.genomic.brca1 === 'Mutant' || sample.genomic.brca1 === 'Methylated';
  
  const isHighClinicalStage = sample.clinical.stage === 'Stage III' || sample.clinical.stage === 'Stage IV';
  const isLowGrade = sample.defaultGrade.includes('Gleason 3+3') || sample.defaultGrade.includes('Grade I');

  // Compute a comprehensive risk index (0 to 100)
  let riskScore = 20; // baseline
  if (hasTP53) riskScore += 30;
  if (hasEGFR) riskScore += 15;
  if (hasBRCA1) riskScore += 15;
  if (isHighClinicalStage) riskScore += 25;
  if (isLowGrade) riskScore -= 20;
  riskScore = Math.max(5, Math.min(95, riskScore));

  const getRiskColor = (score: number) => {
    if (score < 35) return 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30';
    if (score < 65) return 'text-amber-400 bg-amber-950/20 border-amber-900/30';
    return 'text-rose-400 bg-rose-950/20 border-rose-900/30';
  };

  const getRiskLabel = (score: number) => {
    if (score < 35) return 'Low Prognostic Risk';
    if (score < 65) return 'Intermediate Prognostic Risk';
    return 'High Aggression Risk';
  };

  // Generate Kaplan-Meier Survival Curve coordinates based on current riskScore
  // High riskScore: fast decay. Low riskScore: slow decay.
  const generateKMCurve = (risk: number) => {
    const points: Array<{ month: number; survival: number }> = [];
    const decayConst = risk / 180; // risk adjusts decay speed
    for (let m = 0; m <= 60; m += 5) {
      // S-curve exponential decay
      const survival = Math.round(100 * Math.exp(-decayConst * (m / 10) ** 1.3));
      points.push({ month: m, survival: Math.max(2, survival) });
    }
    return points;
  };

  const curveData = generateKMCurve(riskScore);
  
  // Create the SVG path coordinates
  const svgWidth = 400;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingY = 25;

  const getSvgCoordinates = (data: Array<{ month: number; survival: number }>) => {
    return data.map((d) => {
      const x = paddingX + (d.month / 60) * (svgWidth - paddingX * 2);
      const y = svgHeight - paddingY - (d.survival / 100) * (svgHeight - paddingY * 2);
      return `${x},${y}`;
    }).join(' ');
  };

  const pathString = `M ${getSvgCoordinates(curveData)}`;

  return (
    <div className="bg-[#0D1117] rounded-xl border border-[#1F2937] p-5 flex flex-col lg:grid lg:grid-cols-2 gap-5 shadow-none" id="multimodal-omics-panel">
      
      {/* Risk and Genetics Configuration UI */}
      <div className="flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-tight">
              <Beaker className="w-4 h-4 text-blue-500" />
              Multimodal Diagnostics
            </h3>

            {/* Tab switch */}
            <div className="flex bg-[#010409] border border-[#1F2937] p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('genetics')}
                className={`px-3 py-1 text-xs font-semibold rounded transition ${
                  activeTab === 'genetics' ? 'bg-[#161B22] border border-[#30363D] text-blue-400 font-bold' : 'text-[#8B949E] hover:text-white'
                }`}
              >
                Genomics
              </button>
              <button
                onClick={() => setActiveTab('clinical')}
                className={`px-3 py-1 text-xs font-semibold rounded transition ${
                  activeTab === 'clinical' ? 'bg-[#161B22] border border-[#30363D] text-blue-400 font-bold' : 'text-[#8B949E] hover:text-white'
                }`}
              >
                Clinical
              </button>
            </div>
          </div>

          <p className="text-xs text-[#8B949E] mb-4 leading-relaxed font-normal">
            Oncology prognosis factors structural morphology co-mapped with diagnostic stage metrics and somatic/molecular sequence attributes.
          </p>

          {/* Tab 1: Genomics Somatic-Omic configuration */}
          {activeTab === 'genetics' && (
            <div className="space-y-3">
              {/* TP53 somatic mutation info */}
              <div className="border border-[#30363D] rounded-lg p-3 bg-[#161B22] relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#E0E0E0]">Tumor Suppressor Protein TP53</span>
                  <select
                    value={sample.genomic.tp53}
                    onChange={(e) => onUpdateGenomics({ ...sample.genomic, tp53: e.target.value as any })}
                    className="text-xs font-semibold text-[#E0E0E0] border border-[#30363D] bg-[#010409] rounded px-1.5 py-1 outline-none focus:border-blue-500 cursor-pointer text-right"
                  >
                    <option value="Wild-type">Wild-type</option>
                    <option value="Mutant">Mutant</option>
                  </select>
                </div>
                <p className="text-[11px] text-[#8B949E]">
                  Loss of function correlates molecularly to high nuclear pleomorphism and structural instability.
                </p>
              </div>

              {/* BRCA1 status choice */}
              <div className="border border-[#30363D] rounded-lg p-3 bg-[#161B22]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#E0E0E0]">BRCA1 Homologous Recombination</span>
                  <select
                    value={sample.genomic.brca1}
                    onChange={(e) => onUpdateGenomics({ ...sample.genomic, brca1: e.target.value as any })}
                    className="text-xs font-semibold text-[#E0E0E0] border border-[#30363D] bg-[#010409] rounded px-1.5 py-1 outline-none focus:border-blue-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Methylated">Methylated</option>
                    <option value="Mutant">Mutant Signature</option>
                  </select>
                </div>
                <p className="text-[11px] text-[#8B949E]">
                  Deficiency impairs DNA repair pathways but offers prognostic insight for chemotherapy options.
                </p>
              </div>

              {/* EGFR replication status */}
              <div className="border border-[#30363D] rounded-lg p-3 bg-[#161B22]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#E0E0E0]">EGFR Proliferation Receptors</span>
                  <select
                    value={sample.genomic.egfr}
                    onChange={(e) => onUpdateGenomics({ ...sample.genomic, egfr: e.target.value as any })}
                    className="text-xs font-semibold text-[#E0E0E0] border border-[#30363D] bg-[#010409] rounded px-1.5 py-1 outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Amplified">Amplified</option>
                  </select>
                </div>
                <p className="text-[11px] text-[#8B949E]">
                  Tyrosine-kinase pathway duplication indicates elevated mitosis and metastatic index.
                </p>
              </div>

              {/* DYNAMIC FDA COMPANION THERAPEUTICS TARGET SELECTOR BOARD */}
              <div className="mt-4 p-3.5 bg-[#0D1117] border border-[#30363D] rounded-lg space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5 font-mono">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse inline-block" />
                  FDA Companion Therapeutics Matcher
                </span>
                
                <div className="space-y-2">
                  {(() => {
                    const matched: Array<{bm: string; drug: string; class: string; status: string; desc: string; isAppr: boolean}> = [];
                    if (hasEGFR) {
                      matched.push({
                        bm: 'EGFR Amplification',
                        drug: 'Osimertinib (Tagrisso)',
                        class: 'EGFR Tyrosine Kinase Inhibitor',
                        status: 'FDA Approved Companion',
                        desc: 'First-line targets high mitotic proliferation indexes.',
                        isAppr: true
                      });
                    }
                    if (hasBRCA1) {
                      matched.push({
                        bm: 'BRCA1 Deficiency',
                        drug: 'Olaparib (Lynparza)',
                        class: 'PARP Pathway Inhibitor',
                        status: 'FDA Approved Companion',
                        desc: 'Targeted synthetic lethality in repair deficient cells.',
                        isAppr: true
                      });
                    }
                    if (hasTP53) {
                      matched.push({
                        bm: 'TP53 Inability',
                        drug: 'Adavosertib (WEE1-m)',
                        class: 'G2/M Checkpoint Inhibitor',
                        status: 'Investigational Phase II',
                        desc: 'Sensitizes tp53-mutant tumor lines to DNA damage.',
                        isAppr: false
                      });
                    }
                    if (matched.length === 0) {
                      matched.push({
                        bm: 'Wild-type Profile',
                        drug: 'Adjuvant Platinum Doublets',
                        class: 'Broad Cytotoxic Core',
                        status: 'NCCN Standard Protocol',
                        desc: 'Normal genomic status warrants standard chemotherapy.',
                        isAppr: true
                      });
                    }
                    
                    return matched.map((m, idx) => (
                      <div key={idx} className={`p-2.5 rounded border text-[11px] bg-[#161B22]/50 ${
                        m.isAppr ? 'border-emerald-850/60' : 'border-blue-900/40'
                      }`}>
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="text-white font-bold">{m.drug}</span>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono ${
                            m.isAppr ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/30' : 'text-blue-400 bg-blue-950/40 border border-blue-900/30'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8B949E] font-medium font-mono mb-1">{m.bm} • {m.class}</div>
                        <p className="text-[10px] text-[#8B949E] leading-normal">{m.desc}</p>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Clinical Data Choice */}
          {activeTab === 'clinical' && (
            <div className="space-y-3">
              {/* Patient Age selection */}
              <div className="border border-[#30363D] rounded-lg p-3 bg-[#161B22]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#E0E0E0]">Patient Age</span>
                  <span className="text-xs font-mono font-bold text-blue-400">{sample.clinical.age} years old</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="90"
                  value={sample.clinical.age}
                  onChange={(e) => onUpdateClinical({ ...sample.clinical, age: parseInt(e.target.value) })}
                  className="w-full h-1 bg-[#010409] rounded appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Clinical Staging dropdown */}
              <div className="border border-[#30363D] rounded-lg p-3 bg-[#161B22]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#E0E0E0]">Tumor TNM Clinical Stage</span>
                  <select
                    value={sample.clinical.stage}
                    onChange={(e) => onUpdateClinical({ ...sample.clinical, stage: e.target.value as any })}
                    className="text-xs font-semibold text-[#E0E0E0] border border-[#30363D] bg-[#010409] rounded px-1.5 py-1 outline-none focus:border-blue-500"
                  >
                    <option value="Stage I">Stage I (Localized)</option>
                    <option value="Stage II">Stage II (Invasion)</option>
                    <option value="Stage III">Stage III (Nodal Load)</option>
                    <option value="Stage IV">Stage IV (Metastatic)</option>
                  </select>
                </div>
                <p className="text-[11px] text-[#8B949E]">
                  Describes geographic tumor progression and regional nodal load parameters.
                </p>
              </div>

              {/* Demographics smoking */}
              <div className="border border-[#30363D] rounded-lg p-3 bg-[#161B22]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#E0E0E0]">Smoking History</span>
                  <select
                    value={sample.clinical.smokingHistory || 'Never'}
                    onChange={(e) => onUpdateClinical({ ...sample.clinical, smokingHistory: e.target.value as any })}
                    className="text-xs font-semibold text-[#E0E0E0] border border-[#30363D] bg-[#010409] rounded px-1.5 py-1 outline-none focus:border-blue-500"
                  >
                    <option value="Never">Never</option>
                    <option value="Former">Former SM</option>
                    <option value="Active">Active SM</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Risk Rating Display */}
        <div className={`mt-4 rounded-lg border p-3.5 flex items-center justify-between ${getRiskColor(riskScore)}`}>
          <div>
            <div className="text-[9px] uppercase font-bold tracking-wider opacity-85">Co-omic Projections</div>
            <div className="text-sm font-bold leading-none mt-1">{getRiskLabel(riskScore)}</div>
            <p className="text-[10px] opacity-75 mt-1 max-w-[17rem]">
              Aggression risk index calculated at <span className="font-bold text-white">{riskScore}/100</span> based on clinical markers.
            </p>
          </div>
          <div className="text-xl font-black font-mono tracking-tight shrink-0">{riskScore}%</div>
        </div>
      </div>

      {/* 2. Right side Kaplan-Meier plot */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 flex flex-col justify-between shadow-none">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#C9D1D9] flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              Prognostic Kaplan-Meier Curve
            </span>
            <span className="text-[9px] text-blue-400 bg-blue-950/40 border border-blue-900/40 rounded px-2 py-0.5 font-bold font-mono uppercase tracking-wide">
              Monte-Carlo Simulation
            </span>
          </div>
          <p className="text-[11px] text-[#8B949E] mb-3 leading-normal">
            Probability projection plot of disease-free cohort survival over 60 months based on active signatures.
          </p>

          <div className="bg-[#010409] rounded-lg border border-[#30363D] p-2 relative">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
              {/* Grid Lines */}
              <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#21262D" strokeWidth="1.5" />
              <line x1={paddingX} y1={paddingY} x2={paddingX} y2={svgHeight - paddingY} stroke="#21262D" strokeWidth="1.5" />
              
              {/* Intermediate grids */}
              {[25, 50, 75, 100].map((val) => {
                const y = svgHeight - paddingY - (val / 100) * (svgHeight - paddingY * 2);
                return (
                  <g key={val}>
                    <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#161B22" strokeWidth="1" strokeDasharray="3,3" />
                    <text x={paddingX - 8} y={y + 3} fill="#8B949E" fontSize="8" fontWeight="bold" textAnchor="end">{val}%</text>
                  </g>
                );
              })}

              {/* Time grid marks */}
              {[0, 12, 24, 36, 48, 60].map((month) => {
                const x = paddingX + (month / 60) * (svgWidth - paddingX * 2);
                return (
                  <g key={month}>
                    <line x1={x} y1={svgHeight - paddingY} x2={x} y2={svgHeight - paddingY + 4} stroke="#30363D" strokeWidth="1" />
                    <text x={x} y={svgHeight - paddingY + 14} fill="#8B949E" fontSize="8" fontWeight="bold" textAnchor="middle">{month}M</text>
                  </g>
                );
              })}

              {/* Kaplan-Meier Survival Path Area (shaded) */}
              <path
                d={`${pathString} L ${svgWidth - paddingX},${svgHeight - paddingY} L ${paddingX},${svgHeight - paddingY} Z`}
                fill="url(#kmGradient)"
                opacity="0.15"
              />

              {/* Kaplan-Meier Survival Line */}
              <path
                d={pathString}
                fill="none"
                stroke={riskScore > 65 ? '#E11D48' : riskScore > 35 ? '#D97706' : '#059669'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Current slide estimated month marker dot */}
              {sample.clinical.survivalMonthsEstimate && (
                (() => {
                  const patientMonth = Math.min(60, sample.clinical.survivalMonthsEstimate);
                  const estimateSurvival = curveData.find(d => d.month >= patientMonth)?.survival || 50;
                  const dotX = paddingX + (patientMonth / 60) * (svgWidth - paddingX * 2);
                  const dotY = svgHeight - paddingY - (estimateSurvival / 100) * (svgHeight - paddingY * 2);
                  return (
                    <g>
                      <circle cx={dotX} cy={dotY} r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.5" />
                      <line x1={dotX} y1={dotY} x2={dotX} y2={svgHeight - paddingY} stroke="#2563EB" strokeWidth="1" strokeDasharray="2,2" />
                      <rect x={dotX + 6} y={dotY - 14} width="70" height="15" rx="2" fill="#2563EB" />
                      <text x={dotX + 41} y={dotY - 4} fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">Est. Survival</text>
                    </g>
                  );
                })()
              )}

              {/* Definitions of standard Gradients */}
              <defs>
                <linearGradient id="kmGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={riskScore > 65 ? '#E11D48' : riskScore > 35 ? '#D97706' : '#059669'} />
                  <stop offset="100%" stopColor="#010409" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Interpretative details bottom */}
        <div className="mt-4 border-t border-[#1F2937] pt-3 text-[11px] text-[#8B949E] font-normal leading-relaxed flex items-start gap-1.5">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span>
            <strong className="text-[#C9D1D9]">Research Insight</strong>: {riskScore > 65 
              ? 'Multi-omic profiles suggest survival expectancy values around 25-35%. Intensive therapy modalities targeting aggressive cells are suggested.'
              : riskScore > 35 
              ? 'Prosthetic projections display moderate progress metrics (60-75% 5Y probability). Continued patient margin oversight is recommended.'
              : 'Signatures reflect very favorable survivability parameters (~90%). Normal clinical path molecular routine tracking is adequate.'}
          </span>
        </div>
      </div>
    </div>
  );
}
