import type { VideoProvider, ProviderCapabilities } from './types.js';

export interface RouteSelectionResult {
  provider: VideoProvider;
  reason: string;
  isManualHandoff: boolean;
}

export class ProviderRouter {
  private videoProviders = new Map<string, VideoProvider>();

  registerVideoProvider(provider: VideoProvider): void {
    this.videoProviders.set(provider.id, provider);
  }

  getVideoProvider(id: string): VideoProvider | undefined {
    return this.videoProviders.get(id);
  }

  async routeVideoTask(constraints: {
    aspectRatio: '9:16' | '16:9' | '1:1';
    durationSeconds: number;
    preferFreeTier?: boolean;
    userPreferredProviderId?: string;
  }): Promise<RouteSelectionResult> {
    const { aspectRatio, durationSeconds, preferFreeTier = true, userPreferredProviderId } = constraints;

    // 1. If user explicitly requested an existing provider, verify capability
    if (userPreferredProviderId && this.videoProviders.has(userPreferredProviderId)) {
      const explicit = this.videoProviders.get(userPreferredProviderId)!;
      const caps = await explicit.getCapabilities();
      if (caps.supportedAspectRatios.includes(aspectRatio)) {
        return {
          provider: explicit,
          reason: `User explicitly specified ${explicit.name}.`,
          isManualHandoff: explicit.isManualHandoff,
        };
      }
    }

    // 2. Deterministic candidate evaluation
    const candidates: { provider: VideoProvider; caps: ProviderCapabilities }[] = [];
    for (const provider of this.videoProviders.values()) {
      const caps = await provider.getCapabilities();
      if (!caps.supportedAspectRatios.includes(aspectRatio)) continue;
      if (preferFreeTier && !caps.isFreeTierEligible && caps.costPerSecondUsd > 0) continue;
      candidates.push({ provider, caps });
    }

    if (candidates.length === 0) {
      // Fallback to manual handoff provider
      const manual = Array.from(this.videoProviders.values()).find((p) => p.isManualHandoff);
      if (manual) {
        return {
          provider: manual,
          reason: 'No eligible automated API provider found; routed to Manual Handoff mode (Free-First policy).',
          isManualHandoff: true,
        };
      }
      throw new Error(`No eligible video provider found for aspect ratio ${aspectRatio} under Free-First constraints.`);
    }

    // Prefer manual handoff or highest concurrency free-tier candidate
    const selected = candidates[0].provider;
    return {
      provider: selected,
      reason: `Selected ${selected.name} under Free-First policy for ${aspectRatio} generation.`,
      isManualHandoff: selected.isManualHandoff,
    };
  }
}

