import * as z from "zod";
import { Job } from "@/types/job";

export const createDynamicApplicationSchema = (job: Job | null) => {
  const requiredFields = job?.required_fields || {};

  const baseFields = {
    full_name: z
      .string()
      .max(100, "Full name must be less than 100 characters")
      .refine((val) => val.trim().length > 0, "Full name is required"),

    email: z
      .string()
      .min(1, "Email is required")
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),

    phone: z
      .string()
      .min(1, "Phone number is required")
      .refine((val) => val.length >= 6 && /^[+]?[\d\s()-]+$/.test(val), {
        message: "Invalid phone number format",
      }),

    gender: z.enum(["male", "female", "other"], {
      message: "Gender is required",
    }),

    domicile: z.string().max(200, "Domicile must be less than 200 characters"),

    date_of_birth: z
      .string()
      .min(1, "Date of birth is required")
      .refine(
        (date) => {
          const parsedDate = new Date(date);
          const today = new Date();
          const minDate = new Date(
            today.getFullYear() - 16,
            today.getMonth(),
            today.getDate()
          );
          return parsedDate <= minDate;
        },
        {
          message: "You must be at least 16 years old",
        }
      ),

    linkedin: z
      .string()
      .min(1, "LinkedIn is required")
      .regex(
        /^https?:\/\/(www\.)?(linkedin\.com\/in\/[\w-]+|lnkd\.in\/[\w-]+)\/?$/,
        "Invalid LinkedIn URL format"
      ),

    photo: z
      .instanceof(File, { message: "Profile photo is required" })
      .refine((file) => file.size <= 2 * 1024 * 1024, {
        message: "Photo must be less than 2MB",
      })
      .refine(
        (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
        {
          message: "Photo must be a JPEG, PNG, or WebP image",
        }
      ),
  };

  const dynamicSchema: Record<string, z.ZodTypeAny> = {};

  Object.entries(baseFields).forEach(([fieldName, fieldSchema]) => {
    const requirement = requiredFields[fieldName];

    if (requirement === "off") {
      return;
    } else if (requirement === "mandatory") {
      if (fieldName === "domicile") {
        dynamicSchema[fieldName] = z
          .string()
          .max(200, "Domicile must be less than 200 characters")
          .refine((val) => val.trim().length > 0, "Domicile is required");
      } else if (fieldName === "photo") {
        dynamicSchema[fieldName] = z
          .instanceof(File, { message: "Profile photo is required" })
          .refine((file) => file.size <= 2 * 1024 * 1024, {
            message: "Photo must be less than 2MB",
          })
          .refine(
            (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
            {
              message: "Photo must be a JPEG, PNG, or WebP image",
            }
          );
      } else {
        dynamicSchema[fieldName] = fieldSchema;
      }
    } else {
      if (fieldName === "email") {
        dynamicSchema[fieldName] = z
          .string()
          .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format")
          .optional();
      } else if (fieldName === "phone") {
        dynamicSchema[fieldName] = z
          .string()
          .refine(
            (val) => !val || (val.length >= 6 && /^[+]?[\d\s()-]+$/.test(val)),
            {
              message: "Invalid phone number format",
            }
          )
          .optional();
      } else if (fieldName === "linkedin") {
        dynamicSchema[fieldName] = z
          .string()
          .refine(
            (val) =>
              !val ||
              /^https?:\/\/(www\.)?(linkedin\.com\/in\/[\w-]+|lnkd\.in\/[\w-]+)\/?$/.test(
                val
              ),
            {
              message: "Invalid LinkedIn URL format",
            }
          )
          .optional();
      } else if (fieldName === "date_of_birth") {
        dynamicSchema[fieldName] = z
          .string()
          .refine(
            (date) => {
              if (!date) return true; // optional field
              const parsedDate = new Date(date);
              const today = new Date();
              const minDate = new Date(
                today.getFullYear() - 16,
                today.getMonth(),
                today.getDate()
              );
              return parsedDate <= minDate;
            },
            {
              message: "You must be at least 16 years old",
            }
          )
          .optional();
      } else if (fieldName === "domicile") {
        dynamicSchema[fieldName] = z
          .string()
          .max(200, "Domicile must be less than 200 characters")
          .optional();
      } else if (fieldName === "photo") {
        dynamicSchema[fieldName] = z
          .instanceof(File, { message: "Photo must be a file" })
          .refine((file) => file.size <= 2 * 1024 * 1024, {
            message: "Photo must be less than 2MB",
          })
          .refine(
            (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
            {
              message: "Photo must be a JPEG, PNG, or WebP image",
            }
          )
          .optional();
      } else {
        dynamicSchema[fieldName] = fieldSchema.optional();
      }
    }
  });

  return z.object(dynamicSchema);
};

export const ApplicationSchema = z.object({
  full_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  domicile: z.string().optional(),
  date_of_birth: z.string().optional(),
  linkedin: z.string().optional(),
  photo: z.instanceof(File).optional(),
});

export type ApplicationFormData = z.infer<typeof ApplicationSchema>;

export const shouldShowField = (
  fieldName: string,
  requiredFields: Record<string, "mandatory" | "optional" | "off">
) => {
  return requiredFields[fieldName] !== "off";
};

export const isFieldRequired = (
  fieldName: string,
  requiredFields: Record<string, "mandatory" | "optional" | "off">
) => {
  return requiredFields[fieldName] === "mandatory";
};
