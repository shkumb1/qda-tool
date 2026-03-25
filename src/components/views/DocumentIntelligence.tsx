import { useState } from "react";
import { useQDAStore } from "@/store/qdaStore";
import {
  analyzeDocument,
  type DocumentIntelligence as DocIntel,
  type ThemeNode,
  type MindMapNode,
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const { addTheme, updateTheme } = useQDAStore();
  const [analysis, setAnalysis] = useState<DocIntel | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [createdThemes, setCreatedThemes] = useState<Set<string>>(new Set());

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeDocument(documentTitle, documentContent);
      setAnalysis(result);
      toast({
        title: "Analysis complete",
        description: "Document intelligence generated successfully",
      });
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
        const childTheme = addTheme(
          subTheme.name,
          "#a78bfa",
          newTheme.id,
        );
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
            {theme.subThemes.map((subTheme) => renderThemeTree(subTheme, depth + 1))}
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
                {documentTitle}
              </p>
            </div>
            <div className="flex gap-2">
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
                    <Brain className="h-4 w-4" />
                    Analyze Document
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
              Get an executive summary, detect themes, visualize concepts with a
              mind map, and extract key insights from your document.
            </p>
            <Button onClick={handleAnalyze} className="gap-2">
              <Brain className="h-4 w-4" />
              Start Analysis
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              💡 Requires OpenAI API key configured in Vercel
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">
              Analyzing document with AI...
            </p>
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
                  <h3 className="text-lg font-semibold mb-4">
                    Executive Summary
                  </h3>
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
                            <p className="text-sm italic mb-2">"{quote.text}"</p>
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
                            <Badge key={idx} variant="secondary" className="px-3 py-1">
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
