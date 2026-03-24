import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getApplications, createApplication, updateApplication, deleteApplication } from '../services/api';

export const useApplicationStore = create(
  persist(
    (set, get) => ({
      applications: [],
      pendingApply: null, // { jobId, jobTitle, company, location, applyUrl }
      loading: false,

      // Set a pending apply (when user clicks Apply)
      setPendingApply: (jobData) => set({ pendingApply: jobData }),
      clearPendingApply: () => set({ pendingApply: null }),

      fetchApplications: async () => {
        set({ loading: true });
        try {
          const res = await getApplications();
          set({ applications: res.data.applications, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      addApplication: async (jobData, appliedAt) => {
        const res = await createApplication({ ...jobData, appliedAt });
        const newApp = res.data.application;
        set((state) => ({
          applications: [newApp, ...state.applications.filter((a) => a.id !== newApp.id)],
        }));
        return newApp;
      },

      updateStatus: async (id, status, note, timestamp) => {
        const res = await updateApplication(id, { status, note, timestamp });
        const updated = res.data.application;
        set((state) => ({
          applications: state.applications.map((a) => (a.id === id ? updated : a)),
        }));
        return updated;
      },

      removeApplication: async (id) => {
        await deleteApplication(id);
        set((state) => ({
          applications: state.applications.filter((a) => a.id !== id),
        }));
      },

      isApplied: (jobId) => {
        return get().applications.some((a) => a.jobId === jobId);
      },
    }),
    {
      name: 'jt-applications',
      partialize: (state) => ({ applications: state.applications }),
    }
  )
);
