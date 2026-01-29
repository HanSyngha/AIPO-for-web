import { create } from 'zustand';

export interface User {
  id: string;
  loginid: string;
  username: string;
  deptname: string;
  businessUnit: string;
  createdAt?: string;
  lastActive?: string;
}

export interface Spaces {
  personalSpaceId: string | null;
  teamSpaceId: string | null;
  teamId: string | null;
  teamName?: string | null;
}

export interface AuthState {
  user: (User & { isSuperAdmin: boolean; isTeamAdmin: boolean; spaces: Spaces }) | null;
  isLoading: boolean;
  setUser: (data: any) => void;
  clearUser: () => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (data) => {
    set({
      user: {
        id: data.user.id,
        loginid: data.user.loginid,
        username: data.user.username,
        deptname: data.user.deptname,
        businessUnit: data.user.businessUnit,
        createdAt: data.user.createdAt,
        lastActive: data.user.lastActive,
        isSuperAdmin: data.isSuperAdmin || false,
        isTeamAdmin: data.isTeamAdmin || false,
        spaces: data.spaces || {
          personalSpaceId: null,
          teamSpaceId: null,
          teamId: null,
          teamName: null,
        },
      },
    });
  },

  clearUser: () => {
    localStorage.removeItem('once_token');
    set({ user: null });
  },

  setIsLoading: (loading) => set({ isLoading: loading }),
}));
