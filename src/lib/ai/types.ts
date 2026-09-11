import { IAIAssessment } from '@/types';

export interface ProduceImageInput {
  mimeType: string;
  base64Data: string;
  viewType?: 'FRONT' | 'SIDE' | 'CLOSEUP' | 'ADDITIONAL' | 'OTHER';
}

export interface AnalyzeProduceRequest {
  images: ProduceImageInput[];
  farmerCropName?: string;
  additionalNotes?: string;
}

export interface AnalyzeProduceResult {
  success: boolean;
  assessment?: IAIAssessment;
  error?: string;
  disclaimer: string;
}

export interface IProduceVisionProvider {
  analyzeProduceLot(request: AnalyzeProduceRequest): Promise<AnalyzeProduceResult>;
}
