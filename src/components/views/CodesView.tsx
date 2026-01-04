import { useState } from "react";
import { useQDAStore } from "@/store/qdaStore";
import { getCodeExcerptCount } from "@/utils/analysisHelpers";
import {
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Edit2,
  Trash2,
  GitMerge,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Code, CodeLevel } from "@/types/qda";

export function CodesView() {
  const {
    codes,
    excerpts,
    addCode,
    deleteCode,
    renameCode,
    mergeCodes,
    setSelectedCode,
    checkDuplicateCodeName,
  } = useQDAStore();

  const [search, setSearch] = useState("");
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());
  const [newCodeDialog, setNewCodeDialog] = useState<{
    open: boolean;
    parentId?: string;
    level: CodeLevel;
  }>({ open: false, level: "main" });
  const [newCodeName, setNewCodeName] = useState("");
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

  const mainCodes = codes.filter((c) => c.level === "main" && !c.parentId);
  const filteredCodes = search
    ? codes.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : mainCodes;

  const toggleExpand = (codeId: string) => {
    const newExpanded = new Set(expandedCodes);
    if (newExpanded.has(codeId)) {
      newExpanded.delete(codeId);
    } else {
      newExpanded.add(codeId);
    }
    setExpandedCodes(newExpanded);
  };

  const getChildCodes = (parentId: string) => {
    return codes.filter((c) => c.parentId === parentId);
  };

  const handleCreateCode = () => {
    if (!newCodeName.trim()) return;
    if (checkDuplicateCodeName(newCodeName)) {
      return;
    }
    addCode(newCodeName.trim(), newCodeDialog.parentId, newCodeDialog.level);
    setNewCodeName("");
    setNewCodeDialog({ open: false, level: "main" });
  };

  const handleRename = () => {
    if (!renameDialog.code || !newCodeName.trim()) return;
    renameCode(renameDialog.code.id, newCodeName.trim());
    setNewCodeName("");
    setRenameDialog({ open: false, code: null });
  };

  const renderCodeItem = (code: Code, depth: number = 0) => {
    const children = getChildCodes(code.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCodes.has(code.id);

    return (
      <div key={code.id}>
        <div
          className={cn(
            "group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
            depth > 0 && "ml-6"
          )}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => setSelectedCode(code.id)}
        >
          {/* Expand/Collapse */}
          <button
            className={cn(
              "p-0.5 rounded hover:bg-muted",
              !hasChildren && "invisible"
            )}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(code.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {/* Color indicator */}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: code.color }}
          />

          {/* Code name */}
          <span className="flex-1 text-sm font-medium text-foreground truncate">
            {code.name}
          </span>

          {/* Level badge */}
          <span
            className={cn(
              "code-chip text-[10px] px-1.5 py-0.5",
              code.level === "main" && "code-chip-main",
              code.level === "child" && "code-chip-child",
              code.level === "subchild" && "code-chip-subchild"
            )}
          >
            {code.level}
          </span>

          {/* Frequency */}
          <span className="text-xs text-muted-foreground tabular-nums">
            {getCodeExcerptCount(code.id, excerpts)}
          </span>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setNewCodeName(code.name);
                  setRenameDialog({ open: true, code });
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              {code.level !== "subchild" && (
                <DropdownMenuItem
                  onClick={() => {
                    const childLevel =
                      code.level === "main" ? "child" : "subchild";
                    setNewCodeDialog({
                      open: true,
                      parentId: code.id,
                      level: childLevel,
                    });
                  }}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Add Child
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setMergeDialog({ open: true, sourceCode: code })}
              >
                <GitMerge className="h-4 w-4 mr-2" />
                Merge Into...
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => deleteCode(code.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-2 border-l border-border">
            {children.map((child) => renderCodeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Code Manager
          </h2>
          <p className="text-sm text-muted-foreground">
            {codes.length} codes across {mainCodes.length} categories
          </p>
        </div>
        <Button
          onClick={() => setNewCodeDialog({ open: true, level: "main" })}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Code
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search codes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Codes List */}
      <div className="flex-1 overflow-auto scrollbar-thin bg-card rounded-lg border border-border p-2">
        {filteredCodes.length > 0 ? (
          filteredCodes.map((code) => renderCodeItem(code))
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-muted-foreground text-sm">
              {search ? "No codes match your search" : "No codes created yet"}
            </p>
            {!search && (
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setNewCodeDialog({ open: true, level: "main" })}
              >
                Create your first code
              </Button>
            )}
          </div>
        )}
      </div>

      {/* New Code Dialog */}
      <Dialog
        open={newCodeDialog.open}
        onOpenChange={(open) => setNewCodeDialog({ ...newCodeDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create{" "}
              {newCodeDialog.level === "main"
                ? "New Code"
                : `${newCodeDialog.level} Code`}
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Code name..."
            value={newCodeName}
            onChange={(e) => setNewCodeName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateCode()}
          />
          {checkDuplicateCodeName(newCodeName) && (
            <p className="text-sm text-destructive">
              A code with this name already exists
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewCodeDialog({ open: false, level: "main" })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCode}
              disabled={
                !newCodeName.trim() || checkDuplicateCodeName(newCodeName)
              }
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            value={newCodeName}
            onChange={(e) => setNewCodeName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
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
                    }
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: code.color }}
                  />
                  <span className="text-sm">{code.name}</span>
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
