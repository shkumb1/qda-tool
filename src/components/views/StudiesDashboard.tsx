import { useState } from "react";
import { useQDAStore } from "@/store/qdaStore";
import {
  Plus,
  Search,
  MoreVertical,
  FolderOpen,
  Calendar,
  FileText,
  Code2,
  Layers,
  Tag,
  Edit2,
  Trash2,
  Copy,
  TrendingUp,
  Clock,
  CheckCircle2,
  PlayCircle,
  PenTool,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Study, StudyStatus } from "@/types/qda";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG = {
  planning: {
    label: "Planning",
    icon: Lightbulb,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  "in-progress": {
    label: "In Progress",
    icon: PlayCircle,
    color: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  analysis: {
    label: "Analysis",
    icon: TrendingUp,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  writing: {
    label: "Writing",
    icon: PenTool,
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  },
};

const STUDY_COLORS = [
  "#3b82f6",
  "#ec4899",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

export function StudiesDashboard() {
  const { toast } = useToast();
  const {
    activeStudyId,
    createStudy,
    deleteStudy,
    setActiveStudy,
    updateStudy,
    duplicateStudy,
    getStudyStatistics,
    getWorkspaceStudies,
  } = useQDAStore();

  // Get studies for current workspace
  const studies = getWorkspaceStudies();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudyStatus | "all">("all");
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<Study | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [researchQuestion, setResearchQuestion] = useState("");
  const [status, setStatus] = useState<StudyStatus>("planning");
  const [tags, setTags] = useState("");
  const [color, setColor] = useState(STUDY_COLORS[0]);

  const filteredStudies = studies.filter((study) => {
    const matchesSearch =
      study.title.toLowerCase().includes(search.toLowerCase()) ||
      study.description?.toLowerCase().includes(search.toLowerCase()) ||
      study.tags.some((tag) =>
        tag.toLowerCase().includes(search.toLowerCase())
      );
    const matchesStatus =
      statusFilter === "all" || study.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setResearchQuestion("");
    setStatus("planning");
    setTags("");
    setColor(STUDY_COLORS[studies.length % STUDY_COLORS.length]);
  };

  const handleCreate = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a study title.",
        variant: "destructive",
      });
      return;
    }

    createStudy({
      title: title.trim(),
      description: description.trim() || undefined,
      researchQuestion: researchQuestion.trim() || undefined,
      status,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      color,
    });

    toast({
      title: "Study created",
      description: `"${title}" is ready for analysis.`,
    });

    resetForm();
    setCreateDialog(false);
  };

  const handleUpdate = () => {
    if (!editDialog || !title.trim()) return;

    updateStudy(editDialog.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      researchQuestion: researchQuestion.trim() || undefined,
      status,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      color,
    });

    toast({
      title: "Study updated",
      description: "Changes have been saved.",
    });

    resetForm();
    setEditDialog(null);
  };

  const handleOpenStudy = (studyId: string) => {
    setActiveStudy(studyId);
    toast({
      title: "Study opened",
      description: "You can now work on this study.",
    });
  };

  const handleDelete = (study: Study) => {
    if (
      confirm(
        `Are you sure you want to delete "${study.title}"? This cannot be undone.`
      )
    ) {
      deleteStudy(study.id);
      toast({
        title: "Study deleted",
        description: `"${study.title}" has been removed.`,
      });
    }
  };

  const handleDuplicate = (study: Study) => {
    duplicateStudy(study.id);
    toast({
      title: "Study duplicated",
      description: `Created a copy of "${study.title}".`,
    });
  };

  const handleEdit = (study: Study) => {
    setTitle(study.title);
    setDescription(study.description || "");
    setResearchQuestion(study.researchQuestion || "");
    setStatus(study.status);
    setTags(study.tags.join(", "));
    setColor(study.color);
    setEditDialog(study);
  };

  const renderStudyCard = (study: Study) => {
    const stats = getStudyStatistics(study.id);
    const statusInfo = STATUS_CONFIG[study.status];
    const StatusIcon = statusInfo.icon;
    const isActive = activeStudyId === study.id;

    return (
      <Card
        key={study.id}
        className={cn(
          "group hover:shadow-lg transition-all cursor-pointer relative overflow-hidden",
          isActive && "ring-2 ring-accent"
        )}
        style={{ borderTopColor: study.color, borderTopWidth: "4px" }}
      >
        {isActive && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div
              className="flex-1 min-w-0"
              onClick={() => handleOpenStudy(study.id)}
            >
              <CardTitle className="text-lg truncate">{study.title}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {study.description || "No description"}
              </CardDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleOpenStudy(study.id)}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Open Study
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(study)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(study)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleDelete(study)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 mt-3">
            <Badge
              variant="outline"
              className={cn("text-xs", statusInfo.color)}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
            {study.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {study.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {study.tags.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{study.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0" onClick={() => handleOpenStudy(study.id)}>
          {/* Research Question */}
          {study.researchQuestion && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md text-sm">
              <span className="text-muted-foreground font-medium">
                Research Question:
              </span>
              <p className="mt-1 text-foreground line-clamp-2">
                {study.researchQuestion}
              </p>
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-muted/30 rounded-md">
              <FileText className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-semibold">{stats.documentCount}</p>
              <p className="text-xs text-muted-foreground">Docs</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-md">
              <Code2 className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-semibold">{stats.codeCount}</p>
              <p className="text-xs text-muted-foreground">Codes</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-md">
              <Layers className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-semibold">{stats.themeCount}</p>
              <p className="text-xs text-muted-foreground">Themes</p>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded-md">
              <Tag className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-semibold">{stats.excerptCount}</p>
              <p className="text-xs text-muted-foreground">Excerpts</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                Updated{" "}
                {formatDistanceToNow(new Date(study.updatedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                Created {new Date(study.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Research Studies
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your qualitative research projects
          </p>
        </div>
        <Button
          onClick={() => setCreateDialog(true)}
          className="gap-2"
          data-tour="new-study"
        >
          <Plus className="h-4 w-4" />
          New Study
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search studies by title, description, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as StudyStatus | "all")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="analysis">Analysis</SelectItem>
            <SelectItem value="writing">Writing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Studies Grid */}
      {filteredStudies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
          {filteredStudies.map(renderStudyCard)}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {search || statusFilter !== "all"
              ? "No studies found"
              : "No studies yet"}
          </h3>
          <p className="text-muted-foreground max-w-md mb-4">
            {search || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Create your first research study to start analyzing qualitative data."}
          </p>
          {!search && statusFilter === "all" && (
            <Button onClick={() => setCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Study
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialog || !!editDialog}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialog(false);
            setEditDialog(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editDialog ? "Edit Study" : "Create New Study"}
            </DialogTitle>
            <DialogDescription>
              {editDialog
                ? "Update the details of your research study."
                : "Set up a new research study to organize your qualitative analysis."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Study Title *</Label>
              <Input
                id="title"
                placeholder="E.g., Remote Work Impact Study"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief overview of your research study..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="research-question">Research Question</Label>
              <Textarea
                id="research-question"
                placeholder="What is your main research question?"
                value={researchQuestion}
                onChange={(e) => setResearchQuestion(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as StudyStatus)}
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
                <div className="flex gap-2">
                  {STUDY_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        color === c
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="E.g., qualitative, interviews, 2026"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialog(false);
                setEditDialog(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={editDialog ? handleUpdate : handleCreate}>
              {editDialog ? "Save Changes" : "Create Study"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
