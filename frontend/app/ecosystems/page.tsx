import type { Metadata } from 'next';
import EcosystemsPageClient from './EcosystemsPageClient';

export const metadata: Metadata = {
  title: 'Ecosystems',
  description:
    'Explore external ecosystems connected to Agentscan, including Virtuals ACP, BNB Agent execution, and payment-capable agents.',
};

export default function Page() {
  return <EcosystemsPageClient />;
}
