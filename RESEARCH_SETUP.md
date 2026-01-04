# Research Study Setup Guide

This guide explains how to configure Insight Weaver for your thesis research with 10 participants.

## Research Design

You can test two conditions:
1. **AI-Assisted QDA** - Participants use AI code suggestions
2. **Manual QDA** - Participants code without AI assistance

## Setup Instructions

### Option 1: URL Parameters (Recommended)

Send each participant a unique URL with their settings pre-configured:

#### AI-Enabled Group (5 participants)
```
https://yourapp.com/?participantId=P01&aiEnabled=true
https://yourapp.com/?participantId=P02&aiEnabled=true
https://yourapp.com/?participantId=P03&aiEnabled=true
https://yourapp.com/?participantId=P04&aiEnabled=true
https://yourapp.com/?participantId=P05&aiEnabled=true
```

#### AI-Disabled Group (5 participants)
```
https://yourapp.com/?participantId=P06&aiEnabled=false
https://yourapp.com/?participantId=P07&aiEnabled=false
https://yourapp.com/?participantId=P08&aiEnabled=false
https://yourapp.com/?participantId=P09&aiEnabled=false
https://yourapp.com/?participantId=P10&aiEnabled=false
```

**Benefits:**
- Automatic configuration - no manual setup needed
- Prevents participant errors
- Ensures correct condition assignment
- Professional and consistent

### Option 2: Manual Configuration

If you prefer manual setup:

1. Each participant opens the app
2. Click the **Settings** button (⚙️) in the top navigation
3. Enable **Research Mode**
4. Enter their **Participant ID** (e.g., P01, P02, etc.)
5. Toggle **AI Assistance** on/off based on their assigned group
6. Click **Save Changes**

## During the Study

### What Gets Tracked

When research mode is enabled, the system automatically logs:
- **Excerpt creation** - When participants highlight and code text
- **Code application** - Which codes are applied and how long it takes
- **AI interactions** - Requests, acceptances, rejections
- **Session timing** - Total active time spent coding
- **Document navigation** - Which documents are viewed

### For Participants

Participants should:
1. Create a new workspace (or use the one auto-created)
2. Create a new study for their coding task
3. Upload/create documents
4. Perform coding as instructed
5. At the end, click **Analytics** in the sidebar
6. Click **Export Research Data** button
7. Send you the downloaded CSV file

### Analytics View

The Analytics view shows:
- Total excerpts coded
- Number of unique codes created
- Coding speed (excerpts per hour)
- Active time spent
- AI request/acceptance stats (if AI enabled)
- Recent activity log

## Data Collection

### CSV Export Format

Each participant's export contains:

**Raw Activity Logs:**
```csv
Timestamp,Action,Excerpt Text,Code Name,AI Confidence,Duration...
```

**Summary Metrics:**
```csv
Metric,Value
Total Excerpts,25
Total Codes,12
Coding Speed (excerpts/hour),15.5
Total Active Time (minutes),96.7
AI Suggestions Requested,18
AI Suggestions Accepted,12
AI Acceptance Rate,66.7%
```

### Comparing Conditions

Metrics to analyze:
- **Efficiency**: Coding speed (excerpts/hour), time per excerpt
- **AI Usage**: Request rate, acceptance rate, confidence scores
- **Coding Quality**: Number of codes, code diversity
- **Engagement**: Session duration, actions per minute

## Deployment

### For Local Testing
```bash
npm run dev
```
Access at: `http://localhost:8080/?participantId=TEST&aiEnabled=true`

### For Production (Free Hosting)

**Vercel:**
```bash
npm install -g vercel
vercel deploy
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

Then use your deployment URL:
```
https://your-app.vercel.app/?participantId=P01&aiEnabled=true
```

## Best Practices

1. **Randomize Assignment** - Randomly assign participants to AI/non-AI groups
2. **Same Task** - Give all participants the same coding task for consistency
3. **Clear Instructions** - Provide step-by-step instructions
4. **Time Limit** - Consider setting a time limit (e.g., 30-60 minutes)
5. **Post-Survey** - Include satisfaction/experience questions
6. **Backup Data** - Collect CSV exports immediately after sessions

## Troubleshooting

**Settings not applying?**
- Check URL parameters are correctly formatted
- Clear browser cache and localStorage
- Ensure workspace is created before URL params are read

**Analytics not showing?**
- Research mode must be enabled
- Analytics view only appears when researchMode is active
- Refresh page after enabling research mode

**Data not persisting?**
- All data is stored in browser's localStorage
- Clearing browser data will erase the workspace
- Export data regularly as backup

## Example Study Protocol

1. **Introduction** (5 min)
   - Explain QDA and the task
   - Show brief tutorial/demo

2. **Coding Task** (45 min)
   - Participants code provided documents
   - No interruptions during coding

3. **Export Data** (2 min)
   - Guide participant to export CSV
   - Verify file was downloaded

4. **Post-Survey** (5 min)
   - Usability questions
   - AI helpfulness (if applicable)
   - Overall experience

## Questions?

The system is designed to be maintenance-free:
- No server required
- No database to manage
- No API keys needed for basic functionality
- Works entirely in the browser

AI features require OpenAI API key, which you can configure in the code or disable for the study.
