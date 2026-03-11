/**
 * Form Input Component
 *
 * Component: FormInput
 * Purpose: Reusable input field with label, error display, and focus glow animation.
 * Used by all forms via React Hook Form integration.
 *
 * Design:
 * - Dark dotted surface background
 * - Subtle border glow on focus (Framer Motion)
 * - Inline errors below field on blur — PRD Section 20.2
 * - Required fields marked with asterisk
 * - Meaningful placeholder text
 *
 * Appears on: All form modals
 *
 * Reference: PRD Section 20.2 (Form Design Rules), Section 5.5 (Input glow on focus)
 */
"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Field label text */
  label: string;
  /** Error message from validation */
  error?: string;
  /** Whether this field is required (shows asterisk) */
  isRequired?: boolean;
}

/**
 * FormInput — Styled input with label, error, and focus glow.
 * Compatible with React Hook Form's register() via forwardRef.
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput({ label, error, isRequired, className = "", ...props }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        {/* Label with optional required indicator */}
        <label className="text-sm font-medium text-foreground">
          {label}
          {isRequired && <span className="text-accent-red ml-1">*</span>}
        </label>

        {/* Input with focus glow — PRD Section 5.5 */}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2.5 rounded-lg
            bg-surface border border-border
            text-foreground text-sm
            placeholder:text-muted/50
            focus:outline-none focus:border-accent-purple/50
            focus:shadow-[0_0_0_2px_rgba(168,85,247,0.15)]
            transition-all duration-200
            ${error ? "border-accent-red/50" : ""}
            ${className}
          `}
          {...props}
        />

        {/* Inline error — PRD Section 20.2 (shown below field on blur) */}
        {error && (
          <p className="text-xs text-accent-red mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

/**
 * FormTextarea — Styled textarea with all FormInput features.
 */
interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  isRequired?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea({ label, error, isRequired, className = "", ...props }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          {label}
          {isRequired && <span className="text-accent-red ml-1">*</span>}
        </label>

        <textarea
          ref={ref}
          className={`
            w-full px-3 py-2.5 rounded-lg
            bg-surface border border-border
            text-foreground text-sm
            placeholder:text-muted/50
            focus:outline-none focus:border-accent-purple/50
            focus:shadow-[0_0_0_2px_rgba(168,85,247,0.15)]
            transition-all duration-200
            resize-none min-h-[80px]
            ${error ? "border-accent-red/50" : ""}
            ${className}
          `}
          {...props}
        />

        {error && (
          <p className="text-xs text-accent-red mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

/**
 * FormSelect — Styled select dropdown with spring open/close.
 */
interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  isRequired?: boolean;
  options: Array<{ value: string; label: string }>;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect(
    { label, error, isRequired, options, className = "", ...props },
    ref
  ) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          {label}
          {isRequired && <span className="text-accent-red ml-1">*</span>}
        </label>

        <select
          ref={ref}
          className={`
            w-full px-3 py-2.5 rounded-lg
            bg-surface border border-border
            text-foreground text-sm
            focus:outline-none focus:border-accent-purple/50
            focus:shadow-[0_0_0_2px_rgba(168,85,247,0.15)]
            transition-all duration-200
            ${error ? "border-accent-red/50" : ""}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="text-xs text-accent-red mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

/**
 * FormColorPicker — Hex color picker with preview.
 */
interface FormColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  error?: string;
  isRequired?: boolean;
}

/** Preset color options for quick selection */
const PRESET_COLORS = [
  "#a855f7", // purple
  "#3b82f6", // blue
  "#22c55e", // green
  "#f97316", // orange
  "#ef4444", // red
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#14b8a6", // teal
];

export function FormColorPicker({
  label,
  value,
  onChange,
  error,
  isRequired,
}: FormColorPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {isRequired && <span className="text-accent-red ml-1">*</span>}
      </label>

      <div className="flex items-center gap-2 flex-wrap">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`
              w-7 h-7 rounded-full border-2 transition-all duration-200
              ${value === color ? "border-foreground scale-110" : "border-transparent hover:scale-105"}
            `}
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
          />
        ))}

        {/* Custom color input */}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded-full border-0 cursor-pointer bg-transparent"
          aria-label="Pick custom color"
        />
      </div>

      {error && (
        <p className="text-xs text-accent-red mt-0.5">{error}</p>
      )}
    </div>
  );
}
