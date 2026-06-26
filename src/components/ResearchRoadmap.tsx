import React, { useState, useEffect } from 'react';
import { HistologySample } from '../types';
import { 
  Beaker, 
  Cpu, 
  Layers, 
  Activity, 
  Network, 
  Workflow, 
  Play, 
  ChevronRight, 
  Download, 
  Brain, 
  Database,
  Heart,
  TrendingUp,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
  Terminal,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface ResearchRoadmapProps {
  sample: HistologySample;
}

export default function ResearchRoadmap({ sample }: ResearchRoadmapProps) {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [isPlayingSimulation, setIsPlayingSimulation] = useState<boolean>(false);
  
  // Dynamic Simulation States
  // P1: Embeddings state
  const [projectionCount, setProjectionCount] = useState<number>(45);
  // P2: Federated Learning state
  const [flLoss, setFlLoss] = useState<number[]>([0.82, 0.74, 0.61, 0.52, 0.45]);
  const [activeHospitalNode, setActiveHospitalNode] = useState<string>('Hospital A');
  const [isSyncingGlobal, setIsSyncingGlobal] = useState<boolean>(false);
  // P3: Digital Twin state
  const [chemoDose, setChemoDose] = useState<number>(75);
  const [surgeryDelayWeeks, setSurgeryDelayWeeks] = useState<number>(2);
  const [immunoSelected, setImmunoSelected] = useState<boolean>(true);
  // P4: Prognosis Prediction
  const [localGradeMultiplier, setLocalGradeMultiplier] = useState<number>(1.0);
  // P6: Multimodal copilot query index
  const [copilotQueryIdx, setCopilotQueryIdx] = useState<number>(0);
  const [copilotAnswering, setCopilotAnswering] = useState<boolean>(false);
  // P7: Agentic streams console
  const [agentLogs, setAgentLogs] = useState<string[]>([
    "[SYSTEM] Multi-Agent Cascade Initialized.",
    "[Slide Agent] Segmenting specimen... 128 atypical nuclei coordinates isolated.",
  ]);
  const [activeAgentIndex, setActiveAgentIndex] = useState<number>(0);

  // Automatically cycle through agents if simulation runs
  useEffect(() => {
    let timer: any;
    if (isPlayingSimulation && activeTab === 7) {
      timer = setInterval(() => {
        const nextSteps = [
          "[Literature Agent] Searching PubMed & ClinicalTrials.gov for BRCA1 somatic methylated trials...",
          "[Literature Agent] Isolated 3 active registration studies matching genomic attributes.",
          "[Diagnosis Agent] Correlating grade Gleason 9 / Stage IV mitotic indicators with morphology...",
          "[Report Agent] Constructing path-grade diagnosis draft using active presets.",
          "[Validation Agent] Verification scan completed with 94.2% structural confidence range.",
          "[SYSTEM] Cascade completed. Diagnostic packet delivered to clinicians."
        ];
        setActiveAgentIndex(prev => {
          if (prev < nextSteps.length) {
            setAgentLogs(l => [...l, nextSteps[prev]]);
            return prev + 1;
          } else {
            setIsPlayingSimulation(false);
            return 0;
          }
        });
      }, 1800);
    }
    return () => clearInterval(timer);
  }, [isPlayingSimulation, activeTab]);

  // Clean log function
  const resetAgentLogs = () => {
    setAgentLogs([
      "[SYSTEM] Multi-Agent Cascade Initialized.",
      "[Slide Agent] Segmenting specimen... 128 atypical nuclei coordinates isolated."
    ]);
    setActiveAgentIndex(0);
    setIsPlayingSimulation(false);
  };

  // Safe formula to estimate dynamic survival curve based on Twin sliders and patient profile
  const getTwinSurvivalOdds = (months: number) => {
    const hasTP53 = sample.genomic.tp53 === 'Mutant';
    const hasEGFR = sample.genomic.egfr === 'Amplified';
    const isStageIV = sample.clinical.stage === 'Stage IV' || sample.clinical.stage === 'Stage III';

    // Base risk penalty
    let basePenalty = 1.0;
    if (hasTP53) basePenalty += 0.45;
    if (hasEGFR) basePenalty += 0.25;
    if (isStageIV) basePenalty += 0.6;

    // Twin therapeutic modulation formula
    const chemoBenefit = (chemoDose / 100) * 0.35;
    const surgeryPenalty = (surgeryDelayWeeks * 0.05);
    const immunoBenefit = immunoSelected ? 0.28 : 0;

    const netMitigation = chemoBenefit - surgeryPenalty + immunoBenefit;
    const effectiveDecayRate = Math.max(0.005, 0.035 * (basePenalty - netMitigation));

    return Math.max(8, Math.min(100, Math.round(100 * Math.exp(-effectiveDecayRate * months))));
  };

  // Helper values for patient context mapping
  const hasTP53 = sample.genomic.tp53 === 'Mutant';
  const hasEGFR = sample.genomic.egfr === 'Amplified';
  const hasBRCA1 = sample.genomic.brca1 === 'Mutant' || sample.genomic.brca1 === 'Methylated';

  const copilotPresets = [
    {
      q: "Explain how high mitotic indexes and BRCA1 deficiency affect this specific sample's pathway.",
      a: `For Specimen ${sample.id}, the ${sample.genomic.brca1 === 'Normal' ? 'wild-type BRCA1 status suggests intact homologous recombination repair' : 'BRCA1 deficiency triggers synthetic lethality vulnerability'}. High pleomorphic nuclear clusters lead to mitotic indexes that bypass standard G2/M cell cycle arrest.`
    },
    {
      q: "What treatment regimen would a foundation model recommend given this somatic profile?",
      a: "Given the mutation profile, standard adjuvant Platinum doublets can be supplemented with Olaparib maintenance if BRCA1 deficient, or WEE1 checkpoint inhibitors if TP53 mutation is confirmed."
    },
    {
      q: "How does the tumor's architectural distortion correlate with survival metrics?",
      a: `In ${sample.tissueType}, glandular disintegration indicates invasive progression. Our models trace an accelerated decline in cumulative survival months, justifying early transition to target companion therapy.`
    }
  ];

  // Prognosis calculation
  const getPrognosisRisk = () => {
    let basePrognosis = 30;
    if (hasTP53) basePrognosis += 25;
    if (hasEGFR) basePrognosis += 15;
    if (hasBRCA1) basePrognosis += 10;
    if (sample.clinical.stage === 'Stage III' || sample.clinical.stage === 'Stage IV') {
      basePrognosis += 20;
    }
    return Math.max(10, Math.min(98, Math.round(basePrognosis * localGradeMultiplier)));
  };

  // Download Research Proposal simulation
  const downloadProposal = () => {
    const text = `========================================================
PATHOLOGY AI RESEARCH INITIATIVE: INTEGRATED ROADMAP
========================================================
Case Context Integration: ${sample.id} (${sample.tissueType})
Diagnostic Profile: ${sample.defaultGrade} • ${sample.clinical.stage}
Genomics: TP53:${sample.genomic.tp53} | BRCA1:${sample.genomic.brca1}

PHASE 1: Histopathology Foundation Models (embedding, ssl)
PHASE 2: Collaborative Multi-Hospital Federated Learning 
PHASE 3: Digital Twin Oncological Treatment Simulation
PHASE 4: ConvNet/Transformer Tumor Prognosis Prediction
PHASE 5: DeepSurv Multimodal Survival Analysis
PHASE 6: Multimodal Pathology LLM Copilot Core
PHASE 7: Agentic Pathology Orchestrations (MONAI/LangGraph)
PHASE 8: Real-Time Clinical Decision Support Infrastructure

Recommended Strategy: B.Tech Core Publication Plan (Phases 1-4 completed)
========================================================`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PathGPTPilot-Research-Roadmap-${sample.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Roadmap Path Layout Header */}
      <div className="bg-[#0D1117] border border-[#1F2937] p-5 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest font-mono flex items-center gap-1.5">
              <Beaker className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              PathGPTPilot Integrated Research Roadmap
            </span>
            <h2 className="text-lg font-bold text-white mt-1">Multi-Phase Oncology Platform Evolution</h2>
            <p className="text-xs text-[#8B949E] mt-0.5 leading-relaxed">
              Consolidating 8 high-impact long-term research extensions into a unified, publishable academic syllabus.
            </p>
          </div>
          <button
            onClick={downloadProposal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] text-[11px] font-bold uppercase rounded text-white transition active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Export Research Proposal (TXT)
          </button>
        </div>

        {/* 8-Phase Network Connective Progress Map */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 pb-1 pt-3 border-t border-[#1F2937]/50">
          {[
            { id: 1, label: "Phase 1", name: "Foundation Models", tier: "B.Tech Core" },
            { id: 2, label: "Phase 2", name: "Federated Learning", tier: "B.Tech Core" },
            { id: 3, label: "Phase 3", name: "Digital Twin", tier: "B.Tech Core" },
            { id: 4, label: "Phase 4", name: "Cancer Prognosis", tier: "B.Tech Core" },
            { id: 5, label: "Phase 5", name: "Survival Analysis", tier: "B.Tech Core" },
            { id: 6, label: "Phase 6", name: "Medical Copilot", tier: "M.Tech" },
            { id: 7, label: "Phase 7", name: "Agentic Workflows", tier: "PhD Level" },
            { id: 8, label: "Phase 8", name: "Real-Time CDS", tier: "PhD Level" },
          ].map((ph) => {
            const isActive = activeTab === ph.id;
            const isPh1_4 = ph.id <= 4;
            const isPh5_6 = ph.id === 5 || ph.id === 6;
            
            const badgeColor = isPh1_4 
              ? 'bg-blue-950/40 text-blue-400 border-blue-900/40' 
              : isPh5_6 
              ? 'bg-purple-950/40 text-purple-400 border-purple-900/40' 
              : 'bg-amber-950/40 text-amber-400 border-amber-900/40';

            return (
              <button
                key={ph.id}
                onClick={() => {
                  setActiveTab(ph.id);
                  setIsPlayingSimulation(false);
                }}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition relative overflow-hidden group cursor-pointer ${
                  isActive 
                    ? 'bg-[#1F2937]/45 border-blue-500 shadow-md shadow-blue-500/10' 
                    : 'bg-[#111419]/70 border-[#1F2937]/80 hover:bg-[#161B22]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[9px] font-bold uppercase font-mono text-[#8B949E]">{ph.label}</span>
                  <span className={`text-[7px] font-bold px-1 rounded font-mono ${badgeColor}`}>
                    {ph.id <= 4 ? "Core" : ph.id <= 5 ? "M.Tech" : "PhD"}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-white group-hover:text-blue-400 transition truncate w-full">
                  {ph.name}
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                )}
              </button>
            );
          })}
          
          {/* Custom Roadmap Strategy summary switch */}
          <button
            onClick={() => {
              setActiveTab(9);
              setIsPlayingSimulation(false);
            }}
            className={`flex flex-col items-start p-3 rounded-lg border text-left transition relative overflow-hidden group col-span-2 sm:col-span-4 lg:col-span-1 cursor-pointer ${
              activeTab === 9 
                ? 'bg-[#1F2937]/45 border-emerald-500 shadow-md shadow-emerald-500/10' 
                : 'bg-[#111419]/70 border-[#1F2937]/80 hover:bg-[#161B22]'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[9px] font-bold uppercase font-mono text-emerald-400">PLAN MATRIX</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition truncate w-full">
              Research Strategy
            </div>
            {activeTab === 9 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            )}
          </button>
        </div>
      </div>

      {/* Main Dual-Column Content Division */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Academic Goals & Architecture (2 columns wide) */}
        <div className="lg:col-span-2 space-y-6">
          {(() => {
            // Render specific Research Roadmap Page depending on activeTab
            switch(activeTab) {
              case 1:
                return (
                  <div className="bg-[#0D1117] border border-[#1F2937] rounded-xl p-6 space-y-5">
                    <div className="flex items-start justify-between border-b border-[#1F2937] pb-3.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase bg-blue-950/40 text-blue-400 px-2 py-0.5 rounded border border-blue-900/30">Phase 1: Foundation Models</span>
                        <h3 className="text-base font-bold text-white mt-1.5">Universal Histopathology Representational Core</h3>
                        <p className="text-xs text-[#8B949E] mt-0.5">Pretrain a Vision Foundation Model on millions of clinical histopathology patches.</p>
                      </div>
                      <Layers className="w-6 h-6 text-blue-400 shrink-0" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">The Problem</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          Most pathology models are trained strictly for narrow isolated tasks (e.g., detecting standard boundaries). They completely fail to generalize to novel stains, scanner variables, or uncommon somatic tumor grades.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">Proposed Solution</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          Pretrain a giant vision foundation ViT transformer backbone using self-supervised learning (SSL) directly across global repositories including <span className="font-semibold text-white">TCGA</span>, <span className="font-semibold text-white">CAMELYON16</span>, and <span className="font-semibold text-white">PANDA</span> datasets.
                        </p>
                      </div>
                    </div>

                    {/* Architecture Node Visualizer */}
                    <div className="p-4 bg-[#090C10] border border-[#21262d] rounded-lg">
                      <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider block mb-3 font-mono">Platform Architecture Workflow</span>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
                        <div className="p-2.5 bg-[#161B22] rounded border border-[#30363D] w-full max-w-[140px]">
                          <span className="block text-[10px] font-bold text-white">Slide Patches</span>
                          <span className="text-[8px] text-[#8B949E] font-mono">TCGA / CAMELYON</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500 rotate-90 sm:rotate-0" />
                        <div className="p-2.5 bg-[#161B22] rounded border border-blue-900/40 w-full max-w-[140px] relative">
                          <div className="absolute -top-1.5 -right-1 bg-blue-600 text-[6px] text-white px-1.5 py-0.5 rounded font-black font-mono">SSL</div>
                          <span className="block text-[10px] font-bold text-white">Self-Supervised</span>
                          <span className="text-[8px] text-[#8B949E] font-mono">DINOv2 / MAE</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500 rotate-90 sm:rotate-0" />
                        <div className="p-2.5 bg-[#161B22] rounded border border-blue-900/40 w-full max-w-[140px]">
                          <span className="block text-[10px] font-bold text-white">Vision Transformer</span>
                          <span className="text-[8px] text-[#8B949E] font-mono">ViT-Gigapixel</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500 rotate-90 sm:rotate-0" />
                        <div className="p-2.5 bg-blue-950/30 rounded border border-blue-500/50 w-full max-w-[140px]">
                          <span className="block text-[10px] font-bold text-blue-400">Pathology Embeddings</span>
                          <span className="text-[8px] text-blue-500 font-mono">Universal Vector API</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Mathematical Methods</span>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {["DINOv2", "MAE", "SimCLR", "Contrastive Learning"].map((m, i) => (
                            <span key={i} className="text-[10px] font-bold font-mono text-blue-400 bg-blue-950/20 px-1.5 py-0.5 rounded">{m}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Downstream Outputs</span>
                        <p className="text-[10.5px] text-[#8B949E] mt-1 lead-snug">
                          High dimensionality vector feature representations enabling immediate adaptation to tumor classification.
                        </p>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Research Novelty</span>
                        <div className="text-[10.5px] text-amber-400 font-bold mt-1">
                          Universal foundational encoder behaving as the exact biological equivalent of GPT models for imaging datasets.
                        </div>
                      </div>
                    </div>
                  </div>
                );
              case 2:
                return (
                  <div className="bg-[#0D1117] border border-[#1F2937] rounded-xl p-6 space-y-5">
                    <div className="flex items-start justify-between border-b border-[#1F2937] pb-3.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase bg-blue-950/40 text-blue-400 px-2 py-0.5 rounded border border-blue-900/30">Phase 2: Federated Learning</span>
                        <h3 className="text-base font-bold text-white mt-1.5">Privacy-Preserving Multi-Hospital Synchronization</h3>
                        <p className="text-xs text-[#8B949E] mt-0.5">Train collaborative pathology models without transferring patient records.</p>
                      </div>
                      <Network className="w-6 h-6 text-blue-400 shrink-0" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">The Problem</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          Hospitals cannot share histopathology slides containing raw patient diagnostic contexts due to extremely stringent GDPR and HIPAA data protection laws. Consequently, central databases remain fragmented.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">Proposed Solution</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          Train clinical deep learning weights locally at multiple isolated nodes. Periodically transmit encrypted gradients to a secure central scheduler that performs Federated Averaging computation.
                        </p>
                      </div>
                    </div>

                    {/* Architecture Node Visualizer */}
                    <div className="p-4 bg-[#090C10] border border-[#21262d] rounded-lg">
                      <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider block mb-3 font-mono">Federated Framework Diagram</span>
                      <div className="flex flex-col sm:flex-row items-center justify-around gap-2 text-center">
                        <div className="flex flex-col gap-2">
                          <div className="p-2 bg-[#161B22] rounded border border-[#30363D] text-[10px]">
                            <span className="block font-bold">Hospital A Node</span>
                            <span className="text-[8px] text-[#8B949E] font-mono">Train Weights</span>
                          </div>
                          <div className="p-2 bg-[#161B22] rounded border border-[#30363D] text-[10px]">
                            <span className="block font-bold">Hospital B Node</span>
                            <span className="text-[8px] text-[#8B949E] font-mono">Train Weights</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center p-3 text-gray-500 font-bold font-mono">
                          ⇄ Transmit Gradients ⇄
                        </div>
                        <div className="p-3 bg-blue-950/20 rounded border border-blue-500/40 text-[10px] flex flex-col justify-center max-w-[160px]">
                          <span className="font-bold text-blue-400">Federated Aggregator</span>
                          <span className="text-[8px] text-[#8B949E] font-mono mt-1 mt-0.5">Secure Global Weights Compilation</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Core Technologies</span>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {["Flower", "NVIDIA FLARE", "MONAI FL", "FedAvg"].map((m, i) => (
                            <span key={i} className="text-[10px] font-bold font-mono text-blue-400 bg-blue-950/20 px-1.5 py-0.5 rounded">{m}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Research Core Components</span>
                        <p className="text-[10px] text-[#8B949E] mt-1 line-clamp-3">
                          1. Differential Privacy injections<br />
                          2. Secure Cryptographic Aggregations<br />
                          3. Stains variation domain adaptation
                        </p>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Platforms Outcome</span>
                        <div className="text-[10.5px] text-emerald-400 font-bold mt-1">
                          Enables direct training from multi-hospital databases without risking leakage.
                        </div>
                      </div>
                    </div>
                  </div>
                );
              case 3:
                return (
                  <div className="bg-[#0D1117] border border-[#1F2937] rounded-xl p-6 space-y-5">
                    <div className="flex items-start justify-between border-b border-[#1F2937] pb-3.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase bg-blue-950/40 text-blue-400 px-2 py-0.5 rounded border border-blue-900/30">Phase 3: Digital Twin Oncology</span>
                        <h3 className="text-base font-bold text-white mt-1.5">In-Silico Patient Replica Simulation</h3>
                        <p className="text-xs text-[#8B949E] mt-0.5">Create virtual AI replicas of individual cancer patients to evaluate treatment paths.</p>
                      </div>
                      <Workflow className="w-6 h-6 text-blue-400 shrink-0" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">The Problem</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          Empirical therapeutic prescriptions represent a trial-and-error paradigm that often leads to severe unnecessary toxicity, surgical delays, and missed therapeutic execution windows for high-risk cohorts.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">Proposed Solution</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          Integrate histopathology morphology, diagnostic MRI scans, somatic genomic marker maps, and clinical EMR metrics to model cellular proliferation pathways in a computational "Digital Twin" simulator.
                        </p>
                      </div>
                    </div>

                    {/* Simulation flowchart */}
                    <div className="p-4 bg-[#090C10] border border-[#21262d] rounded-lg">
                      <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider block mb-3 font-mono">Digital Twin Replication Pipeline</span>
                      <div className="flex flex-col sm:flex-row items-center justify-around gap-2 text-center text-[10px]">
                        <div className="p-2.5 bg-[#161B22] rounded border border-[#30363D] max-w-[120px]">
                          <span className="font-bold block">Patient Context</span>
                          <p className="text-[8.5px] text-[#8B949E] mt-0.5">Genetics, Histology</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                        <div className="p-2.5 bg-[#161B22] rounded border border-[#30363D] relative max-w-[140px]">
                          <span className="font-bold block text-blue-400">Digital Twin VM</span>
                          <p className="text-[8.5px] text-[#8B949E] mt-0.5">Graph Neural Network</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                        <div className="p-2.5 bg-emerald-950/20 rounded border border-emerald-500/40 max-w-[150px]">
                          <span className="font-bold text-emerald-400 block">Scenario Testing</span>
                          <p className="text-[8.5px] text-[#8B949E] mt-0.5">Chemo vs. Immuno options</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px]">
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Research Questions</span>
                        <p className="text-[#8B949E] mt-1 leading-normal">
                          - What if surgery is delayed by 4 weeks?<br />
                          - How does TP53 mut burden react to adjuvant therapies?
                        </p>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Enabling AI Models</span>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {["GNNs", "Multi-Agent RL", "Transformers"].map((t, idx) => (
                            <span key={idx} className="text-[9px] bg-blue-950/20 border border-blue-900/30 text-blue-400 px-1 py-0.5 rounded font-mono font-bold">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">In-silico Output</span>
                        <span className="text-[#C9D1D9] block mt-1">
                          Calculates highly personalized therapeutic scenario graphs to predict patient survivability.
                        </span>
                      </div>
                    </div>
                  </div>
                );
              case 4:
                return (
                  <div className="bg-[#0D1117] border border-[#1F2937] rounded-xl p-6 space-y-5">
                    <div className="flex items-start justify-between border-b border-[#1F2937] pb-3.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase bg-blue-950/40 text-blue-400 px-2 py-0.5 rounded border border-blue-900/30">Phase 4: Cancer Prognosis Prediction</span>
                        <h3 className="text-base font-bold text-white mt-1.5">Deep Recurrence & Metastatic Index Projections</h3>
                        <p className="text-xs text-[#8B949E] mt-0.5">Synthesize multimodality signals to predict downstream neoplasm aggression rates.</p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-blue-400 shrink-0" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">The Objective</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          Rather than simply classifying tissue (benign vs malignant), the core objective is forecasting temporal regression probability, localized recurrence, and distal metastasis likelihood indices over multiple years.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">The Methodology</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          Combine ViT features with clinical descriptors in a fusion transformer structure, supervised against longitudinal follow-up records that record real patient outcome data.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-[#090C10] border border-[#21262d] rounded-lg text-[11px] space-y-2">
                      <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider block font-mono">Prediction Matrix Pipeline</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-2.5 bg-[#161B22] rounded border border-[#30363D]">
                          <span className="block font-bold text-[10px] text-white">Clinical Metadata</span>
                          <span className="text-[8px] text-[#8B949E] font-mono block mt-0.5">Core Age, Gender, Staging</span>
                        </div>
                        <div className="p-2.5 bg-[#161B22] rounded border border-[#30363D]">
                          <span className="block font-bold text-[10px] text-white">Histopathology Vision</span>
                          <span className="text-[8px] text-[#8B949E] font-mono block mt-0.5">Cellular pleomorphism, glandular distortion</span>
                        </div>
                        <div className="p-2.5 bg-blue-950/20 rounded border border-blue-500/40">
                          <span className="block font-bold text-[10px] text-blue-400">Integrated Score</span>
                          <span className="text-[8px] text-[#8B949E] font-mono block mt-0.5">Recurrence Risk Thresholds</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Inputs Utilized</span>
                        <p className="text-[#8B949E] mt-1">
                          - Mitotic densities<br />
                          - Tumor necrosis profiles<br />
                          - Somatic mutation burden
                        </p>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Algorithms Used</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {["Vision Transformers", "XGBoost", "Deep Forest", "Multimodal Fusion"].map((a, i) => (
                            <span key={i} className="text-[9px] bg-blue-950/20 border border-blue-900/30 text-blue-400 px-1 hover:border-blue-500/40 rounded font-mono font-bold mt-1 inline-block">{a}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Clinical Benefit</span>
                        <p className="text-amber-400 font-bold mt-1 leading-normal">
                          Drives aggressive systemic intervention planning before macroscopic metastases are detected in radiology scans.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              case 5:
                return (
                  <div className="bg-[#0D1117] border border-[#1F2937] rounded-xl p-6 space-y-5">
                    <div className="flex items-start justify-between border-b border-[#1F2937] pb-3.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase bg-blue-950/40 text-blue-400 px-2 py-0.5 rounded border border-blue-900/30">Phase 5: Survival Analysis</span>
                        <h3 className="text-base font-bold text-white mt-1.5 font-sans">Dynamic Kaplan-Meier Probability Estimators</h3>
                        <p className="text-xs text-[#8B949E] mt-0.5 font-normal">Train deep neural network engines to plot time-to-event curves from molecular attributes.</p>
                      </div>
                      <Clock className="w-6 h-6 text-blue-400 shrink-0" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">The Research Objective</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          Rather than predicting flat scores, survival modeling aims to estimate true probability trajectories over continuous multi-year spectra (12 to 60 months), taking censored clinical logs into active mathematical account.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">Statistical Architecture</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          Upgrade from classical Cox Proportional Hazards towards DeepSurv architectures or Transformer Survival pipelines that accept high-dimensionality foundational slide features and clinical genotypes.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-[#090C10] border border-[#21262d] rounded-lg text-[11px] space-y-3">
                      <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider block font-mono">Statistical Analysis Workflow</span>
                      <div className="flex flex-col sm:flex-row gap-3 items-center text-center">
                        <div className="p-2.5 bg-[#161B22] rounded border border-[#30363D] w-full">
                          <span className="font-bold">Cox Hazard Models</span>
                          <span className="text-[8.5px] text-[#8B949E] block">Baseline Covariates</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                        <div className="p-2.5 bg-blue-950/20 rounded border border-blue-500/40 w-full">
                          <span className="font-bold text-blue-400">DeepSurv (Neural Survival)</span>
                          <span className="text-[8.5px] text-blue-400 block">Non-linear interactions</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                        <div className="p-2.5 bg-emerald-950/20 rounded border border-emerald-500/40 w-full">
                          <span className="font-bold text-emerald-400">Transformer Survival</span>
                          <span className="text-[8.5px] text-[#8B949E] block font-mono">Time-to-Event plotting</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Analysis Indicators</span>
                        <p className="text-[#8B949E] mt-1 leading-normal">
                          - Distal progression timeline<br />
                          - Multi-year mortality curves<br />
                          - Stage-graded censoring values
                        </p>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Algorithms Implemented</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {["Cox Proportional", "DeepSurv", "PyCox", "TransformerSurvival"].map((al, idx) => (
                            <span key={idx} className="text-[9px] font-bold bg-blue-950/20 border border-blue-900/30 text-blue-400 px-1 py-0.5 rounded font-mono inline-block mt-0.5">{al}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Impact Assessment</span>
                        <p className="text-amber-400 font-bold mt-1 font-sans leading-normal">
                          Establishes structural bases for personalized clinical studies and precision medicine program alignment.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              case 6:
                return (
                  <div className="bg-[#0D1117] border border-[#1F2937] rounded-xl p-6 space-y-5">
                    <div className="flex items-start justify-between border-b border-[#1F2937] pb-3.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase bg-purple-950/40 text-purple-400 px-2 py-0.5 rounded border border-purple-900/30">Phase 6: Multimodal Cancer Copilot</span>
                        <h3 className="text-base font-bold text-white mt-1.5 font-sans">Gemini-Powered Intelligent Clinical Query Core</h3>
                        <p className="text-xs text-[#8B949E] mt-0.5">Integrate pathology visual cues with patient records in a multimodal conversational agent.</p>
                      </div>
                      <Sparkles className="w-6 h-6 text-purple-400 shrink-0" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">The Concept</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          A unified conversational intelligence core for pathologists. Conversational inquiries seamlessly query visual boundaries on gigapixel slides, retrieve mutation data, and consult diagnostic literature.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">Unified Multi-modal Architecture</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          Image encoders (slide visual features) and mutation sequence transformers map directly into a Shared Fusion Space, projecting tokenized pathology states into a LLM (e.g. Gemini Pro).
                        </p>
                      </div>
                    </div>

                    {/* Copilot workflow block */}
                    <div className="p-4 bg-[#090C10] border border-[#21262d] rounded-lg text-[11px] space-y-3">
                      <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider block font-mono">Shared Fusion Space Pipeline</span>
                      <div className="flex flex-col sm:flex-row gap-3 items-center text-center">
                        <div className="p-2 bg-[#161B22] border border-[#30363D] rounded w-full">
                          <span className="font-bold">Image ResNet/ViT Encoder</span>
                        </div>
                        <div className="text-purple-400 text-xs font-bold">+</div>
                        <div className="p-2 bg-[#161B22] border border-[#30363D] rounded w-full">
                          <span className="font-bold">Somatic Mutational Tokens</span>
                        </div>
                        <div className="text-purple-400 text-xs font-bold">→</div>
                        <div className="p-2 bg-purple-950/20 border border-purple-500/40 rounded w-full">
                          <span className="font-bold text-purple-400">Gemini Reasoning LLM</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Dynamic Prompting</span>
                        <p className="text-[#8B949E] mt-1 leading-normal">
                          - "Why is this segment flagged atypical?"<br />
                          - "Compare slide features with standard TCGA cohorts"
                        </p>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Technical Core</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {["Multimodal Fusion", "Cross-Attention", "Linear Projection", "LoRA tuning"].map((t, idx) => (
                            <span key={idx} className="text-[9px] font-bold bg-purple-950/20 border border-purple-900/30 text-purple-400 px-1 py-0.5 rounded font-mono inline-block mt-0.5">{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Surgical Application</span>
                        <p className="text-amber-400 font-bold mt-1 leading-snug">
                          Provides instant reference summaries, and explanations during multidisciplinary oncology tumor board meetings.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              case 7:
                return (
                  <div className="bg-[#0D1117] border border-[#1F2937] rounded-xl p-6 space-y-5">
                    <div className="flex items-start justify-between border-b border-[#1F2937] pb-3.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase bg-amber-950/40 text-amber-400 px-2 py-0.5 rounded border border-amber-900/30">Phase 7: Agentic AI for Pathology Workflows</span>
                        <h3 className="text-base font-bold text-white mt-1.5 font-sans">Autonomous Cooperating Multi-Agent Swarms</h3>
                        <p className="text-xs text-[#8B949E] mt-0.5">Move past conversational chatbots toward goal-driven autonomous clinical agents.</p>
                      </div>
                      <Cpu className="w-6 h-6 text-amber-500 shrink-0 animate-spin-slow" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">The Goal</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          Build specialized clinical agents that autonomously collaborate to process whole slide uploads, perform secondary validation checks, and query medical guidelines to yield robust, complete diagnostic dossiers.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">Workflow Architecture</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          A sequential LangGraph framework: Slide Agent executes micro-segmentations; Literature Agent checks PubMed; Diagnosis Agent maps somatic profiles; and Validation Agent audits statistical anomalies.
                        </p>
                      </div>
                    </div>

                    {/* Sequential Agent Flow representation */}
                    <div className="p-4 bg-[#090C10] border border-[#21262d] rounded-lg text-[11px] space-y-2">
                      <span className="text-[9px] uppercase font-bold text-amber-400 tracking-wider block font-mono">LangGraph Agent Pipeline</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2.5 bg-[#161B22] rounded border border-amber-900/30 text-amber-400">
                          <span className="font-bold font-mono">1. Slide Agent</span>
                          <span className="text-[8px] text-[#8B949E] block mt-0.5">Cellular segmenter</span>
                        </div>
                        <div className="p-2.5 bg-[#161B22] rounded border border-[#30363D]">
                          <span className="font-bold font-mono">2. Lit Agent</span>
                          <span className="text-[8px] text-[#8B949E] block mt-0.5">PubMed/MedLine query</span>
                        </div>
                        <div className="p-2.5 bg-[#161B22] rounded border border-[#30363D]">
                          <span className="font-bold font-mono">3. Report Agent</span>
                          <span className="text-[8px] text-[#8B949E] block mt-0.5">PathGPTPilot draft writer</span>
                        </div>
                        <div className="p-2.5 bg-emerald-950/20 rounded border border-emerald-500/40 text-emerald-400">
                          <span className="font-bold font-mono">4. Validation Agent</span>
                          <span className="text-[8px] text-emerald-500 block mt-0.5">Final human-in-the-loop audit</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Specialized Agents</span>
                        <p className="text-[#8B949E] mt-1 leading-normal">
                          - Slide Segmentation Core<br />
                          - Multi-study literature synthesis<br />
                          - Clinical validation guardrails
                        </p>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Technologies Used</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {["Gemini", "LangGraph", "LangChain", "MCP Standards"].map((tech, i) => (
                            <span key={i} className="text-[9px] bg-blue-950/20 border border-blue-900/30 text-blue-400 px-1 py-0.5 rounded font-mono inline-block font-bold mt-0.5">{tech}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Research Value</span>
                        <p className="text-amber-400 font-bold mt-1 leading-relaxed">
                          Demonstrates true automation limits of generative AI in high-reliability clinical documentation tasks.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              case 8:
                return (
                  <div className="bg-[#0D1117] border border-[#1F2937] rounded-xl p-6 space-y-5">
                    <div className="flex items-start justify-between border-b border-[#1F2937] pb-3.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase bg-amber-950/40 text-amber-400 px-2 py-0.5 rounded border border-amber-900/30">Phase 8: Real-Time Clinical Decision Support</span>
                        <h3 className="text-base font-bold text-white mt-1.5 font-sans">Integrated Real-Time Hospital Alert Systems</h3>
                        <p className="text-xs text-[#8B949E] mt-0.5 font-normal">Deploy PathGPTPilot directly into intensive care environments to output proactive diagnostic alerts.</p>
                      </div>
                      <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">The Vision</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          The final evolution moves pathic analysis into active systemic medical dashboards. Live-stream lab data, incoming pathology slides, and EMR records are evaluated against patient survivability metrics in real-time.
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block">Preventive Alarm Systems</span>
                        <p className="text-[11.5px] text-[#C9D1D9] leading-relaxed">
                          When mutations or morphological anomalies indicate critical hazard levels (e.g., predicted recurrence &gt; 80%), the system raises multidisciplinary warning alerts inside the hospital's central clinical directory.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-[#090C10] border border-[#21262d] rounded-lg text-[11px] space-y-3">
                      <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider block font-mono">EHR/LIMS Live Feed Pipeline</span>
                      <div className="flex flex-col sm:flex-row gap-3 items-center text-center">
                        <div className="p-2.5 bg-[#161B22] border border-[#30363D] rounded w-full">
                          <span className="font-bold">EHR & Lab Feeds</span>
                        </div>
                        <div className="text-rose-400 text-xs font-bold font-mono">→ Stream →</div>
                        <div className="p-2.5 bg-rose-950/30 border border-rose-500/40 rounded w-full">
                          <span className="font-bold text-rose-400">Real-Time CDS Parser</span>
                        </div>
                        <div className="text-rose-400 text-xs font-bold font-mono">→ Alert →</div>
                        <div className="p-2.5 bg-[#161B22] border border-emerald-900/40 text-emerald-400 rounded w-full">
                          <span className="font-bold">Oncologist Dashboard</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Alert Trigger Parameters</span>
                        <p className="text-[#8B949E] mt-1 leading-normal">
                          - Microscopic margin breaches<br />
                          - Advanced mitotic metrics<br />
                          - High metastatic index profiles
                        </p>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">End-User Cohorts</span>
                        <p className="text-[#C9D1D9] mt-1">
                          - Lead Pathologists<br />
                          - Clinical Oncologists<br />
                          - Surgical Internists
                        </p>
                      </div>
                      <div className="p-3 bg-[#111419] rounded-lg border border-[#1F2937]">
                        <span className="text-[9px] font-mono uppercase text-[#8B949E] font-bold">Academic Novelty</span>
                        <p className="text-emerald-400 font-bold mt-1 leading-normal">
                          The absolute pinnacle of translational medicine—intertwining AI models into live human clinical decision pathways.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              default:
                return (
                  <div className="bg-[#0D1117] border border-[#1F2937] rounded-xl p-6 space-y-5">
                    <div className="flex items-start justify-between border-b border-[#1F2937] pb-3.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/30">Academic Framework Plan</span>
                        <h3 className="text-base font-bold text-white mt-1.5">B.Tech IEEE Conference to Ph.D. Multi-Year Platform Strategy</h3>
                        <p className="text-xs text-[#8B949E] mt-0.5">Structure roadmap items into concrete academic papers, dissertations, and research proposals.</p>
                      </div>
                      <Beaker className="w-6 h-6 text-emerald-400 shrink-0" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-[#111419] rounded-xl border border-blue-900/30 relative">
                        <div className="absolute top-2 right-2 bg-blue-900/20 text-blue-400 text-[8px] font-bold uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border border-blue-800/30">Phase A</div>
                        <span className="block text-[10px] uppercase font-bold text-blue-400 font-mono tracking-widest mb-1.5">1. Core B.Tech Project</span>
                        <h4 className="text-xs font-bold text-white mb-2">Tumor Segmentation & Graded Explanations (Current Level)</h4>
                        <p className="text-[11px] text-[#8B949E] leading-relaxed">
                          Concentrate heavily on establishing immediate visual algorithms: Tumor Segmentation, Cancer Grading, Explainable Grad-CAM/Integrated attribution boundaries, and Gemini Report writeups with clinical trial matches.
                        </p>
                        <div className="text-[10px] text-[#C9D1D9] font-semibold mt-3 font-mono bg-blue-950/20 px-1.5 py-1 rounded inline-block">🎯 IEEE Conference Paper Target</div>
                      </div>

                      <div className="p-4 bg-[#111419] rounded-xl border border-purple-900/30 relative">
                        <div className="absolute top-2 right-2 bg-purple-900/20 text-purple-400 text-[8px] font-bold uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border border-purple-800/30">Phase B</div>
                        <span className="block text-[10px] uppercase font-bold text-purple-400 font-mono tracking-widest mb-1.5">2. M.Tech / Journal Expansion</span>
                        <h4 className="text-xs font-bold text-white mb-2">Federated Privacy & Temporal Prognosis Models</h4>
                        <p className="text-[11px] text-[#8B949E] leading-relaxed">
                          Incorporate Collaborative Multi-Hospital Federated Learning algorithms using privacy aggregates. Program Survival curves like DeepSurv and Kaplan-Meier time projections into the core classification library.
                        </p>
                        <div className="text-[10px] text-[#C9D1D9] font-semibold mt-3 font-mono bg-purple-950/20 px-1.5 py-1 rounded inline-block">🎯 Q1/Q2 Medical Journal Submission</div>
                      </div>

                      <div className="p-4 bg-[#111419] rounded-xl border border-amber-900/30 relative">
                        <div className="absolute top-2 right-2 bg-amber-900/20 text-amber-400 text-[8px] font-bold uppercase tracking-wider font-mono px-1.5 py-0.5 rounded border border-amber-800/30">Phase C</div>
                        <span className="block text-[10px] uppercase font-bold text-amber-400 font-mono tracking-widest mb-1.5">3. Ph.D. Level Vision</span>
                        <h4 className="text-xs font-bold text-white mb-2">Digital Twin Sims, Multi-Agent Swarms & Live CDS Panels</h4>
                        <p className="text-[11px] text-[#8B949E] leading-relaxed">
                          Create full in-silico Patient Digital Twins using advanced Reinforcement Learning scenario modules. Expand PathGPTPilot toward LangGraph-driven multi-agent swarms behaving as fully autonomous cancer copilots in hospitals.
                        </p>
                        <div className="text-[10px] text-[#C9D1D9] font-semibold mt-3 font-mono bg-amber-950/20 px-1.5 py-1 rounded inline-block">🎯 Ph.D. Thesis / Hospital Clinical Trials</div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#161B22]/60 border border-[#30363D] rounded-xl space-y-2">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider font-mono block">Recommended Academic Roadmap Strategy Execution:</span>
                      <p className="text-[11.5px] text-[#8B949E] leading-relaxed">
                        By designing <span className="font-semibold text-white">PathGPTPilot</span> as a phased multi-tier evolution, researchers avoid isolated "disconnected" software experiments. Instead, your thesis scales perfectly from a strong initial IEEE conference paper on explainable segmentation today, up to a massive collaborative clinical support environment tomorrow.
                      </p>
                    </div>
                  </div>
                );
            }
          })()}
        </div>

        {/* Right Column: Dynamic Interactive Research Simulation Panel */}
        <div className="space-y-6">
          <div className="bg-[#0D1117] border border-[#1F2937] rounded-xl p-5 space-y-4">
            
            <div className="border-b border-[#1F2937] pb-3">
              <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider font-mono block">Interactive Lab Sandbox</span>
              <h3 className="text-sm font-bold text-white mt-0.5">Live Research Simulation Sandbox</h3>
              <p className="text-[11px] text-[#8B949E] mt-0.5">Dynamic playground module reacting directly to active patient <span className="font-semibold text-white">{sample.id}</span> genomics and stage variables.</p>
            </div>

            {/* Simulated Interactive Widgets by Tab */}
            {activeTab === 1 && (
              <div className="space-y-4">
                <div className="space-y-1 bg-[#111419]/90 border border-[#1F2937] p-3 rounded-lg text-[11px]">
                  <span className="font-bold text-white block">P1 Simulator: Foundational Vector Search Space</span>
                  <p className="text-[#8B949E] text-[10.5px]">Plot patient slide embeddings against population clusters.</p>
                  
                  {/* Dynamic cluster representation */}
                  <div className="w-full h-36 bg-[#090C10] border border-[#21262d] rounded relative flex items-center justify-center overflow-hidden mt-2.5">
                    {/* Background clusters */}
                    {[...Array(projectionCount)].map((_, i) => {
                      const sx = (Math.sin(i * 123) * 0.45 + 0.5) * 100;
                      const sy = (Math.cos(i * 342) * 0.45 + 0.5) * 100;
                      return (
                        <div 
                          key={i} 
                          className="w-1.5 h-1.5 rounded-full absolute bg-gray-600/35 transition"
                          style={{ left: `${sx}%`, top: `${sy}%` }}
                        />
                      );
                    })}
                    
                    {/* Tissue Specific Clusters (e.g. TCGA / Breast) */}
                    {[...Array(12)].map((_, i) => {
                      const baseColor = sample.tissueType.includes('Breast') ? 'bg-rose-500/30' : 'bg-blue-500/30';
                      const sx = (Math.sin(i * 35) * 0.2 + 0.6) * 100;
                      const sy = (Math.cos(i * 18) * 0.2 + 0.45) * 100;
                      return (
                        <div 
                          key={i} 
                          className={`w-2.5 h-2.5 rounded-full absolute ${baseColor} border border-white/10 animate-pulse`}
                          style={{ left: `${sx}%`, top: `${sy}%` }}
                        />
                      );
                    })}

                    {/* Patient Position Node */}
                    <div 
                      className="absolute w-4 h-4 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg shadow-blue-500/50"
                      style={{ left: '60%', top: '48%' }}
                    >
                      <span className="text-[7px] font-mono text-white select-none font-bold">P</span>
                    </div>

                    <div className="absolute bottom-1 right-2 text-[8px] font-mono text-[#8B949E]">
                      TSNE Integration Map
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 flex-wrap">
                    <button
                      onClick={() => setProjectionCount(prev => prev + 15 > 90 ? 30 : prev + 15)}
                      className="text-[10px] bg-[#161B22] hover:bg-[#21262D] border border-[#30363D] px-2.5 py-1 text-white rounded cursor-pointer"
                    >
                      Randomize Embedding Sets ({projectionCount})
                    </button>
                    <span className="text-[9px] font-mono text-[#C9D1D9] font-bold">Matched Profile: Breast (94.8%)</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-4">
                <div className="bg-[#111419]/90 border border-[#1F2937] p-3 rounded-lg text-[11px] space-y-2">
                  <span className="font-bold text-white block">P2 Simulator: Local to Global Sync Board</span>
                  <p className="text-[#8B949E] text-[10.5px]">Trigger federated epoch rounds across hospital nodes.</p>

                  <div className="grid grid-cols-3 gap-1 text-center font-mono text-[9px] py-1">
                    {[
                      { name: "Hospital A", loss: 0.42 },
                      { name: "Hospital B", loss: 0.48 },
                      { name: "Hospital C", loss: 0.38 }
                    ].map((nodeObj) => (
                      <div 
                        key={nodeObj.name}
                        onClick={() => setActiveHospitalNode(nodeObj.name)}
                        className={`p-1.5 rounded border transition cursor-pointer ${
                          activeHospitalNode === nodeObj.name 
                            ? 'bg-blue-950/20 border-blue-500 text-blue-400' 
                            : 'bg-[#161B22] border-[#30363D] text-[#8B949E]'
                        }`}
                      >
                        <span className="block font-bold">{nodeObj.name}</span>
                        <span>Loss: {isSyncingGlobal ? 0.35 : nodeObj.loss}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-black/40 border border-[#1F2937] rounded space-y-1.5 text-[10px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Aggregation Method:</span>
                      <span className="text-white">Federated Averaging</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Validation Accuracy:</span>
                      <span className="text-emerald-400">{isSyncingGlobal ? "95.1% (+1.8%)" : "93.3%"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Encryption:</span>
                      <span className="text-amber-400">Differential Privacy On</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsSyncingGlobal(true);
                      setTimeout(() => setIsSyncingGlobal(false), 3000);
                    }}
                    disabled={isSyncingGlobal}
                    className={`w-full py-1.5 text-[10px] font-bold uppercase rounded border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSyncingGlobal 
                        ? 'bg-blue-900/10 border-blue-800/20 text-blue-500' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
                    }`}
                  >
                    {isSyncingGlobal ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-blue-400 animate-spin" />
                        Synchronizing Collaborative Network...
                      </>
                    ) : (
                      <>
                        <Network className="w-3.5 h-3.5" />
                        Compute Collaborative Global Average
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div className="space-y-4">
                <div className="bg-[#111419]/90 border border-[#1F2937] p-3.5 rounded-lg text-[11px] space-y-3">
                  <span className="font-bold text-white block">P3 Simulator: Therapeutic Variable Modulation</span>
                  <p className="text-[#8B949E] text-[10.5px]">Adjust sliders to simulate oncological treatment response curves in the digital twin.</p>

                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[10px]">
                        <span className="text-[#8B949E]">Chemotherapy intensity:</span>
                        <span className="text-white font-bold">{chemoDose}%</span>
                      </div>
                      <input 
                        type="range"
                        min="10"
                        max="100"
                        value={chemoDose}
                        onChange={(e) => setChemoDose(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer h-1.5 bg-[#1F2937] rounded-lg appearance-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[10px]">
                        <span className="text-[#8B949E]">Surgery Delay (weeks):</span>
                        <span className={surgeryDelayWeeks > 4 ? 'text-red-400 font-bold' : 'text-white'}>{surgeryDelayWeeks} wks</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="12"
                        value={surgeryDelayWeeks}
                        onChange={(e) => setSurgeryDelayWeeks(Number(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer h-1.5 bg-[#1F2937] rounded-lg appearance-none"
                      />
                    </div>

                    <div className="flex items-center justify-between border-t border-[#1F2937] pt-2.5">
                      <span className="text-[10px] text-[#8B949E] font-mono">Immunotherapy adjuvant block:</span>
                      <button
                        onClick={() => setImmunoSelected(p => !p)}
                        className={`px-3 py-1 text-[9px] font-mono tracking-wider rounded font-bold uppercase cursor-pointer ${
                          immunoSelected 
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' 
                            : 'bg-[#161B22] border border-[#30363D] text-[#8B949E]'
                        }`}
                      >
                        {immunoSelected ? "ACTIVE" : "DISABLED"}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-black/40 border border-[#1F2937] rounded text-center space-y-1">
                    <span className="text-[9px] font-mono uppercase text-[#8B949E]">Projected 5-Year Survival Probability</span>
                    <div className="text-2xl font-mono font-black text-white">{getTwinSurvivalOdds(60)}%</div>
                    <span className="block text-[8px] text-[#8B949E] font-mono leading-none">Modulated against Twin genomic variables</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 4 && (
              <div className="space-y-4">
                <div className="bg-[#111419]/90 border border-[#1F2937] p-3.5 rounded-lg text-[11px] space-y-3">
                  <span className="font-bold text-white block">P4 Simulator: Aggressed Machine-Learning Classifier</span>
                  <p className="text-[#8B949E] text-[10.5px]">Simulate tumor grade scaling outputs on the current sample.</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-[#8B949E]">Tumor grading scale bias:</span>
                      <span className="text-white">{Math.round(localGradeMultiplier * 100)}% Index</span>
                    </div>
                    <input 
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={localGradeMultiplier}
                      onChange={(e) => setLocalGradeMultiplier(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer h-1.5 bg-[#1F2937] rounded-lg appearance-none"
                    />
                  </div>

                  <div className="border-t border-[#1F2937] pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[#8B949E] text-[10px]">Recurrence Risk:</span>
                      <span className="font-mono font-bold text-[#E0E0E0]">{getPrognosisRisk()}%</span>
                    </div>
                    <div className="w-full bg-[#161B22] h-2 rounded overflow-hidden">
                      <div 
                        className={`h-full ${getPrognosisRisk() > 65 ? 'bg-rose-500' : 'bg-blue-500'}`} 
                        style={{ width: `${getPrognosisRisk()}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[#8B949E] text-[10px]">Metastatic Index:</span>
                      <span className="font-mono font-bold text-[#E0E0E0]">{Math.max(10, Math.min(95, Math.round(getPrognosisRisk() * 0.85)))}%</span>
                    </div>
                    <div className="w-full bg-[#161B22] h-2 rounded overflow-hidden">
                      <div 
                        className={`h-full ${getPrognosisRisk() * 0.85 > 65 ? 'bg-rose-400' : 'bg-amber-500'}`} 
                        style={{ width: `${Math.max(10, Math.min(95, Math.round(getPrognosisRisk() * 0.85)))}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[9px] text-[#8B949E] leading-relaxed font-mono">
                    *Calculation reflects active genomic mutations: TP53 ({hasTP53 ? 'Mutant' : 'Normal'}), EGFR ({hasEGFR ? 'Amplified' : 'Normal'}).
                  </p>
                </div>
              </div>
            )}

            {activeTab === 5 && (
              <div className="space-y-4">
                <div className="bg-[#111419]/90 border border-[#1F2937] p-3.5 rounded-lg text-[11px] space-y-3">
                  <span className="font-bold text-white block">P5 Simulator: Kaplan-Meier Survival Analysis</span>
                  <p className="text-[#8B949E] text-[10.5px]">Plot dynamic cumulative survival probability over continuous month increments.</p>

                  <div className="w-full h-32 bg-[#090C10] border border-[#21262d] rounded relative p-2 flex flex-col justify-between font-mono text-[8px] text-[#8B949E]">
                    {/* Survival curve coordinate system SVG */}
                    <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Grid lines */}
                      <line x1="0" y1="20" x2="100" y2="20" stroke="#1F2937" strokeWidth="0.5" strokeDasharray="2,2" />
                      <line x1="0" y1="50" x2="100" y2="50" stroke="#1F2937" strokeWidth="0.5" strokeDasharray="2,2" />
                      <line x1="0" y1="80" x2="100" y2="80" stroke="#1F2937" strokeWidth="0.5" strokeDasharray="2,2" />
                      
                      {/* Dynamic plot line */}
                      {(() => {
                        const base6 = getTwinSurvivalOdds(6);
                        const base12 = getTwinSurvivalOdds(12);
                        const base24 = getTwinSurvivalOdds(24);
                        const base36 = getTwinSurvivalOdds(36);
                        const base48 = getTwinSurvivalOdds(48);
                        const base60 = getTwinSurvivalOdds(60);

                        const pointsStr = `0,${100 - 100} 10,${100 - base6} 20,${100 - base12} 40,${100 - base24} 60,${100 - base36} 80,${100 - base48} 100,${100 - base60}`;
                        return (
                          <polygon 
                            points={`0,100 ${pointsStr} 100,100`}
                            fill="rgba(59, 130, 246, 0.15)"
                          />
                        );
                      })()}
                      {(() => {
                        const base6 = getTwinSurvivalOdds(6);
                        const base12 = getTwinSurvivalOdds(12);
                        const base24 = getTwinSurvivalOdds(24);
                        const base36 = getTwinSurvivalOdds(36);
                        const base48 = getTwinSurvivalOdds(48);
                        const base60 = getTwinSurvivalOdds(60);

                        const pointsStr = `0,${100 - 100} 10,${100 - base6} 20,${100 - base12} 40,${100 - base24} 60,${100 - base36} 80,${100 - base48} 100,${100 - base60}`;
                        return (
                          <polyline 
                            points={pointsStr}
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="2"
                          />
                        );
                      })()}
                    </svg>

                    <div className="flex justify-between relative mt-1 z-10 font-bold text-[#E0E0E0]">
                      <span>Survival Probability: 100%</span>
                      <span>50%</span>
                    </div>
                    <div className="flex justify-between relative z-10 pt-20">
                      <span>0m</span>
                      <span>12m</span>
                      <span>24m</span>
                      <span>36m</span>
                      <span>48m</span>
                      <span>60m</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center bg-black/30 p-2.5 rounded border border-[#1F2937]">
                    <div>
                      <span className="block text-[9px] text-[#484F58] font-bold font-mono">1-Year</span>
                      <span className="font-mono font-bold text-[#C9D1D9] text-xs">{getTwinSurvivalOdds(12)}%</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-[#484F58] font-bold font-mono">3-Year</span>
                      <span className="font-mono font-bold text-[#C9D1D9] text-xs">{getTwinSurvivalOdds(36)}%</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-[#484F58] font-bold font-mono">5-Year</span>
                      <span className="font-mono font-bold text-orange-400 text-xs">{getTwinSurvivalOdds(60)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 6 && (
              <div className="space-y-4">
                <div className="bg-[#111419]/90 border border-[#1F2937] p-3.5 rounded-lg text-[11px] space-y-3">
                  <span className="font-bold text-white block">P6 Simulator: Copilot Multimodal Query Sandbox</span>
                  <p className="text-[#8B949E] text-[10.5px]">Select research query modules to simulate specialized Gemini pathology output.</p>

                  <div className="space-y-2">
                    {copilotPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCopilotQueryIdx(idx);
                          setCopilotAnswering(true);
                          setTimeout(() => setCopilotAnswering(false), 800);
                        }}
                        className={`w-full text-left p-2.5 rounded border text-[10px] leading-snug transition flex items-start gap-1.5 cursor-pointer ${
                          copilotQueryIdx === idx 
                            ? 'bg-purple-950/20 border-purple-500/50 text-white' 
                            : 'bg-[#161B22] border-[#30363D] text-[#8B949E] hover:bg-[#21262D]'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <span>{preset.q}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-3 bg-black/50 border border-purple-950 rounded-lg space-y-1.5 min-h-[5.5rem] relative">
                    <span className="text-[8px] font-mono uppercase text-purple-400 font-bold block">Copilot Response</span>
                    {copilotAnswering ? (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-purple-500 animate-spin" />
                        <span className="text-[10px] font-mono text-[#8B949E] animate-pulse">Consulting shared fusion space...</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-[#C9D1D9] leading-relaxed transition-opacity duration-300">
                        {copilotPresets[copilotQueryIdx].a}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 7 && (
              <div className="space-y-4">
                <div className="bg-[#111419]/90 border border-[#1F2937] p-3.5 rounded-lg text-[11px] space-y-2.5">
                  <span className="font-bold text-white block">P7 Simulator: Multi-Agent Cascade Live Stream</span>
                  <p className="text-[#8B949E] text-[10.5px]">Deploy LangGraph agent cooperative pipelines.</p>

                  <div className="bg-[#090C10] p-2.5 rounded border border-[#21262d] font-mono text-[9.5px] space-y-1 max-h-[10rem] overflow-y-auto min-h-[9rem] pr-1">
                    {agentLogs.map((log, i) => {
                      const isSystem = log.includes("[SYSTEM]");
                      const isSlide = log.includes("[Slide Agent]");
                      const isValidation = log.includes("[Validation Agent]");
                      const logColor = isSystem 
                        ? 'text-blue-400' 
                        : isSlide 
                        ? 'text-amber-400' 
                        : isValidation 
                        ? 'text-emerald-400' 
                        : 'text-gray-300';

                      return (
                        <div key={i} className={`${logColor} leading-snug break-words`}>
                          {log}
                        </div>
                      );
                    })}
                    {isPlayingSimulation && (
                      <div className="text-amber-500 animate-pulse font-bold text-[9px] mt-1 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                        Awaiting next cascade callback...
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        resetAgentLogs();
                        setIsPlayingSimulation(true);
                      }}
                      disabled={isPlayingSimulation}
                      className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold uppercase tracking-wider rounded transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 text-white" />
                      Engage Cascade Cascade
                    </button>
                    <button
                      onClick={resetAgentLogs}
                      className="px-2.5 py-1.5 bg-[#161B22] border border-[#30363D] text-[10px] text-[#8B949E] hover:text-white rounded cursor-pointer"
                    >
                      Reset Logs
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 8 && (
              <div className="space-y-4">
                <div className="bg-[#111419]/90 border border-[#1F2937] p-3.5 rounded-lg text-[11px] space-y-3">
                  <span className="font-bold text-white block">P8 Simulator: Hospital Real-Time CDS Dashboard</span>
                  <p className="text-[#8B949E] text-[10.5px]">Plot emergency oncology alerts based on case characteristics.</p>

                  <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-rose-400 block tracking-wide">High Risk Diagnostic Alert</span>
                      <p className="text-[10px] text-[#C9D1D9] mt-0.5 leading-snug">
                        Specimen <span className="font-[#C9D1D9] font-bold">{sample.id}</span> correlates high architectural mitotic cell clusters coupled with a verified molecular <span className="text-rose-400 font-bold">TP53 mutation</span> block.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-black/40 border border-[#1F2937] rounded space-y-1.5 font-mono text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Systemic Progression Risk:</span>
                      <span className="text-rose-400 font-bold">89% (Extreme)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Priority Treatment:</span>
                      <span className="text-[#C9D1D9]">Immediate Adjuvant Inhibitors</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Next Action Directive:</span>
                      <span className="text-white underline">Notify Oncologist On-Call</span>
                    </div>
                  </div>

                  <button
                    onClick={() => alert(`CRITICAL EMERGENCY CDS ROUTE COMMITTED for Patient Case ${sample.id}. Clinical directory alerted.`)}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-wider rounded border border-rose-500 transition cursor-pointer"
                  >
                    Raise High-Risk Multidisciplinary Flag
                  </button>
                </div>
              </div>
            )}

            {activeTab === 9 && (
              <div className="space-y-4">
                <div className="bg-[#111419]/90 border border-[#1F2937] p-3.5 rounded-lg text-[11px] space-y-3">
                  <span className="font-bold text-white block">Syllabus Execution Matrix</span>
                  <p className="text-[#8B949E] text-[10.5px]">Deploying the Roadmap leads to progressive peer-reviewed publications.</p>

                  <div className="space-y-2 font-mono text-[9.5px]">
                    <div className="p-2 bg-blue-950/20 border border-blue-900/30 rounded flex justify-between items-center">
                      <span className="text-white font-bold">IEEE Conference</span>
                      <span className="text-blue-400 font-bold">Phase 1-4 Complete</span>
                    </div>
                    <div className="p-2 bg-purple-950/20 border border-purple-900/30 rounded flex justify-between items-center">
                      <span className="text-white font-bold">Q1 Medical Journal</span>
                      <span className="text-purple-400 font-bold">Phase 5-6 Add-On</span>
                    </div>
                    <div className="p-2 bg-amber-950/20 border border-amber-900/30 rounded flex justify-between items-center">
                      <span className="text-white font-bold">PhD Dissertation</span>
                      <span className="text-amber-400 font-bold">Phase 7-8 Platform</span>
                    </div>
                  </div>

                  <button
                    onClick={downloadProposal}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase rounded border border-emerald-500 transition cursor-pointer"
                  >
                    Export Integrated Research Syllabus
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
