import { useState } from "react";
import {
  BookOpen,
  Sparkles,
  FileText,
  Layers,
  BarChart3,
  Plus,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQDAStore } from "@/store/qdaStore";
import { loadSampleData } from "@/data/sampleData";
import { useToast } from "@/hooks/use-toast";
import { StudyStatus } from "@/types/qda";

const FEATURES = [
  {
    icon: FileText,
    title: "Import Documents",
    description: "Upload PDFs, Word docs, or text files to analyze",
  },
  {
    icon: Database,
    title: "Code Your Data",
    description: "Organize insights with hierarchical coding",
  },
  {
    icon: Layers,
    title: "Build Themes",
    description: "Group codes into meaningful thematic patterns",
  },
  {
    icon: BarChart3,
    title: "Visualize Insights",
    description: "Explore relationships with interactive charts",
  },
];

const STUDY_COLORS = [
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
];

export function WelcomeView() {
  const { toast } = useToast();
  const { createStudy, addDocument, addCode, addTheme, setActiveView } =
    useQDAStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    researchQuestion: "",
    status: "planning" as StudyStatus,
    color: "blue",
  });

  const handleCreateStudy = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a study title.",
        variant: "destructive",
      });
      return;
    }

    const newStudy = createStudy({
      title: formData.title,
      description: formData.description,
      researchQuestion: formData.researchQuestion,
      status: formData.status,
      color: formData.color,
      tags: [],
    });

    toast({
      title: "Study created",
      description: `"${formData.title}" is ready for analysis.`,
    });

    setCreateDialogOpen(false);
    setFormData({
      title: "",
      description: "",
      researchQuestion: "",
      status: "planning",
      color: "blue",
    });

    // Navigate to documents view to start importing
    setActiveView("documents");
  };

  const handleLoadSampleData = () => {
    // Create a sample study first
    const sampleStudy = createStudy({
      title: "Sample Research Project",
      description: "Exploring user experiences with qualitative methods",
      researchQuestion:
        "How do users describe their experiences with qualitative data analysis tools?",
      status: "analysis",
      color: "purple",
      tags: ["User Research", "Interviews"],
    });

    // Load sample data into the new study
    loadSampleData(addDocument, addCode, addTheme);

    toast({
      title: "Sample data loaded",
      description:
        "Explore the sample study with 3 interviews, codes, and themes.",
    });

    setActiveView("documents");
  };

  return (
    <div className="h-full flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-4xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to Insight Weaver
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A powerful qualitative data analysis tool for researchers,
            designers, and analysts
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="border-muted">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Create Your First Study
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Study</DialogTitle>
                <DialogDescription>
                  Set up a new research study to organize your qualitative
                  analysis.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Study Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., User Interview Analysis"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief overview of your research study..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="researchQuestion">Research Question</Label>
                  <Textarea
                    id="researchQuestion"
                    placeholder="What are you trying to understand or discover?"
                    rows={2}
                    value={formData.researchQuestion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        researchQuestion: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: StudyStatus) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="analysis">Analysis</SelectItem>
                        <SelectItem value="writing">Writing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Select
                      value={formData.color}
                      onValueChange={(value) =>
                        setFormData({ ...formData, color: value })
                      }
                    >
                      <SelectTrigger id="color">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STUDY_COLORS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded-full ${color.class}`}
                              />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateStudy}>Create Study</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={handleLoadSampleData}
          >
            <Sparkles className="w-5 h-5" />
            Try Sample Data
          </Button>
        </div>

        {/* Footer Hint */}
        <p className="text-center text-sm text-muted-foreground">
          New to qualitative analysis?{" "}
          <button
            className="text-primary hover:underline"
            onClick={() => {
              // This will be handled by the help system
              document.dispatchEvent(
                new KeyboardEvent("keydown", { key: "h", ctrlKey: true })
              );
            }}
          >
            Check out our help guide
          </button>
        </p>
      </div>
    </div>
  );
}
