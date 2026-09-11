import { IProduceVisionProvider } from './types';
import { GeminiProduceVisionProvider } from './geminiVisionProvider';

export * from './types';
export * from './geminiVisionProvider';

let visionProviderInstance: IProduceVisionProvider | null = null;

export function getProduceVisionProvider(): IProduceVisionProvider {
  if (!visionProviderInstance) {
    visionProviderInstance = new GeminiProduceVisionProvider();
  }
  return visionProviderInstance;
}
