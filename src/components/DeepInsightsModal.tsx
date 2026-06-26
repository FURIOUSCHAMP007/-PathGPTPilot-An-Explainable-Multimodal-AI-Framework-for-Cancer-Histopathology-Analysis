/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HistologySample } from '../types';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  ShieldAlert, 
  FileText, 
  Bookmark,
  Layers
} from 'lucide-react';

interface DeepInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  samples: HistologySample[];
  calculateRiskScore: (sample: HistologySample) => number;
}

export default function DeepInsightsModal({
  isOpen,
  onClose,
  samples,
  calculateRiskScore
}: DeepInsightsModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [insights, setInsights] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');

  // Extract critical cases automatically
  // High risk defined as risk score >= 60%
  let highRiskSamples = samples.filter((s) => calculateRiskScore(s) >= 60);
  // If no specimens meet the score >= 60%, fall back to top 3 highest-risk specimens to always have content
  if (highRiskSamples.length === 0) {
    highRiskSamples = [...samples]
      .sort((a, b) => calculateRiskScore(b) - calculateRiskScore(a))
      .slice(0, 3);
  }

  useEffect(() => {
    if (isOpen && highRiskSamples.length > 0) {
      fetchInsights();
    }
  }, [isOpen, samples]);

  const fetchInsights = async () => {
    setLoading(true);
    setInsights('');
    setErrorText('');

    try {
      const response = await fetch('/api/deep-diagnostic-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples: highRiskSamples })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setInsights(data.insightsText);
      } else {
        throw new Error(data.error || 'Server rejected diagnostics generation request');
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Network timeout or API connection loss. Please verify server integrity.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!insights) return;
    navigator.clipboard.writeText(insights);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  // Custom markdown simple parsing renderer
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const cleanLine = line.trim();
      const contentWithoutHashes = cleanLine.replace(/#/g, '').trim();
      if (cleanLine.startsWith('# ')) {
        return <h3 key={idx} className="text-sm font-black text-white border-b border-[#30363D] pb-1.5 mt-5 mb-2.5 font-mono uppercase tracking-wide">{contentWithoutHashes}</h3>;
      }
      if (cleanLine.startsWith('## ')) {
        return <h4 key={idx} className="text-xs font-bold text-gray-100 border-b border-[#21262D] pb-1 mt-4 mb-2 font-mono uppercase text-purple-400">{contentWithoutHashes}</h4>;
      }
      if (cleanLine.startsWith('### ')) {
        return <h5 key={idx} className="text-[11px] font-bold text-blue-400 mt-3 mb-1 font-mono uppercase tracking-wider">{contentWithoutHashes}</h5>;
      }
      if (cleanLine.startsWith('* **') || cleanLine.startsWith('- **')) {
        const parts = contentWithoutHashes.split('**');
        return (
          <div key={idx} className="text-xs text-gray-300 pl-4 py-1 flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span>
              <strong className="text-white font-semibold">{parts[1]}</strong>
              {parts.slice(2).join('')}
            </span>
          </div>
        );
      }
      if (cleanLine.startsWith('* ') || cleanLine.startsWith('- ')) {
        return (
          <div key={idx} className="text-xs text-gray-300 pl-4 py-1 flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span>{contentWithoutHashes}</span>
          </div>
        );
      }
      if (cleanLine.startsWith('**')) {
        return <p key={idx} className="text-xs text-purple-300 bg-purple-950/20 border-l-2 border-purple-500 rounded p-3 my-3 font-mono leading-relaxed">{contentWithoutHashes.replace(/\*\*/g, '')}</p>;
      }
      if (cleanLine === '') {
        return <div key={idx} className="h-1" />;
      }
      return <p key={idx} className="text-xs text-gray-300 leading-relaxed font-sans mb-2">{contentWithoutHashes}</p>;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0D1117] border border-[#1F2937] text-gray-200 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="border-b border-[#1F2937] px-6 py-4 bg-[#161B22] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Deep Diagnostic Insights</h2>
              <p className="text-[11px] text-[#8B949E]">Gemini-powered rapid cohort summary and oncological synthesis for clinically active high-risk specimens.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[#30363D] text-[#8B949E] hover:text-white rounded-lg transition"
            title="Close insights portal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected high-risk cohort recap sub-header */}
        <div className="bg-[#161B22]/40 border-b border-[#1F2937] px-6 py-3 flex flex-wrap gap-2.5 items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Targeting <strong className="text-white font-mono font-bold">{highRiskSamples.length}</strong> high-risk patient specimens:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 matches-list">
            {highRiskSamples.map(s => {
              const score = calculateRiskScore(s);
              return (
                <span 
                  key={s.id} 
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-black ${
                    score >= 65 
                      ? 'bg-rose-950/30 text-rose-400 border border-rose-900/50' 
                      : 'bg-amber-950/30 text-amber-400 border border-amber-900/50'
                  }`}
                  title={`${s.name} - ${s.tissueType}`}
                >
                  {s.id} ({score}%)
                </span>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 bg-[#010409] p-6 overflow-y-auto">
          {loading && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-purple-500 animate-spin" />
              <div>
                <p className="text-xs text-white font-mono uppercase tracking-widest font-black">AI Diagnosis Synthesizer</p>
                <p className="text-[11px] text-[#8B949E] mt-1">Directing Gemini model to cross-reference histology records, cellular configurations, and somatic markers...</p>
              </div>
            </div>
          )}

          {errorText && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-rose-500" />
              <div>
                <p className="text-xs text-rose-400 font-mono font-black uppercase tracking-wider">Informatics Link Error</p>
                <p className="text-xs text-gray-400 max-w-sm mt-1 leading-relaxed">{errorText}</p>
                <button
                  type="button"
                  onClick={fetchInsights}
                  className="mt-4 px-3 py-1.5 bg-[#161B22] border border-[#30363D] hover:border-purple-500 text-purple-300 font-mono text-[10px] font-black uppercase rounded transition"
                >
                  Retry API Diagnostics Fetch
                </button>
              </div>
            </div>
          )}

          {insights && !loading && (
            <div 
              id="deep-diagnostics-report-container" 
              className="mx-auto max-w-3xl bg-[#0D1117] border border-[#1F2937] rounded-xl p-6 md:p-8 text-[#C9D1D9] shadow-inner font-sans prose prose-sm prose-invert"
            >
              <div className="flex items-center justify-between border-b border-[#1F2937] pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-mono uppercase text-[#8B949E] font-black tracking-wider">Executive Oncology Summary</span>
                </div>
                <span className="text-[10px] font-mono text-[#8B949E]">System: PathGPTPilot Multi-Somatic AI</span>
              </div>

              <div className="space-y-1">
                {renderMarkdown(insights)}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#1F2937] px-6 py-4 bg-[#161B22] flex items-center justify-between">
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[#8B949E] hover:text-white transition disabled:opacity-50 cursor-pointer text-left"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-mono text-[10px] uppercase font-bold">Re-synthesize Insights</span>
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#0D1117] hover:bg-[#30363D] border border-[#30363D] text-gray-300 font-mono text-xs font-bold uppercase rounded-lg transition-all cursor-pointer"
            >
              Close
            </button>
            {insights && (
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-black uppercase rounded-lg shadow-md transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Summary'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
