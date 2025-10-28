const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

const { encrypt, decrypt } = require('./utils/encryption');
const emailService = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize database
const initDB = async () => {
  const client = await pool.connect();
  try {
    // Journal entries table with mood field
    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        content TEXT NOT NULL,
        ai_response TEXT,
        mood VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add metadata columns if missing
    await client.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS tags TEXT[]`);
    await client.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS emotions TEXT[]`);
    await client.query(`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS emotion_keywords TEXT[]`);

    // User settings table for SMTP configuration and Ollama
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        smtp_host VARCHAR(255),
        smtp_port INTEGER,
        smtp_username VARCHAR(255),
        smtp_password TEXT,
        smtp_from_email VARCHAR(255),
        recipient_email VARCHAR(255),
        email_enabled BOOLEAN DEFAULT false,
        email_schedule VARCHAR(50) DEFAULT 'sunday_6pm',
        ollama_host VARCHAR(255),
        ollama_model VARCHAR(100) DEFAULT 'llama2',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add ollama columns if they don't exist (migration)
    await client.query(`
      ALTER TABLE user_settings
      ADD COLUMN IF NOT EXISTS ollama_host VARCHAR(255),
      ADD COLUMN IF NOT EXISTS ollama_model VARCHAR(100) DEFAULT 'llama2'
    `);

    // Email logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        email_type VARCHAR(50),
        recipient VARCHAR(255),
        status VARCHAR(50),
        message_id VARCHAR(255),
        entries_count INTEGER,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure at least one settings row exists
    const settingsCheck = await client.query('SELECT COUNT(*) FROM user_settings');
    if (parseInt(settingsCheck.rows[0].count) === 0) {
      await client.query('INSERT INTO user_settings (email_enabled) VALUES (false)');
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
};

initDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ollama configuration
const DEFAULT_OLLAMA_HOST = process.env.OLLAMA_HOST || 'host.docker.internal:11434';
const getOllamaHost = async () => {
  try {
    const result = await pool.query('SELECT ollama_host FROM user_settings ORDER BY id DESC LIMIT 1');
    return result.rows[0]?.ollama_host || DEFAULT_OLLAMA_HOST;
  } catch (err) {
    return DEFAULT_OLLAMA_HOST;
  }
};

const getOllamaModel = async () => {
  try {
    const result = await pool.query('SELECT ollama_model FROM user_settings ORDER BY id DESC LIMIT 1');
    return result.rows[0]?.ollama_model || 'llama2';
  } catch (err) {
    return 'llama2';
  }
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Journal API is running' });
});

// Get all journal entries
app.get('/api/entries', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM journal_entries ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching entries:', err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// Get single journal entry
app.get('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM journal_entries WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching entry:', err);
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
});

// Create new journal entry
app.post('/api/entries', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO journal_entries (title, content) VALUES ($1, $2) RETURNING *',
      [title || 'Untitled Entry', content]
    );

    const entry = result.rows[0];

    try {
      const meta = await analyzeEntryMetadata(content);
      const upd = await pool.query(
        `UPDATE journal_entries
         SET tags = $1, emotions = $2, emotion_keywords = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 RETURNING *`,
        [meta.tags, meta.emotions, meta.keywords, entry.id]
      );
      return res.status(201).json(upd.rows[0]);
    } catch (metaErr) {
      console.warn('AI metadata analysis failed:', metaErr.message || metaErr);
      // Return entry without metadata if AI fails
      return res.status(201).json(entry);
    }
  } catch (err) {
    console.error('Error creating entry:', err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// Analyze entry to extract tags and emotions
async function analyzeEntryMetadata(content) {
  const ollamaHost = await getOllamaHost();
  const ollamaModel = await getOllamaModel();
  const prompt = `You extract structured metadata from journal entries.
Return STRICT JSON with keys: tags (array of exactly 3 short lowercase tags), emotions (array of 2-5 primary emotions from [joy, sadness, anger, fear, disgust, surprise, love, anxiety, gratitude, frustration, calm, stress, loneliness, hope]), keywords (array of 3-10 short emotion-expressive words or phrases copied from the entry, lowercase, no punctuation).
No commentary. Only JSON.

Entry:\n${content}\n`;

  const response = await axios.post(`http://${ollamaHost}/api/generate`, {
    model: ollamaModel,
    prompt,
    stream: false,
  });

  const raw = (response.data && response.data.response) || '{}';
  let parsed;
  try {
    // Try to parse as-is
    parsed = JSON.parse(extractJson(raw));
  } catch (e) {
    // Fallback to basic defaults
    parsed = { tags: [], emotions: [], keywords: [] };
  }

  // Normalize arrays
  const toArr = (v) => Array.isArray(v) ? v : (v ? [String(v)] : []);
  const normStr = (s) => String(s || '').toLowerCase().trim().replace(/["'`]/g, '');
  const uniq = (arr) => Array.from(new Set(arr.map(normStr))).filter(Boolean);

  const tags = uniq(toArr(parsed.tags)).slice(0, 3);
  const emotions = uniq(toArr(parsed.emotions)).slice(0, 8);
  const keywords = uniq(toArr(parsed.keywords)).slice(0, 12);

  // Ensure exactly 3 tags by deriving from content if needed
  while (tags.length < 3) {
    const fallback = deriveTagsFromContent(content, tags);
    if (!fallback) break;
    if (!tags.includes(fallback)) tags.push(fallback);
  }

  return { tags, emotions, keywords };
}

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return '{}';
}

function deriveTagsFromContent(content, existing) {
  const words = String(content || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
  const blacklist = new Set(['this','that','with','have','just','really','about','from','were','will','would','could','there','their','which','because','into','being','while','after','before','again','maybe','might','very','much','more','some','what','when','where','your','they','them','been','over','also']);
  const counts = new Map();
  for (const w of words) {
    if (blacklist.has(w)) continue;
    if (existing.includes(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  let best = null, bestCount = 0;
  for (const [w, c] of counts) {
    if (c > bestCount) { best = w; bestCount = c; }
  }
  return best;
}

// Update journal entry
app.put('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, ai_response } = req.body;
    
    const result = await pool.query(
      `UPDATE journal_entries 
       SET title = $1, content = $2, ai_response = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 RETURNING *`,
      [title, content, ai_response, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating entry:', err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// Re-analyze emotions/tags for an entry
app.post('/api/entries/:id/metadata', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM journal_entries WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    const entry = result.rows[0];
    const meta = await analyzeEntryMetadata(entry.content);
    const upd = await pool.query(
      `UPDATE journal_entries
       SET tags = $1, emotions = $2, emotion_keywords = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [meta.tags, meta.emotions, meta.keywords, id]
    );
    res.json(upd.rows[0]);
  } catch (err) {
    console.error('Metadata re-analysis failed:', err.message);
    res.status(500).json({ error: 'Failed to re-analyze metadata', details: err.message });
  }
});

// Re-analyze AI insight for an entry (concise)
app.post('/api/entries/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM journal_entries WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    const entry = existing.rows[0];

    const systemPrompt = (req.body && req.body.prompt) ||
      'Provide a concise, supportive analysis (under 120 words).\n- Identify key emotions (2-4).\n- Note one helpful pattern.\n- Give one practical, gentle suggestion.\nAvoid repetition and avoid disclaimers.';

    const fullPrompt = `${systemPrompt}\n\nJournal Entry:\n${entry.content}`;
    const ollamaHost = await getOllamaHost();
    const ollamaModel = await getOllamaModel();
    const response = await axios.post(`http://${ollamaHost}/api/generate`, {
      model: ollamaModel,
      prompt: fullPrompt,
      stream: false,
    });

    const aiText = response.data.response;
    const upd = await pool.query(
      `UPDATE journal_entries SET ai_response = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [aiText, id]
    );
    res.json(upd.rows[0]);
  } catch (err) {
    console.error('AI analysis re-run failed:', err.message);
    res.status(500).json({ error: 'Failed to re-analyze entry', details: err.message });
  }
});

// Delete journal entry
app.delete('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM journal_entries WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json({ message: 'Entry deleted successfully' });
  } catch (err) {
    console.error('Error deleting entry:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// AI Analysis endpoint - Get insights from Ollama
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { content, prompt } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const systemPrompt = prompt ||
      'Provide a concise, supportive analysis (under 120 words).\n- Identify key emotions (2-4).\n- Note one helpful pattern.\n- Give one practical, gentle suggestion.\nAvoid repetition and avoid disclaimers.';

    const fullPrompt = `${systemPrompt}\n\nJournal Entry:\n${content}`;

    const ollamaHost = await getOllamaHost();
    const ollamaModel = await getOllamaModel();

    const response = await axios.post(`http://${ollamaHost}/api/generate`, {
      model: ollamaModel,
      prompt: fullPrompt,
      stream: false,
    });

    res.json({
      response: response.data.response,
      model: response.data.model
    });
  } catch (err) {
    console.error('Error calling Ollama:', err.message);
    res.status(500).json({
      error: 'Failed to analyze entry with AI',
      details: err.message
    });
  }
});

// AI Chat endpoint - Interactive conversation
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let fullPrompt = 'You are a supportive mental health companion. Engage in a caring conversation.\n\n';

    if (context) {
      fullPrompt += `Previous context:\n${context}\n\n`;
    }

    fullPrompt += `User: ${message}\nAssistant:`;

    const ollamaHost = await getOllamaHost();
    const ollamaModel = await getOllamaModel();

    const response = await axios.post(`http://${ollamaHost}/api/generate`, {
      model: ollamaModel,
      prompt: fullPrompt,
      stream: false,
    });

    res.json({
      response: response.data.response,
      model: response.data.model
    });
  } catch (err) {
    console.error('Error in AI chat:', err.message);
    res.status(500).json({
      error: 'Failed to chat with AI',
      details: err.message
    });
  }
});

// Test Ollama connection
app.get('/api/ai/status', async (req, res) => {
  try {
    const ollamaHost = await getOllamaHost();
    const response = await axios.get(`http://${ollamaHost}/api/tags`);
    res.json({
      status: 'connected',
      host: ollamaHost,
      models: response.data.models || []
    });
  } catch (err) {
    console.error('Ollama connection error:', err.message);
    res.status(500).json({
      status: 'disconnected',
      error: err.message
    });
  }
});

// Get available Ollama models
app.get('/api/ollama/models', async (req, res) => {
  try {
    const ollamaHost = await getOllamaHost();
    const response = await axios.get(`http://${ollamaHost}/api/tags`);
    res.json({
      models: response.data.models || [],
      host: ollamaHost
    });
  } catch (err) {
    console.error('Error fetching Ollama models:', err.message);
    res.status(500).json({
      error: 'Failed to fetch models',
      details: err.message
    });
  }
});

// Test Ollama connection with custom host
app.post('/api/ollama/test', async (req, res) => {
  try {
    const { host } = req.body;
    const testHost = host || await getOllamaHost();

    const response = await axios.get(`http://${testHost}/api/tags`, {
      timeout: 5000
    });

    res.json({
      status: 'connected',
      host: testHost,
      models: response.data.models || []
    });
  } catch (err) {
    console.error('Ollama connection test failed:', err.message);
    res.status(500).json({
      status: 'disconnected',
      error: err.message
    });
  }
});

// Pull a specific Ollama model
app.post('/api/ollama/pull', async (req, res) => {
  try {
    const { model } = req.body;

    if (!model) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    const ollamaHost = await getOllamaHost();

    // Start the pull request (this will stream, but we'll just initiate it)
    const response = await axios.post(`http://${ollamaHost}/api/pull`, {
      name: model,
      stream: false
    }, {
      timeout: 300000 // 5 minute timeout for model pulls
    });

    res.json({
      success: true,
      message: `Model ${model} pull initiated`,
      details: response.data
    });
  } catch (err) {
    console.error('Error pulling Ollama model:', err.message);
    res.status(500).json({
      error: 'Failed to pull model',
      details: err.message
    });
  }
});

// Settings API endpoints

// Get settings
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_settings ORDER BY id DESC LIMIT 1');

    if (result.rows.length === 0) {
      return res.json({
        smtp_host: '',
        smtp_port: 587,
        smtp_username: '',
        smtp_password: '',
        smtp_from_email: '',
        recipient_email: '',
        email_enabled: false,
        email_schedule: 'sunday_6pm',
        ollama_host: DEFAULT_OLLAMA_HOST,
        ollama_model: 'llama2'
      });
    }

    const settings = result.rows[0];
    // Don't send encrypted password to frontend
    settings.smtp_password = settings.smtp_password ? '********' : '';

    // Ensure ollama fields have defaults if not set
    settings.ollama_host = settings.ollama_host || DEFAULT_OLLAMA_HOST;
    settings.ollama_model = settings.ollama_model || 'llama2';

    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
app.post('/api/settings', async (req, res) => {
  try {
    const {
      smtp_host,
      smtp_port,
      smtp_username,
      smtp_password,
      smtp_from_email,
      recipient_email,
      email_enabled,
      email_schedule,
      ollama_host,
      ollama_model
    } = req.body;

    // Validate required fields if email is enabled
    if (email_enabled) {
      if (!smtp_host || !smtp_port || !smtp_username || !smtp_from_email) {
        return res.status(400).json({ error: 'All SMTP fields are required when email is enabled' });
      }
    }

    // Get existing settings
    const existing = await pool.query('SELECT * FROM user_settings ORDER BY id DESC LIMIT 1');

    let encryptedPassword = '';

    // Only encrypt if password is provided and not the placeholder
    if (smtp_password && smtp_password !== '********') {
      encryptedPassword = encrypt(smtp_password);
    } else if (existing.rows.length > 0) {
      // Keep existing password if placeholder is sent
      encryptedPassword = existing.rows[0].smtp_password;
    }

    let result;
    if (existing.rows.length > 0) {
      // Update existing settings
      result = await pool.query(
        `UPDATE user_settings
         SET smtp_host = $1, smtp_port = $2, smtp_username = $3, smtp_password = $4,
             smtp_from_email = $5, recipient_email = $6, email_enabled = $7,
             email_schedule = $8, ollama_host = $9, ollama_model = $10,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $11
         RETURNING *`,
        [smtp_host, smtp_port, smtp_username, encryptedPassword, smtp_from_email,
         recipient_email, email_enabled, email_schedule, ollama_host, ollama_model,
         existing.rows[0].id]
      );
    } else {
      // Insert new settings
      result = await pool.query(
        `INSERT INTO user_settings
         (smtp_host, smtp_port, smtp_username, smtp_password, smtp_from_email,
          recipient_email, email_enabled, email_schedule, ollama_host, ollama_model)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [smtp_host, smtp_port, smtp_username, encryptedPassword, smtp_from_email,
         recipient_email, email_enabled, email_schedule, ollama_host, ollama_model]
      );
    }

    const settings = result.rows[0];
    settings.smtp_password = '********';

    res.json({ success: true, settings });
  } catch (err) {
    console.error('Error saving settings:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Test SMTP connection
app.post('/api/settings/test-email', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_settings ORDER BY id DESC LIMIT 1');
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No settings configured' });
    }

    const settings = result.rows[0];
    
    await emailService.sendTestEmail(settings);
    
    res.json({ success: true, message: 'Test email sent successfully!' });
  } catch (err) {
    console.error('Error sending test email:', err);
    res.status(500).json({ error: 'Failed to send test email: ' + err.message });
  }
});

// Manually trigger weekly summary
app.post('/api/settings/send-summary', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_settings ORDER BY id DESC LIMIT 1');
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No settings configured' });
    }

    const settings = result.rows[0];
    
    const emailResult = await emailService.sendWeeklySummary(pool, settings);
    
    res.json(emailResult);
  } catch (err) {
    console.error('Error sending weekly summary:', err);
    res.status(500).json({ error: 'Failed to send weekly summary: ' + err.message });
  }
});

// Get email logs
app.get('/api/email-logs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching email logs:', err);
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
});

// Schedule weekly email - Every Sunday at 6 PM
cron.schedule('0 18 * * 0', async () => {
  console.log('Running scheduled weekly email job...');
  
  try {
    const result = await pool.query('SELECT * FROM user_settings ORDER BY id DESC LIMIT 1');
    
    if (result.rows.length > 0) {
      const settings = result.rows[0];
      
      if (settings.email_enabled && settings.email_schedule === 'sunday_6pm') {
        await emailService.sendWeeklySummary(pool, settings);
        console.log('Weekly summary email sent successfully');
      }
    }
  } catch (err) {
    console.error('Error in scheduled email job:', err);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Default Ollama host: ${DEFAULT_OLLAMA_HOST}`);
  console.log('Weekly email cron job scheduled for Sundays at 6 PM');
});
