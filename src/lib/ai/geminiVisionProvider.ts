import { IProduceVisionProvider, AnalyzeProduceRequest, AnalyzeProduceResult } from './types';
import { IAIAssessment } from '@/types';

const SYSTEM_PROMPT = `You are AgriLink AI, an expert agricultural produce visual quality assessment engine.
Your task is to analyze photographs of agricultural produce submitted by a farmer and provide an objective visual grade recommendation.

You MUST output valid JSON matching this schema:
{
  "detectedProduce": "Produce name (e.g., Tomato, Onion, Potato, Chilli, Apple, Mango)",
  "possibleVariety": "Specific variety if identifiable (e.g., Roma, Red Creole, Alphonso) or null if uncertain",
  "recommendedQuality": "Grade A" | "Grade B" | "Grade C",
  "confidence": 0.0 to 1.0 (float),
  "confidenceLevel": "HIGH" | "MEDIUM" | "LOW",
  "imageQuality": "GOOD" | "ACCEPTABLE" | "POOR" | "BLURRY" | "DARK" | "INSUFFICIENT",
  "visibleIndicators": [
    "Specific visual observations such as color uniformity, sizing consistency, skin smoothness, surface blemishes"
  ],
  "warnings": [
    "Any visual limitations, lighting issues, or inspection risks noted"
  ],
  "needsHumanReview": boolean
}

STRICT ASSESSMENT RULES:
1. recommendedQuality MUST be exactly one of: 'Grade A', 'Grade B', or 'Grade C'.
   - 'Grade A': High visual uniformity, excellent vibrant coloration, minimal surface blemish (<5%), optimal commercial market standard.
   - 'Grade B': Moderate uniformity, acceptable commercial coloration, slight visible surface marks/scratches (<15%), suitable for wholesale trade.
   - 'Grade C': Significant visible cosmetic defects, uneven sizing, mechanical bruises, or non-uniform coloration; suitable for industrial food processing or discount distribution.
2. If the farmer provided a crop name, use it as context to confirm or refine identification.
3. NEVER claim to evaluate internal rot, pesticide residue, chemical composition, sugar/brix content, taste, or moisture. Visual inspection evaluates only exterior characteristics.
4. If images are blurry, too dark, distant, or unclear, assign imageQuality accordingly ('BLURRY', 'DARK', 'POOR', or 'INSUFFICIENT'), set confidence < 0.70, confidenceLevel to 'LOW', and flag needsHumanReview: true.
5. Confidence Guidelines:
   - HIGH (>= 0.90): Clear, well-lit, multi-angle photos of recognizable produce with consistent visual traits.
   - MEDIUM (0.70 - 0.89): Single photo, slight shadow, or mild ambiguity.
   - LOW (< 0.70): Obscured, poor resolution, unusual crop state, or conflicting visual indicators.
`;

const MANDATORY_DISCLAIMER =
  'AgriLink AI visual quality assessment is an advisory tool based on uploaded photographs and does not substitute for physical, chemical, or lab testing where mandated.';

export class GeminiProduceVisionProvider implements IProduceVisionProvider {
  private apiKey: string;
  private primaryModel = 'gemini-3.6-flash';
  private fallbackModel = 'gemini-3.5-flash';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
  }

  async analyzeProduceLot(request: AnalyzeProduceRequest): Promise<AnalyzeProduceResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Gemini API key is not configured on the server.',
        disclaimer: MANDATORY_DISCLAIMER,
      };
    }

    if (!request.images || request.images.length === 0) {
      return {
        success: false,
        error: 'At least one produce image is required for visual analysis.',
        disclaimer: MANDATORY_DISCLAIMER,
      };
    }

    // Try primary model first, fallback to secondary model if error occurs
    try {
      return await this.callGemini(this.primaryModel, request);
    } catch (primaryErr: any) {
      console.warn(`Primary Gemini model (${this.primaryModel}) failed:`, primaryErr?.message || primaryErr);
      try {
        console.log(`Falling back to secondary model (${this.fallbackModel})...`);
        return await this.callGemini(this.fallbackModel, request);
      } catch (fallbackErr: any) {
        console.error('All Gemini vision models failed:', fallbackErr?.message || fallbackErr);
        return {
          success: false,
          error: `AI analysis service currently unavailable: ${fallbackErr?.message || 'Vision assessment failed'}`,
          disclaimer: MANDATORY_DISCLAIMER,
        };
      }
    }
  }

  private async callGemini(model: string, request: AnalyzeProduceRequest): Promise<AnalyzeProduceResult> {
    const parts: any[] = [];

    // Context & instructions
    let contextPrompt = SYSTEM_PROMPT + '\n';
    if (request.farmerCropName) {
      contextPrompt += `\nFarmer-declared crop name: "${request.farmerCropName}".`;
    }
    if (request.additionalNotes) {
      contextPrompt += `\nFarmer notes: "${request.additionalNotes}".`;
    }
    contextPrompt += `\nNumber of uploaded images: ${request.images.length}. Please assess visual quality grade.`;

    parts.push({ text: contextPrompt });

    // Attach all images
    for (let i = 0; i < request.images.length; i++) {
      const img = request.images[i];
      // Strip data:image/...;base64, prefix if present
      let cleanBase64 = img.base64Data;
      if (cleanBase64.includes(';base64,')) {
        cleanBase64 = cleanBase64.split(';base64,')[1];
      }

      // Normalise mime type
      let mimeType = img.mimeType || 'image/jpeg';
      if (!mimeType.startsWith('image/')) {
        mimeType = 'image/jpeg';
      }

      if (img.viewType) {
        parts.push({ text: `Image ${i + 1} view type: [${img.viewType}]` });
      }

      parts.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }

    const payload = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
      this.apiKey
    )}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Gemini returned an empty candidate or no text in response.');
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(candidateText);
    } catch (parseErr: any) {
      console.error('Failed to parse Gemini JSON response:', candidateText);
      throw new Error('Gemini response was not valid JSON.');
    }

    // Normalise Quality Grade to strict enum: 'Grade A' | 'Grade B' | 'Grade C'
    let recommendedQuality: 'Grade A' | 'Grade B' | 'Grade C' = 'Grade B';
    const rawGrade = String(parsedJson.recommendedQuality || '').toUpperCase();
    if (rawGrade.includes('A') || rawGrade === 'GRADE A') {
      recommendedQuality = 'Grade A';
    } else if (rawGrade.includes('C') || rawGrade === 'GRADE C') {
      recommendedQuality = 'Grade C';
    } else {
      recommendedQuality = 'Grade B';
    }

    // Normalise confidence
    let confidence = typeof parsedJson.confidence === 'number' ? parsedJson.confidence : 0.75;
    confidence = Math.max(0, Math.min(1, confidence));

    // Normalise confidence level
    let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    if (confidence >= 0.9) {
      confidenceLevel = 'HIGH';
    } else if (confidence >= 0.7) {
      confidenceLevel = 'MEDIUM';
    } else {
      confidenceLevel = 'LOW';
    }

    // Normalise imageQuality
    const validImageQualities = ['GOOD', 'ACCEPTABLE', 'POOR', 'BLURRY', 'DARK', 'INSUFFICIENT'];
    const imageQuality = validImageQualities.includes(parsedJson.imageQuality)
      ? parsedJson.imageQuality
      : 'ACCEPTABLE';

    // Normalise arrays
    const visibleIndicators = Array.isArray(parsedJson.visibleIndicators)
      ? parsedJson.visibleIndicators.map((s: any) => String(s).trim()).filter(Boolean)
      : ['Visual inspection completed'];

    const warnings = Array.isArray(parsedJson.warnings)
      ? parsedJson.warnings.map((s: any) => String(s).trim()).filter(Boolean)
      : [];

    // Add mandatory safety advisory to warnings if not present
    if (!warnings.some((w: string) => w.toLowerCase().includes('internal') || w.toLowerCase().includes('lab'))) {
      warnings.push('Internal quality, taste, and chemical composition cannot be determined by visual images.');
    }

    const assessment: IAIAssessment = {
      detectedProduce: parsedJson.detectedProduce || request.farmerCropName || 'Agricultural Produce',
      possibleVariety: parsedJson.possibleVariety || null,
      recommendedQuality,
      confidence: Math.round(confidence * 100) / 100,
      confidenceLevel,
      imageQuality: imageQuality as any,
      visibleIndicators,
      warnings,
      needsHumanReview: Boolean(parsedJson.needsHumanReview || confidenceLevel === 'LOW'),
      analyzedAt: new Date(),
      modelVersion: model,
      provider: 'Google Gemini',
      farmerAccepted: false,
    };

    return {
      success: true,
      assessment,
      disclaimer: MANDATORY_DISCLAIMER,
    };
  }
}
