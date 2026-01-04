import { useState } from "react";
import { useHelpStore } from "@/store/helpStore";
import {
  Search,
  Book,
  Code2,
  FolderOpen,
  Layers,
  Filter,
  BarChart3,
  Lightbulb,
  Keyboard,
  Video,
  ExternalLink,
  LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  icon: LucideIcon;
  content: string[];
  keywords: string[];
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    category: "Basics",
    icon: Lightbulb,
    keywords: ["start", "begin", "new", "first", "intro"],
    content: [
      "1. Create a new study from the Dashboard",
      "2. Upload your documents (PDF, DOCX, or TXT)",
      "3. Select text in documents to create codes",
      "4. Build themes from your codes",
      "5. Visualize your data to find patterns",
    ],
  },
  {
    id: "studies",
    title: "Managing Studies",
    category: "Studies",
    icon: FolderOpen,
    keywords: ["study", "project", "create", "manage", "organize"],
    content: [
      "Studies are containers for your research projects. Each study has its own documents, codes, themes, and analysis.",
      "",
      "Creating a Study:",
      '• Click "New Study" on the Dashboard',
      "• Enter title, description, and research question",
      "• Set status (Planning, In Progress, Analysis, Writing, Completed)",
      "• Add tags for organization",
      "",
      "Switching Studies:",
      "• Click the study name in the top navigation bar",
      "• Select from the dropdown menu",
      "• Or go to Dashboard to see all studies",
    ],
  },
  {
    id: "documents",
    title: "Working with Documents",
    category: "Documents",
    icon: FolderOpen,
    keywords: ["upload", "document", "import", "pdf", "text"],
    content: [
      "Supported Formats:",
      "• PDF files",
      "• Microsoft Word (DOCX)",
      "• Plain text (TXT)",
      "",
      "Uploading Documents:",
      "1. Go to Documents view",
      '2. Click "Upload Document" or drag and drop',
      "3. Files are automatically parsed",
      "",
      "Coding Documents:",
      "1. Select text you want to code",
      "2. A popup appears with coding options",
      "3. Choose existing codes or create new ones",
      "4. Add memos to excerpts for notes",
    ],
  },
  {
    id: "codes",
    title: "Creating and Managing Codes",
    category: "Coding",
    icon: Code2,
    keywords: ["code", "coding", "hierarchy", "organize"],
    content: [
      "Codes are labels you apply to segments of your data.",
      "",
      "Code Hierarchy:",
      "• Main Codes (blue): Top-level categories",
      "• Child Codes (green): Sub-categories",
      "• Subchild Codes (yellow): Detailed sub-codes",
      "",
      "Creating Codes:",
      "• In Documents view: Select text → Create new code",
      '• In Codes view: Click "+" to add codes',
      "• Right-click codes to add children",
      "",
      "Code Operations:",
      "• Rename: Edit code names",
      "• Merge: Combine similar codes",
      "• Delete: Remove codes (can undo)",
      "• Search: Find codes quickly",
    ],
  },
  {
    id: "refiner",
    title: "Using the Code Refiner",
    category: "Analysis",
    icon: Filter,
    keywords: ["refine", "organize", "merge", "clean"],
    content: [
      "The Refiner helps you organize and clean up your codes.",
      "",
      "Features:",
      "• Sort codes by name, frequency, or document count",
      "• Filter codes by document",
      "• Identify duplicate or similar codes",
      "• Merge codes together",
      "• View code statistics",
      "",
      "AI Refinement:",
      '• Click "AI Suggestions" for automated recommendations',
      "• Reviews similar codes",
      "• Suggests merges",
      "• Identifies patterns",
    ],
  },
  {
    id: "themes",
    title: "Building Themes",
    category: "Analysis",
    icon: Layers,
    keywords: ["theme", "group", "organize", "patterns"],
    content: [
      "Themes are higher-level patterns that group related codes.",
      "",
      "Creating Themes:",
      "1. Go to Themes view",
      '2. Click "New Theme"',
      "3. Give it a name and description",
      "",
      "Adding Codes to Themes:",
      "• Drag and drop codes onto themes",
      "• Or use the dropdown menu on codes",
      "",
      "AI Theme Suggestions:",
      '• Click "AI Suggestions"',
      "• System analyzes your codes",
      "• Suggests theme groupings",
      "• Review and apply suggestions",
    ],
  },
  {
    id: "visualizations",
    title: "Data Visualizations",
    category: "Analysis",
    icon: BarChart3,
    keywords: ["visualize", "chart", "graph", "patterns"],
    content: [
      "Visualizations help you see patterns in your data.",
      "",
      "Available Visualizations:",
      "",
      "Force Graph:",
      "• Shows relationships between codes and themes",
      "• Drag nodes to rearrange",
      "• Zoom and pan to explore",
      "",
      "Tree View:",
      "• Displays code hierarchy",
      "• Shows parent-child relationships",
      "",
      "Frequency Chart:",
      "• Bar chart of code usage",
      "• See most common codes",
      "",
      "Co-occurrence Graph:",
      "• Shows codes that appear together",
      "• Identifies patterns across documents",
    ],
  },
  {
    id: "memos",
    title: "Using Memos",
    category: "Features",
    icon: Book,
    keywords: ["memo", "notes", "annotation", "comment"],
    content: [
      "Memos are your research notes and reflections.",
      "",
      "Where to Add Memos:",
      "• On coded excerpts",
      "• On individual codes",
      "• On themes",
      "",
      "Adding Memos:",
      "1. Select an excerpt, code, or theme",
      "2. View in the right panel",
      "3. Add your notes in the memo section",
      "",
      "Memos are useful for:",
      "• Recording insights",
      "• Tracking your thinking process",
      "• Making connections",
      "• Writing analysis notes",
    ],
  },
  {
    id: "export",
    title: "Exporting Data",
    category: "Features",
    icon: ExternalLink,
    keywords: ["export", "save", "download", "backup"],
    content: [
      "Export Options:",
      "",
      "Export Project (JSON):",
      "• Complete backup of your study",
      "• Includes all documents, codes, themes",
      "• Can be imported later",
      "",
      "Export Codes (CSV):",
      "• Spreadsheet of codes",
      "• Includes frequency and document count",
      "• Great for reporting",
      "",
      "To Export:",
      '1. Click "Export" in top navigation',
      "2. Choose format",
      "3. File downloads automatically",
    ],
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    category: "Tips",
    icon: Keyboard,
    keywords: ["keyboard", "shortcut", "hotkey", "fast"],
    content: [
      "Speed up your workflow with keyboard shortcuts!",
      "",
      "Press Ctrl+K (or Cmd+K on Mac) to see all shortcuts.",
      "",
      "Common Shortcuts:",
      "• Ctrl+K: Show keyboard shortcuts",
      "• Ctrl+H: Open help",
      "• Ctrl+S: Save (auto-saves)",
      "• Esc: Close dialogs",
      "",
      "Navigation:",
      "• 1-6: Switch between views",
      "• Ctrl+B: Toggle right panel",
    ],
  },
];

export function HelpModal() {
  const { helpModalOpen, setHelpModalOpen, setKeyboardShortcutsOpen } =
    useHelpStore();
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(
    null
  );

  const filteredArticles = HELP_ARTICLES.filter((article) => {
    const searchLower = search.toLowerCase();
    return (
      article.title.toLowerCase().includes(searchLower) ||
      article.category.toLowerCase().includes(searchLower) ||
      article.keywords.some((k) => k.includes(searchLower)) ||
      article.content.some((c) => c.toLowerCase().includes(searchLower))
    );
  });

  const categories = Array.from(new Set(HELP_ARTICLES.map((a) => a.category)));

  const handleArticleClick = (article: HelpArticle) => {
    setSelectedArticle(article);
  };

  const handleBack = () => {
    setSelectedArticle(null);
  };

  return (
    <Dialog open={helpModalOpen} onOpenChange={setHelpModalOpen}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Help & Documentation
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar */}
          {!selectedArticle && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search */}
              <div className="px-6 py-4 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search help articles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Articles List */}
              <ScrollArea className="flex-1 px-6">
                {search ? (
                  <div className="space-y-2 pb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Search Results ({filteredArticles.length})
                    </h3>
                    {filteredArticles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => handleArticleClick(article)}
                        className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <article.icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {article.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {article.category}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6 pb-4">
                    {categories.map((category) => (
                      <div key={category}>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                          {category}
                        </h3>
                        <div className="space-y-2">
                          {HELP_ARTICLES.filter(
                            (a) => a.category === category
                          ).map((article) => (
                            <button
                              key={article.id}
                              onClick={() => handleArticleClick(article)}
                              className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <article.icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">
                                    {article.title}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Quick Actions */}
              <div className="px-6 py-4 border-t space-y-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setHelpModalOpen(false);
                    setKeyboardShortcutsOpen(true);
                  }}
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Keyboard Shortcuts
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  asChild
                >
                  <a
                    href="https://www.univie.ac.at"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video Tutorials
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Article Content */}
          {selectedArticle && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-6 py-4 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  ← Back to articles
                </Button>
              </div>

              <ScrollArea className="flex-1 px-6">
                <div className="pb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <selectedArticle.icon className="h-6 w-6 text-primary" />
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedArticle.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedArticle.category}
                      </p>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    {selectedArticle.content.map((paragraph, idx) => (
                      <p
                        key={idx}
                        className={cn(
                          "mb-3",
                          paragraph === "" && "mb-1",
                          paragraph.startsWith("•") && "ml-4",
                          paragraph.match(/^\d+\./) && "ml-4"
                        )}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
