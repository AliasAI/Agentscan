import { EndpointBlock } from '@/components/docs/EndpointBlock';

export const metadata = {
  title: 'Taxonomy API - Agentscan Docs',
  description: 'OASF skill and domain taxonomy endpoints',
};

export default function TaxonomyApiPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-4">Taxonomy API</h1>
      <p className="text-[#525252] dark:text-[#a1a1a6] mb-8">
        Agentscan uses the{' '}
        <a href="https://github.com/agntcy/oasf" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#0a0a0a] dark:hover:text-[#fafafa]">
          OASF v1.0
        </a>{' '}
        taxonomy standard to classify AI agents with 136 skills and 204 domains.
        These endpoints let you query the distribution and list of available categories.
      </p>

      <EndpointBlock
        method="GET"
        path="/api/taxonomy/distribution"
        description="Distribution of skills and domains across all classified agents, with agent counts and percentages."
        params={[]}
        response={`{
  "skills": [
    { "slug": "nlp", "display_name": "Natural Language Processing", "agent_count": 320, "percentage": 33.7 },
    { "slug": "code-generation", "display_name": "Code Generation", "agent_count": 215, "percentage": 22.6 }
  ],
  "domains": [
    { "slug": "technology", "display_name": "Technology", "agent_count": 450, "percentage": 47.4 },
    { "slug": "finance", "display_name": "Finance", "agent_count": 180, "percentage": 18.9 }
  ],
  "total_classified": 950,
  "total_agents": 1200
}`}
      />

      <EndpointBlock
        method="GET"
        path="/api/taxonomy/skills"
        description="List all 136 available OASF skill categories."
        params={[]}
        response={`{
  "count": 136,
  "skills": [
    { "slug": "nlp", "display_name": "Natural Language Processing" },
    { "slug": "code-generation", "display_name": "Code Generation" },
    { "slug": "computer-vision", "display_name": "Computer Vision" },
    { "slug": "data-analysis", "display_name": "Data Analysis" }
  ]
}`}
      />

      <EndpointBlock
        method="GET"
        path="/api/taxonomy/domains"
        description="List all available OASF domain categories."
        params={[]}
        response={`{
  "count": 204,
  "domains": [
    { "slug": "technology", "display_name": "Technology" },
    { "slug": "finance", "display_name": "Finance" },
    { "slug": "healthcare", "display_name": "Healthcare" },
    { "slug": "education", "display_name": "Education" }
  ]
}`}
      />

      <h2 className="text-lg font-semibold text-[#0a0a0a] dark:text-[#fafafa] mt-10 mb-3">About OASF Classification</h2>
      <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-3">
        Agents are automatically classified using a multi-strategy approach:
      </p>
      <ol className="list-decimal list-inside space-y-2 text-sm text-[#525252] dark:text-[#a1a1a6]">
        <li><strong>Metadata extraction</strong> &mdash; skills and domains from the agent&apos;s registration JSON <code className="px-1.5 py-0.5 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a] text-xs font-mono">services[].skills/domains</code></li>
        <li><strong>LLM classification</strong> &mdash; AI-powered analysis of the agent description (DeepSeek, OpenAI, or Claude)</li>
        <li><strong>Keyword matching</strong> &mdash; rule-based fallback when no LLM is available</li>
      </ol>
      <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mt-3">
        Classification follows strict validation rules: descriptions must be at least 20 characters, error messages are filtered out,
        and the system prefers no classification over an incorrect one.
      </p>
    </div>
  );
}
