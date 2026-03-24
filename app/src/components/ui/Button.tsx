"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================
// BUTTON — Capsule Zero UI
// Варианты: primary (тёмный), secondary (neumorphic), ghost
// Neumorphism: active state вдавленный
// ============================================================

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  loading?:  boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--color-gray-900)] text-[var(--color-white)]",
    "hover:bg-[var(--color-black)]",
    "active:bg-[var(--color-gray-800)]",
    "disabled:bg-[var(--color-gray-300)] disabled:text-[var(--color-gray-500)]",
  ].join(" "),

  secondary: [
    "neu-hover",
    "bg-[var(--color-neu-bg)] text-[var(--color-gray-800)]",
    "shadow-[var(--shadow-neu-sm)]",
    "hover:shadow-[var(--shadow-neu-hover)]",
    "active:shadow-[var(--shadow-neu-inset-sm)]",
    "disabled:opacity-50 disabled:shadow-[var(--shadow-neu-sm)]",
  ].join(" "),

  ghost: [
    "bg-transparent text-[var(--color-gray-700)]",
    "hover:bg-[var(--color-gray-100)]",
    "active:bg-[var(--color-gray-200)]",
    "disabled:opacity-40",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-4 text-sm gap-1.5 rounded-[var(--radius-md)]",
  md: "h-11 px-6 text-base gap-2 rounded-[var(--radius-md)]",
  lg: "h-14 px-8 text-lg gap-2.5 rounded-[var(--radius-lg)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant  = "primary",
      size     = "md",
      loading  = false,
      fullWidth = false,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        className={cn(
          // Base
          "inline-flex items-center justify-center font-sans font-medium",
          "cursor-pointer select-none",
          "transition-all duration-[250ms]",
          "disabled:cursor-not-allowed",
          // Variant
          variantStyles[variant],
          // Size
          sizeStyles[size],
          // Full width
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner />
            {children}
          </span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

// Минималистичный спиннер
function LoadingSpinner() {
  return (
    <motion.span
      className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    />
  );
}
