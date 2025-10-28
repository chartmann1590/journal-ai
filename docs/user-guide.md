# User Guide

Complete guide to using the Journal AI application.

## Getting Started

### First Launch

1. Open your browser and navigate to `https://localhost`
2. Accept the SSL security warning (it's safe for local development)
3. You'll see the home page with the journal entry form

### Understanding the Interface

The application has four main sections:

1. **Header** - Shows app title and AI connection status
2. **Navigation Menu** - Quick access to Home, History, and Settings
3. **Main Content** - Changes based on your current page
4. **Footer** - Reminder message

---

## Creating Journal Entries

### Text Entry

1. Navigate to the **Home** page
2. Enter an optional **title** in the "Title" field
3. Write your thoughts in the **Content** textarea
4. Click **"Save Entry"** button
5. Your entry is saved and you'll see a success notification

### Voice-to-Text Entry

1. Navigate to the **Home** page
2. Click the **microphone icon** 🎤
3. **Grant microphone permissions** when prompted
4. Start speaking your thoughts
5. You will see a realtime preview as you speak; finalized text is written cleanly
6. Recording continues until you press Stop
7. Edit the transcribed text if needed
8. Click **"Save Entry"** to save

**Notes**:
- Voice input requires HTTPS (use `https://localhost`)
- iOS Safari/Chrome do not support Web Speech; use the keyboard mic there

**Supported Browsers**:
- Chrome/Edge (Chromium)
- Safari
- Firefox

**Tips**:
- Speak clearly and at a moderate pace
- Pause briefly at the end of sentences
- Minimal background noise works best

---

## Viewing Your History

### Navigation

1. Click **"History"** in the navigation menu
2. All your entries appear in reverse chronological order (newest first)

### Search & Filters

1. Use the **search box** at the top
2. Type any word or phrase
3. Real-time filtering as you type
4. Filter by tags and emotions using the inputs (comma‑separated)

### Entry Management

#### View Full Entry
- Click a card to open the Entry Detail page
- Read full content, see tags, emotions, and AI insight
- Edit and re‑analyze from this page

#### Edit & Re‑Analyze
1. Open the Entry Detail page
2. Click **Edit** to modify title or content
3. **Save** updates the entry
4. **Save + Reanalyze All** updates the entry and re‑runs tags, emotions, and AI insight
5. Or run **Reanalyze AI** or **Reanalyze Tags/Emotions** individually

#### Delete Entry
1. Click **"Delete"** button on an entry
2. Confirm deletion in the dialog
3. Entry is permanently removed

#### Export Entries
1. Click **"Export JSON"** button at the top
2. Download your entries as a JSON file
3. Use for backup or analysis

---

## AI Features

### Getting AI Insights

1. Go to **History** page
2. Find the entry you want analyzed
3. Click **"Get AI Insights"** button
4. Wait 10-30 seconds for AI processing
5. Insights appear in the entry

**What AI Provides**:
- Emotional pattern analysis
- Positive aspects identification
- Supportive suggestions
- Compassionate feedback

**Tips**:
- Write detailed entries for better insights
- AI works best with longer entries (100+ words)
- Insights are unique to your writing

### AI Status Indicator

Look at the top-right corner of the header:
- 🟢 **Green**: AI connected and ready
- 🔴 **Red**: AI offline or unavailable

If AI is offline:
1. Check that Ollama is running
2. Verify llama2 model is installed
3. Check network connectivity

### Chat with AI (Future Feature)

Interactive AI chat is available through the API but not yet in the UI.

---

## Calendar View

### Viewing the Calendar

1. Home page: compact calendar with entry dots and week numbers
2. Calendar page: month/year dropdowns, week numbers, readable grid
3. Dates with entries show a glowing blue dot
4. Click on a date to filter entries

### Filtering by Date

1. Click any highlighted date
2. See entries for that date only
3. Click date again to clear filter

### Understanding Calendar Colors

- **Gray**: No entries
- **Purple/Blue**: Has entries (intensity shows count)

---

## Email Settings

### Configuring Weekly Summaries

1. Navigate to **Settings** page
2. Toggle **"Enable weekly email summaries"** ON
3. Fill in SMTP configuration (see below)
4. Click **"Save Settings"**
5. Click **"Send Test Email"** to verify

### SMTP Configuration

You'll need:

- **SMTP Host**: `smtp.gmail.com` (example)
- **SMTP Port**: `587` (standard)
- **Username**: Your email address
- **Password**: App password (not regular password)
- **From Email**: Sender email address
- **Recipient Email**: Where to send summaries

#### Gmail Setup

```
Host: smtp.gmail.com
Port: 587
Username: youremail@gmail.com
Password: [App Password - see below]
From: youremail@gmail.com
To: youremail@gmail.com (or any email)
```

**Creating Gmail App Password**:
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Journal AI"
4. Click Generate
5. Copy the 16-character password
6. Use it in the password field

#### Other Providers

See [Installation Guide](installation.md#smtp-configuration-examples) for other SMTP configurations.

### Email Schedule

- **Frequency**: Weekly
- **Day**: Sunday
- **Time**: 6:00 PM local time
- **Content**: 
  - Entry count
  - Mood trends
  - AI-generated summary
  - Recent entries preview

### Viewing Email Logs

1. Go to **Settings** page
2. Scroll to **"Email Logs"** section
3. See all sent emails and their status
4. Filter by success/failure

### Manually Send Summary

1. Go to **Settings** page
2. Click **"Send Weekly Summary Now"** button
3. Email is sent immediately
4. Check logs for confirmation

---

## Tips & Best Practices

### Journaling Tips

1. **Write Regularly**: Try to journal daily or weekly
2. **Be Honest**: Your journal is for you, be authentic
3. **Details Matter**: More detail yields better AI insights
4. **Use Voice**: Save time with voice-to-text
5. **Review Past**: Look at old entries to see progress

### Using AI Insights

1. **Not Medical Advice**: AI insights are for reflection, not diagnosis
2. **Use as Starting Point**: AI can help identify patterns
3. **Combine with Self-Reflection**: AI + your thoughts = growth
4. **Track Over Time**: Look for patterns in AI responses

### Privacy & Security

1. **Local Only**: Your data stays on your machine
2. **No Cloud**: No data sent to external servers (except emails)
3. **Encrypted**: SMTP passwords are encrypted
4. **Backup**: Export JSON regularly for backup

### Performance

1. **Large Entries**: Entries up to 10MB supported
2. **AI Speed**: AI responses take 10-30 seconds
3. **Voice Quality**: Use good microphone for best results
4. **Browser**: Chrome/Edge recommended for voice

---

## Troubleshooting

### Microphone Not Working

**Problem**: Voice input not working

**Solutions**:
1. Ensure you're using `https://localhost` (HTTPS required)
2. Grant microphone permissions in browser
3. Check browser console for errors (F12)
4. Try different browser
5. Verify system microphone settings

### AI Always Offline

**Problem**: AI status shows red

**Solutions**:
1. Check Ollama is running: `ollama list`
2. Install llama2: `ollama pull llama2`
3. Restart backend: `docker compose restart backend`
4. Check backend logs: `docker compose logs backend`

### Can't Save Entries

**Problem**: Save button doesn't work

**Solutions**:
1. Check content is not empty
2. Check browser console for errors (F12)
3. Verify backend is running
4. Try refreshing page
5. Check network connectivity

### Email Not Sending

**Problem**: Test email fails

**Solutions**:
1. Double-check SMTP credentials
2. Verify app password for Gmail
3. Check email logs in Settings
4. Try different SMTP provider
5. Check spam/junk folder

### Browser Security Warning

**Problem**: "Not Secure" warning

**Solutions**:
1. This is normal for self-signed certificates
2. Click "Advanced"
3. Click "Proceed to localhost"
4. Safe for local development

---

## Keyboard Shortcuts

Currently, no keyboard shortcuts are implemented. Future versions may include:
- `Ctrl+N` / `Cmd+N`: New entry
- `Ctrl+S` / `Cmd+S`: Save entry
- `Ctrl+F` / `Cmd+F`: Search
- `Esc`: Cancel/Close dialogs

---

## Mobile Use

While primarily designed for desktop, the app is responsive and works on mobile:

1. **Voice Input**: Works on mobile browsers
2. **Touch Friendly**: Large buttons and inputs
3. **Responsive Layout**: Adapts to screen size
4. **Calendar**: Swipe to navigate months

**Recommendations**:
- Use landscape orientation for better experience
- Grant microphone permissions
- Use HTTPS (https://localhost)

---

## Data Export

### Export Format

Entries are exported as JSON:

```json
[
  {
    "id": 1,
    "title": "My Entry",
    "content": "Content here",
    "ai_response": "AI insights",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

### Use Cases

- **Backup**: Keep local copies of your entries
- **Migration**: Import to other platforms
- **Analysis**: Analyze patterns with external tools
- **Import**: Future feature to import entries

---

## Features Roadmap

Planned features for future versions:

- [ ] Mood tracking with mood selector
- [ ] Entry tags and categories
- [ ] Photo attachments
- [ ] Multi-user support
- [ ] Dark mode
- [ ] Offline mode
- [ ] Entry templates
- [ ] Reminders
- [ ] Data analysis dashboard

---

**💙 Remember**: This journal is your safe space. Write freely, reflect honestly, and be kind to yourself.

