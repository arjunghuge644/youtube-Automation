import type { VideoCategory } from '@creatorflow/shared';

export interface ProviderCapabilities {
  textToVideo: boolean;
  imageToVideo: boolean;
  referenceImages: boolean;
  supportedDurations: number[];
  supportedAspectRatios: ('9:16' | '16:9' | '1:1')[];
  nativeAudioSupported: boolean;
  maxConcurrency: number;
  costPerSecondUsd: number;
  isFreeTierEligible: boolean;
}

export interface VideoGenerationRequest {
  taskId: string;
  projectId: string;
  sceneId: string;
  prompt: string;
  negativePrompt?: string;
  durationSeconds: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  referenceImageUrls?: string[];
  seed?: number;
  cameraMotion?: string;
}

export interface ProviderSubmission {
  externalJobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'AWAITING_EXTERNAL_ACTION';
  estimatedDurationSeconds?: number;
}

export interface ProviderJobStatus {
  externalJobId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'AWAITING_EXTERNAL_ACTION';
  progressPercentage: number;
  error?: string;
  assetUrls?: string[];
}

export interface VideoProvider {
  readonly id: string;
  readonly name: string;
  readonly isManualHandoff: boolean;
  getCapabilities(): Promise<ProviderCapabilities>;
  submit(request: VideoGenerationRequest): Promise<ProviderSubmission>;
  getStatus(externalJobId: string): Promise<ProviderJobStatus>;
  cancel?(externalJobId: string): Promise<void>;
  fetchResult(externalJobId: string): Promise<{ url: string; mimeType: string; duration: number }[]>;
}

export interface AudioGenerationRequest {
  taskId: string;
  projectId: string;
  sceneId: string;
  text: string;
  language: 'hi' | 'en' | 'hinglish';
  voiceId?: string;
  style?: 'documentary' | 'calm' | 'energetic';
}

export interface AudioProvider {
  readonly id: string;
  readonly name: string;
  synthesizeSpeech(request: AudioGenerationRequest): Promise<{
    externalJobId: string;
    audioUrl?: string;
    durationSeconds?: number;
    filePath?: string;
  }>;
}

