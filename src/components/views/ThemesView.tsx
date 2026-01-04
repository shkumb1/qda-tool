import { useState } from 'react';
import { useQDAStore } from '@/store/qdaStore';
import { suggestThemes, type AIThemeSuggestion } from '@/services/aiService';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Theme, Code } from '@/types/qda';

const THEME_COLORS = [
  '#ec4899', '#8b5cf6', '#0ea5e9', '#22c55e', '#f97316',
  '#ef4444', '#06b6d4', '#84cc16', '#f59e0b', '#6366f1',
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
  } = useQDAStore();

  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());
  const [newThemeDialog, setNewThemeDialog] = useState(false);
  const [editThemeDialog, setEditThemeDialog] = useState<{ open: boolean; theme: Theme | null }>({
    open: false,
    theme: null,
  });
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [themeColor, setThemeColor] = useState(THEME_COLORS[0]);
  const [themeMemo, setThemeMemo] = useState('');
  const [draggedCode, setDraggedCode] = useState<Code | null>(null);
  const [dropTargetTheme, setDropTargetTheme] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AIThemeSuggestion[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // Codes not assigned to any theme
  const unassignedCodes = codes.filter(
    (code) => !themes.some((theme) => theme.codeIds.includes(code.id))
  );

  const toggleExpand = (themeId: string) => {
    const newExpanded = new Set(expandedThemes);
    if (newExpanded.has(themeId)) {
      newExpanded.delete(themeId);
    } else {
      newExpanded.add(themeId);
    }
    setExpandedThemes(newExpanded);
  };

  const handleGetAISuggestions = async () => {
    setLoadingAI(true);
    try {
      const suggestions = await suggestThemes(
        codes.map((c) => ({ name: c.name, frequency: c.frequency }))
      );
      setAiSuggestions(suggestions);
      setAiPanelOpen(true);
    } catch (error) {
      toast({
        title: 'AI Error',
        description: 'Failed to get theme suggestions.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const handleApplyThemeSuggestion = (suggestion: AIThemeSuggestion) => {
    // Create the theme
    const newTheme = addTheme(
      suggestion.name,
      THEME_COLORS[themes.length % THEME_COLORS.length]
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
      title: 'Theme created',
      description: `"${suggestion.name}" with ${suggestion.suggestedCodes.length} codes`,
    });
  };

  const handleCreateTheme = () => {
    if (!themeName.trim()) return;
    const newTheme = addTheme(themeName, themeColor);
    if (themeDescription) {
      updateTheme(newTheme.id, { description: themeDescription });
    }
    setThemeName('');
    setThemeDescription('');
    setThemeColor(THEME_COLORS[themes.length % THEME_COLORS.length]);
    setNewThemeDialog(false);
    toast({ title: 'Theme created' });
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
    toast({ title: 'Theme updated' });
  };

  const handleDragStart = (code: Code) => {
    setDraggedCode(code);
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

    const sourceTheme = themes.find((t) => t.codeIds.includes(draggedCode.id));
    
    if (sourceTheme) {
      moveCodeBetweenThemes(draggedCode.id, sourceTheme.id, targetThemeId);
    } else {
      addCodeToTheme(targetThemeId, draggedCode.id);
    }

    setDraggedCode(null);
    setDropTargetTheme(null);
    toast({ title: 'Code added to theme' });
  };

  const renderThemeCard = (theme: Theme) => {
    const themeCodes = codes.filter((c) => theme.codeIds.includes(c.id));
    const isExpanded = expandedThemes.has(theme.id);
    const isDropTarget = dropTargetTheme === theme.id;

    return (
      <div
        key={theme.id}
        className={cn(
          'rounded-lg border bg-card transition-all',
          isDropTarget ? 'border-accent border-2 shadow-lg' : 'border-border'
        )}
        onDragOver={(e) => handleDragOver(e, theme.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, theme.id)}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => toggleExpand(theme.id)}
        >
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
            <h3 className="font-semibold text-foreground truncate">{theme.name}</h3>
            {theme.description && (
              <p className="text-xs text-muted-foreground truncate">{theme.description}</p>
            )}
          </div>

          <span className="text-sm text-muted-foreground">
            {themeCodes.length} codes
          </span>

          {/* Actions */}
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setThemeName(theme.name);
                    setThemeDescription(theme.description || '');
                    setThemeColor(theme.color);
                    setThemeMemo(theme.memo || '');
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
                    toast({ title: 'Theme deleted' });
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
                {themeCodes.map((code) => (
                  <Tooltip key={code.id}>
                    <TooltipTrigger asChild>
                      <div
                        draggable
                        onDragStart={() => handleDragStart(code)}
                        className={cn(
                          'group flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/50 cursor-grab active:cursor-grabbing',
                          code.level === 'main' && 'border-l-2 border-code-main',
                          code.level === 'child' && 'border-l-2 border-code-child',
                          code.level === 'subchild' && 'border-l-2 border-code-subchild'
                        )}
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{code.name}</span>
                        <span className="text-xs text-muted-foreground">({code.frequency})</span>
                        <button
                          className="opacity-0 group-hover:opacity-100 ml-1 text-destructive hover:text-destructive/80 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCodeFromTheme(theme.id, code.id);
                            toast({ title: 'Code removed from theme' });
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{code.frequency} excerpts in {code.documentCount} documents</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Drag codes here to add them to this theme
              </p>
            )}
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
          <h2 className="text-lg font-semibold text-foreground">Theme Builder</h2>
          <p className="text-sm text-muted-foreground">
            {themes.length} themes • Drag codes to organize
          </p>
        </div>
        <div className="flex gap-2">
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
                          onClick={() => handleApplyThemeSuggestion(suggestion)}
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
                      ? 'Analyzing your codes...'
                      : 'Click "AI Suggest" to get theme ideas'}
                  </p>
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Button onClick={() => setNewThemeDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Theme
          </Button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Themes List */}
        <div className="flex-1 overflow-auto scrollbar-thin space-y-3">
          {themes.map(renderThemeCard)}

          {themes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-center bg-card rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground mb-2">No themes yet</p>
              <Button variant="link" onClick={() => setNewThemeDialog(true)}>
                Create your first theme
              </Button>
            </div>
          )}
        </div>

        {/* Unassigned Codes */}
        <div className="w-64 flex-shrink-0 bg-card rounded-lg border border-border p-4 overflow-auto scrollbar-thin">
          <h3 className="font-semibold text-sm text-foreground mb-3">
            Unassigned Codes ({unassignedCodes.length})
          </h3>
          <div className="space-y-1.5">
            {unassignedCodes.map((code) => (
              <Tooltip key={code.id}>
                <TooltipTrigger asChild>
                  <div
                    draggable
                    onDragStart={() => handleDragStart(code)}
                    className={cn(
                      'flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/50 cursor-grab active:cursor-grabbing hover:bg-muted transition-colors',
                      code.level === 'main' && 'border-l-2 border-code-main',
                      code.level === 'child' && 'border-l-2 border-code-child',
                      code.level === 'subchild' && 'border-l-2 border-code-subchild'
                    )}
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm truncate">{code.name}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{code.name}</p>
                  <p className="text-xs">{code.frequency} excerpts • {code.documentCount} docs</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {unassignedCodes.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                All codes are assigned to themes
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
              <label className="text-sm font-medium mb-1.5 block">Description</label>
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
                          'w-8 h-8 rounded-full transition-all',
                          themeColor === color && 'ring-2 ring-offset-2 ring-accent'
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
        onOpenChange={(open) => setEditThemeDialog({ ...editThemeDialog, open })}
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
              <label className="text-sm font-medium mb-1.5 block">Description</label>
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
                      'w-8 h-8 rounded-full transition-all',
                      themeColor === color && 'ring-2 ring-offset-2 ring-accent'
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
    </div>
  );
}
