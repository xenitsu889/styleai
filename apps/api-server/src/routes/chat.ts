import express from 'express';
import admin from 'firebase-admin';
import { db } from '../services/firebase';
import { AuthedRequest } from '../middleware/auth';
import { callChat } from '../services/openai';
import { buildMessages } from '../services/promptBuilder';
import { tryParseJsonFromMarkdown } from '../utils/parser';

const router = express.Router();

// Create a new chat session and optionally add the first message
router.post('/', async (req: AuthedRequest, res, next) => {
  try {
    const { message, chatId } = req.body as { userId?: string; message?: string; chatId?: string };
    // Require authenticated user for chat creation/appending
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    const profileDoc = await db.collection('profiles').doc(uid).get();
    if (!profileDoc.exists) return res.status(404).json({ error: 'Profile not found' });

    const profile = profileDoc.data() as any;

    // If chatId provided and exists, append a message to that chat's messages subcollection
    if (chatId) {
      const chatRef = db.collection('profiles').doc(uid).collection('chats').doc(chatId);
      const chatDoc = await chatRef.get();
      if (!chatDoc.exists) return res.status(404).json({ error: 'Chat not found' });

      if (!message) return res.status(400).json({ error: 'message is required when appending to a chat' });

      const academicPattern = /\b(code|program|python|java|c\+\+|javascript|algorithm|equation|integral|derivative|physics|chemistry|biology|calculus|math|solve|compute|formula|theorem)\b/i;
      let parsed: any;
      if (academicPattern.test(message)) {
        parsed = {
          reply: "I focus on style, lifestyle and confidence—not technical or academic topics. Tell me about your day, mood or any outfit question and I'll jump in.",
          explain: "Scope limited to fashion & lifestyle.",
          tags: ["boundary"],
        };
      } else {
        const messagesForPrompt = buildMessages(profile, message);
        const raw = await callChat(messagesForPrompt);
        parsed = tryParseJsonFromMarkdown(raw);
        // Defensive cleanup: ensure reply does not contain trailing JSON and
        // provide a friendly explain when parser failed to extract one.
        if (parsed && typeof parsed === 'object') {
          if (parsed.reply && typeof parsed.reply === 'string') {
            parsed.reply = parsed.reply.replace(/```(?:json)?[\s\S]*?```/g, '').replace(/\{[\s\S]*"selected_item_ids"[\s\S]*\}\s*$/g, '').trim();
          }
          if (!parsed.explain || String(parsed.explain).toLowerCase().includes('unable to parse json')) {
            parsed.explain = parsed.reply || 'Suggested items from your wardrobe.';
          }
        }
      }

      await chatRef.collection('messages').add({
        userMessage: message,
        response: parsed,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      await chatRef.update({ updatedAt: admin.firestore.FieldValue.serverTimestamp() });

      return res.json({ chatId, ...parsed });
    }

    // No chatId: create a new chat doc and optionally add the first message
  const initialChatData: Record<string, any> = {
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (req.body.mode) {
      initialChatData.mode = req.body.mode;
    }

    const chatDocRef = await db.collection('profiles').doc(uid).collection('chats').add(initialChatData);

    if (message) {
      const academicPattern = /\b(code|program|python|java|c\+\+|javascript|algorithm|equation|integral|derivative|physics|chemistry|biology|calculus|math|solve|compute|formula|theorem)\b/i;
      let parsed: any;
      if (academicPattern.test(message)) {
        parsed = {
          reply: "I’m here for style, mood and personal vibe conversations—not academic or technical help. Share what you feel like wearing or how your day’s going!",
          explain: "Keeping focus on fashion & lifestyle.",
          tags: ["boundary"],
        };
      } else {
        const messagesForPrompt = buildMessages(profile, message);
        const raw = await callChat(messagesForPrompt);
        parsed = tryParseJsonFromMarkdown(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.reply && typeof parsed.reply === 'string') {
            parsed.reply = parsed.reply.replace(/```(?:json)?[\s\S]*?```/g, '').replace(/\{[\s\S]*"selected_item_ids"[\s\S]*\}\s*$/g, '').trim();
          }
          if (!parsed.explain || String(parsed.explain).toLowerCase().includes('unable to parse json')) {
            parsed.explain = parsed.reply || 'Suggested items from your wardrobe.';
          }
        }
      }

      await chatDocRef.collection('messages').add({
        userMessage: message,
        response: parsed,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.json({ chatId: chatDocRef.id, ...parsed });
    }

    // created empty chat
    res.json({ chatId: chatDocRef.id });
  } catch (err) {
    next(err);
  }
});

router.get('/:userId?', async (req: AuthedRequest, res, next) => {
  try {
    // Allow reading chat history publicly by userId param, or use authenticated uid
    const userId = req.params.userId || req.user?.uid;
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    const snapshot = await db
      .collection('profiles')
      .doc(userId)
      .collection('chats')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const toIsoString = (value: any) => {
      if (!value) return undefined;
      if (typeof value === 'string') return value;
      if (value instanceof Date) return value.toISOString();
      if (value && typeof (value as any).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate().toISOString();
      }
      if (value && typeof (value as any).seconds === 'number') {
        const { seconds, nanoseconds } = value as { seconds: number; nanoseconds?: number };
        const ms = seconds * 1000 + Math.floor((nanoseconds || 0) / 1_000_000);
        return new Date(ms).toISOString();
      }
      if (value && typeof (value as any)._seconds === 'number') {
        const { _seconds, _nanoseconds } = value as { _seconds: number; _nanoseconds?: number };
        const ms = _seconds * 1000 + Math.floor((_nanoseconds || 0) / 1_000_000);
        return new Date(ms).toISOString();
      }
      return undefined;
    };
    
    const chats = await Promise.all(
      snapshot.docs.map(async (d) => {
        const data = d.data() as any;
        // read messages subcollection (if present)
        const msgsSnap = await d.ref.collection('messages').orderBy('timestamp', 'asc').get();
        const messages: any[] = msgsSnap.docs.map((m) => {
          const msgData = m.data() as any;
          return {
            id: m.id,
            ...msgData,
            timestamp: toIsoString(msgData.timestamp) || undefined,
          };
        });

        // back-compat: if legacy doc had message/response fields, include them as a single message
        if (data.message && data.response) {
          messages.unshift({
            id: `${d.id}-legacy`,
            userMessage: data.message,
            response: data.response,
            timestamp: toIsoString(data.timestamp || data.createdAt) || undefined,
          });
        }

        return {
          id: d.id,
          ...data,
          createdAt: toIsoString(data.createdAt) || undefined,
          updatedAt: toIsoString(data.updatedAt) || undefined,
          messages,
        };
      })
    );

    res.json({ chats });
  } catch (err) {
    next(err);
  }
});

// Delete a specific chat document for a user
router.delete('/:userId/:chatId', async (req: AuthedRequest, res, next) => {
  try {
    // Only allow authenticated user to delete their chats
    const userId = req.user?.uid || req.params.userId;
    const chatId = req.params.chatId;
    if (!userId || !chatId) return res.status(400).json({ error: 'userId and chatId are required' });

    const chatRef = db.collection('profiles').doc(userId).collection('chats').doc(chatId);
    const doc = await chatRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Chat not found' });

    const messagesSnap = await chatRef.collection('messages').get();
    if (!messagesSnap.empty) {
      const batch = db.batch();
      messagesSnap.forEach((msgDoc) => batch.delete(msgDoc.ref));
      await batch.commit();
    }

    await chatRef.delete();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;


