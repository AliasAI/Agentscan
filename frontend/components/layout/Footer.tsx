import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-[#fafafa] dark:bg-[#0a0a0a] border-t border-[#e5e5e5] dark:border-[#262626]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Brand Section */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#0a0a0a] dark:bg-[#fafafa] p-2 rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white dark:text-[#0a0a0a]">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-[#0a0a0a] dark:text-[#fafafa]">
                Agentscan
              </span>
            </div>
            <p className="text-sm text-[#525252] dark:text-[#a3a3a3] max-w-sm mb-6 leading-relaxed">
              Explore and track AI agents on the ERC-8004 protocol. Building a transparent window into the decentralized AI ecosystem.
            </p>
            <div className="flex items-center gap-3">
              <SocialLink href="https://github.com/aliasaidev/aliasai-validator" label="GitHub">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="currentColor"/>
              </SocialLink>
              <SocialLink href="https://x.com/Alias_labs" label="X">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
              </SocialLink>
              <SocialLink href="https://t.me/ILoveAliasAI1" label="Telegram">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" fill="currentColor"/>
              </SocialLink>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-4">Product</h3>
            <ul className="space-y-2.5">
              <FooterLink href="/agents">Browse Agents</FooterLink>
              <FooterLink href="/networks">Networks</FooterLink>
              <FooterLink href="/leaderboard">Leaderboard</FooterLink>
              <FooterLink href="/insights">Insights</FooterLink>
              <FooterLink href="/create">Create Agent</FooterLink>
            </ul>
          </div>

          {/* Developer */}
          <div>
            <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-4">Developer</h3>
            <ul className="space-y-2.5">
              <FooterLink href="https://eips.ethereum.org/EIPS/eip-8004" external>ERC-8004 Spec</FooterLink>
              <FooterLink href="https://github.com/agntcy/oasf" external>OASF Standard</FooterLink>
              <FooterLink href="https://github.com/erc-8004/best-practices" external>Best Practices</FooterLink>
              <FooterLink href="https://github.com/aliasaidev/aliasai-validator" external>GitHub</FooterLink>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa] mb-4">Company</h3>
            <ul className="space-y-2.5">
              <FooterLink href="https://aliasai.io/" external>Alias Official</FooterLink>
              <FooterLink href="#">Privacy Policy</FooterLink>
              <FooterLink href="#">Terms of Service</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#e5e5e5] dark:border-[#262626]">
          <p className="text-sm text-[#525252] dark:text-[#a3a3a3]">
            &copy; {currentYear} Agentscan by{' '}
            <span className="font-semibold text-[#0a0a0a] dark:text-[#fafafa]">alias</span>.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children, external }: { href: string; children: React.ReactNode; external?: boolean }) {
  const className = "text-sm text-[#525252] dark:text-[#a3a3a3] hover:text-[#0a0a0a] dark:hover:text-[#fafafa] transition-colors";

  if (external || href.startsWith('http')) {
    return (
      <li>
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {children}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link href={href} className={className}>
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2.5 bg-[#f5f5f5] dark:bg-[#262626] hover:bg-[#e5e5e5] dark:hover:bg-[#404040] rounded-lg transition-colors group"
      aria-label={label}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#525252] dark:text-[#a3a3a3] group-hover:text-[#0a0a0a] dark:group-hover:text-[#fafafa] transition-colors">
        {children}
      </svg>
    </a>
  );
}
