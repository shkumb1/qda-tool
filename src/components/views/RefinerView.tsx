import { useState, useMemo } from "react";
import { useQDAStore } from "@/store/qdaStore";
import {
  getCodeExcerptCount,
  getCodeDocumentCount,
} from "@/utils/analysisHelpers";
import {
  suggestRefinements,
  type AIRefinementSuggestion,
} from "@/services/aiService";
import {
  Search,
  ArrowUpDown,
  Filter,
  GitMerge,
  Edit2,
  Trash2,
  Undo2,
  AlertTriangle,
  Sparkles,
  Loader2,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Code } from "@/types/qda";

type SortBy = "name" | "frequency" | "documents";

export function RefinerView() {
  const { toast } = useToast();
  const {
    codes,
    documents,
    excerpts,
    deleteCode,
    undoDeleteCode,
    mergeCodes,
    renameCode,
    setSelectedCode,
    checkDuplicateCodeName,
  } = useQDAStore();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("frequency");
  const [sortAsc, setSortAsc] = useState(false);
  const [documentFilter, setDocumentFilter] = useState<string>("all");
  const [renameDialog, setRenameDialog] = useState<{
    open: boolean;
    code: Code | null;
  }>({
    open: false,
    code: null,
  });
  const [mergeDialog, setMergeDialog] = useState<{
    open: boolean;
    sourceCode: Code | null;
  }>({
    open: false,
    sourceCode: null,
  });
  const [newName, setNewName] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<AIRefinementSuggestion[]>(
    []
  );
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // Get documents where each code appears
  const codeDocuments = useMemo(() => {
    const map = new Map<string, Set<string>>();
    excerpts.forEach((excerpt) => {
      excerpt.codeIds.forEach((codeId) => {
        if (!map.has(codeId)) {
          map.set(codeId, new Set());
        }
        map.get(codeId)!.add(excerpt.documentId);
      });
    });
    return map;
  }, [excerpts]);

  // Filter and sort codes
  const filteredCodes = useMemo(() => {
    let result = [...codes];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(searchLower));
    }

    // Document filter
    if (documentFilter !== "all") {
      result = result.filter((c) => {
        const docs = codeDocuments.get(c.id);
        return docs?.has(documentFilter);
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "frequency":
          comparison = a.frequency - b.frequency;
          break;
        case "documents":
          comparison = a.documentCount - b.documentCount;
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [codes, search, documentFilter, sortBy, sortAsc, codeDocuments]);

  const handleGetAISuggestions = async () => {
    setLoadingAI(true);
    try {
      const suggestions = await suggestRefinements(
        codes.map((c) => ({
          name: c.name,
          frequency: c.frequency,
          documentCount: c.documentCount,
        }))
      );
      setAiSuggestions(suggestions);
      setAiPanelOpen(true);
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Failed to get refinement suggestions.",
        variant: "destructive",
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const handleApplyMergeSuggestion = (suggestion: AIRefinementSuggestion) => {
    if (suggestion.type === "merge" && suggestion.codes.length === 2) {
      const source = codes.find((c) => c.name === suggestion.codes[0]);
      const target = codes.find((c) => c.name === suggestion.codes[1]);
      if (source && target) {
        mergeCodes(source.id, target.id);
        toast({ title: "Codes merged", description: suggestion.suggestion });
      }
    }
  };

  const handleRename = () => {
    if (!renameDialog.code || !newName.trim()) return;
    if (checkDuplicateCodeName(newName, renameDialog.code.id)) {
      toast({
        title: "Duplicate name",
        description: "A code with this name already exists.",
        variant: "destructive",
      });
      return;
    }
    renameCode(renameDialog.code.id, newName);
    setNewName("");
    setRenameDialog({ open: false, code: null });
    toast({ title: "Code renamed" });
  };

  const handleDelete = (code: Code) => {
    deleteCode(code.id);
    toast({
      title: "Code deleted",
      description: `"${code.name}" has been removed.`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const restored = undoDeleteCode();
            if (restored) {
              toast({
                title: "Code restored",
                description: `"${restored.name}" is back.`,
              });
            }
          }}
        >
          <Undo2 className="h-3 w-3 mr-1" />
          Undo
        </Button>
      ),
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Code Refiner
          </h2>
          <p className="text-sm text-muted-foreground">
            Clean up and organize your {codes.length} codes
          </p>
        </div>
        <Sheet open={aiPanelOpen} onOpenChange={setAiPanelOpen}>
          <SheetTrigger asChild>
            <Button
              onClick={handleGetAISuggestions}
              disabled={loadingAI || codes.length === 0}
              className="gap-2"
            >
              {loadingAI ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              AI Suggestions
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-accent" />
                AI Refinement Suggestions
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {aiSuggestions.length > 0 ? (
                aiSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent uppercase font-medium">
                        {suggestion.type}
                      </span>
                      {suggestion.type === "merge" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApplyMergeSuggestion(suggestion)}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                    <p className="font-medium text-sm mb-1">
                      {suggestion.suggestion}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.reason}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {suggestion.codes.map((code) => (
                        <span
                          key={code}
                          className="text-xs px-2 py-0.5 rounded bg-muted"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {loadingAI
                    ? "Analyzing your codes..."
                    : 'Click "AI Suggestions" to get refinement ideas'}
                </p>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Document Filter */}
        <Select value={documentFilter} onValueChange={setDocumentFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All documents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All documents</SelectItem>
            {documents.map((doc) => (
              <SelectItem key={doc.id} value={doc.id}>
                {doc.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-[150px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="frequency">Frequency</SelectItem>
            <SelectItem value="documents">Documents</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortAsc(!sortAsc)}
            >
              <ArrowUpDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  sortAsc && "rotate-180"
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{sortAsc ? "Ascending" : "Descending"}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Codes Grid */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredCodes.map((code) => {
            const docIds = codeDocuments.get(code.id);
            const codeDocsList = docIds
              ? documents.filter((d) => docIds.has(d.id))
              : [];

            return (
              <div
                key={code.id}
                className={cn(
                  "group p-3 rounded-lg border border-border bg-card hover:shadow-card-hover transition-all cursor-pointer",
                  "hover:border-accent/50"
                )}
                onClick={() => setSelectedCode(code.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: code.color }}
                    />
                    <span className="font-medium text-sm truncate">
                      {code.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "code-chip text-[10px] px-1.5 py-0.5 flex-shrink-0",
                      code.level === "main" && "code-chip-main",
                      code.level === "child" && "code-chip-child",
                      code.level === "subchild" && "code-chip-subchild"
                    )}
                  >
                    {code.level}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <Tooltip>
                    <TooltipTrigger>
                      <span>
                        {getCodeExcerptCount(code.id, excerpts)} excerpts
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of coded excerpts</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger>
                      <span>
                        {getCodeDocumentCount(code.id, excerpts)} docs
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of documents with this code</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Documents tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex -space-x-1 mb-3">
                      {codeDocsList.slice(0, 3).map((doc) => (
                        <div
                          key={doc.id}
                          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium border-2 border-card"
                        >
                          {doc.title.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {codeDocsList.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-[10px] font-medium border-2 border-card">
                          +{codeDocsList.length - 3}
                        </div>
                      )}
                      {codeDocsList.length === 0 && (
                        <div className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center text-[10px] text-muted-foreground">
                          —
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {codeDocsList.length > 0
                        ? codeDocsList.map((d) => d.title).join(", ")
                        : "No documents"}
                    </p>
                  </TooltipContent>
                </Tooltip>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewName(code.name);
                          setRenameDialog({ open: true, code });
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rename</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMergeDialog({ open: true, sourceCode: code });
                        }}
                      >
                        <GitMerge className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Merge into another code</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(code);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete (can undo)</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCodes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No codes found</p>
          </div>
        )}
      </div>

      {/* Rename Dialog */}
      <Dialog
        open={renameDialog.open}
        onOpenChange={(open) => setRenameDialog({ ...renameDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Code</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="New name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          {checkDuplicateCodeName(newName, renameDialog.code?.id) && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />A code with this name already
              exists
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialog({ open: false, code: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog
        open={mergeDialog.open}
        onOpenChange={(open) => setMergeDialog({ ...mergeDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Merge "{mergeDialog.sourceCode?.name}" Into
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-60 overflow-auto scrollbar-thin space-y-1">
            {codes
              .filter((c) => c.id !== mergeDialog.sourceCode?.id)
              .map((code) => (
                <button
                  key={code.id}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                  onClick={() => {
                    if (mergeDialog.sourceCode) {
                      mergeCodes(mergeDialog.sourceCode.id, code.id);
                      setMergeDialog({ open: false, sourceCode: null });
                      toast({ title: "Codes merged" });
                    }
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: code.color }}
                  />
                  <span className="text-sm">{code.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {getCodeExcerptCount(code.id, excerpts)} excerpts
                  </span>
                </button>
              ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMergeDialog({ open: false, sourceCode: null })}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
