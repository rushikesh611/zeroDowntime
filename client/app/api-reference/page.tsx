import Link from "next/link";
import { TowerControl, ArrowLeft } from "lucide-react";

export default function ApiReferencePage() {
  return (
    <main className="bg-background min-h-screen">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex justify-between items-center px-6 py-3 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <TowerControl className="text-primary size-5" />
            <span className="text-lg font-bold text-foreground tracking-tight">Beacn</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" /> Back to Home
          </Link>
        </div>
      </nav>
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-6">API Reference</h1>
          <div className="text-muted-foreground text-sm space-y-4 leading-relaxed">
            <p>
              The Beacn API allows you to programmatically manage your monitors, access performance data, and integrate our alerting capabilities directly into your workflows.
            </p>
            <div className="bg-card border rounded-lg p-6 flex flex-col items-center justify-center text-center my-8">
              <span className="material-symbols-outlined text-4xl text-muted-foreground mb-4">code_blocks</span>
              <h2 className="text-lg font-medium text-foreground mb-2">Developer Documentation Coming Soon</h2>
              <p className="text-muted-foreground max-w-md">
                We are currently polishing our public API documentation. For early access or specific integration questions, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
