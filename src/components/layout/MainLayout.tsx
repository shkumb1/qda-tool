import { ReactNode } from "react";
import { useQDAStore } from "@/store/qdaStore";
import { LeftSidebar } from "./LeftSidebar";
import { RightPanel } from "./RightPanel";
import { TopNavigation } from "./TopNavigation";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const rightPanelOpen = useQDAStore((s) => s.rightPanelOpen);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Left Sidebar - Fixed */}
      <LeftSidebar />

      {/* Main Content Area with Resizable Panels */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Navigation */}
        <TopNavigation />

        {/* Resizable Content + Right Panel */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Center Content */}
          <ResizablePanel defaultSize={rightPanelOpen ? 70 : 100} minSize={40}>
            <main className="h-full overflow-auto p-4">{children}</main>
          </ResizablePanel>

          {/* Right Panel - Conditionally rendered */}
          {rightPanelOpen && (
            <>
              <ResizableHandle
                withHandle
                className="bg-border hover:bg-accent/50 transition-colors"
              />
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <div
                  className="h-full border-l border-border bg-card overflow-hidden"
                  data-tour="right-panel"
                >
                  <RightPanel />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
