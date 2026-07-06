"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

// Shared glass input row for every auth form (sign-in/sign-up/recovery).
// Extracted from AuthPanel.tsx in spec 035 when the recovery modes joined it.

export interface AuthFieldProps {
  autoComplete: string;
  error?: string;
  inputMode?: "email" | "numeric";
  name: string;
  placeholder: string;
  register: UseFormRegisterReturn;
  reveal?: {
    visible: boolean;
    toggle: () => void;
    label: string;
  };
  testId?: string;
  type: string;
}

export function AuthField({
  autoComplete,
  error,
  inputMode,
  name,
  placeholder,
  register,
  reveal,
  testId,
  type,
}: AuthFieldProps) {
  return (
    <div className="auth-field">
      <div className="auth-field-wrap">
        <input
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className={cn("auth-input", error && "auth-input-error", reveal && "auth-input-with-reveal")}
          data-testid={testId}
          id={name}
          inputMode={inputMode}
          placeholder={placeholder}
          type={type}
          {...register}
        />
        {reveal ? (
          <button
            aria-label={reveal.label}
            className="auth-eye"
            onClick={reveal.toggle}
            type="button"
          >
            <EyeIcon hidden={reveal.visible} />
          </button>
        ) : null}
      </div>
      <p className={cn("auth-field-message", error && "auth-field-message-error")}>
        {error ?? ""}
      </p>
    </div>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
        <path
          d="M17.94 17.94A10.1 10.1 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 0 1-4.24-4.24M1 1l22 22"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
