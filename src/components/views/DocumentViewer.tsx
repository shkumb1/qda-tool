import { useState, useCallback, useRef } from "react";
import { useQDAStore } from "@/store/qdaStore";
import { suggestCodes, type AICodeSuggestion } from "@/services/aiService";
import { parseFile } from "@/utils/documentParser";
import {
  FileText,
  Upload,
  Plus,
  X,
  Sparkles,
  Loader2,
  Check,
  AlertTriangle,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { TextSelection } from "@/types/qda";

export function DocumentViewer() {
  const { toast } = useToast();
  const {
    documents,
    activeDocumentId,
    activeStudyId,
    codes,
    excerpts,
    currentSelection,
    setCurrentSelection,
    setSelectedExcerpt,
    setActiveDocument,
    addExcerpt,
    addCode,
    addDocument,
    logAction,
  } = useQDAStore();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [popoverBelow, setPopoverBelow] = useState(false);
  const [newCodeName, setNewCodeName] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AICodeSuggestion[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const activeDocument = documents.find((d) => d.id === activeDocumentId);
  const documentExcerpts = excerpts.filter(
    (e) => e.documentId === activeDocumentId
  );

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
        }
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to parse one or more files.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
        setImportDialogOpen(false);
      }
    },
    [activeStudyId, addDocument, setActiveDocument, toast]
  );

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !activeDocument) return;

    const text = selection.toString().trim();
    if (!text) return;

    const range = selection.getRangeAt(0);
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

    // Calculate offset within document content
    const containerRect = contentRef.current?.getBoundingClientRect();
    if (containerRect) {
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(contentRef.current!);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preSelectionRange.toString().length;

      setCurrentSelection({
        text,
        startOffset,
        endOffset: startOffset + text.length,
        documentId: activeDocument.id,
      });

      setPopoverOpen(true);
      setAiSuggestions([]);
    }
  }, [activeDocument, setCurrentSelection]);

  const handleGetAISuggestions = async () => {
    if (!currentSelection || !activeDocument) return;
    setLoadingAI(true);
    
    // Log AI request
    logAction('ai_suggestion_requested', {
      documentId: activeDocument.id,
      excerptText: currentSelection.text.substring(0, 100),
      excerptLength: currentSelection.text.length,
    });
    
    try {
      // Pass the full document content as context
      const suggestions = await suggestCodes(
        currentSelection.text,
        codes.map((c) => c.name),
        activeDocument.content // Full document context
      );
      setAiSuggestions(suggestions);
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Failed to get code suggestions.",
        variant: "destructive",
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const handleCreateExcerpt = () => {
    if (!currentSelection) return;

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
    window.getSelection()?.removeAllRanges();
  };

  const toggleCodeSelection = (codeId: string) => {
    setSelectedCodes((prev) =>
      prev.includes(codeId)
        ? prev.filter((id) => id !== codeId)
        : [...prev, codeId]
    );
  };

  const handleApplyAISuggestion = (suggestion: AICodeSuggestion) => {
    if (!currentSelection) return;

    let codeId: string;

    if (suggestion.existingMatch) {
      // Find existing code
      const existingCode = codes.find(
        (c) => c.name.toLowerCase() === suggestion.existingMatch?.toLowerCase()
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
    logAction('ai_suggestion_accepted', {
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

    // Close popover and reset
    setPopoverOpen(false);
    setCurrentSelection(null);
    setAiSuggestions([]);
    setSelectedCodes([]);
    setNewCodeName("");
  };

  // Render text with highlights
  const renderHighlightedContent = () => {
    if (!activeDocument) return null;

    const content = activeDocument.content;
    const sortedExcerpts = [...documentExcerpts].sort(
      (a, b) => a.startOffset - b.startOffset
    );

    if (sortedExcerpts.length === 0) {
      return content.split("\n").map((para, i) => (
        <p key={i} className="mb-4 leading-relaxed">
          {para || "\u00A0"}
        </p>
      ));
    }

    const elements: React.ReactNode[] = [];
    let lastEnd = 0;

    sortedExcerpts.forEach((excerpt, idx) => {
      // Text before this excerpt
      if (excerpt.startOffset > lastEnd) {
        const textBefore = content.slice(lastEnd, excerpt.startOffset);
        elements.push(
          <span key={`text-${idx}`}>
            {textBefore.split("\n").map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      }

      // The highlighted excerpt
      const excerptCodes = codes.filter((c) => excerpt.codeIds.includes(c.id));
      const primaryLevel = excerptCodes[0]?.level || "main";

      elements.push(
        <Tooltip key={`excerpt-${excerpt.id}`}>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "highlight-block",
                primaryLevel === "child" && "highlight-block-child",
                primaryLevel === "subchild" && "highlight-block-subchild"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedExcerpt(excerpt.id);
              }}
            >
              {excerpt.text}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs">
              <p className="font-medium mb-1">Codes:</p>
              <div className="flex flex-wrap gap-1">
                {excerptCodes.map((c) => (
                  <span
                    key={c.id}
                    className="text-xs bg-muted px-1.5 py-0.5 rounded"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
              {excerpt.memo && (
                <p className="text-xs mt-2 text-muted-foreground">
                  Memo: {excerpt.memo}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      );

      lastEnd = excerpt.endOffset;
    });

    // Remaining text
    if (lastEnd < content.length) {
      const textAfter = content.slice(lastEnd);
      elements.push(
        <span key="text-end">
          {textAfter.split("\n").map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </span>
      );
    }

    return (
      <div className="leading-relaxed whitespace-pre-wrap">{elements}</div>
    );
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
    <div className="h-full flex flex-col">
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="px-2 py-1 bg-muted rounded text-xs uppercase font-medium">
            {activeDocument.type}
          </span>
        </div>
      </div>

      {/* Document Content */}
      <div
        ref={contentRef}
        className="flex-1 overflow-auto scrollbar-thin relative bg-card rounded-lg border border-border p-6"
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
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* AI Suggestions */}
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

            {/* Existing Codes */}
            <div className="max-h-28 overflow-auto scrollbar-thin mb-3">
              <p className="text-xs text-muted-foreground mb-1.5">
                Existing codes:
              </p>
              {codes.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {codes.map((code) => {
                    // Count excerpts in current document
                    const excerptsInDoc =
                      activeDocument?.excerpts?.filter(
                        (e) => e.codeId === code.id
                      ).length || 0;

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
                          code.level === "subchild" && "code-chip-subchild"
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
    </div>
  );
}
