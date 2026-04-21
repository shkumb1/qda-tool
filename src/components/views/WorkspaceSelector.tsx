import { useState, useEffect, useRef } from "react";
import { useQDAStore } from "@/store/qdaStore";
import { useHelpStore } from "@/store/helpStore";
import {
  Users,
  Plus,
  LogIn,
  BookOpen,
  Copy,
  Check,
  Trash2,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export function WorkspaceSelector() {
  const {
    workspaces,
    studies,
    setActiveWorkspace,
    createWorkspace,
    joinWorkspace,
    importWorkspaceData,
    exportWorkspaceData,
    clearLegacyStudies,
  } = useQDAStore();
  const { setShowOnboarding } = useHelpStore();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [showLegacyAlert, setShowLegacyAlert] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [collaboratorName, setCollaboratorName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [workspaceFile, setWorkspaceFile] = useState<File | null>(null);

  // Check for legacy studies (studies not in any workspace)
  useEffect(() => {
    const allWorkspaceStudyIds = new Set(workspaces.flatMap((w) => w.studyIds));
    const legacyStudies = studies.filter(
      (s) => !allWorkspaceStudyIds.has(s.id)
    );
    if (legacyStudies.length > 0 && workspaces.length > 0) {
      setShowLegacyAlert(true);
    }
  }, [workspaces, studies]);

  const handleCreateWorkspace = () => {
    if (!workspaceName.trim() || !collaboratorName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both workspace name and your name.",
        variant: "destructive",
      });
      return;
    }

    const workspace = createWorkspace(workspaceName, collaboratorName);
    setCreateDialogOpen(false);
    setWorkspaceName("");
    setCollaboratorName("");

    // Trigger onboarding tour for new workspace
    setTimeout(() => {
      setShowOnboarding(true);
    }, 500);

    toast({
      title: "Workspace created!",
      description: (
        <div className="space-y-2">
          <p>Share this code with collaborators:</p>
          <div className="flex items-center gap-2">
            <code className="text-lg font-mono font-bold bg-background px-3 py-1 rounded">
              {workspace.code}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(workspace.code);
                toast({ title: "Code copied!" });
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ),
      duration: 10000,
    });
  };

  const handleJoinWorkspace = async () => {
    if (!collaboratorName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide your name.",
        variant: "destructive",
      });
      return;
    }

    // Try importing from file first if provided
    if (workspaceFile) {
      try {
        const fileContent = await workspaceFile.text();
        const workspace = importWorkspaceData(fileContent, collaboratorName);
        
        if (!workspace) {
          toast({
            title: "Import failed",
            description: "Invalid workspace file. Please check the file and try again.",
            variant: "destructive",
          });
          return;
        }

        setJoinDialogOpen(false);
        setJoinCode("");
        setCollaboratorName("");
        setWorkspaceFile(null);
        
        toast({
          title: "Joined workspace!",
          description: `Welcome to "${workspace.name}"`,
        });
        return;
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to read workspace file.",
          variant: "destructive",
        });
        return;
      }
    }

    // Fallback to code-based join (only works locally)
    if (!joinCode.trim()) {
      toast({
        title: "Missing information",
        description: "Please upload a workspace file or enter a workspace code.",
        variant: "destructive",
      });
      return;
    }

    const workspace = joinWorkspace(joinCode, collaboratorName);
    if (!workspace) {
      toast({
        title: "Workspace not found",
        description: "Workspace code not found locally. Ask your collaborator to share the workspace file instead.",
        variant: "destructive",
      });
      return;
    }

    setJoinDialogOpen(false);
    setJoinCode("");
    setCollaboratorName("");
    toast({
      title: "Joined workspace!",
      description: `Welcome to "${workspace.name}"`,
    });
  };

  const handleExportWorkspace = (workspaceId: string, workspaceName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Set active workspace temporarily to export it
    const currentActive = useQDAStore.getState().activeWorkspaceId;
    setActiveWorkspace(workspaceId);
    
    const data = exportWorkspaceData();
    
    // Restore previous active workspace
    setActiveWorkspace(currentActive);
    
    if (!data) {
      toast({
        title: "Export failed",
        description: "Failed to export workspace data.",
        variant: "destructive",
      });
      return;
    }

    // Download as JSON file
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workspace-${workspaceName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Workspace exported!",
      description: "Share this file with collaborators to let them join.",
      duration: 5000,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setWorkspaceFile(file);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: "Code copied to clipboard!" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold">ThematicFlow</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Collaborative Qualitative Data Analysis
          </p>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Create Workspace */}
          <Card
            className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary"
            onClick={() => setCreateDialogOpen(true)}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Create Workspace</h3>
                <p className="text-sm text-muted-foreground">
                  Start a new collaborative research project and invite team
                  members
                </p>
              </div>
            </div>
          </Card>

          {/* Join Workspace */}
          <Card
            className="p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary"
            onClick={() => setJoinDialogOpen(true)}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <LogIn className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Join Workspace</h3>
                <p className="text-sm text-muted-foreground">
                  Enter a workspace code to join an existing research team
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Existing Workspaces */}
        {workspaces.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recent Workspaces</h2>
            <div className="grid gap-4">
              {workspaces.map((workspace) => (
                <Card
                  key={workspace.id}
                  className="p-6 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary"
                  onClick={() => setActiveWorkspace(workspace.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {workspace.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>
                            {workspace.studyIds.length}{" "}
                            {workspace.studyIds.length === 1
                              ? "study"
                              : "studies"}
                          </span>
                          <span>•</span>
                          <span>
                            {workspace.collaborators.length}{" "}
                            {workspace.collaborators.length === 1
                              ? "collaborator"
                              : "collaborators"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Collaborators */}
                      <div className="flex -space-x-2">
                        {workspace.collaborators.slice(0, 3).map((collab) => (
                          <Avatar
                            key={collab.id}
                            className="h-8 w-8 border-2 border-background"
                            style={{ backgroundColor: collab.color }}
                          >
                            <AvatarFallback
                              style={{
                                backgroundColor: collab.color,
                                color: "white",
                              }}
                            >
                              {collab.initials}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {workspace.collaborators.length > 3 && (
                          <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                            +{workspace.collaborators.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Share Code */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(workspace.code);
                        }}
                      >
                        {copiedCode === workspace.code ? (
                          <>
                            <Check className="h-4 w-4 mr-2" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" /> {workspace.code}
                          </>
                        )}
                      </Button>

                      {/* Export Workspace */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleExportWorkspace(workspace.id, workspace.name, e)}
                        title="Export workspace to share with collaborators"
                      >
                        <Download className="h-4 w-4 mr-2" /> Share
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
              <DialogDescription>
                Set up a new collaborative research environment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  placeholder="e.g., Remote Work Study 2026"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleCreateWorkspace()
                  }
                />
              </div>
              <div>
                <Label htmlFor="your-name">Your Name</Label>
                <Input
                  id="your-name"
                  placeholder="e.g., Dr. Sarah Smith"
                  value={collaboratorName}
                  onChange={(e) => setCollaboratorName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleCreateWorkspace()
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateWorkspace}>Create Workspace</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Join Dialog */}
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Workspace</DialogTitle>
              <DialogDescription>
                Upload the workspace file shared by your team or enter the workspace code (code only works locally)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="your-name-join">Your Name</Label>
                <Input
                  id="your-name-join"
                  placeholder="e.g., Dr. Sarah Smith"
                  value={collaboratorName}
                  onChange={(e) => setCollaboratorName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinWorkspace()}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Recommended Method
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="workspace-file">Upload Workspace File</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    id="workspace-file"
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {workspaceFile ? workspaceFile.name : "Choose workspace file..."}
                  </Button>
                  {workspaceFile && (
                    <p className="text-xs text-muted-foreground mt-2">
                      File selected: {workspaceFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or (Local Only)
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="join-code">Workspace Code</Label>
                <Input
                  id="join-code"
                  placeholder="e.g., ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinWorkspace()}
                  className="font-mono text-lg uppercase"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Code only works if workspace was created on this device
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setJoinDialogOpen(false);
                  setWorkspaceFile(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleJoinWorkspace}>Join Workspace</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Legacy Studies Alert */}
        <AlertDialog open={showLegacyAlert} onOpenChange={setShowLegacyAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Legacy Studies Detected</AlertDialogTitle>
              <AlertDialogDescription>
                You have{" "}
                {
                  studies.filter(
                    (s) => !workspaces.flatMap((w) => w.studyIds).includes(s.id)
                  ).length
                }{" "}
                studies from before workspaces were created. These studies
                aren't associated with any workspace.
                <br />
                <br />
                Would you like to clean them up? This will permanently delete
                studies that aren't in any workspace.
                <br />
                <br />
                <strong>Note:</strong> Your current workspaces and their studies
                will not be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Legacy Studies</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  clearLegacyStudies();
                  toast({
                    title: "Legacy studies cleaned",
                    description: "Unassociated studies have been removed.",
                  });
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clean Up Legacy Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
