import express from 'express'
import auth from '../middleware/auth'

const router = express.Router()

router.get('/test-auth', auth, async (req, res) => {
    if(!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user: req.user });
})

export default router;