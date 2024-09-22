import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

const router = express.Router();

router.get('/github', passport.authenticate('github'));

router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
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

        res.redirect('http://localhost:3000/');
    });

    

router.get('/logout', (req, res) => {
    res.clearCookie('token');
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

export default router;