import { useState } from "react";
import { useQDAStore } from "@/store/qdaStore";
import {
  Brain,
  FileText,
  Trash2,
  Download,
  Calendar,
  FileStack,
  Zap,
  Target,
  Microscope,
  Eye,
  ChevronDown,
  Network,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MindMapVisualization } from "@/components/visualizations/MindMapVisualization";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { SavedIntelligence } from "@/types/qda";
import { cn } from "@/lib/utils";

const DEPTH_ICONS = {
  quick: Zap,
  standard: Target,
  deep: Microscope,
};

const DEPTH_LABELS = {
  quick: "Quick Analysis",
  standard: "Standard Analysis",
  deep: "Deep Analysis",
};

export function IntelligenceLibrary() {
  const { toast } = useToast();
  const { intelligenceReports, deleteIntelligence, documents } = useQDAStore();
  const [deleteDialog, setDeleteDialog] = useState<SavedIntelligence | null>(
    null,
  );
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const handleDelete = (report: SavedIntelligence) => {
    setDeleteDialog(report);
  };

  const confirmDelete = () => {
    if (!deleteDialog) return;
    deleteIntelligence(deleteDialog.id);
    toast({
      title: "Report deleted",
      description: "Intelligence report has been removed.",
    });
    setDeleteDialog(null);
  };

  const handleExport = (report: SavedIntelligence) => {
    const exportData = {
      title: report.title,
      scope: report.scope,
      depth: report.depth,
      analyzedAt: report.createdAt,
      summary: report.summary,
      themes: report.themes,
      insights: report.keyInsights,
      mindMap: report.mindMap,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, "_")}_intelligence.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report exported",
      description: "Downloaded as JSON file",
    });
  };

  const toggleExpand = (reportId: string) => {
    setExpandedReport(expandedReport === reportId ? null : reportId);
  };

  const getDocumentTitles = (documentIds: string[]) => {
    return documentIds
      .map((id) => documents.find((doc) => doc.id === id)?.title)
      .filter(Boolean)
      .join(", ");
  };

  if (intelligenceReports.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-center">No Intelligence Reports</CardTitle>
            <CardDescription className="text-center">
              Save Document Intelligence analyses to access them here later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Open a document and click "Document Intelligence" to create your
              first AI-powered analysis.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="h-6 w-6" />
          Intelligence Library
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {intelligenceReports.length} saved{" "}
          {intelligenceReports.length === 1 ? "report" : "reports"}
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4">
        {intelligenceReports
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .map((report) => {
            const DepthIcon = DEPTH_ICONS[report.depth];
            const isExpanded = expandedReport === report.id;

            return (
              <Card key={report.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2 mb-2">
                        {report.scope === "study" ? (
                          <FileStack className="h-5 w-5 text-primary" />
                        ) : (
                          <FileText className="h-5 w-5 text-primary" />
                        )}
                        <span className="truncate">{report.title}</span>
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline" className="gap-1">
                          <DepthIcon className="h-3 w-3" />
                          {DEPTH_LABELS[report.depth]}
                        </Badge>
                        <Badge variant="secondary">
                          {report.scope === "study" ? "Study-wide" : "Document"}
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(report.createdAt), {
                            addSuffix: true,
                          })}
                        </Badge>
                      </div>
                      {report.scope === "document" && (
                        <p className="text-xs text-muted-foreground">
                          {getDocumentTitles(report.documentIds)}
                        </p>
                      )}
                      {report.scope === "study" && (
                        <p className="text-xs text-muted-foreground">
                          {report.documentIds.length} document
                          {report.documentIds.length === 1 ? "" : "s"} analyzed
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(report)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(report)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(report.id)}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                        {isExpanded ? "Hide" : "View"} Analysis
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 ml-auto transition-transform",
                            isExpanded && "rotate-180",
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <Tabs defaultValue="summary" className="w-full">
                        <TabsList className="w-full justify-start">
                          <TabsTrigger value="summary" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Summary
                          </TabsTrigger>
                          <TabsTrigger value="mindmap" className="gap-2">
                            <Network className="h-4 w-4" />
                            Mind Map
                          </TabsTrigger>
                          <TabsTrigger value="themes" className="gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Themes
                          </TabsTrigger>
                          <TabsTrigger value="insights" className="gap-2">
                            <Brain className="h-4 w-4" />
                            Insights
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="summary" className="mt-4">
                          <ScrollArea className="h-[400px] rounded-md border p-4">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <h4 className="font-semibold mb-3">Summary</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {report.summary}
                              </p>
                            </div>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent value="mindmap" className="mt-4">
                          <div className="h-[400px] rounded-md border">
                            <MindMapVisualization
                              data={report.mindMap}
                              onNodeClick={() => {}}
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="themes" className="mt-4">
                          <ScrollArea className="h-[400px] rounded-md border p-4">
                            <div className="space-y-3">
                              <h4 className="font-semibold mb-3">
                                Detected Themes ({report.themes.length})
                              </h4>
                              {report.themes.map((theme, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-lg border p-3 bg-muted/30"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h5 className="font-medium text-sm">
                                      {theme.name}
                                    </h5>
                                    <Badge variant="outline" className="text-xs">
                                      {Math.round(theme.confidence * 100)}%
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {theme.description}
                                  </p>
                                  {theme.subThemes &&
                                    theme.subThemes.length > 0 && (
                                      <div className="mt-2 pl-3 border-l-2 border-muted space-y-2">
                                        {theme.subThemes.map(
                                          (subTheme, subIdx) => (
                                            <div key={subIdx}>
                                              <p className="text-xs font-medium">
                                                {subTheme.name}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {subTheme.description}
                                              </p>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent value="insights" className="mt-4">
                          <ScrollArea className="h-[400px] rounded-md border p-4">
                            <div className="space-y-6">
                              {/* Main Points */}
                              {report.keyInsights.mainPoints.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">Main Points</h4>
                                  <ul className="space-y-2">
                                    {report.keyInsights.mainPoints.map(
                                      (point, idx) => (
                                        <li
                                          key={idx}
                                          className="flex gap-2 text-sm text-muted-foreground"
                                        >
                                          <span className="text-primary font-medium">
                                            {idx + 1}.
                                          </span>
                                          <span>{point}</span>
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}

                              {/* Key Quotes */}
                              {report.keyInsights.keyQuotes.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-3">Key Quotes</h4>
                                  <div className="space-y-3">
                                    {report.keyInsights.keyQuotes.map(
                                      (quote, idx) => (
                                        <div
                                          key={idx}
                                          className="border-l-4 border-primary pl-4 py-2"
                                        >
                                          <p className="text-sm italic mb-2">
                                            "{quote.text}"
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            💡 {quote.relevance}
                                          </p>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Patterns */}
                              {report.keyInsights.patterns.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Observed Patterns
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {report.keyInsights.patterns.map(
                                      (pattern, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="secondary"
                                          className="px-3 py-1"
                                        >
                                          {pattern}
                                        </Badge>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Intelligence Report?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
