import express from 'express';
import auth from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { stripe } from '../lib/stripe.js';
import { logger } from '../utils/logger.js';
import Stripe from 'stripe';

const router = express.Router();
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

// Create Checkout Session
router.post('/create-checkout-session', auth, async (req, res) => {
    try {
        const { priceId } = req.body;
        const userId = req.user!.id;
        
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${clientUrl}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientUrl}/billing?canceled=true`,
            customer: user.stripeCustomerId || undefined,
            client_reference_id: userId,
            customer_email: user.stripeCustomerId ? undefined : user.email || undefined,
            billing_address_collection: 'required',
        });

        res.json({ url: session.url });
    } catch (error: any) {
        logger.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Create Customer Portal Session
router.post('/create-portal-session', auth, async (req, res) => {
    try {
        const userId = req.user!.id;
        
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.stripeCustomerId) {
            return res.status(400).json({ error: 'No active subscription found' });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${clientUrl}/billing`,
        });

        res.json({ url: portalSession.url });
    } catch (error: any) {
        logger.error('Error creating portal session:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Webhook is handled in index.ts to ensure raw body parsing

export default router;
