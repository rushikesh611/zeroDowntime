import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_to_prevent_startup_crash';

if (stripeSecretKey === 'sk_test_dummy_key_to_prevent_startup_crash' && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️ STRIPE_SECRET_KEY is not defined in environment variables. Billing features will fail.');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2026-03-25.dahlia', // Match SDK type definition
  appInfo: {
    name: 'ZeroDowntime',
    version: '1.0.0',
  },
});
