import { useQDAStore } from "@/store/qdaStore";
import { useHelpStore } from "@/store/helpStore";
import {
  PanelRightClose,
  PanelRightOpen,
  Download,
  Upload,
  FileDown,
  FolderOpen,
  ChevronDown,
  HelpCircle,
  Keyboard,
  Play,
  Users,
  LogOut,
  Copy,
  Sparkles,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceSettings } from "@/components/views/WorkspaceSettings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const VIEW_TITLES = {
  dashboard: "Studies Dashboard",
  documents: "Document Viewer",
  codes: "Code Manager",
  refiner: "Code Refiner",
  themes: "Theme Builder",
  visualizations: "Visualizations",
  analytics: "Research Analytics",
};

export function TopNavigation() {
  const { toast } = useToast();
  const {
    activeView,
    activeStudyId,
    rightPanelOpen,
    currentCollaborator,
    getActiveWorkspace,
    getWorkspaceStudies,
    leaveWorkspace,
    setActiveView,
    setActiveStudy,
    setRightPanelOpen,
    exportProject,
    importProject,
    exportCSV,
  } = useQDAStore();

  const { setHelpModalOpen, setKeyboardShortcutsOpen, setShowOnboarding } =
    useHelpStore();

  const studies = getWorkspaceStudies();
  const activeStudy = studies.find((s) => s.id === activeStudyId);

  const handleExportJSON = () => {
    const json = exportProject();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qda-project-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Project exported",
      description: "Your project has been downloaded as JSON.",
    });
  };

  const handleExportCSV = () => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qda-codes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "CSV exported",
      description: "Code frequencies have been downloaded.",
    });
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        importProject(text);
        toast({
          title: "Project imported",
          description: "Your project has been restored.",
        });
      }
    };
    input.click();
  };

  const handleStudySwitch = (studyId: string) => {
    setActiveStudy(studyId);
  };

  const handleViewDashboard = () => {
    setActiveView("dashboard");
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-foreground">
          {VIEW_TITLES[activeView]}
        </h2>

        {/* Active Study Selector */}
        {activeStudy && (
          <div className="flex items-center gap-2">
            <div className="h-4 w-px bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: activeStudy.color }}
                  />
                  <span className="max-w-[200px] truncate">
                    {activeStudy.title}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[300px]">
                <DropdownMenuLabel>Switch Study</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {studies.map((study) => (
                  <DropdownMenuItem
                    key={study.id}
                    onClick={() => handleStudySwitch(study.id)}
                    className={cn(
                      "flex items-center gap-2",
                      study.id === activeStudyId && "bg-accent"
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: study.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{study.title}</p>
                      {study.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {study.description}
                        </p>
                      )}
                    </div>
                    {study.id === activeStudyId && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleViewDashboard}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  View All Studies
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2" data-tour="help">
        {/* Help Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Help
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setHelpModalOpen(true)}>
              <HelpCircle className="h-4 w-4 mr-2" />
              Help Documentation
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setKeyboardShortcutsOpen(true)}>
              <Keyboard className="h-4 w-4 mr-2" />
              Keyboard Shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowOnboarding(true)}>
              <Play className="h-4 w-4 mr-2" />
              Replay Tour
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* AI Assistant Button */}
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          AI Assist
        </Button>

        {/* Export/Import */}
        {activeStudy && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FileDown className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportJSON}>
                <Download className="h-4 w-4 mr-2" />
                Export Project (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export Codes (CSV)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Toggle Right Panel */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="text-muted-foreground hover:text-foreground"
        >
          {rightPanelOpen ? (
            <PanelRightClose className="h-5 w-5" />
          ) : (
            <PanelRightOpen className="h-5 w-5" />
          )}
        </Button>

        {/* Workspace Settings */}
        {activeStudy && <WorkspaceSettings />}

        {/* Workspace Info & Collaborators */}
        {currentCollaborator && (
          <>
            <div className="h-6 w-px bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {getActiveWorkspace()?.collaborators.length || 0}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[250px]">
                <DropdownMenuLabel>Workspace Collaborators</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {getActiveWorkspace()?.collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm"
                  >
                    <Avatar
                      className="h-6 w-6"
                      style={{ backgroundColor: collab.color }}
                    >
                      <AvatarFallback
                        style={{
                          backgroundColor: collab.color,
                          color: "white",
                          fontSize: "10px",
                        }}
                      >
                        {collab.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span>{collab.name}</span>
                    {collab.id === currentCollaborator.id && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(
                      getActiveWorkspace()?.code || ""
                    );
                    toast({ title: "Workspace code copied!" });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Workspace Code
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    leaveWorkspace();
                    toast({ title: "Left workspace" });
                  }}
                  className="text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}
