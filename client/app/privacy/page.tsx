import Link from "next/link";
import { TowerControl, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-6">Privacy Policy</h1>
          <div className="text-muted-foreground text-sm space-y-6 leading-relaxed">
            <div>
              <h2 className="text-lg font-medium text-foreground mb-2">1. Information We Collect</h2>
              <p>We collect information you provide directly to us when you create an account, such as your name, email address, and payment information. We also collect data regarding your monitors and endpoints configured in our service.</p>
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground mb-2">2. How We Use Information</h2>
              <p>We use the information we collect to provide, maintain, and improve our Services, to process your transactions, and to communicate with you about your account and our Services.</p>
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground mb-2">3. Information Sharing</h2>
              <p>We do not share your personal information with third parties except as necessary to provide our Services (e.g., payment processors) or as required by law.</p>
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground mb-2">4. Data Security</h2>
              <p>We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
