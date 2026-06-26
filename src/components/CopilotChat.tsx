/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { HistologySample, ChatMessage, LLMModel } from '../types';
import { AVAILABLE_MODELS } from '../data';
import { Send, Sparkles, MessageCircle, RefreshCw, Cpu, BrainCircuit, Lightbulb, Activity } from 'lucide-react';

interface CopilotChatProps {
  sample: HistologySample;
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
}

export default function CopilotChat({ sample, selectedModelId, onModelChange }: CopilotChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Greetings. I am your PathGPTPilot Clinical Co-Pilot. I have loaded specimen ${sample.id} (${sample.tissueType}). How may I assist you with clinical, morphological, or genomic molecular diagnostics today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [agenticActive, setAgenticActive] = useState<boolean>(true);
  const [agentStageIndex, setAgentStageIndex] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const agentStages = [
    "Cognitive Plan: Scanning pathology slide and multi-modal metrics...",
    "Querying target registries and genomics variant database...",
    "Running SwinUNETR segmentation check and boundary calculations...",
    "Compiling clinical reasoning and formulation of next-step actions..."
  ];

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

  // Suggested questions based on active slide properties
  const suggestedQuestions = [
    `How does the TP53 ${sample.genomic.tp53} status correlate to this high-grade morphology?`,
    "Explain how SwinUNETR performs medical segmentation.",
    "Show clinical next steps for this stage patient."
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

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
            features: sample.features,
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
          text: `Co-Pilot connection error. The local server might still be booting up or Gemini is unreachable: ${err.message || err}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#0D1117] rounded-xl border border-[#1F2937] p-5 flex flex-col h-[42rem]" id="pathologist-assistant-chat">
      {/* Chat header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1F2937] pb-2.5 shrink-0">
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="p-1 px-2 bg-blue-950/40 border border-blue-900/40 rounded flex items-center gap-1.5 font-sans whitespace-nowrap">
            <BrainCircuit className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide whitespace-nowrap">PathGPTPilot Co-Pilot</span>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Agentic Mode Switcher */}
          <button
            onClick={() => setAgenticActive(!agenticActive)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              agenticActive 
                ? 'bg-blue-950/60 border-blue-500/50 text-blue-400' 
                : 'bg-[#161B22] border-[#30363D] text-[#8B949E]'
            }`}
            title="Toggle Agentic AI Multi-Step Cognitive Reasoning & Function Calling"
          >
            <Activity className={`w-3 h-3 shrink-0 ${agenticActive ? 'text-blue-400 animate-pulse' : 'text-[#8B949E]'}`} />
            <span className="whitespace-nowrap">{agenticActive ? "Agentic: ON" : "Agentic: OFF"}</span>
          </button>
          
          {/* LLM selection dropdown */}
          <select
            value={selectedModelId}
            onChange={(e) => onModelChange(e.target.value)}
            className="text-[9px] font-mono text-blue-400 bg-blue-95/20 hover:bg-blue-900/10 border border-blue-900/40 focus:border-blue-500 focus:outline-none px-2 py-0.5 rounded cursor-pointer leading-tight transition-all font-bold whitespace-nowrap shrink-0"
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

      {/* Suggested Quick Questions */}
      <div className="py-2 border-b border-[#1F2937] shrink-0 flex items-center gap-2 overflow-x-auto scrollbar-none select-none">
        <span className="text-[9px] font-bold text-[#8B949E] flex items-center gap-1 shrink-0 uppercase tracking-widest leading-none whitespace-nowrap">
          <Lightbulb className="w-3 h-3 text-amber-400 shrink-0" /> RECOMMENDED:
        </span>
        <div className="flex space-x-2 overflow-x-auto scrollbar-none shrink-0">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-2 py-0.5 text-[9px] font-semibold text-blue-400 hover:text-white bg-blue-900/10 hover:bg-blue-600 border border-blue-900/30 rounded shrink-0 transition-colors cursor-pointer"
              title={q}
            >
              {q.length > 40 ? `${q.substring(0, 38)}...` : q}
            </button>
          ))}
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4 font-sans text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col max-w-[85%] ${
              m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            {/* Agentic Steps & Logs Rendering */}
            {m.role === 'model' && agenticActive && (m.thoughts || m.tools) && (
              <div className="w-full space-y-2 mb-2">
                {/* Cognitive Thoughts Accordion */}
                {m.thoughts && m.thoughts.length > 0 && (
                  <div className="bg-blue-950/20 border-l-2 border-blue-500 rounded p-2.5 font-mono text-[9.5px] text-blue-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-blue-400 mb-1 leading-none">
                      <BrainCircuit className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                      <span>Cognitive Thoughts</span>
                    </div>
                    {m.thoughts.map((t, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-1">
                        <span className="text-blue-500 font-bold select-none">➔</span>
                        <span className="leading-tight">{t}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* System Tool Execution */}
                {m.tools && m.tools.length > 0 && (
                  <div className="bg-purple-950/20 border-l-2 border-purple-500 rounded p-2.5 font-mono text-[9.5px] text-purple-300 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-purple-400 leading-none">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      <span>Executed Systems Core Tools</span>
                    </div>
                    {m.tools.map((tool, tIdx) => (
                      <div key={tIdx} className="pt-1 border-t border-purple-900/20 first:border-0 first:pt-0">
                        <div className="flex items-center gap-1 text-purple-400 font-bold">
                          <span>🔧</span>
                          <span className="text-[9.5px] select-all">{tool.name}({JSON.stringify(tool.args)})</span>
                        </div>
                        <div className="pl-3 text-[8.5px] text-purple-200 bg-purple-950/40 p-1.5 rounded mt-1 border border-purple-900/10 whitespace-pre-wrap select-all">
                          {tool.result}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sender bubble */}
            <div
              className={`rounded-lg p-3 leading-relaxed font-normal ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white border border-blue-500'
                  : 'bg-[#161B22] border border-[#30363D] text-[#C9D1D9]'
              }`}
            >
              <div className="whitespace-pre-line text-xs font-medium">
                {/* Dynamically emphasize bold markings in Gemini output and strip hash marks */}
                {m.text.replace(/#/g, '').split('**').map((chunk, chunkIdx) => 
                  chunkIdx % 2 === 1 ? <strong key={chunkIdx} className={m.role === 'user' ? 'text-white font-black' : 'text-white font-bold'}>{chunk}</strong> : chunk
                )}
              </div>
            </div>
            {/* Timestamp */}
            <span className="text-[8px] text-[#8B949E] mt-1 px-1 font-mono">{m.timestamp}</span>
          </div>
        ))}
        {sending && (
          <div className="flex flex-col gap-2 mr-auto max-w-[85%] bg-[#010409] border border-[#30363D] p-3 rounded-lg text-xs">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
              <span className="font-bold text-blue-400 animate-pulse text-[10px] font-mono uppercase tracking-wider">PathGPTPilot Co-Pilot Running...</span>
            </div>
            {agenticActive && (
              <div className="border-t border-[#1F2937] pt-1.5 mt-0.5 text-[9.5px] font-mono text-blue-300 leading-tight">
                <span className="text-blue-500 font-bold select-none animate-ping mr-1">●</span>
                {agentStages[agentStageIndex]}
              </div>
            )}
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input box */}
      <div className="border-t border-[#1F2937] pt-2.5 flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
          placeholder={agenticActive ? `Direct pathologist agent to reason about ${sample.id}...` : `Query pathologist agent about ${sample.id}...`}
          className="flex-1 px-3 py-2 text-xs border border-[#30363D] bg-[#010409] text-[#E0E0E0] placeholder-[#8B949E]/60 rounded outline-none focus:border-blue-500 transition-colors font-mono"
          disabled={sending}
        />
        <button
          onClick={() => handleSendMessage(inputValue)}
          disabled={sending || !inputValue.trim()}
          className={`p-2 rounded text-white transition-colors shrink-0 ${
            sending || !inputValue.trim()
              ? 'bg-[#161B22] border border-[#30363D] cursor-not-allowed text-[#8B949E]'
              : 'bg-blue-600 hover:bg-blue-700 cursor-pointer border border-blue-505'
          }`}
          id="send-chat-btn"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
