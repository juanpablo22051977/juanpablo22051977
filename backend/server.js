import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './systemPrompt.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY no está configurada. Ejecuta: export ANTHROPIC_API_KEY=tu-clave');
  }
  return new Anthropic({ apiKey });
};

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Se requiere un array de messages' });
    }

    const client = getClient();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    res.json({ content });
  } catch (error) {
    console.error('Error:', error.message);
    const status = error.status || 500;
    res.status(status).json({
      error: error.message || 'Error interno del servidor',
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 C-Level Strategic AI Backend corriendo en http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('\n⚠️  ANTHROPIC_API_KEY no configurada. Ejecuta:');
    console.warn('   export ANTHROPIC_API_KEY=tu-api-key-de-anthropic\n');
  }
});
