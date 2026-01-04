import { useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { useHelpStore } from "@/store/helpStore";
import { useQDAStore } from "@/store/qdaStore";

const TOUR_STEPS: Step[] = [
  {
    target: "body",
    content: (
      <div>
        <h2 className="text-lg font-bold mb-2">
          Welcome to ThematicFlow! 👋
        </h2>
        <p>
          Let's take a quick tour to help you get started with qualitative data
          analysis. This will only take a minute!
        </p>
      </div>
    ),
    placement: "center",
  },
  {
    target: '[data-tour="dashboard"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">Studies Dashboard</h3>
        <p>
          This is your Studies Dashboard. Create and manage multiple research
          projects, each with its own documents, codes, and themes.
        </p>
      </div>
    ),
  },
  {
    target: '[data-tour="new-study"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">Create a Study</h3>
        <p>
          Click here to create your first research study. Give it a title,
          description, and research question to get started.
        </p>
      </div>
    ),
  },
  {
    target: '[data-tour="navigation"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">Navigation</h3>
        <p>Use this sidebar to navigate between different views:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
          <li>
            <strong>Documents:</strong> Upload and code your data
          </li>
          <li>
            <strong>Codes:</strong> Manage your coding hierarchy
          </li>
          <li>
            <strong>Refiner:</strong> Organize and merge codes
          </li>
          <li>
            <strong>Themes:</strong> Build higher-level patterns
          </li>
          <li>
            <strong>Visualizations:</strong> Explore data visually
          </li>
        </ul>
      </div>
    ),
  },
  {
    target: '[data-tour="help"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">Need Help?</h3>
        <p>
          Click here anytime to access help documentation, keyboard shortcuts,
          and video tutorials. Press{" "}
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+H</kbd> for
          quick access.
        </p>
      </div>
    ),
  },
  {
    target: '[data-tour="right-panel"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">Details Panel</h3>
        <p>
          This panel shows details about selected excerpts, codes, or themes.
          You can add memos and view statistics here.
        </p>
      </div>
    ),
  },
  {
    target: "body",
    content: (
      <div>
        <h2 className="text-lg font-bold mb-2">You're All Set! 🎉</h2>
        <p className="mb-3">
          You're ready to start analyzing qualitative data. Here's a quick
          workflow:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Create a study</li>
          <li>Upload documents</li>
          <li>Select text to create codes</li>
          <li>Build themes from codes</li>
          <li>Visualize your findings</li>
        </ol>
        <p className="mt-3 text-sm text-muted-foreground">
          You can replay this tour anytime from the Help menu.
        </p>
      </div>
    ),
    placement: "center",
  },
];

export function OnboardingTour() {
  const {
    showOnboarding,
    hasCompletedOnboarding,
    completeOnboarding,
    setShowOnboarding,
  } = useHelpStore();
  const { studies, activeWorkspaceId } = useQDAStore();

  // Check if participant mode - completely disable tour
  const isParticipantMode = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).has('participantId');

  // Block tour completely for participants
  if (isParticipantMode) {
    return null;
  }

  // Auto-show onboarding for new users after workspace creation
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenTour");
    const activeWorkspaceId = useQDAStore.getState().activeWorkspaceId;

    if (!hasSeenTour && activeWorkspaceId) {
      startOnboarding();
      localStorage.setItem("hasSeenTour", "true");
    }
  }, [startOnboarding]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      completeOnboarding();
    }
  };

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={showOnboarding}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--background))",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "8px",
          padding: "16px",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          borderRadius: "6px",
          padding: "8px 16px",
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
}
