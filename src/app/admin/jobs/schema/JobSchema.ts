import * as z from "zod";

// Schema untuk required fields configuration
const RequiredFieldsSchema = z.object({
  full_name: z.enum(["mandatory", "optional", "off"]),
  email: z.enum(["mandatory", "optional", "off"]),
  phone: z.enum(["mandatory", "optional", "off"]),
  gender: z.enum(["mandatory", "optional", "off"]),
  linkedin: z.enum(["mandatory", "optional", "off"]),
  domicile: z.enum(["mandatory", "optional", "off"]),
  photo: z.enum(["mandatory", "optional", "off"]),
  date_of_birth: z.enum(["mandatory", "optional", "off"]),
});

// Main job creation schema (strict validation for Create Job)
export const CreateJobSchema = z.object({
  title: z.string().min(1, "Job title is required").max(100, "Job title must be less than 100 characters"),
  department: z.string().min(1, "Job type is required").max(50, "Job type must be less than 50 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description must be less than 5000 characters"),
  candidates: z.string().min(1, "Number of candidates is required").regex(/^\d+$/, "Must be a valid number").refine((val) => parseInt(val) > 0, "Number must be greater than 0"),
  salary_min: z.string().min(1, "Minimum salary is required").regex(/^\d+$/, "Must be a valid number").refine((val) => parseInt(val) >= 0, "Minimum salary must be at least 0"),
  salary_max: z.string().min(1, "Maximum salary is required").regex(/^\d+$/, "Must be a valid number").refine((val) => parseInt(val) >= 0, "Maximum salary must be at least 0"),
  required_fields: RequiredFieldsSchema,
}).refine((data) => {
  // Validate that min salary is not greater than max salary
  if (data.salary_min && data.salary_max) {
    const min = parseInt(data.salary_min);
    const max = parseInt(data.salary_max);
    if (min > max) {
      return false;
    }
  }
  return true;
}, {
  message: "Minimum salary cannot be greater than maximum salary",
});

// Schema untuk job update
export const UpdateJobSchema = CreateJobSchema.partial();

// Schema untuk save as draft (more flexible validation)
export const SaveDraftSchema = z.object({
  title: z.string().optional(),
  department: z.string().optional(),
  description: z.string().optional(),
  candidates: z.string().optional().transform((val) => val === "" ? undefined : val).refine((val) => val === undefined || /^\d+$/.test(val), {
    message: "Must be a valid number",
  }),
  salary_min: z.string().optional().transform((val) => val === "" ? undefined : val).refine((val) => val === undefined || /^\d+$/.test(val), {
    message: "Must be a valid number",
  }).refine((val) => val === undefined || parseInt(val) >= 0, {
    message: "Minimum salary must be at least 0",
  }),
  salary_max: z.string().optional().transform((val) => val === "" ? undefined : val).refine((val) => val === undefined || /^\d+$/.test(val), {
    message: "Must be a valid number",
  }).refine((val) => val === undefined || parseInt(val) >= 0, {
    message: "Maximum salary must be at least 0",
  }),
  required_fields: RequiredFieldsSchema,
}).refine((data) => {
  // Validate that min salary is not greater than max salary (only if both are provided)
  if (data.salary_min && data.salary_max) {
    const min = parseInt(data.salary_min);
    const max = parseInt(data.salary_max);
    if (min > max) {
      return false;
    }
  }
  return true;
}, {
  message: "Minimum salary cannot be greater than maximum salary",
});

// Schema untuk job filters
export const JobFilterSchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(["all", "active", "inactive", "draft"]).optional(),
  job_type: z.string().optional(),
  experience_level: z.string().optional(),
  location: z.string().optional(),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
});

// Validation helpers
export const validateSalaryRange = (min: string, max: string) => {
  if (min && max) {
    const minNum = parseInt(min);
    const maxNum = parseInt(max);
    if (minNum > maxNum) {
      return "Minimum salary cannot be greater than maximum salary";
    }
  }
  return null;
};

export const validateApplicationDeadline = (deadline: string) => {
  if (deadline) {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (deadlineDate < today) {
      return "Application deadline cannot be before today";
    }
  }
  return null;
};

// Default values for required fields
export const defaultRequiredFields: RequiredFieldsType = {
  full_name: "mandatory",
  email: "mandatory",
  phone: "mandatory",
  gender: "mandatory",
  linkedin: "mandatory",
  domicile: "mandatory",
  photo: "mandatory",
  date_of_birth: "mandatory",
};

// Options for dropdown fields
export const jobOptions = {
  jobTypes: [
    { value: "full-time", label: "Full Time" },
    { value: "part-time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "freelance", label: "Freelance" },
  ],
  workplaceTypes: [
    { value: "onsite", label: "On-site" },
    { value: "hybrid", label: "Hybrid" },
    { value: "remote", label: "Remote" },
  ],
  experienceLevels: [
    { value: "entry", label: "Entry Level (0-2 years)" },
    { value: "junior", label: "Junior (2-5 years)" },
    { value: "mid", label: "Mid-Level (5-8 years)" },
    { value: "senior", label: "Senior (8-12 years)" },
    { value: "lead", label: "Lead/Principal (12+ years)" },
  ],
  educationLevels: [
    { value: "high-school", label: "High School" },
    { value: "diploma", label: "Diploma" },
    { value: "bachelor", label: "Bachelor's Degree" },
    { value: "master", label: "Master's Degree" },
    { value: "phd", label: "PhD" },
  ],
  commonSkills: [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "C#",
    "HTML", "CSS", "SQL", "MongoDB", "PostgreSQL", "Docker", "AWS", "Git",
    "Communication", "Leadership", "Problem Solving", "Team Work", "Project Management"
  ],
  commonBenefits: [
    "Health Insurance", "Dental Insurance", "Vision Insurance", "401(k)",
    "Paid Time Off", "Flexible Hours", "Remote Work", "Training & Development",
    "Gym Membership", "Free Lunch", "Transportation Allowance", "Phone Allowance"
  ],
};

// Types
export type CreateJobFormData = z.infer<typeof CreateJobSchema>;
export type UpdateJobFormData = z.infer<typeof UpdateJobSchema>;
export type JobFilterData = z.infer<typeof JobFilterSchema>;
export type RequiredFieldsType = z.infer<typeof RequiredFieldsSchema>;