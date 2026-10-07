import express from 'express';
import cors from 'cors';
import routes from './routes.js';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '12mb' }));
app.get('/api/health', (_req,res)=>res.json({ok:true,service:'hiral-jewels-api'}));
app.use('/api', routes);
// Netlify Functions may pass the rewritten path without the /api prefix.
// Mount the same router at both paths so production and local routing both work.
app.use(routes);
app.use((err,_req,res,_next)=>{ console.error(err); res.status(500).json({message:'Internal server error'}); });
export default app;
