import express from 'express';
import auth from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get teams (owned and member of)
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user!.id;

        const ownedTeam = await prisma.team.findFirst({
            where: { adminId: userId },
            include: {
                members: {
                    include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } }
                },
                monitors: {
                    include: { monitor: true }
                }
            }
        });

        const memberTeams = await prisma.teamMember.findMany({
            where: { userId },
            include: {
                team: {
                    include: { 
                        admin: { select: { id: true, username: true, email: true, avatarUrl: true } },
                        monitors: { include: { monitor: true } }
                    }
                }
            }
        });

        res.json({
            ownedTeam,
            memberTeams: memberTeams.map(mt => ({ 
                ...mt.team, 
                role: mt.role,
                monitors: mt.team.monitors.map(m => m.monitor)
            }))
        });
    } catch (error) {
        logger.error('Error getting teams:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add monitor to team
router.post('/monitors', auth, async (req, res) => {
    try {
        const adminId = req.user!.id;
        const { monitorId } = req.body;

        const team = await prisma.team.findFirst({ where: { adminId } });
        if (!team) return res.status(404).json({ error: 'Team not found' });

        // Verify admin owns the monitor
        const monitor = await prisma.monitor.findUnique({ where: { id: monitorId, userId: adminId } });
        if (!monitor) return res.status(404).json({ error: 'Monitor not found or not owned by you' });

        const monitorTeam = await prisma.monitorTeam.upsert({
            where: { monitorId_teamId: { monitorId, teamId: team.id } },
            create: { monitorId, teamId: team.id },
            update: {}
        });

        res.json(monitorTeam);
    } catch (error) {
        logger.error('Error adding monitor to team:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove monitor from team
router.delete('/monitors/:monitorId', auth, async (req, res) => {
    try {
        const adminId = req.user!.id;
        const { monitorId } = req.params;

        const team = await prisma.team.findFirst({ where: { adminId } });
        if (!team) return res.status(404).json({ error: 'Team not found' });

        await prisma.monitorTeam.deleteMany({
            where: { monitorId, teamId: team.id }
        });

        res.json({ success: true });
    } catch (error) {
        logger.error('Error removing monitor from team:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Invite a user to the owned team
router.post('/invite', auth, async (req, res) => {
    try {
        const adminId = req.user!.id;
        const { email, role } = req.body; // role: READ or WRITE

        // Check if user is on PRO or PRO_PLUS
        const admin = await prisma.user.findUnique({ where: { id: adminId } });
        if (!admin || admin.plan === 'FREE') {
            return res.status(403).json({ error: 'Team features require a Pro or Pro Plus subscription.' });
        }

        const team = await prisma.team.findFirst({
            where: { adminId },
            include: { members: true }
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check plan limits
        const limit = admin.plan === 'PRO' ? 20 : 50;
        if (team.members.length >= limit) {
            return res.status(403).json({ error: `Member limit reached for ${admin.plan} plan.` });
        }

        const invitee = await prisma.user.findFirst({ where: { email } });
        if (!invitee) {
            return res.status(404).json({ error: 'User with this email not found. They must sign up first.' });
        }

        if (invitee.id === adminId) {
            return res.status(400).json({ error: 'You cannot invite yourself.' });
        }

        const existingMember = await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId: team.id, userId: invitee.id } }
        });

        if (existingMember) {
            return res.status(400).json({ error: 'User is already a member of this team.' });
        }

        const newMember = await prisma.teamMember.create({
            data: {
                teamId: team.id,
                userId: invitee.id,
                role: role || 'READ'
            },
            include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } }
        });

        res.json(newMember);
    } catch (error) {
        logger.error('Error inviting to team:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update member role
router.put('/members/:memberId', auth, async (req, res) => {
    try {
        const adminId = req.user!.id;
        const { memberId } = req.params;
        const { role } = req.body;

        const team = await prisma.team.findFirst({ where: { adminId } });
        if (!team) return res.status(404).json({ error: 'Team not found' });

        const updated = await prisma.teamMember.updateMany({
            where: { 
                id: memberId,
                teamId: team.id // Ensure they belong to this admin's team
            },
            data: { role }
        });

        if (updated.count === 0) {
            return res.status(404).json({ error: 'Member not found in your team' });
        }

        res.json({ message: 'Member role updated successfully' });
    } catch (error) {
        logger.error('Error updating member role:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove member
router.delete('/members/:memberId', auth, async (req, res) => {
    try {
        const adminId = req.user!.id;
        const { memberId } = req.params;

        const team = await prisma.team.findFirst({ where: { adminId } });
        if (!team) return res.status(404).json({ error: 'Team not found' });

        await prisma.teamMember.deleteMany({
            where: {
                id: memberId,
                teamId: team.id // Ensure they belong to this admin's team
            }
        });

        res.json({ success: true });
    } catch (error) {
        logger.error('Error removing member:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
