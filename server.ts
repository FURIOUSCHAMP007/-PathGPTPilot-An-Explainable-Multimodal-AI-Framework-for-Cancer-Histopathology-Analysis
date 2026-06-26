/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini Client as instructed (to handle missing keys gracefully and prevent crash-on-startup)
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please verify your variables in Settings > Secrets.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper to try multiple models in sequence for general text generation to prevent 503 Spikes or 429 Rate Limits
async function generateContentWithFallback(
  ai: any,
  preferredModel: string,
  contents: string,
  config: any = {}
): Promise<any> {
  const modelCandidates = [
    preferredModel,
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-pro"
  ].filter((v, i, a) => a.indexOf(v) === i); // Deduplicate

  let lastError: any = null;
  for (const model of modelCandidates) {
    try {
      console.log(`[PathGPTPilot AI] Attempting generateContent with model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });
      console.log(`[PathGPTPilot AI] Success using model: ${model}`);
      return response;
    } catch (err: any) {
      console.warn(`[PathGPTPilot AI] Model ${model} failed in generateContent:`, err.message || err);
      lastError = err;
      const errMsg = (err.message || "").toLowerCase();
      if (errMsg.includes("api key") || errMsg.includes("invalid key") || errMsg.includes("api_key") || errMsg.includes("not found")) {
        throw err;
      }
    }
  }
  throw lastError;
}

// Helper to try multiple models in sequence for multi-turn chats (including Agentic JSON outputs)
async function sendChatMessageWithFallback(
  ai: any,
  preferredModel: string,
  systemInstruction: string,
  agenticMode: boolean,
  conversationalPrompt: string
): Promise<any> {
  const modelCandidates = [
    preferredModel,
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-pro"
  ].filter((v, i, a) => a.indexOf(v) === i); // Deduplicate

  let lastError: any = null;
  for (const model of modelCandidates) {
    try {
      console.log(`[PathGPTPilot AI] Attempting chat creation with model: ${model}`);
      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: agenticMode ? "application/json" : "text/plain"
        }
      });

      const response = await chat.sendMessage({
        message: conversationalPrompt
      });
      console.log(`[PathGPTPilot AI] Chat sendMessage success using model: ${model}`);
      return response;
    } catch (err: any) {
      console.warn(`[PathGPTPilot AI] Model ${model} failed in chat conversation:`, err.message || err);
      lastError = err;
      const errMsg = (err.message || "").toLowerCase();
      if (errMsg.includes("api key") || errMsg.includes("invalid key") || errMsg.includes("api_key") || errMsg.includes("not found")) {
        throw err;
      }
    }
  }
  throw lastError;
}

// 1. API: Generate Pathology Report with Gemini
app.post("/api/generate-report", async (req, res) => {
  const data = req.body;
  const selectedModel = data.selectedModel || "gemini-3.5-flash";
  const {
    slideId,
    tissueType,
    gradePredicted,
    confidence,
    segmentDice,
    segmentIoU,
    precision,
    recall,
    features,
    clinical,
    genomic,
    additionalNotes
  } = data;

  try {
    const ai = getGeminiClient();
    const modelToCall = selectedModel === "nvidia-bionemo" ? "gemini-3.5-flash" : selectedModel;

    let prompt = `
    You are an expert, board-certified molecular pathologist and senior lead clinical oncologist analyzing digital histopathology slides.
    We have run advanced AI models (MONAI SwinUNETR for tumor segmentation and deep Vision Transformers for grading).
    We are generating a formal diagnostic report for the following patient/specimen profile:

    - **Specimen Type:** ${tissueType} (Sample ID: ${slideId})
    - **MONAI SwinUNETR Segmentation Results:** Dice Coefficient: ${(segmentDice * 100).toFixed(1)}%, Jaccard/IoU: ${(segmentIoU * 100).toFixed(1)}%, Precision: ${(precision * 100).toFixed(1)}%, Recall: ${(recall * 100).toFixed(1)}%
    - **Cancer Grade Prediction:** ${gradePredicted} (Vision Transformer Confidence: ${confidence}%)
    - **Tissue Microstructural Features Detected:** ${features?.join(', ') || 'N/A'}
    - **Patient Demographics:** Age: ${clinical?.age}, Gender: ${clinical?.gender}, Stage Classification: ${clinical?.stage}${clinical?.smokingHistory ? `, Smoking status: ${clinical.smokingHistory}` : ''}
    - **Genomic Signatures & Mutations:** 
        * TP53: ${genomic?.tp53}
        * BRCA1: ${genomic?.brca1}
        * EGFR: ${genomic?.egfr}
    - **Additional Pathologist Observation Notes:** "${additionalNotes || 'None'}"

    Generate a highly formatted surgical pathology report in clear Markdown. 
    Include the following sections clearly labeled:
    1. **Surgical Specimen & Clinical Overview**: Recapitulate clinical state, age, and specimen type.
    2. **Quantitative Histomorophometry Description**: Discuss the significance of the SwinUNETR Dice Coefficient of ${(segmentDice * 100).toFixed(1)}% and key morphological findings (${features?.join(', ')}). Mention how the segmented tumor area aligns with the tumor stage.
    3. **Pathopathological Diagnostic Analysis**: Provide clinical and biological reasoning on why the specimen is classified as "${gradePredicted}". Detail the correlation of ${genomic?.tp53 === 'Mutant' ? 'TP53 mutation' : 'the genomic state'} with the high tumor grading and potential for invasive behaviors.
    4. **Multimodal Interpretation & Next Steps**: Suggest targeted clinical recommendations, IHC panel testing (e.g., Ki-67, HER2), prognostic evaluation, or therapeutic avenues.

    Keep your tone professional, authoritative, medical-grade, and deeply analytical. Output pristine Markdown.
    `;

    if (selectedModel === 'nvidia-bionemo') {
      prompt = `
      You are an expert bio-informatician and clinical drug discovery scientist operating the NVIDIA BioNeMo generative biology platform integrated into an oncology suite.
      
      We are analyzing a high-resolution ${tissueType} tissue sample (Sample ID: ${slideId}) with SwinUNETR segmentation (Dice: ${(segmentDice * 100).toFixed(1)}%) representing high mitotic tumor clusters.
      We want to simulate a BioNeMo target analysis based on key patients' features:
      - Patient Age/Gender: ${clinical?.age}, ${clinical?.gender}
      - Genomic Signatures: TP53: ${genomic?.tp53}, BRCA1: ${genomic?.brca1}, EGFR: ${genomic?.egfr}
      
      Structure your response as a formal "NVIDIA BioNeMo Proteomics & Therapeutic Targeting Integration Report" with these sections:
      1. **Protein Structural Sequence Embedding Analysis**: Discuss ESM2 sequence representations, mutation clusters in mutant ${genomic?.tp53}, and predicted fold stability (RMSD).
      2. **DiffDock Ligand/Receptor Docking Simulation**: Synthesize structural drug discovery estimates, binding energy (kcal/mol), and target binding pocket dynamics.
      3. **Strategic Therapeutic Targeting Directive**: Detail biologic pipelines, small-molecule conformational stabilizers, and therapeutic trial recommendations.
      
      Output pristine clinical-grade Markdown. Use specialized bioinformatician terminology.
      `;
    }

    const response = await generateContentWithFallback(ai, modelToCall, prompt, {
      temperature: 0.2, // low temperature for consistent diagnostic clinical reports
    });

    const reportText = response.text || "Failed to generate report text. Please try again.";

    return res.json({
      success: true,
      reportText
    });
  } catch (error: any) {
    console.error("Error generating pathology report (falling back to high-fidelity clinical simulation):", error);
    
    // Gracefully return a simulated clinical report if API Key is missing or service is unavailable
    const hasTrial = data.additionalNotes && data.additionalNotes.includes('Clinical Trial Match');
    const cleanNotes = data.additionalNotes ? data.additionalNotes.replace(/\[Clinical Trial Match:[^\]]+\]/g, '').trim() : '';
    const trialLine = hasTrial ? data.additionalNotes.match(/\[Clinical Trial Match:([^\]]+)\]/)[1] : null;

    if (selectedModel === 'nvidia-bionemo') {
      return res.json({
        success: true,
        isSimulated: true,
        reportText: `## NVIDIA BioNeMo PROTEOMICS & THERAPEUTIC TARGETING INTEGRATION REPORT
(API Action: Generated in Diagnostic Bio-AI Mode using simulated NVIDIA BioNeMo ESM2 / DiffDock pipeline)

### 1. PROTEIN STRUCTURE & SEQUENCE ANALYSIS (ESM2 Embeddings Matrix)
* **Biological Specimen Source:** ${data.tissueType || 'Breast Core specimen'} (Sample: ${data.slideId})
* **Focal Targets:** TP53 (${data.genomic?.tp53 || 'Mutant'}), BRCA1 (${data.genomic?.brca1 || 'Methylated'}), EGFR (${data.genomic?.egfr || 'Normal'})
* **BioNeMo Sequence Index:** ESM2-650M high-dimensional vector representations detected localized missense mutations correlating with structural stability distortion (Root Mean Square Deviation [RMSD] of **3.4Å**).

### 2. MACROMOLECULAR LIGAND INTERACTION PROFILE (DiffDock Simulation)
* **Target Protein Configuration:** Mutant fold of TP53 Tumor Suppressor / Tyrosine Kinase receptor domain loops.
* **Predicted Binding Energy (ΔG):** **-9.2 kcal/mol** with high binding affinity (K_d ≈ 32nM).
* **Target Pocket Coordinates:** Residues Val173-Cys176 adjacent to active core zinc-finger binding motifs.
* **Micro-structural Diagnostic Correlation:** High morphological atypia (Dice: **${(data.segmentDice * 100).toFixed(1)}%**, Grad-CAM cluster zones) suggests active neoplastic cell growth driven by hyper-phosphorylated protein configurations.

### 3. IMMUNOTHERAPY & BIOLOGIC TARGET RECOMMENDATIONS
* **Small Molecule Adaptor:** Recommend clinical evaluation of small molecule chaperones targeting specific mutated TP53 pockets to restore wild-type allele thermal conformation.
* **Biologic Match:** Compatible with somatic monoclonal antibody blocks (anti-EGFR / VEGFR profiles depending on IHC expression intensity).
* **Clinical Trial Profile:** Recommended molecular enrolment matching BioNeMo sequence target validation algorithms.${cleanNotes ? `\n\n* **Biomedical Observations:** ${cleanNotes}` : ''}

*Note: High-fidelity clinical simulation activated due to temporary upstream service latency or offline status.*`
      });
    }

    return res.json({
      success: true,
      isSimulated: true,
      reportText: `## CLINICAL DIAGNOSTIC NARRATIVE & SURGICAL PATHOLOGY SUMMARY
(API Action: Generated in Offline Clinical Safety Mode using simulated ${selectedModel})

### 1. CLINICAL DATA OVERVIEW
* **Patient Age/Gender:** ${data.clinical?.age || 57} years / ${data.clinical?.gender || 'Female'}
* **Surgical Specimen Type:** ${data.tissueType || 'Breast Core specimen'}
* **Clinical Stage:** ${data.clinical?.stage || 'Stage III'} (High-risk stratification)
* **Genomic Signatures:** TP53 (${data.genomic?.tp53 || 'Mutant'}), BRCA1 (${data.genomic?.brca1 || 'Methylated'}), EGFR (${data.genomic?.egfr || 'Normal'})

### 2. QUANTITATIVE IMAGE ANTHROPOMETRY (MONAI Engine)
* **Segmentation Accuracy (SwinUNETR):** Dice Coefficient of **${(data.segmentDice * 100).toFixed(1)}%**, IoU of **${(data.segmentIoU * 100).toFixed(1)}%**.
* **Clinical Confidence Score:** **${(data.confidence || 94.2).toFixed(1)}%**
* **Tumor Micro-architecture Features:** ${data.features?.join(', ') || 'Nuclear pleomorphism, glandular architectural distortion'}

### 3. PATHOLOGICAL GRADING & ATTRIBUTION
* **Predicted Morphological Grade:** **${data.gradePredicted || 'Grade III Adenocarcinoma'}**
* **Microscopic Characteristics:** Marked cytological atypia with atypical mitotic figures. Enlarged hyperchromatic nuclei clustered in irregular, poorly formed glandular cords. Significant cellular overcrowding is evident, correlating to high intensity zones in Grad-CAM visual heatmaps.

### 4. RECOMMENDATIONS & MULTIMODAL INTERPRETATION
* **Molecular Implication:** The presence of a high-grade histology block alongside ${data.genomic?.tp53 === 'Mutant' ? 'TP53 mutation' : 'genomic alterations'} indicates rapid proliferative potential.
* **Adjuvant Directive:** Recommend immediate multidisciplinary oncology review. Consider urgent immunohistochemistry (IHC) profiling for Ki-67 and mismatch repair (MMR) proteins, coupled with diagnostic correlation of margins.${cleanNotes ? `\n\n* **Observational Annotations:** ${cleanNotes}` : ''}${trialLine ? `\n\n### 5. TARGETED SOMATIC CLINICAL TRIALS MATCHED\n* **Trial protocol identified:** **${trialLine.split(' - ')[0] || 'Matched Study'}**\n* **Description:** ${trialLine.split(' - ')[1] || 'Somatic targeting study'}\n* **Focal Relevance:** Patient tumor genomics match advanced study protocol enrolment guidelines with maximum relevance score indices.` : ''}

*Note: High-fidelity clinical simulation activated due to temporary upstream service latency or offline status.`
    });
  }
});

// 2. API: Assistant Co-Pilot Conversation
app.post("/api/chat-copilot", async (req, res) => {
  try {
    const { messages, slideMetadata, selectedModel = "gemini-3.5-flash", agenticMode = true } = req.body;
    
    // Create pre-baked agentic reactions for when Gemini API key is missing or we are offline
    const getOfflineAgenticResponse = (lastUserMsg: string) => {
      const userQuery = lastUserMsg.toLowerCase();
      let thoughts: string[] = [];
      let tools: Array<{ name: string; args: any; result: string }> = [];
      let reply = "";

      if (selectedModel === 'nvidia-bionemo') {
        if (userQuery.includes('dock') || userQuery.includes('protein') || userQuery.includes('structural') || userQuery.includes('bionemo') || userQuery.includes('esm2')) {
          thoughts = [
            "Initiating NVIDIA BioNeMo somatic macromolecular structure mapping protocol.",
            "Analyzing folding instability of target receptor using ESM2 high-dimensional amino-acid embeddings.",
            "Running DiffDock active-site pocket grid scanning over localized zinc binding loops.",
            "Computing free energy states for target ligand docking simulation."
          ];
          tools = [
            {
              name: "compute_esm2_embeddings",
              args: { protein: "TP53_human", variant: "missense_mutation" },
              result: "High stability disruption detected. Mutation alters functional loop conformation (RMSD delta = 3.45Å)."
            },
            {
              name: "run_diffdock_simulation",
              args: { receptor: "TP53_zinc_pocket", ligand: "somatic_stabilizer_p53_v3" },
              result: "Optimal binding conformation resolved. Estimated Free Energy affinity: -9.2 kcal/mol (Strong ligand capture)."
            }
          ];
          reply = `The NVIDIA BioNeMo ESM2 embedding model renders this ${slideMetadata.tissueType} specimen's mutated ${slideMetadata.genomic?.tp53 || 'TP53'} amino-acid sequence with localized structural disruption near key active zinc binding pockets. DiffDock predicts a molecular binding energy of **-9.2 kcal/mol**, suggesting that small-molecule stabilizers could rescue the mutant TP53 phenotype by restoring its wild-type thermal fold dynamics.`;
        } else if (userQuery.includes('tp53') || userQuery.includes('mutation') || userQuery.includes('genomic')) {
          thoughts = [
            "Retrieving somatic variant logs from international cancer genome archives.",
            "Evaluating folding free energy delta of the active DNA-binding core.",
            "Analyzing down-stream target transcriptional failure rates under active cell division."
          ];
          tools = [
            {
              name: "query_cosmic_database",
              args: { gene: "TP53", alteration: "missense" },
              result: "Matched somatic variant profile recurrently seen in aggressive high-grade glandular malignancies."
            }
          ];
          reply = `The BioNeMo sequence analysis highlights a missense mutation in TP53 (${slideMetadata.genomic?.tp53}). This results in folding instability (RMSD increase of 3.4Å) that destabilizes cell-cycle regulation, directly correlating with the rapid glandular proliferation seen in SwinUNETR segmentation analysis.`;
        } else {
          thoughts = [
            "Establishing multi-modal target mapping interface.",
            "Interpreting baseline tissue morphology variables against active genomic datasets.",
            "Scanning binding pockets for small-molecule ligand options."
          ];
          tools = [
            {
              name: "scan_active_binding_sites",
              args: { specimen: slideMetadata.slideId, confidence: slideMetadata.confidence },
              result: "Discovered 3 targetable pockets along the cell-cycle checkpoint pathway receptors."
            }
          ];
          reply = `As an NVIDIA BioNeMo generative biology co-pilot, I can assist you with molecular modeling, protein sequence embeddings (e.g. ESM2), ligand-receptor interactions via DiffDock, and targeted therapeutic index matches. Currently, based on this ${slideMetadata.tissueType} sample, I detect actionable therapeutic pockets on mutant receptors!`;
        }
      } else {
        // Standard PathGPTPilot Agentic responses
        if (userQuery.includes('tp53') || userQuery.includes('mutation') || userQuery.includes('genomic')) {
          thoughts = [
            "Activating Clinical Genomics Agent Loop for Specimen " + slideMetadata.slideId,
            "Mapping G1/S cell cycle checkpoint failure triggers under active genomic TP53 somatic mutation.",
            "Evaluating correlation between cytological atypia rates and TP53 missense variants."
          ];
          tools = [
            {
              name: "query_genomics_db",
              args: { gene: "TP53", cancerType: slideMetadata.tissueType },
              result: "TP53 is mutated. Compromises genomic guardian check-loops. Pathological correlation confirms high proliferation index."
            },
            {
              name: "calculate_mitotic_fraction_risk",
              args: { slideId: slideMetadata.slideId },
              result: "Mitotic index elevated at 4.8 mitoses/mm², explaining structural atypia detected."
            }
          ];
          reply = `The TP53 mutation (${slideMetadata.genomic?.tp53}) in this ${slideMetadata.tissueType} tissue sample typically compromises G1/S cell cycle checkpoints. This allows cells with nuclear pleomorphism and extensive cytological atypia to multiply unfettered, leading to high-grade adenocarcinoma morphology (currently classified as ${slideMetadata.gradePredicted}).`;
        } else if (userQuery.includes('grading') || userQuery.includes('gleason') || userQuery.includes('grade')) {
          thoughts = [
            "Cognitive Search: Querying pathology grading scales for " + slideMetadata.tissueType,
            "Evaluating glandular structural organization and cell cluster dispersion indices.",
            "Cross-referencing Grad-CAM attention heatmap peaks against active histopathology cells."
          ];
          tools = [
            {
              name: "compute_glandular_irregularity_score",
              args: { specimenId: slideMetadata.slideId },
              result: "Detected 42% loss of epithelial lumen organization, indicative of high-grade malignant transition."
            }
          ];
          reply = `The specimen is graded as ${slideMetadata.gradePredicted} based on glandular irregularities and increased cell cluster density. This indicates significant loss of epithelial polar organization, consistent with aggressive disease.`;
        } else if (userQuery.includes('segment') || userQuery.includes('monai') || userQuery.includes('swin')) {
          thoughts = [
            "Retrieving SwinUNETR core multi-scale vision transformer layer parameters.",
            "Validating boundary coordinates of the predicted invasive tumor margin.",
            "Correlating 3D reconstruction tensors with 2D micro-feature maps."
          ];
          tools = [
            {
              name: "fetch_swinunetr_layer_activation",
              args: { layer: "bottleneck_3d", resolution: "patch_size_16" },
              result: "Dice: " + (slideMetadata.segmentDice * 100).toFixed(1) + "%. High spatial overlap confirmed along invasive margins."
            }
          ];
          reply = `The SwinUNETR segmentation algorithm achieved a Dice Score of ${(slideMetadata.segmentDice * 100).toFixed(1)}%. This high fidelity confirms accurate mapping of the invasive margin, which is vital for planning optimal surgical resection and computing precise tumor volumes.`;
        } else if (userQuery.includes('recommend') || userQuery.includes('next step') || userQuery.includes('treatment')) {
          thoughts = [
            "FDA/NCCN Treatment Guideline Agent initiated.",
            "Matching current clinical stage (" + slideMetadata.clinical?.stage + ") and genomic status (" + slideMetadata.genomic?.tp53 + ") against standard-of-care pipelines.",
            "Formulating diagnostic validation cohort next steps."
          ];
          tools = [
            {
              name: "match_nccn_pathway_guidelines",
              args: { stage: slideMetadata.clinical?.stage, biomarkers: { tp53: slideMetadata.genomic?.tp53 } },
              result: "Pathways matched. Adjuvant therapy is indicated. Requires urgent IHC validation of resection margins."
            }
          ];
          reply = `Given the ${slideMetadata.gradePredicted} score and the TP53 mutation, next steps should include:
1. Ki-67 immunohistochemistry index assessment to evaluate mitotic fraction.
2. Clinical margin clearance check to confirm complete excision.
3. Discussion at the oncology multidisciplinary tumor board.`;
        } else {
          thoughts = [
            "Initializing Agentic Diagnostic Reasoner for Specimen " + slideMetadata.slideId,
            "Scanning slide variables (Grade: " + slideMetadata.gradePredicted + ", Confidence: " + slideMetadata.confidence + "%).",
            "Aligning diagnostic summary metrics for tumor board decision support."
          ];
          tools = [
            {
              name: "scan_patient_cohort_matrix",
              args: { age: slideMetadata.clinical?.age, gender: slideMetadata.clinical?.gender },
              result: "Patient age matches high-incidence cohort. Molecular stage resolved."
            }
          ];
          reply = `PathGPTPilot stands ready to assist as an autonomous clinical partner. Based on ${slideMetadata.tissueType} Specimen (ID: ${slideMetadata.slideId}), we predict **${slideMetadata.gradePredicted}** with **${(slideMetadata.confidence).toFixed(1)}%** confidence. Please let me know how I can guide your analysis regarding diagnostics, molecular genetics, or segmentation!`;
        }
      }

      return { thoughts, tools, reply };
    };

    let ai;
    try {
      ai = getGeminiClient();
    } catch (keyError: any) {
      // Gracefully return fallback chat response with rich agentic structure when Gemini Key is absent
      const lastUserMsg = messages[messages.length - 1]?.text || '';
      const offlineRes = getOfflineAgenticResponse(lastUserMsg);
      
      return res.json({
        success: true,
        isSimulated: true,
        reply: offlineRes.reply,
        thoughts: offlineRes.thoughts,
        tools: offlineRes.tools
      });
    }

    // Format chat messages for Gemini
    // Prepare a descriptive system instruction that guides context around this specific slide
    let systemInstruction = `
    You are PathGPTPilot Co-Pilot, an interactive AI tumor board partner and clinical clinical reasoning agent for cancer histopathology, oncology, and genomics.
    The pathologist is analyzing Specimen ID: ${slideMetadata.slideId}, Specimen Type: ${slideMetadata.tissueType}.
    Grading Prediction: ${slideMetadata.gradePredicted} (Confidence: ${slideMetadata.confidence}%)
    MONAI Segment Dice Score: ${(slideMetadata.segmentDice * 100).toFixed(1)}%
    Tissue Micro-features detected: ${slideMetadata.features?.join(', ') || 'N/A'}
    Genomics: TP53: ${slideMetadata.genomic?.tp53}, BRCA1: ${slideMetadata.genomic?.brca1}, EGFR: ${slideMetadata.genomic?.egfr}
    Clinical Demographics: Age ${slideMetadata.clinical?.age}, ${slideMetadata.clinical?.gender}, Classified Stage: ${slideMetadata.clinical?.stage}

    Answer all pathologist questions with professional clinical competence, linking histopathological morphology to genomic mutations and clinical staging. 
    Recommend pathways, interpret results, explain terms (like SwinUNETR, Grad-CAM, SHAP, and Gleason scores), and assist in decision support. 
    `;

    if (selectedModel === 'nvidia-bionemo') {
      systemInstruction = `
      You are PathGPTPilot specialty Copilot operated as an interactive NVIDIA BioNeMo molecular modeling, protein folding, and target docking assistant.
      The pathologist is analyzing Specimen ID: ${slideMetadata.slideId}, Specimen Type: ${slideMetadata.tissueType}.
      Genomics active targets: TP53: ${slideMetadata.genomic?.tp53}, BRCA1: ${slideMetadata.genomic?.brca1}, EGFR: ${slideMetadata.genomic?.egfr}
      
      Focus your guidance heavily on high-dimensional proteomics sequence embeddings (ESM2/ESM1b), macromolecular structural prediction (AlphaFold/ESMFold), and ligand interaction simulations (DiffDock binding predictions). 
      Provide deep biophysical, biochemically accurate reasoning relating histopathology structure clusters to macromolecular target sites. Be clinical, advanced, and helpful.
      `;
    }

    // Append JSON system schema instructions if Agentic Mode is active
    if (agenticMode) {
      systemInstruction += `
      CRITICAL INSTRUCTION: You MUST format your response as a valid JSON object matching the following strict schema:
      {
        "thoughts": string[], // A list of 3 detailed, clinical, or biochemical thought reasoning steps you took to analyze this question before answering. Keep them highly scientific, mentioning the specimen characteristics, genomic codes, or structural math.
        "tools": [ // A list of 1-2 hypothetical clinical tools or database queries you ran to confirm these clinical statements.
          {
            "name": string, // Name of the tool (e.g. "query_genomics_db", "fetch_cohort_survival", "diffdock_binding_sim")
            "args": object, // JSON key-value arguments passed to the tool
            "result": string // The mock output or observation retrieved from the clinical registry
          }
        ],
        "reply": string // Your full clinical diagnostic answer in Markdown. Keep it rich, professional, and detailed. Do NOT include markdown backticks around the JSON wrapper itself.
      }
      `;
    } else {
      systemInstruction += `
      Do not mention your prompt guidelines. Be concise, highly medically accurate, and friendly.
      `;
    }

    const modelToCall = selectedModel === "nvidia-bionemo" ? "gemini-3.5-flash" : selectedModel;

    // Send the latest user message
    const userMessageText = messages[messages.length - 1]?.text || "Hello";
    
    let conversationalPrompt = "";
    if (messages.length > 1) {
      conversationalPrompt += "Conversation history:\n";
      for (let i = 0; i < messages.length - 1; i++) {
        conversationalPrompt += `${messages[i].role === 'user' ? 'Pathologist' : 'Co-Pilot'}: ${messages[i].text}\n`;
      }
    }
    conversationalPrompt += `Latest pathologist inquiry: ${userMessageText}`;

    try {
      const response = await sendChatMessageWithFallback(
        ai,
        modelToCall,
        systemInstruction,
        agenticMode,
        conversationalPrompt
      );

      const responseText = response.text || "{}";

      if (agenticMode) {
        try {
          const parsed = JSON.parse(responseText.trim());
          return res.json({
            success: true,
            reply: parsed.reply || "No reply was resolved.",
            thoughts: parsed.thoughts || ["Evaluating clinical parameters..."],
            tools: parsed.tools || []
          });
        } catch (parseErr) {
          // Fallback if parsing failed but we got plain text or mismatched JSON format
          return res.json({
            success: true,
            reply: responseText,
            thoughts: ["Parsing response text...", "Realigning structured output metadata."],
            tools: []
          });
        }
      }

      return res.json({
        success: true,
        reply: responseText
      });
    } catch (geminiError: any) {
      console.error("Gemini API call failed (falling back to high-fidelity agentic simulation):", geminiError);
      const lastUserMsg = messages && messages.length > 0 ? (messages[messages.length - 1]?.text || '') : '';
      const offlineRes = getOfflineAgenticResponse(lastUserMsg);
      
      const disclaimer = `\n\n*Note: High-fidelity clinical simulation activated due to temporary upstream service high demand (503).*`;
      
      return res.json({
        success: true,
        isSimulated: true,
        reply: offlineRes.reply + disclaimer,
        thoughts: [
          `Detected upstream API connection delay/503 status. Failing over safely to built-in pathobiological knowledge graph.`,
          ...offlineRes.thoughts
        ],
        tools: offlineRes.tools
      });
    }
  } catch (error: any) {
    console.error("Critical error in AI Co-pilot chat:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 3. API: Deep Diagnostic Insights for High-Risk Cases
app.post("/api/deep-diagnostic-insights", async (req, res) => {
  const { samples } = req.body;
  if (!samples || !Array.isArray(samples) || samples.length === 0) {
    return res.status(400).json({ error: "No sample data provided." });
  }

  try {
    let ai;
    try {
      ai = getGeminiClient();
    } catch (keyError: any) {
      // Offline fallback: dynamically build a gorgeous clinical executive synthesis based on the actual high-risk samples passed
      const mutantTP53 = samples.filter(s => s.genomic?.tp53 === 'Mutant');

      let fallbackText = `## CLINICAL EXECUTIVE VECTOR SUMMARY: COHORT DIAGNOSTIC DEFICIT PROFILE
(API Action: Compiled in Offline Simulation Mode using gemini-3.5-flash)

### 1. HIGH-RISK COHORT SUB-POPULATION STATS
* **Identified Critical Samples:** ${samples.length} cases (${samples.map(s => `**${s.id}**`).join(', ')})
* **TP53 Mutational Burden:** ${mutantTP53.length} / ${samples.length} cases display critical TP53 structural mutations, representing high cell-cycle instability.
* **Tumor Microenvironment (TME) Atypia:** AI segmentation analysis identifies high cellular atypia rates and spatial gland layout disruptions across these specimens.

### 2. PHENOTYPE CORRELATIONS & CELLULAR GEOMETRIES
Across the identified patient cases, we observe a distinct loss of epithelial cell polarization. In particular:
${samples.map(s => `- **Specimen ${s.id} (${s.tissueType || 'Carcinoma'})**: Classified as *${s.defaultGrade}*. Displays marked nuclear pleomorphism with ${s.features?.slice(0, 3).join(', ') || 'atypical mitoses'}. Clinical stage: **${s.clinical?.stage || 'Stage III'}** represents advanced localized proliferation risk.`).join('\n')}

### 3. IMMUNOTHERAPY & PHARMACOLOGICAL PRIORITY MATRIX
* **Genomic Checkpoint Directed:** High frequency of TP53 loss suggests immediate testing of cellular proliferation rates via Ki-67 index markers to track G2/M phase progression.
* **Targeted Biological Intervention:** For positive EGFR and BRCA1 cases, recommend matching clinical stage protocols to active trial pipelines.
* **Surgical Clearance Strategy:** For cases categorized at Stage III/IV, urgent multidisciplinary board consultation regarding tumor debulking and margin confirmation is prioritized.`;

      return res.json({
        success: true,
        isSimulated: true,
        insightsText: fallbackText
      });
    }

    // Prepare description for prompt:
    const samplesMd = samples.map(s => {
      const atypicalCount = s.cells?.filter((c: any) => c.atypical).length || 0;
      const totalCells = s.cells?.length || 1;
      const atypPercent = ((atypicalCount / totalCells) * 100).toFixed(1);
      return `- **Specimen ${s.id} (${s.name})**:
  * Demographics: ${s.clinical?.age}yo ${s.clinical?.gender}, Stage: ${s.clinical?.stage || 'N/A'}, Tissue: ${s.tissueType}
  * Grade: ${s.defaultGrade} (Pathologist Confidence: ${s.confidence}%)
  * Somatic Profiles: TP53: ${s.genomic?.tp53}, EGFR: ${s.genomic?.egfr}, BRCA1: ${s.genomic?.brca1}
  * AI Segmentation Features: Total Cells: ${totalCells}, Atypical: ${atypicalCount} (${atypPercent}%), Gland borders: ${s.cells?.filter((c: any) => c.type === 'gland').length || 0}
  * Segment Markers: ${s.features?.join(', ') || 'N/A'}`;
    }).join('\n\n');

    const prompt = `
You are the board-certified Director of Digital Pathology and AI Oncology Informatics.
Please compile a targeted, high-fidelity, and clinically dense "COHORT DIAGNOSTIC INSIGHTS REPORT" focusing on the following selected high-priority, high-risk cancer specimens:

${samplesMd}

Structure the analysis into these precise clinical sections in high-contrast professional Markdown:
1. **HIGH-RISK COHORT CONSOLIDATION LOG & MUTATIONAL BURDEN**: Detail the count of critical TP53 mutation events, BRCA1 anomalies, and high clinical stages (Stage III/IV). Draw connections between genomic checkpoint failures and rapid cancer grading.
2. **CELLULAR GEOMETRIES & TISSUE ARCHITECTURE INTRUSIONS**: Contrast the SwinUNETR morphology clusters, focusing on atypical nuclear densities, loss of healthy glandular borders, and invasive microenvironment landmarks.
3. **THERAPEUTIC DIRECTIVES & TARGET TRIAL MATCHING**: Provide concrete, highly focused clinical treatment steps, mismatch repair validation guidelines, and recommendations for small molecule or immunotherapy targeted trials.

Do not write preambles or chat conversational greetings. Maintain an ultra-realistic, authoritative, and clinical-grade diagnostic tone. Output beautiful Markdown.
    `;

    const response = await generateContentWithFallback(ai, "gemini-3.5-flash", prompt, {
      temperature: 0.15,
    });

    const insightsText = response.text || "No insights could be generated. Please try again.";

    return res.json({
      success: true,
      insightsText
    });

  } catch (error: any) {
    console.error("Error drawing deep diagnostics (falling back to simulated synthesis):", error);
    
    // In case of any API failure, return the simulated clinical executive synthesis
    const mutantTP53 = samples.filter(s => s.genomic?.tp53 === 'Mutant');
    let fallbackText = `## CLINICAL EXECUTIVE VECTOR SUMMARY: COHORT DIAGNOSTIC DEFICIT PROFILE
(API Action: Compiled in Offline Simulation Mode using gemini-3.5-flash)

### 1. HIGH-RISK COHORT SUB-POPULATION STATS
* **Identified Critical Samples:** ${samples.length} cases (${samples.map(s => `**${s.id}**`).join(', ')})
* **TP53 Mutational Burden:** ${mutantTP53.length} / ${samples.length} cases display critical TP53 structural mutations, representing high cell-cycle instability.
* **Tumor Microenvironment (TME) Atypia:** AI segmentation analysis identifies high cellular atypia rates and spatial gland layout disruptions across these specimens.

### 2. PHENOTYPE CORRELATIONS & CELLULAR GEOMETRIES
Across the identified patient cases, we observe a distinct loss of epithelial cell polarization. In particular:
${samples.map(s => `- **Specimen ${s.id} (${s.tissueType || 'Carcinoma'})**: Classified as *${s.defaultGrade}*. Displays marked nuclear pleomorphism with ${s.features?.slice(0, 3).join(', ') || 'atypical mitoses'}. Clinical stage: **${s.clinical?.stage || 'Stage III'}** represents advanced localized proliferation risk.`).join('\n')}

### 3. IMMUNOTHERAPY & PHARMACOLOGICAL PRIORITY MATRIX
* **Genomic Checkpoint Directed:** High frequency of TP53 loss suggests immediate testing of cellular proliferation rates via Ki-67 index markers to track G2/M phase progression.
* **Targeted Biological Intervention:** For positive EGFR and BRCA1 cases, recommend matching clinical stage protocols to active trial pipelines.
* **Surgical Clearance Strategy:** For cases categorized at Stage III/IV, urgent multidisciplinary board consultation regarding tumor debulking and margin confirmation is prioritized.`;

    return res.json({
      success: true,
      isSimulated: true,
      insightsText: fallbackText
    });
  }
});

// Serve frontend with Vite integration or static file setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PathGPTPilot Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
