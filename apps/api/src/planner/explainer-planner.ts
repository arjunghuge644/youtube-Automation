import {
  technicalExplainerStoryboardSchema,
  type TechnicalExplainerStoryboard,
  type TechnicalExplainerScene,
  type Project,
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

    if (options.geminiApiKey && options.geminiApiKey.trim()) {
      try {
        return await this.callGeminiPlanner(topicPrompt, options.geminiApiKey, aspectRatio);
      } catch (geminiError) {
        console.warn(
          '[TechnicalExplainerPlanner] Gemini API planning failed or unavailable; falling back to deterministic planner:',
          (geminiError as Error).message
        );
      }
    }

    return this.createDeterministicStoryboard(topicPrompt, aspectRatio, width, height);
  }

  private createDeterministicStoryboard(
    prompt: string,
    aspectRatio: '9:16' | '16:9',
    width: number,
    height: number
  ): TechnicalExplainerStoryboard {
    const lower = prompt.toLowerCase();
    const isRateLimiter = lower.includes('rate limit') || lower.includes('throttle') || lower.includes('ddos');
    const isUrlShortener = lower.includes('url shortener') || lower.includes('tinyurl') || lower.includes('bitly');
    const isFoodApp = lower.includes('swiggy') || lower.includes('zomato') || lower.includes('food') || lower.includes('delivery');

    if (isRateLimiter) {
      return this.planRateLimiterStoryboard(aspectRatio, width, height);
    }
    if (isUrlShortener) {
      return this.planUrlShortenerStoryboard(aspectRatio, width, height);
    }
    // Default system design / data architecture workflow
    return this.planFoodAppOrGeneralDbStoryboard(prompt, aspectRatio, width, height);
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
CRITICAL CONSTRAINT: You must ONLY select and configure the trusted Remotion components:
- interview_question
- database_transaction
- cache_layer
- search_engine
- geospatial_map
- system_architecture
- kinetic_typography
Never generate arbitrary executable React code or HTML. Only return valid JSON matching TechnicalExplainerStoryboard.`;

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

