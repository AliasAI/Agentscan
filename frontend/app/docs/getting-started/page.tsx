import { CodeBlock } from '@/components/docs/CodeBlock';
import { ParamsTable } from '@/components/docs/ParamsTable';

export const metadata = {
  title: 'Getting Started - Agentscan Docs',
  description: 'Get started with the Agentscan API',
};

export default function GettingStartedPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-4">
        Getting Started
      </h1>
      <p className="text-[#525252] dark:text-[#a1a1a6] mb-8 leading-relaxed">
        The Agentscan API is free and public. No API key or authentication is required.
      </p>

      <Section title="Base URL">
        <CodeBlock code="https://agentscan.info/api" language="text" />
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6]">
          All API endpoints are prefixed with <code className="px-1.5 py-0.5 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a] text-xs font-mono">/api</code>.
          For example, to list agents: <code className="px-1.5 py-0.5 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a] text-xs font-mono">GET https://agentscan.info/api/agents</code>
        </p>
      </Section>

      <Section title="Your First Request">
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-3">
          Fetch the first page of registered AI agents:
        </p>
        <CodeBlock
          title="curl"
          language="bash"
          code={`curl "https://agentscan.info/api/agents?page=1&page_size=5"`}
        />
      </Section>

      <Section title="Response Format">
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-3">
          All responses are JSON. List endpoints return paginated results:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "items": [
    {
      "id": "ethereum-1",
      "name": "MyAgent",
      "address": "0x8004...",
      "token_id": 1,
      "network_id": "ethereum",
      "reputation_score": 85.5,
      "owner_address": "0xabc...",
      "skills": ["nlp", "code-generation"],
      "domains": ["technology"]
    }
  ],
  "total": 1200,
  "page": 1,
  "page_size": 5,
  "total_pages": 240
}`}
        />
      </Section>

      <Section title="Pagination">
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-3">
          All list endpoints support pagination with these query parameters:
        </p>
        <ParamsTable
          params={[
            { name: 'page', type: 'integer', description: 'Page number (starts at 1)', default: '1' },
            { name: 'page_size', type: 'integer', description: 'Items per page (max varies by endpoint)', default: '20' },
          ]}
        />
      </Section>

      <Section title="Rate Limits">
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6]">
          The API is rate-limited to ensure fair usage. If you receive a <code className="px-1.5 py-0.5 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a] text-xs font-mono">429</code> response,
          wait a few seconds before retrying. There is no hard limit published, but please be respectful of shared resources.
        </p>
      </Section>

      <Section title="Error Responses">
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-3">
          Errors return standard HTTP status codes with a JSON body:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "detail": "Agent not found"
}`}
        />
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm border border-[#e5e5e5] dark:border-[#333] rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-[#f5f5f5] dark:bg-[#1a1a1a]">
                <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Code</th>
                <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="px-4 py-2 border-b border-[#e5e5e5] dark:border-[#333] font-mono">200</td><td className="px-4 py-2 border-b border-[#e5e5e5] dark:border-[#333] text-[#525252] dark:text-[#a1a1a6]">Success</td></tr>
              <tr className="bg-[#fafafa] dark:bg-[#111]"><td className="px-4 py-2 border-b border-[#e5e5e5] dark:border-[#333] font-mono">404</td><td className="px-4 py-2 border-b border-[#e5e5e5] dark:border-[#333] text-[#525252] dark:text-[#a1a1a6]">Resource not found</td></tr>
              <tr><td className="px-4 py-2 border-b border-[#e5e5e5] dark:border-[#333] font-mono">422</td><td className="px-4 py-2 border-b border-[#e5e5e5] dark:border-[#333] text-[#525252] dark:text-[#a1a1a6]">Validation error (bad parameters)</td></tr>
              <tr className="bg-[#fafafa] dark:bg-[#111]"><td className="px-4 py-2 font-mono">429</td><td className="px-4 py-2 text-[#525252] dark:text-[#a1a1a6]">Rate limited — retry after a short delay</td></tr>
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-3">{title}</h2>
      {children}
    </section>
  );
}
