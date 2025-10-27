const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

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
    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        content TEXT NOT NULL,
        ai_response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
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
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'host.docker.internal:11434';
const OLLAMA_URL = `http://${OLLAMA_HOST}/api/generate`;

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
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating entry:', err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

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
      'You are a compassionate mental health assistant. Analyze this journal entry and provide supportive, empathetic insights. Focus on emotional patterns, positive aspects, and gentle suggestions for well-being.';
    
    const fullPrompt = `${systemPrompt}\n\nJournal Entry:\n${content}`;
    
    const response = await axios.post(OLLAMA_URL, {
      model: 'llama2',
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
    
    const response = await axios.post(OLLAMA_URL, {
      model: 'llama2',
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
    const response = await axios.get(`http://${OLLAMA_HOST}/api/tags`);
    res.json({ 
      status: 'connected', 
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Ollama host: ${OLLAMA_HOST}`);
});
