import { useState, useEffect } from 'react';
import { useQDAStore } from '@/store/qdaStore';
import { Settings, Sparkles, Beaker, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export function WorkspaceSettings() {
  const { toast } = useToast();
  const {
    getActiveWorkspace,
    updateWorkspaceResearchSettings,
    startSession,
  } = useQDAStore();

  const workspace = getActiveWorkspace();
  const [open, setOpen] = useState(false);
  const [researchMode, setResearchMode] = useState(workspace?.researchMode || false);
  const [aiEnabled, setAiEnabled] = useState(workspace?.aiEnabled || false);
  const [participantId, setParticipantId] = useState(workspace?.participantId || '');
  const [urlConfigured, setUrlConfigured] = useState(false);

  // Check if settings came from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasUrlConfig = urlParams.has("participantId") || urlParams.has("aiEnabled");
    setUrlConfigured(hasUrlConfig);
  }, []);

  if (!workspace) return null;

  const handleSave = () => {
    updateWorkspaceResearchSettings({
      researchMode,
      aiEnabled,
      participantId: participantId.trim() || undefined,
    });

    // Start analytics session if research mode is enabled
    if (researchMode && !workspace.researchMode) {
      startSession();
    }

    toast({
      title: 'Settings saved',
      description: researchMode 
        ? 'Research mode enabled. Analytics tracking is now active.'
        : 'Workspace settings updated.',
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Workspace Settings</DialogTitle>
          <DialogDescription>
            Configure research mode and AI assistance for this workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* URL Configuration Notice */}
          {urlConfigured && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Settings were auto-configured via URL parameters for this research session.
              </AlertDescription>
            </Alert>
          )}

          {/* Research Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="research-mode" className="flex items-center gap-2">
                  <Beaker className="h-4 w-4" />
                  Research Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable analytics tracking for research studies
                </p>
              </div>
              <Switch
                id="research-mode"
                checked={researchMode}
                onCheckedChange={(checked) => {
                  setResearchMode(checked);
                  if (!checked) {
                    setParticipantId('');
                  }
                }}
              />
            </div>

            {researchMode && (
              <div className="space-y-2 pl-6 border-l-2 border-accent">
                <Label htmlFor="participant-id">Participant ID</Label>
                <Input
                  id="participant-id"
                  placeholder="e.g., P001, Participant-A"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used for tracking and data export
                </p>
              </div>
            )}
          </div>

          {/* AI Enabled */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-enabled" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Assistance
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable AI-powered code suggestions
              </p>
            </div>
            <Switch
              id="ai-enabled"
              checked={aiEnabled}
              onCheckedChange={setAiEnabled}
            />
          </div>

          {/* Info Box */}
          {researchMode && (
            <div className="rounded-lg border border-accent bg-accent/10 p-4">
              <h4 className="font-medium text-sm mb-2">Research Mode Active</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• All actions will be logged with timestamps</li>
                <li>• AI suggestion interactions tracked</li>
                <li>• Export data from Analytics view</li>
                <li>• Session timing recorded automatically</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
