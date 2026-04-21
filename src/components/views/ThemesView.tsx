import { useState, useEffect, useMemo, useRef } from "react";
import { useQDAStore } from "@/store/qdaStore";
import { suggestThemes, type AIThemeSuggestion } from "@/services/aiService";
import {
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  MessageSquare,
  Sparkles,
  Loader2,
  Lightbulb,
  Copy,
  MoreVertical,
  Check,
  MoveDown,
  MoveUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Theme, Code } from "@/types/qda";

const THEME_COLORS = [
  "#ec4899",
  "#8b5cf6",
  "#0ea5e9",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f59e0b",
  "#6366f1",
];

export function ThemesView() {
  const { toast } = useToast();
  const {
    themes,
    codes,
    addTheme,
    updateTheme,
    deleteTheme,
    addCodeToTheme,
    removeCodeFromTheme,
    moveCodeBetweenThemes,
    getActiveWorkspace,
  } = useQDAStore();

  const workspace = getActiveWorkspace();
  const aiEnabled = workspace?.aiEnabled ?? true;

  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());
  const [newThemeDialog, setNewThemeDialog] = useState(false);
  const [editThemeDialog, setEditThemeDialog] = useState<{
    open: boolean;
    theme: Theme | null;
  }>({
    open: false,
    theme: null,
  });
  const [themeName, setThemeName] = useState("");
  const [themeDescription, setThemeDescription] = useState("");
  const [themeColor, setThemeColor] = useState(THEME_COLORS[0]);
  const [themeMemo, setThemeMemo] = useState("");
  const [draggedCode, setDraggedCode] = useState<Code | null>(null);
  const [dragSourceThemeId, setDragSourceThemeId] = useState<string | null>(
    null,
  ); // null = from sidebar
  const [dropTargetTheme, setDropTargetTheme] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    code: Code;
  } | null>(null);
  // Track which code+theme pairs came from dragging (not copying)
  // Key format: "codeId::themeId"
  const [draggedAssignments, setDraggedAssignments] = useState<Set<string>>(
    new Set(),
  );
  const [aiSuggestions, setAiSuggestions] = useState<AIThemeSuggestion[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [addSubThemeDialog, setAddSubThemeDialog] = useState<{
    open: boolean;
    parentTheme: Theme | null;
  }>({ open: false, parentTheme: null });
  const [themeSearchQuery, setThemeSearchQuery] = useState("");
  const themeSearchInputRef = useRef<HTMLInputElement>(null);

  // Theme dragging state (separate from code dragging)
  const [draggedTheme, setDraggedTheme] = useState<Theme | null>(null);
  const [themeDropTarget, setThemeDropTarget] = useState<{
    themeId: string;
    action: "nest" | "main";
  } | null>(null);

  // Show all codes in sidebar except ones that have ANY drag-based assignments
  // (codes that were right-click copied to themes still appear here)
  const sidebarCodes = codes.filter((code) => {
    // Check if this code has any drag-based assignments to any theme
    const hasDragAssignment = themes.some((theme) =>
      draggedAssignments.has(`${code.id}::${theme.id}`),
    );
    return !hasDragAssignment;
  });

  // Filter themes by search query (for context menu)
  const filteredThemes = useMemo(() => {
    if (!themeSearchQuery.trim()) return themes;

    const query = themeSearchQuery.toLowerCase();
    return themes.filter((theme) => theme.name.toLowerCase().includes(query));
  }, [themes, themeSearchQuery]);

  // Get main themes (no parent)
  const mainThemes = themes.filter((t) => !t.parentId);

  // Get child themes of a parent
  const getChildThemes = (parentId: string) => {
    return themes.filter((t) => t.parentId === parentId);
  };

  const toggleExpand = (themeId: string) => {
    const newExpanded = new Set(expandedThemes);
    if (newExpanded.has(themeId)) {
      newExpanded.delete(themeId);
    } else {
      newExpanded.add(themeId);
    }
    setExpandedThemes(newExpanded);
  };

  // Close context menu on click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      // Auto-focus search input and clear previous search
      setThemeSearchQuery("");
      setTimeout(() => {
        themeSearchInputRef.current?.focus();
      }, 0);
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  const handleCopyToTheme = (code: Code, themeId: string) => {
    // Copy: just add to theme, code stays in sidebar
    addCodeToTheme(themeId, code.id);
    toast({
      title: "Code copied to theme",
      description: `"${code.name}" can still be copied to other themes`,
      duration: 2000,
    });
    setContextMenu(null);
  };

  const handleGetAISuggestions = async () => {
    setLoadingAI(true);
    try {
      const suggestions = await suggestThemes(
        codes.map((c) => ({ name: c.name, frequency: c.frequency })),
      );
      setAiSuggestions(suggestions);
      setAiPanelOpen(true);
    } catch (error) {
      toast({
        title: "AI Error",
        description: "Failed to get theme suggestions.",
        variant: "destructive",
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const handleApplyThemeSuggestion = (suggestion: AIThemeSuggestion) => {
    // Create the theme
    const newTheme = addTheme(
      suggestion.name,
      THEME_COLORS[themes.length % THEME_COLORS.length],
    );
    updateTheme(newTheme.id, { description: suggestion.description });

    // Add suggested codes to theme
    suggestion.suggestedCodes.forEach((codeName) => {
      const code = codes.find((c) => c.name === codeName);
      if (code) {
        addCodeToTheme(newTheme.id, code.id);
      }
    });

    toast({
      title: "Theme created",
      description: `"${suggestion.name}" with ${suggestion.suggestedCodes.length} codes`,
    });
  };

  const handleCreateTheme = () => {
    if (!themeName.trim()) return;
    const newTheme = addTheme(themeName, themeColor);
    if (themeDescription) {
      updateTheme(newTheme.id, { description: themeDescription });
    }
    setThemeName("");
    setThemeDescription("");
    setThemeColor(THEME_COLORS[themes.length % THEME_COLORS.length]);
    setNewThemeDialog(false);
    toast({ title: "Theme created" });
  };

  const handleCreateSubTheme = () => {
    if (!themeName.trim() || !addSubThemeDialog.parentTheme) return;

    const newTheme = addTheme(
      themeName,
      themeColor,
      addSubThemeDialog.parentTheme.id,
    );
    if (themeDescription) {
      updateTheme(newTheme.id, { description: themeDescription });
    }

    const parent = addSubThemeDialog.parentTheme;
    const levelName = parent.level === "main" ? "theme" : "sub-theme";
    toast({
      title: `${levelName} created`,
      description: `"${themeName}" added under "${parent.name}".`,
    });
    setThemeName("");
    setThemeDescription("");
    setThemeColor(THEME_COLORS[0]);
    setAddSubThemeDialog({ open: false, parentTheme: null });
  };

  const handleUpdateTheme = () => {
    if (!editThemeDialog.theme || !themeName.trim()) return;
    updateTheme(editThemeDialog.theme.id, {
      name: themeName,
      description: themeDescription,
      color: themeColor,
      memo: themeMemo,
    });
    setEditThemeDialog({ open: false, theme: null });
    toast({ title: "Theme updated" });
  };

  const handleDragStart = (code: Code, sourceThemeId: string | null = null) => {
    console.log("[DRAG START]", {
      code: code.name,
      sourceThemeId: sourceThemeId || "SIDEBAR",
    });
    setDraggedCode(code);
    setDragSourceThemeId(sourceThemeId); // null means dragging from sidebar
  };

  const handleDragOver = (e: React.DragEvent, themeId: string) => {
    e.preventDefault();
    setDropTargetTheme(themeId);
  };

  const handleDragLeave = () => {
    setDropTargetTheme(null);
  };

  const handleDrop = (e: React.DragEvent, targetThemeId: string) => {
    e.preventDefault();
    if (!draggedCode) return;

    console.log("[DRAG DROP]", {
      code: draggedCode.name,
      sourceThemeId: dragSourceThemeId || "SIDEBAR",
      targetThemeId,
    });

    if (dragSourceThemeId !== null && dragSourceThemeId !== undefined) {
      // Dragging FROM a theme TO another theme = MOVE
      console.log("→ Moving code between themes");
      moveCodeBetweenThemes(draggedCode.id, dragSourceThemeId, targetThemeId);
      // Update dragged assignment tracking: remove old, add new
      setDraggedAssignments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`${draggedCode.id}::${dragSourceThemeId}`);
        newSet.add(`${draggedCode.id}::${targetThemeId}`);
        return newSet;
      });
      toast({ title: "Code moved between themes", duration: 2000 });
    } else {
      // Dragging FROM sidebar = just ADD (don't remove from anywhere)
      console.log("→ Adding code from sidebar to theme");
      addCodeToTheme(targetThemeId, draggedCode.id);
      // Mark this specific code+theme pair as a dragged assignment
      setDraggedAssignments((prev) =>
        new Set(prev).add(`${draggedCode.id}::${targetThemeId}`),
      );
      toast({ title: "Code added to theme", duration: 2000 });
    }

    setDraggedCode(null);
    setDragSourceThemeId(null);
    setDropTargetTheme(null);
  };

  const getCodeThemes = (codeId: string) => {
    return themes.filter((t) => t.codeIds.includes(codeId));
  };

  const toggleCodeInTheme = (codeId: string, themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (!theme) return;

    if (theme.codeIds.includes(codeId)) {
      // Check if code exists in other themes BEFORE removing
      const otherThemesWithCode = themes.filter(
        (t) => t.id !== themeId && t.codeIds.includes(codeId),
      );
      const isInOtherThemes = otherThemesWithCode.length > 0;

      // Check if this specific code+theme assignment came from dragging
      const wasDragged = draggedAssignments.has(`${codeId}::${themeId}`);

      console.log("[TOGGLE REMOVE]", {
        code: codeId,
        fromTheme: themeId,
        wasDragged,
        inOtherThemes: isInOtherThemes,
        otherThemes: otherThemesWithCode.map((t) => t.name),
      });

      removeCodeFromTheme(themeId, codeId);

      if (wasDragged) {
        // Remove this drag assignment
        setDraggedAssignments((prev) => {
          const newSet = new Set(prev);
          newSet.delete(`${codeId}::${themeId}`);

          // Check if code has any OTHER drag assignments
          const hasOtherDragAssignments = themes.some(
            (t) => t.id !== themeId && newSet.has(`${codeId}::${t.id}`),
          );

          console.log("→ Drag assignment removed", {
            hasOtherDragAssignments,
            willReturnToSidebar: !hasOtherDragAssignments,
          });

          return newSet;
        });
      }

      toast({ title: "Code removed from theme", duration: 2000 });
    } else {
      addCodeToTheme(themeId, codeId);
      toast({ title: "Code added to theme", duration: 2000 });
    }
  };

  // Theme dragging handlers
  const handleThemeDragStart = (theme: Theme) => {
    setDraggedTheme(theme);
    console.log("[THEME DRAG START]", {
      theme: theme.name,
      level: theme.level,
    });
  };

  const handleThemeDragOver = (
    e: React.DragEvent,
    targetTheme: Theme,
    area: "header" | "main-area",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTheme) return;

    // Prevent dropping on itself
    if (draggedTheme.id === targetTheme.id) return;

    // Prevent circular nesting (can't nest parent under its own child/grandchild)
    const isDescendant = (
      potentialParent: Theme,
      potentialChild: Theme,
    ): boolean => {
      if (potentialParent.parentId === potentialChild.id) return true;
      const parent = themes.find((t) => t.id === potentialParent.parentId);
      return parent ? isDescendant(parent, potentialChild) : false;
    };

    if (isDescendant(targetTheme, draggedTheme)) {
      console.log("⚠️ Cannot nest parent under child");
      return;
    }

    // Determine action based on target and area
    if (area === "header") {
      // Dropping ON a theme header = nest as subtheme
      if (targetTheme.level === "subtheme") {
        // Can't nest under subtheme (max 3 levels)
        return;
      }
      setThemeDropTarget({ themeId: targetTheme.id, action: "nest" });
    } else {
      // Dropping in main area = make main theme
      setThemeDropTarget({ themeId: "main-area", action: "main" });
    }
  };

  const handleThemeDragLeave = () => {
    setThemeDropTarget(null);
  };

  const handleThemeDrop = (e: React.DragEvent, targetTheme?: Theme) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTheme || !themeDropTarget) return;

    if (themeDropTarget.action === "nest" && targetTheme) {
      // Nest under target theme
      const newLevel: Theme["level"] =
        targetTheme.level === "main" ? "theme" : "subtheme";

      updateTheme(draggedTheme.id, {
        parentId: targetTheme.id,
        level: newLevel,
      });

      console.log("[THEME NESTED]", {
        theme: draggedTheme.name,
        under: targetTheme.name,
        newLevel,
      });

      toast({
        title: "Theme reorganized",
        description: `"${draggedTheme.name}" is now under "${targetTheme.name}"`,
        duration: 2000,
      });
    } else if (themeDropTarget.action === "main") {
      // Make it a main theme
      updateTheme(draggedTheme.id, {
        parentId: null,
        level: "main",
      });

      console.log("[THEME TO MAIN]", { theme: draggedTheme.name });

      toast({
        title: "Theme promoted",
        description: `"${draggedTheme.name}" is now a main theme`,
        duration: 2000,
      });
    }

    setDraggedTheme(null);
    setThemeDropTarget(null);
  };

  const renderThemeCard = (theme: Theme, depth: number = 0) => {
    const themeCodes = codes.filter((c) => theme.codeIds.includes(c.id));
    const childThemes = getChildThemes(theme.id);
    const isExpanded = expandedThemes.has(theme.id);
    const isCodeDropTarget = dropTargetTheme === theme.id; // For code drops
    const isThemeDropTarget = themeDropTarget?.themeId === theme.id; // For theme drops
    const canAddChild = theme.level !== "subtheme"; // Only main and theme can have children
    const isDragging = draggedTheme?.id === theme.id;

    const levelStyles = {
      main: "border-l-4 border-l-blue-500",
      theme: "border-l-4 border-l-purple-500 ml-6",
      subtheme: "border-l-4 border-l-pink-500 ml-12",
    };

    const levelLabels = {
      main: "Main Theme",
      theme: "Theme",
      subtheme: "Sub-theme",
    };

    return (
      <div key={theme.id} className="space-y-2">
        <div
          className={cn(
            "rounded-lg border bg-card transition-all relative",
            isCodeDropTarget && "border-accent border-2 shadow-lg",
            isThemeDropTarget &&
              "border-primary border-2 shadow-lg ring-2 ring-primary/20",
            isDragging && "opacity-50",
            levelStyles[theme.level],
          )}
          onDragOver={(e) => {
            // Handle both code and theme drops
            if (draggedCode) {
              handleDragOver(e, theme.id);
            } else if (draggedTheme) {
              handleThemeDragOver(e, theme, "header");
            }
          }}
          onDragLeave={() => {
            handleDragLeave();
            handleThemeDragLeave();
          }}
          onDrop={(e) => {
            if (draggedCode) {
              handleDrop(e, theme.id);
            } else if (draggedTheme) {
              handleThemeDrop(e, theme);
            }
          }}
        >
          {/* Code Drop Indicator */}
          {isCodeDropTarget && (
            <div className="absolute inset-0 bg-accent/5 rounded-lg pointer-events-none flex items-center justify-center z-10">
              <div className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Drop code to add</span>
              </div>
            </div>
          )}

          {/* Theme Drop Indicator */}
          {isThemeDropTarget && themeDropTarget?.action === "nest" && (
            <div className="absolute inset-0 bg-primary/5 rounded-lg pointer-events-none flex items-center justify-center z-10">
              <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                <MoveDown className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Nest as {theme.level === "main" ? "theme" : "sub-theme"}
                </span>
              </div>
            </div>
          )}

          {/* Header */}
          <div
            draggable
            onDragStart={() => handleThemeDragStart(theme)}
            className="flex items-center gap-3 p-4 cursor-grab active:cursor-grabbing hover:bg-muted/30 transition-colors"
            onClick={() => toggleExpand(theme.id)}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <button className="p-0.5">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: theme.color }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">
                  {theme.name}
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-medium text-muted-foreground uppercase">
                  {levelLabels[theme.level]}
                </span>
              </div>
              {theme.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {theme.description}
                </p>
              )}
            </div>

            <span className="text-sm text-muted-foreground">
              {themeCodes.length} codes
              {childThemes.length > 0 && ` • ${childThemes.length} sub`}
            </span>

            {/* Actions */}
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              {canAddChild && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setThemeName("");
                        setThemeDescription("");
                        setThemeColor(
                          THEME_COLORS[themes.length % THEME_COLORS.length],
                        );
                        setAddSubThemeDialog({
                          open: true,
                          parentTheme: theme,
                        });
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Add sub-{theme.level === "main" ? "theme" : "theme"}
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setThemeName(theme.name);
                      setThemeDescription(theme.description || "");
                      setThemeColor(theme.color);
                      setThemeMemo(theme.memo || "");
                      setEditThemeDialog({ open: true, theme });
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit theme</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => {
                      deleteTheme(theme.id);
                      toast({ title: "Theme deleted" });
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete theme</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Codes */}
          {isExpanded && (
            <div className="px-4 pb-4 border-t border-border pt-3">
              {themeCodes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {themeCodes.map((code) => {
                    const codeThemes = getCodeThemes(code.id);
                    return (
                      <Tooltip key={code.id}>
                        <TooltipTrigger asChild>
                          <div
                            draggable
                            onDragStart={() => handleDragStart(code, theme.id)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                code,
                              });
                            }}
                            className={cn(
                              "group relative flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/50 cursor-grab active:cursor-grabbing hover:bg-muted transition-colors",
                              code.level === "main" &&
                                "border-l-2 border-code-main",
                              code.level === "child" &&
                                "border-l-2 border-code-child",
                              code.level === "subchild" &&
                                "border-l-2 border-code-subchild",
                            )}
                          >
                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{code.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({code.frequency})
                            </span>
                            {codeThemes.length > 1 && (
                              <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-medium">
                                {codeThemes.length} themes
                              </span>
                            )}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>
                                    Assign to Themes
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {themes.map((t) => (
                                    <DropdownMenuCheckboxItem
                                      key={t.id}
                                      checked={t.codeIds.includes(code.id)}
                                      onCheckedChange={() =>
                                        toggleCodeInTheme(code.id, t.id)
                                      }
                                    >
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: t.color }}
                                        />
                                        <span>{t.name}</span>
                                      </div>
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <button
                                className="text-destructive hover:text-destructive/80"
                                onClick={(e) => {
                                  e.stopPropagation();

                                  // Check if code exists in other themes BEFORE removing
                                  const otherThemesWithCode = themes.filter(
                                    (t) =>
                                      t.id !== theme.id &&
                                      t.codeIds.includes(code.id),
                                  );
                                  const isInOtherThemes =
                                    otherThemesWithCode.length > 0;

                                  // Check if this specific code+theme assignment came from dragging
                                  const wasDragged = draggedAssignments.has(
                                    `${code.id}::${theme.id}`,
                                  );

                                  console.log("[TRASH REMOVE]", {
                                    code: code.name,
                                    fromTheme: theme.name,
                                    wasDragged,
                                    inOtherThemes: isInOtherThemes,
                                    otherThemes: otherThemesWithCode.map(
                                      (t) => t.name,
                                    ),
                                  });

                                  removeCodeFromTheme(theme.id, code.id);

                                  if (wasDragged) {
                                    // Remove this drag assignment
                                    setDraggedAssignments((prev) => {
                                      const newSet = new Set(prev);
                                      newSet.delete(`${code.id}::${theme.id}`);

                                      // Check if code has any OTHER drag assignments
                                      const hasOtherDragAssignments =
                                        themes.some(
                                          (t) =>
                                            t.id !== theme.id &&
                                            newSet.has(`${code.id}::${t.id}`),
                                        );

                                      console.log("→ Drag assignment removed", {
                                        hasOtherDragAssignments,
                                        willReturnToSidebar:
                                          !hasOtherDragAssignments,
                                      });

                                      return newSet;
                                    });
                                  }

                                  toast({
                                    title: "Code removed from theme",
                                    duration: 2000,
                                  });
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div>
                            <p>
                              {code.frequency} excerpts in {code.documentCount}{" "}
                              documents
                            </p>
                            {codeThemes.length > 1 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Also in:{" "}
                                {codeThemes
                                  .filter((t) => t.id !== theme.id)
                                  .map((t) => t.name)
                                  .join(", ")}
                              </p>
                            )}
                            <p className="text-xs text-accent mt-1">
                              💡 Drag to move • Right-click to copy
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Drag or right-click codes to add them to this theme
                </p>
              )}
            </div>
          )}
        </div>

        {/* Render child themes recursively */}
        {childThemes.map((childTheme) =>
          renderThemeCard(childTheme, depth + 1),
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Theme Builder
          </h2>
          <p className="text-sm text-muted-foreground">
            {themes.length} themes • Drag to move, right-click to copy
          </p>
        </div>
        <div className="flex gap-2">
          {aiEnabled && (
            <Sheet open={aiPanelOpen} onOpenChange={setAiPanelOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleGetAISuggestions}
                  disabled={loadingAI || codes.length === 0}
                  className="gap-2"
                >
                  {loadingAI ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  AI Suggest
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-accent" />
                    AI Theme Suggestions
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
                          <h4 className="font-semibold">{suggestion.name}</h4>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApplyThemeSuggestion(suggestion)
                            }
                          >
                            Create
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {suggestion.description}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {suggestion.summary}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.suggestedCodes.map((code) => (
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
                        : 'Click "AI Suggest" to get theme ideas'}
                    </p>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}{" "}
          <Button onClick={() => setNewThemeDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Theme
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Themes List */}
        <div
          className={cn(
            "flex-1 overflow-auto scrollbar-thin space-y-3 p-2 rounded-lg transition-all",
            themeDropTarget?.action === "main" &&
              "bg-primary/5 ring-2 ring-primary/30",
          )}
          onDragOver={(e) => {
            if (draggedTheme) {
              e.preventDefault();
              handleThemeDragOver(e, draggedTheme, "main-area");
            }
          }}
          onDragLeave={handleThemeDragLeave}
          onDrop={(e) => {
            if (draggedTheme && themeDropTarget?.action === "main") {
              handleThemeDrop(e);
            }
          }}
        >
          {themeDropTarget?.action === "main" && (
            <div className="mb-3 p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5 text-center">
              <div className="flex items-center justify-center gap-2 text-primary font-medium">
                <MoveUp className="h-4 w-4" />
                <span className="text-sm">Drop here to make main theme</span>
              </div>
            </div>
          )}

          {mainThemes.map((theme) => renderThemeCard(theme))}

          {themes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center bg-card rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground mb-2">No themes yet</p>
              <Button variant="link" onClick={() => setNewThemeDialog(true)}>
                Create your first theme
              </Button>
            </div>
          )}
        </div>

        {/* Codes Palette */}
        <div className="w-64 flex-shrink-0 bg-card rounded-lg border border-border p-4 overflow-auto scrollbar-thin">
          <h3 className="font-semibold text-sm text-foreground mb-3">
            Codes ({sidebarCodes.length})
          </h3>
          <p className="text-[10px] text-muted-foreground mb-2">
            Drag to move • Right-click to copy
          </p>
          <div className="space-y-1.5">
            {sidebarCodes.map((code) => {
              const codeThemes = getCodeThemes(code.id);
              return (
                <Tooltip key={code.id}>
                  <TooltipTrigger asChild>
                    <div
                      draggable
                      onDragStart={() => handleDragStart(code, null)} // null = from sidebar
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          code,
                        });
                      }}
                      className={cn(
                        "group flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/50 cursor-grab active:cursor-grabbing hover:bg-muted transition-colors",
                        code.level === "main" && "border-l-2 border-code-main",
                        code.level === "child" &&
                          "border-l-2 border-code-child",
                        code.level === "subchild" &&
                          "border-l-2 border-code-subchild",
                      )}
                    >
                      <GripVertical className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm truncate flex-1">
                        {code.name}
                      </span>
                      {codeThemes.length > 0 && (
                        <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-medium">
                          {codeThemes.length}
                        </span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Add to Themes</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {themes.map((t) => (
                            <DropdownMenuCheckboxItem
                              key={t.id}
                              checked={t.codeIds.includes(code.id)}
                              onCheckedChange={() =>
                                toggleCodeInTheme(code.id, t.id)
                              }
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: t.color }}
                                />
                                <span>{t.name}</span>
                              </div>
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{code.name}</p>
                    <p className="text-xs">
                      {code.frequency} excerpts • {code.documentCount} docs
                    </p>
                    {codeThemes.length > 0 && (
                      <p className="text-xs text-accent mt-1">
                        In: {codeThemes.map((t) => t.name).join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 Drag to add to themes
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            {sidebarCodes.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                {codes.length === 0
                  ? "No codes created yet"
                  : "All codes organized into themes"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* New Theme Dialog */}
      <Dialog open={newThemeDialog} onOpenChange={setNewThemeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Theme</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input
                placeholder="Theme name..."
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Description
              </label>
              <Textarea
                placeholder="Optional description..."
                value={themeDescription}
                onChange={(e) => setThemeDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {THEME_COLORS.map((color) => (
                  <Tooltip key={color}>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          themeColor === color &&
                            "ring-2 ring-offset-2 ring-accent",
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => setThemeColor(color)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{color}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewThemeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTheme} disabled={!themeName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Theme Dialog */}
      <Dialog
        open={editThemeDialog.open}
        onOpenChange={(open) =>
          setEditThemeDialog({ ...editThemeDialog, open })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Theme</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input
                placeholder="Theme name..."
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Description
              </label>
              <Textarea
                placeholder="Optional description..."
                value={themeDescription}
                onChange={(e) => setThemeDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      themeColor === color &&
                        "ring-2 ring-offset-2 ring-accent",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setThemeColor(color)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                Memo
              </label>
              <Textarea
                placeholder="Add notes about this theme..."
                value={themeMemo}
                onChange={(e) => setThemeMemo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditThemeDialog({ open: false, theme: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTheme}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sub-Theme Dialog */}
      <Dialog
        open={addSubThemeDialog.open}
        onOpenChange={(open) =>
          setAddSubThemeDialog({ ...addSubThemeDialog, open })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add{" "}
              {addSubThemeDialog.parentTheme?.level === "main"
                ? "Theme"
                : "Sub-theme"}{" "}
              under "{addSubThemeDialog.parentTheme?.name}"
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input
                placeholder="Theme name..."
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Description
              </label>
              <Textarea
                placeholder="Optional description..."
                value={themeDescription}
                onChange={(e) => setThemeDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      themeColor === color &&
                        "ring-2 ring-offset-2 ring-accent",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setThemeColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setAddSubThemeDialog({ open: false, parentTheme: null })
              }
            >
              Cancel
            </Button>
            <Button onClick={handleCreateSubTheme} disabled={!themeName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-popover border border-border rounded-md shadow-lg z-50 min-w-[240px] max-w-[320px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Copy "{contextMenu.code.name}" to:
            </p>
            <Input
              ref={themeSearchInputRef}
              type="text"
              placeholder="Search themes..."
              value={themeSearchQuery}
              onChange={(e) => setThemeSearchQuery(e.target.value)}
              className="h-7 text-xs"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-auto scrollbar-thin py-1">
            {filteredThemes.length > 0 ? (
              <>
                {filteredThemes.map((theme) => {
                  const isSubtheme = !!theme.parentId;
                  return (
                    <button
                      key={theme.id}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                      style={{ paddingLeft: isSubtheme ? "2rem" : "0.75rem" }}
                      onClick={() =>
                        handleCopyToTheme(contextMenu.code, theme.id)
                      }
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: theme.color }}
                      />
                      <span className="flex-1 truncate">{theme.name}</span>
                      {theme.codeIds.includes(contextMenu.code.id) && (
                        <Check className="h-3 w-3 text-accent" />
                      )}
                    </button>
                  );
                })}
                {themeSearchQuery && (
                  <div className="px-3 py-1.5 text-xs text-muted-foreground border-t border-border">
                    {filteredThemes.length} of {themes.length} themes
                  </div>
                )}
              </>
            ) : themeSearchQuery ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-muted-foreground">
                  No themes match "{themeSearchQuery}"
                </p>
              </div>
            ) : (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-muted-foreground">
                  No themes available
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
