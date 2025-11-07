export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-foreground/60">
            © 2025 Agentscan. Explore AI agents on the ERC-8004 protocol
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a
              href="#"
              className="text-sm text-foreground/60 hover:text-foreground"
            >
              Docs
            </a>
            <a
              href="#"
              className="text-sm text-foreground/60 hover:text-foreground"
            >
              About
            </a>
            <a
              href="#"
              className="text-sm text-foreground/60 hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
