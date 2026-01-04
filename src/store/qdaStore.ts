import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type {
  QDADocument,
  Code,
  Theme,
  CodeExcerpt,
  Memo,
  TextSelection,
  CodeLevel,
  Study,
  StudyStatus,
  StudyStatistics,
  Workspace,
  Collaborator,
  AnalyticsLog,
  AnalyticsAction,
  ResearchMetrics,
} from "@/types/qda";

interface QDAState {
  // Workspace
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  currentCollaborator: Collaborator | null;

  // Studies
  studies: Study[];
  activeStudyId: string | null;

  // Data (derived from active study)
  documents: QDADocument[];
  codes: Code[];
  themes: Theme[];
  excerpts: CodeExcerpt[];
  memos: Memo[];

  // UI State
  activeDocumentId: string | null;
  activeView:
    | "dashboard"
    | "documents"
    | "codes"
    | "refiner"
    | "themes"
    | "visualizations"
    | "analytics";
  selectedExcerptId: string | null;
  selectedCodeId: string | null;
  selectedThemeId: string | null;
  currentSelection: TextSelection | null;
  rightPanelOpen: boolean;

  // Undo stack for delete operations
  deletedCodes: Code[];

  // Analytics
  analyticsLogs: AnalyticsLog[];
  sessionStartTime: Date | null;

  // Workspace actions
  createWorkspace: (name: string, collaboratorName: string) => Workspace;
  joinWorkspace: (code: string, collaboratorName: string) => Workspace | null;
  setActiveWorkspace: (id: string | null) => void;
  leaveWorkspace: () => void;
  getActiveWorkspace: () => Workspace | null;
  clearLegacyStudies: () => void;
  getWorkspaceStudies: () => Study[];

  // Study actions
  createStudy: (
    data: Omit<
      Study,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "lastAccessedAt"
      | "documents"
      | "codes"
      | "themes"
      | "excerpts"
      | "memos"
    >
  ) => void;
  updateStudy: (
    id: string,
    updates: Partial<
      Pick<
        Study,
        | "title"
        | "description"
        | "researchQuestion"
        | "status"
        | "tags"
        | "color"
      >
    >
  ) => void;
  deleteStudy: (id: string) => void;
  setActiveStudy: (id: string | null) => void;
  duplicateStudy: (id: string) => void;
  getStudyStatistics: (studyId: string) => StudyStatistics;

  // Document actions
  addDocument: (
    doc: Omit<QDADocument, "id" | "uploadedAt" | "excerpts">
  ) => QDADocument;
  removeDocument: (id: string) => void;
  setActiveDocument: (id: string | null) => void;

  // Code actions
  addCode: (name: string, parentId?: string, level?: CodeLevel) => Code;
  updateCode: (id: string, updates: Partial<Code>) => void;
  deleteCode: (id: string) => void;
  undoDeleteCode: () => Code | null;
  mergeCodes: (sourceId: string, targetId: string) => void;
  renameCode: (id: string, name: string) => void;

  // Excerpt actions
  addExcerpt: (
    selection: TextSelection,
    codeIds: string[],
    memo?: string
  ) => CodeExcerpt;
  updateExcerpt: (id: string, updates: Partial<CodeExcerpt>) => void;
  removeExcerpt: (id: string) => void;
  assignCodeToExcerpt: (excerptId: string, codeId: string) => void;
  removeCodeFromExcerpt: (excerptId: string, codeId: string) => void;

  // Theme actions
  addTheme: (name: string, color: string, parentId?: string) => Theme;
  updateTheme: (id: string, updates: Partial<Theme>) => void;
  deleteTheme: (id: string) => void;
  addCodeToTheme: (themeId: string, codeId: string) => void;
  removeCodeFromTheme: (themeId: string, codeId: string) => void;
  moveCodeBetweenThemes: (
    codeId: string,
    fromThemeId: string,
    toThemeId: string
  ) => void;

  // Memo actions
  addMemo: (
    content: string,
    targetType: Memo["targetType"],
    targetId: string
  ) => Memo;
  updateMemo: (id: string, content: string) => void;
  deleteMemo: (id: string) => void;

  // UI actions
  setActiveView: (view: QDAState["activeView"]) => void;
  setSelectedExcerpt: (id: string | null) => void;
  setSelectedCode: (id: string | null) => void;
  setSelectedTheme: (id: string | null) => void;
  setCurrentSelection: (selection: TextSelection | null) => void;
  setRightPanelOpen: (open: boolean) => void;

  // Import/Export
  exportProject: () => string;
  importProject: (jsonString: string) => void;
  exportCSV: () => string;

  // Analytics actions
  logAction: (action: AnalyticsAction, details?: AnalyticsLog['details']) => void;
  updateWorkspaceResearchSettings: (updates: Pick<Workspace, 'researchMode' | 'aiEnabled' | 'participantId'>) => void;
  getResearchMetrics: () => ResearchMetrics | null;
  exportResearchData: () => string;
  clearAnalyticsLogs: () => void;
  startSession: () => void;
  endSession: () => void;

  // Helpers
  getCodesByDocument: (documentId: string) => Code[];
  getExcerptsByDocument: (documentId: string) => CodeExcerpt[];
  getExcerptsByCode: (codeId: string) => CodeExcerpt[];
  getChildCodes: (parentId: string) => Code[];
  getCodeFrequency: (codeId: string) => {
    excerptCount: number;
    documentCount: number;
  };
  checkDuplicateCodeName: (name: string, excludeId?: string) => boolean;
}

const CODE_COLORS = {
  main: "#3b82f6",
  child: "#22c55e",
  subchild: "#eab308",
};

const THEME_COLORS = [
  "#ec4899",
  "#8b5cf6",
  "#0ea5e9",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f59e0b",
  "#6366f1",
];

// Helper to sync active study data
const syncActiveStudy = (state: QDAState) => {
  const activeStudy = state.studies.find((s) => s.id === state.activeStudyId);
  if (activeStudy) {
    return {
      documents: activeStudy.documents,
      codes: activeStudy.codes,
      themes: activeStudy.themes,
      excerpts: activeStudy.excerpts,
      memos: activeStudy.memos,
    };
  }
  return {
    documents: [],
    codes: [],
    themes: [],
    excerpts: [],
    memos: [],
  };
};

// Helper to get studies for active workspace
const getWorkspaceStudies = (state: QDAState) => {
  if (!state.activeWorkspaceId) return [];
  const workspace = state.workspaces.find(
    (w) => w.id === state.activeWorkspaceId
  );
  if (!workspace) return [];
  return state.studies.filter((s) => workspace.studyIds.includes(s.id));
};

// Helper to update active study
const updateActiveStudyData = (
  state: QDAState,
  updates: Partial<
    Pick<Study, "documents" | "codes" | "themes" | "excerpts" | "memos">
  >
) => {
  if (!state.activeStudyId) return state;

  const updatedStudies = state.studies.map((study) =>
    study.id === state.activeStudyId
      ? {
          ...study,
          ...updates,
          updatedAt: new Date(),
          lastAccessedAt: new Date(),
        }
      : study
  );

  return {
    studies: updatedStudies,
    ...syncActiveStudy({ ...state, studies: updatedStudies }),
  };
};

export const useQDAStore = create<QDAState>()(
  persist(
    (set, get) => ({
      // Initial state
      workspaces: [],
      activeWorkspaceId: null,
      currentCollaborator: null,
      studies: [],
      activeStudyId: null,
      documents: [],
      codes: [],
      themes: [],
      excerpts: [],
      memos: [],
      activeDocumentId: null,
      activeView: "dashboard",
      selectedExcerptId: null,
      selectedCodeId: null,
      selectedThemeId: null,
      currentSelection: null,
      rightPanelOpen: true,
      deletedCodes: [],
      analyticsLogs: [],
      sessionStartTime: null,

      // Workspace actions
      createWorkspace: (name, collaboratorName) => {
        const generateCode = () =>
          Math.random().toString(36).substring(2, 8).toUpperCase();
        const collaborator: Collaborator = {
          id: uuidv4(),
          name: collaboratorName,
          initials: collaboratorName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2),
          color: THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)],
          joinedAt: new Date(),
          lastActive: new Date(),
        };

        const workspace: Workspace = {
          id: uuidv4(),
          name,
          code: generateCode(),
          createdBy: collaborator.id,
          createdAt: new Date(),
          collaborators: [collaborator],
          studyIds: [],
        };

        set((state) => ({
          workspaces: [...state.workspaces, workspace],
          activeWorkspaceId: workspace.id,
          currentCollaborator: collaborator,
        }));

        return workspace;
      },

      joinWorkspace: (code, collaboratorName) => {
        const workspace = get().workspaces.find(
          (w) => w.code === code.toUpperCase()
        );
        if (!workspace) return null;

        const collaborator: Collaborator = {
          id: uuidv4(),
          name: collaboratorName,
          initials: collaboratorName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2),
          color: THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)],
          joinedAt: new Date(),
          lastActive: new Date(),
        };

        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === workspace.id
              ? { ...w, collaborators: [...w.collaborators, collaborator] }
              : w
          ),
          activeWorkspaceId: workspace.id,
          currentCollaborator: collaborator,
        }));

        return workspace;
      },

      setActiveWorkspace: (id) => {
        set({ activeWorkspaceId: id });
        if (id) {
          // Sync studies for this workspace
          const state = get();
          const filteredStudies = getWorkspaceStudies({
            ...state,
            activeWorkspaceId: id,
          });
          // Clear active study if it doesn't belong to this workspace
          const activeStudyInWorkspace = filteredStudies.find(
            (s) => s.id === state.activeStudyId
          );
          if (!activeStudyInWorkspace) {
            set({
              activeStudyId: null,
              ...syncActiveStudy({ ...state, activeStudyId: null }),
            });
          }
        }
      },

      leaveWorkspace: () => {
        set({
          activeWorkspaceId: null,
          currentCollaborator: null,
          activeStudyId: null,
          ...syncActiveStudy({ ...get(), activeStudyId: null }),
        });
      },

      getActiveWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get();
        return workspaces.find((w) => w.id === activeWorkspaceId) || null;
      },

      clearLegacyStudies: () => {
        // Remove all studies that aren't associated with any workspace
        set((state) => {
          const allWorkspaceStudyIds = new Set(
            state.workspaces.flatMap((w) => w.studyIds)
          );
          const filteredStudies = state.studies.filter((s) =>
            allWorkspaceStudyIds.has(s.id)
          );
          return {
            studies: filteredStudies,
            activeStudyId: filteredStudies.find(
              (s) => s.id === state.activeStudyId
            )
              ? state.activeStudyId
              : null,
            ...syncActiveStudy({ ...state, studies: filteredStudies }),
          };
        });
      },

      getWorkspaceStudies: () => {
        return getWorkspaceStudies(get());
      },

      // Study actions
      createStudy: (data) => {
        const now = new Date();
        const newStudy: Study = {
          ...data,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
          lastAccessedAt: now,
          documents: [],
          codes: [],
          themes: [],
          excerpts: [],
          memos: [],
        };

        set((state) => {
          // Add study ID to active workspace
          const updatedWorkspaces = state.activeWorkspaceId
            ? state.workspaces.map((w) =>
                w.id === state.activeWorkspaceId
                  ? { ...w, studyIds: [...w.studyIds, newStudy.id] }
                  : w
              )
            : state.workspaces;

          return {
            studies: [...state.studies, newStudy],
            activeStudyId: newStudy.id,
            workspaces: updatedWorkspaces,
            ...syncActiveStudy({
              ...state,
              studies: [...state.studies, newStudy],
              activeStudyId: newStudy.id,
            }),
          };
        });
      },

      updateStudy: (id, updates) => {
        set((state) => ({
          studies: state.studies.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
          ),
        }));
      },

      deleteStudy: (id) => {
        set((state) => {
          const newStudies = state.studies.filter((s) => s.id !== id);
          const newActiveId =
            state.activeStudyId === id ? null : state.activeStudyId;
          return {
            studies: newStudies,
            activeStudyId: newActiveId,
            ...syncActiveStudy({
              ...state,
              studies: newStudies,
              activeStudyId: newActiveId,
            }),
          };
        });
      },

      setActiveStudy: (id) => {
        set((state) => {
          // Update last accessed time
          const updatedStudies = state.studies.map((s) =>
            s.id === id ? { ...s, lastAccessedAt: new Date() } : s
          );
          return {
            studies: updatedStudies,
            activeStudyId: id,
            activeView: id ? "documents" : "dashboard",
            ...syncActiveStudy({
              ...state,
              studies: updatedStudies,
              activeStudyId: id,
            }),
          };
        });
      },

      duplicateStudy: (id) => {
        const study = get().studies.find((s) => s.id === id);
        if (!study) return;

        const now = new Date();
        const newStudy: Study = {
          ...study,
          id: uuidv4(),
          title: `${study.title} (Copy)`,
          createdAt: now,
          updatedAt: now,
          lastAccessedAt: now,
          // Deep clone the data arrays
          documents: study.documents.map((d) => ({ ...d, id: uuidv4() })),
          codes: study.codes.map((c) => ({ ...c, id: uuidv4() })),
          themes: study.themes.map((t) => ({ ...t, id: uuidv4() })),
          excerpts: study.excerpts.map((e) => ({ ...e, id: uuidv4() })),
          memos: study.memos.map((m) => ({ ...m, id: uuidv4() })),
        };

        set((state) => ({
          studies: [...state.studies, newStudy],
        }));
      },

      getStudyStatistics: (studyId) => {
        const study = get().studies.find((s) => s.id === studyId);
        if (!study) {
          return {
            studyId,
            documentCount: 0,
            codeCount: 0,
            themeCount: 0,
            excerptCount: 0,
            memoCount: 0,
            codedSegments: 0,
            averageCodesPerDocument: 0,
            recentActivity: new Date(),
          };
        }

        const codedSegments = study.excerpts.length;
        const averageCodesPerDocument =
          study.documents.length > 0
            ? study.excerpts.length / study.documents.length
            : 0;

        // Find most used code
        const codeFrequency = new Map<string, number>();
        study.excerpts.forEach((e) => {
          e.codeIds.forEach((cid) => {
            codeFrequency.set(cid, (codeFrequency.get(cid) || 0) + 1);
          });
        });
        const mostUsedCodeId = Array.from(codeFrequency.entries()).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0];
        const mostUsedCode = study.codes.find(
          (c) => c.id === mostUsedCodeId
        )?.name;

        return {
          studyId,
          documentCount: study.documents.length,
          codeCount: study.codes.length,
          themeCount: study.themes.length,
          excerptCount: study.excerpts.length,
          memoCount: study.memos.length,
          codedSegments,
          averageCodesPerDocument,
          mostUsedCode,
          recentActivity: study.updatedAt,
        };
      },

      // Document actions
      addDocument: (doc) => {
        if (!get().activeStudyId) return {} as QDADocument;

        const newDoc: QDADocument = {
          ...doc,
          id: uuidv4(),
          uploadedAt: new Date(),
          excerpts: [],
        };
        set((state) =>
          updateActiveStudyData(state, {
            documents: [...state.documents, newDoc],
          })
        );
        return newDoc;
      },

      removeDocument: (id) => {
        if (!get().activeStudyId) return;
        set((state) =>
          updateActiveStudyData(state, {
            documents: state.documents.filter((d) => d.id !== id),
            excerpts: state.excerpts.filter((e) => e.documentId !== id),
          })
        );
        set((state) => ({
          activeDocumentId:
            state.activeDocumentId === id ? null : state.activeDocumentId,
        }));
      },

      setActiveDocument: (id) => set({ activeDocumentId: id }),

      // Code actions
      addCode: (name, parentId, level = "main") => {
        if (!get().activeStudyId) return {} as Code;

        const newCode: Code = {
          id: uuidv4(),
          name,
          color: CODE_COLORS[level],
          level,
          parentId,
          excerptIds: [],
          createdAt: new Date(),
          frequency: 0,
          documentCount: 0,
        };
        set((state) =>
          updateActiveStudyData(state, {
            codes: [...state.codes, newCode],
          })
        );
        return newCode;
      },

      updateCode: (id, updates) => {
        if (!get().activeStudyId) return;
        set((state) =>
          updateActiveStudyData(state, {
            codes: state.codes.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
          })
        );
      },

      deleteCode: (id) => {
        if (!get().activeStudyId) return;
        const code = get().codes.find((c) => c.id === id);
        if (code) {
          set((state) => ({
            deletedCodes: [...state.deletedCodes, code],
          }));
          set((state) =>
            updateActiveStudyData(state, {
              codes: state.codes.filter(
                (c) => c.id !== id && c.parentId !== id
              ),
              excerpts: state.excerpts.map((e) => ({
                ...e,
                codeIds: e.codeIds.filter((cid) => cid !== id),
              })),
              themes: state.themes.map((t) => ({
                ...t,
                codeIds: t.codeIds.filter((cid) => cid !== id),
              })),
            })
          );
        }
      },

      undoDeleteCode: () => {
        if (!get().activeStudyId) return null;
        const { deletedCodes } = get();
        if (deletedCodes.length === 0) return null;
        const lastDeleted = deletedCodes[deletedCodes.length - 1];
        set((state) => ({
          deletedCodes: state.deletedCodes.slice(0, -1),
        }));
        set((state) =>
          updateActiveStudyData(state, {
            codes: [...state.codes, lastDeleted],
          })
        );
        return lastDeleted;
      },

      mergeCodes: (sourceId, targetId) => {
        if (!get().activeStudyId) return;
        const source = get().codes.find((c) => c.id === sourceId);
        const target = get().codes.find((c) => c.id === targetId);
        if (!source || !target) return;

        // Update excerpts to point to target code
        const updatedExcerpts = get().excerpts.map((e) => ({
          ...e,
          codeIds: e.codeIds.includes(sourceId)
            ? [
                ...new Set([
                  ...e.codeIds.filter((id) => id !== sourceId),
                  targetId,
                ]),
              ]
            : e.codeIds,
        }));

        // Merge excerptIds and calculate new stats
        const mergedExcerptIds = [
          ...new Set([...target.excerptIds, ...source.excerptIds]),
        ];
        const relevantExcerpts = updatedExcerpts.filter((e) =>
          mergedExcerptIds.includes(e.id)
        );
        const uniqueDocIds = new Set(relevantExcerpts.map((e) => e.documentId));

        set((state) =>
          updateActiveStudyData(state, {
            codes: state.codes
              .map((c) =>
                c.id === targetId
                  ? {
                      ...c,
                      excerptIds: mergedExcerptIds,
                      frequency: mergedExcerptIds.length,
                      documentCount: uniqueDocIds.size,
                    }
                  : c
              )
              .filter((c) => c.id !== sourceId),
            excerpts: updatedExcerpts,
          })
        );
      },

      renameCode: (id, name) => {
        if (!get().activeStudyId) return;
        if (get().checkDuplicateCodeName(name, id)) return;
        set((state) =>
          updateActiveStudyData(state, {
            codes: state.codes.map((c) => (c.id === id ? { ...c, name } : c)),
          })
        );
      },

      // Excerpt actions
      addExcerpt: (selection, codeIds, memo) => {
        if (!get().activeStudyId) return {} as CodeExcerpt;

        const startTime = Date.now();
        const newExcerpt: CodeExcerpt = {
          id: uuidv4(),
          text: selection.text,
          documentId: selection.documentId,
          startOffset: selection.startOffset,
          endOffset: selection.endOffset,
          codeIds,
          memo,
          createdAt: new Date(),
        };

        set((state) => {
          const updatedCodes = state.codes.map((code) => {
            if (codeIds.includes(code.id)) {
              const newExcerptIds = [...code.excerptIds, newExcerpt.id];
              const docIds = new Set(
                [...state.excerpts, newExcerpt]
                  .filter((e) => newExcerptIds.includes(e.id))
                  .map((e) => e.documentId)
              );
              return {
                ...code,
                excerptIds: newExcerptIds,
                frequency: newExcerptIds.length,
                documentCount: docIds.size,
              };
            }
            return code;
          });

          return updateActiveStudyData(state, {
            excerpts: [...state.excerpts, newExcerpt],
            codes: updatedCodes,
          });
        });

        // Log the action
        get().logAction('excerpt_created', {
          documentId: selection.documentId,
          excerptId: newExcerpt.id,
          excerptText: selection.text.substring(0, 100), // First 100 chars
          excerptLength: selection.text.length,
          duration: Date.now() - startTime,
        });

        // Log each code application
        codeIds.forEach(codeId => {
          const code = get().codes.find(c => c.id === codeId);
          get().logAction('code_applied', {
            excerptId: newExcerpt.id,
            codeId,
            codeName: code?.name,
          });
        });

        set({ currentSelection: null });
        return newExcerpt;
      },

      updateExcerpt: (id, updates) => {
        if (!get().activeStudyId) return;
        set((state) =>
          updateActiveStudyData(state, {
            excerpts: state.excerpts.map((e) =>
              e.id === id ? { ...e, ...updates } : e
            ),
          })
        );
      },

      removeExcerpt: (id) => {
        if (!get().activeStudyId) return;
        const excerpt = get().excerpts.find((e) => e.id === id);
        if (!excerpt) return;

        set((state) =>
          updateActiveStudyData(state, {
            excerpts: state.excerpts.filter((e) => e.id !== id),
            codes: state.codes.map((code) => {
              if (excerpt.codeIds.includes(code.id)) {
                const newExcerptIds = code.excerptIds.filter(
                  (eid) => eid !== id
                );
                const docIds = new Set(
                  state.excerpts
                    .filter((e) => newExcerptIds.includes(e.id))
                    .map((e) => e.documentId)
                );
                return {
                  ...code,
                  excerptIds: newExcerptIds,
                  frequency: newExcerptIds.length,
                  documentCount: docIds.size,
                };
              }
              return code;
            }),
          })
        );
      },

      assignCodeToExcerpt: (excerptId, codeId) => {
        if (!get().activeStudyId) return;
        set((state) => {
          const excerpt = state.excerpts.find((e) => e.id === excerptId);
          if (!excerpt || excerpt.codeIds.includes(codeId)) return state;

          const updatedExcerpts = state.excerpts.map((e) =>
            e.id === excerptId ? { ...e, codeIds: [...e.codeIds, codeId] } : e
          );

          const updatedCodes = state.codes.map((code) => {
            if (code.id === codeId) {
              const newExcerptIds = [...code.excerptIds, excerptId];
              const docIds = new Set(
                updatedExcerpts
                  .filter((e) => newExcerptIds.includes(e.id))
                  .map((e) => e.documentId)
              );
              return {
                ...code,
                excerptIds: newExcerptIds,
                frequency: newExcerptIds.length,
                documentCount: docIds.size,
              };
            }
            return code;
          });

          return updateActiveStudyData(state, {
            excerpts: updatedExcerpts,
            codes: updatedCodes,
          });
        });
      },

      removeCodeFromExcerpt: (excerptId, codeId) => {
        if (!get().activeStudyId) return;
        set((state) => {
          const updatedExcerpts = state.excerpts.map((e) =>
            e.id === excerptId
              ? { ...e, codeIds: e.codeIds.filter((id) => id !== codeId) }
              : e
          );

          const updatedCodes = state.codes.map((code) => {
            if (code.id === codeId) {
              const newExcerptIds = code.excerptIds.filter(
                (eid) => eid !== excerptId
              );
              const docIds = new Set(
                updatedExcerpts
                  .filter((e) => newExcerptIds.includes(e.id))
                  .map((e) => e.documentId)
              );
              return {
                ...code,
                excerptIds: newExcerptIds,
                frequency: newExcerptIds.length,
                documentCount: docIds.size,
              };
            }
            return code;
          });

          return updateActiveStudyData(state, {
            excerpts: updatedExcerpts,
            codes: updatedCodes,
          });
        });
      },

      // Theme actions
      addTheme: (name, color, parentId) => {
        if (!get().activeStudyId) return {} as Theme;
        const newTheme: Theme = {
          id: uuidv4(),
          name,
          color:
            color || THEME_COLORS[get().themes.length % THEME_COLORS.length],
          codeIds: [],
          parentId,
          createdAt: new Date(),
        };
        set((state) =>
          updateActiveStudyData(state, {
            themes: [...state.themes, newTheme],
          })
        );
        return newTheme;
      },

      updateTheme: (id, updates) => {
        if (!get().activeStudyId) return;
        set((state) =>
          updateActiveStudyData(state, {
            themes: state.themes.map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
          })
        );
      },

      deleteTheme: (id) => {
        if (!get().activeStudyId) return;
        set((state) =>
          updateActiveStudyData(state, {
            themes: state.themes.filter(
              (t) => t.id !== id && t.parentId !== id
            ),
          })
        );
      },

      addCodeToTheme: (themeId, codeId) => {
        if (!get().activeStudyId) return;
        set((state) =>
          updateActiveStudyData(state, {
            themes: state.themes.map((t) =>
              t.id === themeId && !t.codeIds.includes(codeId)
                ? { ...t, codeIds: [...t.codeIds, codeId] }
                : t
            ),
          })
        );
      },

      removeCodeFromTheme: (themeId, codeId) => {
        if (!get().activeStudyId) return;
        set((state) =>
          updateActiveStudyData(state, {
            themes: state.themes.map((t) =>
              t.id === themeId
                ? { ...t, codeIds: t.codeIds.filter((id) => id !== codeId) }
                : t
            ),
          })
        );
      },

      moveCodeBetweenThemes: (codeId, fromThemeId, toThemeId) => {
        if (!get().activeStudyId) return;
        set((state) =>
          updateActiveStudyData(state, {
            themes: state.themes.map((t) => {
              if (t.id === fromThemeId) {
                return {
                  ...t,
                  codeIds: t.codeIds.filter((id) => id !== codeId),
                };
              }
              if (t.id === toThemeId && !t.codeIds.includes(codeId)) {
                return { ...t, codeIds: [...t.codeIds, codeId] };
              }
              return t;
            }),
          })
        );
      },

      // Memo actions
      addMemo: (content, targetType, targetId) => {
        if (!get().activeStudyId) return {} as Memo;
        const newMemo: Memo = {
          id: uuidv4(),
          content,
          targetType,
          targetId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) =>
          updateActiveStudyData(state, {
            memos: [...state.memos, newMemo],
          })
        );
        return newMemo;
      },

      updateMemo: (id, content) => {
        if (!get().activeStudyId) return;
        set((state) =>
          updateActiveStudyData(state, {
            memos: state.memos.map((m) =>
              m.id === id ? { ...m, content, updatedAt: new Date() } : m
            ),
          })
        );
      },

      deleteMemo: (id) => {
        if (!get().activeStudyId) return;
        set((state) =>
          updateActiveStudyData(state, {
            memos: state.memos.filter((m) => m.id !== id),
          })
        );
      },

      // UI actions
      setActiveView: (view) => set({ activeView: view }),
      setSelectedExcerpt: (id) => set({ selectedExcerptId: id }),
      setSelectedCode: (id) => set({ selectedCodeId: id }),
      setSelectedTheme: (id) => set({ selectedThemeId: id }),
      setCurrentSelection: (selection) => set({ currentSelection: selection }),
      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

      // Import/Export
      exportProject: () => {
        const state = get();
        const project = {
          exportedAt: new Date().toISOString(),
          documents: state.documents,
          codes: state.codes,
          themes: state.themes,
          excerpts: state.excerpts,
          memos: state.memos,
        };
        return JSON.stringify(project, null, 2);
      },

      importProject: (jsonString) => {
        try {
          const project = JSON.parse(jsonString);
          set({
            documents: project.documents || [],
            codes: project.codes || [],
            themes: project.themes || [],
            excerpts: project.excerpts || [],
            memos: project.memos || [],
            activeDocumentId: null,
            selectedExcerptId: null,
            selectedCodeId: null,
            selectedThemeId: null,
          });
        } catch (error) {
          console.error("Failed to import project:", error);
        }
      },

      exportCSV: () => {
        const state = get();
        const lines = ["Code,Frequency,Document Count,Level,Parent"];
        state.codes.forEach((code) => {
          const parent = code.parentId
            ? state.codes.find((c) => c.id === code.parentId)?.name || ""
            : "";
          lines.push(
            `"${code.name}",${code.frequency},${code.documentCount},${code.level},"${parent}"`
          );
        });
        return lines.join("\n");
      },

      // Helpers
      getCodesByDocument: (documentId) => {
        const state = get();
        const docExcerpts = state.excerpts.filter(
          (e) => e.documentId === documentId
        );
        const codeIds = new Set(docExcerpts.flatMap((e) => e.codeIds));
        return state.codes.filter((c) => codeIds.has(c.id));
      },

      getExcerptsByDocument: (documentId) => {
        return get().excerpts.filter((e) => e.documentId === documentId);
      },

      getExcerptsByCode: (codeId) => {
        return get().excerpts.filter((e) => e.codeIds.includes(codeId));
      },

      getChildCodes: (parentId) => {
        return get().codes.filter((c) => c.parentId === parentId);
      },

      getCodeFrequency: (codeId) => {
        const code = get().codes.find((c) => c.id === codeId);
        return {
          excerptCount: code?.frequency || 0,
          documentCount: code?.documentCount || 0,
        };
      },

      checkDuplicateCodeName: (name, excludeId) => {
        return get().codes.some(
          (c) =>
            c.name.toLowerCase() === name.toLowerCase() && c.id !== excludeId
        );
      },

      // Analytics actions
      logAction: (action, details = {}) => {
        const state = get();
        const workspace = state.workspaces.find(w => w.id === state.activeWorkspaceId);
        
        // Only log if workspace is in research mode
        if (!workspace?.researchMode) return;

        const log: AnalyticsLog = {
          id: uuidv4(),
          timestamp: new Date(),
          workspaceId: state.activeWorkspaceId || '',
          participantId: workspace.participantId,
          action,
          details: {
            ...details,
            studyId: state.activeStudyId || undefined,
          },
        };

        set({ analyticsLogs: [...state.analyticsLogs, log] });
      },

      updateWorkspaceResearchSettings: (updates) => {
        const state = get();
        const updatedWorkspaces = state.workspaces.map(w =>
          w.id === state.activeWorkspaceId
            ? { ...w, ...updates }
            : w
        );
        set({ workspaces: updatedWorkspaces });
      },

      getResearchMetrics: () => {
        const state = get();
        const workspace = state.workspaces.find(w => w.id === state.activeWorkspaceId);
        
        if (!workspace?.researchMode || !workspace.participantId) return null;

        const logs = state.analyticsLogs.filter(
          log => log.workspaceId === state.activeWorkspaceId
        );

        const excerptCreated = logs.filter(l => l.action === 'excerpt_created');
        const aiRequested = logs.filter(l => l.action === 'ai_suggestion_requested');
        const aiAccepted = logs.filter(l => l.action === 'ai_suggestion_accepted');
        const aiRejected = logs.filter(l => l.action === 'ai_suggestion_rejected');
        
        const sessionStart = logs.find(l => l.action === 'session_started');
        const sessionEnd = logs.find(l => l.action === 'session_ended');
        
        // Handle dates that might be strings from localStorage
        const startTime = sessionStart?.timestamp 
          ? new Date(sessionStart.timestamp)
          : state.sessionStartTime 
          ? new Date(state.sessionStartTime)
          : new Date();
        const endTime = sessionEnd?.timestamp ? new Date(sessionEnd.timestamp) : null;
        const totalTime = endTime 
          ? endTime.getTime() - startTime.getTime()
          : Date.now() - startTime.getTime();

        const uniqueCodes = new Set(state.codes.map(c => c.id)).size;
        const totalExcerpts = state.excerpts.length;
        const totalCodes = state.codes.length;
        const totalTextCoded = state.excerpts.reduce((sum, e) => sum + (e.text?.length || 0), 0);

        const metrics: ResearchMetrics = {
          participantId: workspace.participantId,
          workspaceId: workspace.id,
          startTime,
          endTime,
          totalExcerpts,
          totalCodes,
          uniqueCodes,
          averageCodesPerExcerpt: totalExcerpts > 0 ? totalCodes / totalExcerpts : 0,
          codingSpeed: totalTime > 0 ? (totalExcerpts / (totalTime / 3600000)) : 0, // per hour
          aiSuggestionsRequested: aiRequested.length,
          aiSuggestionsAccepted: aiAccepted.length,
          aiSuggestionsRejected: aiRejected.length,
          aiAcceptanceRate: aiRequested.length > 0 
            ? aiAccepted.length / aiRequested.length
            : 0,
          totalActiveTime: totalTime,
          averageTimePerExcerpt: totalExcerpts > 0 ? totalTime / totalExcerpts : 0,
          documentsProcessed: new Set(state.excerpts.map(e => e.documentId)).size,
          totalTextCoded,
        };

        return metrics;
      },

      exportResearchData: () => {
        const state = get();
        const metrics = get().getResearchMetrics();
        const workspace = state.workspaces.find(w => w.id === state.activeWorkspaceId);

        const csvLines = [
          // Header
          'Timestamp,Participant ID,Action,Document ID,Excerpt ID,Code ID,Code Name,AI Suggestion,AI Accepted,Duration,Excerpt Length',
        ];

        // Add each log entry
        state.analyticsLogs
          .filter(log => log.workspaceId === state.activeWorkspaceId)
          .forEach(log => {
            const row = [
              new Date(log.timestamp).toISOString(),
              log.participantId || '',
              log.action,
              log.details.documentId || '',
              log.details.excerptId || '',
              log.details.codeId || '',
              log.details.codeName || '',
              log.details.aiSuggestion || '',
              log.details.suggestionAccepted !== undefined ? log.details.suggestionAccepted : '',
              log.details.duration || '',
              log.details.excerptLength || '',
            ];
            csvLines.push(row.map(v => `"${v}"`).join(','));
          });

        // Add summary metrics
        if (metrics) {
          csvLines.push('');
          csvLines.push('SUMMARY METRICS');
          csvLines.push(`Participant ID,"${metrics.participantId}"`);
          csvLines.push(`Total Excerpts,${metrics.totalExcerpts}`);
          csvLines.push(`Total Codes,${metrics.totalCodes}`);
          csvLines.push(`Unique Codes,${metrics.uniqueCodes}`);
          csvLines.push(`Coding Speed (per hour),${metrics.codingSpeed.toFixed(2)}`);
          csvLines.push(`AI Enabled,${workspace?.aiEnabled ? 'Yes' : 'No'}`);
          csvLines.push(`AI Suggestions Requested,${metrics.aiSuggestionsRequested}`);
          csvLines.push(`AI Suggestions Accepted,${metrics.aiSuggestionsAccepted}`);
          csvLines.push(`AI Acceptance Rate,${(metrics.aiAcceptanceRate * 100).toFixed(1)}%`);
          csvLines.push(`Total Active Time (minutes),${(metrics.totalActiveTime / 60000).toFixed(2)}`);
          csvLines.push(`Average Time Per Excerpt (seconds),${(metrics.averageTimePerExcerpt / 1000).toFixed(2)}`);
          csvLines.push(`Documents Processed,${metrics.documentsProcessed}`);
          csvLines.push(`Total Text Coded (characters),${metrics.totalTextCoded}`);
        }

        return csvLines.join('\n');
      },

      clearAnalyticsLogs: () => {
        set({ analyticsLogs: [], sessionStartTime: null });
      },

      startSession: () => {
        const state = get();
        const workspace = state.workspaces.find(w => w.id === state.activeWorkspaceId);
        if (workspace?.researchMode) {
          set({ sessionStartTime: new Date() });
          get().logAction('session_started');
        }
      },

      endSession: () => {
        get().logAction('session_ended');
      },
    }),
    {
      name: "qda-storage",
      partialize: (state) => ({
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        currentCollaborator: state.currentCollaborator,
        studies: state.studies,
        activeStudyId: state.activeStudyId,
        analyticsLogs: state.analyticsLogs,
        sessionStartTime: state.sessionStartTime,
      }),
    }
  )
);
