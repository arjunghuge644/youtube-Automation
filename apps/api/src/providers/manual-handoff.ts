import type {
  VideoProvider,
  ProviderCapabilities,
  VideoGenerationRequest,
  ProviderSubmission,
  ProviderJobStatus,
} from './types.js';

export class GoogleFlowManualProvider implements VideoProvider {
  readonly id = 'google_flow';
  readonly name = 'Google Flow (Manual Creative Handoff)';
  readonly isManualHandoff = true;

  async getCapabilities(): Promise<ProviderCapabilities> {
    return {
      textToVideo: true,
      imageToVideo: true,
      referenceImages: true,
      supportedDurations: [3, 4, 5, 6, 8, 10],
      supportedAspectRatios: ['9:16', '16:9', '1:1'],
      nativeAudioSupported: false,
      maxConcurrency: 1,
      costPerSecondUsd: 0,
      isFreeTierEligible: true,
    };
  }

  async submit(request: VideoGenerationRequest): Promise<ProviderSubmission> {
    const externalJobId = `flow_handoff_${request.taskId}`;
    return {
      externalJobId,
      status: 'AWAITING_EXTERNAL_ACTION',
      estimatedDurationSeconds: request.durationSeconds,
    };
  }

  async getStatus(externalJobId: string): Promise<ProviderJobStatus> {
    return {
      externalJobId,
      status: 'AWAITING_EXTERNAL_ACTION',
      progressPercentage: 50,
    };
  }

  async fetchResult(_externalJobId: string): Promise<{ url: string; mimeType: string; duration: number }[]> {
    return [];
  }

  generateHandoffInstructions(request: VideoGenerationRequest): {
    providerUrl: string;
    instructions: string[];
    formattedPrompt: string;
  } {
    return {
      providerUrl: 'https://labs.google/flow',
      formattedPrompt: `${request.prompt} --ar ${request.aspectRatio} --motion ${request.cameraMotion || 'cinematic'}`,
      instructions: [
        'Open Google Flow in your browser (https://labs.google/flow).',
        'Paste the production-ready prompt into the generation prompt bar.',
        `Set canvas aspect ratio to ${request.aspectRatio} and clip duration to ${request.durationSeconds}s.`,
        'Generate the video clip, review the result, and download the MP4.',
        'Upload the generated MP4 file to CreatorFlow AI using the handoff dropzone to resume production.',
      ],
    };
  }
}

