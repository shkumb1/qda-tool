import { useState } from "react";
import { useQDAStore } from "@/store/qdaStore";
import {
  analyzeDocument,
  type DocumentIntelligence as DocIntel,
  type ThemeNode,
  type MindMapNode,
  type AnalysisDepth,
} from "@/services/aiService";
import { MindMapVisualization } from "@/components/visualizations/MindMapVisualization";
import {
  Loader2,
  FileText,
  Brain,
  Lightbulb,
  Network,
  Check,
  Download,
  ChevronRight,
  Zap,
  Target,
  Microscope,
  FileStack,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type AnalysisScope = "current" | "all";

interface DocumentIntelligenceProps {
  documentId: string;
  documentTitle: string;
  documentContent: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentIntelligence({
  documentId,
  documentTitle,
  documentContent,
  open,
  onOpenChange,
}: DocumentIntelligenceProps) {
  const { toast } = useToast();
  const { addTheme, updateTheme, documents: studyDocuments } = useQDAStore();
  const [analysis, setAnalysis] = useState<DocIntel | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [createdThemes, setCreatedThemes] = useState<Set<string>>(new Set());
  const [analysisDepth, setAnalysisDepth] = useState<AnalysisDepth>("standard");
  const [analysisScope, setAnalysisScope] = useState<AnalysisScope>("current");

  // Get available documents for study-wide analysis
  const availableDocuments = studyDocuments.filter((doc) => doc.content && doc.content.trim().length > 0);
  const canAnalyzeAll = availableDocuments.length > 0;
  const documentCount = availableDocuments.length;

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      let result: DocIntel;
      
      if (analysisScope === "all") {
        // Analyze all documents in the study
        const combinedContent = availableDocuments
          .map((doc) => `=== Document: ${doc.title} ===\n\n${doc.content}\n\n`)
          .join("\n");
        const combinedTitle = `Study Analysis (${availableDocuments.length} documents)`;
        
        result = await analyzeDocument(
          combinedTitle,
          combinedContent,
          analysisDepth,
        );
        
        toast({
          title: "Study analysis complete",
          description: `Analyzed ${availableDocuments.length} documents successfully`,
        });
      } else {
        // Analyze current document only
        result = await analyzeDocument(
          documentTitle,
          documentContent,
          analysisDepth,
        );
        
        toast({
          title: "Analysis complete",
          description: "Document intelligence generated successfully",
        });
      }
      
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to analyze document. Please check your OpenAI API configuration.",
        variant: "destructive",
      });
      setAnalysis(null); // Clear any previous analysis
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThemeFromNode = (themeData: ThemeNode) => {
    const newTheme = addTheme(
      themeData.name,
      "#8b5cf6", // Default purple color
    );

    if (themeData.description) {
      updateTheme(newTheme.id, { description: themeData.description });
    }

    // Create child themes
    if (themeData.subThemes && themeData.subThemes.length > 0) {
      themeData.subThemes.forEach((subTheme) => {
        const childTheme = addTheme(subTheme.name, "#a78bfa", newTheme.id);
        if (subTheme.description) {
          updateTheme(childTheme.id, { description: subTheme.description });
        }
      });
    }

    setCreatedThemes(new Set([...createdThemes, themeData.name]));

    toast({
      title: "Theme created",
      description: `"${themeData.name}" ${themeData.subThemes?.length ? `with ${themeData.subThemes.length} sub-themes ` : ""}added to your project`,
    });
  };

  const handleExportAnalysis = () => {
    if (!analysis) return;

    const exportData = {
      document: documentTitle,
      analyzedAt: new Date().toISOString(),
      summary: analysis.summary,
      themes: analysis.themes,
      insights: analysis.keyInsights,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${documentTitle.replace(/\s+/g, "_")}_analysis.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Analysis exported",
      description: "Downloaded as JSON file",
    });
  };

  const renderThemeTree = (theme: ThemeNode, depth = 0) => {
    const isCreated = createdThemes.has(theme.name);

    return (
      <div key={theme.name} className={cn("space-y-2", depth > 0 && "ml-6")}>
        <Card className={cn(depth === 0 ? "bg-muted/30" : "bg-background")}>
          <CardHeader className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">{theme.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(theme.confidence * 100)}%
                  </Badge>
                  {isCreated && (
                    <Badge variant="default" className="text-xs gap-1">
                      <Check className="h-3 w-3" />
                      Created
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs mt-1">
                  {theme.description}
                </CardDescription>
              </div>
              {!isCreated && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCreateThemeFromNode(theme)}
                  className="flex-shrink-0"
                >
                  <ChevronRight className="h-3 w-3 mr-1" />
                  Create
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
        {theme.subThemes && theme.subThemes.length > 0 && (
          <div className="space-y-2">
            {theme.subThemes.map((subTheme) =>
              renderThemeTree(subTheme, depth + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Document Intelligence
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {analysis && analysisScope === "all" 
                  ? `Study Analysis (${availableDocuments.length} documents)`
                  : documentTitle}
              </p>
            </div>
            <div className="flex gap-2 mr-8">
              {analysis && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAnalysis}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              )}

              {analysis && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Target className="h-4 w-4" />
                      {analysisDepth.charAt(0).toUpperCase() +
                        analysisDepth.slice(1)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Analysis Depth</p>
                      <div className="space-y-2">
                        {(["quick", "standard", "deep"] as const).map(
                          (mode) => (
                            <Button
                              key={mode}
                              variant={
                                analysisDepth === mode ? "default" : "outline"
                              }
                              onClick={() => setAnalysisDepth(mode)}
                              className="w-full justify-start"
                              size="sm"
                            >
                              {mode === "quick" && (
                                <Zap className="h-4 w-4 mr-2" />
                              )}
                              {mode === "standard" && (
                                <Target className="h-4 w-4 mr-2" />
                              )}
                              {mode === "deep" && (
                                <Microscope className="h-4 w-4 mr-2" />
                              )}
                              {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </Button>
                          ),
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : analysis ? (
                  <>
                    <Brain className="h-4 w-4" />
                    Reanalyze
                  </>
                ) : (
                  <>
                    {analysisScope === "all" ? <FileStack className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                    {analysisScope === "all" ? "Analyze Study" : "Analyze Document"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetHeader>

        {!analysis && !loading && (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              AI-Powered Document Analysis
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Get a summary, detect themes, visualize concepts with a mind map,
              and extract key insights from your document.
            </p>

            {/* Analysis Scope Selector */}
            <div className="mb-6 w-full max-w-md">
              <p className="text-sm font-medium mb-3">Analysis Scope</p>
              <RadioGroup
                value={analysisScope}
                onValueChange={(value) => setAnalysisScope(value as AnalysisScope)}
                className="space-y-3"
              >
                <div 
                  className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setAnalysisScope("current")}
                >
                  <RadioGroupItem value="current" id="current" />
                  <div className="flex-1">
                    <Label htmlFor="current" className="cursor-pointer font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Current Document
                      </div>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Analyze: {documentTitle}
                    </p>
                  </div>
                </div>
                <div 
                  className={cn(
                    "flex items-start space-x-3 rounded-lg border p-4 transition-colors",
                    canAnalyzeAll ? "cursor-pointer hover:bg-muted/50" : "opacity-60 cursor-not-allowed"
                  )}
                  onClick={() => canAnalyzeAll && setAnalysisScope("all")}
                >
                  <RadioGroupItem value="all" id="all" disabled={!canAnalyzeAll} />
                  <div className="flex-1">
                    <Label htmlFor="all" className={cn("font-medium", canAnalyzeAll ? "cursor-pointer" : "cursor-not-allowed")}>
                      <div className="flex items-center gap-2">
                        <FileStack className="h-4 w-4" />
                        All Documents in Study
                      </div>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {documentCount === 0 && "No documents available in this study"}
                      {documentCount > 0 && `Analyze all ${documentCount} document${documentCount === 1 ? '' : 's'} together`}
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Analysis Depth Selector */}
            <div className="mb-6 w-full max-w-md">
              <p className="text-sm font-medium mb-3">Analysis Depth</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={analysisDepth === "quick" ? "default" : "outline"}
                  onClick={() => setAnalysisDepth("quick")}
                  className="flex flex-col h-auto py-3 px-2"
                >
                  <Zap className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">Quick</span>
                  <span className="text-[10px] opacity-70">3-4 themes</span>
                </Button>
                <Button
                  variant={analysisDepth === "standard" ? "default" : "outline"}
                  onClick={() => setAnalysisDepth("standard")}
                  className="flex flex-col h-auto py-3 px-2"
                >
                  <Target className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">Standard</span>
                  <span className="text-[10px] opacity-70">4-6 themes</span>
                </Button>
                <Button
                  variant={analysisDepth === "deep" ? "default" : "outline"}
                  onClick={() => setAnalysisDepth("deep")}
                  className="flex flex-col h-auto py-3 px-2"
                >
                  <Microscope className="h-5 w-5 mb-1" />
                  <span className="text-xs font-medium">Deep</span>
                  <span className="text-[10px] opacity-70">5-8 themes</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {analysisDepth === "quick" &&
                  "Fast analysis focusing on core themes (8-12 nodes)"}
                {analysisDepth === "standard" &&
                  "Balanced analysis with detailed theme hierarchy (12-18 nodes)"}
                {analysisDepth === "deep" &&
                  "Comprehensive analysis with granular concepts and sub-themes (18-30 nodes)"}
              </p>
            </div>

            <Button onClick={handleAnalyze} className="gap-2" disabled={analysisScope === "all" && !canAnalyzeAll}>
              {analysisScope === "all" ? <FileStack className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
              {analysisScope === "all" ? "Start Study Analysis" : "Start Analysis"}
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">
              {analysisScope === "all" 
                ? `Analyzing ${availableDocuments.length} documents with AI...`
                : "Analyzing document with AI..."}
            </p>
            <Badge variant="outline" className="mt-2">
              {analysisDepth.charAt(0).toUpperCase() + analysisDepth.slice(1)}{" "}
              mode
            </Badge>
          </div>
        )}

        {analysis && (
          <Tabs defaultValue="summary" className="h-[calc(100vh-120px)]">
            <TabsList className="w-full justify-start rounded-none border-b px-6">
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

            <TabsContent value="summary" className="h-full m-0">
              <ScrollArea className="h-full px-6 py-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold mb-4">Summary</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {analysis.summary}
                  </p>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="mindmap" className="h-full m-0 p-0">
              <div className="h-full">
                <MindMapVisualization
                  data={analysis.mindMap}
                  onNodeClick={setSelectedNode}
                />
              </div>
            </TabsContent>

            <TabsContent value="themes" className="h-full m-0">
              <ScrollArea className="h-full px-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Detected Themes</h3>
                      <p className="text-sm text-muted-foreground">
                        AI-identified themes from document analysis
                      </p>
                    </div>
                  </div>
                  {analysis.themes.map((theme) => renderThemeTree(theme))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="insights" className="h-full m-0">
              <ScrollArea className="h-full px-6 py-4">
                <div className="space-y-6">
                  {/* Main Points */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Main Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.keyInsights.mainPoints.map((point, idx) => (
                          <li key={idx} className="flex gap-2 text-sm">
                            <span className="text-primary font-medium flex-shrink-0">
                              {idx + 1}.
                            </span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Key Quotes */}
                  {analysis.keyInsights.keyQuotes.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Key Quotes</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analysis.keyInsights.keyQuotes.map((quote, idx) => (
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
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Patterns */}
                  {analysis.keyInsights.patterns.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Observed Patterns
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {analysis.keyInsights.patterns.map((pattern, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="px-3 py-1"
                            >
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
