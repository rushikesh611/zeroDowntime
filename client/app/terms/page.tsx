import Link from "next/link";
import { TowerControl, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-6">Terms of Service</h1>
          <div className="text-muted-foreground text-sm space-y-6 leading-relaxed">
            <div>
              <h2 className="text-lg font-medium text-foreground mb-2">1. Agreement to Terms</h2>
              <p>By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use our Services.</p>
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground mb-2">2. Use of Services</h2>
              <p>You agree to use our Services only for lawful purposes. You must not use the Services in a way that causes, or may cause, damage to the Services or impairs their availability.</p>
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground mb-2">3. Subscription and Billing</h2>
              <p>Certain aspects of the Services may be provided for a fee. If you choose to use paid aspects of the Services, you agree to the pricing and payment terms.</p>
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground mb-2">4. Disclaimers</h2>
              <p>Our Services are provided "as is" and "as available" without any warranties of any kind. We do not guarantee that the Services will be uninterrupted or error-free.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
