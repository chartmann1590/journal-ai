const nodemailer = require('nodemailer');
const { decrypt } = require('../utils/encryption');
const axios = require('axios');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'host.docker.internal:11434';
const OLLAMA_URL = `http://${OLLAMA_HOST}/api/generate`;
const APP_URL = process.env.APP_URL || 'https://localhost';

/**
 * Create nodemailer transporter from settings
 * @param {Object} settings - SMTP settings from database
 * @returns {Object} - Nodemailer transporter
 */
function createTransporter(settings) {
  if (!settings || !settings.smtp_host) {
    throw new Error('SMTP settings not configured');
  }

  return nodemailer.createTransport({
    host: settings.smtp_host,
    port: parseInt(settings.smtp_port) || 587,
    secure: parseInt(settings.smtp_port) === 465,
    auth: {
      user: settings.smtp_username,
      pass: decrypt(settings.smtp_password)
    }
  });
}

/**
 * Test SMTP connection
 * @param {Object} settings - SMTP settings
 * @returns {Promise<boolean>}
 */
async function testConnection(settings) {
  try {
    const transporter = createTransporter(settings);
    await transporter.verify();
    return true;
  } catch (err) {
    console.error('SMTP connection test failed:', err.message);
    throw err;
  }
}

/**
 * Generate AI-powered weekly summary
 * @param {Array} entries - Journal entries from the week
 * @returns {Promise<string>}
 */
async function generateWeeklySummary(entries) {
  if (entries.length === 0) {
    return 'No entries this week. Remember, journaling regularly can help track your thoughts and emotions.';
  }

  try {
    const entriesText = entries.map(e => e.content).join('\n\n');
    const prompt = `You are a compassionate mental health assistant. Analyze these journal entries from the past week and provide a supportive, encouraging summary. Focus on themes, emotional patterns, growth, and positive observations. Keep it under 200 words.\n\nEntries:\n${entriesText}`;

    const response = await axios.post(OLLAMA_URL, {
      model: 'llama2',
      prompt: prompt,
      stream: false,
    }, { timeout: 30000 });

    return response.data.response;
  } catch (err) {
    console.error('Error generating AI summary:', err.message);
    return 'Your journal entries this week show your commitment to self-reflection. Keep up the great work!';
  }
}

/**
 * Analyze mood trends from entries
 * @param {Array} entries - Journal entries
 * @returns {string}
 */
function analyzeMoodTrends(entries) {
  if (entries.length === 0) return 'No data available';
  
  // Simple sentiment analysis based on keywords
  const positiveWords = ['happy', 'joy', 'grateful', 'excited', 'love', 'wonderful', 'great', 'amazing', 'good', 'better', 'peaceful'];
  const negativeWords = ['sad', 'angry', 'frustrated', 'anxious', 'worried', 'stressed', 'difficult', 'hard', 'bad', 'worse', 'upset'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  entries.forEach(entry => {
    const content = entry.content.toLowerCase();
    positiveWords.forEach(word => {
      if (content.includes(word)) positiveCount++;
    });
    negativeWords.forEach(word => {
      if (content.includes(word)) negativeCount++;
    });
  });
  
  const total = positiveCount + negativeCount;
  if (total === 0) return 'Neutral - Keep expressing yourself!';
  
  const positivePercent = Math.round((positiveCount / total) * 100);
  
  if (positivePercent > 60) {
    return `Mostly positive (${positivePercent}%) - You're doing great! 🌟`;
  } else if (positivePercent > 40) {
    return `Balanced (${positivePercent}% positive) - A healthy mix of emotions 💙`;
  } else {
    return `Challenging week (${positivePercent}% positive) - Remember to be kind to yourself 💚`;
  }
}

/**
 * Generate HTML email template
 * @param {Object} data - Email data
 * @returns {string}
 */
function generateEmailHTML(data) {
  const { entries, summary, moodTrend, weekStart, weekEnd } = data;
  
  const entriesHTML = entries.slice(0, 5).map(entry => `
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #6366f1;">
      <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${entry.title}</h4>
      <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        ${entry.content.substring(0, 150)}${entry.content.length > 150 ? '...' : ''}
      </p>
      <small style="color: #9ca3af; font-size: 12px;">${new Date(entry.created_at).toLocaleDateString()}</small>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Journal Summary</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">✨ Your Weekly Journal Summary</h1>
      <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
        ${weekStart} - ${weekEnd}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      
      <!-- Stats -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
        <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="font-size: 32px; font-weight: 700; color: #0284c7; margin-bottom: 5px;">${entries.length}</div>
          <div style="color: #0c4a6e; font-size: 14px; font-weight: 600;">Entries</div>
        </div>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="font-size: 16px; font-weight: 700; color: #16a34a; margin-bottom: 5px;">📊</div>
          <div style="color: #14532d; font-size: 12px; font-weight: 600; line-height: 1.4;">${moodTrend}</div>
        </div>
      </div>

      <!-- AI Summary -->
      <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%); border-left: 4px solid #6366f1; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 12px 0; color: #6366f1; font-size: 18px; display: flex; align-items: center;">
          💡 AI Insights
        </h3>
        <p style="margin: 0; color: #374151; line-height: 1.7; font-size: 15px;">
          ${summary}
        </p>
      </div>

      <!-- Recent Entries -->
      ${entries.length > 0 ? `
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">📚 Recent Entries</h3>
        ${entriesHTML}
        ${entries.length > 5 ? `<p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 15px;">And ${entries.length - 5} more...</p>` : ''}
      </div>
      ` : ''}

      <!-- Encouragement -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
        <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.6; font-weight: 500;">
          💙 Remember: This journal is your safe space. Continue to write freely, reflect honestly, and be kind to yourself.
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${APP_URL}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          Open My Journal
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #6b7280; font-size: 13px;">
        You're receiving this because you enabled weekly journal summaries.
      </p>
      <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
        Mental Health Journal • Powered by AI
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

/**
 * Send weekly summary email
 * @param {Object} pool - Database pool
 * @param {Object} settings - SMTP settings
 * @returns {Promise<Object>}
 */
async function sendWeeklySummary(pool, settings) {
  try {
    if (!settings.email_enabled) {
      console.log('Weekly emails are disabled');
      return { success: false, message: 'Weekly emails are disabled' };
    }

    // Get entries from the past week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const result = await pool.query(
      'SELECT * FROM journal_entries WHERE created_at >= $1 ORDER BY created_at DESC',
      [weekAgo]
    );
    
    const entries = result.rows;
    
    // Generate summary and analysis
    const summary = await generateWeeklySummary(entries);
    const moodTrend = analyzeMoodTrends(entries);
    
    const weekStart = weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekEnd = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const emailHTML = generateEmailHTML({
      entries,
      summary,
      moodTrend,
      weekStart,
      weekEnd
    });
    
    // Send email
    const transporter = createTransporter(settings);
    
    const info = await transporter.sendMail({
      from: `"Mental Health Journal" <${settings.smtp_from_email}>`,
      to: settings.recipient_email || settings.smtp_username,
      subject: `📔 Your Weekly Journal Summary - ${weekStart} to ${weekEnd}`,
      html: emailHTML
    });
    
    // Log email
    await pool.query(
      'INSERT INTO email_logs (email_type, recipient, status, message_id, entries_count) VALUES ($1, $2, $3, $4, $5)',
      ['weekly_summary', settings.recipient_email || settings.smtp_username, 'sent', info.messageId, entries.length]
    );
    
    console.log('Weekly summary email sent:', info.messageId);
    return { success: true, messageId: info.messageId, entriesCount: entries.length };
    
  } catch (err) {
    console.error('Error sending weekly summary:', err.message);
    
    // Log failed email
    try {
      await pool.query(
        'INSERT INTO email_logs (email_type, recipient, status, error_message) VALUES ($1, $2, $3, $4)',
        ['weekly_summary', settings.recipient_email || 'unknown', 'failed', err.message]
      );
    } catch (logErr) {
      console.error('Error logging failed email:', logErr.message);
    }
    
    throw err;
  }
}

/**
 * Send test email
 * @param {Object} settings - SMTP settings
 * @returns {Promise<Object>}
 */
async function sendTestEmail(settings) {
  try {
    const transporter = createTransporter(settings);
    
    const info = await transporter.sendMail({
      from: `"Mental Health Journal" <${settings.smtp_from_email}>`,
      to: settings.recipient_email || settings.smtp_username,
      subject: '✅ Test Email - SMTP Configuration Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6366f1;">✅ SMTP Configuration Successful!</h2>
          <p>Your email settings are working correctly. You will receive weekly journal summaries at this email address.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This is a test email from your Mental Health Journal application.
          </p>
        </div>
      `
    });
    
    console.log('Test email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (err) {
    console.error('Error sending test email:', err.message);
    throw err;
  }
}

module.exports = {
  createTransporter,
  testConnection,
  sendWeeklySummary,
  sendTestEmail,
  generateWeeklySummary,
  analyzeMoodTrends
};

