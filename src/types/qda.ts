export interface QDADocument {
  id: string;
  title: string;
  content: string;
  type: "pdf" | "txt" | "docx";
  size: number;
  uploadedAt: Date;
  excerpts: string[];
}

export interface Collaborator {
  id: string;
  name: string;
  initials: string;
  color: string;
  joinedAt: Date;
  lastActive: Date;
}

export interface Workspace {
  id: string;
  name: string;
  code: string; // Shareable 6-character code
  createdBy: string;
  createdAt: Date;
  collaborators: Collaborator[];
  studyIds: string[];
  // Research mode settings
  researchMode?: boolean;
  aiEnabled?: boolean;
  participantId?: string;
}

export interface CodeExcerpt {
  id: string;
  text: string;
  documentId: string;
  startOffset: number;
  endOffset: number;
  codeIds: string[];
  memo?: string;
  createdAt: Date;
}

export type CodeLevel = "main" | "child" | "subchild";

export interface Code {
  id: string;
  name: string;
  description?: string;
  color: string;
  level: CodeLevel;
  parentId?: string;
  excerptIds: string[];
  createdAt: Date;
  frequency: number;
  documentCount: number;
}

export interface Theme {
  id: string;
  name: string;
  description?: string;
  color: string;
  memo?: string;
  codeIds: string[];
  parentId?: string;
  createdAt: Date;
}

export interface Memo {
  id: string;
  content: string;
  targetType: "document" | "excerpt" | "code" | "theme";
  targetId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  documents: QDADocument[];
  codes: Code[];
  themes: Theme[];
  excerpts: CodeExcerpt[];
  memos: Memo[];
}

export type StudyStatus =
  | "planning"
  | "in-progress"
  | "analysis"
  | "writing"
  | "completed";

export interface Study {
  id: string;
  title: string;
  description?: string;
  researchQuestion?: string;
  status: StudyStatus;
  tags: string[];
  color: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  // Study contains all the analysis data
  documents: QDADocument[];
  codes: Code[];
  themes: Theme[];
  excerpts: CodeExcerpt[];
  memos: Memo[];
}

export interface StudyStatistics {
  studyId: string;
  documentCount: number;
  codeCount: number;
  themeCount: number;
  excerptCount: number;
  memoCount: number;
  codedSegments: number;
  averageCodesPerDocument: number;
  mostUsedCode?: string;
  recentActivity: Date;
}

export interface TextSelection {
  text: string;
  startOffset: number;
  endOffset: number;
  documentId: string;
}

export interface CoOccurrence {
  code1Id: string;
  code2Id: string;
  weight: number;
  documentIds: string[];
}

export interface VisualizationNode {
  id: string;
  name: string;
  type: "theme" | "code";
  level?: CodeLevel;
  frequency: number;
  color: string;
  parentId?: string;
}

export interface VisualizationLink {
  source: string;
  target: string;
  weight: number;
}

// Analytics and Research Tracking
export type AnalyticsAction =
  | "excerpt_created"
  | "excerpt_updated"
  | "excerpt_deleted"
  | "code_created"
  | "code_applied"
  | "code_removed"
  | "ai_suggestion_requested"
  | "ai_suggestion_accepted"
  | "ai_suggestion_rejected"
  | "document_opened"
  | "document_closed"
  | "theme_created"
  | "session_started"
  | "session_ended";

export interface AnalyticsLog {
  id: string;
  timestamp: Date;
  workspaceId: string;
  participantId?: string;
  action: AnalyticsAction;
  details: {
    // Common fields
    studyId?: string;
    documentId?: string;
    excerptId?: string;
    codeId?: string;
    codeName?: string;
    
    // AI-specific
    aiSuggestion?: string;
    aiConfidence?: number;
    suggestionAccepted?: boolean;
    
    // Timing
    duration?: number; // milliseconds
    
    // Text
    excerptText?: string;
    excerptLength?: number;
    
    // Additional context
    metadata?: Record<string, any>;
  };
}

export interface ResearchMetrics {
  participantId: string;
  workspaceId: string;
  startTime: Date;
  endTime?: Date;
  
  // Coding metrics
  totalExcerpts: number;
  totalCodes: number;
  uniqueCodes: number;
  averageCodesPerExcerpt: number;
  codingSpeed: number; // excerpts per hour
  
  // AI metrics (if enabled)
  aiSuggestionsRequested: number;
  aiSuggestionsAccepted: number;
  aiSuggestionsRejected: number;
  aiAcceptanceRate: number;
  
  // Time metrics
  totalActiveTime: number; // milliseconds
  averageTimePerExcerpt: number;
  
  // Document metrics
  documentsProcessed: number;
  totalTextCoded: number; // characters
}
