import express from 'express';
import { stripe } from '../lib/stripe.js';
import prisma from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import Stripe from 'stripe';

const router = express.Router();

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event: Stripe.Event;

    try {
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
        }
        event = stripe.webhooks.constructEvent(req.body, signature as string, webhookSecret);
    } catch (err: any) {
        logger.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id;
                if (!userId) break;

                // Retrieve subscription to check the price/plan
                const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                const priceId = subscription.items.data[0].price.id;

                // Determine plan based on price ID (you'd normally map this in DB or ENV)
                // For now, if we don't have mapping, we can set a flag or try to parse from the Product name
                const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);
                let planType: 'PRO' | 'PRO_PLUS' | 'FREE' = 'PRO';
                
                logger.info(`Webhook: Processing subscription for product: ${product.name}`);
                
                if (product.name.toLowerCase().includes('plus')) {
                    planType = 'PRO_PLUS';
                }

                logger.info(`Webhook: Updating user ${userId} to plan ${planType}`);

                const updatedUser = await prisma.user.update({
                    where: { id: userId },
                    data: {
                        stripeCustomerId: session.customer as string,
                        stripeSubscriptionId: session.subscription as string,
                        plan: planType,
                    },
                });
                
                logger.info(`Webhook: User updated successfully: ${updatedUser.id}`);

                // Check if user has a team, if not create one
                const existingTeam = await prisma.team.findFirst({ where: { adminId: userId } });
                if (!existingTeam) {
                    await prisma.team.create({
                        data: {
                            name: 'My Team',
                            adminId: userId,
                        }
                    });
                }

                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;
                
                // Determine new plan if changed
                const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);
                let planType: 'PRO' | 'PRO_PLUS' | 'FREE' = 'PRO';
                if (product.name.toLowerCase().includes('plus')) {
                    planType = 'PRO_PLUS';
                }

                if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
                    planType = 'FREE';
                }

                await prisma.user.updateMany({
                    where: { stripeCustomerId: customerId },
                    data: {
                        plan: planType,
                        stripeSubscriptionId: subscription.status === 'canceled' ? null : subscription.id
                    }
                });
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                await prisma.user.updateMany({
                    where: { stripeCustomerId: customerId },
                    data: {
                        plan: 'FREE',
                        stripeSubscriptionId: null
                    }
                });
                break;
            }
        }
        res.json({ received: true });
    } catch (err: any) {
        logger.error(`Error processing webhook: ${err.message}`);
        res.status(500).send('Webhook processing failed');
    }
});

export default router;
