import { useState } from "react";
import { useQDAStore } from "@/store/qdaStore";
import { generateSummary, type AISummary } from "@/services/aiService";
import {
  X,
  FileText,
  Tag,
  MessageSquare,
  Hash,
  Calendar,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function RightPanel() {
  const { toast } = useToast();
  const {
    selectedExcerptId,
    selectedCodeId,
    excerpts,
    codes,
    documents,
    memos,
    setSelectedExcerpt,
    setSelectedCode,
    updateExcerpt,
    addMemo,
    updateMemo,
  } = useQDAStore();

  const [memoInput, setMemoInput] = useState("");
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const selectedExcerpt = excerpts.find((e) => e.id === selectedExcerptId);
  const selectedCode = codes.find((c) => c.id === selectedCodeId);

  const handleGetAISummary = async () => {
    if (!selectedCode) return;
    setLoadingAI(true);
    try {
      const codeExcerpts = excerpts.filter((e) =>
        e.codeIds.includes(selectedCode.id)
      );
      const docTitles = [
        ...new Set(
          codeExcerpts.map((e) => {
            const doc = documents.find((d) => d.id === e.documentId);
            return doc?.title || "Unknown";
          })
        ),
      ];

      const summary = await generateSummary(
        "code",
        selectedCode.name,
        codeExcerpts.map((e) => e.text),
        docTitles
      );
      setAiSummary(summary);
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Failed to generate summary.",
        variant: "destructive",
      });
    } finally {
      setLoadingAI(false);
    }
  };

  if (!selectedExcerpt && !selectedCode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Tag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-1">No Selection</h3>
        <p className="text-sm text-muted-foreground">
          Select an excerpt or code to view details
        </p>
      </div>
    );
  }

  // Render Excerpt Details
  if (selectedExcerpt) {
    const doc = documents.find((d) => d.id === selectedExcerpt.documentId);
    const excerptCodes = codes.filter((c) =>
      selectedExcerpt.codeIds.includes(c.id)
    );
    const excerptMemo = memos.find(
      (m) => m.targetType === "excerpt" && m.targetId === selectedExcerpt.id
    );

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="panel-header">
          <span className="panel-title">Excerpt Details</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setSelectedExcerpt(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4 scrollbar-thin">
          {/* Excerpt Text */}
          <div className="panel-section p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <FileText className="h-3 w-3" />
              <span>{doc?.title || "Unknown document"}</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-md border-l-4 border-accent">
              "{selectedExcerpt.text}"
            </p>
          </div>

          {/* Assigned Codes */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Assigned Codes
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {excerptCodes.map((code) => (
                <span
                  key={code.id}
                  className={cn(
                    "code-chip cursor-pointer hover:opacity-80 transition-opacity",
                    code.level === "main" && "code-chip-main",
                    code.level === "child" && "code-chip-child",
                    code.level === "subchild" && "code-chip-subchild"
                  )}
                  onClick={() => {
                    setSelectedExcerpt(null);
                    setSelectedCode(code.id);
                  }}
                >
                  {code.name}
                </span>
              ))}
              {excerptCodes.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  No codes assigned
                </span>
              )}
            </div>
          </div>

          {/* Location Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Hash className="h-3 w-3" />
                Position
              </div>
              <p className="text-sm font-medium">
                {selectedExcerpt.startOffset} - {selectedExcerpt.endOffset}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Calendar className="h-3 w-3" />
                Created
              </div>
              <p className="text-sm font-medium">
                {new Date(selectedExcerpt.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Memo */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" />
              Memo
            </h4>
            <Textarea
              value={excerptMemo?.content || memoInput}
              onChange={(e) => {
                if (excerptMemo) {
                  updateMemo(excerptMemo.id, e.target.value);
                } else {
                  setMemoInput(e.target.value);
                }
              }}
              onBlur={() => {
                if (!excerptMemo && memoInput.trim()) {
                  addMemo(memoInput, "excerpt", selectedExcerpt.id);
                  setMemoInput("");
                }
              }}
              placeholder="Add a memo about this excerpt..."
              className="min-h-[80px] text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  // Render Code Details
  if (selectedCode) {
    const codeExcerpts = excerpts.filter((e) =>
      e.codeIds.includes(selectedCode.id)
    );
    const childCodes = codes.filter((c) => c.parentId === selectedCode.id);
    const parentCode = selectedCode.parentId
      ? codes.find((c) => c.id === selectedCode.parentId)
      : null;

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="panel-header">
          <span className="panel-title">Code Details</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setSelectedCode(null);
              setAiSummary(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4 scrollbar-thin">
          {/* Code Name & Level */}
          <div className="panel-section p-3">
            <span
              className={cn(
                "code-chip mb-2",
                selectedCode.level === "main" && "code-chip-main",
                selectedCode.level === "child" && "code-chip-child",
                selectedCode.level === "subchild" && "code-chip-subchild"
              )}
            >
              {selectedCode.level.toUpperCase()}
            </span>
            <h3 className="text-lg font-semibold text-foreground">
              {selectedCode.name}
            </h3>
            {selectedCode.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedCode.description}
              </p>
            )}
          </div>

          {/* AI Summary */}
          <div className="panel-section p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                AI Summary
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGetAISummary}
                disabled={loadingAI}
                className="h-7 text-xs"
              >
                {loadingAI ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Generate"
                )}
              </Button>
            </div>
            {aiSummary ? (
              <div className="space-y-2 text-sm">
                <p className="text-foreground">{aiSummary.meaning}</p>
                <p className="text-xs text-muted-foreground">
                  {aiSummary.documentPresence}
                </p>
                {aiSummary.keyExcerpts.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Key excerpts:
                    </p>
                    {aiSummary.keyExcerpts.map((excerpt, i) => (
                      <p
                        key={i}
                        className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded mb-1"
                      >
                        "{excerpt}"
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Click generate to get an AI-powered summary
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-foreground">
                {codeExcerpts.length}
              </p>
              <p className="text-xs text-muted-foreground">Excerpts</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-foreground">
                {[...new Set(codeExcerpts.map((e) => e.documentId))].length}
              </p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
          </div>

          {/* Hierarchy */}
          {(parentCode || childCodes.length > 0) && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Hierarchy
              </h4>
              {parentCode && (
                <div className="text-sm mb-2">
                  <span className="text-muted-foreground">Parent: </span>
                  <button
                    className="font-medium text-accent hover:underline"
                    onClick={() => setSelectedCode(parentCode.id)}
                  >
                    {parentCode.name}
                  </button>
                </div>
              )}
              {childCodes.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Children: </span>
                  {childCodes.map((c, i) => (
                    <span key={c.id}>
                      <button
                        className="font-medium text-accent hover:underline"
                        onClick={() => setSelectedCode(c.id)}
                      >
                        {c.name}
                      </button>
                      {i < childCodes.length - 1 && ", "}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Excerpts Preview */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Excerpts ({codeExcerpts.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-auto scrollbar-thin">
              {codeExcerpts.slice(0, 5).map((excerpt) => {
                const doc = documents.find((d) => d.id === excerpt.documentId);
                return (
                  <div
                    key={excerpt.id}
                    className="p-2 bg-muted/30 rounded-md text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedCode(null);
                      setSelectedExcerpt(excerpt.id);
                      setAiSummary(null);
                    }}
                  >
                    <p className="text-muted-foreground mb-1">{doc?.title}</p>
                    <p className="text-foreground line-clamp-2">
                      "{excerpt.text}"
                    </p>
                  </div>
                );
              })}
              {codeExcerpts.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{codeExcerpts.length - 5} more excerpts
                </p>
              )}
              {codeExcerpts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No excerpts coded yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
