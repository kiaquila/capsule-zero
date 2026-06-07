import { z } from "zod";

export interface AuthValidationMessages {
  invalidEmail: string;
  weakPassword: string;
  passwordsMismatch: string;
}

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

export function createSignInSchema(messages: AuthValidationMessages) {
  return z.object({
    email: z.string().trim().email(messages.invalidEmail),
    password: z.string().min(8, messages.weakPassword),
  });
}

export function createSignUpSchema(messages: AuthValidationMessages) {
  return z
    .object({
      email: z.string().trim().email(messages.invalidEmail),
      password: z.string().min(8, messages.weakPassword),
      confirmPassword: z.string().min(8, messages.weakPassword),
      name: optionalText,
      country: optionalText,
      city: optionalText,
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: messages.passwordsMismatch,
    });
}

export function createRecoverySchema(messages: AuthValidationMessages) {
  return z.object({
    email: z.string().trim().email(messages.invalidEmail),
  });
}

export type SignInInput = z.infer<ReturnType<typeof createSignInSchema>>;
export type SignUpInput = z.infer<ReturnType<typeof createSignUpSchema>>;
export type RecoveryInput = z.infer<ReturnType<typeof createRecoverySchema>>;
