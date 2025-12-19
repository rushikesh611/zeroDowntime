import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/github', passport.authenticate('github'));

router.get('/github/callback',
    passport.authenticate('github', {
        failureRedirect: '/login',
        failureMessage: true
    }),
    (req, res) => {
        if (!req.user) {
            logger.error('GitHub authentication failed - no user data');
            return res.redirect('/login');
        }

        const user = req.user as User;
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || '$2a$04$Ls3wM2PzVdm.08FoS3sv3uANW.EkuhFhNdSeuBNpKkXInkXumGgkm',
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000,
        });
        logger.info('User logged in successfully', {
            userId: user.id,
            authProvider: 'github'
        });

        res.redirect('http://localhost:3000/');
    }

);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login',
        failureMessage: true
    }),
    (req, res) => {
        if (!req.user) {
            logger.error('Google authentication failed - no user data');
            return res.redirect('/login');
        }

        const user = req.user as User;
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || '$2a$04$Ls3wM2PzVdm.08FoS3sv3uANW.EkuhFhNdSeuBNpKkXInkXumGgkm',
            { expiresIn: '1h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000,
        });
        logger.info('User logged in successfully', {
            userId: user.id,
            authProvider: 'google'
        });

        res.redirect('http://localhost:3000/');
    }
);



router.get('/logout', (req, res) => {
    res.clearCookie('token');
    logger.info('User logged out', { userId: req.user?.id });
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            logger.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

export default router;