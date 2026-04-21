import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQDAStore } from "@/store/qdaStore";
import { suggestCodes, type AICodeSuggestion } from "@/services/aiService";
import { parseFile } from "@/utils/documentParser";
import { DocumentIntelligence } from "@/components/views/DocumentIntelligence";
import {
  FileText,
  Upload,
  Plus,
  X,
  Sparkles,
  Loader2,
  Check,
  AlertTriangle,
  Trash2,
  Brain,
  Pencil,
  Tag,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { TextSelection } from "@/types/qda";

export function DocumentViewer() {
  const { toast } = useToast();
  const {
    documents,
    activeDocumentId,
    activeStudyId,
    getActiveWorkspace,
    codes,
    excerpts,
    currentSelection,
    setCurrentSelection,
    setSelectedExcerpt,
    selectedExcerptId,
    setActiveDocument,
    addExcerpt,
    addCode,
    addDocument,
    logAction,
    removeExcerpt,
    removeCodeFromExcerpt,
    assignCodeToExcerpt,
    updateExcerpt,
  } = useQDAStore();

  const workspace = getActiveWorkspace();
  const aiEnabled = workspace?.aiEnabled ?? true; // Default to true if not set

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [popoverBelow, setPopoverBelow] = useState(false);
  const [newCodeName, setNewCodeName] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AICodeSuggestion[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hoveredExcerptId, setHoveredExcerptId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    excerptId: string;
  } | null>(null);
  const [deleteExcerptId, setDeleteExcerptId] = useState<string | null>(null);
  const [intelligenceOpen, setIntelligenceOpen] = useState(false);
  const [editingExcerptId, setEditingExcerptId] = useState<string | null>(null);
  const [editCodeSearch, setEditCodeSearch] = useState("");
  const [reselectionMode, setReselectionMode] = useState<string | null>(null); // excerptId being re-selected
  const [codeFilterQuery, setCodeFilterQuery] = useState(""); // Search filter for selection popover
  const contentRef = useRef<HTMLDivElement>(null);
  const codeSearchInputRef = useRef<HTMLInputElement>(null);

  const activeDocument = documents.find((d) => d.id === activeDocumentId);
  const documentExcerpts = excerpts.filter(
    (e) => e.documentId === activeDocumentId,
  );

  // Pre-calculate code usage counts for current document - recalculates when excerpts change
  const codeExcerptCounts = useMemo(() => {
    const counts = new Map<string, number>();
    console.log(
      "[DocumentViewer] Recalculating code counts. Total excerpts:",
      excerpts.length,
    );

    excerpts
      .filter((e) => e.documentId === activeDocumentId)
      .forEach((excerpt) => {
        console.log(
          `  Excerpt ${excerpt.id.slice(0, 8)}: codes =`,
          excerpt.codeIds,
        );
        excerpt.codeIds.forEach((codeId) => {
          counts.set(codeId, (counts.get(codeId) || 0) + 1);
        });
      });

    console.log(
      "[DocumentViewer] Final code counts:",
      Array.from(counts.entries())
        .map(
          ([id, count]) =>
            `${codes.find((c) => c.id === id)?.name || id.slice(0, 8)}: ${count}`,
        )
        .join(", "),
    );
    return counts;
  }, [excerpts, activeDocumentId, codes]);

  // Keyboard shortcut handler for deleting selected excerpt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedExcerptId) {
        // Don't delete if user is typing in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          return;
        }

        e.preventDefault();
        setDeleteExcerptId(selectedExcerptId);
      }

      // Close context menu on Escape
      if (e.key === "Escape" && contextMenu) {
        setContextMenu(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedExcerptId, contextMenu]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  // Auto-focus code search input when popover opens
  useEffect(() => {
    if (popoverOpen && codeSearchInputRef.current) {
      // Small delay to ensure the popover is rendered
      setTimeout(() => {
        codeSearchInputRef.current?.focus();
      }, 100);
    }
  }, [popoverOpen]);

  const handleDeleteExcerpt = (excerptId: string) => {
    const excerpt = excerpts.find((e) => e.id === excerptId);
    if (!excerpt) return;

    removeExcerpt(excerptId);
    if (selectedExcerptId === excerptId) {
      setSelectedExcerpt(null);
    }
    setDeleteExcerptId(null);
    toast({
      title: "Excerpt deleted",
      description: "The highlighted text has been removed.",
    });
    setContextMenu(null);
  };

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
        const fileArray = Array.from(files);
        let successCount = 0;
        let failedFiles: string[] = [];

        for (const file of fileArray) {
          try {
            const parsed = await parseFile(file);
            const newDoc = addDocument(parsed);
            lastDocumentId = newDoc.id;
            successCount++;
            
            if (fileArray.length === 1) {
              toast({
                title: "Document imported",
                description: `"${parsed.title}" has been added to your project.`,
              });
            }
          } catch (error) {
            console.error(`Failed to parse file ${file.name}:`, error);
            failedFiles.push(file.name);
            
            if (fileArray.length === 1) {
              // Show detailed error for single file
              toast({
                title: "Import failed",
                description: error instanceof Error ? error.message : "Failed to parse the file.",
                variant: "destructive",
              });
            }
          }
        }

        // Show summary for multiple files
        if (fileArray.length > 1) {
          if (successCount > 0) {
            toast({
              title: `${successCount} document(s) imported`,
              description: failedFiles.length > 0 
                ? `Failed to import: ${failedFiles.join(", ")}`
                : "All documents imported successfully.",
              variant: failedFiles.length > 0 ? "default" : "default",
            });
          } else {
            toast({
              title: "Import failed",
              description: `Failed to import all files. Check console for details.`,
              variant: "destructive",
            });
          }
        }

        // Automatically open the last uploaded document
        if (lastDocumentId) {
          setActiveDocument(lastDocumentId);
        }
      } catch (error) {
        console.error("Unexpected error during file upload:", error);
        toast({
          title: "Import failed",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
        setImportDialogOpen(false);
      }
    },
    [activeStudyId, addDocument, setActiveDocument, toast],
  );

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !activeDocument) return;

    const range = selection.getRangeAt(0);

    // Calculate offset within document content FIRST (before getting text)
    const containerRect = contentRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(contentRef.current!);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preSelectionRange.toString().length;

    // Get the full selected text without trimming (to match offsets exactly)
    const fullText = selection.toString();
    const endOffset = startOffset + fullText.length;

    // For validation, check if trimmed text is empty
    if (!fullText.trim()) return;

    // If in reselection mode, replace the existing excerpt with new selection
    if (reselectionMode) {
      updateExcerpt(reselectionMode, {
        text: fullText,
        startOffset,
        endOffset,
      });

      toast({
        title: "Highlight updated",
        description: "The highlighted text has been changed.",
      });

      setReselectionMode(null);
      window.getSelection()?.removeAllRanges();
      return;
    }

    const rect = range.getBoundingClientRect();

    // Use viewport coordinates for fixed positioning
    // Calculate center position, but keep within screen bounds
    const popoverWidth = 300; // Approximate popover width
    const popoverHeight = 300; // Approximate popover height
    const minX = popoverWidth / 2 + 20; // 20px padding from edge
    const maxX = window.innerWidth - popoverWidth / 2 - 20;

    let x = rect.left + rect.width / 2;
    x = Math.max(minX, Math.min(x, maxX));

    // Determine if there's enough space above (need at least popoverHeight + some margin)
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showBelow = spaceAbove < popoverHeight + 20;

    let y = showBelow ? rect.bottom + 10 : rect.top - 10;

    setPopoverPosition({ x, y });
    setPopoverBelow(showBelow);

    setCurrentSelection({
      text: fullText,
      startOffset,
      endOffset,
      documentId: activeDocument.id,
    });

    setPopoverOpen(true);
    setAiSuggestions([]);
  }, [
    activeDocument,
    setCurrentSelection,
    reselectionMode,
    updateExcerpt,
    toast,
  ]);

  const handleGetAISuggestions = async () => {
    if (!currentSelection || !activeDocument) {
      console.error("AI Suggestions Error: No selection or document", {
        hasSelection: !!currentSelection,
        hasDocument: !!activeDocument,
      });
      toast({
        title: "Selection Required",
        description: "Please select text in the document first.",
        variant: "destructive",
      });
      return;
    }

    console.log(
      "AI Request - Text length:",
      currentSelection.text.length,
      "Text:",
      currentSelection.text,
    );
    setLoadingAI(true);

    // Log AI request
    logAction("ai_suggestion_requested", {
      documentId: activeDocument.id,
      excerptText: currentSelection.text.substring(0, 100),
      excerptLength: currentSelection.text.length,
    });

    try {
      // Pass the full document content as context
      const suggestions = await suggestCodes(
        currentSelection.text,
        codes.map((c) => c.name),
        activeDocument.content, // Full document context
      );
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("AI Suggestion Error:", error);
      toast({
        title: "AI Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to get code suggestions.",
        variant: "destructive",
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const handleCreateExcerpt = () => {
    if (!currentSelection) return;

    // CRITICAL: Clear browser selection FIRST to prevent duplicate highlighting
    window.getSelection()?.removeAllRanges();

    // Check for overlapping excerpts to prevent duplication issues
    const hasOverlap = documentExcerpts.some((existing) => {
      // Check if there's any overlap between the new and existing excerpt
      return (
        existing.documentId === currentSelection.documentId &&
        // New excerpt starts within existing one
        ((currentSelection.startOffset >= existing.startOffset &&
          currentSelection.startOffset < existing.endOffset) ||
          // New excerpt ends within existing one
          (currentSelection.endOffset > existing.startOffset &&
            currentSelection.endOffset <= existing.endOffset) ||
          // New excerpt completely contains existing one
          (currentSelection.startOffset <= existing.startOffset &&
            currentSelection.endOffset >= existing.endOffset))
      );
    });

    if (hasOverlap) {
      toast({
        title: "Overlapping excerpt",
        description:
          "This text overlaps with an existing highlight. Please select a different area or delete the existing highlight first.",
        variant: "destructive",
      });
      setPopoverOpen(false);
      setNewCodeName("");
      setSelectedCodes([]);
      setAiSuggestions([]);
      setCodeFilterQuery("");
      return;
    }

    // Create new code if name provided
    let codeIds = [...selectedCodes];
    if (newCodeName.trim()) {
      const newCode = addCode(newCodeName.trim());
      codeIds.push(newCode.id);
    }

    if (codeIds.length > 0) {
      addExcerpt(currentSelection, codeIds);
      toast({
        title: "Excerpt coded",
        description: `Assigned to ${codeIds.length} code(s).`,
      });
    }

    setPopoverOpen(false);
    setNewCodeName("");
    setSelectedCodes([]);
    setAiSuggestions([]);
    setCodeFilterQuery("");
  };

  const toggleCodeSelection = (codeId: string) => {
    setSelectedCodes((prev) =>
      prev.includes(codeId)
        ? prev.filter((id) => id !== codeId)
        : [...prev, codeId],
    );
  };

  const handleApplyAISuggestion = (suggestion: AICodeSuggestion) => {
    if (!currentSelection) return;

    // CRITICAL: Clear browser selection FIRST to prevent duplicate highlighting
    window.getSelection()?.removeAllRanges();

    // Check for overlapping excerpts to prevent duplication issues
    const hasOverlap = documentExcerpts.some((existing) => {
      // Check if there's any overlap between the new and existing excerpt
      return (
        existing.documentId === currentSelection.documentId &&
        // New excerpt starts within existing one
        ((currentSelection.startOffset >= existing.startOffset &&
          currentSelection.startOffset < existing.endOffset) ||
          // New excerpt ends within existing one
          (currentSelection.endOffset > existing.startOffset &&
            currentSelection.endOffset <= existing.endOffset) ||
          // New excerpt completely contains existing one
          (currentSelection.startOffset <= existing.startOffset &&
            currentSelection.endOffset >= existing.endOffset))
      );
    });

    if (hasOverlap) {
      toast({
        title: "Overlapping excerpt",
        description:
          "This text overlaps with an existing highlight. Please select a different area or delete the existing highlight first.",
        variant: "destructive",
      });
      setPopoverOpen(false);
      setCurrentSelection(null);
      setAiSuggestions([]);
      setSelectedCodes([]);
      setNewCodeName("");
      setCodeFilterQuery("");
      return;
    }

    let codeId: string;

    if (suggestion.existingMatch) {
      // Find existing code
      const existingCode = codes.find(
        (c) => c.name.toLowerCase() === suggestion.existingMatch?.toLowerCase(),
      );
      if (existingCode) {
        codeId = existingCode.id;
      } else {
        // If not found, create new code
        const newCode = addCode(suggestion.code);
        codeId = newCode.id;
      }
    } else {
      // Create new code with AI suggestion
      const newCode = addCode(suggestion.code);
      codeId = newCode.id;
    }

    // Log AI acceptance
    logAction("ai_suggestion_accepted", {
      aiSuggestion: suggestion.code,
      aiConfidence: suggestion.confidence,
      suggestionAccepted: true,
      codeId,
      codeName: suggestion.code,
    });

    // Create excerpt immediately
    addExcerpt(currentSelection, [codeId]);

    toast({
      title: "Excerpt coded",
      description: `Applied code: "${suggestion.code}"`,
    });

    // Close popover and reset state
    setPopoverOpen(false);
    setCurrentSelection(null);
    setAiSuggestions([]);
    setSelectedCodes([]);
    setNewCodeName("");
    setCodeFilterQuery("");
  };

  // Render text with highlights
  const renderHighlightedContent = () => {
    if (!activeDocument) return null;

    const content = activeDocument.content;
    const sortedExcerpts = [...documentExcerpts].sort(
      (a, b) => a.startOffset - b.startOffset,
    );

    const elements: React.ReactNode[] = [];
    let lastEnd = 0;

    sortedExcerpts.forEach((excerpt, idx) => {
      // CRITICAL FIX: Skip deleted excerpts by checking if they still exist in store
      const currentExcerpt = excerpts.find((e) => e.id === excerpt.id);
      if (!currentExcerpt) {
        // Excerpt was deleted, skip it entirely
        return;
      }

      // CRITICAL FIX: Skip overlapping excerpts to prevent text duplication
      if (currentExcerpt.startOffset < lastEnd) {
        console.warn(
          `Skipping overlapping excerpt ${currentExcerpt.id}: starts at ${currentExcerpt.startOffset} but lastEnd is ${lastEnd}`,
        );
        // Update lastEnd if this excerpt extends beyond the current one
        lastEnd = Math.max(lastEnd, currentExcerpt.endOffset);
        return;
      }

      // Text before this excerpt - render as-is, no splitting
      if (currentExcerpt.startOffset > lastEnd) {
        const textBefore = content.slice(lastEnd, currentExcerpt.startOffset);
        elements.push(<span key={`text-${idx}`}>{textBefore}</span>);
      }

      // The highlighted excerpt
      const excerptCodes = codes.filter((c) =>
        currentExcerpt.codeIds.includes(c.id),
      );
      const primaryLevel = excerptCodes[0]?.level || "main";

      // Use actual content slice to ensure perfect alignment with offsets
      const excerptText = content.slice(
        currentExcerpt.startOffset,
        currentExcerpt.endOffset,
      );
      const isHovered = hoveredExcerptId === currentExcerpt.id;
      const isSelected = selectedExcerptId === currentExcerpt.id;
      const isEditing = editingExcerptId === currentExcerpt.id;
      const isReselecting = reselectionMode === currentExcerpt.id;

      // Available codes to add (not already assigned)
      const availableCodes = codes.filter(
        (c) =>
          !currentExcerpt.codeIds.includes(c.id) &&
          c.name.toLowerCase().includes(editCodeSearch.toLowerCase()),
      );

      // Create a key that changes when codes change to force re-render
      const excerptKey = `excerpt-${currentExcerpt.id}-${currentExcerpt.codeIds.join(",")}`;

      elements.push(
        <Popover
          key={excerptKey}
          open={isEditing}
          onOpenChange={(open) => {
            if (!open) {
              setEditingExcerptId(null);
              setEditCodeSearch("");
            }
          }}
        >
          <PopoverTrigger asChild>
            <span
              className={cn(
                "highlight-block relative inline-block group cursor-pointer",
                primaryLevel === "child" && "highlight-block-child",
                primaryLevel === "subchild" && "highlight-block-subchild",
                isSelected && "ring-2 ring-accent ring-offset-1",
                isEditing && "ring-2 ring-primary ring-offset-1",
                isReselecting &&
                  "ring-4 ring-yellow-500 ring-offset-2 animate-pulse",
              )}
              onMouseEnter={() => setHoveredExcerptId(currentExcerpt.id)}
              onMouseLeave={() => setHoveredExcerptId(null)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedExcerpt(currentExcerpt.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  excerptId: currentExcerpt.id,
                });
                setSelectedExcerpt(currentExcerpt.id);
              }}
            >
              {excerptText}
              {isHovered && !isEditing && !isReselecting && (
                <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    className="h-4 w-4 rounded-full bg-yellow-500 text-white flex items-center justify-center hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReselectionMode(currentExcerpt.id);
                      toast({
                        title: "Re-select highlight",
                        description:
                          "Select new text to replace this highlight",
                      });
                    }}
                    title="Re-select text"
                  >
                    <Pencil className="h-2.5 w-2.5" />
                  </button>
                  <button
                    className="h-4 w-4 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingExcerptId(currentExcerpt.id);
                      setEditCodeSearch("");
                    }}
                    title="Edit codes"
                  >
                    <Tag className="h-2.5 w-2.5" />
                  </button>
                  <button
                    className="h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteExcerptId(currentExcerpt.id);
                    }}
                    title="Delete excerpt"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Edit Codes</h4>
                <button
                  className="h-5 w-5 rounded hover:bg-muted flex items-center justify-center"
                  onClick={() => {
                    setEditingExcerptId(null);
                    setEditCodeSearch("");
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Current codes with remove buttons */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Assigned codes:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {excerptCodes.length > 0 ? (
                    excerptCodes.map((code) => (
                      <span
                        key={code.id}
                        className={cn(
                          "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                          code.level === "main" &&
                            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                          code.level === "child" &&
                            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                          code.level === "subchild" &&
                            "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                        )}
                      >
                        {code.name}
                        <button
                          className="h-3.5 w-3.5 rounded-full hover:bg-black/20 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCodeFromExcerpt(currentExcerpt.id, code.id);
                            toast({
                              title: "Code removed",
                              description: `"${code.name}" removed from excerpt.`,
                            });
                          }}
                          title={`Remove ${code.name}`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      No codes assigned
                    </span>
                  )}
                </div>
              </div>

              {/* Search/add codes */}
              <div>
                <Input
                  placeholder="Search or create code..."
                  value={editCodeSearch}
                  onChange={(e) => setEditCodeSearch(e.target.value)}
                  className="h-8 text-sm"
                />
                <ScrollArea className="h-32 mt-2">
                  <div className="space-y-0.5">
                    {availableCodes.map((code) => (
                      <button
                        key={code.id}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted flex items-center gap-2"
                        onClick={() => {
                          assignCodeToExcerpt(currentExcerpt.id, code.id);
                          setEditCodeSearch("");
                          toast({
                            title: "Code added",
                            description: `"${code.name}" added to excerpt.`,
                          });
                        }}
                      >
                        <Plus className="h-3 w-3 text-muted-foreground" />
                        {code.name}
                      </button>
                    ))}
                    {/* Create new code option */}
                    {editCodeSearch.trim() &&
                      !codes.some(
                        (c) =>
                          c.name.toLowerCase() === editCodeSearch.toLowerCase(),
                      ) && (
                        <button
                          className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted flex items-center gap-2 text-accent"
                          onClick={() => {
                            const newCode = addCode(editCodeSearch.trim());
                            assignCodeToExcerpt(currentExcerpt.id, newCode.id);
                            setEditCodeSearch("");
                            toast({
                              title: "Code created",
                              description: `"${editCodeSearch.trim()}" created and added.`,
                            });
                          }}
                        >
                          <Plus className="h-3 w-3" />
                          Create "{editCodeSearch.trim()}"
                        </button>
                      )}
                    {availableCodes.length === 0 && !editCodeSearch.trim() && (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        Type to search or create a code
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </PopoverContent>
        </Popover>,
      );

      lastEnd = currentExcerpt.endOffset;
    });

    // Remaining text - render as-is, no splitting
    if (lastEnd < content.length) {
      const textAfter = content.slice(lastEnd);
      elements.push(<span key="text-end">{textAfter}</span>);
    }

    return <>{elements}</>;
  };

  if (!activeDocument) {
    return (
      <>
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Document Selected
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Select a document from the sidebar or import a new one to start
            coding
          </p>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Import Document
          </Button>
        </div>

        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
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
                document.getElementById("doc-viewer-file-input")?.click()
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
                id="doc-viewer-file-input"
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Document Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {activeDocument.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {documentExcerpts.length} excerpts coded • Select text to code
          </p>
        </div>
        <div className="flex items-center gap-2">
          {aiEnabled && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIntelligenceOpen(true)}
                  className="gap-2"
                  data-tour="document-intelligence"
                >
                  <Brain className="h-4 w-4" />
                  Document Intelligence
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                AI-powered summary, themes, and mind map
              </TooltipContent>
            </Tooltip>
          )}
          <span className="px-2 py-1 bg-muted rounded text-xs uppercase font-medium">
            {activeDocument.type}
          </span>
        </div>
      </div>

      {/* Re-selection Mode Banner */}
      {reselectionMode && (
        <div className="bg-yellow-500 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pencil className="h-5 w-5 animate-pulse" />
            <div>
              <p className="font-medium">Re-select Highlight</p>
              <p className="text-sm text-yellow-100">
                Select new text to replace this highlight (codes will be
                preserved)
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setReselectionMode(null);
              toast({
                title: "Cancelled",
                description: "Re-selection mode cancelled",
              });
            }}
            className="text-white hover:bg-yellow-600"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Document Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-auto scrollbar-thin relative bg-card rounded-lg border border-border p-6 leading-relaxed whitespace-pre-wrap"
        onClick={(e) => {
          // Deselect excerpt when clicking on blank space
          const target = e.target as HTMLElement;
          if (
            target === contentRef.current ||
            (target.tagName === "SPAN" && !target.closest(".highlight-block"))
          ) {
            setSelectedExcerpt(null);
          }
        }}
        onMouseUp={(e) => {
          // Don't handle text selection if clicking inside the popover
          const target = e.target as HTMLElement;
          if (target.closest(".selection-popup")) {
            return;
          }
          handleTextSelection();
        }}
      >
        {renderHighlightedContent()}

        {/* Selection Popover */}
        {popoverOpen && currentSelection && (
          <div
            className="selection-popup min-w-[280px] max-w-[400px]"
            style={{
              position: "fixed",
              left: popoverPosition.x,
              top: popoverPosition.y,
              transform: popoverBelow
                ? "translateX(-50%)"
                : "translateX(-50%) translateY(calc(-100% - 10px))",
              zIndex: 50,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Code this excerpt</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-auto"
                onClick={() => {
                  setPopoverOpen(false);
                  setCurrentSelection(null);
                  setAiSuggestions([]);
                  setCodeFilterQuery("");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* AI Suggestions */}
            {aiEnabled && (
              <div className="mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 mb-2"
                  onClick={handleGetAISuggestions}
                  disabled={loadingAI}
                >
                  {loadingAI ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-accent" />
                  )}
                  {loadingAI ? "Analyzing..." : "Get AI Suggestions"}
                </Button>

                {aiSuggestions.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-auto scrollbar-thin">
                    {aiSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleApplyAISuggestion(suggestion);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full flex items-start gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate">
                              {suggestion.code}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {suggestion.reason}
                          </p>
                          {suggestion.existingMatch && (
                            <p className="text-xs text-amber-500 flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="h-3 w-3" />
                              Similar: "{suggestion.existingMatch}"
                            </p>
                          )}
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Existing Codes */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-muted-foreground">Existing codes:</p>
                <span className="text-[10px] text-muted-foreground">
                  {
                    codes.filter((c) =>
                      c.name
                        .toLowerCase()
                        .includes(codeFilterQuery.toLowerCase()),
                    ).length
                  }{" "}
                  of {codes.length}
                </span>
              </div>

              {/* Search Input */}
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  ref={codeSearchInputRef}
                  placeholder="Search codes..."
                  value={codeFilterQuery}
                  onChange={(e) => setCodeFilterQuery(e.target.value)}
                  className="h-7 text-xs pl-7 pr-7"
                />
                {codeFilterQuery && (
                  <button
                    onClick={() => setCodeFilterQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center"
                  >
                    <X className="h-2.5 w-2.5 text-muted-foreground" />
                  </button>
                )}
              </div>

              <div className="max-h-28 overflow-auto scrollbar-thin">
                {codes.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {codes
                      .filter((code) =>
                        code.name
                          .toLowerCase()
                          .includes(codeFilterQuery.toLowerCase()),
                      )
                      .map((code) => {
                        // Get pre-calculated count from useMemo
                        const excerptsInDoc =
                          codeExcerptCounts.get(code.id) || 0;

                        return (
                          <button
                            key={code.id}
                            onClick={() => toggleCodeSelection(code.id)}
                            className={cn(
                              "code-chip transition-all relative",
                              selectedCodes.includes(code.id)
                                ? "ring-2 ring-accent ring-offset-1"
                                : excerptsInDoc > 0
                                  ? "opacity-90 hover:opacity-100"
                                  : "opacity-70 hover:opacity-100",
                              code.level === "main" && "code-chip-main",
                              code.level === "child" && "code-chip-child",
                              code.level === "subchild" && "code-chip-subchild",
                            )}
                          >
                            {selectedCodes.includes(code.id) && (
                              <Check className="h-3 w-3" />
                            )}
                            {code.name}
                            {excerptsInDoc > 0 && (
                              <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-background/50 font-medium">
                                {excerptsInDoc}
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No codes yet
                  </p>
                )}
                {codes.length > 0 &&
                  codes.filter((c) =>
                    c.name
                      .toLowerCase()
                      .includes(codeFilterQuery.toLowerCase()),
                  ).length === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center py-2">
                      No codes match "{codeFilterQuery}"
                    </p>
                  )}
              </div>
            </div>

            {/* New Code Input */}
            <div className="flex gap-2">
              <Input
                placeholder="New code name..."
                value={newCodeName}
                onChange={(e) => setNewCodeName(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleCreateExcerpt()}
              />
              <Button
                size="sm"
                onClick={handleCreateExcerpt}
                disabled={!newCodeName.trim() && selectedCodes.length === 0}
                className="h-8 px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-popover border border-border rounded-md shadow-lg py-1 z-50 min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 text-destructive hover:text-destructive"
            onClick={() => setDeleteExcerptId(contextMenu.excerptId)}
          >
            <Trash2 className="h-4 w-4" />
            Delete Excerpt
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
            onClick={() => {
              setSelectedExcerpt(contextMenu.excerptId);
              setContextMenu(null);
            }}
          >
            <FileText className="h-4 w-4" />
            View Details
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteExcerptId}
        onOpenChange={(open) => !open && setDeleteExcerptId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Excerpt?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this highlighted excerpt? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteExcerptId && handleDeleteExcerpt(deleteExcerptId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Intelligence Panel */}
      {activeDocument && (
        <DocumentIntelligence
          documentId={activeDocument.id}
          documentTitle={activeDocument.title}
          documentContent={activeDocument.content}
          open={intelligenceOpen}
          onOpenChange={setIntelligenceOpen}
        />
      )}
    </div>
  );
}
