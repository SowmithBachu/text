import { create } from 'zustand';
import { EditorState, EditorAction, Image, TextOverlay } from '@/types';

interface EditorStore extends EditorState {
  // Actions
  setSelectedImage: (image: Image | null) => void;
  setSelectedTextOverlay: (overlay: TextOverlay | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  addTextOverlay: (overlay: TextOverlay) => void;
  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  deleteTextOverlay: (id: string) => void;
  moveTextOverlay: (id: string, position: { x: number; y: number }) => void;
  addAction: (action: Omit<EditorAction, 'id' | 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  setDirty: (dirty: boolean) => void;
  reset: () => void;
}

const initialState: EditorState = {
  selectedImage: null,
  selectedTextOverlay: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  history: [],
  historyIndex: -1,
  isDirty: false,
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,

  setSelectedImage: (image) => {
    set({ selectedImage: image, selectedTextOverlay: null });
  },

  setSelectedTextOverlay: (overlay) => {
    set({ selectedTextOverlay: overlay });
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.1, Math.min(5, zoom)) });
  },

  setPan: (pan) => {
    set({ pan });
  },

  addTextOverlay: (overlay) => {
    const { selectedImage, history, historyIndex } = get();
    if (!selectedImage) return;

    const newHistory = history.slice(0, historyIndex + 1);
    const action: EditorAction = {
      id: `action_${Date.now()}`,
      type: 'add_text',
      data: { overlay },
      timestamp: new Date(),
    };

    set({
      history: [...newHistory, action],
      historyIndex: historyIndex + 1,
      isDirty: true,
    });
  },

  updateTextOverlay: (id, updates) => {
    const { selectedImage, history, historyIndex } = get();
    if (!selectedImage) return;

    const newHistory = history.slice(0, historyIndex + 1);
    const action: EditorAction = {
      id: `action_${Date.now()}`,
      type: 'edit_text',
      data: { id, updates },
      timestamp: new Date(),
    };

    set({
      history: [...newHistory, action],
      historyIndex: historyIndex + 1,
      isDirty: true,
    });
  },

  deleteTextOverlay: (id) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    const action: EditorAction = {
      id: `action_${Date.now()}`,
      type: 'delete_text',
      data: { id },
      timestamp: new Date(),
    };

    set({
      history: [...newHistory, action],
      historyIndex: historyIndex + 1,
      isDirty: true,
    });
  },

  moveTextOverlay: (id, position) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    const action: EditorAction = {
      id: `action_${Date.now()}`,
      type: 'move_text',
      data: { id, position },
      timestamp: new Date(),
    };

    set({
      history: [...newHistory, action],
      historyIndex: historyIndex + 1,
      isDirty: true,
    });
  },

  addAction: (actionData) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    const action: EditorAction = {
      id: `action_${Date.now()}`,
      ...actionData,
      timestamp: new Date(),
    };

    set({
      history: [...newHistory, action],
      historyIndex: historyIndex + 1,
      isDirty: true,
    });
  },

  undo: () => {
    const { historyIndex } = get();
    if (historyIndex > 0) {
      set({ historyIndex: historyIndex - 1, isDirty: true });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({ historyIndex: historyIndex + 1, isDirty: true });
    }
  },

  clearHistory: () => {
    set({ history: [], historyIndex: -1, isDirty: false });
  },

  setDirty: (dirty) => {
    set({ isDirty: dirty });
  },

  reset: () => {
    set(initialState);
  },
})); 