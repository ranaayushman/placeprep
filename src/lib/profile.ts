import { z } from "zod";

export const DEGREES = ["B.E. / B.Tech", "M.E. / M.Tech", "MCA", "BCA", "B.Sc", "M.Sc", "Other"] as const;
export const BRANCHES = [
  "Computer Science (CSE)",
  "Information Technology (IT)",
  "AI / ML / Data Science",
  "Electronics & Communication (ECE)",
  "Electrical (EEE)",
  "Mechanical",
  "Civil",
  "Other",
] as const;
export const COMPANY_SUGGESTIONS = ["Infosys", "TCS", "Wipro", "Accenture", "Cognizant", "Capgemini", "HCLTech", "Tech Mahindra", "Deloitte", "Amazon", "Microsoft", "Google"];

/** Students passing out from last year up to four years ahead. */
export const passoutYears = (now = new Date()) => Array.from({ length: 6 }, (_, i) => now.getFullYear() - 1 + i);

export const profileSchema = z.object({
  college: z.string().trim().min(2, "Enter your college name").max(120),
  degree: z.enum(DEGREES, { errorMap: () => ({ message: "Choose your degree" }) }),
  branch: z.enum(BRANCHES, { errorMap: () => ({ message: "Choose your branch" }) }),
  passoutYear: z.coerce
    .number({ invalid_type_error: "Choose your passout year" })
    .int()
    .refine((y) => passoutYears().includes(y), "Choose your passout year"),
  dreamCompany: z
    .string()
    .trim()
    .max(60)
    .transform((v) => v || null),
});
