import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { modulesRouter } from './routes/modules';
import { projectsRouter } from './routes/projects';
import { categoriesRouter } from './routes/categories';
import { webhooksRouter } from './routes/webhooks';
import { runnerRouter } from './routes/runner';
import gitRouter from './routes/git';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(
  express.json({
    limit: '50mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads directory for downloads
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'ModuleForge API Server',
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'development',
    supabaseConfigured: Boolean(process.env.SUPABASE_URL),
  });
});

// Mock dev auth / current user endpoint
app.get('/api/auth/me', (req, res) => {
  res.json({
    user: {
      id: 'dev-user-001',
      email: 'dev@moduleforge.io',
      name: 'Developer Mode User',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isDev: true,
    },
    mode: 'development_fallback',
  });
});

// API Routes
app.use('/api/modules', modulesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/github/webhook', webhooksRouter);
app.use('/api/runner', runnerRouter);
app.use('/api/git', gitRouter);

app.listen(PORT, () => {
  console.log(`🚀 ModuleForge server running on http://localhost:${PORT}`);
});
