'use client';

import { ContentLayout } from '@/components/dashboard/content-layout';
import { useAppStore } from '@/store/useAppStore';
import { Check, CreditCard, Sparkles, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';

// Replace with your Stripe publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function BillingPage() {
    const { user, checkAuth } = useAppStore();
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success')) {
            checkAuth();
            // Optional: clean up URL params after refresh
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [checkAuth]);

    const handleUpgrade = async (priceId: string, tierName: string) => {
        try {
            setLoading(tierName);
            setError(null);

            const response = await fetchWithAuth('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (data.url) window.location.href = data.url;
        } catch (err: any) {
            console.error('Error upgrading:', err);
            setError(err.message || 'Failed to start checkout process.');
        } finally {
            setLoading(null);
        }
    };

    const handleManageSubscription = async () => {
        try {
            setLoading('manage');
            setError(null);

            const response = await fetchWithAuth('/api/stripe/create-portal-session', {
                method: 'POST'
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (data.url) window.location.href = data.url;
        } catch (err: any) {
            console.error('Error managing subscription:', err);
            setError(err.message || 'Failed to load customer portal.');
        } finally {
            setLoading(null);
        }
    };

    if (!user) return null;

    const currentPlan = user.plan || 'FREE';

    return (
        <ContentLayout>
            <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 duration-500 pb-12">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Billing & Plans</h1>
                    <p className="text-sm text-on-surface-variant">Manage your subscription, billing details, and payment methods.</p>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-error/10 text-error text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {/* Current Plan Overview */}
                <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high/50 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Current Plan</div>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-bold tracking-tight text-on-surface">
                                {currentPlan === 'FREE' ? 'Free' : currentPlan === 'PRO' ? 'Pro' : 'Pro Plus'}
                            </span>
                            {currentPlan !== 'FREE' && (
                                <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider">
                                    Active
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-on-surface-variant">
                            {currentPlan === 'FREE'
                                ? 'You are on the free tier. Upgrade for more monitors and team features.'
                                : 'You have access to premium features and team collaboration.'}
                        </p>
                    </div>

                    {currentPlan !== 'FREE' && (
                        <button
                            onClick={handleManageSubscription}
                            disabled={loading === 'manage'}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            <CreditCard className="w-4 h-4" />
                            {loading === 'manage' ? 'Loading...' : 'Manage Subscription'}
                        </button>
                    )}
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-6 pt-6">
                    {/* Free Plan */}
                    <div className={`relative p-6 rounded-3xl border-2 transition-all ${currentPlan === 'FREE' ? 'border-primary bg-primary/5' : 'border-surface-container-high bg-surface-container-lowest'}`}>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-on-surface">Free</h3>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-on-surface">$0</span>
                                    <span className="text-sm text-on-surface-variant font-medium">/month</span>
                                </div>
                            </div>
                            <p className="text-sm text-on-surface-variant">Perfect for individual developers and small projects.</p>
                            <div className="pt-4 space-y-3">
                                {[
                                    '1 Monitor limit',
                                    '1 Status Page',
                                    '15-minute frequency',
                                    'Max 3 regions',
                                    'Email notifications'
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
                                        <Check className="w-4 h-4 text-primary shrink-0" />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8">
                            <button
                                disabled
                                className="w-full py-2.5 rounded-xl bg-surface-container text-on-surface-variant text-sm font-semibold opacity-70"
                            >
                                {currentPlan === 'FREE' ? 'Current Plan' : 'Included'}
                            </button>
                        </div>
                    </div>

                    {/* Pro Plan */}
                    <div className={`relative p-6 rounded-3xl border-2 transition-all ${currentPlan === 'PRO' ? 'border-secondary bg-secondary/5' : 'border-surface-container-high bg-surface-container-lowest'}`}>
                        {currentPlan === 'FREE' && (
                            <div className="absolute -top-3 inset-x-0 flex justify-center">
                                <span className="px-3 py-1 bg-secondary text-on-secondary text-[10px] font-bold uppercase tracking-wider rounded-full">Most Popular</span>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                                    Pro <Sparkles className="w-4 h-4 text-secondary" />
                                </h3>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-on-surface">$15</span>
                                    <span className="text-sm text-on-surface-variant font-medium">/month</span>
                                </div>
                            </div>
                            <p className="text-sm text-on-surface-variant">For growing apps that need better monitoring resolution.</p>
                            <div className="pt-4 space-y-3">
                                {[
                                    '15 Monitors limit',
                                    '10 Status Pages',
                                    '1-minute frequency',
                                    'Max 5 regions',
                                    '1 Team (invite up to 20 users)',
                                    'Role-based access (Read/Write)',
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
                                        <Check className="w-4 h-4 text-secondary shrink-0" />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8">
                            {currentPlan === 'PRO' ? (
                                <button disabled className="w-full py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-semibold opacity-90">
                                    Current Plan
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!, 'PRO')}
                                    disabled={!!loading || currentPlan === 'PRO_PLUS'}
                                    className="w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary text-sm font-semibold transition-colors disabled:opacity-50"
                                >
                                    {loading === 'PRO' ? 'Loading...' : 'Upgrade to Pro'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Pro Plus Plan */}
                    <div className={`relative p-6 rounded-3xl border-2 transition-all ${currentPlan === 'PRO_PLUS' ? 'border-tertiary bg-tertiary/5' : 'border-surface-container-high bg-surface-container-lowest'}`}>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-on-surface">Pro Plus</h3>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-on-surface">$59</span>
                                    <span className="text-sm text-on-surface-variant font-medium">/month</span>
                                </div>
                            </div>
                            <p className="text-sm text-on-surface-variant">Maximum performance and resolution for enterprise needs.</p>
                            <div className="pt-4 space-y-3">
                                {[
                                    '50 Monitors limit',
                                    '50 Status Pages',
                                    '30-second frequency',
                                    'All regions available',
                                    '1 Team (invite up to 50 users)',
                                    'Priority support',
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
                                        <Check className="w-4 h-4 text-tertiary shrink-0" />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8">
                            {currentPlan === 'PRO_PLUS' ? (
                                <button disabled className="w-full py-2.5 rounded-xl bg-tertiary text-white text-sm font-semibold opacity-90">
                                    Current Plan
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRO_PLUS_PRICE_ID!, 'PRO_PLUS')}
                                    disabled={!!loading}
                                    className="w-full py-2.5 rounded-xl bg-tertiary hover:bg-tertiary/90 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                                >
                                    {loading === 'PRO_PLUS' ? 'Loading...' : 'Upgrade to Pro Plus'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </ContentLayout>
    );
}
