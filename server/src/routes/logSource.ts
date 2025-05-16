import express from 'express';
import { LogSourceService } from '../services/logSourceService';
import auth from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Create a new log source
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user!.id;

    const logSource = await LogSourceService.createLogSource(userId, name);
    logger.info('Log source created', { userId, sourceId: logSource.id });

    res.json({
      id: logSource.id,
      name: logSource.name,
      apiKey: logSource.apiKey
    })
  } catch (error) {
    logger.error('Error creating log source', { error });
    res.status(500).json({ error: 'Failed to create log source' });
  }
})

// Get all log sources for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user!.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const sources = await LogSourceService.getLogSources(userId);

    res.json(sources.map(s => ({
      id: s.id,
      name: s.name,
      apiKey: s.apiKey,
      createdAt: s.createdAt
    })));

  } catch (error) {
    logger.error('Failed to fetch log sources', { error });
    res.status(500).json({ error: 'Failed to fetch log sources' });
  }
});

// Delete a log source
router.delete('/:id', auth, async (req, res) => {
  const userId = req.user!.id;
  const sourceId = req.params.id;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    await LogSourceService.deleteLogSource(sourceId, userId);
    logger.info('Log source deleted', { userId, sourceId });
    res.status(200).json({ message: 'Log source deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete log source', { error });
    res.status(500).json({ error: 'Failed to delete log source' });
  }
});


// validate API key
router.get("/validate", async (req, res) => {
  const apiKey = req.header('X-API-Key');

  if (!apiKey) {
    logger.warn('API key validation attempted without key');
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const source = await LogSourceService.validateApiKey(apiKey);
    if (!source) {
      logger.warn('Invalid API key used', { maskedKey: `${apiKey.substr(0, 4)}...` });
      return res.status(401).json({ error: 'Invalid API key' });
    }

    res.json({
      id: source.id,
      name: source.name,
      userId: source.userId
    })
  } catch (error) {
    logger.error('API key validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      maskedKey: `${apiKey.substr(0, 4)}...`
    });
    res.status(500).json({ error: 'Failed to validate API key' });
  }
})

export default router;