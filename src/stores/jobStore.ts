import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Job, JobStats, Application } from "@/types/job";
import { supabase } from "@/lib/supabase";

// --- Interface Definitions ---

interface JobStore {
  // State
  jobs: Job[];
  stats: JobStats;
  isLoading: boolean;
  error: string | null;
  currentJob: Job | null;
  searchTerm: string;
  statusFilter: "all" | "active" | "inactive" | "draft";
  isCreateModalOpen: boolean;
  applications: Application[];

  // Actions
  fetchJobs: () => Promise<void>;
  fetchJobById: (id: string) => Promise<void>;
  createJob: (jobData: Partial<Job>) => Promise<Job>; // Mengembalikan Job yang baru dibuat
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  fetchApplications: (jobId: string) => Promise<void>;
  fetchUserApplications: (candidateId: string) => Promise<Application[]>;
  createApplication: (applicationData: Omit<Application, "id" | "created_at" | "updated_at">) => Promise<Application>;
  hasUserAppliedToJob: (candidateId: string, jobId: string) => Promise<boolean>;
  updateApplicationStatus: (
    applicationId: string,
    status: Application["status"]
  ) => Promise<void>;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: "all" | "active" | "inactive" | "draft") => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  getFilteredJobs: () => Job[];
  reset: () => void;
}

// --- Helper Functions (untuk konsistensi statistik) ---

/**
 * Convert legacy boolean required_fields to string enum format for backward compatibility
 * @param job Job object with potentially boolean required_fields
 * @returns Job object with converted required_fields
 */
const convertLegacyRequiredFields = (job: any): Job => {
  if (!job.required_fields) {
    return job as Job;
  }

  // Check if required_fields uses boolean format (legacy)
  const hasBooleanFields = Object.values(job.required_fields).some(
    (value: any) => typeof value === 'boolean'
  );

  if (hasBooleanFields) {
    // Convert boolean to string enum format
    const convertedRequiredFields: Record<string, "mandatory" | "optional" | "off"> = {};

    Object.entries(job.required_fields).forEach(([key, value]: [string, any]) => {
      if (typeof value === 'boolean') {
        convertedRequiredFields[key] = value ? "mandatory" : "optional";
      } else {
        convertedRequiredFields[key] = value;
      }
    });

    return {
      ...job,
      required_fields: convertedRequiredFields,
    };
  }

  return job as Job;
};

/**
 * Menghitung ulang statistik pekerjaan dari array pekerjaan saat ini.
 * @param jobs Array pekerjaan.
 * @param currentTotalApplications Jumlah total aplikasi yang ada di state.
 * @returns Objek JobStats yang diperbarui.
 */
const calculateStats = (
  jobs: Job[],
  currentTotalApplications: number
): JobStats => {
  return {
    totalJobs: jobs.length,
    activeJobs: jobs.filter((job) => job.status === "active").length,
    draftJobs: jobs.filter((job) => job.status === "draft").length,
    // Total applications dipertahankan, karena perhitungannya biasanya lebih kompleks
    // atau berasal dari data yang berbeda (seperti Application Table).
    totalApplications: currentTotalApplications,
  };
};

// --- Zustand Store Implementation ---

export const useJobStore = create<JobStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        jobs: [],
        stats: {
          totalJobs: 0,
          activeJobs: 0,
          draftJobs: 0,
          totalApplications: 0,
        },
        isLoading: false,
        error: null,
        currentJob: null,
        searchTerm: "",
        statusFilter: "all" as const,
        isCreateModalOpen: false,
        applications: [],

        // Actions
        fetchJobs: async () => {
          set({ isLoading: true, error: null });
          try {
            const { data: jobsData, error } = await supabase
              .from("jobs")
              .select("*")
              .order("created_at", { ascending: false });

            if (error) {
              console.error("Error fetching jobs:", error);
              throw error;
            }

            const jobsDataRaw = jobsData || [];

            // Convert legacy boolean required_fields to string enum format
            const jobs = jobsDataRaw.map(convertLegacyRequiredFields);

            // Hitung totalApplications dari jobs (jika application_count ada)
            const totalApplications = jobs.reduce(
              (sum: number, job: any) => sum + (job.application_count || 0),
              0
            );

            // Gunakan helper untuk stats
            const stats = calculateStats(jobs, totalApplications);

            set({ jobs, stats, isLoading: false });
          } catch (error: any) {
            console.error("Fetch jobs error:", error);
            set({
              error: error.message || "Failed to fetch jobs",
              isLoading: false,
            });
          }
        },

        fetchJobById: async (id: string) => {
          // Implementasi fetchJobById dengan backward compatibility
          try {
            const { data, error } = await supabase
              .from("jobs")
              .select("*")
              .eq("id", id)
              .single();

            if (error) throw error;

            // Convert legacy boolean required_fields to string enum format
            const job = convertLegacyRequiredFields(data);
            set({ currentJob: job });
          } catch (error: any) {
            set({ error: error.message || "Failed to fetch job" });
          }
        },

        createJob: async (jobData: Partial<Job>): Promise<Job> => {
          set({ isLoading: true, error: null });
          try {
            const { data, error } = await supabase
              .from("jobs")
              .insert([jobData as Job])
              .select()
              .single();

            if (error) throw error;

            set((state) => {
              // 1. Tambahkan Job baru ke array jobs
              const newJobs = [data, ...state.jobs];

              return {
                ...state,
                jobs: newJobs,
                // 2. Perbarui statistik
                stats: calculateStats(newJobs, state.stats.totalApplications),
                isLoading: false,
              };
            });

            return data;
          } catch (error: any) {
            set({
              error: error.message || "Failed to create job",
              isLoading: false,
            });
            throw error; // Melempar error agar ditangkap oleh komponen/modal
          }
        },

        updateJob: async (id: string, updates: Partial<Job>): Promise<void> => {
          const oldJobs = get().jobs;
          const oldStats = get().stats;

          // --- 1. Optimistic Update (UI Instan) ---
          const updatedJobsOptimistic = oldJobs.map((job) =>
            job.id === id ? { ...job, ...updates } : job
          );

          set((state) => ({
            ...state,
            jobs: updatedJobsOptimistic,
            // Perbarui stats secara konsisten
            stats: calculateStats(
              updatedJobsOptimistic,
              state.stats.totalApplications
            ),
            currentJob:
              state.currentJob?.id === id
                ? { ...state.currentJob, ...updates }
                : state.currentJob,
            error: null, // Clear error
          }));

          try {
            // --- 2. Panggilan Supabase ---
            const { error } = await supabase
              .from("jobs")
              .update(updates)
              .eq("id", id);

            if (error) throw error;
          } catch (error: any) {
            // --- 3. Rollback jika Supabase gagal (UX Fallback) ---
            set({
              jobs: oldJobs, // Kembalikan ke state lama
              stats: oldStats,
              error: error.message || "Failed to update job",
            });
            throw error; // Lempar error untuk ditangani di komponen
          }
        },

        deleteJob: async (id: string) => {
          try {
            const { error } = await supabase.from("jobs").delete().eq("id", id);

            if (error) throw error;

            set((state) => {
              const filteredJobs = state.jobs.filter((job) => job.id !== id);

              return {
                ...state,
                jobs: filteredJobs,
                // Gunakan helper untuk stats
                stats: calculateStats(
                  filteredJobs,
                  state.stats.totalApplications
                ),
              };
            });
          } catch (error: any) {
            set({ error: error.message || "Failed to delete job" });
            throw error;
          }
        },

        // Fetch applications for a specific job
        fetchApplications: async (jobId: string) => {
          set({ applications: [] });
          try {
            const { data, error } = await supabase
              .from("applications")
              .select("*")
              .eq("job_id", jobId)
              .order("created_at", { ascending: false });

            if (error) throw error;
            set({ applications: data || [] });
          } catch (error: any) {
            set({ error: error.message || "Failed to fetch applications" });
          }
        },

        // Fetch applications for current user (candidate)
        fetchUserApplications: async (candidateId: string) => {
          try {
            const { data, error } = await supabase
              .from("applications")
              .select("*")
              .eq("candidate_id", candidateId)
              .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
          } catch (error: any) {
            set({ error: error.message || "Failed to fetch user applications" });
            return [];
          }
        },

        // Create new application
        createApplication: async (applicationData: Omit<Application, "id" | "created_at" | "updated_at">) => {
          try {
            const { data, error } = await supabase
              .from("applications")
              .insert([applicationData])
              .select()
              .single();

            if (error) throw error;
            return data;
          } catch (error: any) {
            set({ error: error.message || "Failed to create application" });
            throw error;
          }
        },

        // Check if user has applied to a specific job
        hasUserAppliedToJob: async (candidateId: string, jobId: string) => {
          try {
            const { data, error } = await supabase
              .from("applications")
              .select("id")
              .eq("candidate_id", candidateId)
              .eq("job_id", jobId)
              .single();

            return !error && data !== null;
          } catch (error: any) {
            // Error means no application found
            return false;
          }
        },

        updateApplicationStatus: async (
          applicationId: string,
          status: Application["status"]
        ) => {
          // Ini juga bisa diubah menjadi Optimistic UI jika diperlukan
          set((state) => ({
            applications: state.applications.map((app) =>
              app.id === applicationId ? { ...app, status } : app
            ),
          }));
        },

        setSearchTerm: (term: string) => set({ searchTerm: term }),
        setStatusFilter: (filter: "all" | "active" | "inactive" | "draft") =>
          set({ statusFilter: filter }),
        openCreateModal: () => set({ isCreateModalOpen: true }),
        closeCreateModal: () => set({ isCreateModalOpen: false }),

        getFilteredJobs: () => {
          const { jobs, searchTerm, statusFilter } = get();

          return jobs.filter((job) => {
            const matchesSearch =
              job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              job.department.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
              statusFilter === "all" || job.status === statusFilter;

            return matchesSearch && matchesStatus;
          });
        },

        reset: () =>
          set({
            jobs: [],
            stats: {
              totalJobs: 0,
              activeJobs: 0,
              draftJobs: 0,
              totalApplications: 0,
            },
            isLoading: false,
            error: null,
            currentJob: null,
            searchTerm: "",
            statusFilter: "all",
            isCreateModalOpen: false,
            applications: [],
          }),
      }),
      {
        name: "job-store",
        partialize: (state) => ({
          jobs: state.jobs,
          stats: state.stats,
          searchTerm: state.searchTerm,
          statusFilter: state.statusFilter,
          currentJob: state.currentJob,
          applications: state.applications,
          isCreateModalOpen: state.isCreateModalOpen,
        }),
      }
    )
  )
);
