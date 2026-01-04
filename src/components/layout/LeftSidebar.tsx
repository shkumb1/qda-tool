import { useState, useCallback } from "react";
import { useQDAStore } from "@/store/qdaStore";
import { parseFile, formatFileSize } from "@/utils/documentParser";
import {
  SAMPLE_DOCUMENTS,
  SAMPLE_CODES,
  SAMPLE_THEMES,
} from "@/data/sampleData";
import {
  FileText,
  Upload,
  FolderOpen,
  Code2,
  Layers,
  BarChart3,
  Filter,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileType,
  Plus,
  Database,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Database,
    tooltip: "View all studies",
  },
  {
    id: "documents",
    label: "Documents",
    icon: FolderOpen,
    tooltip: "View and code documents",
  },
  {
    id: "codes",
    label: "Codes",
    icon: Code2,
    tooltip: "Manage coding hierarchy",
  },
  {
    id: "refiner",
    label: "Refiner",
    icon: Filter,
    tooltip: "Refine and organize codes",
  },
  {
    id: "themes",
    label: "Themes",
    icon: Layers,
    tooltip: "Build thematic groups",
  },
  {
    id: "visualizations",
    label: "Visualizations",
    icon: BarChart3,
    tooltip: "Explore data visually",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: LineChart,
    tooltip: "View research metrics",
    researchOnly: true,
  },
] as const;

export function LeftSidebar() {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    documents,
    activeDocumentId,
    activeView,
    activeStudyId,
    setActiveView,
    setActiveDocument,
    addDocument,
    removeDocument,
    addCode,
    addTheme,
    getActiveWorkspace,
  } = useQDAStore();

  const workspace = getActiveWorkspace();

  // Check if participant mode (configured via URL parameters)
  const isParticipantMode = new URLSearchParams(window.location.search).has('participantId');
  
  // Conditional navigation based on active study and research mode
  const visibleNavItems = activeStudyId
    ? NAV_ITEMS.filter(item => {
        // Hide analytics in participant mode
        if (isParticipantMode && item.researchOnly) return false;
        // Otherwise show research items only if research mode enabled
        return !item.researchOnly || workspace?.researchMode;
      })
    : NAV_ITEMS.filter((item) => item.id === "dashboard"); // Only dashboard when no active study

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      if (!activeStudyId) {
        toast({
          title: "No active study",
          description: "Please select or create a study first.",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);

      try {
        let lastDocumentId: string | null = null;
        for (const file of Array.from(files)) {
          const parsed = await parseFile(file);
          const newDoc = addDocument(parsed);
          lastDocumentId = newDoc.id;
          toast({
            title: "Document imported",
            description: `"${parsed.title}" has been added to your project.`,
          });
        }
        // Automatically open the last uploaded document
        if (lastDocumentId) {
          setActiveDocument(lastDocumentId);
          setActiveView("documents");
        }
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to parse one or more files.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
        setDialogOpen(false);
      }
    },
    [activeStudyId, addDocument, setActiveDocument, setActiveView, toast]
  );

  const handleLoadSampleData = () => {
    const addedDocIds: string[] = [];

    // Track returned document IDs
    SAMPLE_DOCUMENTS.forEach((doc) => {
      const newDoc = addDocument(doc);
      addedDocIds.push(newDoc.id);
    });

    // Add codes and themes
    SAMPLE_CODES.forEach((code) => {
      addCode(code.name, undefined, code.level);
    });

    SAMPLE_THEMES.forEach((theme) => {
      addTheme(theme.name, theme.color);
    });

    // Automatically select first document and switch to documents view
    if (addedDocIds.length > 0) {
      setActiveDocument(addedDocIds[0]);
      setActiveView("documents");
    }

    toast({
      title: "Sample data loaded",
      description:
        "3 interview documents, 5 codes, and 3 themes have been added.",
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileType className="h-4 w-4 text-destructive" />;
      case "docx":
        return <FileText className="h-4 w-4 text-code-main" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <aside className="w-64 flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo / Header */}
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-lg font-bold text-sidebar-foreground flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Code2 className="h-5 w-5 text-accent-foreground" />
          </div>
          ThematicFlow
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">
          Qualitative Data Analysis
        </p>
      </div>

      {/* Navigation */}
      <nav className="p-2">
        {NAV_ITEMS.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "sidebar-item w-full",
                  activeView === item.id && "sidebar-item-active"
                )}
                data-tour={
                  item.id === "dashboard"
                    ? "dashboard"
                    : item.id === "documents"
                    ? "navigation"
                    : undefined
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>

      {/* Documents Section - Only show when study is active */}
      {activeStudyId && (
        <div className="flex-1 flex flex-col border-t border-sidebar-border overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between px-4 py-3 text-sm font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground"
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Documents ({documents.length})
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <div className="flex-1 overflow-auto scrollbar-thin px-2 pb-2">
              {/* Action Buttons */}
              <div className="space-y-1 mb-2">
                <button
                  className="w-full justify-start gap-2 px-4 py-2 rounded-md flex items-center text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                  onClick={() => setDialogOpen(true)}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Import Document
                </button>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Import Documents</DialogTitle>
                      <DialogDescription>
                        Upload PDF, DOCX, or TXT files to analyze in this study.
                      </DialogDescription>
                    </DialogHeader>
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleFileUpload(e.dataTransfer.files);
                      }}
                      onClick={() =>
                        document.getElementById("file-input")?.click()
                      }
                    >
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm font-medium">
                        {uploading
                          ? "Uploading..."
                          : "Drop files here or click to browse"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports PDF, DOCX, TXT
                      </p>
                      <input
                        id="file-input"
                        type="file"
                        multiple
                        accept=".pdf,.docx,.txt"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files)}
                      />
                    </div>
                  </DialogContent>
                </Dialog>

                {documents.length === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-accent hover:text-accent hover:bg-sidebar-accent"
                    onClick={handleLoadSampleData}
                  >
                    <Database className="h-4 w-4" />
                    Load Sample Data
                  </Button>
                )}
              </div>

              {/* Document List */}
              <div className="space-y-0.5">
                {documents.map((doc) => {
                  return (
                    <div
                      key={doc.id}
                      className={cn(
                        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                        activeDocumentId === doc.id
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                      onClick={() => {
                        setActiveDocument(doc.id);
                        setActiveView("documents");
                      }}
                      title={`${doc.title} - ${doc.type.toUpperCase()}`}
                    >
                      {getFileIcon(doc.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{doc.title}</p>
                        <p className="text-xs text-sidebar-foreground/50">
                          {formatFileSize(doc.size)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDocument(doc.id);
                          toast({
                            title: "Document removed",
                            description: `"${doc.title}" has been removed.`,
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  );
                })}

                {documents.length === 0 && (
                  <p className="text-xs text-sidebar-foreground/50 text-center py-4">
                    No documents yet
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
