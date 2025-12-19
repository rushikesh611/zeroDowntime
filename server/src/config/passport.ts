import passport from 'passport';
import { Strategy as GithubStrategy } from 'passport-github2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import { PrismaClient, User as PrismaUser } from "@prisma/client";

const prisma = new PrismaClient()

type User = {
    id: string;
    githubId: string | null;
    googleId?: string | null;
    username: string;
    email: string | null;
    avatarUrl: string | null;
};

passport.use(new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackURL: process.env.GITHUB_CALLBACK_URL || '',
    scope: ['user:email']
},
    async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
        try {
            // First, try to find by GitHub ID
            let user = await prisma.user.findUnique({
                where: { githubId: profile.id }
            });

            if (user) {
                return done(null, user);
            }

            // If not found by GitHub ID, try to find by email
            const email = profile.emails?.[0]?.value;
            if (email) {
                user = await prisma.user.findFirst({
                    where: { email: email }
                });

                if (user) {
                    // Start of Selection
                    // User exists with this email, link the GitHub account
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            githubId: profile.id,
                            avatarUrl: user.avatarUrl || profile.photos?.[0]?.value // Update avatar if not present
                        }
                    });
                    return done(null, user);
                }
            }

            // If user doesn't exist, create a new one
            user = await prisma.user.create({
                data: {
                    githubId: profile.id,
                    username: profile.username,
                    email: email, // Can be null if not provided
                    avatarUrl: profile.photos?.[0]?.value
                }
            });

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
    scope: ['profile', 'email']
},
    async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
        try {
            // First, try to find by Google ID
            let user = await prisma.user.findUnique({
                where: { googleId: profile.id }
            });

            if (user) {
                return done(null, user);
            }

            // If not found by Google ID, try to find by email
            const email = profile.emails?.[0]?.value;
            if (email) {
                user = await prisma.user.findFirst({
                    where: { email: email }
                });

                if (user) {
                    // User exists with this email, link the Google account
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            googleId: profile.id,
                            avatarUrl: user.avatarUrl || profile.photos?.[0]?.value
                        }
                    });
                    return done(null, user);
                }
            }

            // If user doesn't exist, create a new one
            user = await prisma.user.create({
                data: {
                    googleId: profile.id,
                    username: profile.displayName,
                    email: email,
                    avatarUrl: profile.photos?.[0]?.value
                }
            });

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

passport.serializeUser((user: User, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id }
        });
        done(null, user);
    } catch (error) {
        done(error);
    }
});

declare global {
    namespace Express {
        interface User extends PrismaUser { }
    }
}

export default passport;