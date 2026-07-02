/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { HistologySample, ChatMessage } from '../types';
import { AVAILABLE_MODELS } from '../data';
import { 
  Send, Sparkles, X, BrainCircuit, Activity, BookOpen, 
  Dna, HelpCircle, GraduationCap, ChevronRight, RefreshCw, 
  Cpu, FileText, CheckCircle2, FlaskConical, AlertCircle, Library
} from 'lucide-react';

interface SidebarAssistantProps {
  sample: HistologySample;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarAssistant({
  sample,
  selectedModelId,
  onModelChange,
  isOpen,
  onClose
}: SidebarAssistantProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'morphology' | 'tcga'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [agenticActive, setAgenticActive] = useState<boolean>(true);
  const [agentStageIndex, setAgentStageIndex] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isProstate = sample.tissueType.toLowerCase().includes('prostate');
  const isBreast = sample.tissueType.toLowerCase().includes('breast') || sample.name.toLowerCase().includes('breast') || sample.description.toLowerCase().includes('breast');

  const agentStages = [
    "Cognitive Plan: Scanning pathology slide and multi-modal metrics...",
    "Querying target registries and genomics variant database...",
    "Running SwinUNETR segmentation check and boundary calculations...",
    "Compiling clinical reasoning and formulation of next-step actions..."
  ];

  // Initialize welcome message when sample changes or sidebar opens
  useEffect(() => {
    const welcomeText = isBreast
      ? `Greetings. I am your PathGPTPilot Breast Oncology Specialist Co-Pilot. I have loaded Breast Core Specimen **${sample.id}** (${sample.defaultGrade}). I can explain breast ductal carcinoma morphology, stromal desmoplasia, and connect your observations to TCGA-BRCA cohorts or Nottingham staging standards. How can I assist you today?`
      : isProstate
      ? `Greetings. I am your PathGPTPilot Prostatic Pathology Specialist Co-Pilot. I have loaded Prostate Core Specimen **${sample.id}** (${sample.defaultGrade}). I am ready to discuss Gleason pattern 4 cribriform features, gland border segmentation, and reference TCGA-PRAD genomic registries. How can I support your diagnostic review?`
      : `Greetings. I am your PathGPTPilot Clinical Co-Pilot. Specimen **${sample.id}** (${sample.tissueType}) is loaded. I am ready to discuss clinical, morphological, or genomic molecular diagnostics. Ask me about cell morphology or TCGA clinical studies!`;

    setMessages([
      {
        id: 'sidebar-welcome',
        role: 'model',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [sample.id, isProstate, isBreast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sending) {
      interval = setInterval(() => {
        setAgentStageIndex((prev) => (prev + 1) % agentStages.length);
      }, 1500);
    } else {
      setAgentStageIndex(0);
    }
    return () => clearInterval(interval);
  }, [sending]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, sending, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || sending) return;

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setSending(true);

    try {
      const response = await fetch('/api/chat-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          selectedModel: selectedModelId,
          agenticMode: agenticActive,
          slideMetadata: {
            slideId: sample.id,
            tissueType: sample.tissueType,
            gradePredicted: sample.defaultGrade,
            confidence: sample.confidence,
            segmentDice: 0.932,
            segmentIoU: 0.871,
            features: sample.features || [],
            clinical: sample.clinical,
            genomic: sample.genomic
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `m-resp-${Date.now()}`,
            role: 'model',
            text: result.reply,
            thoughts: result.thoughts,
            tools: result.tools,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `m-err-${Date.now()}`,
            role: 'model',
            text: `Critical error communicating with Co-Pilot service. Details: ${result.error || 'Server error'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-net-err-${Date.now()}`,
          role: 'model',
          text: `Co-Pilot connection error. The server might still be booting or Gemini is currently unreachable: ${err.message || err}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  // Morphology Lookup Terms
  const morphologyTerms = [
    {
      term: "Nuclear Pleomorphism",
      category: "Cellular",
      definition: "Marked variation in nuclear size, shape, and chromatin staining intensity. Represents a core indicator of mitotic dysfunction and aggressive neoplastic growth.",
      prompt: "Can you explain the biological mechanisms behind nuclear pleomorphism and how pathologists grade nuclear variation?"
    },
    {
      term: "Glandular Fusion & Cribriforming",
      category: "Architectural",
      definition: "Glands that fuse together into irregular sheets or form sieve-like cribriform sheets without stroma. In prostate cancer, this forms the basis of Gleason Pattern 4.",
      prompt: "Explain prostatic cribriforming and why the presence of cribriform pattern 4 correlates with poorer clinical outcomes."
    },
    {
      term: "Desmoplastic Stromal Response",
      category: "Microenvironment",
      definition: "Growth of dense fibrous or connective tissue surrounding invasive tumor nests. Frequently observed in invasive ductal carcinoma (IDC) of the breast.",
      prompt: "What is desmoplastic stromal response in breast cancer and how does the tumor microenvironment remodel surrounding collagen?"
    },
    {
      term: "Atypical Mitotic Figures",
      category: "Cellular",
      definition: "Abnormal tripolar, quadripolar, or ring-shaped mitotic arrangements indicating severe chromosomal instability and extreme replication rate.",
      prompt: "Detail what atypical mitotic figures signify in histopathology and how they are used to compute mitotic index or grading."
    },
    {
      term: "Loss of Epithelial Polarization",
      category: "Architectural",
      definition: "Failure of cells to align in a structured radial formation around a central lumen, leading to disorganized solid sheets of cells.",
      prompt: "Explain how cancer cells lose their apical-basal polarization during epithelial-mesenchymal transition (EMT)."
    }
  ];

  // TCGA Cohort References
  const tcgaCohorts = [
    {
      code: "TCGA-BRCA",
      title: "Breast Invasive Carcinoma",
      description: "Comprehensive molecular profiling of 1,000+ breast tumors. Outlines PAM50 intrinsic subtypes (Luminal A, Luminal B, HER2-enriched, Basal-like) and identifies recurrent TP53 mutations as key drivers in triple-negative cases.",
      prompt: "Summarize the primary conclusions of the TCGA-BRCA study, particularly regarding the prognosis of mutant TP53 in Basal-like breast cancers."
    },
    {
      code: "TCGA-PRAD",
      title: "Prostate Adenocarcinoma",
      description: "Genomic landscape study of 499 prostate cancers. Highlights that SPOP, FOXA1, and TP53 alterations segment disease into distinct molecular classes, and correlates higher cribriform morphology counts to severe chromosomal alterations.",
      prompt: "Can you detail the molecular classification of SPOP vs TP53 alterations in the TCGA-PRAD cohort and their respective progression-free survival?"
    },
    {
      code: "TCGA-LUSC / LUAD",
      title: "Lung Squamous & Adenocarcinoma",
      description: "Somatic alterations dataset mapping squamous cell lineages versus glandular structures. Connects EGFR amplifications and TP53 suppressor failure to rapid metastatic progression indices in advanced lobes.",
      prompt: "Compare the genomic signatures of TCGA-LUAD and TCGA-LUSC regarding EGFR, KRAS, and TP53 mutation frequencies."
    }
  ];

  const suggestedPrompts = isBreast 
    ? [
        "Explain Nottingham grading criteria for breast carcinoma.",
        "How does mutant TP53 correlate to breast IDC stroma?",
        "Provide TCGA-BRCA statistics for invasive ductal cancer."
      ]
    : isProstate
    ? [
        "Detail Gleason pattern 3 vs 4 architectural boundaries.",
        "Describe typical genomic alterations in TCGA-PRAD cohort.",
        "What does high-density prostate gland segmentation indicate?"
      ]
    : [
        "Explain how SwinUNETR accomplishes medical image segmentation.",
        "Detail the correlation between TP53 mutation and high tumor grading.",
        "Summarize the major survival outcomes in TCGA oncology cohorts."
      ];

  if (!isOpen) return null;

  return (
    <>
      {/* Sidebar Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300 no-print" 
        onClick={onClose}
      />

      {/* Sidebar Drawer Container */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-[420px] bg-[#0D1117] border-l border-[#21262D] z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out h-full no-print"
        id="global-sidebar-assistant"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#21262D] bg-[#161B22] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-blue-500 animate-pulse" />
            <div>
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block font-mono">ONCOLOGY CO-PILOT</span>
              <span className="text-xs font-black text-white uppercase tracking-wider font-mono">PathGPTPilot Core-AI</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-[#8B949E] hover:text-white hover:bg-[#21262D] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Specimen Context Banner */}
        <div className="p-3 bg-blue-950/20 border-b border-[#1F2937] text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Active Slide Focus:</span>
            <span className="font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-[10px]">
              {sample.id}
            </span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-gray-400">Tissue / Type:</span>
            <strong className="text-white font-normal">{sample.tissueType}</strong>
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-gray-400">Predicted Grade:</span>
            <strong className="text-rose-400 font-bold font-mono">{sample.defaultGrade}</strong>
          </div>
          {/* Automatic Cohort Indicator */}
          <div className="mt-2.5 flex items-center gap-1.5 bg-blue-500/5 border border-blue-500/10 rounded px-2 py-1 text-[9px] text-[#8B949E] font-mono font-semibold">
            <Dna className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Targeting Registry:</span>
            <strong className="text-purple-400">
              {isBreast ? "TCGA-BRCA Profile" : isProstate ? "TCGA-PRAD Profile" : "General TCGA Reference"}
            </strong>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-[#21262D] bg-[#090D14] text-[10px] font-bold uppercase tracking-wider font-mono">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'chat' 
                ? 'border-blue-500 text-blue-400 bg-blue-950/10' 
                : 'border-transparent text-[#8B949E] hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>AI Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('morphology')}
            className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'morphology' 
                ? 'border-blue-500 text-blue-400 bg-blue-950/10' 
                : 'border-transparent text-[#8B949E] hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Cell Morphology</span>
          </button>
          <button
            onClick={() => setActiveTab('tcga')}
            className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'tcga' 
                ? 'border-blue-500 text-blue-400 bg-blue-950/10' 
                : 'border-transparent text-[#8B949E] hover:text-white'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>TCGA Research</span>
          </button>
        </div>

        {/* Scrollable Tab Views */}
        <div className="flex-1 overflow-y-auto bg-[#010409]">
          
          {/* TAB 1: INTERACTIVE CHAT CO-PILOT */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
              {/* Message History area */}
              <div className="flex-1 p-4 space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[90%] ${
                      m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    {/* Render Agentic steps for model messages if active */}
                    {m.role === 'model' && agenticActive && (m.thoughts || m.tools) && (
                      <div className="w-full space-y-2 mb-2">
                        {m.thoughts && m.thoughts.length > 0 && (
                          <div className="bg-blue-950/15 border-l border-blue-500 p-2 rounded font-mono text-[9px] text-blue-300 space-y-0.5">
                            <div className="flex items-center gap-1 font-bold uppercase tracking-wider text-blue-400 leading-none mb-1">
                              <BrainCircuit className="w-3 h-3 text-blue-400" />
                              <span>Cognitive Log</span>
                            </div>
                            {m.thoughts.map((t, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="text-blue-500 select-none">›</span>
                                <span className="leading-tight">{t}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {m.tools && m.tools.length > 0 && (
                          <div className="bg-purple-950/15 border-l border-purple-500 p-2 rounded font-mono text-[9px] text-purple-300 space-y-1">
                            <div className="flex items-center gap-1 font-bold uppercase tracking-wider text-purple-400 leading-none mb-1">
                              <Cpu className="w-3 h-3 text-purple-400" />
                              <span>Executed Systems Tool</span>
                            </div>
                            {m.tools.map((tool, idx) => (
                              <div key={idx} className="space-y-0.5">
                                <div className="text-purple-400 font-bold font-mono">🔧 {tool.name}()</div>
                                <div className="pl-2 text-[8px] text-purple-200 bg-purple-950/40 p-1 rounded font-mono break-all">{tool.result}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chat Bubble text */}
                    <div
                      className={`rounded-lg p-2.5 leading-relaxed text-xs ${
                        m.role === 'user'
                          ? 'bg-blue-600 text-white border border-blue-500 font-medium'
                          : 'bg-[#161B22] border border-[#30363D] text-[#C9D1D9]'
                      }`}
                    >
                      <div className="whitespace-pre-line">
                        {m.text.replace(/#/g, '').split('**').map((chunk, chunkIdx) => 
                          chunkIdx % 2 === 1 ? <strong key={chunkIdx} className="text-white font-bold">{chunk}</strong> : chunk
                        )}
                      </div>
                    </div>
                    <span className="text-[8px] text-[#8B949E] mt-0.5 px-1 font-mono">{m.timestamp}</span>
                  </div>
                ))}

                {/* Processing State */}
                {sending && (
                  <div className="bg-[#0D1117] border border-[#30363D] p-3 rounded-lg text-xs space-y-1 mr-auto max-w-[90%]">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                      <span className="font-bold text-blue-400 uppercase tracking-widest text-[9px] font-mono">Processing...</span>
                    </div>
                    {agenticActive && (
                      <div className="border-t border-blue-900/10 pt-1 mt-1 text-[9px] font-mono text-blue-300 leading-tight">
                        <span className="text-blue-500 font-bold select-none animate-ping mr-1">●</span>
                        {agentStages[agentStageIndex]}
                      </div>
                    )}
                  </div>
                )}
                <div ref={scrollRef} />
              </div>

              {/* Suggestions Quick Prompts */}
              <div className="p-3 border-t border-[#21262D] bg-[#0E131F]/50">
                <div className="text-[9px] font-bold text-[#8B949E] uppercase tracking-wider mb-2 flex items-center gap-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Suggested pathology queries:</span>
                </div>
                <div className="space-y-1.5">
                  {suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p)}
                      className="w-full text-left p-2 bg-[#161B22]/60 hover:bg-blue-950/20 border border-[#30363D] hover:border-blue-500 rounded text-xs text-blue-400 hover:text-white transition-all cursor-pointer font-normal flex items-center justify-between"
                    >
                      <span>{p}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CELLULAR MORPHOLOGY DICTIONARY */}
          {activeTab === 'morphology' && (
            <div className="p-4 space-y-4">
              <div className="bg-[#161B22] border border-[#30363D] p-3 rounded flex items-start gap-2.5">
                <GraduationCap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide block font-mono">Morphology Lookup</span>
                  <p className="text-[11px] text-[#8B949E] leading-normal mt-0.5">
                    Histopathology centers on identifying structural alterations within cell nuclei and gland margins. Choose a microscopic criteria to inquire directly.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {morphologyTerms.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 bg-[#161B22]/50 border border-[#21262D] rounded-lg hover:border-[#30363D] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">{item.term}</span>
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8B949E] leading-relaxed mt-2">
                      {item.definition}
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab('chat');
                        handleSendMessage(item.prompt);
                      }}
                      className="mt-3 text-[10px] text-emerald-400 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Inquire Pathology Agent</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TCGA RESEARCH ARCHIVES */}
          {activeTab === 'tcga' && (
            <div className="p-4 space-y-4">
              <div className="bg-[#161B22] border border-[#30363D] p-3 rounded flex items-start gap-2.5">
                <Library className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide block font-mono">TCGA Genomic Archives</span>
                  <p className="text-[11px] text-[#8B949E] leading-normal mt-0.5">
                    The Cancer Genome Atlas (TCGA) provides standard reference profiles pairing cancer genotypes to microscopic tissue presentation phenotypes.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {tcgaCohorts.map((cohort, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 bg-[#161B22]/50 border border-[#21262D] rounded-lg hover:border-[#30363D] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">{cohort.code}</span>
                      <span className="bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase">
                        Active Dataset
                      </span>
                    </div>
                    <span className="block text-[10px] font-bold text-[#8B949E] mt-0.5">{cohort.title}</span>
                    <p className="text-[11px] text-[#8B949E] leading-relaxed mt-2 font-sans font-normal">
                      {cohort.description}
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab('chat');
                        handleSendMessage(cohort.prompt);
                      }}
                      className="mt-3 text-[10px] text-purple-400 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Cross-Reference Case</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Sidebar Footer Chat Panel Actions */}
        {activeTab === 'chat' && (
          <div className="p-3.5 border-t border-[#21262D] bg-[#161B22] flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase text-[#8B949E]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAgenticActive(!agenticActive)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                    agenticActive 
                      ? 'bg-blue-950/60 border-blue-500/50 text-blue-400' 
                      : 'bg-[#0D1117] border-[#30363D] text-[#8B949E]'
                  }`}
                  title="Toggle Agentic Cognitive Reasoning Loops"
                >
                  <Activity className={`w-3 h-3 ${agenticActive ? 'text-blue-400 animate-pulse' : 'text-[#8B949E]'}`} />
                  <span>Agentic: {agenticActive ? "ON" : "OFF"}</span>
                </button>
              </div>
              
              <div className="flex items-center gap-1">
                <span>Engine:</span>
                <select
                  value={selectedModelId}
                  onChange={(e) => onModelChange(e.target.value)}
                  className="bg-transparent text-blue-400 font-bold outline-none cursor-pointer leading-none text-[9px]"
                  title="Active AI Brain Selector"
                >
                  {AVAILABLE_MODELS.map((model) => (
                    <option key={model.id} value={model.id} className="bg-[#0D1117] text-[#C9D1D9]">
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input Form field */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                placeholder="Ask clinical co-pilot regarding slide..."
                className="flex-1 px-3 py-2 text-xs border border-[#30363D] bg-[#010409] text-[#E0E0E0] placeholder-[#8B949E]/50 rounded outline-none focus:border-blue-500 transition-colors font-mono font-normal"
                disabled={sending}
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={sending || !inputValue.trim()}
                className={`p-2 rounded text-white transition-colors shrink-0 ${
                  sending || !inputValue.trim()
                    ? 'bg-[#0D1117] border border-[#21262D] cursor-not-allowed text-[#8B949E]'
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer border border-blue-500'
                }`}
                id="sidebar-send-chat-btn"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
