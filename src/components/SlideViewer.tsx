/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { HistologySample, CellNode, SlideAnnotation } from '../types';
import { Layers, ShieldCheck, HelpCircle, Eye, EyeOff, Sliders, Cpu, Split, Info, MapPin, Plus, Trash2, Crosshair, Target, X, Sparkles, Maximize2, Activity } from 'lucide-react';

interface SlideViewerProps {
  sample: HistologySample;
  segmentationActive: boolean;
  setSegmentationActive: (active: boolean) => void;
  xaiMode: 'none' | 'grad-cam' | 'shap' | 'integrated';
  setXaiMode: (mode: 'none' | 'grad-cam' | 'shap' | 'integrated') => void;
  colorNorm: 'raw' | 'macenko' | 'reinhard' | 'ruifrok';
  setColorNorm: (norm: 'raw' | 'macenko' | 'reinhard' | 'ruifrok') => void;
  segmentationOpacity: number;
  setSegmentationOpacity: (op: number) => void;
  annotations: SlideAnnotation[];
  onAddAnnotation: (anno: Omit<SlideAnnotation, 'id' | 'timestamp'>) => void;
  onDeleteAnnotation: (id: string) => void;
}

// PHYSICAL STAIN COLOR MAPPINGS BASED ON NORMALIZATION & PRESETS
const getSimulatedColors = (norm: 'raw' | 'macenko' | 'reinhard' | 'ruifrok', preset: 'he' | 'giemsa' | 'trichrome' | 'pas') => {
  if (preset === 'he') {
    return {
      raw: {
        nuclei: '#4A2E80',
        atypicalNuclei: '#661166',
        stroma: '#EAB8CE',
        gland: '#FFF0F5',
        glandOutline: '#D47FA6',
        collagenBand: 'rgba(212, 127, 166, 0.16)',
        collagenFibril: 'rgba(212, 127, 166, 0.25)',
        fibroblastCytoplasm: 'rgba(220, 158, 184, 0.25)',
        fibroblastBorder: 'rgba(212, 127, 166, 0.35)',
        atypicalHalo: 'rgba(111, 30, 81, 0.12)',
        benignHalo: 'rgba(74, 46, 128, 0.08)',
        mitochondria: 'rgba(219, 39, 119, 0.5)'
      },
      macenko: {
        nuclei: '#1C063C',
        atypicalNuclei: '#5F055F',
        stroma: '#FCDEF0',
        gland: '#FFF8FC',
        glandOutline: '#E39FCE',
        collagenBand: 'rgba(227, 159, 206, 0.16)',
        collagenFibril: 'rgba(227, 159, 206, 0.25)',
        fibroblastCytoplasm: 'rgba(235, 179, 215, 0.25)',
        fibroblastBorder: 'rgba(227, 159, 206, 0.35)',
        atypicalHalo: 'rgba(95, 5, 95, 0.12)',
        benignHalo: 'rgba(28, 6, 60, 0.08)',
        mitochondria: 'rgba(219, 39, 119, 0.5)'
      },
      reinhard: {
        nuclei: '#273C75',
        atypicalNuclei: '#6F1E51',
        stroma: '#DF88A7',
        gland: '#FFF2F4',
        glandOutline: '#BA4373',
        collagenBand: 'rgba(186, 67, 115, 0.16)',
        collagenFibril: 'rgba(186, 67, 115, 0.25)',
        fibroblastCytoplasm: 'rgba(214, 114, 149, 0.25)',
        fibroblastBorder: 'rgba(186, 67, 115, 0.35)',
        atypicalHalo: 'rgba(111, 30, 81, 0.12)',
        benignHalo: 'rgba(74, 46, 128, 0.08)',
        mitochondria: 'rgba(186, 67, 115, 0.6)'
      },
      ruifrok: {
        nuclei: '#0F1A3E',
        atypicalNuclei: '#5A1E5C',
        stroma: '#FDF0EC',
        gland: '#FFFDF9',
        glandOutline: '#E3A6B4',
        collagenBand: 'rgba(227, 166, 180, 0.14)',
        collagenFibril: 'rgba(227, 166, 180, 0.28)',
        fibroblastCytoplasm: 'rgba(227, 166, 180, 0.22)',
        fibroblastBorder: 'rgba(15, 26, 62, 0.25)',
        atypicalHalo: 'rgba(111, 30, 81, 0.12)',
        benignHalo: 'rgba(74, 46, 128, 0.08)',
        mitochondria: 'rgba(219, 39, 119, 0.5)'
      }
    }[norm];
  }

  if (preset === 'giemsa') {
    return {
      raw: {
        nuclei: '#1C3144',
        atypicalNuclei: '#41225B',
        stroma: '#D0E1FD',
        gland: '#EBF2FA',
        glandOutline: '#6E9075',
        collagenBand: 'rgba(110, 144, 117, 0.14)',
        collagenFibril: 'rgba(110, 144, 117, 0.24)',
        fibroblastCytoplasm: 'rgba(165, 190, 230, 0.25)',
        fibroblastBorder: 'rgba(110, 144, 117, 0.3)',
        atypicalHalo: 'rgba(65, 34, 91, 0.12)',
        benignHalo: 'rgba(28, 49, 68, 0.08)',
        mitochondria: 'rgba(110, 144, 117, 0.5)'
      },
      macenko: {
        nuclei: '#071625',
        atypicalNuclei: '#250E3E',
        stroma: '#A3CEF1',
        gland: '#F1F6F9',
        glandOutline: '#274C77',
        collagenBand: 'rgba(27, 76, 119, 0.16)',
        collagenFibril: 'rgba(27, 76, 119, 0.28)',
        fibroblastCytoplasm: 'rgba(139, 168, 203, 0.25)',
        fibroblastBorder: 'rgba(27, 76, 119, 0.35)',
        atypicalHalo: 'rgba(37, 14, 62, 0.14)',
        benignHalo: 'rgba(7, 22, 37, 0.1)',
        mitochondria: 'rgba(27, 76, 119, 0.6)'
      },
      reinhard: {
        nuclei: '#1D2D44',
        atypicalNuclei: '#491D3E',
        stroma: '#E1E8EB',
        gland: '#F4F7F6',
        glandOutline: '#6B8096',
        collagenBand: 'rgba(107, 128, 150, 0.16)',
        collagenFibril: 'rgba(107, 128, 150, 0.25)',
        fibroblastCytoplasm: 'rgba(149, 165, 180, 0.25)',
        fibroblastBorder: 'rgba(107, 128, 150, 0.35)',
        atypicalHalo: 'rgba(73, 29, 62, 0.12)',
        benignHalo: 'rgba(29, 45, 68, 0.08)',
        mitochondria: 'rgba(107, 128, 150, 0.55)'
      },
      ruifrok: {
        nuclei: '#0A1128',
        atypicalNuclei: '#2F1E4B',
        stroma: '#D9DCD6',
        gland: '#EBF2FA',
        glandOutline: '#5A6978',
        collagenBand: 'rgba(90, 105, 120, 0.14)',
        collagenFibril: 'rgba(90, 105, 120, 0.28)',
        fibroblastCytoplasm: 'rgba(128, 140, 155, 0.22)',
        fibroblastBorder: 'rgba(10, 17, 40, 0.25)',
        atypicalHalo: 'rgba(47, 30, 75, 0.12)',
        benignHalo: 'rgba(10, 17, 40, 0.08)',
        mitochondria: 'rgba(90, 105, 120, 0.5)'
      }
    }[norm];
  }

  if (preset === 'trichrome') {
    return {
      raw: {
        nuclei: '#1C1917',
        atypicalNuclei: '#3F1212',
        stroma: '#D2F1F2',
        gland: '#FFECEC',
        glandOutline: '#DE2828',
        collagenBand: 'rgba(43, 128, 181, 0.16)',
        collagenFibril: 'rgba(43, 128, 181, 0.26)',
        fibroblastCytoplasm: 'rgba(255, 180, 180, 0.25)',
        fibroblastBorder: 'rgba(222, 40, 40, 0.35)',
        atypicalHalo: 'rgba(63, 18, 18, 0.12)',
        benignHalo: 'rgba(28, 25, 23, 0.08)',
        mitochondria: 'rgba(222, 40, 40, 0.6)'
      },
      macenko: {
        nuclei: '#090503',
        atypicalNuclei: '#2D0404',
        stroma: '#90E0EF',
        gland: '#FFE3E3',
        glandOutline: '#FF003C',
        collagenBand: 'rgba(33, 158, 188, 0.18)',
        collagenFibril: 'rgba(33, 158, 188, 0.28)',
        fibroblastCytoplasm: 'rgba(255, 150, 150, 0.25)',
        fibroblastBorder: 'rgba(255, 0, 60, 0.4)',
        atypicalHalo: 'rgba(45, 4, 4, 0.14)',
        benignHalo: 'rgba(9, 5, 3, 0.1)',
        mitochondria: 'rgba(255, 0, 60, 0.65)'
      },
      reinhard: {
        nuclei: '#22252A',
        atypicalNuclei: '#401A24',
        stroma: '#DCEFF2',
        gland: '#FFEBEE',
        glandOutline: '#D32F2F',
        collagenBand: 'rgba(69, 123, 157, 0.16)',
        collagenFibril: 'rgba(69, 123, 157, 0.25)',
        fibroblastCytoplasm: 'rgba(229, 115, 115, 0.25)',
        fibroblastBorder: 'rgba(211, 47, 47, 0.35)',
        atypicalHalo: 'rgba(64, 26, 36, 0.12)',
        benignHalo: 'rgba(34, 37, 42, 0.08)',
        mitochondria: 'rgba(211, 47, 47, 0.55)'
      },
      ruifrok: {
        nuclei: '#121212',
        atypicalNuclei: '#380404',
        stroma: '#CAF0F8',
        gland: '#FFF0F3',
        glandOutline: '#FF3366',
        collagenBand: 'rgba(72, 149, 239, 0.16)',
        collagenFibril: 'rgba(72, 149, 239, 0.28)',
        fibroblastCytoplasm: 'rgba(255, 180, 200, 0.22)',
        fibroblastBorder: 'rgba(18, 18, 18, 0.25)',
        atypicalHalo: 'rgba(56, 4, 4, 0.12)',
        benignHalo: 'rgba(18, 18, 18, 0.08)',
        mitochondria: 'rgba(255, 51, 102, 0.5)'
      }
    }[norm];
  }

  if (preset === 'pas') {
    return {
      raw: {
        nuclei: '#2E5077',
        atypicalNuclei: '#1E3554',
        stroma: '#FFF0F5',
        gland: '#FFF5F8',
        glandOutline: '#E0115F',
        collagenBand: 'rgba(224, 17, 95, 0.14)',
        collagenFibril: 'rgba(224, 17, 95, 0.24)',
        fibroblastCytoplasm: 'rgba(247, 190, 215, 0.25)',
        fibroblastBorder: 'rgba(224, 17, 95, 0.35)',
        atypicalHalo: 'rgba(30, 53, 84, 0.1)',
        benignHalo: 'rgba(46, 80, 119, 0.08)',
        mitochondria: 'rgba(224, 17, 95, 0.5)'
      },
      macenko: {
        nuclei: '#162C46',
        atypicalNuclei: '#0C1A2B',
        stroma: '#FFF3FC',
        gland: '#FFF8FD',
        glandOutline: '#FF007F',
        collagenBand: 'rgba(255, 0, 127, 0.16)',
        collagenFibril: 'rgba(255, 0, 127, 0.28)',
        fibroblastCytoplasm: 'rgba(244, 143, 177, 0.25)',
        fibroblastBorder: 'rgba(255, 0, 127, 0.38)',
        atypicalHalo: 'rgba(12, 26, 43, 0.12)',
        benignHalo: 'rgba(22, 44, 70, 0.08)',
        mitochondria: 'rgba(255, 0, 127, 0.6)'
      },
      reinhard: {
        nuclei: '#284E6E',
        atypicalNuclei: '#172E45',
        stroma: '#FDF4F8',
        gland: '#FFF0F6',
        glandOutline: '#D81B60',
        collagenBand: 'rgba(216, 27, 96, 0.16)',
        collagenFibril: 'rgba(216, 27, 96, 0.25)',
        fibroblastCytoplasm: 'rgba(240, 98, 146, 0.25)',
        fibroblastBorder: 'rgba(216, 27, 96, 0.35)',
        atypicalHalo: 'rgba(23, 46, 69, 0.12)',
        benignHalo: 'rgba(40, 78, 110, 0.08)',
        mitochondria: 'rgba(216, 27, 96, 0.55)'
      },
      ruifrok: {
        nuclei: '#3A6B9B',
        atypicalNuclei: '#264B70',
        stroma: '#FAEDF0',
        gland: '#FFF3F5',
        glandOutline: '#C2185B',
        collagenBand: 'rgba(194, 24, 91, 0.14)',
        collagenFibril: 'rgba(194, 24, 91, 0.28)',
        fibroblastCytoplasm: 'rgba(233, 30, 99, 0.22)',
        fibroblastBorder: 'rgba(58, 107, 155, 0.25)',
        atypicalHalo: 'rgba(38, 75, 112, 0.12)',
        benignHalo: 'rgba(58, 107, 155, 0.08)',
        mitochondria: 'rgba(194, 24, 91, 0.5)'
      }
    }[norm];
  }

  // Fallback H&E
  return {
    nuclei: '#4A2E80',
    atypicalNuclei: '#661166',
    stroma: '#EAB8CE',
    gland: '#FFF0F5',
    glandOutline: '#D47FA6',
    collagenBand: 'rgba(212, 127, 166, 0.16)',
    collagenFibril: 'rgba(212, 127, 166, 0.25)',
    fibroblastCytoplasm: 'rgba(220, 158, 184, 0.25)',
    fibroblastBorder: 'rgba(212, 127, 166, 0.35)',
    atypicalHalo: 'rgba(111, 30, 81, 0.12)',
    benignHalo: 'rgba(74, 46, 128, 0.08)',
    mitochondria: 'rgba(219, 39, 119, 0.5)'
  };
};

export default function SlideViewer({
  sample,
  segmentationActive,
  setSegmentationActive,
  xaiMode,
  setXaiMode,
  colorNorm,
  setColorNorm,
  segmentationOpacity,
  setSegmentationOpacity,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation
}: SlideViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = useState<CellNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // PHYSICAL STAIN PRESET SIMULATION STATE
  const [stainPreset, setStainPreset] = useState<'he' | 'giemsa' | 'trichrome' | 'pas'>('he');

  // NEW FEATURES STATES: Splitscreen, Cell filters, Grid and Reticle Overlays
  const [splitMode, setSplitMode] = useState<boolean>(false);
  const [splitRatio, setSplitRatio] = useState<number>(0.5); // position from 0 to 1
  const [riskFilterThreshold, setRiskFilterThreshold] = useState<number>(0); // 0 to 100%
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(false);
  const [showReticle, setShowReticle] = useState<boolean>(true);

  // ANNOTATION STATES
  const [pinDropMode, setPinDropMode] = useState<boolean>(false);
  const [newAnnotationForm, setNewAnnotationForm] = useState<{ label: string; description: string; x: number; y: number } | null>(null);

  // AI SUPER-RESOLUTION & SUBCELLULAR UPSCALING STATES
  const [upscaleTarget, setUpscaleTarget] = useState<'20x' | '40x' | '80x' | '100x'>('20x');
  const [upscaleEngine, setUpscaleEngine] = useState<'bilinear' | 'swinir' | 'esrgan' | 'diffusion'>('swinir');
  const [chromatinDetail, setChromatinDetail] = useState<number>(60);
  const [envelopeSharpness, setEnvelopeSharpness] = useState<number>(70);
  const [noiseReduction, setNoiseReduction] = useState<number>(50);
  const [showSubcellularOverlay, setShowSubcellularOverlay] = useState<boolean>(true);
  const [isUpscalingProcessing, setIsUpscalingProcessing] = useState<boolean>(false);

  // Reset zoom, pan, stain & advanced states when sample changes
  useEffect(() => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    setRiskFilterThreshold(0);
    setUpscaleTarget('20x');
    setUpscaleEngine('swinir');
    setStainPreset('he');
  }, [sample]);

  // Dynamic Maximum Zoom Level based on Upscaling magnification target
  const maxZoomLevel = {
    '20x': 3.0,
    '40x': 6.0,
    '80x': 12.0,
    '100x': 20.0,
  }[upscaleTarget];

  const handleUpscaleChange = (target: '20x' | '40x' | '80x' | '100x') => {
    if (target === upscaleTarget) return;
    
    setIsUpscalingProcessing(true);
    setTimeout(() => {
      setIsUpscalingProcessing(false);
      setUpscaleTarget(target);
      if (target !== '20x') {
        const optZoom = target === '40x' ? 2.5 : target === '80x' ? 4.5 : 6.0;
        setZoomLevel(optZoom);
        setSplitMode(true);
        setSplitRatio(0.5);
      } else {
        setZoomLevel(1.0);
        setSplitMode(false);
      }
    }, 900);
  };

  // Color mapping configuration based on selected Normalization & Stain Preset
  const colors = getSimulatedColors(colorNorm, stainPreset);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and size canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Apply pan & zoom
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-250, -250); // Translate center of grid (500x500 index) to focal origin

    // 1. Draw Stroma Background Matrix (Tissue texture)
    ctx.fillStyle = colors.stroma;
    ctx.fillRect(0, 0, 500, 500);

    // Render smooth wavy collage bands to represent the extracellular connective tissue matrix
    ctx.strokeStyle = colors.collagenBand;
    ctx.lineWidth = 14;
    for (let i = -1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(-50, i * 95);
      ctx.bezierCurveTo(150, i * 95 - 45, 350, i * 95 + 45, 550, i * 95);
      ctx.stroke();

      // DRAW FINE COLLAGEN MICRO-FIBRILS IF AI SUPER-RESOLUTION IS ENGAGED
      if (upscaleTarget !== '20x' && showSubcellularOverlay) {
        ctx.save();
        ctx.strokeStyle = colors.collagenFibril;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        
        ctx.beginPath();
        ctx.moveTo(-50, i * 95 - 12);
        ctx.bezierCurveTo(150, i * 95 - 57, 350, i * 95 + 33, 550, i * 95 - 12);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-50, i * 95 + 12);
        ctx.bezierCurveTo(150, i * 95 - 33, 350, i * 95 + 57, 550, i * 95 + 12);
        ctx.stroke();

        ctx.restore();
      }
    }

    // Filter status function: checks if a point is on the "RAW" left side of splitscreen wipe
    const isPointInRawSide = (x: number) => {
      if (!splitMode) return false;
      return x < 500 * splitRatio;
    };

    // Filter opacity helper: dims cell if its risk weight is below the slider threshold
    const getCellOpacity = (weight: number) => {
      const riskPercent = weight * 100;
      if (riskPercent < riskFilterThreshold) {
        return 0.15; // faint ghost outline/mask
      }
      return 1.0;
    };

    // Draw spindle-shaped fibroblasts (connective stroma cells)
    sample.cells.filter(c => c.type === 'stroma').forEach(cc => {
      ctx.save();
      const op = getCellOpacity(cc.gradingWeight);
      ctx.globalAlpha = op;

      const angle = (cc.x * 0.08 + cc.y * 0.12) % (Math.PI * 2);
      
      // 1) Spindle-shaped cytoplasm (pale eosin/pink)
      ctx.save();
      ctx.translate(cc.x, cc.y);
      ctx.rotate(angle);
      ctx.scale(3.2, 0.75);
      ctx.beginPath();
      ctx.arc(0, 0, cc.r * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = colors.fibroblastCytoplasm;
      ctx.strokeStyle = colors.fibroblastBorder;
      ctx.lineWidth = 0.5;
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 2) Extremely elongated stroma fibroblast nucleus inside
      ctx.save();
      ctx.translate(cc.x, cc.y);
      ctx.rotate(angle);
      ctx.scale(2.0, 0.45);
      ctx.beginPath();
      ctx.arc(0, 0, cc.r * 1.0, 0, Math.PI * 2);
      ctx.fillStyle = colors.nuclei;
      ctx.globalAlpha = 0.75 * op;
      ctx.fill();
      ctx.restore();

      ctx.restore();
    });

    // 2. Draw Gland Lumens (White secretions areas)
    sample.cells.filter(c => c.type === 'gland').forEach(g => {
      ctx.save();
      ctx.globalAlpha = getCellOpacity(g.gradingWeight);
      
      // Give glands a soft inner gradient to convey mucous fluid depth
      const lumGrad = ctx.createRadialGradient(g.x, g.y, g.r * 0.2, g.x, g.y, g.r);
      lumGrad.addColorStop(0, '#FFFFFF');
      lumGrad.addColorStop(0.85, colors.gland);
      lumGrad.addColorStop(1, colors.glandOutline);
      
      ctx.fillStyle = lumGrad;
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = colors.glandOutline;
      
      // Draw wavy borders for atypical glands, smooth for benign
      ctx.beginPath();
      if (g.atypical) {
        for (let angle = 0; angle <= Math.PI * 2 + 0.15; angle += 0.15) {
          const rNoise = g.r + Math.sin(angle * 6) * 5.5;
          const gx = g.x + Math.cos(angle) * rNoise;
          const gy = g.y + Math.sin(angle) * rNoise;
          if (angle === 0) ctx.moveTo(gx, gy);
          else ctx.lineTo(gx, gy);
        }
      } else {
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Render microscopic mucin secretion trails inside
      ctx.fillStyle = colors.glandOutline;
      ctx.globalAlpha = 0.22 * getCellOpacity(g.gradingWeight);
      for (let i = 0; i < 6; i++) {
        const angle = i * (Math.PI / 3);
        const radiusMultiplier = 0.35 + (i % 2) * 0.15;
        const sx = g.x + Math.cos(angle) * (g.r * radiusMultiplier);
        const sy = g.y + Math.sin(angle) * (g.r * radiusMultiplier);
        ctx.beginPath();
        ctx.arc(sx, sy, 3 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw dense cuboidal epithelial nuclei lining the glandular duct circumference!
      const circumference = Math.PI * 2 * g.r;
      const liningCells = Math.max(9, Math.floor(circumference / 15));
      ctx.fillStyle = colors.nuclei;
      ctx.globalAlpha = 0.65 * getCellOpacity(g.gradingWeight);
      for (let i = 0; i < liningCells; i++) {
        const angle = (i * Math.PI * 2) / liningCells;
        const rOff = g.r + 4.5 + (g.atypical ? Math.sin(angle * 6) * 2.5 : 0);
        const ex = g.x + Math.cos(angle) * rOff;
        const ey = g.y + Math.sin(angle) * rOff;
        ctx.beginPath();
        // Epithelial nuclear spheres
        ctx.arc(ex, ey, 3.8, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });

    // 3. Draw standard & atypical Epithelial Nuclei
    sample.cells.filter(c => c.type === 'nuclei').forEach(node => {
      ctx.save();
      const nodeOp = getCellOpacity(node.gradingWeight);
      ctx.globalAlpha = nodeOp;

      // Check if this particular node is on the upscale side of splitmode
      const isUpscaledSide = upscaleTarget !== '20x' && !isPointInRawSide(node.x);

      // 1) Pale peri-nuclear cytoplasm halo around each nucleus
      ctx.save();
      ctx.fillStyle = node.atypical ? colors.atypicalHalo : colors.benignHalo;
      ctx.beginPath();
      if (node.atypical) {
        ctx.arc(node.x, node.y, node.r * 2.8, 0, Math.PI * 2);
      } else {
        ctx.arc(node.x, node.y, node.r * 2.2, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();

      // 1b) DRAW HIGH-RESOLUTION MITOCHONDRIA AND CYTOPLASM ORGANELLES (ONLY IN SOTA SUPER-RES MODE)
      if (isUpscaledSide && showSubcellularOverlay) {
        ctx.save();
        // Render 2-3 mitochondria as tiny pinkish-orange ovals in cytoplasm
        // Using stable random positioning based on node coords
        let organelleSeed = node.x * 7 + node.y * 31;
        const count = node.atypical ? 4 : 2;
        const radius = node.atypical ? node.r * 2.0 : node.r * 1.5;
        
        for (let i = 0; i < count; i++) {
          organelleSeed = (organelleSeed * 9301 + 49297) % 233280;
          const angle = (organelleSeed / 233280) * Math.PI * 2;
          organelleSeed = (organelleSeed * 9301 + 49297) % 233280;
          const dist = node.r * 1.2 + (organelleSeed / 233280) * (radius - node.r * 1.1);
          
          const ox = node.x + Math.cos(angle) * dist;
          const oy = node.y + Math.sin(angle) * dist;
          
          ctx.save();
          ctx.translate(ox, oy);
          ctx.rotate(angle + Math.PI / 4);
          ctx.scale(1.8, 0.9);
          ctx.beginPath();
          ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = colors.mitochondria;
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.lineWidth = 0.3;
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // 2) The actual dense Nucleus
      ctx.fillStyle = node.atypical ? colors.atypicalNuclei : colors.nuclei;
      ctx.beginPath();
      if (node.atypical) {
        // Jagged, hyperchromatic pleomorphic nucleus
        for (let a = 0; a < Math.PI * 2; a += 0.35) {
          const wobble = 1.0 + 0.16 * Math.sin(a * 5); // higher wobble frequency
          const nx = node.x + Math.cos(a) * node.r * wobble * 1.35; // elongated cancer cell marker
          const ny = node.y + Math.sin(a) * node.r * wobble * 0.95;
          if (a === 0) ctx.moveTo(nx, ny);
          else ctx.lineTo(nx, ny);
        }
        ctx.closePath();
        ctx.fill();

        // Thickened hyperchromatic nuclear membrane outline
        ctx.strokeStyle = '#1D031D';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Coarse chromatin granules stippled inside (malignant phenotype marker)
        ctx.fillStyle = 'rgba(20, 0, 20, 0.65)';
        const chromatinGranuleCount = isUpscaledSide ? Math.floor(4 + (chromatinDetail / 20)) : 4;
        const granuleRadius = isUpscaledSide ? 1.0 + (chromatinDetail / 100) : 1.2;
        
        for (let i = 0; i < chromatinGranuleCount; i++) {
          const cx = node.x + (Math.sin(i * 3) * node.r * 0.45);
          const cy = node.y + (Math.cos(i * 2.3) * node.r * 0.45);
          ctx.beginPath();
          ctx.arc(cx, cy, granuleRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Prominent enlarged nucleoli (active ribosomal RNA synthesis in carcinoma lines)
        ctx.fillStyle = isUpscaledSide ? `rgba(239, 68, 68, ${0.4 + (chromatinDetail / 150)})` : '#EF4444'; // vivid pathological indicator marker
        ctx.beginPath();
        ctx.arc(node.x - node.r * 0.2, node.y - node.r * 0.15, 1.7, 0, Math.PI * 2);
        ctx.arc(node.x + node.r * 0.25, node.y + node.r * 0.2, 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Extra nuclear envelope sharpness overlay in super resolution
        if (isUpscaledSide) {
          ctx.save();
          ctx.strokeStyle = '#1D031D';
          ctx.lineWidth = 0.5 + (envelopeSharpness / 50);
          ctx.stroke();
          ctx.restore();
        }

      } else {
        // Safe, benign smooth circular spherical nucleus
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();

        // Double nuclear envelope layer
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = isUpscaledSide ? 0.4 + (envelopeSharpness / 100) : 1.0;
        ctx.stroke();

        // Delicate central nucleolus (benign expression)
        ctx.fillStyle = isUpscaledSide ? `rgba(0, 0, 0, ${0.3 + (chromatinDetail / 200)})` : 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(node.x + node.r * 0.1, node.y - node.r * 0.1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Fine granular chromatin background inside standard cell
        if (isUpscaledSide && showSubcellularOverlay) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          const count = Math.floor(3 + (chromatinDetail / 25));
          for (let i = 0; i < count; i++) {
            const cx = node.x + (Math.sin(i * 1.7) * node.r * 0.5);
            const cy = node.y + (Math.cos(i * 2.1) * node.r * 0.5);
            ctx.beginPath();
            ctx.arc(cx, cy, 0.7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      
      ctx.restore();
    });

    // 4. SwinUNETR Segmentation Overlay (Skipped on RAW side of split mode)
    if (segmentationActive) {
      // 1) Render a Proximity Graph Topology representation (GNN classification)
      ctx.save();
      ctx.strokeStyle = `rgba(13, 148, 136, ${0.45 * segmentationOpacity})`;
      ctx.lineWidth = 0.85;
      ctx.setLineDash([2, 3]);

      const activeTargets = sample.cells.filter(c => {
        if (isPointInRawSide(c.x)) return false;
        const opacity = getCellOpacity(c.gradingWeight);
        if (opacity < 1.0) return false;
        return c.atypical || c.gradingWeight > 0.35;
      });

      for (let i = 0; i < activeTargets.length; i++) {
        for (let j = i + 1; j < activeTargets.length; j++) {
          const c1 = activeTargets[i];
          const c2 = activeTargets[j];
          const dist = Math.hypot(c1.x - c2.x, c1.y - c2.y);
          if (dist < 75) { // connected nearby suspicious cells
            ctx.beginPath();
            ctx.moveTo(c1.x, c1.y);
            ctx.lineTo(c2.x, c2.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // 2) Render the actual deep-learning segmented masks
      sample.cells.forEach(c => {
        if (isPointInRawSide(c.x)) return;
        const opacity = getCellOpacity(c.gradingWeight);
        if (opacity < 1.0) return;

        if (c.atypical || c.gradingWeight > 0.4) {
          ctx.save();
          const outerRadius = c.r + 9;

          // Radial gradient for clean transparent core & glowing ring
          const segGrad = ctx.createRadialGradient(c.x, c.y, c.r * 0.6, c.x, c.y, outerRadius);
          segGrad.addColorStop(0, 'rgba(13, 148, 136, 0.0)'); // clear middle so cell structure is fully visible
          segGrad.addColorStop(0.4, `rgba(13, 148, 136, ${0.25 * segmentationOpacity})`);
          segGrad.addColorStop(0.85, `rgba(13, 148, 136, ${0.5 * segmentationOpacity})`);
          segGrad.addColorStop(1, `rgba(34, 211, 238, ${0.85 * segmentationOpacity})`);

          ctx.fillStyle = segGrad;
          ctx.strokeStyle = `rgba(34, 211, 238, ${segmentationOpacity})`;
          ctx.lineWidth = 1.6;
          ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
          ctx.shadowBlur = 4;

          ctx.beginPath();
          ctx.arc(c.x, c.y, outerRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Standard cytopathic bracket visualizers for atypical nodes
          if (c.atypical) {
            ctx.save();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
            ctx.lineWidth = 1.0;
            const size = c.r + 11;
            const offsets = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
            offsets.forEach(([sx, sy]) => {
              ctx.beginPath();
              ctx.moveTo(c.x + sx * size, c.y + sy * size);
              ctx.lineTo(c.x + sx * (size - 4), c.y + sy * size);
              ctx.moveTo(c.x + sx * size, c.y + sy * size);
              ctx.lineTo(c.x + sx * size, c.y + sy * (size - 4));
              ctx.stroke();
            });
            ctx.restore();
          }
        }
      });
    }

    // 5. XAI Overlay Models (Skipped on RAW side of split mode)
    if (xaiMode === 'grad-cam') {
      sample.cells.forEach(node => {
        if (isPointInRawSide(node.x)) return;
        const opacity = getCellOpacity(node.gradingWeight);
        if (opacity < 1.0) return;

        if (node.gradingWeight > 0.08) {
          ctx.save();
          // Adjust composite mode for elegant medical blending
          ctx.globalCompositeOperation = 'screen';
          
          const maxGradCamRadius = node.r * 11 * node.gradingWeight;
          const gradient = ctx.createRadialGradient(
            node.x, node.y, node.r * 0.4,
            node.x, node.y, maxGradCamRadius
          );

          // Authentic jet/thermal color ramp distribution: High = red, Medium = orange/yellow, Low = transparent blue halt
          const w = node.gradingWeight;
          gradient.addColorStop(0, `rgba(239, 68, 68, ${0.5 * w})`);       // crimson focus
          gradient.addColorStop(0.2, `rgba(245, 158, 11, ${0.35 * w})`);    // fiery orange
          gradient.addColorStop(0.45, `rgba(234, 179, 8, ${0.2 * w})`);     // vibrant yellow
          gradient.addColorStop(0.7, `rgba(16, 185, 129, ${0.08 * w})`);    // diffuse green transition
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');                    // transparent null

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, maxGradCamRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

    } else if (xaiMode === 'shap') {
      // Shapley Additive exPlanations overlay
      sample.cells.forEach(node => {
        if (isPointInRawSide(node.x)) return;
        const opacity = getCellOpacity(node.gradingWeight);
        if (opacity < 1.0) return;

        ctx.save();
        const valueSign = (node.atypical || node.gradingWeight > 0.4) ? 1 : -1;
        // Benign/stroma baseline elements have negative impact on malignancy score
        const shapValue = valueSign * (0.05 + 0.35 * node.gradingWeight);
        const isPositive = shapValue > 0;
        
        ctx.strokeStyle = isPositive ? 'rgba(239, 68, 68, 0.75)' : 'rgba(59, 130, 246, 0.75)';
        ctx.fillStyle = isPositive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)';
        ctx.lineWidth = 1.1;

        // Draw translucent attribution boundary
        ctx.beginPath();
        const shapRadius = node.r + 16 * Math.abs(shapValue);
        ctx.arc(node.x, node.y, shapRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw tiny +/- signs indicating push force
        ctx.fillStyle = isPositive ? '#FCA5A5' : '#93C5FD';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const signText = isPositive ? `+${shapValue.toFixed(2)}` : `${shapValue.toFixed(2)}`;
        ctx.fillText(signText, node.x, node.y - node.r - 10);

        // Draw vector force arrow radiating outwards for positive, inwards for negative
        ctx.strokeStyle = isPositive ? 'rgba(248, 113, 113, 0.4)' : 'rgba(147, 197, 253, 0.4)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        const arrowLen = 6;
        if (isPositive) {
          ctx.moveTo(node.x, node.y - node.r - 1);
          ctx.lineTo(node.x, node.y - node.r - 1 - arrowLen);
          ctx.lineTo(node.x - 2, node.y - node.r - 1 - arrowLen + 2);
          ctx.moveTo(node.x, node.y - node.r - 1 - arrowLen);
          ctx.lineTo(node.x + 2, node.y - node.r - 1 - arrowLen + 2);
        } else {
          ctx.moveTo(node.x, node.y - node.r - 1 - arrowLen);
          ctx.lineTo(node.x, node.y - node.r - 1);
          ctx.lineTo(node.x - 2, node.y - node.r - 1 - 2);
          ctx.moveTo(node.x, node.y - node.r - 1);
          ctx.lineTo(node.x + 2, node.y - node.r - 1 - 2);
        }
        ctx.stroke();
        ctx.restore();
      });

    } else if (xaiMode === 'integrated') {
      ctx.save();
      ctx.strokeStyle = '#22D3EE'; // Neon cyan target color
      ctx.lineWidth = 1.25;
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 5;

      const atypicalNodes = sample.cells.filter(n => n.atypical && getCellOpacity(n.gradingWeight) === 1.0);

      atypicalNodes.forEach(node => {
        if (isPointInRawSide(node.x)) return;

        // Double rings around target anomalies
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + 8, 0, Math.PI * 2);
        ctx.stroke();

        // Trace vector lines of influence from nearby cells
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.28)';
        ctx.lineWidth = 0.8;
        sample.cells.forEach(other => {
          if (other === node) return;
          const dist = Math.hypot(other.x - node.x, other.y - node.y);
          if (dist > 14 && dist < 65) {
            const dx = (node.x - other.x) / dist;
            const dy = (node.y - other.y) / dist;
            
            ctx.beginPath();
            ctx.moveTo(other.x + dx * 8, other.y + dy * 8);
            ctx.lineTo(node.x - dx * (node.r + 9), node.y - dy * (node.r + 9));
            ctx.stroke();

            // Tiny telemetry source anchor points
            ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
            ctx.beginPath();
            ctx.arc(other.x + dx * 8, other.y + dy * 8, 1.3, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });
      ctx.restore();
    }

    // 6. Draw vertical split separator if active
    if (splitMode) {
      // IF UPSCALE TARGET > 20x, DRAW THE RAW SIDE SENSOR PIXELATION GRID!
      if (upscaleTarget !== '20x') {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.lineWidth = 0.5;
        // Only draw on the left side (0 to 500 * splitRatio)
        const limitX = 500 * splitRatio;
        const gridSpacing = Math.max(2, 10 / (zoomLevel * 0.4)); // dynamic camera sensor grid pixels spacing
        
        ctx.beginPath();
        // vertical lines
        for (let gx = 0; gx < limitX; gx += gridSpacing) {
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, 500);
        }
        // horizontal lines
        for (let gy = 0; gy < 500; gy += gridSpacing) {
          ctx.moveTo(0, gy);
          ctx.lineTo(limitX, gy);
        }
        ctx.stroke();
        
        // Subtle raw scan-blur filter overlay
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(0, 0, limitX, 500);
        ctx.restore();
      }

      ctx.save();
      ctx.strokeStyle = '#3B82F6'; // vivid blue divider
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.moveTo(500 * splitRatio, 0);
      ctx.lineTo(500 * splitRatio, 500);
      ctx.stroke();
      ctx.restore();

      // Split Wipe Label tag overlay
      ctx.save();
      ctx.fillStyle = 'rgba(13, 17, 23, 0.9)';
      ctx.strokeStyle = '#30363D';
      ctx.lineWidth = 1;
      
      const tagWidth = 130;
      const tagX = Math.max(10, Math.min(500 - tagWidth - 10, 500 * splitRatio - tagWidth / 2));
      
      ctx.fillRect(tagX, 12, tagWidth, 22);
      ctx.strokeRect(tagX, 12, tagWidth, 22);
      
      ctx.fillStyle = '#C9D1D9';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      const leftLabel = `RAW ${sample.magnification}`;
      const rightLabel = upscaleTarget !== '20x' ? `AI ${upscaleTarget} ${upscaleEngine.toUpperCase()}` : 'AI ASSIST';
      ctx.fillText(`${leftLabel} | ${rightLabel}`, tagX + tagWidth / 2, 25);
      ctx.restore();
    }

    // 7. Draw Hover Target Overlay
    if (hoveredCell) {
      ctx.save();
      ctx.strokeStyle = '#F59E0B'; // Amber orange
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hoveredCell.x, hoveredCell.y, hoveredCell.r + 5, 0, Math.PI * 2);
      ctx.stroke();

      // Simple tooltip locator
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1;
      ctx.fillRect(hoveredCell.x + 15, hoveredCell.y - 15, 140, 50);
      ctx.strokeRect(hoveredCell.x + 15, hoveredCell.y - 15, 140, 50);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`Type: ${hoveredCell.type.toUpperCase()}`, hoveredCell.x + 22, hoveredCell.y);
      ctx.font = '9px monospace';
      ctx.fillStyle = hoveredCell.atypical ? '#F87171' : '#34D399';
      ctx.fillText(`Somatic: ${hoveredCell.atypical ? 'PLEOMORPHIC' : 'BENIGN'}`, hoveredCell.x + 22, hoveredCell.y + 12);
      ctx.fillStyle = '#9CA3AF';
      ctx.fillText(`Risk Attribution: ${(hoveredCell.gradingWeight * 100).toFixed(0)}%`, hoveredCell.x + 22, hoveredCell.y + 24);
      ctx.restore();
    }

    // 5. Draw Slide Annotation Markers
    annotations.forEach((anno, index) => {
      ctx.save();
      
      // Outer target ring
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(anno.x, anno.y, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Inner glowing core
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(anno.x, anno.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Precision crosshair lines
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(anno.x - 12, anno.y);
      ctx.lineTo(anno.x + 12, anno.y);
      ctx.moveTo(anno.x, anno.y - 12);
      ctx.lineTo(anno.x, anno.y + 12);
      ctx.stroke();

      // Label placard above
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#30363D';
      ctx.lineWidth = 1;
      
      ctx.font = 'bold 8px monospace';
      const labelText = `PIN #${index + 1}`;
      const textW = ctx.measureText(labelText).width;
      
      ctx.fillRect(anno.x - (textW/2 + 3), anno.y - 20, textW + 6, 11);
      ctx.strokeRect(anno.x - (textW/2 + 3), anno.y - 20, textW + 6, 11);
      
      ctx.fillStyle = '#FBBF24';
      ctx.fillText(labelText, anno.x - textW/2, anno.y - 11);
      
      ctx.restore();
    });

    // 5.1 Draw MONAI Patching Grid Overlay (within physical tissue space)
    if (showGridOverlay) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      
      const numGridLines = 4;
      const step = 500 / numGridLines;
      
      // Draw grid lines
      for (let i = 1; i < numGridLines; i++) {
        const offset = i * step;
        // Verticals
        ctx.beginPath();
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset, 500);
        ctx.stroke();
        
        // Horizontals
        ctx.beginPath();
        ctx.moveTo(0, offset);
        ctx.lineTo(500, offset);
        ctx.stroke();
      }
      
      // Labels for patches (e.g. A1, A2... D4)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 8px monospace';
      const cols = ['A', 'B', 'C', 'D'];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const px = c * step + 5;
          const py = r * step + 12;
          ctx.fillText(`${cols[c]}${r + 1}`, px, py);
        }
      }
      ctx.restore();
    }

    ctx.restore();

    // 6. Draw ABSOLUTE VIEWPORT HUD (Reticle and Scale Bar)
    if (showReticle) {
      ctx.save();
      
      // A) Subtle HUD borders around viewport
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, 492, 492);
      
      // B) Lens focus target reticle (Center target crosshair)
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.28)';
      ctx.lineWidth = 1;
      
      // Concentric subtle target circles
      ctx.beginPath();
      ctx.arc(250, 250, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(250, 250, 50, 0, Math.PI * 2);
      ctx.setLineDash([2, 5]);
      ctx.stroke();
      ctx.setLineDash([]); // clear
      
      // Reticle tick crosshairs
      ctx.beginPath();
      // center horizontal
      ctx.moveTo(210, 250); ctx.lineTo(235, 250);
      ctx.moveTo(265, 250); ctx.lineTo(290, 250);
      // center vertical
      ctx.moveTo(250, 210); ctx.lineTo(250, 235);
      ctx.moveTo(250, 265); ctx.lineTo(250, 290);
      ctx.stroke();
      
      // C) Dynamic clinical micrometer scale bar (Bottom Left)
      // Base real value: 1px is approx 0.4 micrometers (at 10x magnification).
      // So width of 500px sample space represents ~200μm.
      // At zoomLevel = 1.0, width of 80px represents 32μm.
      // At higher zoom levels, the micron size representing the physical bar is re-proportioned.
      const micronPixelWidth = 80; // width of the UI bar in pixels
      const actualMicronRep = Math.max(5, Math.round((32 / zoomLevel))); // dynamic micron representation
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.fillStyle = '#FFFFFF';
      ctx.lineWidth = 2.0;
      
      // Draw scale bar bracket
      ctx.beginPath();
      ctx.moveTo(30, 465);
      ctx.lineTo(30, 470);
      ctx.lineTo(30 + micronPixelWidth, 470);
      ctx.lineTo(30 + micronPixelWidth, 465);
      ctx.stroke();
      
      // Caption of size
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${actualMicronRep} µm`, 34, 462);
      
      // D) Coordinate orientation needle (Compass)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(465, 465);
      ctx.lineTo(465, 445); // N needle
      ctx.lineTo(462, 449);
      ctx.moveTo(465, 445);
      ctx.lineTo(468, 449);
      ctx.stroke();
      
      ctx.font = '7px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('N', 463, 440);
      
      ctx.restore();
    }
  }, [sample, colorNorm, stainPreset, segmentationActive, segmentationOpacity, xaiMode, hoveredCell, zoomLevel, pan, splitMode, splitRatio, riskFilterThreshold, annotations, showGridOverlay, showReticle, upscaleTarget, upscaleEngine, chromatinDetail, envelopeSharpness, noiseReduction, showSubcellularOverlay, isUpscalingProcessing]);

  // Handle canvas mouse move to locate nodes
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / (rect.width || 1));
    const mouseY = (e.clientY - rect.top) * (canvas.height / (rect.height || 1));

    // Convert mouse coordinates back through the reverse transform of focal zoom/pan
    const cellX = (mouseX - canvas.width / 2 - pan.x) / zoomLevel + 250;
    const cellY = (mouseY - canvas.height / 2 - pan.y) / zoomLevel + 250;

    let found: CellNode | null = null;
    for (const cell of sample.cells) {
      const dist = Math.hypot(cell.x - cellX, cell.y - cellY);
      if (dist < cell.r + 5) {
        found = cell;
        break;
      }
    }
    setHoveredCell(found);

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (pinDropMode) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (canvas.width / (rect.width || 1));
      const mouseY = (e.clientY - rect.top) * (canvas.height / (rect.height || 1));

      const cellX = Math.round((mouseX - canvas.width / 2 - pan.x) / zoomLevel + 250);
      const cellY = Math.round((mouseY - canvas.height / 2 - pan.y) / zoomLevel + 250);

      setNewAnnotationForm({
        label: 'Atypical mitoses',
        description: `Suspicious nuclear crowding at [x: ${cellX}, y: ${cellY}]`,
        x: cellX,
        y: cellY
      });
      setPinDropMode(false);
      return;
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Quantitative cell analytics variables
  const totalNodes = sample.cells.length;
  const atypicalCount = sample.cells.filter(c => c.type === 'nuclei' && c.atypical).length;
  const standardCount = sample.cells.filter(c => c.type === 'nuclei' && !c.atypical).length;
  const stromaCount = sample.cells.filter(c => c.type === 'stroma').length;
  const glandCount = sample.cells.filter(c => c.type === 'gland').length;

  const tumorRatio = totalNodes > 0 ? (atypicalCount / (atypicalCount + standardCount || 1) * 100) : 0;

  return (
    <div className="bg-[#0D1117] rounded-xl border border-[#1F2937] p-5 flex flex-col md:grid md:grid-cols-3 gap-5" id="diagnostic-slide-panel">
      
      {/* 1. Left side controls & specs */}
      <div className="flex flex-col space-y-4 justify-between">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 bg-blue-950/40 border border-blue-800/40 rounded-full px-2.5 py-0.5 w-max text-[10px] font-bold uppercase tracking-wider mb-2.5">
            <Cpu className="w-3 h-3" />
            <span>Digital Histology Core</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight leading-tight mb-1">WSI Patch Visualizer</h3>
          <p className="text-xs text-[#8B949E] mb-3 font-normal leading-relaxed">
            Biopsy microstructure scan with staining normalization, real-time segmentation, and feature heatmaps.
          </p>
 
          {/* Static Specimen Context */}
          <div className="border border-[#30363D] rounded-lg p-3 bg-[#11161D] space-y-2 mb-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8B949E] font-medium">Specimen:</span>
              <span className="text-blue-400 font-bold font-mono text-[10px] px-1.5 py-0.5 bg-[#010409] border border-[#1F2937] rounded">{sample.id}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8B949E] font-medium">Tissue Specimen:</span>
              <span className="text-[#C9D1D9] font-medium">{sample.tissueType}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8B949E] font-medium">Optics Scale:</span>
              <span className="text-amber-400 font-mono font-bold text-[10px]">{sample.magnification} Objective</span>
            </div>
          </div>

          {/* REAL-TIME QUANTITATIVE CELL PHENOTYPE INSIGHTS */}
          <div className="border border-[#30363D] rounded-lg p-3 bg-[#11161D] space-y-2">
            <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider font-mono block">Quantitative Cell Phenotyping</span>
            
            <div className="grid grid-cols-2 gap-2 text-[11px] text-white">
              <div className="bg-[#0D1117] p-1.5 rounded border border-[#1F2937]/60">
                <span className="block text-[8px] text-[#8B949E] uppercase leading-none">Mitotic Nuclei</span>
                <span className="text-xs font-mono font-bold text-rose-400">{atypicalCount} <span className="text-[9px] text-[#8B949E]">({tumorRatio.toFixed(0)}%)</span></span>
              </div>
              <div className="bg-[#0D1117] p-1.5 rounded border border-[#1F2937]/60">
                <span className="block text-[8px] text-[#8B949E] uppercase leading-none">Normal Cells</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{standardCount}</span>
              </div>
            </div>

            {/* Micro horizontal stacked bar chart */}
            <div className="space-y-1 mt-1">
              <div className="flex justify-between text-[8px] text-[#8B949E] uppercase font-bold">
                <span>Stroma Density</span>
                <span>{((stromaCount / totalNodes) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-[#010409] h-2 rounded-sm overflow-hidden flex">
                <div className="bg-rose-500" style={{ width: `${(atypicalCount / totalNodes) * 100}%` }} title="Neoplastic Epithlium" />
                <div className="bg-emerald-500" style={{ width: `${(standardCount / totalNodes) * 100}%` }} title="Healthy Epithelium" />
                <div className="bg-pink-400" style={{ width: `${(stromaCount / totalNodes) * 100}%` }} title="Stroma Matrix" />
                <div className="bg-blue-300" style={{ width: `${(glandCount / totalNodes) * 100}%` }} title="Glandular Secretions" />
              </div>
              <div className="flex justify-between text-[7px] text-[#8B949E] font-mono leading-none">
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full block"></span> TU</span>
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full block"></span> NL</span>
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-pink-400 rounded-full block"></span> ST</span>
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 bg-blue-300 rounded-full block"></span> GL</span>
              </div>
            </div>
          </div>
        </div>
 
        {/* Action Controls Column */}
        <div className="space-y-3">
          {/* Normalization Selector */}
          <div>
            <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-blue-500" />
              Color Normalization
            </label>
            <div className="grid grid-cols-4 gap-1 bg-[#010409] border border-[#1F2937] p-1 rounded">
              {(['raw', 'macenko', 'reinhard', 'ruifrok'] as const).map((mode) => (
                <button
                  key={mode}
                  id={`btn_norm_${mode}`}
                  onClick={() => setColorNorm(mode)}
                  className={`py-1 text-[9px] font-semibold rounded capitalize transition-all duration-150 ${
                    colorNorm === mode
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-[#8B949E] hover:text-white hover:bg-[#161B22]'
                  }`}
                >
                  {mode === 'ruifrok' ? 'Stain Sep' : mode}
                </button>
              ))}
            </div>
          </div>

          {/* PHYSICAL STAIN SIMULATION PRESETS */}
          <div>
            <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-1 flex items-center gap-1.5" title="Simulate physical slide preparation stains">
              <Layers className="w-3 h-3 text-blue-500" />
              Physical Stain Presets
            </label>
            <div className="grid grid-cols-4 gap-1 bg-[#010409] border border-[#1F2937] p-1 rounded">
              {[
                { id: 'he', label: 'H&E', tooltip: 'Hematoxylin & Eosin: Standard diagnostic tissue stain' },
                { id: 'giemsa', label: 'Giemsa', tooltip: 'Giemsa Stain: High nuclear and pathogen resolution' },
                { id: 'trichrome', label: 'Masson', tooltip: "Masson's Trichrome: Distinct blue collagen connective tissue" },
                { id: 'pas', label: 'PAS', tooltip: 'Periodic Acid-Schiff: Vibrant fuchsia mucins & membranes' }
              ].map((preset) => (
                <button
                  key={preset.id}
                  id={`btn_stain_preset_${preset.id}`}
                  onClick={() => setStainPreset(preset.id as any)}
                  className={`py-1 text-[9px] font-semibold rounded capitalize transition-all duration-150 cursor-pointer ${
                    stainPreset === preset.id
                      ? 'bg-blue-600 text-white shadow-sm font-bold border border-blue-500/50'
                      : 'text-[#8B949E] hover:text-white hover:bg-[#161B22] border border-transparent'
                  }`}
                  title={preset.tooltip}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* ADVANCED RISK FILTERING SLIDER */}
          <div className="bg-[#11161D] border border-[#30363D] rounded-lg p-2.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#C9D1D9] uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                Aggression Risk Isolation
              </span>
              <span className="font-mono text-blue-400 font-bold bg-[#010409] px-1 py-0.5 rounded border border-[#1F2937]">{riskFilterThreshold}% Thr</span>
            </div>
            <p className="text-[9px] text-[#8B949E] leading-normal mb-1.5">
              Filters healthy stroma cells and highlights highly active cell atypia structures.
            </p>
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              value={riskFilterThreshold}
              onChange={(e) => setRiskFilterThreshold(parseInt(e.target.value))}
              className="w-full h-1 bg-[#010409] rounded appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* SOTA AI SUPER-RESOLUTION & SUBCELLULAR UPSCALER */}
          <div className="border border-[#30363D] rounded-lg p-2.5 bg-[#11161D] flex flex-col space-y-2.5 relative overflow-hidden" id="sota-upscaler-panel">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                AI Super-Resolution (SOTA)
              </span>
              <span className="text-[8px] font-mono bg-blue-950/40 text-blue-300 border border-blue-900/40 px-1 py-0.2 rounded font-black">
                WSI-UP v3.2
              </span>
            </div>

            {/* Magnification Level Selectors */}
            <div className="space-y-1.5">
              <span className="block text-[8px] text-[#8B949E] uppercase tracking-wider font-bold">Magnification Level Target:</span>
              <div className="grid grid-cols-4 gap-1">
                {(['20x', '40x', '80x', '100x'] as const).map((mag) => (
                  <button
                    key={mag}
                    type="button"
                    onClick={() => handleUpscaleChange(mag)}
                    className={`py-1 text-[9px] font-bold rounded border transition-all flex flex-col items-center justify-center cursor-pointer ${
                      upscaleTarget === mag
                        ? 'bg-blue-600 text-white border-blue-500 shadow'
                        : 'bg-[#010409] text-[#8B949E] border-[#1F2937] hover:border-blue-900 hover:text-white'
                    }`}
                  >
                    <span>{mag}</span>
                    <span className="text-[6px] font-mono font-normal opacity-75">
                      {mag === '20x' ? 'Base' : mag === '40x' ? 'SwinIR' : mag === '80x' ? 'ESRGAN' : 'Oil Imm.'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Deep Learning Progress Bar */}
            {isUpscalingProcessing && (
              <div className="absolute inset-0 bg-[#0D1117]/95 flex flex-col items-center justify-center p-3 z-20 space-y-2">
                <Activity className="w-5 h-5 text-blue-400 animate-spin" />
                <div className="w-full max-w-[120px] bg-[#010409] h-1.5 rounded-full overflow-hidden border border-[#1F2937]">
                  <div className="bg-blue-500 h-full animate-pulse rounded-full" style={{ width: '80%' }} />
                </div>
                <span className="text-[8px] font-mono text-blue-400 font-bold uppercase animate-pulse">
                  {upscaleTarget === '20x' ? 'SwinIR-Pathology v3' : upscaleTarget === '40x' ? 'ESRGAN-Generative Edge' : 'Latent Diffusion Denoising'}...
                </span>
              </div>
            )}

            {/* Model and Parameter Adjusters (only shown when magnification is enhanced) */}
            {upscaleTarget !== '20x' && (
              <div className="space-y-2 pt-1 border-t border-[#1F2937] text-[9px] animate-fade-in">
                {/* AI Algorithm selector */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[#8B949E] uppercase font-bold">
                    <span>Upscaling Engine:</span>
                    <span className="font-mono text-[8px] text-blue-400">{upscaleEngine.toUpperCase()}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-0.5 bg-[#010409] border border-[#1F2937] p-0.5 rounded">
                    {(['bilinear', 'swinir', 'esrgan', 'diffusion'] as const).map((eng) => (
                      <button
                        key={eng}
                        type="button"
                        onClick={() => setUpscaleEngine(eng)}
                        className={`py-0.5 text-[7px] font-bold rounded uppercase transition-all ${
                          upscaleEngine === eng
                            ? 'bg-blue-600/95 text-white'
                            : 'text-[#8B949E] hover:text-white hover:bg-[#161B22]'
                        }`}
                      >
                        {eng === 'bilinear' ? 'Legacy' : eng === 'swinir' ? 'Swin' : eng === 'esrgan' ? 'GAN' : 'Diff'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Parameters sliders */}
                {upscaleEngine !== 'bilinear' && (
                  <div className="space-y-1.5 pt-0.5">
                    {/* Chromatin slider */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[#8B949E] uppercase font-bold">
                        <span>Chromatin Detail:</span>
                        <span className="font-mono text-blue-400 font-bold">{chromatinDetail}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="10"
                        value={chromatinDetail}
                        onChange={(e) => setChromatinDetail(parseInt(e.target.value))}
                        className="w-full h-1 bg-[#010409] rounded appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    {/* Nuclear membrane slider */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[#8B949E] uppercase font-bold">
                        <span>Membrane Sharpness:</span>
                        <span className="font-mono text-blue-400 font-bold">{envelopeSharpness}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="10"
                        value={envelopeSharpness}
                        onChange={(e) => setEnvelopeSharpness(parseInt(e.target.value))}
                        className="w-full h-1 bg-[#010409] rounded appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    {/* Noise slider */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[#8B949E] uppercase font-bold">
                        <span>Denoise & Smooth:</span>
                        <span className="font-mono text-blue-400 font-bold">{noiseReduction}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="10"
                        value={noiseReduction}
                        onChange={(e) => setNoiseReduction(parseInt(e.target.value))}
                        className="w-full h-1 bg-[#010409] rounded appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>

                    {/* Subcellular elements toggle */}
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-[#8B949E] uppercase font-bold flex items-center gap-1">
                        <Activity className="w-3 h-3 text-pink-400" />
                        Subcellular Organelles
                      </span>
                      <input
                        type="checkbox"
                        checked={showSubcellularOverlay}
                        onChange={(e) => setShowSubcellularOverlay(e.target.checked)}
                        className="rounded bg-[#010409] border-[#30363D] text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SwinUNETR Segmentation Switch */}
          <div className="border border-[#30363D] rounded-lg p-2.5 bg-[#11161D] flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#C9D1D9] flex items-center gap-1.5 uppercase tracking-wide">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                SwinUNETR Segmentation
              </span>
              <button
                id="toggle-segmentation"
                onClick={() => setSegmentationActive(!segmentationActive)}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                  segmentationActive
                    ? 'bg-teal-950/40 text-teal-400 border-teal-850'
                    : 'bg-[#010409] text-[#8B949E] border-transparent'
                }`}
              >
                {segmentationActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>{segmentationActive ? "ON" : "OFF"}</span>
              </button>
            </div>
            {segmentationActive && (
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-[#8B949E]">
                  <span>Segmentation Mask Opacity:</span>
                  <span>{Math.round(segmentationOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={segmentationOpacity}
                  onChange={(e) => setSegmentationOpacity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#010409] rounded appearance-none cursor-pointer accent-teal-400"
                />
              </div>
            )}
          </div>

          {/* MICROSCOPY HUD OVERLAYS */}
          <div className="border border-[#30363D] rounded-lg p-2.5 bg-[#11161D] flex flex-col space-y-2">
            <span className="text-[10px] font-bold text-[#C9D1D9] flex items-center gap-1.5 uppercase tracking-wide font-sans">
              <Crosshair className="w-3.5 h-3.5 text-sky-400" />
              Microscopy Overlays
            </span>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                id="toggle-patch-grid"
                onClick={() => setShowGridOverlay(!showGridOverlay)}
                className={`py-1.5 px-2 rounded text-[9px] font-bold border flex flex-col items-center justify-center gap-0.5 transition-all text-center cursor-pointer min-h-[2.5rem] font-sans ${
                  showGridOverlay
                    ? 'bg-sky-950/40 text-sky-400 border-sky-800'
                    : 'bg-[#010409] text-[#8B949E] border-[#1F2937] hover:border-sky-900 hover:text-sky-400'
                }`}
                title="Divided patching squares reflecting ViT self-attention fields (A1-D4)"
              >
                <Split className="w-3.5 h-3.5 text-sky-400" />
                <span>MONAI Patches</span>
              </button>
              <button
                type="button"
                id="toggle-lens-reticle"
                onClick={() => setShowReticle(!showReticle)}
                className={`py-1.5 px-2 rounded text-[9px] font-bold border flex flex-col items-center justify-center gap-0.5 transition-all text-center cursor-pointer min-h-[2.5rem] font-sans ${
                  showReticle
                    ? 'bg-sky-950/40 text-sky-400 border-sky-800'
                    : 'bg-[#010409] text-[#8B949E] border-[#1F2937] hover:border-sky-900 hover:text-sky-400'
                }`}
                title="Medical micrometer spatial scale (µm) and eyepiece crosshair target"
              >
                <Target className="w-3.5 h-3.5 text-sky-400" />
                <span>Lens Reticle HUD</span>
              </button>
            </div>
          </div>

          {/* DIGITAL CELLULAR REFERENCE PINS */}
          <div className="border border-[#30363D] rounded-lg p-2.5 bg-[#11161D] flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#C9D1D9] flex items-center gap-1.5 uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                Tissue Annotations ({annotations.length})
              </span>
              <button
                type="button"
                id="toggle-pin-drop-mode"
                onClick={() => setPinDropMode(!pinDropMode)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                  pinDropMode
                    ? 'bg-red-950/40 text-red-400 border-red-800 animate-pulse'
                    : 'bg-[#010409] text-blue-400 border-[#1F2937] hover:border-blue-800'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>{pinDropMode ? 'Placing Pin...' : 'Drop Pin'}</span>
              </button>
            </div>

            {annotations.length === 0 ? (
              <p className="text-[9px] text-[#8B949E] leading-relaxed italic text-center py-1.5 bg-[#010409]/40 border border-dashed border-[#1F2937] rounded">
                No coordinate reference pins dropped yet. Enable 'Drop Pin' above then click anywhere on the slide.
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                {annotations.map((anno, idx) => (
                  <div 
                    key={anno.id} 
                    className="p-1 px-2 rounded bg-[#010409] border border-[#1F2937] flex items-center justify-between gap-1.5 hover:border-[#30363D] transition-all group/pin"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-white leading-tight">
                        <span className="text-red-500 text-[8px] font-mono tracking-tighter bg-red-950/20 px-1 py-0.2 rounded border border-red-900/30">PIN #{idx + 1}</span>
                        <span className="truncate">{anno.label}</span>
                      </div>
                      <span className="text-[8px] text-[#8B949E] font-mono truncate leading-none mt-1">X:{anno.x} Y:{anno.y} • {anno.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setZoomLevel(2.2);
                          setPan({
                            x: -(anno.x - 250) * 2.2,
                            y: -(anno.y - 250) * 2.2
                          });
                        }}
                        className="p-1 rounded bg-[#161B22] hover:bg-[#21262D] text-blue-400 hover:text-blue-300 transition cursor-pointer"
                        title="Zoom & Pan to Coordinates"
                      >
                        <Target className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAnnotation(anno.id)}
                        className="p-1 rounded bg-[#161B22] hover:bg-rose-950/40 text-red-500 hover:text-red-400 transition cursor-pointer opacity-100 sm:opacity-0 group-hover/pin:opacity-100"
                        title="Delete Pin"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
 
      {/* 2. Middle side: Interactive Canvas */}
      <div className="flex flex-col items-center justify-center bg-[#010409] rounded-xl relative overflow-hidden group border border-[#1F2937] h-[42rem] min-h-[32rem] col-span-2">
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
          title="Drag to Pan. Mouse-wheel / Slider to zoom"
        />

        {pinDropMode && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-red-950/95 backdrop-blur-md text-red-100 border border-red-900 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs flex items-center gap-2 z-30 animate-pulse shadow-xl">
            <Crosshair className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>Pin Drop Mode Active: Click any cell/structure to place coordinate reference pin</span>
            <button 
              onClick={() => setPinDropMode(false)}
              className="ml-2 hover:bg-red-900 border border-red-800 px-1.5 py-0.5 rounded text-[10px]"
            >
              Cancel
            </button>
          </div>
        )}

        {newAnnotationForm && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-4 w-full max-w-sm space-y-3 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-[#21262D]">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" /> Place Tissue Reference Pin
                </span>
                <span className="text-[10px] font-mono text-[#8B949E] bg-[#161B22] px-1.5 py-0.5 rounded">X: {newAnnotationForm.x}, Y: {newAnnotationForm.y}</span>
              </div>
              
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[9px] font-bold text-[#8B949E] uppercase tracking-wider mb-1 font-sans">Pin Label</label>
                  <input
                    type="text"
                    value={newAnnotationForm.label}
                    onChange={(e) => setNewAnnotationForm(prev => prev ? { ...prev, label: e.target.value } : null)}
                    className="w-full bg-[#010409] border border-[#30363D] focus:border-blue-500 rounded-lg p-2 text-xs text-white focus:outline-none placeholder-gray-600 font-normal font-sans"
                    placeholder="e.g., Highly mitotic nuclei group"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-[#8B949E] uppercase tracking-wider mb-1 font-sans">Diagnostic Detail / Description</label>
                  <textarea
                    value={newAnnotationForm.description}
                    onChange={(e) => setNewAnnotationForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full bg-[#010409] border border-[#30363D] focus:border-blue-500 rounded-lg p-2 text-xs text-[#C9D1D9] h-16 focus:outline-none resize-none font-normal font-sans"
                    placeholder="Describe clinical/histological features seen at this coordinate..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#21262D]">
                <button
                  type="button"
                  onClick={() => setNewAnnotationForm(null)}
                  className="px-2.5 py-1 bg-[#21262D] hover:bg-[#30363D] rounded text-xs text-[#C9D1D9] font-medium transition cursor-pointer font-sans"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddAnnotation({
                      label: newAnnotationForm.label || 'Tissue Reference Pin',
                      description: newAnnotationForm.description || '',
                      x: newAnnotationForm.x,
                      y: newAnnotationForm.y
                    });
                    setNewAnnotationForm(null);
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-semibold transition cursor-pointer font-sans"
                >
                  Add Coordinate Ref Pin
                </button>
              </div>
            </div>
          </div>
        )}
 
        {/* Diagnostics Metrics Badge */}
        {segmentationActive && (
          <div className="absolute top-3 left-3 bg-[#0D1117]/90 backdrop-blur-md border border-[#30363D] rounded-lg p-2.5 flex flex-col space-y-0.5 z-10 text-white font-mono shadow-md">
            <div className="text-[9px] uppercase font-bold text-teal-400 tracking-wider">Metrics Output</div>
            <div className="grid grid-cols-2 gap-x-2.5 text-[10px]">
              <span className="text-[#8B949E]">Dice Coeff:</span>
              <span className="text-emerald-400 font-bold">~93.2%</span>
              <span className="text-[#8B949E]">IoU Score:</span>
              <span className="text-[#C9D1D9] font-bold">~87.1%</span>
            </div>
          </div>
        )}

        {/* DOUBLE-VIEW SPLIT COMPARATOR SELECTOR TABS */}
        <div className="absolute top-3 right-3 bg-[#0D1117]/90 backdrop-blur border border-[#30363D] rounded-lg p-1.5 flex items-center space-x-1.5 z-10 shadow-md">
          <button
            id="btn_toggle_splitscreen"
            onClick={() => setSplitMode(!splitMode)}
            className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition flex items-center gap-1 ${
              splitMode ? 'bg-blue-600 text-white border border-blue-500' : 'bg-[#21262D] text-[#C9D1D9] border border-transparent hover:bg-[#30363D]'
            }`}
          >
            <Split className="w-3 h-3 text-blue-400" />
            <span>{splitMode ? 'Splitscreen On' : 'Compare Mode'}</span>
          </button>
        </div>

        {/* Splitscreen swipe control position slider (rendered on the canvas helper overlay) */}
        {splitMode && (
          <div className="absolute top-1/2 left-3 right-3 -translate-y-1/2 flex flex-col space-y-1.5 bg-[#0D1117]/90 p-2.5 rounded-lg border border-[#30363D] z-20 max-w-xs mx-auto shadow-xl">
            <div className="flex justify-between text-[9px] font-bold text-white uppercase font-mono">
              <span className="text-[#8B949E]">← Complete Raw</span>
              <span className="text-blue-400">Split Sweep ({Math.round(splitRatio * 100)}%)</span>
              <span className="text-[#8B949E]">Complete AI →</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={splitRatio}
              onChange={(e) => setSplitRatio(parseFloat(e.target.value))}
              className="w-full h-1 bg-[#010409] rounded appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        )}
 
        {/* Zoom and focal helpers */}
        <div className="absolute bottom-3 right-3 bg-[#0D1117]/90 backdrop-blur border border-[#30363D] rounded-lg p-1.5 flex items-center space-x-2.5 z-10 shadow-md">
          <button
            onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.2))}
            className="w-5 h-5 bg-[#21262D] hover:bg-[#30363D] text-white font-bold rounded transition text-xs flex items-center justify-center"
          >
            -
          </button>
          <span className="text-[10px] font-bold text-[#E0E0E0] font-mono w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.2))}
            className="w-5 h-5 bg-[#21262D] hover:bg-[#30363D] text-white font-bold rounded transition text-xs flex items-center justify-center"
          >
            +
          </button>
          <button
            onClick={() => { setZoomLevel(1); setPan({ x: 0, y: 0 }); }}
            className="px-1.5 py-0.5 bg-blue-600/80 hover:bg-blue-600 text-[#E0E0E0] text-[9px] font-bold rounded transition animate-none"
          >
            Reset
          </button>
        </div>
 
        {/* XAI Model Selector Overlay */}
        <div className="absolute bottom-3 left-3 right-16 bg-[#0D1117]/90 backdrop-blur border border-[#30363D] rounded-lg p-1.5 flex items-center justify-between z-10 shadow-lg gap-2 overflow-x-auto">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#8B949E] flex items-center gap-1 shrink-0">
            <ShieldCheck className="w-3 h-3 text-blue-400" /> Explainable AI (XAI):
          </span>
          <div className="flex space-x-1">
            {([
              { id: 'none', label: 'OFF' },
              { id: 'grad-cam', label: 'Grad-CAM' },
              { id: 'shap', label: 'SHAP Forces' },
              { id: 'integrated', label: 'Attributions' }
            ] as const).map(mode => (
              <button
                key={mode.id}
                id={`xai_btn_${mode.id}`}
                onClick={() => setXaiMode(mode.id)}
                className={`px-2 py-0.5 text-[9px] font-bold rounded transition duration-150 uppercase tracking-wide ${
                  xaiMode === mode.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#21262D] text-[#C9D1D9] hover:bg-[#30363D]'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
