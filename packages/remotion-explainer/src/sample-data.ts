import type { TechnicalExplainerStoryboard } from '@creatorflow/shared';

export const sampleExplainerStoryboard: TechnicalExplainerStoryboard = {
  topicId: 'SYSTEM DESIGN · 002',
  title: 'Food App Database Architecture & System Design',
  category: 'system_design',
  aspectRatio: '9:16',
  fps: 30,
  width: 720,
  height: 1280,
  totalDurationSeconds: 21,
  totalDurationInFrames: 630,
  scenes: [
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
      narration: 'If you pick pure NoSQL without ACID transactions, a sudden server crash deducts money with zero order created.',
      subtitles: [
        { text: 'A sudden server crash deducts money with zero order created.', startSeconds: 0.3, endSeconds: 2.8 },
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
        crashAlert: {
          triggerAtStep: 2,
          message: 'SERVER CRASH',
        },
        impactText: {
          text: '₹250 gone',
          color: '#FF5C5C',
        },
      },
    },
    {
      id: 'scene_03',
      sceneNumber: 3,
      componentType: 'cache_layer',
      durationSeconds: 3,
      durationInFrames: 90,
      narration: 'During peak dinner rush, hitting Postgres directly crushes the database. Adding Redis in-memory absorbs the read load.',
      subtitles: [
        { text: 'During peak dinner rush, Redis in-memory absorbs 80% read load.', startSeconds: 0.3, endSeconds: 2.8 },
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
      narration: 'Users make typos like biryni instead of biryani. A specialized search engine like Elasticsearch provides fuzzy matching.',
      subtitles: [
        { text: 'Users make typos. Elasticsearch inverted indexes handle fuzzy matching.', startSeconds: 0.2, endSeconds: 2.8 },
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
      narration: 'Thousands of delivery riders ping location updates every 3 seconds. Redis GEO with Geohash cells tracks rider proximity in real time.',
      subtitles: [
        { text: 'Redis GEO with Geohash cells tracks rider proximity in real time.', startSeconds: 0.3, endSeconds: 2.8 },
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
        { text: 'Real system design uses the right tool for each workload.', startSeconds: 0.3, endSeconds: 2.7 },
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
  ],
};

