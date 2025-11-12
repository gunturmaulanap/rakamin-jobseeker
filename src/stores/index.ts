// Export all Zustand stores
export { useAuthStore } from './authStore';
export { useJobStore } from './jobStore';

// Export types if needed
export type { User } from './authStore';
export type { Job, Application, JobStats } from '@/types/job';