/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GenomicData {
  tp53: 'Mutant' | 'Wild-type';
  brca1: 'Normal' | 'Methylated' | 'Mutant';
  egfr: 'Amplified' | 'Normal';
  pik3ca?: 'Mutant' | 'Wild-type';
}

export interface ClinicalData {
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  stage: 'Stage I' | 'Stage II' | 'Stage III' | 'Stage IV';
  smokingHistory?: 'Never' | 'Former' | 'Active';
  survivalMonthsEstimate?: number;
}

export interface CellNode {
  x: number;
  y: number;
  r: number;
  type: 'gland' | 'nuclei' | 'stroma';
  atypical: boolean;
  gradingWeight: number; // 0 to 1 intensity affecting Grad-CAM
}

export interface HistologySample {
  id: string;
  name: string;
  originDataset: 'CAMELYON16' | 'PANDA' | 'TCGA';
  description: string;
  magnification: '10x' | '20x' | '40x';
  tissueType: 'Breast Core' | 'Prostate Biopsy' | 'Lung Resection' | 'Colon Polyps';
  defaultGrade: string;
  confidence: number; // e.g. 94.2
  features: string[];
  clinical: ClinicalData;
  genomic: GenomicData;
  cells: CellNode[];
}

export interface PathologyReport {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  slideId: string;
  gradePredicted: string;
  segmentDice: number;
  segmentIoU: number;
  precision: number;
  recall: number;
  clinicalSummary: string;
  diagnosticReportText: string;
  approved: boolean;
  approvedBy?: string;
  createdAt: string;
}

export interface AgenticToolCall {
  name: string;
  args: Record<string, any>;
  result: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  thoughts?: string[];
  tools?: AgenticToolCall[];
}

export interface SlideAnnotation {
  id: string;
  x: number;
  y: number;
  label: string;
  description: string;
  timestamp: string;
}

export interface LLMModel {
  id: string;
  name: string;
  badge: string;
  description: string;
  isPaid: boolean;
  recommendedFor: string;
  contextWindow: string;
  speed: string;
}


