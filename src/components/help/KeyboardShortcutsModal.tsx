import { useHelpStore } from "@/store/helpStore";
import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  // General
  {
    keys: ["Ctrl", "K"],
    description: "Show keyboard shortcuts",
    category: "General",
  },
  {
    keys: ["Ctrl", "H"],
    description: "Open help documentation",
    category: "General",
  },
  { keys: ["Esc"], description: "Close dialog or modal", category: "General" },
  {
    keys: ["Ctrl", "B"],
    description: "Toggle right panel",
    category: "General",
  },

  // Navigation
  { keys: ["1"], description: "Go to Dashboard", category: "Navigation" },
  { keys: ["2"], description: "Go to Documents", category: "Navigation" },
  { keys: ["3"], description: "Go to Codes", category: "Navigation" },
  { keys: ["4"], description: "Go to Refiner", category: "Navigation" },
  { keys: ["5"], description: "Go to Themes", category: "Navigation" },
  { keys: ["6"], description: "Go to Visualizations", category: "Navigation" },

  // Documents
  {
    keys: ["Ctrl", "U"],
    description: "Upload document",
    category: "Documents",
  },
  {
    keys: ["Ctrl", "F"],
    description: "Search in document",
    category: "Documents",
  },

  // Coding
  {
    keys: ["Ctrl", "Shift", "C"],
    description: "Create new code",
    category: "Coding",
  },
  {
    keys: ["Ctrl", "Enter"],
    description: "Apply codes to selection",
    category: "Coding",
  },

  // Themes
  {
    keys: ["Ctrl", "Shift", "T"],
    description: "Create new theme",
    category: "Themes",
  },

  // Export
  { keys: ["Ctrl", "E"], description: "Export project", category: "Export" },
  {
    keys: ["Ctrl", "Shift", "E"],
    description: "Export CSV",
    category: "Export",
  },
];

export function KeyboardShortcutsModal() {
  const { keyboardShortcutsOpen, setKeyboardShortcutsOpen } = useHelpStore();

  const categories = Array.from(new Set(SHORTCUTS.map((s) => s.category)));

  return (
    <Dialog
      open={keyboardShortcutsOpen}
      onOpenChange={setKeyboardShortcutsOpen}
    >
      <DialogContent className="max-w-2xl h-[70vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(100%-80px)] px-6">
          <div className="space-y-6 pb-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {SHORTCUTS.filter((s) => s.category === category).map(
                    (shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIdx) => (
                            <span
                              key={keyIdx}
                              className="flex items-center gap-1"
                            >
                              {keyIdx > 0 && (
                                <span className="text-muted-foreground">+</span>
                              )}
                              <Badge
                                variant="secondary"
                                className="font-mono text-xs"
                              >
                                {key}
                              </Badge>
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pb-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> On Mac, use Cmd (⌘) instead of Ctrl
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
