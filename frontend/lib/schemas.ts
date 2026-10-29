import { z } from "zod";

const email = z
  .string()
  .min(1, "Enter your email address")
  .email("Enter a valid email address");

const password = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password cannot exceed 128 characters");

export const loginSchema = z.object({
  email,
  password,
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username cannot exceed 30 characters")
      .regex(/^[a-zA-Z0-9._-]+$/, "Use only letters, numbers, dots, hyphens, or underscores"),
    email,
    password,
    confirmPassword: z.string().min(1, "Repeat your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({
    token: z.string().min(1, "Recovery token is missing"),
    password,
    confirmPassword: z.string().min(1, "Repeat your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifySchema = z.object({
  token: z.string().min(1, "Paste the token you received by email"),
});

export const codeSchema = z.object({
  email,
  code: z
    .string()
    .min(6, "The code is 6 digits")
    .max(6, "The code is 6 digits")
    .regex(/^\d{6}$/, "The code must contain only numbers"),
});

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, "Enter your current password"),
    new_password: password,
    confirmPassword: z.string().min(1, "Repeat the new password"),
  })
  .refine((values) => values.new_password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((values) => values.old_password !== values.new_password, {
    message: "The new password must be different from the current one",
    path: ["new_password"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotValues = z.infer<typeof forgotSchema>;
export type ResetValues = z.infer<typeof resetSchema>;
export type VerifyValues = z.infer<typeof verifySchema>;
export type CodeValues = z.infer<typeof codeSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
