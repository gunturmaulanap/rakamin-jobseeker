"use client";

import { useState, useEffect } from "react";
import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaArrowUpFromBracket } from "react-icons/fa6";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePicker } from "@/components/ui/date-picker";
import { DomicileInput } from "@/components/ui/domicile-select";
import { FaceVerificationModal } from "@/components/ui/face-verification-modal";
import { PhoneInputField } from "@/components/ui/phone-input";
import {
  shouldShowField,
  isFieldRequired,
  ApplicationFormData,
  createDynamicApplicationSchema,
} from "../../schema/ApplicationSchema";

import { useJobStore } from "@/stores";
import { supabase } from "@/lib/supabase";

const AvatarPlaceholder = ({
  photoFile,
  photoUrl,
  error,
}: {
  photoFile: File | null;
  photoUrl: string | null;
  error?: boolean;
}) => (
  <div className="relative w-28 h-28 mx-auto mb-6">
    <div
      className={`w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 ${
        error ? "border-red-500" : "border-gray-300"
      }`}
    >
      {photoFile && photoUrl ? (
        <>
          <Image
            src={photoUrl}
            alt="Profile Photo"
            className="w-full h-full object-cover"
            width={120}
            height={120}
          />
          {/* Verified Badge */}
          <div className="absolute bottom-0 right-0 bg-green-500 text-white rounded-full p-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <Image
            src="/profile/avatar-profile.svg"
            alt="Avatar"
            width={120}
            height={120}
            loading="eager"
            className="object-contain"
          />
        </div>
      )}
    </div>
  </div>
);

export default function ApplyJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { fetchJobById, currentJob } = useJobStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const form = useForm<ApplicationFormData>({
    resolver: currentJob
      ? zodResolver(createDynamicApplicationSchema(currentJob))
      : undefined,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      gender: undefined,
      domicile: "",
      date_of_birth: "",
      linkedin: "",
      photo: undefined,
    },
  });

  const { handleSubmit, control, setValue } = form;
  const { errors } = useFormState({ control });

  // Fetch job details - optimized to only fetch the specific job
  useEffect(() => {
    const loadJob = async () => {
      try {
        await fetchJobById(jobId);
      } catch (error) {
        console.error("❌ Error loading job:", error);
        router.push("/candidate");
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      loadJob();
    }
  }, [jobId]); // Remove fetchJobById and router from dependencies

  useEffect(() => {
    if (!isLoading && (!currentJob || currentJob.status !== "active")) {
      router.push("/candidate");
    }
  }, [currentJob, isLoading]); // Remove router from dependencies

  // Reinitialize form when currentJob changes
  useEffect(() => {
    if (currentJob) {
      form.reset();
      // Don't trigger validation immediately - let user interact first
    }
  }, [currentJob]); // Update when job data changes

  // Cleanup photo URL on unmount
  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  // Cleanup all state when unmounting
  useEffect(() => {
    return () => {
      // Cleanup any remaining state
      setPhotoFile(null);
      setPhotoUrl(null);
      setIsVerificationModalOpen(false);
      form.reset();
    };
  }, []); // Empty dependency array means this only runs on unmount

  const handleFileChange = (fieldName: string, file: File | null) => {
    if (file) {
      setValue(fieldName as any, file, {
        shouldValidate: false,
      });
      if (fieldName === "photo") {
        // Clean up previous URL
        if (photoUrl) {
          URL.revokeObjectURL(photoUrl);
        }
        setPhotoFile(file);
        const newUrl = URL.createObjectURL(file);
        setPhotoUrl(newUrl);
      }
    }
  };

  const handleTakePicture = () => {
    setIsVerificationModalOpen(true);
  };

  const handleVerificationSuccess = (imageFile: File) => {
    // Clean up previous URL
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }
    setPhotoFile(imageFile);
    const newUrl = URL.createObjectURL(imageFile);
    setPhotoUrl(newUrl);
    handleFileChange("photo", imageFile);
  };

  const uploadPhotoToSupabase = async (file: File): Promise<string | null> => {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve(event.target.result as string);
          } else {
            reject(new Error("Failed to read file"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error("Error converting photo to base64:", error);
      return null;
    }
  };

  const onSubmit = async (data: ApplicationFormData) => {
    if (!currentJob) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Additional client-side validation using schema
      const schema = createDynamicApplicationSchema(currentJob);
      const validationResult = schema.safeParse(data);

      if (!validationResult.success) {
        // Set form errors from schema validation
        validationResult.error.issues.forEach((issue: any) => {
          if (issue.path.length > 0) {
            form.setError(issue.path[0] as keyof ApplicationFormData, {
              message: issue.message,
            });
          }
        });
        setIsSubmitting(false);
        return;
      }

      // Get required fields for this job
      const requiredFields = currentJob.required_fields;

      // Lanjutkan proses submit
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("Please login first to apply for this job.");
        router.push("/login");
        return;
      }

      let photoUrl = null;
      if (data.photo_file && data.photo_file instanceof File) {
        photoUrl = await uploadPhotoToSupabase(data.photo_file);
      }

      const applicationData: any = {
        job_id: jobId,
        candidate_id: user.id,
      };

      // Hanya sertakan field yang ada (bukan "off")
      // Untuk mandatory fields, kirim semua nilai (termasuk yang kosong)
      // Untuk optional fields, hanya kirim jika ada nilainya
      if (shouldShowField("full_name", requiredFields)) {
        if (isFieldRequired("full_name", requiredFields) || data.full_name) {
          applicationData.full_name = data.full_name;
        }
      }
      if (shouldShowField("email", requiredFields)) {
        if (isFieldRequired("email", requiredFields) || data.email) {
          applicationData.email = data.email;
        }
      }
      if (shouldShowField("phone", requiredFields)) {
        if (isFieldRequired("phone", requiredFields) || data.phone) {
          applicationData.phone = data.phone;
        }
      }
      if (shouldShowField("gender", requiredFields)) {
        if (isFieldRequired("gender", requiredFields) || data.gender) {
          applicationData.gender = data.gender;
        }
      }
      if (shouldShowField("linkedin", requiredFields)) {
        if (isFieldRequired("linkedin", requiredFields) || data.linkedin) {
          applicationData.linkedin = data.linkedin;
        }
      }
      if (shouldShowField("domicile", requiredFields)) {
        if (isFieldRequired("domicile", requiredFields) || data.domicile) {
          applicationData.domicile = data.domicile;
        }
      }
      if (shouldShowField("date_of_birth", requiredFields)) {
        if (
          isFieldRequired("date_of_birth", requiredFields) ||
          data.date_of_birth
        ) {
          applicationData.date_of_birth = data.date_of_birth;
        }
      }
      if (shouldShowField("photo_file", requiredFields)) {
        if (isFieldRequired("photo_file", requiredFields) || photoUrl) {
          applicationData.photo_url = photoUrl;
        }
      }

      const { error } = await supabase
        .from("applications")
        .insert(applicationData);

      if (error) throw error;

      router.push("/candidate/application-success");
    } catch (error: any) {
      console.error("Error submitting application:", error);
      if (error.message?.includes("duplicate key")) {
        alert("You have already applied for this job.");
      } else if (error.message?.includes("JWT")) {
        alert("Session has expired. Please login again.");
        router.push("/login");
      } else {
        alert(
          `Error submitting application: ${
            error.message || "Unknown error"
          }. Please try again.`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01959F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!currentJob) {
    return null;
  }

  const requiredFields = currentJob.required_fields;

  return (
    <div className="min-h-screen ">
      <div className="max-w-6xl mx-auto my-10 py-8 px-4 sm:px-6 lg:px-8 bg-white rounded-sm border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center pb-6 mb-8">
          <div className="flex items-center space-x-4 ">
            <Link
              href="/candidate"
              className="text-gray-600 hover:text-gray-900"
            >
              <div className="border border-gray-300 rounded-md hover:bg-gray-100 p-1">
                {" "}
                <ArrowLeft className="h-6 w-6 " />
              </div>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">
              {currentJob.title}
            </h1>
          </div>
          <div className="text-sm text-gray-700 flex items-center">
            ℹ️ This field required to fill
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Photo Profile Section */}
            {shouldShowField("photo", requiredFields) && (
              <FormField
                control={control}
                name="photo"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Photo Profile
                      {isFieldRequired("photo", requiredFields) && (
                        <span className="text-red-500">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <div className="flex flex-col items-start">
                        {/* Hidden input untuk form control */}
                        <input
                          type="file"
                          accept="image/*"
                          ref={field.ref}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            field.onChange(file);
                            if (file) {
                              handleFileChange("photo_file", file);
                            }
                          }}
                          style={{ display: "none" }}
                        />
                        <div className="flex flex-col items-start space-y-2 mt-6">
                          <AvatarPlaceholder
                            photoFile={photoFile}
                            photoUrl={photoUrl}
                            error={!!fieldState.error}
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              handleTakePicture();
                            }}
                            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 "
                          >
                            <FaArrowUpFromBracket className="h-4 w-4 mr-2" />
                            Take a Picture
                          </Button>
                          {fieldState.error && (
                            <p className="text-sm text-red-600 mt-1">
                              {fieldState.error.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* Dynamic Form Fields */}
            {shouldShowField("full_name", requiredFields) && (
              <FormField
                control={control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Full name
                      {isFieldRequired("full_name", requiredFields) && (
                        <span className="text-red-500">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your full name"
                        value={(field.value as string) || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {shouldShowField("date_of_birth", requiredFields) && (
              <FormField
                control={control}
                name="date_of_birth"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      Date of birth
                      {isFieldRequired("date_of_birth", requiredFields) && (
                        <span className="text-red-500">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={(field.value as string) || ""}
                        onChange={field.onChange}
                        placeholder="Select date of birth"
                        error={!!fieldState.error}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {shouldShowField("gender", requiredFields) && (
              <FormField
                control={control}
                name="gender"
                render={({ field }) => {
                  // Initialize with empty string to ensure controlled state from the start
                  const genderValue = field.value || "";
                  return (
                    <FormItem className="space-y-3">
                      <FormLabel>
                        Pronoun (gender)
                        {isFieldRequired("gender", requiredFields) && (
                          <span className="text-red-500">*</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={genderValue}
                          onValueChange={(value) =>
                            field.onChange(value as "male" | "female" | "other")
                          }
                          className="flex space-x-6"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem
                                value="female"
                                id="gender-female"
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor="gender-female"
                              className="font-normal cursor-pointer"
                            >
                              She/her (Female)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="male" id="gender-male" />
                            </FormControl>
                            <FormLabel
                              htmlFor="gender-male"
                              className="font-normal cursor-pointer"
                            >
                              He/him (Male)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            {shouldShowField("domicile", requiredFields) && (
              <FormField
                control={control}
                name="domicile"
                render={({ field }) => {
                  const domicileValue = field.value as string | undefined;
                  return (
                    <FormItem>
                      <FormLabel>
                        Domicile
                        {isFieldRequired("domicile", requiredFields) && (
                          <span className="text-red-500">*</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <DomicileInput
                          value={domicileValue || ""}
                          onChange={(value) => field.onChange(value)}
                          placeholder="Choose your domicile"
                          error={!!errors.domicile}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            {shouldShowField("phone", requiredFields) && (
              <PhoneInputField
                control={control}
                name="phone"
                label="Phone number"
                placeholder="81XXXXXXXXX"
                required={isFieldRequired("phone", requiredFields)}
              />
            )}

            {shouldShowField("email", requiredFields) && (
              <FormField
                control={control}
                name="email"
                render={({ field }) => {
                  const emailValue = field.value as string | undefined;
                  return (
                    <FormItem>
                      <FormLabel>
                        Email
                        {isFieldRequired("email", requiredFields) && (
                          <span className="text-red-500">*</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          value={emailValue || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            {shouldShowField("linkedin", requiredFields) && (
              <FormField
                control={control}
                name="linkedin"
                render={({ field }) => {
                  const linkedinValue = field.value as string | undefined;
                  return (
                    <FormItem>
                      <FormLabel>
                        Link LinkedIn
                        {isFieldRequired("linkedin", requiredFields) && (
                          <span className="text-red-500">*</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://linkedin.com/in/username"
                          value={linkedinValue || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#01959F] hover:bg-[#017B7F] font-bold text-lg"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>

        {/* Face Verification Modal */}
        <FaceVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          onSuccess={handleVerificationSuccess}
        />

        <div className="h-10"></div>
      </div>
    </div>
  );
}
