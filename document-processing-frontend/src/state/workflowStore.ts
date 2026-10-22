import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ContractDocumentSelection, SourceSelection, Task } from '../domain/models';

type WorkflowState = {
  workflowId?: string;
  sourceSelection?: SourceSelection;
  intakeTask?: Task;
  selections: ContractDocumentSelection[];
  processingTasks: Task[];
  selectedContractId?: string;
  selectedDocumentId?: string;
  selectedPage: number;
  navigation: 'source' | 'documents' | 'results';
  notice?: string;
  setSourceSelection: (source: SourceSelection) => void;
  setIntakeTask: (task: Task) => void;
  completeIntake: (workflowId: string) => void;
  setSelections: (selections: ContractDocumentSelection[]) => void;
  setProcessingTasks: (tasks: Task[]) => void;
  updateProcessingTask: (task: Task) => void;
  selectResult: (contractId: string, documentId: string, page?: number) => void;
  setSelectedPage: (page: number) => void;
  setNavigation: (navigation: WorkflowState['navigation']) => void;
  setNotice: (notice?: string) => void;
  reset: () => void;
};

const initialState = {
  selections: [],
  processingTasks: [],
  selectedPage: 1,
  navigation: 'source' as const,
};

function persistedTaskReference(task: Task): Task {
  return {
    taskId: task.taskId,
    stage: task.stage,
    status: task.status,
    contractId: task.contractId,
    documentIds: task.documentIds,
    workflowId: task.workflowId,
  };
}

export const useWorkflowStore = create<WorkflowState>()(persist((set) => ({
  ...initialState,
  setSourceSelection: (sourceSelection) => set({ sourceSelection }),
  setIntakeTask: (intakeTask) => set({ intakeTask }),
  completeIntake: (workflowId) => set({ workflowId, navigation: 'documents' }),
  setSelections: (selections) => set({ selections }),
  setProcessingTasks: (processingTasks) => set({ processingTasks }),
  updateProcessingTask: (task) => set((state) => ({
    processingTasks: state.processingTasks.some((item) => item.taskId === task.taskId)
      ? state.processingTasks.map((item) => item.taskId === task.taskId ? task : item)
      : [...state.processingTasks, task],
  })),
  selectResult: (selectedContractId, selectedDocumentId, selectedPage = 1) => set({ selectedContractId, selectedDocumentId, selectedPage }),
  setSelectedPage: (selectedPage) => set({ selectedPage }),
  setNavigation: (navigation) => set({ navigation }),
  setNotice: (notice) => set({ notice }),
  reset: () => set({ ...initialState, sourceSelection: undefined, intakeTask: undefined, workflowId: undefined, selectedContractId: undefined, selectedDocumentId: undefined, notice: undefined }),
}), {
  name: 'document-workflow-v1',
  storage: createJSONStorage(() => sessionStorage),
  partialize: (state) => ({
    workflowId: state.workflowId,
    intakeTask: state.intakeTask ? persistedTaskReference(state.intakeTask) : undefined,
    selections: state.selections,
    processingTasks: state.processingTasks.map(persistedTaskReference),
    selectedContractId: state.selectedContractId,
    selectedDocumentId: state.selectedDocumentId,
    selectedPage: state.selectedPage,
    navigation: state.navigation,
  }),
}));
