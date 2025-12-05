import type { DemoAgent, SkillCategory, DomainCategory, HotSearchItem, SearchSuggestion } from '../types';

// Mock agents data - diverse set for demo
export const mockAgents: DemoAgent[] = [
  {
    id: '1',
    name: 'DeFi Trading Alpha',
    address: '0x8004a6090Cd10A7288092483047B097295Fb8847',
    description: 'Advanced DeFi trading agent with multi-chain arbitrage capabilities. Executes flash loans, liquidity mining strategies, and yield optimization across Ethereum, Base, and Polygon networks.',
    network: 'Base Sepolia',
    tokenId: 1001,
    ownerAddress: '0x1234...5678',
    status: 'active',
    reputationScore: 94,
    reputationCount: 128,
    skills: ['nlp/text_generation', 'data_engineering/data_analysis', 'blockchain/smart_contract_interaction'],
    domains: ['finance/defi', 'finance/trading', 'technology/blockchain'],
    mcpTools: ['swap-executor', 'price-oracle', 'gas-optimizer'],
    a2aSkills: ['negotiate-price', 'execute-trade'],
    createdAt: '2024-12-01T10:00:00Z',
    activityScore: 92,
    relevanceScore: 88,
    taxonomyCoverage: 85,
  },
  {
    id: '2',
    name: 'CodeGen Assistant Pro',
    address: '0x7892...3456',
    description: 'AI-powered code generation and review agent. Supports Python, TypeScript, Rust, and Solidity. Integrates with GitHub for PR reviews and automated testing.',
    network: 'Sepolia',
    tokenId: 1002,
    ownerAddress: '0x2345...6789',
    status: 'active',
    reputationScore: 89,
    reputationCount: 256,
    skills: ['nlp/code_generation', 'nlp/text_summarization', 'agent_orchestration/task_planning'],
    domains: ['technology/software_development', 'technology/devops', 'education/programming'],
    mcpTools: ['github-api', 'code-analyzer', 'test-runner'],
    a2aSkills: ['review-code', 'generate-tests'],
    createdAt: '2024-11-28T14:30:00Z',
    activityScore: 88,
    relevanceScore: 95,
    taxonomyCoverage: 90,
  },
  {
    id: '3',
    name: 'NFT Market Scout',
    address: '0x5678...9012',
    description: 'Real-time NFT market intelligence agent. Tracks floor prices, whale movements, and emerging collections across OpenSea, Blur, and Magic Eden.',
    network: 'Polygon Amoy',
    tokenId: 1003,
    ownerAddress: '0x3456...7890',
    status: 'active',
    reputationScore: 78,
    reputationCount: 89,
    skills: ['data_engineering/data_collection', 'nlp/sentiment_analysis', 'computer_vision/image_classification'],
    domains: ['art_design/digital_art', 'finance/trading', 'technology/blockchain'],
    mcpTools: ['opensea-api', 'blur-api', 'image-analyzer'],
    a2aSkills: ['track-collection', 'alert-whale-activity'],
    createdAt: '2024-12-03T09:15:00Z',
    activityScore: 75,
    relevanceScore: 82,
    taxonomyCoverage: 78,
  },
  {
    id: '4',
    name: 'Medical Research Analyst',
    address: '0x9012...3456',
    description: 'Specialized agent for analyzing medical research papers, clinical trial data, and drug interaction databases. HIPAA compliant with privacy-preserving computation.',
    network: 'Base Sepolia',
    tokenId: 1004,
    ownerAddress: '0x4567...8901',
    status: 'active',
    reputationScore: 96,
    reputationCount: 67,
    skills: ['nlp/text_summarization', 'data_engineering/data_analysis', 'nlp/named_entity_recognition'],
    domains: ['healthcare/clinical_research', 'healthcare/pharmaceuticals', 'science/biology'],
    mcpTools: ['pubmed-api', 'clinical-trials-db', 'drug-interaction-checker'],
    a2aSkills: ['summarize-paper', 'check-interactions'],
    createdAt: '2024-11-25T16:45:00Z',
    activityScore: 65,
    relevanceScore: 92,
    taxonomyCoverage: 95,
  },
  {
    id: '5',
    name: 'GameFi Strategy Bot',
    address: '0x3456...7890',
    description: 'Automated gaming agent for play-to-earn optimization. Manages in-game assets, executes breeding strategies, and maximizes token yields across multiple GameFi platforms.',
    network: 'Sepolia',
    tokenId: 1005,
    ownerAddress: '0x5678...9012',
    status: 'validating',
    reputationScore: 72,
    reputationCount: 45,
    skills: ['agent_orchestration/multi_agent_coordination', 'data_engineering/data_analysis', 'blockchain/token_management'],
    domains: ['gaming/play_to_earn', 'finance/defi', 'entertainment/gaming'],
    mcpTools: ['axie-api', 'stepn-api', 'nft-manager'],
    a2aSkills: ['optimize-yield', 'manage-assets'],
    createdAt: '2024-12-04T11:20:00Z',
    activityScore: 82,
    relevanceScore: 76,
    taxonomyCoverage: 72,
  },
  {
    id: '6',
    name: 'Legal Document Analyzer',
    address: '0x6789...0123',
    description: 'AI agent specialized in legal document analysis, contract review, and compliance checking. Supports multiple jurisdictions and regulatory frameworks.',
    network: 'Polygon Amoy',
    tokenId: 1006,
    ownerAddress: '0x6789...0123',
    status: 'active',
    reputationScore: 91,
    reputationCount: 112,
    skills: ['nlp/text_summarization', 'nlp/named_entity_recognition', 'nlp/document_understanding'],
    domains: ['legal/contract_law', 'legal/compliance', 'business/corporate'],
    mcpTools: ['contract-parser', 'clause-library', 'compliance-checker'],
    a2aSkills: ['review-contract', 'check-compliance'],
    createdAt: '2024-11-20T08:00:00Z',
    activityScore: 70,
    relevanceScore: 88,
    taxonomyCoverage: 88,
  },
  {
    id: '7',
    name: 'Supply Chain Oracle',
    address: '0x7890...1234',
    description: 'End-to-end supply chain visibility agent. Tracks shipments, predicts delays, and optimizes logistics across global supply networks with real-time IoT integration.',
    network: 'Base Sepolia',
    tokenId: 1007,
    ownerAddress: '0x7890...1234',
    status: 'active',
    reputationScore: 85,
    reputationCount: 78,
    skills: ['data_engineering/data_collection', 'data_engineering/data_analysis', 'agent_orchestration/workflow_automation'],
    domains: ['logistics/supply_chain', 'business/operations', 'technology/iot'],
    mcpTools: ['shipment-tracker', 'iot-connector', 'delay-predictor'],
    a2aSkills: ['track-shipment', 'optimize-route'],
    createdAt: '2024-11-22T13:30:00Z',
    activityScore: 78,
    relevanceScore: 84,
    taxonomyCoverage: 82,
  },
  {
    id: '8',
    name: 'Social Sentiment Monitor',
    address: '0x8901...2345',
    description: 'Real-time social media sentiment analysis agent. Monitors Twitter, Reddit, and Discord for market sentiment, FUD detection, and trend identification.',
    network: 'Sepolia',
    tokenId: 1008,
    ownerAddress: '0x8901...2345',
    status: 'active',
    reputationScore: 76,
    reputationCount: 156,
    skills: ['nlp/sentiment_analysis', 'data_engineering/data_collection', 'nlp/text_classification'],
    domains: ['marketing/social_media', 'finance/trading', 'technology/data_analytics'],
    mcpTools: ['twitter-api', 'reddit-api', 'discord-bot'],
    a2aSkills: ['analyze-sentiment', 'detect-fud'],
    createdAt: '2024-12-02T15:45:00Z',
    activityScore: 90,
    relevanceScore: 79,
    taxonomyCoverage: 75,
  },
  {
    id: '9',
    name: 'RAG Knowledge Assistant',
    address: '0x9012...3456',
    description: 'Enterprise knowledge base agent with retrieval-augmented generation. Indexes internal documents, provides contextual answers, and maintains source attribution.',
    network: 'Polygon Amoy',
    tokenId: 1009,
    ownerAddress: '0x9012...3456',
    status: 'active',
    reputationScore: 88,
    reputationCount: 203,
    skills: ['nlp/question_answering', 'nlp/text_summarization', 'data_engineering/vector_search'],
    domains: ['business/knowledge_management', 'technology/enterprise', 'education/training'],
    mcpTools: ['vector-db', 'document-parser', 'citation-tracker'],
    a2aSkills: ['answer-question', 'cite-sources'],
    createdAt: '2024-11-18T10:15:00Z',
    activityScore: 85,
    relevanceScore: 91,
    taxonomyCoverage: 88,
  },
  {
    id: '10',
    name: 'Autonomous Trader v2',
    address: '0x0123...4567',
    description: 'Next-generation autonomous trading agent with multi-strategy support. Executes market making, statistical arbitrage, and momentum strategies with advanced risk management.',
    network: 'Base Sepolia',
    tokenId: 1010,
    ownerAddress: '0x0123...4567',
    status: 'inactive',
    reputationScore: 82,
    reputationCount: 89,
    skills: ['data_engineering/data_analysis', 'agent_orchestration/decision_making', 'blockchain/smart_contract_interaction'],
    domains: ['finance/trading', 'finance/quantitative', 'technology/algorithms'],
    mcpTools: ['cex-connector', 'dex-aggregator', 'risk-manager'],
    a2aSkills: ['execute-strategy', 'manage-risk'],
    createdAt: '2024-11-15T09:00:00Z',
    activityScore: 45,
    relevanceScore: 85,
    taxonomyCoverage: 80,
  },
  {
    id: '11',
    name: 'Vision Art Generator',
    address: '0x1234...5678',
    description: 'Creative AI agent for generating and editing images. Supports text-to-image, image-to-image, inpainting, and style transfer with multiple model backends.',
    network: 'Sepolia',
    tokenId: 1011,
    ownerAddress: '0x1234...5678',
    status: 'active',
    reputationScore: 79,
    reputationCount: 312,
    skills: ['computer_vision/image_generation', 'computer_vision/image_editing', 'nlp/text_to_image'],
    domains: ['art_design/digital_art', 'art_design/graphic_design', 'entertainment/creative'],
    mcpTools: ['stable-diffusion', 'midjourney-api', 'image-editor'],
    a2aSkills: ['generate-image', 'edit-image'],
    createdAt: '2024-12-01T14:00:00Z',
    activityScore: 88,
    relevanceScore: 82,
    taxonomyCoverage: 85,
  },
  {
    id: '12',
    name: 'DAO Governance Agent',
    address: '0x2345...6789',
    description: 'Specialized agent for DAO governance participation. Analyzes proposals, simulates voting outcomes, and provides treasury management recommendations.',
    network: 'Polygon Amoy',
    tokenId: 1012,
    ownerAddress: '0x2345...6789',
    status: 'active',
    reputationScore: 87,
    reputationCount: 67,
    skills: ['nlp/text_summarization', 'data_engineering/data_analysis', 'blockchain/governance'],
    domains: ['technology/blockchain', 'business/governance', 'finance/defi'],
    mcpTools: ['snapshot-api', 'tally-api', 'treasury-analyzer'],
    a2aSkills: ['analyze-proposal', 'simulate-vote'],
    createdAt: '2024-11-30T11:30:00Z',
    activityScore: 72,
    relevanceScore: 86,
    taxonomyCoverage: 82,
  },
];

// Skill categories with counts
export const mockSkillCategories: SkillCategory[] = [
  {
    slug: 'nlp',
    name: 'NLP',
    count: 1847,
    subcategories: [
      { slug: 'nlp/text_generation', name: 'Text Generation', count: 456 },
      { slug: 'nlp/text_summarization', name: 'Summarization', count: 389 },
      { slug: 'nlp/sentiment_analysis', name: 'Sentiment Analysis', count: 312 },
      { slug: 'nlp/question_answering', name: 'Q&A', count: 298 },
      { slug: 'nlp/code_generation', name: 'Code Generation', count: 245 },
      { slug: 'nlp/named_entity_recognition', name: 'NER', count: 147 },
    ],
  },
  {
    slug: 'computer_vision',
    name: 'Computer Vision',
    count: 892,
    subcategories: [
      { slug: 'computer_vision/image_classification', name: 'Image Classification', count: 234 },
      { slug: 'computer_vision/image_generation', name: 'Image Generation', count: 312 },
      { slug: 'computer_vision/object_detection', name: 'Object Detection', count: 189 },
      { slug: 'computer_vision/image_editing', name: 'Image Editing', count: 157 },
    ],
  },
  {
    slug: 'data_engineering',
    name: 'Data Engineering',
    count: 1234,
    subcategories: [
      { slug: 'data_engineering/data_analysis', name: 'Data Analysis', count: 456 },
      { slug: 'data_engineering/data_collection', name: 'Data Collection', count: 345 },
      { slug: 'data_engineering/vector_search', name: 'Vector Search', count: 234 },
      { slug: 'data_engineering/etl', name: 'ETL', count: 199 },
    ],
  },
  {
    slug: 'agent_orchestration',
    name: 'Agent Orchestration',
    count: 678,
    subcategories: [
      { slug: 'agent_orchestration/task_planning', name: 'Task Planning', count: 234 },
      { slug: 'agent_orchestration/multi_agent_coordination', name: 'Multi-Agent', count: 189 },
      { slug: 'agent_orchestration/workflow_automation', name: 'Workflow', count: 156 },
      { slug: 'agent_orchestration/decision_making', name: 'Decision Making', count: 99 },
    ],
  },
  {
    slug: 'blockchain',
    name: 'Blockchain',
    count: 567,
    subcategories: [
      { slug: 'blockchain/smart_contract_interaction', name: 'Smart Contracts', count: 234 },
      { slug: 'blockchain/token_management', name: 'Token Management', count: 189 },
      { slug: 'blockchain/governance', name: 'Governance', count: 144 },
    ],
  },
];

// Domain categories with counts
export const mockDomainCategories: DomainCategory[] = [
  {
    slug: 'finance',
    name: 'Finance',
    count: 1456,
    subcategories: [
      { slug: 'finance/defi', name: 'DeFi', count: 567 },
      { slug: 'finance/trading', name: 'Trading', count: 456 },
      { slug: 'finance/quantitative', name: 'Quantitative', count: 234 },
      { slug: 'finance/banking', name: 'Banking', count: 199 },
    ],
  },
  {
    slug: 'technology',
    name: 'Technology',
    count: 1234,
    subcategories: [
      { slug: 'technology/blockchain', name: 'Blockchain', count: 456 },
      { slug: 'technology/software_development', name: 'Software Dev', count: 345 },
      { slug: 'technology/data_analytics', name: 'Data Analytics', count: 234 },
      { slug: 'technology/devops', name: 'DevOps', count: 199 },
    ],
  },
  {
    slug: 'healthcare',
    name: 'Healthcare',
    count: 456,
    subcategories: [
      { slug: 'healthcare/clinical_research', name: 'Clinical Research', count: 189 },
      { slug: 'healthcare/pharmaceuticals', name: 'Pharmaceuticals', count: 156 },
      { slug: 'healthcare/diagnostics', name: 'Diagnostics', count: 111 },
    ],
  },
  {
    slug: 'gaming',
    name: 'Gaming',
    count: 345,
    subcategories: [
      { slug: 'gaming/play_to_earn', name: 'Play-to-Earn', count: 189 },
      { slug: 'gaming/esports', name: 'Esports', count: 89 },
      { slug: 'gaming/game_development', name: 'Game Dev', count: 67 },
    ],
  },
  {
    slug: 'art_design',
    name: 'Art & Design',
    count: 289,
    subcategories: [
      { slug: 'art_design/digital_art', name: 'Digital Art', count: 145 },
      { slug: 'art_design/graphic_design', name: 'Graphic Design', count: 89 },
      { slug: 'art_design/nft', name: 'NFT', count: 55 },
    ],
  },
  {
    slug: 'legal',
    name: 'Legal',
    count: 234,
    subcategories: [
      { slug: 'legal/contract_law', name: 'Contract Law', count: 112 },
      { slug: 'legal/compliance', name: 'Compliance', count: 78 },
      { slug: 'legal/ip', name: 'IP', count: 44 },
    ],
  },
  {
    slug: 'logistics',
    name: 'Logistics',
    count: 189,
    subcategories: [
      { slug: 'logistics/supply_chain', name: 'Supply Chain', count: 112 },
      { slug: 'logistics/shipping', name: 'Shipping', count: 77 },
    ],
  },
];

// Hot search terms
export const mockHotSearches: HotSearchItem[] = [
  { query: 'DeFi trading', count: 2456, trend: 'up', isNew: false },
  { query: 'code generation', count: 1890, trend: 'up', isNew: false },
  { query: 'NFT analytics', count: 1567, trend: 'stable', isNew: true },
  { query: 'RAG assistant', count: 1234, trend: 'up', isNew: false },
  { query: 'governance DAO', count: 987, trend: 'down', isNew: false },
  { query: 'medical research', count: 876, trend: 'up', isNew: false },
  { query: 'sentiment analysis', count: 765, trend: 'stable', isNew: false },
  { query: 'supply chain', count: 654, trend: 'up', isNew: true },
];

// Search history (mock localStorage data)
export const mockSearchHistory: string[] = [
  'trading bot base',
  'nlp text generation',
  'defi agent',
  'image generation art',
];

// Network options
export const networkOptions = [
  { value: 'Sepolia', label: 'Sepolia', icon: '🔵' },
  { value: 'Base Sepolia', label: 'Base Sepolia', icon: '🔷' },
  { value: 'Polygon Amoy', label: 'Polygon Amoy', icon: '🟣' },
];

// Generate suggestions based on query
export function generateSuggestions(query: string): SearchSuggestion[] {
  if (!query) return [];

  const lowerQuery = query.toLowerCase();
  const suggestions: SearchSuggestion[] = [];

  // Add matching agents
  const matchingAgents = mockAgents
    .filter(a => a.name.toLowerCase().includes(lowerQuery) || a.description.toLowerCase().includes(lowerQuery))
    .slice(0, 4);

  matchingAgents.forEach(agent => {
    suggestions.push({
      type: 'agent',
      value: agent.id,
      label: agent.name,
      sublabel: agent.network,
      highlight: query,
    });
  });

  // Add matching skills
  mockSkillCategories.forEach(cat => {
    if (cat.name.toLowerCase().includes(lowerQuery)) {
      suggestions.push({
        type: 'skill',
        value: cat.slug,
        label: cat.name,
        sublabel: `${cat.count} agents`,
      });
    }
    cat.subcategories.forEach(sub => {
      if (sub.name.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'skill',
          value: sub.slug,
          label: sub.name,
          sublabel: `${sub.count} agents`,
        });
      }
    });
  });

  // Add matching domains
  mockDomainCategories.forEach(cat => {
    if (cat.name.toLowerCase().includes(lowerQuery)) {
      suggestions.push({
        type: 'domain',
        value: cat.slug,
        label: cat.name,
        sublabel: `${cat.count} agents`,
      });
    }
    cat.subcategories.forEach(sub => {
      if (sub.name.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          type: 'domain',
          value: sub.slug,
          label: sub.name,
          sublabel: `${sub.count} agents`,
        });
      }
    });
  });

  // Add matching history
  mockSearchHistory
    .filter(h => h.toLowerCase().includes(lowerQuery))
    .slice(0, 2)
    .forEach(h => {
      suggestions.push({
        type: 'history',
        value: h,
        label: h,
      });
    });

  return suggestions.slice(0, 10);
}
