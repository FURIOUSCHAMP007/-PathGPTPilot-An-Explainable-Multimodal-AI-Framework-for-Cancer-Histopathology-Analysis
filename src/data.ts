/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HistologySample, CellNode, LLMModel } from './types';

// Helper function to generate stable biopsy cell/gland structures
export function generateTissueNodes(sampleType: 'normal' | 'grade_ii' | 'grade_iii' | 'grade_iv' | 'low_grade_prostate'): CellNode[] {
  const nodes: CellNode[] = [];
  const size = 500; // grid coordinate space

  // Generate background stroma collagen fibers
  for (let i = 0; i < 25; i++) {
    nodes.push({
      x: 50 + Math.random() * (size - 100),
      y: 50 + Math.random() * (size - 100),
      r: 6 + Math.random() * 8,
      type: 'stroma',
      atypical: false,
      gradingWeight: 0.05
    });
  }

  if (sampleType === 'normal') {
    // Neat, circular glands with standard nuclei surrounding them
    const glandCenters = [
      { x: 130, y: 130, r: 60 },
      { x: 370, y: 130, r: 55 },
      { x: 140, y: 370, r: 50 },
      { x: 360, y: 370, r: 65 }
    ];

    glandCenters.forEach((g) => {
      // Add empty space (gland lumen) indicator
      nodes.push({ x: g.x, y: g.y, r: g.r - 20, type: 'stroma', atypical: false, gradingWeight: 0.0 });
      
      // Surround the gland with normal neatly aligned nuclei (epithelial ring)
      const numCells = Math.floor(g.r / 3);
      for (let i = 0; i < numCells; i++) {
        const angle = (i / numCells) * Math.PI * 2;
        const cx = g.x + Math.cos(angle) * (g.r - 10);
        const cy = g.y + Math.sin(angle) * (g.r - 10);
        nodes.push({
          x: cx + (Math.random() - 0.5) * 4,
          y: cy + (Math.random() - 0.5) * 4,
          r: 6 + Math.random() * 3,
          type: 'nuclei',
          atypical: false,
          gradingWeight: 0.1
        });
      }
    });

    // Add some random healthy interstitial cells
    for (let i = 0; i < 40; i++) {
      nodes.push({
        x: Math.random() * size,
        y: Math.random() * size,
        r: 5 + Math.random() * 3,
        type: 'nuclei',
        atypical: false,
        gradingWeight: 0.1
      });
    }

  } else if (sampleType === 'low_grade_prostate') {
    // Gleason 3+3 (Grade Group 1) - simple glands, slightly crowded, but still separate, minimal fusion
    const glandCenters = [
      { x: 120, y: 120, r: 40 },
      { x: 250, y: 130, r: 42 },
      { x: 380, y: 120, r: 38 },
      { x: 130, y: 260, r: 45 },
      { x: 370, y: 260, r: 40 },
      { x: 140, y: 390, r: 40 },
      { x: 260, y: 380, r: 42 },
      { x: 380, y: 390, r: 35 }
    ];

    glandCenters.forEach(g => {
      // Small neatly defined lumens
      nodes.push({ x: g.x, y: g.y, r: g.r - 15, type: 'gland', atypical: false, gradingWeight: 0.3 });
      const numCells = 12;
      for (let i = 0; i < numCells; i++) {
        const angle = (i / numCells) * Math.PI * 2;
        const cx = g.x + Math.cos(angle) * (g.r - 5);
        const cy = g.y + Math.sin(angle) * (g.r - 5);
        nodes.push({
          x: cx,
          y: cy,
          r: 7 + Math.random() * 2,
          type: 'nuclei',
          atypical: false,
          gradingWeight: 0.25
        });
      }
    });

    for (let i = 0; i < 30; i++) {
      nodes.push({
        x: Math.random() * size,
        y: Math.random() * size,
        r: 6 + Math.random() * 2,
        type: 'nuclei',
        atypical: false,
        gradingWeight: 0.2
      });
    }

  } else if (sampleType === 'grade_ii') {
    // Moderate adenocarcinomna: larger, slightly fused/irregular glands and moderately atypical nuclei
    const glandCenters = [
      { x: 150, y: 150, r: 65, irregular: true },
      { x: 350, y: 160, r: 60, irregular: true },
      { x: 250, y: 330, r: 75, irregular: true }
    ];

    glandCenters.forEach((g) => {
      nodes.push({ x: g.x, y: g.y, r: g.r - 18, type: 'gland', atypical: true, gradingWeight: 0.5 });
      // Glands are compressed/irregular
      const numCells = 18;
      for (let i = 0; i < numCells; i++) {
        const angle = (i / numCells) * Math.PI * 2;
        // Introduce irregularities
        const radiusNoise = 12 * Math.sin(angle * 3);
        const cx = g.x + Math.cos(angle) * (g.r - 8 + radiusNoise);
        const cy = g.y + Math.sin(angle) * (g.r - 8 + radiusNoise);
        nodes.push({
          x: cx,
          y: cy,
          r: 8 + Math.random() * 4,
          type: 'nuclei',
          atypical: Math.random() > 0.4,
          gradingWeight: 0.4 + Math.random() * 0.3
        });
      }
    });

    // Add moderate cluster cells invading stroma
    for (let i = 0; i < 60; i++) {
      nodes.push({
        x: Math.random() * size,
        y: Math.random() * size,
        r: 7 + Math.random() * 3,
        type: 'nuclei',
        atypical: Math.random() > 0.3,
        gradingWeight: 0.5
      });
    }

  } else if (sampleType === 'grade_iii') {
    // Severely abnormal tissue: complete loss of gland architecture, crowded atypical sheets of cells.
    // Glands are broken into tiny irregular slits
    const brokenGlands = [
      { x: 130, y: 140, r: 25 },
      { x: 180, y: 120, r: 20 },
      { x: 380, y: 350, r: 30 },
      { x: 420, y: 150, r: 22 }
    ];

    brokenGlands.forEach(bg => {
      nodes.push({ x: bg.x, y: bg.y, r: bg.r - 8, type: 'gland', atypical: true, gradingWeight: 0.8 });
    });

    // Giant solid sheet of highly atypical/pleomorphic nuclei
    for (let i = 0; i < 140; i++) {
      // Cell coordinates cluster densely near center and bottom-left
      const clusterOffset = Math.random() > 0.3 ? { x: 180, y: 180, dev: 120 } : { x: 350, y: 350, dev: 100 };
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * clusterOffset.dev;
      
      const cx = clusterOffset.x + Math.cos(angle) * dist;
      const cy = clusterOffset.y + Math.sin(angle) * dist;

      nodes.push({
        x: Math.max(10, Math.min(size - 10, cx)),
        y: Math.max(10, Math.min(size - 10, cy)),
        // Enlarged hyperchromatic nuclei (atypical nuclei are much larger with irregular margins)
        r: 9 + Math.random() * 6,
        type: 'nuclei',
        atypical: true,
        gradingWeight: 0.8 + Math.random() * 0.2
      });
    }

  } else if (sampleType === 'grade_iv') {
    // Extremely aggressive: sheet of massive cells with mitotic figures, complete necrosis pockets.
    // Necrosis represented as atypical gland-like cells with massive grading weight
    const necrosisHubs = [
      { x: 250, y: 250, r: 80 }
    ];
    necrosisHubs.forEach(nh => {
      nodes.push({ x: nh.x, y: nh.y, r: nh.r, type: 'gland', atypical: true, gradingWeight: 0.95 });
    });

    // Overwhelming cellular load
    for (let i = 0; i < 200; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      nodes.push({
        x: cx,
        y: cy,
        r: 10 + Math.random() * 8, // Very large nuclei
        type: 'nuclei',
        atypical: true,
        gradingWeight: 0.9 + Math.random() * 0.1
      });
    }
  }

  return nodes;
}

export const SAMPLE_SLIDES: HistologySample[] = [
  {
    id: 'TCGA-BRCA-01',
    name: 'Breast Core Specimen 01',
    originDataset: 'TCGA',
    description: 'Core needle biopsy of breast tissues showing characteristics of Invasive Ductal Carcinoma (IDC). Marked pleomorphism and complete loss of glandular structure.',
    magnification: '40x',
    tissueType: 'Breast Core',
    defaultGrade: 'Grade III (High Grade)',
    confidence: 94.2,
    features: ['Severe Nuclear Atypia', 'Glandular Destruction', 'Dense Cell Crowding', 'High Mitotic Activity'],
    clinical: {
      age: 58,
      gender: 'Female',
      stage: 'Stage III',
      smokingHistory: 'Former',
      survivalMonthsEstimate: 24
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Methylated',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('grade_iii')
  },
  {
    id: 'PANDA-PRST-02',
    name: 'Prostate Core Specimen 02',
    originDataset: 'PANDA',
    description: 'Prostate needle biopsy displaying crowded, fused cribriform glands with atypical enlarged nuclei. Stromal infiltration is visible.',
    magnification: '20x',
    tissueType: 'Prostate Biopsy',
    defaultGrade: 'Gleason 4+5 (Grade Group 5)',
    confidence: 91.8,
    features: ['Fused Cribriform Glands', 'Epithelial Tufting', 'Large Concentrated Nucleoli', 'Extralobular Infiltration'],
    clinical: {
      age: 69,
      gender: 'Male',
      stage: 'Stage IV',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 18
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Normal',
      egfr: 'Amplified'
    },
    cells: generateTissueNodes('grade_iv')
  },
  {
    id: 'CAMELYON16-LN-03',
    name: 'Lymph Node Specimen 03',
    originDataset: 'CAMELYON16',
    description: 'Sentinel lymph node section with macro-metastasis of breast adenocarcinoma origin, showing prominent infiltrative cohesive margins.',
    magnification: '40x',
    tissueType: 'Breast Core', // metastatic breast origin
    defaultGrade: 'Grade IV (Metastatic)',
    confidence: 95.7,
    features: ['Metastatic Sheets', 'Necrotic Micro-cores', 'Capsular Breakthrough', 'Indistinct Epithelial Margins'],
    clinical: {
      age: 49,
      gender: 'Female',
      stage: 'Stage IV',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 14
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Mutant',
      egfr: 'Amplified'
    },
    cells: generateTissueNodes('grade_iv')
  },
  {
    id: 'TCGA-LUAD-04',
    name: 'Lung Resection Specimen 04',
    originDataset: 'TCGA',
    description: 'Primary lung lobectomy specimen exhibiting adenocarcinoma, papillary pattern. Normal alveolar spaces are replaced with atypical columnar cell clusters.',
    magnification: '20x',
    tissueType: 'Lung Resection',
    defaultGrade: 'Grade II (Moderate Grade)',
    confidence: 89.4,
    features: ['Papillary Tufting', 'Columnar Epithelial Dysplasia', 'Moderate Nuclear Pleomorphism'],
    clinical: {
      age: 63,
      gender: 'Male',
      stage: 'Stage II',
      smokingHistory: 'Active',
      survivalMonthsEstimate: 42
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Amplified'
    },
    cells: generateTissueNodes('grade_ii')
  },
  {
    id: 'PANDA-PRST-05',
    name: 'Prostate Core Specimen 05 (Benign / Low Grade)',
    originDataset: 'PANDA',
    description: 'Prostate biopsy exhibiting well-formed separate neoplastic glands with uniform cell nuclei and intact basal membrane layers.',
    magnification: '20x',
    tissueType: 'Prostate Biopsy',
    defaultGrade: 'Gleason 3+3 (Grade Group 1)',
    confidence: 93.1,
    features: ['Well-formed Glands', 'Intact Architectural Basal Margin', 'Uniform Nuclei Shape', 'Absent Necrosis'],
    clinical: {
      age: 72,
      gender: 'Male',
      stage: 'Stage I',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 96
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('low_grade_prostate')
  },
  {
    id: 'TCGA-COAD-06',
    name: 'Colon Adenocarcinoma Specimen 06',
    originDataset: 'TCGA',
    description: 'Colon polyp screen exhibiting complex back-to-back cribriform adenomatous change with glandular hypersecretion.',
    magnification: '20x',
    tissueType: 'Colon Polyps',
    defaultGrade: 'Grade II (Moderate Grade)',
    confidence: 91.5,
    features: ['Cribriform architecture', 'Nuclear hyperchromasia', 'Glandular hypersecretion'],
    clinical: {
      age: 67,
      gender: 'Female',
      stage: 'Stage II',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 48
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('grade_ii')
  },
  {
    id: 'CAMELYON16-LN-07',
    name: 'Lymph Node Metastasis 07',
    originDataset: 'CAMELYON16',
    description: 'Subcapsular micro-metastatic focus of ductal breast cancer within axillary sentinel lymph node.',
    magnification: '40x',
    tissueType: 'Breast Core',
    defaultGrade: 'Grade III (High Grade)',
    confidence: 94.8,
    features: ['Infiltrative cohesive cell blocks', 'Subcapsular location', 'Atypical nuclear density'],
    clinical: {
      age: 52,
      gender: 'Female',
      stage: 'Stage III',
      smokingHistory: 'Former',
      survivalMonthsEstimate: 36
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Mutant',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('grade_iii')
  },
  {
    id: 'TCGA-BRCA-08',
    name: 'Breast Ductal Carcinoma 08',
    originDataset: 'TCGA',
    description: 'Invasive lobular carcinoma with single-file pattern infiltrating target stroma.',
    magnification: '40x',
    tissueType: 'Breast Core',
    defaultGrade: 'Grade IV (High Grade)',
    confidence: 96.1,
    features: ['Single-file stromal invasion', 'Loss of E-cadherin structure', 'Severe cytologic atypia'],
    clinical: {
      age: 43,
      gender: 'Female',
      stage: 'Stage IV',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 16
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Normal',
      egfr: 'Amplified'
    },
    cells: generateTissueNodes('grade_iv')
  },
  {
    id: 'TCGA-LUAD-09',
    name: 'Lung Lepidic Adenocarcinoma 09',
    originDataset: 'TCGA',
    description: 'Non-mucinous lepidic adenocarcinoma with neoplastic cells lining well-preserved alveolar septa.',
    magnification: '20x',
    tissueType: 'Lung Resection',
    defaultGrade: 'Grade I (Low Grade)',
    confidence: 88.9,
    features: ['Lepidic growth pattern', 'Preserved alveolar framework', 'Mild cellular atypia'],
    clinical: {
      age: 61,
      gender: 'Male',
      stage: 'Stage I',
      smokingHistory: 'Active',
      survivalMonthsEstimate: 72
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('low_grade_prostate')
  },
  {
    id: 'PANDA-PRST-10',
    name: 'Prostate Glandular Carcinoma 10',
    originDataset: 'PANDA',
    description: 'Gleason 4+4 core biopsy displaying fused micro-acinar aggregates with prominent nucleoli.',
    magnification: '40x',
    tissueType: 'Prostate Biopsy',
    defaultGrade: 'Gleason 4+4 (Grade Group 4)',
    confidence: 92.4,
    features: ['Fused micro-acinar cells', 'Enlarged hyperchromatic nuclei', 'Stromal clefting'],
    clinical: {
      age: 75,
      gender: 'Male',
      stage: 'Stage III',
      smokingHistory: 'Former',
      survivalMonthsEstimate: 28
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('grade_iii')
  },
  // 4 More Breast Cancer cases (total 6)
  {
    id: 'TCGA-BRCA-11',
    name: 'Breast Core Specimen 11',
    originDataset: 'TCGA',
    description: 'Invasive Ductal Carcinoma showing solid sheets of tumor cells with minimal gland formation and high mitotic rate.',
    magnification: '40x',
    tissueType: 'Breast Core',
    defaultGrade: 'Grade III (High Grade)',
    confidence: 93.5,
    features: ['Solid Sheets of Tumor Cells', 'Atypical Mitoses', 'Minimal Gland Formation'],
    clinical: {
      age: 54,
      gender: 'Female',
      stage: 'Stage III',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 30
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('grade_iii')
  },
  {
    id: 'TCGA-BRCA-12',
    name: 'Breast Core Specimen 12',
    originDataset: 'TCGA',
    description: 'Well-differentiated Invasive Ductal Carcinoma with over 75% of tumor forming glands, mild nuclear pleomorphism.',
    magnification: '20x',
    tissueType: 'Breast Core',
    defaultGrade: 'Grade I (Low Grade)',
    confidence: 91.2,
    features: ['Abundant Gland Formation', 'Uniform Small Nuclei', 'Low Mitotic Density'],
    clinical: {
      age: 65,
      gender: 'Female',
      stage: 'Stage I',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 120
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('low_grade_prostate')
  },
  {
    id: 'TCGA-BRCA-13',
    name: 'Breast Core Specimen 13',
    originDataset: 'TCGA',
    description: 'Invasive Lobular Carcinoma characterized by small, dyscohesive tumor cells infiltrating in a single-file pattern.',
    magnification: '40x',
    tissueType: 'Breast Core',
    defaultGrade: 'Grade II (Moderate Grade)',
    confidence: 92.7,
    features: ['Single-file Pattern', 'Dyscohesive Cells', 'Concentric Periductal Infiltration'],
    clinical: {
      age: 59,
      gender: 'Female',
      stage: 'Stage II',
      smokingHistory: 'Former',
      survivalMonthsEstimate: 54
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('grade_ii')
  },
  {
    id: 'TCGA-BRCA-14',
    name: 'Breast Core Specimen 14',
    originDataset: 'TCGA',
    description: 'Triple-Negative Invasive Breast Carcinoma showing extensive geographic necrosis and highly atypical mitotic figures.',
    magnification: '40x',
    tissueType: 'Breast Core',
    defaultGrade: 'Grade IV (High Grade)',
    confidence: 95.1,
    features: ['Geographic Necrosis', 'Severe Nuclear Pleomorphism', 'Prominent Lymphocytic Infiltrate'],
    clinical: {
      age: 47,
      gender: 'Female',
      stage: 'Stage IV',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 15
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Mutant',
      egfr: 'Amplified'
    },
    cells: generateTissueNodes('grade_iv')
  },
  // 3 More Prostate Cancer cases (total 6)
  {
    id: 'PANDA-PRST-15',
    name: 'Prostate Core Specimen 15',
    originDataset: 'PANDA',
    description: 'Prostate biopsy showing poorly-formed and ragged glands representing Gleason Pattern 4 components.',
    magnification: '20x',
    tissueType: 'Prostate Biopsy',
    defaultGrade: 'Gleason 4+3 (Grade Group 3)',
    confidence: 92.9,
    features: ['Poorly-formed Glands', 'Infiltrating Cribriform Masses', 'Intraluminal Mucinous Secretions'],
    clinical: {
      age: 68,
      gender: 'Male',
      stage: 'Stage III',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 45
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('grade_iii')
  },
  {
    id: 'PANDA-PRST-16',
    name: 'Prostate Core Specimen 16',
    originDataset: 'PANDA',
    description: 'Prostate needle core with sheets of undifferentiated cancer cells and single cells without gland structure.',
    magnification: '40x',
    tissueType: 'Prostate Biopsy',
    defaultGrade: 'Gleason 5+5 (Grade Group 5)',
    confidence: 96.0,
    features: ['Comedo Necrosis', 'Undifferentiated Solid Sheets', 'Severe Cytologic Atypia'],
    clinical: {
      age: 71,
      gender: 'Male',
      stage: 'Stage IV',
      smokingHistory: 'Former',
      survivalMonthsEstimate: 12
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Normal',
      egfr: 'Amplified'
    },
    cells: generateTissueNodes('grade_iv')
  },
  {
    id: 'PANDA-PRST-17',
    name: 'Prostate Core Specimen 17',
    originDataset: 'PANDA',
    description: 'Prostate biopsy with Gleason Pattern 3 infiltrating the stroma, presenting well-formed microglandular patterns.',
    magnification: '20x',
    tissueType: 'Prostate Biopsy',
    defaultGrade: 'Gleason 3+4 (Grade Group 2)',
    confidence: 90.8,
    features: ['Well-formed Microglands', 'Focal Cribriform Glands', 'Hyperchromatic Nuclei'],
    clinical: {
      age: 64,
      gender: 'Male',
      stage: 'Stage II',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 84
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('grade_ii')
  },
  // 4 More Lung Cancer cases (total 6)
  {
    id: 'TCGA-LUAD-18',
    name: 'Lung Resection Specimen 18',
    originDataset: 'TCGA',
    description: 'Acinar pattern lung adenocarcinoma showing neoplastic glands infiltrating the fibrotic desmoplastic stroma.',
    magnification: '20x',
    tissueType: 'Lung Resection',
    defaultGrade: 'Grade II (Moderate Grade)',
    confidence: 90.5,
    features: ['Acinar Glandular Structures', 'Desmoplastic Stromal Response', 'Intraneoplastic Mucin'],
    clinical: {
      age: 62,
      gender: 'Female',
      stage: 'Stage II',
      smokingHistory: 'Former',
      survivalMonthsEstimate: 50
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('grade_ii')
  },
  {
    id: 'TCGA-LUAD-19',
    name: 'Lung Resection Specimen 19',
    originDataset: 'TCGA',
    description: 'Solid lung adenocarcinoma showing sheets of polygonal tumor cells with intracellular mucin droplets, highly invasive.',
    magnification: '40x',
    tissueType: 'Lung Resection',
    defaultGrade: 'Grade III (High Grade)',
    confidence: 94.1,
    features: ['Solid Sheets', 'Intracellular Mucin Droplets', 'High Mitotic Index'],
    clinical: {
      age: 57,
      gender: 'Male',
      stage: 'Stage III',
      smokingHistory: 'Active',
      survivalMonthsEstimate: 22
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Normal',
      egfr: 'Amplified'
    },
    cells: generateTissueNodes('grade_iii')
  },
  {
    id: 'TCGA-LUAD-20',
    name: 'Lung Resection Specimen 20',
    originDataset: 'TCGA',
    description: 'Minimally invasive lung adenocarcinoma showing predominantly lepidic pattern with small focus of acinar invasion.',
    magnification: '20x',
    tissueType: 'Lung Resection',
    defaultGrade: 'Grade I (Low Grade)',
    confidence: 89.2,
    features: ['Predominantly Lepidic', 'Uniform Nuclear Morphology', 'Micro-invasion Focus'],
    clinical: {
      age: 66,
      gender: 'Female',
      stage: 'Stage I',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 96
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('low_grade_prostate')
  },
  {
    id: 'TCGA-LUAD-21',
    name: 'Lung Resection Specimen 21',
    originDataset: 'TCGA',
    description: 'Metastatic lung adenocarcinoma to regional lymph node, exhibiting extensive papillary tumor architecture.',
    magnification: '40x',
    tissueType: 'Lung Resection',
    defaultGrade: 'Grade IV (High Grade)',
    confidence: 94.8,
    features: ['Papillary Proliferations', 'Stromal Core Invasion', 'Pleomorphic Nucleoli'],
    clinical: {
      age: 69,
      gender: 'Male',
      stage: 'Stage IV',
      smokingHistory: 'Former',
      survivalMonthsEstimate: 16
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Normal',
      egfr: 'Amplified'
    },
    cells: generateTissueNodes('grade_iv')
  },
  // 5 More Colon Cancer cases (total 6)
  {
    id: 'TCGA-COAD-22',
    name: 'Colon Adenocarcinoma Specimen 22',
    originDataset: 'TCGA',
    description: 'Well-differentiated colon adenocarcinoma presenting simple glandular structures with tall columnar neoplastic epithelial cells.',
    magnification: '20x',
    tissueType: 'Colon Polyps',
    defaultGrade: 'Grade I (Low Grade)',
    confidence: 92.2,
    features: ['Serrated Borders', 'Tall Columnar Cells', 'Preserved Polarized Nuclei'],
    clinical: {
      age: 70,
      gender: 'Male',
      stage: 'Stage I',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 104
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('low_grade_prostate')
  },
  {
    id: 'TCGA-COAD-23',
    name: 'Colon Adenocarcinoma Specimen 23',
    originDataset: 'TCGA',
    description: 'Moderately differentiated colon adenocarcinoma presenting infiltrative irregular glands and frequent luminal necrotic debris.',
    magnification: '20x',
    tissueType: 'Colon Polyps',
    defaultGrade: 'Grade II (Moderate Grade)',
    confidence: 90.9,
    features: ['Irregular Glandular Contours', 'Necrotic Debris', 'Stromal Infiltration'],
    clinical: {
      age: 61,
      gender: 'Female',
      stage: 'Stage II',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 60
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('grade_ii')
  },
  {
    id: 'TCGA-COAD-24',
    name: 'Colon Adenocarcinoma Specimen 24',
    originDataset: 'TCGA',
    description: 'Poorly-differentiated colon adenocarcinoma with prominent solid nesting, cellular pleomorphism and high mitotic activity.',
    magnification: '40x',
    tissueType: 'Colon Polyps',
    defaultGrade: 'Grade III (High Grade)',
    confidence: 93.6,
    features: ['Solid Nesting', 'Severe Cytological Atypia', 'High Mitotic Activity'],
    clinical: {
      age: 58,
      gender: 'Male',
      stage: 'Stage III',
      smokingHistory: 'Former',
      survivalMonthsEstimate: 32
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('grade_iii')
  },
  {
    id: 'TCGA-COAD-25',
    name: 'Colon Adenocarcinoma Specimen 25',
    originDataset: 'TCGA',
    description: 'Highly advanced mucinous adenocarcinoma of the colon containing massive extracellular mucin pools with floating cancer nests.',
    magnification: '20x',
    tissueType: 'Colon Polyps',
    defaultGrade: 'Grade IV (High Grade)',
    confidence: 94.5,
    features: ['Extracellular Mucin Pools', 'Floating Malignant Clusters', 'Signet Ring Cells'],
    clinical: {
      age: 64,
      gender: 'Female',
      stage: 'Stage IV',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 14
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Normal',
      egfr: 'Amplified'
    },
    cells: generateTissueNodes('grade_iv')
  },
  {
    id: 'TCGA-COAD-26',
    name: 'Colon Adenocarcinoma Specimen 26',
    originDataset: 'TCGA',
    description: 'Sigmoid colon resection displaying deeply infiltrative neoplastic cells past the muscularis propria into paracolic fat.',
    magnification: '20x',
    tissueType: 'Colon Polyps',
    defaultGrade: 'Grade II (Moderate Grade)',
    confidence: 91.1,
    features: ['Deep Infiltration', 'Muscularis Disruption', 'Atypical Mitoses'],
    clinical: {
      age: 72,
      gender: 'Male',
      stage: 'Stage III',
      smokingHistory: 'Former',
      survivalMonthsEstimate: 40
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('grade_ii')
  },
  // 4 More Lymph Node cases (total 6)
  {
    id: 'CAMELYON16-LN-27',
    name: 'Lymph Node Specimen 27',
    originDataset: 'CAMELYON16',
    description: 'Subcapsular micro-metastasis of lobular breast carcinoma within sentinel lymph node showing dyscohesive cell patterns.',
    magnification: '40x',
    tissueType: 'Breast Core',
    defaultGrade: 'Grade III (Metastatic)',
    confidence: 93.9,
    features: ['Subcapsular Micro-metastasis', 'Dyscohesive Growth', 'Indian-file Infiltration'],
    clinical: {
      age: 50,
      gender: 'Female',
      stage: 'Stage III',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 36
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('grade_iii')
  },
  {
    id: 'CAMELYON16-LN-28',
    name: 'Lymph Node Specimen 28',
    originDataset: 'CAMELYON16',
    description: 'Axillary lymph node with macrometastasis of breast origin, featuring solid cohesive nesting and central comedo-type necrosis.',
    magnification: '40x',
    tissueType: 'Breast Core',
    defaultGrade: 'Grade IV (Metastatic)',
    confidence: 95.8,
    features: ['Macrometastasis', 'Comedo-type Necrosis', 'Cohesive Nests'],
    clinical: {
      age: 55,
      gender: 'Female',
      stage: 'Stage IV',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 18
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Mutant',
      egfr: 'Amplified'
    },
    cells: generateTissueNodes('grade_iv')
  },
  {
    id: 'CAMELYON16-LN-29',
    name: 'Lymph Node Specimen 29',
    originDataset: 'CAMELYON16',
    description: 'Isolated tumor cells (ITC) in sentinel lymph node sinus, characterized by sparse clusters of cytokeratin-positive epithelial cells.',
    magnification: '20x',
    tissueType: 'Breast Core',
    defaultGrade: 'Grade I (Metastatic)',
    confidence: 92.1,
    features: ['Isolated Tumor Cells', 'Sinusoidal Distribution', 'No Capsular Breach'],
    clinical: {
      age: 63,
      gender: 'Female',
      stage: 'Stage I',
      smokingHistory: 'Never',
      survivalMonthsEstimate: 110
    },
    genomic: {
      tp53: 'Wild-type',
      brca1: 'Normal',
      egfr: 'Normal'
    },
    cells: generateTissueNodes('low_grade_prostate')
  },
  {
    id: 'CAMELYON16-LN-30',
    name: 'Lymph Node Specimen 30',
    originDataset: 'CAMELYON16',
    description: 'Sentinel lymph node showcasing massive macrometastatic involvement with complete architectural effacement and extranodal extension.',
    magnification: '40x',
    tissueType: 'Breast Core',
    defaultGrade: 'Grade IV (Metastatic)',
    confidence: 96.5,
    features: ['Complete Effacement', 'Extranodal Extension', 'Severe Cellular Pleomorphism'],
    clinical: {
      age: 48,
      gender: 'Female',
      stage: 'Stage IV',
      smokingHistory: 'Former',
      survivalMonthsEstimate: 12
    },
    genomic: {
      tp53: 'Mutant',
      brca1: 'Normal',
      egfr: 'Amplified'
    },
    cells: generateTissueNodes('grade_iv')
  }
];

export const AVAILABLE_MODELS: LLMModel[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    badge: 'Default',
    description: 'High-speed efficiency, excellent for standard Q&A, diagnostic summaries, and cellular dictionary queries.',
    isPaid: false,
    recommendedFor: 'Interactive chat & routine reports',
    contextWindow: '1M tokens',
    speed: 'Fast (< 1s)'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Preview)',
    badge: 'Advanced',
    description: 'Deep clinical-grade reasoning. Ideal for complex cross-disciplinary tumor board simulation and advanced genomic correlation.',
    isPaid: true,
    recommendedFor: 'Complex clinical reasoning & detailed reports',
    contextWindow: '2M tokens',
    speed: 'Analytical (1-3s)'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Lite',
    description: 'Lightweight model with ultra-low latency. Perfect for quick general medical definitions, speed indexing and basic help.',
    isPaid: false,
    recommendedFor: 'Ultra-fast basic query support',
    contextWindow: '1M tokens',
    speed: 'Ultra-Fast (< 500ms)'
  },
  {
    id: 'nvidia-bionemo',
    name: 'NVIDIA BioNeMo',
    badge: 'Bio-AI',
    description: 'Specialty generative biology blueprint. Runs ESM2 protein sequence embedding and custom target molecule interaction profiles.',
    isPaid: true,
    recommendedFor: 'Proteomics, molecular modeling & targeted therapeutics',
    contextWindow: 'BioSequence',
    speed: 'Accelerated (1-2s)'
  }
];

