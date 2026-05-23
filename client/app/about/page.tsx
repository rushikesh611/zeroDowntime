import Link from "next/link";
import { TowerControl, ArrowLeft } from "lucide-react";

export default function AboutPage() {
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
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-6">About Beacn</h1>
          <div className="text-muted-foreground text-sm space-y-4 leading-relaxed">
            <p>
              Beacn is built to provide synthetic monitoring that never sleeps. Our mission is to give you total visibility into the uptime and performance of your APIs, websites, and infrastructure from around the world.
            </p>
            <p>
              We built this tool because we believe developer tools should be fast, reliable, and completely transparent. No unnecessary complexity—just the insights you need to keep your systems running smoothly.
            </p>
            <p>
              Our infrastructure relies on global probes carefully deployed across multiple regions to ensure true resilience and accurate performance metrics from your users' perspective.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
