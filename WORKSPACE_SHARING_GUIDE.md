# Workspace Sharing Guide

## How to Collaborate Across Devices/Browsers

Since the app doesn't have a backend server, collaboration requires manually sharing workspace data. Here's how:

---

## 📤 **For User A (Workspace Creator):**

1. **Create a Workspace**
   - Go to workspace selector
   - Click "Create Workspace"
   - Enter workspace name and your name
   - Workspace is created with a code (e.g., `ABC123`)

2. **Share the Workspace**
   - Click the **"Share"** button (with Download icon) on your workspace card
   - OR: In the top navigation, click your profile → "Export Workspace for Sharing"
   - This downloads a `.json` file (e.g., `workspace-my-study-1745678900.json`)

3. **Send the File to Your Collaborator**
   - Email the `.json` file
   - Send via Slack, Teams, WhatsApp, etc.
   - Share via cloud storage (Dropbox, Google Drive, etc.)

---

## 📥 **For User B (Joining User):**

1. **Get the Workspace File**
   - Receive the `.json` file from User A

2. **Join the Workspace**
   - Click "Join Workspace" on the welcome screen
   - Enter your name (e.g., "Dr. Sarah Smith")
   - Click **"Choose workspace file..."** button
   - Select the `.json` file User A sent you
   - Click "Join Workspace"

3. **Start Collaborating!**
   - You now have access to all studies, documents, codes, and themes
   - Your name appears in the collaborators list

---

## 🔄 **Syncing Changes:**

⚠️ **IMPORTANT:** This app uses local storage. Changes are **NOT** automatically synced between users.

### To share updates:
1. After making changes, **export the workspace again**
2. Send the updated file to collaborators
3. Collaborators can re-import to get latest changes

### For real-time collaboration:
This would require a backend server (Firebase, Supabase, etc.). The current version is designed for:
- Individual research
- Periodic collaboration (share updates weekly/monthly)
- Teaching scenarios (instructor shares workspace with students)

---

## 🆚 **Workspace Code vs. File Sharing:**

| Method | Works Across Devices? | When to Use |
|--------|----------------------|-------------|
| **Workspace Code** | ❌ No (local only) | Same computer/browser only |
| **Workspace File** | ✅ Yes | Different computers/browsers |

**Recommendation:** Always use the **"Share"** button (file export) for real collaboration!

---

## 💡 **Tips:**

- Workspace codes are 6 characters (e.g., `ABC123`)
- Export files are timestamped for version tracking
- You can be in multiple workspaces
- Each workspace can have multiple studies
- All collaborators see the same data after importing

---

## 🐛 **Troubleshooting:**

**"Workspace not found" error when using code:**
- 👉 Use file sharing instead! Codes only work locally.

**Import failed:**
- Check if the .json file is valid and not corrupted
- Make sure you entered your name
- Try downloading the file again from your collaborator

**PDF import not working:**
- The CSP fix should now allow PDF.js to work
- Check browser console (F12) for detailed error messages
- Make sure the PDF isn't password-protected

---

## 📊 **What Gets Shared:**

When you export a workspace, it includes:
- ✅ Workspace name and code
- ✅ All studies in the workspace
- ✅ All documents (text content)
- ✅ All codes and themes
- ✅ All coded excerpts
- ✅ All memos
- ✅ Workspace creator info

It does NOT include:
- ❌ Other collaborators (they're added when someone joins)
- ❌ Analytics logs
- ❌ Your personal settings

---

## 🚀 **Next Steps:**

1. Visit your deployed app on Vercel
2. Create a workspace
3. Export it using the "Share" button
4. Send it to your friend
5. Have them join using the file upload
6. Start coding your qualitative data together!

---

**Deployed at:** https://insight-weaver-main.vercel.app (or your Vercel URL)
