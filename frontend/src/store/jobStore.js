import { create } from 'zustand';
import { getJobs } from '../services/api';

const DEFAULT_FILTERS = {
  title: '',
  skills: [],
  datePosted: 'anytime',
  jobType: [],
  workMode: [],
  location: '',
  matchScore: 'all',
  skillsOnly: false,
};

// Pagination batches: first load 20, then load 20 more, then 10
const BATCH_SIZES = [20, 20, 10];

export const useJobStore = create((set, get) => ({
  jobs: [],
  bestMatches: [],
  total: 0,
  loading: false,
  loadingmore: false,
  error: null,
  filters: { ...DEFAULT_FILTERS },
  currentBatchIndex: 0, // Track which batch we're on
  allJobsCache: [], // Store all jobs to avoid re-fetching

  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),

  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  applyQuickFilter: (filter) => {
    const { name, value } = filter;
    // Toggle quick filters
    const current = get().filters[name];
    if (Array.isArray(current)) {
      const already = current.includes(value);
      set((state) => ({
        filters: {
          ...state.filters,
          [name]: already ? current.filter((v) => v !== value) : [...current, value],
        },
      }));
    } else {
      set((state) => ({
        filters: {
          ...state.filters,
          [name]: current === value ? (name === 'matchScore' ? 'all' : 'anytime') : value,
        },
      }));
    }
  },

  fetchJobs: async () => {
    const { filters } = get();
    set({ loading: true, loadingmore: false, error: null, currentBatchIndex: 0 });
    try {
      const params = {};
      if (filters.title) params.title = filters.title;
      if (filters.skills?.length) params.skills = filters.skills.join(',');
      if (filters.datePosted && filters.datePosted !== 'anytime')
        params.datePosted = filters.datePosted;
      if (filters.jobType?.length) params.jobType = filters.jobType.join(',');
      if (filters.workMode?.length) params.workMode = filters.workMode.join(',');
      if (filters.location) params.location = filters.location;
      if (filters.matchScore && filters.matchScore !== 'all')
        params.matchScore = filters.matchScore;
      if (filters.skillsOnly) params.skillsOnly = 'true';
      params.limit = 50; // Request more from backend to cache

      const res = await getJobs(params);
      const allJobs = res.data.jobs;
      const batchSize = BATCH_SIZES[0] || 20;

      set({
        allJobsCache: allJobs,
        jobs: allJobs.slice(0, batchSize),
        bestMatches: res.data.bestMatches.slice(0, batchSize),
        total: res.data.total,
        loading: false,
        currentBatchIndex: 0,
      });

      // Auto-load remaining batches
      setTimeout(() => get().loadNextBatch(), 100);
    } catch (err) {
      set({ loading: false, error: err.message || 'Failed to load jobs' });
    }
  },

  loadNextBatch: async () => {
    const state = get();
    const { currentBatchIndex, allJobsCache, bestMatches } = state;
    
    // Don't load more if we're at or past the last batch
    if (currentBatchIndex >= BATCH_SIZES.length - 1) return;

    const nextIndex = currentBatchIndex + 1;
    const batchSize = BATCH_SIZES[nextIndex];
    
    // Calculate how many jobs to show (cumulative)
    const totalJobsToShow = BATCH_SIZES.slice(0, nextIndex + 1).reduce((a, b) => a + b, 0);

    if (totalJobsToShow > allJobsCache.length) return; // No more jobs to load

    set({
      loadingmore: true,
      jobs: allJobsCache.slice(0, totalJobsToShow),
      bestMatches: bestMatches, // Keep same best matches
      currentBatchIndex: nextIndex,
    });

    // Auto-load next batch after a delay
    if (nextIndex < BATCH_SIZES.length - 1) {
      setTimeout(() => get().loadNextBatch(), 800);
    } else {
      set({ loadingmore: false });
    }
  },

  loadMoreManual: async () => {
    await get().loadNextBatch();
  },
}));
