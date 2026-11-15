import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  const CMS_STATE_PATH = path.join(process.cwd(), 'src', 'data', 'cms_state.json');

  // Helper to read CMS state safely
  const readCmsState = () => {
    try {
      if (fs.existsSync(CMS_STATE_PATH)) {
        const content = fs.readFileSync(CMS_STATE_PATH, 'utf-8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.warn('Failed to read cms_state.json, returning empty defaults:', err);
    }
    return {
      spreadsheetId: '',
      lastSynced: null,
      headingLogo: '',
      profilePhoto: '',
      portfolioList: [],
      servicesData: null,
    };
  };

  // Helper to save CMS state safely
  const saveCmsState = (data: any) => {
    try {
      const dir = path.dirname(CMS_STATE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CMS_STATE_PATH, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Failed to write cms_state.json:', err);
      return false;
    }
  };

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get active CMS configuration (Spreadsheet ID, Portfolio items, Services, Profile photo, Heading Logo)
  // Used by all devices (Mobile/HP, Desktop, and Visitors) to synchronize automatically
  app.get('/api/cms/config', (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      const state = readCmsState();
      res.json({
        success: true,
        data: state,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Save active CMS configuration so it persists across all devices
  app.post('/api/cms/config', (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      const existing = readCmsState();
      
      const updated = {
        ...existing,
        lastSynced: new Date().toISOString(),
      };

      // Spreadsheet ID
      if (typeof req.body.spreadsheetId === 'string' && req.body.spreadsheetId.trim()) {
        updated.spreadsheetId = req.body.spreadsheetId.trim();
      }

      // Heading Logo: accept updated URL or base64 dataUrl, or explicit reset
      if (typeof req.body.headingLogo === 'string') {
        updated.headingLogo = req.body.headingLogo.trim();
      }

      // Profile Photo: accept updated URL or base64 dataUrl
      if (typeof req.body.profilePhoto === 'string' && req.body.profilePhoto.trim()) {
        updated.profilePhoto = req.body.profilePhoto.trim();
      }

      // Portfolio items: ONLY overwrite if array has items, or if forceEmptyPortfolio is true
      if (Array.isArray(req.body.portfolioList)) {
        if (req.body.portfolioList.length > 0 || req.body.forceEmptyPortfolio) {
          updated.portfolioList = req.body.portfolioList;
        }
      }

      // Services data: ONLY overwrite if valid tiers exist, or if forceEmptyServices is true
      if (req.body.servicesData && req.body.servicesData.tiers && req.body.servicesData.tiers.length > 0) {
        updated.servicesData = req.body.servicesData;
      }

      const saved = saveCmsState(updated);
      if (saved) {
        res.json({ success: true, data: updated });
      } else {
        res.status(500).json({ success: false, error: 'Gagal menyimpan status CMS ke disk server' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Server-side proxy for Google Sheets public visualization endpoint
  // Bypasses any mobile operator CORS or webview network blocks with cache-busting
  app.get('/api/cms/sheets-proxy', async (req, res) => {
    const { id, sheet } = req.query;
    if (!id || !sheet) {
      return res.status(400).json({ success: false, error: 'Parameter id dan sheet wajib diisi' });
    }

    try {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const gvizUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
        String(id)
      )}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(String(sheet))}&_t=${Date.now()}`;

      const response = await fetch(gvizUrl, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        const isAuthError = response.status === 401 || response.status === 403;
        return res.status(response.status).json({
          success: false,
          isUnauthorized: isAuthError,
          status: response.status,
          error: isAuthError
            ? 'Google Sheet saat ini berstatus Privat/Dibatasi. Diperlukan mengubah izin Berbagi (Share) menjadi "Siapa saja yang memiliki link: Pelihat" agar HP dapat membaca data tanpa login.'
            : `Google Sheets mengembalikan status ${response.status}`,
        });
      }

      const text = await response.text();
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        return res.status(502).json({
          success: false,
          error: 'Format data Google Sheets tidak sesuai atau file belum dibuka akses publik',
        });
      }

      const jsonStr = text.substring(firstBrace, lastBrace + 1);
      const data = JSON.parse(jsonStr);

      if (!data.table || !data.table.rows) {
        return res.json({ success: true, rows: [] });
      }

      // Convert gviz table rows into 2D array
      const headerRow: string[] = (data.table.cols || []).map(
        (col: any) => col.label || col.id || ''
      );

      const dataRows: string[][] = data.table.rows.map((r: any) => {
        if (!r || !r.c) return [];
        return r.c.map((cell: any) => {
          if (!cell) return '';
          if (cell.f !== undefined && cell.f !== null) return String(cell.f);
          if (cell.v !== undefined && cell.v !== null) return String(cell.v);
          return '';
        });
      });

      // Include headers if present in cols
      const hasLabels = headerRow.some((h) => h && h.length > 0);
      const rows = hasLabels ? [headerRow, ...dataRows] : dataRows;

      res.json({ success: true, rows });
    } catch (err: any) {
      console.error('Sheets proxy error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware setup with instant CMS state injection for zero-delay mobile rendering
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Intercept HTML requests in dev mode to inject window.__INITIAL_CMS_CONFIG__
    app.use(async (req, res, next) => {
      const isHtml = req.headers.accept?.includes('text/html');
      if (req.method === 'GET' && isHtml && !req.url.startsWith('/api') && !req.url.includes('.')) {
        try {
          const url = req.originalUrl;
          let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          const state = readCmsState();
          const injection = `<script>window.__INITIAL_CMS_CONFIG__ = ${JSON.stringify(state).replace(/</g, '\\u003c')};</script>`;
          template = template.replace('</head>', `${injection}</head>`);
          res.status(200).set({
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          }).end(template);
          return;
        } catch (e) {
          return next(e);
        }
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      try {
        const state = readCmsState();
        let html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
        const injection = `<script>window.__INITIAL_CMS_CONFIG__ = ${JSON.stringify(state).replace(/</g, '\\u003c')};</script>`;
        html = html.replace('</head>', `${injection}</head>`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
