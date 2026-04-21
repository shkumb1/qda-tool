# Insight Weaver - Update Log
**Date:** April 20, 2026  
**Testing Status:** ⚠️ Requires Vercel deployment for API testing

---

## 🎯 New Features Implemented

### 1. ✨ Theme Drag-and-Drop Reorganization
**File:** `src/components/views/ThemesView.tsx`

**Features:**
- **Drag any theme by its header** (grip icon shows on hover)
- **Nest themes:** Drop ON a theme header to make it a subtheme
  - Drop on Main Theme → becomes Theme (2nd level)
  - Drop on Theme → becomes Sub-theme (3rd level)
  - ⚠️ Cannot drop on Sub-theme (max 3 levels enforced)
- **Promote to main:** Drop in empty space to make it a main theme
- **Smart protections:**
  - Cannot drop theme on itself
  - Cannot create circular nesting (parent under child)
  
**Visual Indicators:**
- Blue ring = Code drop target
- Primary ring = Theme drop target (nest action)
- Green dashed box = Main area drop (promote to main)
- Dragged theme appears semi-transparent

**Use Case:** Researchers can reorganize theme hierarchies as their analysis evolves without recreating themes.

---

### 2. 🔍 Searchable Theme Context Menu
**File:** `src/components/views/ThemesView.tsx`

**Features:**
- **Auto-focus search input** when right-clicking a code
- **Live filtering** of themes as you type
- **Hierarchical display** with indented subthemes
- **Result counter** shows "X of Y themes"
- **Check marks** for already-assigned themes
- **Clears on close** - fresh search each time

**Benefits:** Makes copying codes to themes much faster when you have many themes.

---

### 3. 💾 Document Intelligence Saving
**Files:** 
- `src/types/qda.ts` - Added `SavedIntelligence` interface
- `src/store/qdaStore.ts` - Added `saveIntelligence` & `deleteIntelligence` actions
- `src/components/views/DocumentIntelligence.tsx` - Added Save button
- `src/services/aiService.ts` - Added `StudyContext` interface

**Features:**
- **Save button** next to Export in Document Intelligence
- **Saved state indicator** (checkmark when saved)
- **Persistent storage** in study's `intelligenceReports` array
- **Metadata tracking:**
  - Title (document or "Study Analysis (X documents)")
  - Scope (document vs study-wide)
  - Document IDs
  - Analysis depth (quick/standard/deep)
  - Timestamp

**Data Saved:**
- Complete summary
- All detected themes (with subthemes)
- Key insights (main points, quotes, patterns)
- Mind map structure

**Future Ready:** Backend prepared for Intelligence Library view to browse/reopen saved analyses.

---

### 4. 🤖 QDA-Focused AI Assistant Chatbot
**Files:**
- `src/components/views/AIAssistant.tsx` - New component
- `src/components/layout/TopNavigation.tsx` - Added button & state
- `src/services/aiService.ts` - Added `chatWithAssistant` function

**Features:**
- **Strict QDA-only responses** - Refuses non-QDA questions
- **Study context injection:**
  - Study title, document/code/theme/excerpt counts
  - Top 5 most-used codes
  - All themes with hierarchy levels
- **Smart behavior:**
  - Auto-clears chat when switching studies
  - Maintains last 10 messages for context
  - Shows study stats badges
- **UX:**
  - User messages: Blue, right-aligned
  - AI messages: Gray, left-aligned with bot icon
  - Timestamps on all messages
  - Clear chat button
  - Enter to send, Shift+Enter for new line

**System Prompt Restrictions:**
✅ ALLOWED: QDA methodology, coding strategies, tool features, pattern analysis  
❌ FORBIDDEN: Politics, medical/legal advice, general knowledge, unrelated topics

**Example Questions:**
- "What coding approach should I use for interview data?"
- "Analyze patterns in my top codes"
- "Should I merge these similar codes?"
- "How do I use the theme builder?"

---

### 5. 🐛 Bug Fixes & Improvements

#### A. Chat Persistence Issue - FIXED ✅
**Problem:** Chat history persisted across different studies  
**Solution:** Added `useEffect` hook that clears chat when `activeStudyId` changes  
**Impact:** Each study now has fresh conversations with correct context

#### B. AI Code Suggestion Visualization Bug - IN PROGRESS 🔍
**Problem:** Codes created from AI suggestions don't appear in visualizations  
**Solution:** Added debug logging to trace the issue

**Debug Logs Added:**
```javascript
[STORE] Creating new code: { name, id, frequency: 0 }
[STORE] Updated code in addExcerpt: { oldFrequency, newFrequency, excerptCount }
```

**Testing Required:**
1. Accept an AI code suggestion
2. Check browser console for logs
3. Verify if code is created (should show frequency: 0)
4. Verify if excerpt updates code (should show new frequency)
5. Check visualization to see if code appears

**Possible Causes:**
- Code might be created but not added to excerpt
- Excerpt might not be updating code frequency
- Visualization might be filtering out codes with frequency: 0
- State sync issue between store and components

---

## 🧪 Testing Checklist

### Theme Reorganization
- [ ] Drag main theme to another main theme → becomes subtheme
- [ ] Drag theme to empty space → becomes main theme
- [ ] Try to drag theme onto itself → should be prevented
- [ ] Try to create circular nesting → should be prevented
- [ ] Verify visual indicators (rings, dashed box) appear correctly

### Searchable Theme Menu
- [ ] Right-click code → search auto-focuses
- [ ] Type to filter themes → see live results
- [ ] Check subthemes are indented
- [ ] Verify check marks show for assigned themes
- [ ] Close and reopen → search clears

### Document Intelligence Saving
- [ ] Run Document Intelligence analysis
- [ ] Click Save button → should show checkmark
- [ ] Refresh page → saved report should persist
- [ ] Run new analysis → Save button resets
- [ ] Check localStorage for saved intelligence data

### AI Assistant
- [ ] Click "AI Assist" button → chat opens
- [ ] Ask QDA question → should get helpful response
- [ ] Ask random question → should refuse and redirect
- [ ] Switch studies → chat should clear
- [ ] Check study badges show correct counts
- [ ] Clear chat button → conversation resets

### AI Code Bug Investigation
- [ ] **Deploy to Vercel first** (API required)
- [ ] Select text in document
- [ ] Get AI suggestions
- [ ] Accept a suggestion
- [ ] Open browser console → look for debug logs
- [ ] Go to Visualizations → check if code appears
- [ ] Note console output and report findings

---

## 📋 Files Modified

### New Files Created:
- `src/components/views/AIAssistant.tsx`

### Files Modified:
- `src/components/views/ThemesView.tsx`
- `src/components/views/DocumentIntelligence.tsx`
- `src/components/layout/TopNavigation.tsx`
- `src/services/aiService.ts`
- `src/store/qdaStore.ts`
- `src/types/qda.ts`

### Interfaces/Types Added:
- `SavedIntelligence` - Document Intelligence save structure
- `StudyContext` - AI Assistant study context structure

### Store Actions Added:
- `saveIntelligence()` - Save Document Intelligence analysis
- `deleteIntelligence()` - Delete saved analysis

---

## 🚀 Deployment Notes

### Environment Variables Required:
- `OPENAI_API_KEY` - Must be set in Vercel for AI features to work

### Features That Need API:
- AI Assistant chatbot
- AI code suggestions (for bug testing)
- Document Intelligence
- Theme suggestions

### Features That Work Without API:
- Theme drag-and-drop
- Searchable theme menu
- All existing QDA features (coding, theming, visualizations)

---

## 🔧 Known Issues

### 1. AI Code Visualization Bug (Investigating)
**Status:** Debug logging added, awaiting test results  
**Impact:** Codes from AI suggestions may not show in visualizations  
**Next Step:** Deploy to Vercel, test with console open, report findings

---

## 💡 Future Enhancements (Not Implemented)

- Intelligence Library view to browse saved analyses
- Per-study chat history persistence (if desired)
- AI Assistant memory of previous conversations in same study
- Export saved intelligence reports
- Compare multiple intelligence reports side-by-side

---

## 📝 Notes for Next Session

1. **Deploy to Vercel** before testing AI features
2. **Test AI code bug** with console open - capture exact logs
3. Based on console output, we can pinpoint:
   - If code is being created
   - If frequency is updating
   - If it's a visualization filter issue
   - If it's a state sync problem

4. **Potential fixes** (after diagnosis):
   - Ensure visualizations don't filter out frequency: 0 codes
   - Fix state propagation in updateActiveStudyData
   - Ensure excerpt creation happens after code creation
   - Check if visualization components are receiving updated codes

---

**End of Update Log**

🎯 All features implemented and ready for testing after Vercel deployment!
