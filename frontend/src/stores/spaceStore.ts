import { create } from 'zustand';

export type SpaceTab = 'personal' | 'team';

export interface TreeNode {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  hasKO?: boolean;
  hasEN?: boolean;
  hasCN?: boolean;
}

interface SpaceState {
  // Current active tab
  activeTab: SpaceTab;
  setActiveTab: (tab: SpaceTab) => void;

  // Tree data
  personalTree: TreeNode[];
  teamTree: TreeNode[];
  setPersonalTree: (tree: TreeNode[]) => void;
  setTeamTree: (tree: TreeNode[]) => void;

  // Selected file
  selectedFileId: string | null;
  setSelectedFileId: (id: string | null) => void;

  // Expanded folders
  expandedFolders: Set<string>;
  toggleFolder: (id: string) => void;
  expandFolder: (id: string) => void;
  collapseFolder: (id: string) => void;

  // Loading states
  isLoadingPersonal: boolean;
  isLoadingTeam: boolean;
  setIsLoadingPersonal: (loading: boolean) => void;
  setIsLoadingTeam: (loading: boolean) => void;

  // Refresh triggers
  refreshKey: number;
  refresh: () => void;
}

export const useSpaceStore = create<SpaceState>((set) => ({
  activeTab: 'personal',
  setActiveTab: (tab) => set({ activeTab: tab }),

  personalTree: [],
  teamTree: [],
  setPersonalTree: (tree) => set({ personalTree: tree }),
  setTeamTree: (tree) => set({ teamTree: tree }),

  selectedFileId: null,
  setSelectedFileId: (id) => set({ selectedFileId: id }),

  expandedFolders: new Set(),
  toggleFolder: (id) =>
    set((state) => {
      const newSet = new Set(state.expandedFolders);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { expandedFolders: newSet };
    }),
  expandFolder: (id) =>
    set((state) => {
      const newSet = new Set(state.expandedFolders);
      newSet.add(id);
      return { expandedFolders: newSet };
    }),
  collapseFolder: (id) =>
    set((state) => {
      const newSet = new Set(state.expandedFolders);
      newSet.delete(id);
      return { expandedFolders: newSet };
    }),

  isLoadingPersonal: false,
  isLoadingTeam: false,
  setIsLoadingPersonal: (loading) => set({ isLoadingPersonal: loading }),
  setIsLoadingTeam: (loading) => set({ isLoadingTeam: loading }),

  refreshKey: 0,
  refresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}));
