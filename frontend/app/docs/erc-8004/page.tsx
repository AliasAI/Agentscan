import { CodeBlock } from '@/components/docs/CodeBlock';

export const metadata = {
  title: 'ERC-8004 Protocol - Agentscan Docs',
  description: 'Overview of the ERC-8004 on-chain AI agent protocol',
};

export default function Erc8004Page() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0a0a0a] dark:text-[#fafafa] mb-4">ERC-8004 Protocol</h1>
      <p className="text-[#525252] dark:text-[#a1a1a6] mb-8 leading-relaxed">
        <a href="https://eips.ethereum.org/EIPS/eip-8004" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#0a0a0a] dark:hover:text-[#fafafa]">
          ERC-8004
        </a>{' '}
        is an Ethereum standard for registering and managing AI agents on-chain. It defines two core registries:
        an Identity Registry for agent registration and a Reputation Registry for feedback and trust scoring.
      </p>

      <Section title="Identity Registry">
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-4">
          The Identity Registry is an ERC-721-based contract that allows anyone to register an AI agent as an on-chain NFT.
          Each agent gets a unique <code className="px-1.5 py-0.5 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a] text-xs font-mono">agentId</code> (token ID) and can store metadata via a URI.
        </p>
        <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-2">Key Functions</h3>
        <CodeBlock
          language="solidity"
          code={`// Register a new agent
function register(address to, string agentURI) returns (uint256 agentId)

// Update agent metadata URI
function setAgentURI(uint256 agentId, string agentURI)

// Events
event Registered(uint256 indexed agentId, address indexed owner)
event URIUpdated(uint256 indexed agentId, string agentURI)
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)`}
        />
      </Section>

      <Section title="Reputation Registry">
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-4">
          The Reputation Registry allows anyone to submit structured feedback for registered agents.
          Feedback uses a flexible <code className="px-1.5 py-0.5 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a] text-xs font-mono">value/valueDecimals</code> system
          that supports scores, percentages, response times, and more.
        </p>
        <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-2">Key Functions</h3>
        <CodeBlock
          language="solidity"
          code={`// Submit feedback
function giveFeedback(
    uint256 agentId,
    int128 value,
    uint8 valueDecimals,
    string tag1,
    string tag2,
    string endpoint,
    string feedbackURI,
    bytes32 feedbackHash
)

// Read reputation summary
function getSummary(uint256 agentId, string tag1)
    returns (uint256 count, int128 averageValue, uint8 valueDecimals)

// Events
event NewFeedback(
    uint256 indexed agentId,
    address indexed clientAddress,
    uint64 feedbackIndex,
    int128 value,
    uint8 valueDecimals,
    string indexed tag1,
    string tag2,
    string endpoint,
    string feedbackURI,
    bytes32 feedbackHash
)`}
        />
      </Section>

      <Section title="Contract Addresses">
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-4">
          All 21 mainnet networks use CREATE2 deterministic deployment, meaning the contract addresses are the same on every chain.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-[#e5e5e5] dark:border-[#333] rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-[#f5f5f5] dark:bg-[#1a1a1a]">
                <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Contract</th>
                <th className="text-left px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Address</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Identity Registry</td>
                <td className="px-4 py-2.5 font-mono text-xs border-b border-[#e5e5e5] dark:border-[#333] text-[#525252] dark:text-[#a1a1a6]">
                  0x8004A169FB4a3325136EB29fA0ceB6D2e539a432
                </td>
              </tr>
              <tr className="bg-[#fafafa] dark:bg-[#111]">
                <td className="px-4 py-2.5 font-medium border-b border-[#e5e5e5] dark:border-[#333]">Reputation Registry</td>
                <td className="px-4 py-2.5 font-mono text-xs border-b border-[#e5e5e5] dark:border-[#333] text-[#525252] dark:text-[#a1a1a6]">
                  0x8004BAa17C55a88189AE136b182e5fdA19dE9b63
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">Validation Registry</td>
                <td className="px-4 py-2.5 text-[#6e6e73] dark:text-[#86868b] italic">Pending deployment</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Agent Registration JSON">
        <p className="text-sm text-[#525252] dark:text-[#a1a1a6] mb-3">
          Agents store their metadata as a JSON file referenced by <code className="px-1.5 py-0.5 rounded bg-[#f5f5f5] dark:bg-[#1a1a1a] text-xs font-mono">agentURI</code>.
          The JSON follows the OASF standard:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "name": "MyAgent",
  "description": "An AI agent for code review",
  "version": "1.0.0",
  "services": [
    {
      "type": "mcp",
      "url": "https://agent.example.com/mcp",
      "oasfVersion": "0.8",
      "skills": ["code-generation", "code-review"],
      "domains": ["technology"],
      "active": true
    }
  ]
}`}
        />
      </Section>

      <Section title="Resources">
        <ul className="space-y-2 text-sm">
          <li>
            <a href="https://eips.ethereum.org/EIPS/eip-8004" target="_blank" rel="noopener noreferrer" className="text-[#525252] dark:text-[#a1a1a6] underline hover:text-[#0a0a0a] dark:hover:text-[#fafafa]">
              ERC-8004 Specification (EIPs)
            </a>
          </li>
          <li>
            <a href="https://github.com/erc-8004/best-practices/blob/main/Registration.md" target="_blank" rel="noopener noreferrer" className="text-[#525252] dark:text-[#a1a1a6] underline hover:text-[#0a0a0a] dark:hover:text-[#fafafa]">
              Registration Best Practices
            </a>
          </li>
          <li>
            <a href="https://github.com/erc-8004/best-practices/blob/main/Reputation.md" target="_blank" rel="noopener noreferrer" className="text-[#525252] dark:text-[#a1a1a6] underline hover:text-[#0a0a0a] dark:hover:text-[#fafafa]">
              Reputation Best Practices
            </a>
          </li>
          <li>
            <a href="https://github.com/agntcy/oasf" target="_blank" rel="noopener noreferrer" className="text-[#525252] dark:text-[#a1a1a6] underline hover:text-[#0a0a0a] dark:hover:text-[#fafafa]">
              OASF v0.8.0 Standard
            </a>
          </li>
        </ul>
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
