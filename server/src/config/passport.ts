import passport from 'passport'
import { Strategy as GithubStrategy } from 'passport-github2';
import { PrismaClient, User as PrismaUser } from '@prisma/client'

const prisma = new PrismaClient()

type User = {
    id: string;
    githubId: string;
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
            let user = await prisma.user.findUnique({
                where: { githubId: profile.id }
            });

            if (!user) {
                user = await prisma.user.create({
                    data: {
                        githubId: profile.id,
                        username: profile.username,
                        email: profile.emails[0].value,
                        avatarUrl: profile.photos[0].value
                    }
                });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
))

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