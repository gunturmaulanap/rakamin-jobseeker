"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/lib/supabase";
// Pastikan Anda mengimpor store, bukan hanya supabase
import { useJobStore } from "@/stores";
import {
  formatCurrencyInput,
  parseCurrencyInput,
  formatCurrencyDisplay,
} from "@/lib/utils";
import { useAuthStore } from "@/stores";
import {
  CreateJobSchema,
  CreateJobFormData,
  defaultRequiredFields,
} from "@/app/admin/jobs/schema/JobSchema";
import { Job } from "@/types/job";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Signature onSuccess diubah untuk mengirim pesan toast
  onSuccess: (message: string) => void;
  editingJob?: Job | null;
}

export default function CreateJobModal({
  isOpen,
  onClose,
  onSuccess,
  editingJob = null,
}: CreateJobModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [salaryComparisonError, setSalaryComparisonError] = useState("");
  const [requiredFields, setRequiredFields] = useState(defaultRequiredFields);
  const [skills, setSkills] = useState<string[]>([]);

  // Ambil actions dari store untuk update/create job
  const { createJob, updateJob } = useJobStore();

  const handleFieldRequirementChange = (field: string, value: string) => {
    setRequiredFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fields that are always mandatory (optional and off buttons disabled)
  const alwaysMandatoryFields = ["full_name", "photo", "email"];

  const form = useForm<CreateJobFormData>({
    resolver: zodResolver(CreateJobSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      department: "",
      description: "",
      candidates: "",
      salary_min: "",
      salary_max: "",
      required_fields: defaultRequiredFields,
    },
  });

  const { setValue, reset, watch, trigger, formState } = form;
  const { errors } = formState;

  // Reset form when modal opens or editingJob changes
  useEffect(() => {
    if (isOpen) {
      if (editingJob) {
        // Load existing job data
        reset({
          title: editingJob.title || "",
          department: editingJob.department || "",
          description: editingJob.description || "",
          candidates: editingJob.candidates?.toString() || "1",
          salary_min: editingJob.salary_min?.toString() || "",
          salary_max: editingJob.salary_max?.toString() || "",
          // Pastikan defaultRequiredFields hanya sebagai fallback,
          // required_fields akan diatur di bawah.
          required_fields: defaultRequiredFields,
        });

        setSkills(editingJob.skills || []);

        // Process required_fields data from database
        const mergedRequiredFields = { ...defaultRequiredFields };
        if (editingJob.required_fields) {
          Object.keys(editingJob.required_fields).forEach((key) => {
            if (key in mergedRequiredFields) {
              const value = editingJob.required_fields[key];

              if (typeof value === "boolean") {
                (mergedRequiredFields as any)[key] = value
                  ? "mandatory"
                  : "optional";
              } else if (typeof value === "string") {
                (mergedRequiredFields as any)[key] = value;
              }
            }
          });
        }
        setRequiredFields(mergedRequiredFields);

        // Update form with the correct merged required_fields
        setValue("required_fields", mergedRequiredFields);
      } else {
        // Reset for new job
        reset();
        setRequiredFields(defaultRequiredFields);
        setSkills([]);
      }

      // Reset salary comparison error when modal opens
      setSalaryComparisonError("");
    }
  }, [isOpen, editingJob, reset]);

  // Form event handlers
  const handleInputChange = (fieldName: keyof CreateJobFormData) => {
    trigger(fieldName);
  };

  // Enhanced input change handler with debounced validation for description

  // Currency input handlers
  const handleSalaryInputChange = (
    value: string,
    fieldName: "salary_min" | "salary_max"
  ) => {
    // Format input value for display
    const formattedValue = formatCurrencyInput(value);
    // Update form with numeric value for storage
    const numericValue = parseCurrencyInput(formattedValue);

    form.setValue(fieldName, numericValue);
    trigger(fieldName);
    validateSalaryComparison();
  };

  // Salary validation helper
  const validateSalaryComparison = () => {
    const salaryMin = form.getValues("salary_min");
    const salaryMax = form.getValues("salary_max");

    if (salaryMin && salaryMax && salaryMin !== "" && salaryMax !== "") {
      const min = parseFloat(salaryMin);
      const max = parseFloat(salaryMax);

      if (min > max) {
        setSalaryComparisonError(
          "Minimum salary cannot be greater than maximum salary"
        );
        return true; // Has error
      } else {
        setSalaryComparisonError("");
        return false; // No error
      }
    } else {
      setSalaryComparisonError("");
      return false; // No error for empty fields
    }
  };

  // Form submission handlers
  const handleSaveAsDraft = async () => {
    try {
      validateSalaryComparison();
      const formData = form.getValues();
      await onSubmit(formData, true);
    } catch (error) {
      // Error already handled by parent component
    }
  };

  const handleCreateJob = async () => {
    try {
      // Validate all required fields
      const isValid = await trigger();
      if (!isValid) return;

      // Validate salary comparison
      const hasSalaryError = validateSalaryComparison();
      if (hasSalaryError) return;

      const formData = form.getValues();
      await onSubmit(formData, false);
    } catch (error) {
      // Error already handled by parent component
    }
  };

  const checkIfFormIsComplete = (data: CreateJobFormData) => {
    // Check if all main fields are filled
    const mainFieldsComplete =
      data.title.trim() !== "" &&
      data.department.trim() !== "" &&
      data.description.trim() !== "" &&
      data.candidates !== "" &&
      data.salary_min !== "" &&
      data.salary_max !== "";

    // Check if all always mandatory fields are set to mandatory
    const mandatoryFieldsComplete = alwaysMandatoryFields.every(
      (field) =>
        requiredFields[field as keyof typeof requiredFields] === "mandatory"
    );

    return mainFieldsComplete && mandatoryFieldsComplete;
  };

  const onSubmit = async (
    data: CreateJobFormData,
    saveAsDraft: boolean = false
  ) => {
    setIsLoading(true);
    setError("");

    try {
      const {
        title,
        department,
        description,
        candidates,
        salary_min,
        salary_max,
      } = data;

      // Determine status based on user action
      let jobStatus: "active" | "draft";

      if (saveAsDraft) {
        jobStatus = "draft";
      } else {
        const isFormComplete = checkIfFormIsComplete(data);
        jobStatus = isFormComplete ? "active" : "draft";
      }

      // Get current admin user ID
      const currentAdmin = useAuthStore.getState().user;
      const adminId =
        currentAdmin?.id || "00000000-0000-0000-0000-000000000000";

      // Validate required fields

      const jobData = {
        title: title.trim() || (saveAsDraft ? "Untitled Job" : ""),
        department: department.trim() || "",
        description: description.trim() || "",
        candidates: parseInt(candidates) || 1,
        salary_min: salary_min ? parseInt(salary_min) : null,
        salary_max: salary_max ? parseInt(salary_max) : null,
        status: jobStatus,
        admin_id: adminId,
        required_fields: requiredFields, // Save the actual field requirement states
        skills: skills.length > 0 ? skills : [],
      };

      let successMessage: string;

      if (editingJob) {
        // Gunakan action updateJob dari store (Optimistic UI)
        await updateJob(editingJob.id, jobData);
        successMessage = saveAsDraft
          ? "Changes saved to draft."
          : "Job vacancy successfully updated!";
      } else {
        // Gunakan action createJob dari store
        await createJob(jobData);
        successMessage = saveAsDraft
          ? "Job saved as draft."
          : "Job vacancy successfully created!";
      }

      // Reset form
      reset();
      setSkills([]);
      setRequiredFields(defaultRequiredFields);

      // Panggil onSuccess dengan pesan (memicu toast di Parent)
      onSuccess(successMessage);

      // Hapus delay (Small delay to ensure data is committed)
      onClose();
    } catch (err: any) {
      console.error("Create job error:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
      });

      // Better error handling
      let errorMessage = "An error occurred while saving the job posting";

      if (err.message) {
        if (err.message.includes("duplicate key")) {
          errorMessage = "A job with this title already exists";
        } else if (err.message.includes("null value")) {
          errorMessage = "Please fill in all required fields";
        } else if (err.message.includes("check constraint")) {
          errorMessage = "Invalid data provided. Please check your input";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with transition for smoothness */}
      <div
        className="absolute inset-0 bg-black/20 transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-5xl mx-4 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto 
          transform transition-all duration-300 ease-out sm:scale-100 sm:opacity-100" // Tambahkan transisi
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b ">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingJob ? "Continue Draft" : "Job Opening"}
              </h2>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleClose}
          >
            <X className="h-6 w-6 text-gray-500" />
          </Button>
        </div>

        {/* Form */}
        <div className="border-b  p-6">
          {" "}
          <Form {...form}>
            <form className="px-2 space-y-6">
              {/* Job Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-xs font-medium">
                      Job Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex. Frontend Developer"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleInputChange("title");
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Department */}
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-xs font-medium">
                      Job Type<span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleInputChange("department");
                        }}
                        value={field.value}
                      >
                        <SelectTrigger
                          className={`h-11 w-full ${
                            errors.department
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : ""
                          }`}
                        >
                          <SelectValue placeholder="Select Job Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-xs font-medium">
                      Job Description <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex. We are looking for a skilled frontend developer..."
                        {...field}
                        rows={6}
                        onChange={(e) => {
                          field.onChange(e);
                          handleInputChange("description");
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Number of Candidates Needed */}
              <FormField
                control={form.control}
                name="candidates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-xs font-medium">
                      Number of Candidates Needed{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex. 5"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleInputChange("candidates");
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Salary Range */}
              <div>
                <div className="flex items-center font-medium text-xs text-gray-700 mb-4">
                  Job Salary
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormField
                      control={form.control}
                      name="salary_min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-600 mb-2 block">
                            Minimum Estimated Salary
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 text-sm font-semibold">
                                Rp
                              </span>
                              <Input
                                type="text"
                                placeholder="5.000.000"
                                {...field}
                                className={`h-11 pl-10  ${
                                  errors.salary_min
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                    : ""
                                }`}
                                value={formatCurrencyInput(field.value || "")}
                                onChange={(e) => {
                                  handleSalaryInputChange(
                                    e.target.value,
                                    "salary_min"
                                  );
                                }}
                                onBlur={() => {
                                  validateSalaryComparison();
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="salary_max"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-gray-600 mb-2 block">
                            Maximum Estimated Salary
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 text-sm font-semibold">
                                Rp
                              </span>
                              <Input
                                type="text"
                                placeholder="10.000.000"
                                {...field}
                                className={`h-11 pl-10  ${
                                  errors.salary_max
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                    : ""
                                }`}
                                value={formatCurrencyInput(field.value || "")}
                                onChange={(e) => {
                                  handleSalaryInputChange(
                                    e.target.value,
                                    "salary_max"
                                  );
                                }}
                                onBlur={() => {
                                  validateSalaryComparison();
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Salary Comparison Error */}
                {salaryComparisonError && (
                  <div className="mt-2">
                    <p className="mt-1 text-xs text-red-600">
                      {salaryComparisonError}
                    </p>
                  </div>
                )}
              </div>

              {/* Minimum Profile Information Required */}
              <div className="w-full p-6 border border-gray-300 rounded-lg ">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4">
                  Minimum Profile Information Required
                </div>
                <div className="space-y-3">
                  {[
                    { key: "full_name", label: "Full Name" },
                    { key: "photo", label: "Photo Profile" },
                    { key: "gender", label: "Gender" },
                    { key: "domicile", label: "Domicile" },
                    { key: "email", label: "Email " },
                    { key: "phone", label: "Phone Number " },
                    { key: "linkedin", label: "LinkedIn Profile" },
                    { key: "date_of_birth", label: "Date of Birth" },
                  ].map((field) => {
                    const isAlwaysMandatory = alwaysMandatoryFields.includes(
                      field.key
                    );
                    const currentValue = requiredFields[
                      field.key as keyof typeof requiredFields
                    ] as "mandatory" | "optional" | "off";

                    return (
                      <div
                        key={field.key}
                        className="flex items-center justify-between p-3 border-b last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-600">
                            {field.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 rounded-2xl p-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleFieldRequirementChange(
                                field.key,
                                "mandatory"
                              )
                            }
                            className={`px-3 py-1.5 text-sm font-medium rounded-2xl transition-all duration-200 ${
                              currentValue === "mandatory"
                                ? "border border-[#01959F] text-[#01959F] "
                                : "text-gray-500 border border-gray-400 "
                            }`}
                          >
                            Mandatory
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              !isAlwaysMandatory &&
                              handleFieldRequirementChange(
                                field.key,
                                "optional"
                              )
                            }
                            disabled={isAlwaysMandatory}
                            className={`px-3 py-1.5 text-sm font-medium rounded-2xl transition-all duration-200 ${
                              isAlwaysMandatory
                                ? "bg-gray-200 text-gray-400 border  cursor-not-allowed"
                                : currentValue === "optional"
                                ? "border border-[#01959F] text-[#01959F] "
                                : "text-gray-500 border border-gray-400 "
                            }`}
                          >
                            Optional
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              !isAlwaysMandatory &&
                              handleFieldRequirementChange(field.key, "off")
                            }
                            disabled={isAlwaysMandatory}
                            className={`px-3 py-1.5 text-sm font-medium rounded-2xl transition-all duration-200 ${
                              isAlwaysMandatory
                                ? "bg-gray-200 text-gray-400 border  cursor-not-allowed"
                                : currentValue === "off"
                                ? "border border-[#01959F] text-[#01959F] "
                                : "text-gray-500 border border-gray-400 "
                            }`}
                          >
                            Off
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </form>
          </Form>
        </div>

        <div className="flex justify-between p-6">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={handleSaveAsDraft}
          >
            {isLoading
              ? "Saving..."
              : editingJob
              ? "Save Changes"
              : "Save as Draft"}
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            className="text-white bg-[#01959F] hover:bg-[#017B7F]"
            onClick={handleCreateJob}
          >
            {isLoading
              ? editingJob
                ? "Updating..."
                : "Creating..."
              : editingJob
              ? "Update Job"
              : "Create Job"}
          </Button>
        </div>
      </div>
    </div>
  );
}
