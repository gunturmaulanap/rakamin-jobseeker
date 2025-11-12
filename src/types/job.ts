export interface Job {
  id: string;
  title: string;
  description: string;
  department: string;
  candidates: number;
  salary_min: number | null;
  salary_max: number | null;
  status: "active" | "inactive" | "draft";
  admin_id: string;
  required_fields: Record<string, "mandatory" | "optional" | "off">;
  skills?: string[];
  benefits?: string[];
  created_at: string;
  updated_at: string;
  application_count?: number;
}

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  linkedin: string | null;
  domicile: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
  status: "pending" | "reviewing" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface JobStats {
  totalJobs: number;
  activeJobs: number;
  draftJobs: number;
  totalApplications: number;
}
