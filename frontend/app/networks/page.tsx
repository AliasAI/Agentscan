'use client';

import { useEffect, useState } from 'react';
import { networkService } from '@/lib/api/services';
import type { Network } from '@/types';

export default function NetworksPage() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    networkService.getNetworks()
      .then(data => {
        setNetworks(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch networks:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Networks</h1>
        <div className="text-foreground/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Supported Networks</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {networks.map((network) => (
          <div
            key={network.id}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{network.name}</h2>
              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-foreground/60 mb-1">Chain ID</div>
                <div className="font-mono text-sm">{network.chain_id}</div>
              </div>

              <div>
                <div className="text-sm text-foreground/60 mb-1">Explorer</div>
                <a
                  href={network.explorer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block"
                >
                  {network.explorer_url}
                </a>
              </div>

              {network.contracts && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="text-sm font-semibold mb-3">Contract Addresses</div>

                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-foreground/60 mb-1">Identity Registry</div>
                      <a
                        href={`${network.explorer_url}/address/${network.contracts.identity}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {network.contracts.identity}
                      </a>
                    </div>

                    <div>
                      <div className="text-xs text-foreground/60 mb-1">Reputation Registry</div>
                      <a
                        href={`${network.explorer_url}/address/${network.contracts.reputation}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {network.contracts.reputation}
                      </a>
                    </div>

                    <div>
                      <div className="text-xs text-foreground/60 mb-1">Validation Registry</div>
                      <a
                        href={`${network.explorer_url}/address/${network.contracts.validation}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {network.contracts.validation}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
