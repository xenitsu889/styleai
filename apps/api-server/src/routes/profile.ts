import express from 'express';
import { db } from '../services/firebase';
import { AuthedRequest } from '../middleware/auth';
import { UserProfile } from '../types';

const router = express.Router();

router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const profile = req.body as UserProfile;
    // Enforce authenticated UID for profile writes
    const uid = req.user?.uid || profile?.userId;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    await db.collection('profiles').doc(uid).set({ ...profile, userId: uid }, { merge: true });
    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
});

router.get('/:userId?', async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.params.userId || req.user?.uid;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const doc = await db.collection('profiles').doc(userId).get();
    res.json(doc.exists ? doc.data() : { error: 'Profile not found' });
  } catch (err) {
    next(err);
  }
});

export default router;


