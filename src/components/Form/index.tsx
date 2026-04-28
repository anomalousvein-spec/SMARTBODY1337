import React from "react";
import { cn } from "../../utils/ui";

export interface InputFieldProps {
  /** Label text for the input field */
  label: string;
  /** Input type (text, number, date, etc.) */
  type: string;
  /** Current value of the input */
  value: string | number;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Minimum value (for number/date inputs) */
  min?: string | number;
  /** Maximum value (for number/date inputs) */
  max?: string | number;
  /** Step value (for number inputs) */
  step?: string | number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom ID for the input element */
  id?: string;
  /** ARIA label if different from label */
  ariaLabel?: string;
}

/**
 * Reusable input field component with consistent styling
 * @param props - Input field configuration
 * @returns Form input element with label and optional error message
 */
export function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  min,
  max,
  step,
  disabled = false,
  className,
  id,
  ariaLabel,
}: InputFieldProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className="block text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-2 ml-1"
      >
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel || label}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(
          "w-full max-w-full px-4 py-3.5 rounded-xl border border-white/10 bg-theme-bg-tertiary/60 text-theme-text-primary outline-none transition-all duration-200 box-border",
          "focus:ring-2 focus:ring-theme-accent/50 focus:border-theme-accent/50",
          "hover:border-white/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error &&
            "border-error/50 focus:ring-error/30 focus:border-error/50",
          type === "date" && "text-sm",
        )}
      />
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 ml-1 text-[10px] font-bold text-error uppercase tracking-wide"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export interface SelectFieldProps {
  /** Label text for the select field */
  label: string;
  /** Current selected value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Array of selectable options */
  options: { value: string; label: string }[];
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom ID for the select element */
  id?: string;
  /** ARIA label if different from label */
  ariaLabel?: string;
}

/**
 * Reusable select field component with consistent styling
 * @param props - Select field configuration
 * @returns Form select element with label
 */
export function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  className,
  id,
  ariaLabel,
}: SelectFieldProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={className}>
      <label
        htmlFor={selectId}
        className="block text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-2 ml-1"
      >
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel || label}
        className={cn(
          "w-full px-4 py-3.5 rounded-xl border border-white/10 bg-theme-bg-tertiary/60 text-theme-text-primary outline-none transition-all duration-200",
          "focus:ring-2 focus:ring-theme-accent/50 focus:border-theme-accent/50",
          "hover:border-white/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "appearance-none cursor-pointer pr-10",
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a1a1aa'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "1.25rem",
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export interface TextAreaFieldProps {
  /** Label text for the textarea */
  label: string;
  /** Current value of the textarea */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Number of visible rows */
  rows?: number;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom ID for the textarea element */
  id?: string;
  /** ARIA label if different from label */
  ariaLabel?: string;
}

/**
 * Reusable textarea field component with consistent styling
 * @param props - Textarea field configuration
 * @returns Form textarea element with label
 */
export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false,
  disabled = false,
  className,
  id,
  ariaLabel,
}: TextAreaFieldProps) {
  const textareaId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={className}>
      <label
        htmlFor={textareaId}
        className="block text-[10px] font-black uppercase tracking-widest text-theme-text-tertiary mb-2 ml-1"
      >
        {label}
      </label>
      <textarea
        id={textareaId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel || label}
        className={cn(
          "w-full px-4 py-3.5 rounded-xl border border-white/10 bg-theme-bg-tertiary/60 text-theme-text-primary outline-none transition-all duration-200",
          "focus:ring-2 focus:ring-theme-accent/50 focus:border-theme-accent/50",
          "hover:border-white/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "resize-none",
        )}
      />
    </div>
  );
}

export interface FormMessageProps {
  /** Type of message (error, success, or info) */
  type: "error" | "success" | "info";
  /** Message text to display */
  message: string;
}

/**
 * Reusable form message component for error, success, and info states
 * @param props - Message configuration
 * @returns Styled message banner with appropriate colors
 */
export function FormMessage({ type, message }: FormMessageProps) {
  const styles = {
    error: "bg-error/10 border border-error/20 text-error",
    success: "bg-success/10 border border-success/20 text-success",
    info: "bg-theme-accent/10 border border-theme-accent/20 text-theme-accent",
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2 duration-300",
        styles[type],
      )}
      role={type === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {message}
    </div>
  );
}

export interface SubmitButtonProps {
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
  /** Text to display while submitting */
  submittingText?: string;
  /** Text to display when idle */
  idleText: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** ARIA label for the button */
  ariaLabel?: string;
}

/**
 * Reusable submit button with loading state
 * @param props - Button configuration
 * @returns Submit button with loading state indicator
 */
export function SubmitButton({
  isSubmitting,
  submittingText = "Saving...",
  idleText,
  disabled = false,
  className,
  ariaLabel,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting || disabled}
      aria-busy={isSubmitting}
      aria-label={ariaLabel}
      className={cn(
        "w-full py-4 px-4 bg-theme-accent hover:bg-theme-accent/90 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-xl transition-all duration-200 active:scale-[0.98]",
        "flex items-center justify-center gap-2",
        "shadow-lg shadow-theme-accent/25 hover:shadow-xl hover:shadow-theme-accent/30",
        className,
      )}
    >
      {isSubmitting && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {isSubmitting ? submittingText : idleText}
    </button>
  );
}

// Re-export PercentageLossSlider
export { PercentageLossSlider } from "./PercentageLossSlider";
export type { PercentageLossSliderProps } from "./PercentageLossSlider";
