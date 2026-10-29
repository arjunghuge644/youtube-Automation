import {
  technicalExplainerStoryboardSchema,
  validateExplainerComponentProps,
  type TechnicalExplainerStoryboard,
  type TechnicalExplainerScene,
  type Project,
  type RemotionExplainerComponentType,
} from '@creatorflow/shared';

export class TechnicalExplainerPlanner {
  /**
   * Plans a complete technical explainer storyboard from an arbitrary technical or educational prompt.
   * If Gemini API credentials are provided, it can query Gemini with structured JSON schema constraints.
   * Otherwise, it uses a deterministic technical domain planner conforming strictly to trusted Remotion components.
   */
  async planStoryboard(
    topicPrompt: string,
    options: {
      projectId?: string;
      aspectRatio?: '9:16' | '16:9';
      geminiApiKey?: string;
    } = {}
  ): Promise<TechnicalExplainerStoryboard> {
    const aspectRatio = options.aspectRatio || '9:16';
    const width = aspectRatio === '16:9' ? 1920 : 720;
    const height = aspectRatio === '16:9' ? 1080 : 1280;

    let storyboard: TechnicalExplainerStoryboard;

    if (options.geminiApiKey && options.geminiApiKey.trim()) {
      try {
        storyboard = await this.callGeminiPlanner(topicPrompt, options.geminiApiKey, aspectRatio);
      } catch (geminiError) {
        console.warn(
          '[TechnicalExplainerPlanner] Gemini API planning failed or unavailable; falling back to deterministic planner:',
          (geminiError as Error).message
        );
        storyboard = this.createDeterministicStoryboard(topicPrompt, aspectRatio, width, height);
      }
    } else {
      storyboard = this.createDeterministicStoryboard(topicPrompt, aspectRatio, width, height);
    }

    // Validate component compatibility and sanitize props for every scene before rendering
    return this.validateAndSanitizeStoryboard(storyboard);
  }

  /**
   * Ensures every scene's props conform to the strict Zod schema for its componentType.
   * If any props fail validation, falls back safely to generic_infographic or kinetic_typography.
   */
  validateAndSanitizeStoryboard(storyboard: TechnicalExplainerStoryboard): TechnicalExplainerStoryboard {
    const sanitizedScenes: TechnicalExplainerScene[] = storyboard.scenes.map((scene) => {
      const validation = validateExplainerComponentProps(scene.componentType as RemotionExplainerComponentType, scene.props);
      if (validation.success) {
        return {
          ...scene,
          props: validation.data,
        };
      }

      console.warn(
        `[TechnicalExplainerPlanner] Scene ${scene.sceneNumber} (${scene.componentType}) failed prop validation: ${validation.error}. Falling back to generic_infographic.`
      );

      // Safe fallback to generic_infographic
      const fallbackProps = {
        header: {
          title: scene.header.actTitle || 'SYSTEM OVERVIEW',
          subtitle: scene.narration.substring(0, 50),
          badge: scene.componentType.toUpperCase(),
        },
        sections: [
          {
            title: 'Key Operational Principle',
            body: scene.narration,
            badge: 'OVERVIEW',
          },
        ],
        footerTag: '@creatorflow studio',
      };

      return {
        ...scene,
        componentType: 'generic_infographic' as const,
        props: fallbackProps,
      };
    });

    return {
      ...storyboard,
      scenes: sanitizedScenes,
    };
  }

  private createDeterministicStoryboard(
    prompt: string,
    aspectRatio: '9:16' | '16:9',
    width: number,
    height: number
  ): TechnicalExplainerStoryboard {
    const lower = prompt.toLowerCase();
    const isAuth =
      lower.includes('auth') ||
      lower.includes('authorization') ||
      lower.includes('authentication') ||
      lower.includes('jwt') ||
      lower.includes('rbac');
    const isDistributedHowItWorks =
      lower.includes('how a distributed rate limiter works') ||
      lower.includes('distributed topology') ||
      lower.includes('cluster topology');
    const isRateLimiter =
      lower.includes('rate limit') ||
      lower.includes('throttle') ||
      lower.includes('ddos') ||
      lower.includes('token bucket');
    const isProductPromo =
      lower.includes('product') ||
      lower.includes('advertisement') ||
      lower.includes('promo') ||
      lower.includes('creatorflow') ||
      lower.includes('saas') ||
      lower.includes('launch') ||
      lower.includes('platform');
    const isUrlShortener =
      lower.includes('url shortener') ||
      lower.includes('tinyurl') ||
      lower.includes('bitly');
    const isFoodApp =
      lower.includes('swiggy') ||
      lower.includes('zomato') ||
      lower.includes('food') ||
      lower.includes('delivery');

    if (isAuth) {
      return this.planAuthComparisonStoryboard(aspectRatio, width, height);
    }
    if (isDistributedHowItWorks) {
      return this.planDistributedRateLimiterStoryboard(aspectRatio, width, height);
    }
    if (isRateLimiter) {
      return this.planRateLimiterStoryboard(aspectRatio, width, height);
    }
    if (isProductPromo) {
      return this.planProductAdvertisementStoryboard(aspectRatio, width, height);
    }
    if (isUrlShortener) {
      return this.planUrlShortenerStoryboard(aspectRatio, width, height);
    }
    if (isFoodApp) {
      return this.planFoodAppOrGeneralDbStoryboard(prompt, aspectRatio, width, height);
    }
    // Universal dynamic fallback for arbitrary prompts
    return this.planUniversalFallbackStoryboard(prompt, aspectRatio, width, height);
  }

  /**
   * Video 1: Authentication vs Authorization
   * Components: ComparisonScene, FlowchartScene, DataFlowScene, KineticTypographyScene
   */
  planAuthComparisonStoryboard(
    aspectRatio: '9:16' | '16:9',
    width: number,
    height: number
  ): TechnicalExplainerStoryboard {
    const scenes: TechnicalExplainerScene[] = [
      {
        id: 'scene_01',
        sceneNumber: 1,
        componentType: 'comparison',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Authentication verifies who you are, while authorization controls what you can do. Always authenticate before authorizing.',
        subtitles: [
          { text: 'Authentication verifies who you are, while authorization controls what you can do.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SECURITY ARCHITECTURE · 001',
          channelHandle: '@creatorflow',
          actNumber: '01',
          actTitle: 'AUTHN VS AUTHZ',
        },
        props: {
          title: 'AUTHENTICATION VS AUTHORIZATION',
          versusLabel: 'VS',
          leftSide: {
            title: 'Authentication (AuthN)',
            subtitle: 'Identity Verification',
            badge: 'WHO ARE YOU?',
            accentColor: '#38BDF8',
            items: [
              { title: 'Verifies Identity', description: 'Passwords, MFA, Biometrics, SSO', icon: 'check' },
              { title: 'Produces Credentials', description: 'Issues validated JWT or session token', icon: 'check' },
              { title: 'Happens First', description: 'Identity must precede permissions', icon: 'info' },
            ],
          },
          rightSide: {
            title: 'Authorization (AuthZ)',
            subtitle: 'Permission Verification',
            badge: 'WHAT CAN YOU DO?',
            accentColor: '#F43F5E',
            items: [
              { title: 'Determines Permissions', description: 'RBAC policies & resource scopes', icon: 'check' },
              { title: 'Evaluates Access', description: 'Can user perform action on resource?', icon: 'warning' },
              { title: 'Happens Continuously', description: 'Enforced at every API endpoint', icon: 'info' },
            ],
          },
          verdict: {
            text: 'AuthN proves identity; AuthZ checks privileges. Never confuse the two.',
            winner: 'context_dependent',
          },
        },
      },
      {
        id: 'scene_02',
        sceneNumber: 2,
        componentType: 'flowchart',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Every incoming request first passes through token validation, then hits the RBAC policy engine before reaching protected resources.',
        subtitles: [
          { text: 'Requests pass through token validation, then hit the RBAC policy engine.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SECURITY ARCHITECTURE · 001',
          channelHandle: '@creatorflow',
          actNumber: '02',
          actTitle: 'ACCESS PIPELINE',
        },
        props: {
          title: 'ZERO TRUST ACCESS PIPELINE',
          subtitle: 'End-to-End Verification Pipeline',
          nodes: [
            { id: 'n1', label: 'Client HTTP Request', sublabel: 'Bearer JWT + Payload', type: 'start', status: 'default' },
            { id: 'n2', label: 'AuthN Gate (Gateway)', sublabel: 'Verify JWT signature & TTL', type: 'decision', status: 'active' },
            { id: 'n3', label: 'AuthZ Engine (RBAC)', sublabel: 'Check user permissions & scopes', type: 'decision', status: 'default' },
            { id: 'n4', label: 'Protected Microservice', sublabel: 'Execute business logic', type: 'end', status: 'success' },
          ],
          connections: [
            { from: 'n1', to: 'n2', animated: true, style: 'solid' },
            { from: 'n2', to: 'n3', animated: true, style: 'solid' },
            { from: 'n3', to: 'n4', animated: true, style: 'solid' },
          ],
          activeNodeId: 'n2',
          summaryBadge: { text: 'ZERO TRUST VERIFICATION', type: 'info' },
        },
      },
      {
        id: 'scene_03',
        sceneNumber: 3,
        componentType: 'data_flow',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Clients exchange credentials with an Identity Provider for a signed JWT, allowing stateless verification across microservices in under one millisecond.',
        subtitles: [
          { text: 'Signed cryptographic JWTs enable stateless verification across microservices.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SECURITY ARCHITECTURE · 001',
          channelHandle: '@creatorflow',
          actNumber: '03',
          actTitle: 'TOKEN PIPELINE',
        },
        props: {
          title: 'CRYPTOGRAPHIC TOKEN PIPELINE',
          packetLabel: 'SIGNED JWT',
          stages: [
            { id: 's1', name: 'Client App', type: 'client', throughput: 'Mobile / Web', status: 'healthy' },
            { id: 's2', name: 'Identity Provider', type: 'source', throughput: '1,200 Auth/s', status: 'healthy' },
            { id: 's3', name: 'API Gateway', type: 'processor', throughput: '45,000 req/s', status: 'processing' },
            { id: 's4', name: 'Microservices', type: 'storage', throughput: 'Protected DB', status: 'healthy' },
          ],
          metrics: [
            { label: 'Token TTL', value: '15 min' },
            { label: 'Verification', value: '< 1ms' },
          ],
        },
      },
      {
        id: 'scene_04',
        sceneNumber: 4,
        componentType: 'kinetic_typography',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'In modern cloud systems: AuthN establishes identity, AuthZ restricts permissions. Always enforce least-privilege access.',
        subtitles: [
          { text: 'AuthN establishes identity. AuthZ restricts permissions. Enforce least-privilege.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SECURITY ARCHITECTURE · 001',
          channelHandle: '@creatorflow',
          actNumber: '04',
          actTitle: 'CORE PRINCIPLE',
        },
        props: {
          heading: 'Security Architecture Rule',
          punchline: 'AuthN is Identity. AuthZ is Permission.',
          highlightWord: 'Identity vs Permission.',
          badges: [
            { icon: 'check', text: 'Stateless JWT for Scalable AuthN', status: 'success' },
            { icon: 'check', text: 'Decentralized Policy Engines for AuthZ', status: 'success' },
            { icon: 'bolt', text: 'Enforce Least-Privilege Role Access', status: 'info' },
          ],
        },
      },
    ];

    return technicalExplainerStoryboardSchema.parse({
      topicId: 'SECURITY ARCHITECTURE · 001',
      title: 'Authentication vs Authorization in Cloud Systems',
      category: 'system_design',
      aspectRatio,
      fps: 30,
      width,
      height,
      scenes,
      totalDurationSeconds: 12,
      totalDurationInFrames: 360,
    });
  }

  /**
   * Video 2: How a Distributed Rate Limiter Works
   * Components: NetworkDiagramScene, StatisticsScene, ProcessTimelineScene, SystemArchitectureScene
   */
  planDistributedRateLimiterStoryboard(
    aspectRatio: '9:16' | '16:9',
    width: number,
    height: number
  ): TechnicalExplainerStoryboard {
    const scenes: TechnicalExplainerScene[] = [
      {
        id: 'scene_01',
        sceneNumber: 1,
        componentType: 'network_diagram',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'When handling 100,000 requests per second across multiple API gateways, local in-memory counters fail. You need a centralized distributed rate limiter.',
        subtitles: [
          { text: 'Handling 100k requests across multiple gateways requires a distributed rate limiter.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 007',
          channelHandle: '@creatorflow',
          actNumber: '01',
          actTitle: 'DISTRIBUTED TOPOLOGY',
        },
        props: {
          title: 'DISTRIBUTED RATE LIMITER TOPOLOGY',
          topology: 'hub_spoke',
          centralNode: {
            id: 'hub',
            label: 'REDIS CLUSTER',
            role: 'ATOMIC TOKEN BUCKET & SLIDING WINDOW',
            status: 'active',
          },
          peripheralNodes: [
            { id: 'gw1', label: 'API Gateway Alpha', role: 'Envoy Proxy', latencyMs: 2, status: 'healthy' },
            { id: 'gw2', label: 'API Gateway Beta', role: 'Envoy Proxy', latencyMs: 3, status: 'healthy' },
            { id: 'gw3', label: 'API Gateway Gamma', role: 'Envoy Proxy', latencyMs: 2, status: 'healthy' },
            { id: 'worker1', label: 'Async Task Worker', role: 'Batch Processing', latencyMs: 4, status: 'healthy' },
          ],
          bandwidthMetric: '100,000 QPS',
          securityBadge: 'DDoS Mitigation Active',
        },
      },
      {
        id: 'scene_02',
        sceneNumber: 2,
        componentType: 'statistics',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'During unexpected traffic surges, the rate limiter evaluates client quotas in sub-millisecond time, dropping malicious requests while passing valid traffic.',
        subtitles: [
          { text: 'The limiter evaluates client quotas in sub-millisecond time during traffic spikes.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 007',
          channelHandle: '@creatorflow',
          actNumber: '02',
          actTitle: 'LOAD PERFORMANCE',
        },
        props: {
          headline: 'SYSTEM UNDER 100K QPS SPIKE',
          subheadline: 'Sub-millisecond Throttling & DDoS Protection',
          primaryStat: {
            value: '100,000',
            label: 'Peak QPS Handled',
            change: '+450% Spike',
            trend: 'up',
            unit: 'req/s',
          },
          secondaryStats: [
            { value: '0.8ms', label: 'Redis Latency', detail: 'Atomic Lua eval' },
            { value: '99.99%', label: 'Target Availability', detail: 'Zero downtime' },
          ],
          chartType: 'bars',
          chartData: [
            { label: 'Normal Baseline', value: 20, color: '#38BDF8' },
            { label: 'Flash Sale Spike', value: 92, color: '#FFD166' },
            { label: 'Throttled Dropped', value: 8, color: '#FF5C5C' },
          ],
        },
      },
      {
        id: 'scene_03',
        sceneNumber: 3,
        componentType: 'process_timeline',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Each request triggers an atomic Redis Lua script that calculates token refills and decrements the counter in a single network round-trip.',
        subtitles: [
          { text: 'Atomic Redis Lua scripts calculate token refills and decrements in a single round-trip.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 007',
          channelHandle: '@creatorflow',
          actNumber: '03',
          actTitle: 'TOKEN BUCKET CYCLE',
        },
        props: {
          title: 'TOKEN BUCKET EXECUTION CYCLE',
          subtitle: 'Atomic Redis Lua Algorithm',
          steps: [
            { stepNumber: 1, title: 'Client Request Received', description: 'API gateway extracts client IP and API key', status: 'completed', duration: '0.1ms' },
            { stepNumber: 2, title: 'Atomic Lua Script Execution', description: 'Redis refills tokens and decrements counter', status: 'in_progress', duration: '0.6ms' },
            { stepNumber: 3, title: 'Quota Decision & Routing', description: 'Allow request or return HTTP 429 Too Many Requests', status: 'pending', duration: '0.1ms' },
          ],
          currentStepIndex: 1,
          metric: { label: 'Total Evaluation Time', value: '0.8ms' },
        },
      },
      {
        id: 'scene_04',
        sceneNumber: 4,
        componentType: 'system_architecture',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'To guarantee ultra-high availability, combine a distributed Redis store with a fail-open fallback so rate limiter outages never bring down critical checkout flows.',
        subtitles: [
          { text: 'Combine distributed Redis with fail-open fallback to prevent checkout outages.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 007',
          channelHandle: '@creatorflow',
          actNumber: '04',
          actTitle: 'ARCHITECTURE RESILIENCE',
        },
        props: {
          sourceOfTruth: {
            badge: 'CENTRAL ENFORCER',
            type: 'DISTRIBUTED CACHE',
            name: 'REDIS CLUSTER',
            details: 'sliding window counter',
          },
          branches: [
            { title: 'API GATEWAY', subtitle: 'Envoy / Kong' },
            { title: 'LOCAL MEMORY', subtitle: 'LRU L1 Cache' },
            { title: 'FALLBACK', subtitle: 'Fail-Open Mode' },
          ],
          statusNotes: [
            { icon: 'check', text: 'Atomic Token Bucket in Redis', accent: 'emerald' },
            { icon: 'cross', text: 'Never use SQL for live counters', accent: 'coral' },
          ],
          punchline: {
            text: 'Sub-millisecond decisions require in-memory primitives.',
            highlightWord: 'in-memory primitives.',
          },
        },
      },
    ];

    return technicalExplainerStoryboardSchema.parse({
      topicId: 'SYSTEM DESIGN · 007',
      title: 'How a Distributed Rate Limiter Works at Scale',
      category: 'system_design',
      aspectRatio,
      fps: 30,
      width,
      height,
      scenes,
      totalDurationSeconds: 12,
      totalDurationInFrames: 360,
    });
  }

  /**
   * Video 3: Nontechnical Product Advertisement
   * Components: UIWalkthroughScene, StatisticsScene, GenericInfographicScene, ComparisonScene
   */
  planProductAdvertisementStoryboard(
    aspectRatio: '9:16' | '16:9',
    width: number,
    height: number
  ): TechnicalExplainerStoryboard {
    const scenes: TechnicalExplainerScene[] = [
      {
        id: 'scene_01',
        sceneNumber: 1,
        componentType: 'ui_walkthrough',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Tired of complicated video editing software? Meet CreatorFlow AI, the universal video production platform that turns ideas into studio-grade videos automatically.',
        subtitles: [
          { text: 'Meet CreatorFlow AI: the universal platform that turns ideas into studio-grade videos.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'CREATORFLOW AI · PRODUCT LAUNCH',
          channelHandle: '@creatorflow',
          actNumber: '01',
          actTitle: 'STUDIO OVERVIEW',
        },
        props: {
          appName: 'CreatorFlow AI',
          appUrl: 'app.creatorflow.io',
          windowTitle: 'Automated Production Studio',
          previewMetrics: [
            { label: 'Rendering Speed', value: '10x Faster' },
            { label: 'Cost Per Video', value: '$0.00 Free-First' },
            { label: 'Quality Pass Rate', value: '100% QA' },
          ],
          highlights: [
            { targetArea: 'planner', title: 'AI Storyboard Intelligence', description: 'Convert raw concepts into animated motion graphics in seconds.', badge: 'NEW', stepNumber: 1 },
            { targetArea: 'timeline', title: 'Deterministic Assembly', description: 'Frame-accurate synchronization with automated subtitles & voiceover.', stepNumber: 2 },
          ],
          callToAction: {
            text: 'Experience universal AI video orchestration today.',
            buttonLabel: 'Start Creating Free',
          },
        },
      },
      {
        id: 'scene_02',
        sceneNumber: 2,
        componentType: 'statistics',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Creators save up to ten times the production time. Zero manual keyframing, zero rendering crashes, and zero unexpected API costs.',
        subtitles: [
          { text: 'Creators save 10x production time with zero crashes and zero API costs.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'CREATORFLOW AI · PRODUCT LAUNCH',
          channelHandle: '@creatorflow',
          actNumber: '02',
          actTitle: 'PROVEN EFFICIENCY',
        },
        props: {
          headline: '10X FASTER PRODUCTION VELOCITY',
          subheadline: 'Accelerate Your Content Pipeline Without Overhead',
          primaryStat: {
            value: '10x',
            label: 'Faster Production Turnaround',
            change: 'From 4 Hours to 25s',
            trend: 'up',
          },
          secondaryStats: [
            { value: '100%', label: 'Deterministic QA Pass', detail: 'Zero render failures' },
            { value: '$0.00', label: 'Infrastructure Cost', detail: 'Zero paid API lock-in' },
          ],
          chartType: 'bars',
          chartData: [
            { label: 'Traditional Video Editing', value: 15, color: '#FF5C5C' },
            { label: 'CreatorFlow Automation', value: 95, color: '#10B981' },
          ],
        },
      },
      {
        id: 'scene_03',
        sceneNumber: 3,
        componentType: 'generic_infographic',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Whether you produce educational explainers, product launches, or viral shorts, CreatorFlow handles planning, narration, and assembly in one unified pipeline.',
        subtitles: [
          { text: 'From explainers to brand promos, CreatorFlow orchestrates planning, narration & assembly.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'CREATORFLOW AI · PRODUCT LAUNCH',
          channelHandle: '@creatorflow',
          actNumber: '03',
          actTitle: 'PLATFORM CAPABILITIES',
        },
        props: {
          header: {
            title: 'UNIVERSAL VIDEO PRODUCTION PLATFORM',
            subtitle: 'Built for every category and aspect ratio',
            badge: 'ALL-IN-ONE',
          },
          sections: [
            { title: 'Universal Storytelling', body: 'Produce technical explainers, product ads, animated stories, and shorts with ease.', badge: 'FLEXIBLE', accentColor: '#38BDF8' },
            { title: 'Autonomous Media Assembly', body: 'FFmpeg and Remotion seamlessly assemble synchronized audio, captions, and graphics.', badge: 'POWERFUL', accentColor: '#10B981' },
            { title: 'Intelligent Scene Repair', body: 'Regenerate single scenes on demand without rebuilding the entire project.', badge: 'SMART', accentColor: '#FFD166' },
          ],
          callout: {
            quote: 'CreatorFlow AI redefines how creators and engineers produce educational content.',
            authorOrSource: 'CreatorFlow Architecture Team',
          },
          footerTag: 'OPEN ARCHITECTURE · DETERMINISTIC QUALITY',
        },
      },
      {
        id: 'scene_04',
        sceneNumber: 4,
        componentType: 'comparison',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Ditch the fragmented manual editing tools. Upgrade to CreatorFlow AI and scale your video production with deterministic precision.',
        subtitles: [
          { text: 'Ditch fragmented editing tools. Upgrade to CreatorFlow AI and scale your production.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'CREATORFLOW AI · PRODUCT LAUNCH',
          channelHandle: '@creatorflow',
          actNumber: '04',
          actTitle: 'THE VERDICT',
        },
        props: {
          title: 'THE MODERN WAY TO PRODUCE VIDEO',
          versusLabel: 'VS',
          leftSide: {
            title: 'Traditional Video Editing',
            subtitle: 'Fragmented & Slow',
            badge: 'LEGACY',
            accentColor: '#F43F5E',
            items: [
              { title: 'Manual Timeline Editing', description: 'Hours spent slicing clips and aligning audio', icon: 'cross' },
              { title: 'Expensive Subscriptions', description: 'Costly proprietary tools and paid APIs', icon: 'cross' },
              { title: 'Fragile Exports', description: 'Corrupted frames and missing subtitle sync', icon: 'warning' },
            ],
          },
          rightSide: {
            title: 'CreatorFlow AI Studio',
            subtitle: 'Autonomous & Free-First',
            badge: 'FUTURE',
            accentColor: '#10B981',
            items: [
              { title: 'Full Automation', description: 'Instant script, voiceover, and motion graphics', icon: 'check' },
              { title: 'Free-First Policy', description: 'Runs locally with zero external API fees', icon: 'check' },
              { title: 'Automated QA Verification', description: 'Technical validation before every delivery', icon: 'check' },
            ],
          },
          verdict: {
            text: 'Automate your production lifecycle and deliver studio-quality video at scale.',
            winner: 'right',
          },
        },
      },
    ];

    return technicalExplainerStoryboardSchema.parse({
      topicId: 'CREATORFLOW AI · PRODUCT LAUNCH',
      title: 'CreatorFlow AI: The Universal Video Production Platform',
      category: 'product_advertisement',
      aspectRatio,
      fps: 30,
      width,
      height,
      scenes,
      totalDurationSeconds: 12,
      totalDurationInFrames: 360,
    });
  }

  /**
   * Universal dynamic fallback: builds a coherent multi-scene storyboard for any prompt.
   */
  planUniversalFallbackStoryboard(
    prompt: string,
    aspectRatio: '9:16' | '16:9',
    width: number,
    height: number
  ): TechnicalExplainerStoryboard {
    const cleanTitle = prompt.trim().substring(0, 50) || 'Universal Technical Explainer';
    const scenes: TechnicalExplainerScene[] = [
      {
        id: 'scene_01',
        sceneNumber: 1,
        componentType: 'generic_infographic',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: `Understanding ${cleanTitle} requires analyzing its core concepts, system requirements, and real-world implementation.`,
        subtitles: [
          { text: `Understanding ${cleanTitle}: core concepts, requirements, and implementation.`, startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'OVERVIEW · 001',
          channelHandle: '@creatorflow',
          actNumber: '01',
          actTitle: 'FOUNDATION',
        },
        props: {
          header: {
            title: cleanTitle.toUpperCase(),
            subtitle: 'Fundamental Architecture & Principles',
            badge: 'OVERVIEW',
          },
          sections: [
            { title: 'Problem Definition', body: `Why ${cleanTitle} is critical in modern engineering.`, badge: 'CONTEXT' },
            { title: 'Core Approach', body: 'Structured breakdown and deterministic execution.', badge: 'METHOD' },
          ],
          callout: {
            quote: 'Great engineering starts with clear conceptual understanding.',
            authorOrSource: 'CreatorFlow AI',
          },
        },
      },
      {
        id: 'scene_02',
        sceneNumber: 2,
        componentType: 'concept_breakdown',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Every robust system is built on solid architectural pillars that guarantee reliability, scalability, and performance.',
        subtitles: [
          { text: 'Built on architectural pillars that guarantee reliability, scalability, and performance.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'PILLARS · 001',
          channelHandle: '@creatorflow',
          actNumber: '02',
          actTitle: 'CORE PILLARS',
        },
        props: {
          coreConcept: {
            title: cleanTitle,
            category: 'ARCHITECTURE',
          },
          pillars: [
            { title: 'Reliability & Fault Tolerance', description: 'Prevent single points of failure through redundancy.', tag: 'STABILITY' },
            { title: 'Horizontal Scalability', description: 'Scale workloads dynamically without state bottlenecks.', tag: 'SCALE' },
            { title: 'Low Latency Performance', description: 'Optimize critical execution paths for sub-millisecond response.', tag: 'SPEED' },
          ],
          takeaway: {
            headline: 'Design for failure and decouple state from execution.',
          },
        },
      },
      {
        id: 'scene_03',
        sceneNumber: 3,
        componentType: 'statistics',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Measured benchmarks demonstrate measurable gains in throughput, availability, and resource efficiency.',
        subtitles: [
          { text: 'Measured benchmarks demonstrate significant throughput and efficiency gains.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'BENCHMARK · 001',
          channelHandle: '@creatorflow',
          actNumber: '03',
          actTitle: 'METRICS',
        },
        props: {
          headline: 'KEY PERFORMANCE BENCHMARKS',
          subheadline: 'Efficiency and Scalability Impact',
          primaryStat: {
            value: '99.99%',
            label: 'Availability SLA',
            change: '+15% Improvement',
            trend: 'up',
          },
          secondaryStats: [
            { value: '< 5ms', label: 'P99 Latency' },
            { value: '10x', label: 'Throughput Multiplier' },
          ],
          chartType: 'bars',
          chartData: [
            { label: 'Unoptimized Baseline', value: 25, color: '#FF5C5C' },
            { label: 'Optimized System', value: 95, color: '#10B981' },
          ],
        },
      },
      {
        id: 'scene_04',
        sceneNumber: 4,
        componentType: 'kinetic_typography',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: `In conclusion, mastering ${cleanTitle} empowers teams to build scalable, resilient digital products.`,
        subtitles: [
          { text: `Mastering ${cleanTitle} empowers teams to build scalable, resilient digital products.`, startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SUMMARY · 001',
          channelHandle: '@creatorflow',
          actNumber: '04',
          actTitle: 'SUMMARY',
        },
        props: {
          heading: 'Core Takeaway',
          punchline: `${cleanTitle}: Decouple, Scale & Measure.`,
          highlightWord: 'Scale & Measure.',
          badges: [
            { icon: 'check', text: 'Deterministic Architecture', status: 'success' },
            { icon: 'check', text: 'Production Proven Reliability', status: 'success' },
          ],
        },
      },
    ];

    return technicalExplainerStoryboardSchema.parse({
      topicId: 'UNIVERSAL · 001',
      title: cleanTitle,
      category: 'educational',
      aspectRatio,
      fps: 30,
      width,
      height,
      scenes,
      totalDurationSeconds: 12,
      totalDurationInFrames: 360,
    });
  }

  private planRateLimiterStoryboard(
    aspectRatio: '9:16' | '16:9',
    width: number,
    height: number
  ): TechnicalExplainerStoryboard {
    const scenes: TechnicalExplainerScene[] = [
      {
        id: 'scene_01',
        sceneNumber: 1,
        componentType: 'interview_question',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Interviewer: How would you rate-limit 100,000 requests per second across a distributed microservice cluster?',
        subtitles: [
          { text: 'Interviewer: Rate-limit 100k requests per second across a cluster.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 007',
          channelHandle: '@creatorflow',
          actNumber: '00',
          actTitle: 'THE QUESTION',
        },
        props: {
          headerText: 'INTERVIEWER:',
          timestampText: '● 00:03',
          question: 'How to rate-limit 100k req/sec across servers?',
          underlinedKeyword: '100k req/sec',
          punchline: 'Which algorithm?',
          highlightWord: 'algorithm?',
          options: [
            { id: 1, label: 'CANDIDATE 1', text: 'In-Memory HashMap', strikethrough: true, badge: 'DOES NOT SCALE' },
            { id: 2, label: 'CANDIDATE 2', text: 'SQL Database Locks', strikethrough: true, badge: 'TOO SLOW' },
          ],
        },
      },
      {
        id: 'scene_02',
        sceneNumber: 2,
        componentType: 'database_transaction',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Using SQL database rows for request counters causes massive lock contention and timeouts under heavy traffic.',
        subtitles: [
          { text: 'SQL rows for request counters cause severe lock contention and timeouts.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 007',
          channelHandle: '@creatorflow',
          actNumber: '01',
          actTitle: 'DATABASE OVERLOAD',
        },
        props: {
          transaction: {
            time: '12:00:01',
            item: 'API /checkout',
            amount: '100k req',
            paymentMethod: 'Cluster A',
            status: 'FAILED',
          },
          database: {
            name: 'POSTGRES',
            type: 'request counters',
            columns: [
              { label: 'LOCK WAIT', value: '4,200ms', color: '#FF5C5C' },
              { label: 'THROUGHPUT', value: '1.2k/s', color: '#FFFFFF' },
            ],
          },
          steps: [
            { stepNumber: 1, title: 'SELECT FOR UPDATE counter', status: 'success' },
            { stepNumber: 2, title: 'UPDATE counter + 1', status: 'failed', errorMsg: 'LOCK TIMEOUT' },
          ],
          crashAlert: { triggerAtStep: 2, message: 'DB CONNECTION POOL EXHAUSTED' },
          impactText: { text: '504 Gateway Timeout', color: '#FF5C5C' },
        },
      },
      {
        id: 'scene_03',
        sceneNumber: 3,
        componentType: 'cache_layer',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'A Redis cluster using Lua scripts executes atomic token-bucket increments in sub-millisecond memory.',
        subtitles: [
          { text: 'Redis with atomic Lua scripts checks limits in sub-millisecond memory.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 007',
          channelHandle: '@creatorflow',
          actNumber: '02',
          actTitle: 'ATOMIC CACHE',
        },
        props: {
          clientGrid: { rows: 2, columns: 9, activeCount: 18 },
          cache: {
            name: 'REDIS CLUSTER (Token Bucket)',
            status: 'HIT',
            ttl: '1:00',
          },
          transferBadge: 'LUA SCRIPT',
          database: {
            name: 'API GATEWAY',
            loadPercentage: 20,
            operations: ['token check', 'refill rate', 'atomic decr'],
            updatedItem: {
              label: 'BUCKET',
              name: 'User 4829',
              oldValue: '100 req',
              newValue: '99 req',
            },
          },
          incomingOrders: ['ALLOW', 'ALLOW'],
        },
      },
      {
        id: 'scene_04',
        sceneNumber: 4,
        componentType: 'system_architecture',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'The API Gateway delegates rate checking to Redis with local in-memory fallback, shielding downstream services.',
        subtitles: [
          { text: 'API Gateway shields downstream services via distributed Redis rate checks.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 007',
          channelHandle: '@creatorflow',
          actNumber: '03',
          actTitle: 'SYSTEM ARCHITECTURE',
        },
        props: {
          sourceOfTruth: {
            badge: 'CENTRAL ENFORCER',
            type: 'DISTRIBUTED CACHE',
            name: 'REDIS CLUSTER',
            details: 'sliding window counter',
          },
          branches: [
            { title: 'API GATEWAY', subtitle: 'Envoy / Kong' },
            { title: 'LOCAL MEMORY', subtitle: 'LRU L1 Cache' },
            { title: 'FALLBACK', subtitle: 'Degraded Pass' },
          ],
          statusNotes: [
            { icon: 'check', text: 'Atomic Token Bucket in Redis', accent: 'emerald' },
            { icon: 'cross', text: 'Never use SQL for live counters', accent: 'coral' },
          ],
          punchline: {
            text: 'Sub-millisecond decisions require in-memory primitives.',
            highlightWord: 'in-memory primitives.',
          },
        },
      },
      {
        id: 'scene_05',
        sceneNumber: 5,
        componentType: 'kinetic_typography',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'High throughput rate limiting requires sliding window logs or token buckets in memory, never disk-bound locks.',
        subtitles: [
          { text: 'Rate limiting requires in-memory sliding windows, never disk-bound locks.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 007',
          channelHandle: '@creatorflow',
          actNumber: '04',
          actTitle: 'THE VERDICT',
        },
        props: {
          heading: 'Core Takeaway',
          punchline: 'Distributed Rate Limiting: Token Bucket in Redis.',
          highlightWord: 'Token Bucket in Redis.',
          badges: [
            { icon: 'check', text: 'Redis Atomic Lua Scripting', status: 'success' },
            { icon: 'check', text: 'Sliding Window Counter Accuracy', status: 'success' },
            { icon: 'check', text: 'Graceful Degradation on Outage', status: 'success' },
          ],
        },
      },
    ];

    return technicalExplainerStoryboardSchema.parse({
      topicId: 'SYSTEM DESIGN · 007',
      title: 'Distributed Rate Limiter at 100k QPS',
      category: 'system_design',
      aspectRatio,
      fps: 30,
      width,
      height,
      scenes,
      totalDurationSeconds: 15,
      totalDurationInFrames: 450,
    });
  }

  private planUrlShortenerStoryboard(
    aspectRatio: '9:16' | '16:9',
    width: number,
    height: number
  ): TechnicalExplainerStoryboard {
    const scenes: TechnicalExplainerScene[] = [
      {
        id: 'scene_01',
        sceneNumber: 1,
        componentType: 'interview_question',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Interviewer: Design a URL Shortener like TinyURL that generates unique, non-colliding 7-character links for billions of URLs.',
        subtitles: [
          { text: 'Interviewer: Design a high-scale URL shortener with zero collisions.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 003',
          channelHandle: '@creatorflow',
          actNumber: '00',
          actTitle: 'THE QUESTION',
        },
        props: {
          headerText: 'INTERVIEWER:',
          timestampText: '● 00:03',
          question: 'Generate unique 7-char short links for 10B URLs.',
          underlinedKeyword: 'unique 7-char short links',
          punchline: 'MD5 Hash or Base62?',
          highlightWord: 'Base62?',
          options: [
            { id: 1, label: 'CANDIDATE 1', text: 'MD5 Hash First 7 Chars', strikethrough: true, badge: 'COLLISIONS!' },
            { id: 2, label: 'CANDIDATE 2', text: 'UUID Generator', strikethrough: true, badge: 'TOO LONG' },
          ],
        },
      },
      {
        id: 'scene_02',
        sceneNumber: 2,
        componentType: 'search_engine',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'MD5 hashing truncations produce hash collisions that corrupt user links. A distributed counter with Base62 encoding guarantees uniqueness.',
        subtitles: [
          { text: 'Base62 encoding of a distributed counter guarantees zero collisions.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 003',
          channelHandle: '@creatorflow',
          actNumber: '01',
          actTitle: 'ENCODING LOGIC',
        },
        props: {
          searchQuery: 'https://very-long-url.com/article/1932',
          hasTypo: false,
          typoLabel: 'SHORTENED',
          engine: {
            name: 'BASE62 ENCODER',
            technology: '[0-9a-zA-Z] (62^7 = 3.5 Trillion URLs)',
            tokens: ['id: 18291024', 'base62', '->', 'aX9k2Lq'],
            fuzzyMatch: 'tiny.url/aX9k2Lq',
          },
        },
      },
      {
        id: 'scene_03',
        sceneNumber: 3,
        componentType: 'cache_layer',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Reads outnumber writes 100 to 1. A distributed Redis cache serves hot redirects in under 5 milliseconds.',
        subtitles: [
          { text: 'Reads outnumber writes 100 to 1. Redis serves hot links under 5ms.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 003',
          channelHandle: '@creatorflow',
          actNumber: '02',
          actTitle: 'READ CACHING',
        },
        props: {
          clientGrid: { rows: 2, columns: 9, activeCount: 16 },
          cache: {
            name: 'REDIS CACHE (LRU)',
            status: 'HIT',
            ttl: '24:00',
          },
          transferBadge: '301 REDIRECT',
          database: {
            name: 'SQL MAPPINGS (Postgres / MySQL)',
            loadPercentage: 15,
            operations: ['id lookup', 'analytics write', 'ttl refresh'],
            updatedItem: {
              label: 'REDIRECT',
              name: 'tiny.url/aX9k2Lq',
              oldValue: 'miss',
              newValue: 'hit 2ms',
            },
          },
          incomingOrders: ['301 MOVED', '301 MOVED'],
        },
      },
      {
        id: 'scene_04',
        sceneNumber: 4,
        componentType: 'system_architecture',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'A Range-Based ID Generator allocates unique counter blocks to app servers, eliminating synchronization bottlenecks.',
        subtitles: [
          { text: 'Range-Based ID allocation eliminates counter bottlenecks across servers.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 003',
          channelHandle: '@creatorflow',
          actNumber: '03',
          actTitle: 'SYSTEM ARCHITECTURE',
        },
        props: {
          sourceOfTruth: {
            badge: 'ID GENERATOR',
            type: 'ZOOKEEPER / ETCD',
            name: 'RANGE ALLOCATOR',
            details: '1M IDs per server block',
          },
          branches: [
            { title: 'APP SERVERS', subtitle: 'Base62 encode' },
            { title: 'REDIS CACHE', subtitle: 'Hot link reads' },
            { title: 'PERSISTENCE', subtitle: 'NoSQL / SQL' },
          ],
          statusNotes: [
            { icon: 'check', text: 'Base62 with Counter Blocks', accent: 'emerald' },
            { icon: 'cross', text: 'Avoid random string collision loops', accent: 'coral' },
          ],
          punchline: {
            text: 'Predictable ID generation scales better than guessing.',
            highlightWord: 'Predictable ID generation',
          },
        },
      },
      {
        id: 'scene_05',
        sceneNumber: 5,
        componentType: 'kinetic_typography',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Designing high-scale systems means using deterministic math instead of collision checks and retry loops.',
        subtitles: [
          { text: 'Use deterministic math instead of collision checks and retry loops.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 003',
          channelHandle: '@creatorflow',
          actNumber: '04',
          actTitle: 'THE VERDICT',
        },
        props: {
          heading: 'System Design Rule',
          punchline: 'Deterministic IDs beat Hash Collisions every time.',
          highlightWord: 'Deterministic IDs',
          badges: [
            { icon: 'check', text: 'Base62 (62^7 = 3.5 Trillion URLs)', status: 'success' },
            { icon: 'check', text: '100:1 Read-to-Write Ratio Caching', status: 'success' },
            { icon: 'check', text: '301 Permanent Redirect for Browser Cache', status: 'success' },
          ],
        },
      },
    ];

    return technicalExplainerStoryboardSchema.parse({
      topicId: 'SYSTEM DESIGN · 003',
      title: 'Scalable URL Shortener Architecture',
      category: 'system_design',
      aspectRatio,
      fps: 30,
      width,
      height,
      scenes,
      totalDurationSeconds: 15,
      totalDurationInFrames: 450,
    });
  }

  private planFoodAppOrGeneralDbStoryboard(
    prompt: string,
    aspectRatio: '9:16' | '16:9',
    width: number,
    height: number
  ): TechnicalExplainerStoryboard {
    // Matches the multi-component reference benchmark
    const scenes: TechnicalExplainerScene[] = [
      {
        id: 'scene_01',
        sceneNumber: 1,
        componentType: 'interview_question',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Interviewer: Build a food app like Swiggy or Zomato. Which database do you choose?',
        subtitles: [
          { text: 'Interviewer: Build a food app like Swiggy or Zomato.', startSeconds: 0.2, endSeconds: 1.8 },
          { text: 'Which database do you choose?', startSeconds: 1.8, endSeconds: 2.9 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 002',
          channelHandle: '@creatorflow',
          actNumber: '00',
          actTitle: 'THE QUESTION',
        },
        props: {
          headerText: 'INTERVIEWER:',
          timestampText: '● 00:03',
          question: 'Build a food app like Swiggy or Zomato.',
          underlinedKeyword: 'Swiggy or Zomato.',
          punchline: 'Which database?',
          highlightWord: 'database?',
          options: [
            { id: 1, label: 'CANDIDATE 1', text: 'NoSQL — it scales', strikethrough: true, badge: 'ONE NAME' },
            { id: 2, label: 'CANDIDATE 2', text: 'Only Postgres', strikethrough: true, badge: 'ONE NAME' },
          ],
        },
      },
      {
        id: 'scene_02',
        sceneNumber: 2,
        componentType: 'database_transaction',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'A naive NoSQL choice without ACID guarantees leaves users stranded when servers crash mid-payment.',
        subtitles: [
          { text: 'Without ACID guarantees, server crashes deduct money with zero order created.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 002',
          channelHandle: '@creatorflow',
          actNumber: '01',
          actTitle: 'ONE DATABASE',
        },
        props: {
          transaction: {
            time: '8:30 PM',
            item: 'Chicken Biryani',
            amount: '₹250',
            paymentMethod: 'wallet',
            status: 'PAID',
          },
          database: {
            name: 'POSTGRES',
            type: 'main database',
            columns: [
              { label: 'WALLET', value: '₹750', color: '#FF5C5C' },
              { label: 'ORDERS', value: '0', color: '#FFFFFF' },
            ],
          },
          steps: [
            { stepNumber: 1, title: 'wallet -₹250', status: 'success' },
            { stepNumber: 2, title: 'create order', status: 'failed', errorMsg: 'SERVER CRASH' },
          ],
          crashAlert: { triggerAtStep: 2, message: 'SERVER CRASH' },
          impactText: { text: '₹250 gone', color: '#FF5C5C' },
        },
      },
      {
        id: 'scene_03',
        sceneNumber: 3,
        componentType: 'cache_layer',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Peak dinner rush crushes the primary database with menu reads. Redis in-memory caching relieves 80% of the read load.',
        subtitles: [
          { text: 'Peak dinner rush crushes the database. Redis in-memory absorbs 80% read load.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 002',
          channelHandle: '@creatorflow',
          actNumber: '02',
          actTitle: 'DINNER RUSH',
        },
        props: {
          clientGrid: { rows: 2, columns: 9, activeCount: 16 },
          cache: {
            name: 'CACHE · REDIS (in memory)',
            status: 'HIT',
            ttl: '0:00',
          },
          transferBadge: 'MENU COPY',
          database: {
            name: 'POSTGRES main database',
            loadPercentage: 25,
            operations: ['save order', 'rebuild menu', 'save order'],
            updatedItem: {
              label: 'MENU',
              name: 'Biryani',
              oldValue: '₹250',
              newValue: '₹270',
            },
          },
          incomingOrders: ['ORDER', 'ORDER'],
        },
      },
      {
        id: 'scene_04',
        sceneNumber: 4,
        componentType: 'search_engine',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Customers make spelling mistakes when searching. Elasticsearch provides typo-tolerant fuzzy matching.',
        subtitles: [
          { text: 'Customers make typos. Elasticsearch inverted indexes handle fuzzy matching.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 002',
          channelHandle: '@creatorflow',
          actNumber: '03',
          actTitle: 'THE TYPO',
        },
        props: {
          searchQuery: 'biryni',
          hasTypo: true,
          typoLabel: 'TYPO',
          engine: {
            name: 'SEARCH ENGINE',
            technology: 'Elasticsearch',
            tokens: ['bir', 'iry', 'rya', 'ani'],
            fuzzyMatch: 'Biryani',
          },
        },
      },
      {
        id: 'scene_05',
        sceneNumber: 5,
        componentType: 'geospatial_map',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Thousands of delivery drivers ping locations every three seconds. Redis GEO with Geohash cells tracks rider proximity in real time.',
        subtitles: [
          { text: 'Thousands of drivers ping coordinates. Redis GEO tracks proximity in real time.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 002',
          channelHandle: '@creatorflow',
          actNumber: '04',
          actTitle: 'THE RIDER',
        },
        props: {
          customer: {
            label: 'Customer',
            radiusKm: 3,
          },
          riderCount: 35,
          dataStreamLabel: 'LOCATION WRITES',
          writeCount: '2,434',
          loadPercentage: 75,
          indexCard: {
            title: 'GEO INDEX · geohash cells',
            subtitle: 'e.g. Redis GEO, in memory',
          },
        },
      },
      {
        id: 'scene_06',
        sceneNumber: 6,
        componentType: 'system_architecture',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'Start with Postgres as your single source of truth for money, and branch specialized workloads to Cache, Search, and Geo indexes.',
        subtitles: [
          { text: 'Postgres as single source of truth, branching to Cache, Search, and Geo Index.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 002',
          channelHandle: '@creatorflow',
          actNumber: '05',
          actTitle: 'THE ARCHITECTURE',
        },
        props: {
          sourceOfTruth: {
            badge: 'SOURCE OF TRUTH',
            type: 'RELATIONAL DB',
            name: 'POSTGRES',
            details: 'orders + money',
          },
          branches: [
            { title: 'CACHE', subtitle: 'copy, expires' },
            { title: 'SEARCH ENGINE', subtitle: 'copy' },
            { title: 'GEO INDEX', subtitle: 'live, seconds' },
          ],
          statusNotes: [
            { icon: 'check', text: 'Start with Postgres', accent: 'emerald' },
            { icon: 'cross', text: '...and stop there', accent: 'coral' },
          ],
          punchline: {
            text: '"It scales" is a slogan, not a reason.',
            highlightWord: '"It scales"',
          },
        },
      },
      {
        id: 'scene_07',
        sceneNumber: 7,
        componentType: 'kinetic_typography',
        durationSeconds: 3,
        durationInFrames: 90,
        narration: 'No single database does everything. Real system design uses the right tool for each workload.',
        subtitles: [
          { text: 'Real system design uses the right tool for each workload.', startSeconds: 0.2, endSeconds: 2.8 },
        ],
        header: {
          topicTag: 'SYSTEM DESIGN · 002',
          channelHandle: '@creatorflow',
          actNumber: '06',
          actTitle: 'THE VERDICT',
        },
        props: {
          heading: 'Architecture Principle',
          punchline: 'Polyglot Persistence: Right tool for right workload.',
          highlightWord: 'Polyglot Persistence:',
          badges: [
            { icon: 'check', text: 'Postgres for ACID Financial Ledger', status: 'success' },
            { icon: 'check', text: 'Redis for Caching & Geohash', status: 'success' },
            { icon: 'check', text: 'Elasticsearch for Fuzzy Search', status: 'success' },
          ],
        },
      },
    ];

    return technicalExplainerStoryboardSchema.parse({
      topicId: 'SYSTEM DESIGN · 002',
      title: 'Food App Database Architecture & System Design',
      category: 'system_design',
      aspectRatio,
      fps: 30,
      width,
      height,
      scenes,
      totalDurationSeconds: 21,
      totalDurationInFrames: 630,
    });
  }

  private async callGeminiPlanner(
    topicPrompt: string,
    apiKey: string,
    aspectRatio: '9:16' | '16:9'
  ): Promise<TechnicalExplainerStoryboard> {
    const systemPrompt = `You are the Principal Systems Architect and Creative Director at CreatorFlow AI.
Your task is to transform technical topics into structured storyboard JSON for Remotion animation.
CRITICAL CONSTRAINT: You must ONLY select and configure the trusted registered Remotion components:
- comparison (for comparative analysis, pros/cons, trade-offs)
- flowchart (for decision trees, execution workflows, pipelines)
- process_timeline (for sequential steps, lifecycles, and phases)
- concept_breakdown (for architectural pillars, core principles)
- statistics (for KPIs, throughput numbers, performance charts)
- data_flow (for streaming pipelines, packet routing, event flow)
- ui_walkthrough (for software UI mockups, SaaS dashboards, feature tours)
- network_diagram (for distributed topologies, client-server architectures)
- generic_infographic (for structured multi-section infographics)
- kinetic_typography (for high-impact punchlines, summaries, and key takeaways)
- interview_question (for technical interview setups and options)
- database_transaction (for ACID transactions, locks, and crashes)
- cache_layer (for cache hits/misses, Redis, TTL)
- search_engine (for inverted indexes, typo fuzzy matching)
- geospatial_map (for geohashes, driver/rider coordinates)
- system_architecture (for source of truth and branching topology)

Guidelines:
- Analyze semantic intent for each scene: do NOT repeat the same component consecutively.
- Pacing: assign realistic 2.5s to 4.5s durations based on narration density.
- Safe areas: keep titles concise and text within 9:16 vertical boundaries.
- Never generate arbitrary executable React code, JSX, or HTML. Only return valid JSON matching TechnicalExplainerStoryboard.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nTopic: ${topicPrompt}` }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const result = await response.json() as any;
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API returned empty response');
    }

    const parsed = JSON.parse(text);
    return technicalExplainerStoryboardSchema.parse(parsed);
  }
}

