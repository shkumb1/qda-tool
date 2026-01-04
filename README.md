# QDA Tool - Qualitative Data Analysis

## Project info

Professional qualitative data analysis tool for researchers. Import documents, code text, build themes, and visualize your data.

## ✨ Key Features

- **📚 Studies Dashboard** - Manage multiple research projects
- **📄 Document Analysis** - Import PDF, DOCX, and TXT files
- **🏷️ Hierarchical Coding** - Three-level coding system (main, child, subchild)
- **🎨 Theme Building** - Group codes into thematic patterns
- **📊 Visualizations** - Force graphs, tree views, frequency charts, co-occurrence analysis
- **🤖 AI Assistance** - Code suggestions, theme generation, refinement recommendations
- **💡 Interactive Help** - Built-in onboarding tour, help documentation, and keyboard shortcuts
- **📝 Memos** - Add research notes to excerpts, codes, and themes
- **💾 Export/Import** - Save projects as JSON or export codes as CSV

## Getting Help

The application includes a comprehensive help system:

- **Press `Ctrl+H`** to open help documentation
- **Press `Ctrl+K`** to view keyboard shortcuts
- **Click "Help" button** in the top navigation bar
- **Onboarding Tour** - New users automatically see a guided tour
- **Replay Tour** - Access from Help menu anytime

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Configure environment variables (IMPORTANT!)
cp .env.example .env
# Edit .env and add your OpenAI API key (optional, for AI features)

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Free Deployment Options

**Vercel (Recommended)**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variable: `VITE_OPENAI_API_KEY` (optional, for AI features)
5. Deploy

**Netlify**
1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Import your repository
4. Add environment variable: `VITE_OPENAI_API_KEY` (optional, for AI features)
5. Deploy

**GitHub Pages**
```bash
npm run build
# Upload dist folder contents
```

### Important: Never commit your .env file!
The `.env` file is already in `.gitignore` to protect your API keys.
- Cloudflare Pages

Simply build the project with `npm run build` and deploy the `dist` folder.
