import type { Metadata } from 'next';
import VirtualsAcpPageClient from './VirtualsAcpPageClient';

export const metadata: Metadata = {
  title: 'Virtuals ACP',
  description:
    'Explore Virtuals ACP agents, commerce signals, offerings, resources, and payable invocation paths on Agentscan.',
};

export default function Page() {
  return <VirtualsAcpPageClient />;
}
