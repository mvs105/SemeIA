import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  AiError,
  interpretRuleBasedFallback,
  interpretWithGemini,
  interpretWithOllama,
} from './server/interpreter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_REQ_FIELDS = new Set(['texto', 'dataReferencia']);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.argv.includes('--production') || process.env.NODE_ENV === 'production';

  app.use(express.json());

  app.post('/api/v1/interpretacoes', async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        codigo: 'JSON_INVALIDO',
        mensagem: 'O corpo da requisição deve ser um objeto JSON.',
      });
    }

    const unknownKeys = Object.keys(req.body).filter((key) => !ALLOWED_REQ_FIELDS.has(key));
    if (unknownKeys.length > 0) {
      return res.status(400).json({
        codigo: 'JSON_INVALIDO',
        mensagem: 'O corpo da requisição contém campos não permitidos.',
      });
    }

    const { texto, dataReferencia } = req.body;

    if (typeof texto !== 'string' || texto.trim().length < 3 || texto.trim().length > 500) {
      return res.status(422).json({
        codigo: 'ENTRADA_INVALIDA',
        mensagem: 'A descrição deve ter entre 3 e 500 caracteres.',
      });
    }

    if (
      typeof dataReferencia !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dataReferencia) ||
      isNaN(new Date(`${dataReferencia}T00:00:00Z`).getTime())
    ) {
      return res.status(422).json({
        codigo: 'ENTRADA_INVALIDA',
        mensagem: 'A data de referência deve estar no formato ISO YYYY-MM-DD.',
      });
    }

    const trimmedText = texto.trim();

    try {
      let result = null;

      // 1. Gemini
      if (process.env.GEMINI_API_KEY) {
        result = await interpretWithGemini(trimmedText, dataReferencia);
      }

      // 2. Ollama
      if (!result && process.env.OLLAMA_BASE_URL) {
        result = await interpretWithOllama(trimmedText, dataReferencia);
      }

      // 3. Rule-based fallback
      if (!result) {
        result = interpretRuleBasedFallback(trimmedText, dataReferencia);
      }

      return res.status(200).json(result);
    } catch (err) {
      if (err instanceof AiError) {
        return res.status(err.status).json({
          codigo: err.code,
          mensagem: err.message,
        });
      }
      return res.status(500).json({
        codigo: 'ERRO_INTERNO',
        mensagem: 'Ocorreu um erro interno ao processar a interpretação.',
      });
    }
  });

  // Vite middleware for dev or static files for prod
  if (!isProduction) {
    const vite = await createViteServer({
      root: path.resolve(__dirname, 'frontend'),
      configFile: path.resolve(__dirname, 'vite.config.js'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist/client');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
