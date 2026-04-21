import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DocumentViewer } from "@/components/views/DocumentViewer";
import { CodesView } from "@/components/views/CodesView";
import { RefinerView } from "@/components/views/RefinerView";
import { ThemesView } from "@/components/views/ThemesView";
import { VisualizationsView } from "@/components/views/VisualizationsView";
import { IntelligenceLibrary } from "@/components/views/IntelligenceLibrary";
import { AnalyticsView } from "@/components/views/AnalyticsView";
import { StudiesDashboard } from "@/components/views/StudiesDashboard";
import { WelcomeView } from "@/components/views/WelcomeView";
import { WorkspaceSelector } from "@/components/views/WorkspaceSelector";
import { useQDAStore } from "@/store/qdaStore";
import { useHelpStore } from "@/store/helpStore";
import { useToast } from "@/hooks/use-toast";
import { checkAndClearForParticipant } from "@/utils/clearStorage";

const Index = () => {
  const { toast } = useToast();
  const {
    activeView,
    activeStudyId,
    activeWorkspaceId,
    getWorkspaceStudies,
    getActiveWorkspace,
    setActiveView,
    setRightPanelOpen,
    updateWorkspaceResearchSettings,
    startSession,
  } = useQDAStore();
  const { setHelpModalOpen, setKeyboardShortcutsOpen } = useHelpStore();

  const workspaceStudies = getWorkspaceStudies();

  const isParticipantMode = new URLSearchParams(window.location.search).has(
    "participantId",
  );

  useEffect(() => {
    checkAndClearForParticipant();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const participantId = urlParams.get("participantId");
    const aiEnabled = urlParams.get("aiEnabled");

    if (activeWorkspaceId) {
      const workspace = getActiveWorkspace();

      // If NO URL parameters present, clear research mode settings
      if (!participantId && aiEnabled === null) {
        if (workspace?.researchMode) {
          updateWorkspaceResearchSettings({
            researchMode: false,
            participantId: undefined,
            aiEnabled: true,
          });
        }
        return;
      }

      // Only auto-configure if we have URL params
      if (participantId || aiEnabled !== null) {
        const alreadyConfigured =
          workspace?.researchMode &&
          workspace?.participantId === participantId &&
          (aiEnabled === null ||
            workspace?.aiEnabled === (aiEnabled === "true"));

        if (!alreadyConfigured) {
          const settings: any = {};

          if (participantId) {
            settings.researchMode = true;
            settings.participantId = participantId;
          }

          if (aiEnabled !== null) {
            settings.aiEnabled = aiEnabled === "true";
          }

          updateWorkspaceResearchSettings(settings);

          if (participantId && !workspace?.researchMode) {
            startSession();
          }
        }
      }
    }
  }, [
    activeWorkspaceId,
    getActiveWorkspace,
    updateWorkspaceResearchSettings,
    startSession,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "h") {
        e.preventDefault();
        setHelpModalOpen(true);
        return;
      }

      if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        setKeyboardShortcutsOpen(true);
        return;
      }

      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        setRightPanelOpen((prev) => !prev);
        return;
      }

      if (!["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        if (e.key === "1") setActiveView("dashboard");
        if (e.key === "2") setActiveView("documents");
        if (e.key === "3") setActiveView("codes");
        if (e.key === "4") setActiveView("refiner");
        if (e.key === "5") setActiveView("themes");
        if (e.key === "6") setActiveView("visualizations");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    setActiveView,
    setHelpModalOpen,
    setKeyboardShortcutsOpen,
    setRightPanelOpen,
  ]);

  const renderView = () => {
    if (!activeWorkspaceId) {
      return <WorkspaceSelector />;
    }

    if (workspaceStudies.length === 0) {
      return <WelcomeView />;
    }

    if (!activeStudyId) {
      return <StudiesDashboard />;
    }

    switch (activeView) {
      case "dashboard":
        return <StudiesDashboard />;
      case "documents":
        return <DocumentViewer />;
      case "codes":
        return <CodesView />;
      case "refiner":
        return <RefinerView />;
      case "themes":
        return <ThemesView />;
      case "visualizations":
        return <VisualizationsView />;
      case "intelligence":
        return <IntelligenceLibrary />;
      case "analytics":
        return <AnalyticsView />;
      default:
        return <DocumentViewer />;
    }
  };

  // Don't wrap in MainLayout if no workspace selected
  if (!activeWorkspaceId) {
    return renderView();
  }

  return <MainLayout>{renderView()}</MainLayout>;
};

export default Index;
