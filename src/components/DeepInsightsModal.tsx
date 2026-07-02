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
  Layers,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';

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

  const handleDownloadPDF = () => {
    if (!insights) return;
    
    // Initialize jsPDF (A4 page size: 210mm x 297mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    let currentY = 25;

    // Helper to add header on every page
    const addHeader = (pageNum: number) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text('PathGPTPilot CLINICAL ONCOLOGY WORKSTATION', margin, 12);
      doc.text(`PAGE ${pageNum}`, pageWidth - margin - 15, 12);
      
      // Top divider line
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.2);
      doc.line(margin, 14, pageWidth - margin, 14);
    };

    // Helper to add footer on every page
    const addFooter = (pageNum: number) => {
      // Bottom divider line
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text('CONFIDENTIAL - FOR CLINICAL RESEARCH USE ONLY', margin, pageHeight - 10);
      doc.text('PathGPTPilot Multi-Somatic AI v2.4.0', pageWidth - margin - 50, pageHeight - 10);
    };

    // Draw page 1 custom decorative header
    addHeader(1);

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(24, 28, 36); // Elegant deep gray
    doc.text('EXECUTIVE ONCOLOGY SUMMARY', margin, currentY);
    currentY += 8;

    // Subtitle & System Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('System: PathGPTPilot Multi-Somatic AI Platform', margin, currentY);
    currentY += 5;
    
    // Date
    const todayStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generated on: ${todayStr}`, margin, currentY);
    currentY += 8;

    // Metadata Card
    doc.setFillColor(245, 247, 250); // Light gray fill
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

    // Inside Metadata card
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 45, 55);
    doc.text('ANALYZED COHORT SUMMARY:', margin + 4, currentY + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 85, 95);
    const caseIds = highRiskSamples.map(s => `${s.id} (${calculateRiskScore(s)}%)`).join(', ');
    const wrappedCases = doc.splitTextToSize(`Target Specimens: ${caseIds}`, contentWidth - 8);
    doc.text(wrappedCases, margin + 4, currentY + 11);
    
    doc.text(`Total Active High-Risk Cases: ${highRiskSamples.length} Specimen Profiles`, margin + 4, currentY + 20);
    currentY += 32;

    // Split raw insights text into individual lines
    const rawLines = insights.split('\n');
    let pageNum = 1;

    rawLines.forEach((rawLine) => {
      let cleanLine = rawLine.trim();

      // Skip empty or trivial lines
      if (cleanLine === '•' || cleanLine === '*' || cleanLine === '-' || cleanLine === '' || cleanLine === '---') {
        return;
      }

      // Check header types
      let isH1 = cleanLine.startsWith('# ');
      let isH2 = cleanLine.startsWith('## ');
      let isH3 = cleanLine.startsWith('### ');
      
      let fontSize = 10;
      let fontStyle = 'normal';
      let textColor = [50, 50, 50]; // Regular charcoal text
      let isBullet = cleanLine.startsWith('* ') || cleanLine.startsWith('- ') || cleanLine.startsWith('• ');
      let isBoldBullet = cleanLine.startsWith('* **') || cleanLine.startsWith('- **') || cleanLine.startsWith('• **');
      
      let textToDraw = cleanLine;
      let indent = 0;

      if (isH1) {
        fontSize = 13;
        fontStyle = 'bold';
        textColor = [16, 24, 48]; // Dark blue header
        textToDraw = cleanLine.replace('# ', '').trim();
        currentY += 5; // Extra spacing before H1
      } else if (isH2) {
        fontSize = 11;
        fontStyle = 'bold';
        textColor = [109, 40, 217]; // Purple header color matches applet styling
        textToDraw = cleanLine.replace('## ', '').trim();
        currentY += 3;
      } else if (isH3) {
        fontSize = 10;
        fontStyle = 'bold';
        textColor = [29, 78, 216]; // Blue sub-header matches applet styling
        textToDraw = cleanLine.replace('### ', '').trim();
        currentY += 2;
      } else if (isBoldBullet || isBullet) {
        indent = 5;
        // Clean up markdown bullet syntaxes
        textToDraw = cleanLine.replace(/^([\*\-\s•]+)/, '').trim();
      }

      // Strip markdown bold asterisks if we aren't handling rich inline bold
      textToDraw = textToDraw.replace(/\*\*/g, '');
      textToDraw = textToDraw.replace(/\*/g, '');

      // Check page height limit and add page if needed
      const checkAndAddPage = (neededHeight: number) => {
        if (currentY + neededHeight > pageHeight - 20) {
          addFooter(pageNum);
          doc.addPage();
          pageNum++;
          currentY = 25;
          addHeader(pageNum);
          return true;
        }
        return false;
      };

      // Set font styling
      doc.setFont('helvetica', fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      // Split text into lines that fit the remaining width
      const maxLineW = isBullet || isBoldBullet ? contentWidth - indent - 4 : contentWidth;
      const wrappedLines = doc.splitTextToSize(textToDraw, maxLineW);
      const leading = fontSize * 0.45; // Line spacing

      // Check if we need a new page for this paragraph
      const totalParagraphHeight = wrappedLines.length * leading;
      checkAndAddPage(totalParagraphHeight + 2);

      // Draw each wrapped line
      wrappedLines.forEach((lineStr: string, idx: number) => {
        // Double check per line to avoid any weird overflow
        checkAndAddPage(leading + 1);

        if (idx === 0 && (isBullet || isBoldBullet)) {
          // Draw standard bullet
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(109, 40, 217); // Purple bullet
          doc.text('•', margin, currentY);
          
          doc.setFont('helvetica', fontStyle);
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          doc.text(lineStr, margin + indent, currentY);
        } else {
          doc.text(lineStr, margin + indent, currentY);
        }
        currentY += leading;
      });

      // Regular gap after paragraph
      currentY += 2;
    });

    // Add footer to final page
    addFooter(pageNum);

    // Save/Download the PDF file
    doc.save(`PathGPTPilot-Executive-Oncology-Summary-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!isOpen) return null;

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
            className="text-white font-bold font-sans bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-900/40 text-[11px] inline-block mx-0.5"
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
              <div key={itemIdx} className="text-xs text-[#C9D1D9] pl-4 py-1.5 flex items-start gap-2 border-l border-[#21262D] hover:border-purple-500/30 transition-all ml-1 my-0.5">
                <span className="text-purple-500 font-bold select-none">•</span>
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
            <span className="w-1.5 h-3 bg-purple-500 rounded-sm" />
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
          <h4 key={idx} className="text-xs font-bold text-purple-400 border-b border-[#21262D] pb-1 mt-5 mb-2 font-mono uppercase tracking-wider">
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
          <h5 key={idx} className="text-[11px] font-bold text-blue-400 mt-4 mb-1.5 font-mono uppercase tracking-wider">
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
              <>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-black uppercase rounded-lg shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-black uppercase rounded-lg shadow-md transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Summary'}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
