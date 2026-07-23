import { z } from "zod";

export interface AuthValidationMessages {
  invalidEmail: string;
  weakPassword: string;
  passwordsMismatch: string;
  invalidCode: string;
}

export function createSignInSchema(messages: AuthValidationMessages) {
  return z.object({
    email: z.string().trim().email(messages.invalidEmail),
    password: z.string().min(8, messages.weakPassword),
  });
}

// Sign-up asks only for credentials (spec 048) — profile details (name,
// country, city) are collected later on the profile screen.
export function createSignUpSchema(messages: AuthValidationMessages) {
  return z
    .object({
      email: z.string().trim().email(messages.invalidEmail),
      password: z.string().min(8, messages.weakPassword),
      confirmPassword: z.string().min(8, messages.weakPassword),
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

// The one-time-code schemas cover only what the user types; the Kratos flow id
// is program state and is validated by the server action that carries it.
export function createRecoveryCompleteSchema(
  messages: AuthValidationMessages,
) {
  return z
    .object({
      code: z.string().trim().min(4, messages.invalidCode),
      newPassword: z.string().min(8, messages.weakPassword),
      confirmPassword: z.string().min(8, messages.weakPassword),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      path: ["confirmPassword"],
      message: messages.passwordsMismatch,
    });
}

export function createVerificationCodeSchema(
  messages: AuthValidationMessages,
) {
  return z.object({
    code: z.string().trim().min(4, messages.invalidCode),
  });
}

export function createPasswordChangeSchema(messages: AuthValidationMessages) {
  return z
    .object({
      currentPassword: z.string().min(1, messages.weakPassword),
      newPassword: z.string().min(8, messages.weakPassword),
      confirmPassword: z.string().min(8, messages.weakPassword),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      path: ["confirmPassword"],
      message: messages.passwordsMismatch,
    });
}

export type SignInInput = z.infer<ReturnType<typeof createSignInSchema>>;
export type SignUpInput = z.infer<ReturnType<typeof createSignUpSchema>>;
export type RecoveryInput = z.infer<ReturnType<typeof createRecoverySchema>>;
export type RecoveryCompleteInput = z.infer<
  ReturnType<typeof createRecoveryCompleteSchema>
>;
export type VerificationCodeInput = z.infer<
  ReturnType<typeof createVerificationCodeSchema>
>;
export type PasswordChangeInput = z.infer<
  ReturnType<typeof createPasswordChangeSchema>
>;
