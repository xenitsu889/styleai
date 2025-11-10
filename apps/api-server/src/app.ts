import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { limiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { requireAuth } from './middleware/requireAuth';
import chatRouter from './routes/chat';
import imageRouter from './routes/image';
import profileRouter from './routes/profile';
import wardrobeRouter from './routes/wardrobe';
import uploadRouter from './routes/upload';

const app = express();
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json({ limit: '10mb' }));
// Attach optional authenticated user (if Authorization header present)
app.use(authenticate);
app.use(limiter);

// Public profile read is allowed; saving profile requires auth (handled in router)
app.use('/api/profile', profileRouter);

// Wardrobe routes: reading is allowed, writes are protected inside router via requireAuth
app.use('/api/wardrobe', wardrobeRouter);

// Chat routes: creating/appending/deleting chats require auth (enforced in router)
app.use('/api/chat', chatRouter);

app.use('/api/image', imageRouter);
app.use('/api/upload', uploadRouter);

app.use(errorHandler);

export default app;


