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
  filteredCache: [], // Store the jobs after local filters are applied

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
        filteredCache: allJobs,
        jobs: allJobs.slice(0, batchSize),
        bestMatches: res.data.bestMatches.slice(0, batchSize),
        total: res.data.total,
        loading: false,
        currentBatchIndex: 0,
      });

      // Auto-load remaining batches
      setTimeout(() => get().applyLocalFilters(), 100);
    } catch (err) {
      set({ loading: false, error: err.message || 'Failed to load jobs' });
    }
  },

  applyLocalFilters: () => {
    const { filters, allJobsCache } = get();
    let result = [...allJobsCache];
    
    // Title/Search
    if (filters.title) {
      const q = filters.title.toLowerCase();
      result = result.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.company.toLowerCase().includes(q) || 
        (j.description || '').toLowerCase().includes(q)
      );
    }
    
    // Skills
    if (filters.skills?.length) {
      const required = filters.skills.map(s => s.toLowerCase());
      result = result.filter(j => 
        required.some(rs => (j.skills || []).some(js => js.toLowerCase().includes(rs)))
      );
    }
    
    // Date Posted
    if (filters.datePosted && filters.datePosted !== 'anytime') {
      const now = new Date();
      const cutoff = new Date();
      if (filters.datePosted === '24h') cutoff.setDate(now.getDate() - 1);
      else if (filters.datePosted === 'week') cutoff.setDate(now.getDate() - 7);
      else if (filters.datePosted === 'month') cutoff.setMonth(now.getMonth() - 1);
      result = result.filter(j => new Date(j.postedAt) >= cutoff);
    }
    
    // Job Type
    if (filters.jobType?.length) {
      const types = filters.jobType.map(t => t.toLowerCase());
      result = result.filter(j => types.some(t => (j.jobType || '').toLowerCase().includes(t)));
    }
    
    // Work Mode
    if (filters.workMode?.length) {
      const modes = filters.workMode.map(m => m.toLowerCase());
      result = result.filter(j => modes.some(m => (j.workMode || '').toLowerCase().includes(m)));
    }
    
    // Location
    if (filters.location) {
      const locNames = filters.location.split(',').map(l => l.trim().toLowerCase()).filter(Boolean);
      result = result.filter(j => locNames.some(loc => (j.location || '').toLowerCase().includes(loc)));
    }
    
    // Match Score
    if (filters.matchScore && filters.matchScore !== 'all') {
      if (filters.matchScore === 'high') result = result.filter(j => (j.match_score || 0) > 70);
      else if (filters.matchScore === 'medium') result = result.filter(j => (j.match_score || 0) >= 40 && (j.match_score || 0) <= 70);
      else if (filters.matchScore === 'low') result = result.filter(j => (j.match_score || 0) < 40);
    }
    
    // Skills Only
    if (filters.skillsOnly) {
      result = result.filter(j => (j.match_score || 0) > 0 && (j.matched_skills?.length || 0) > 0);
    }

    const bestMatches = result
      .filter(j => (j.match_score || 0) > 70)
      .sort((a,b) => (b.match_score || 0) - (a.match_score || 0));

    set({
      filteredCache: result,
      total: result.length,
      currentBatchIndex: 0,
      jobs: result.slice(0, BATCH_SIZES[0]),
      bestMatches: bestMatches.slice(0, BATCH_SIZES[0]),
    });
  },

  loadNextBatch: async () => {
    const state = get();
    const { currentBatchIndex, filteredCache, bestMatches } = state;
    
    const nextIndex = currentBatchIndex + 1;
    const batchSize = BATCH_SIZES[nextIndex] || 20;
    
    const totalJobsToShow = BATCH_SIZES.slice(0, nextIndex + 1).reduce((a, b) => a + b, 0);
    
    // Always show up to available jobs, never skip
    const jobsToShow = Math.min(totalJobsToShow, filteredCache.length);
    
    set({
      loadingmore: true,
      jobs: filteredCache.slice(0, jobsToShow),
      bestMatches: bestMatches.slice(0, jobsToShow),
      currentBatchIndex: nextIndex,
    });
    
    setTimeout(() => {
      set({ loadingmore: false });
    }, 500);
  },

  loadMoreManual: async () => {
    await get().loadNextBatch();
  },
}));
