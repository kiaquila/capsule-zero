import { z } from "zod";

export interface ProfileValidationMessages {
  firstName: string;
  lastName: string;
  nameLength: string;
  displayNameLength: string;
  usernameLength: string;
  usernamePattern: string;
  email: string;
  phoneLength: string;
  date: string;
  cityLength: string;
}

const optionalText = z.string().trim().max(80);

export function createProfileFormSchema(messages: ProfileValidationMessages) {
  return z.object({
    firstName: z
      .string()
      .trim()
      .min(1, messages.firstName)
      .max(40, messages.nameLength),
    lastName: z
      .string()
      .trim()
      .min(1, messages.lastName)
      .max(40, messages.nameLength),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, messages.usernameLength)
      .max(30, messages.usernameLength)
      .regex(/^[a-z0-9_]+$/, messages.usernamePattern),
    email: z.string().trim().email(messages.email).max(120, messages.email),
    phone: z.string().trim().max(40, messages.phoneLength),
    dateOfBirth: z.string().trim().max(20, messages.date),
    country: optionalText,
    city: z.string().trim().max(80, messages.cityLength),
    shoeSize: z.string().trim().max(8),
    topSize: z.string().trim().max(8),
    bottomSize: z.string().trim().max(8),
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    googleAuthenticator: z.boolean(),
    pushSecondFactor: z.boolean(),
  }).superRefine((data, ctx) => {
    // The API persists the joined "first last" value as displayName with an
    // 80-rune limit (ProfileUpdateRequest maxLength). Two form-valid
    // 40-character names joined with a space exceed it, so the combined
    // length is validated here as well.
    const displayName = `${data.firstName} ${data.lastName}`.trim();
    if ([...displayName].length > 80) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: messages.displayNameLength,
        path: ["lastName"],
      });
    }
  });
}

export type ProfileFormInput = z.infer<
  ReturnType<typeof createProfileFormSchema>
>;
