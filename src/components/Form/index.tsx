import React from 'react';
import { haptics } from '../../utils/haptics';
import { cn } from '../../utils/ui';

export interface InputFieldProps {
  /** Label text for the input field */
  label: string;
  /** Input type (text, number, date, etc.) */
  type: string;
  /** Current value of the input */
  value: string;
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
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={className}>
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-theme-text-secondary mb-1"
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
          "w-full px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary",
          "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-red-500 focus:ring-red-500"
        )}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-500" role="alert">
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
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={className}>
      <label 
        htmlFor={selectId}
        className="block text-sm font-medium text-theme-text-secondary mb-1"
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
          "w-full px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary",
          "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
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
  const textareaId = id || label.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={className}>
      <label 
        htmlFor={textareaId}
        className="block text-sm font-medium text-theme-text-secondary mb-1"
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
          "w-full px-4 py-2 rounded-lg border border-white/10 bg-theme-bg-tertiary text-theme-text-primary",
          "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "resize-none"
        )}
      />
    </div>
  );
}

export interface FormMessageProps {
  /** Type of message (error, success, or info) */
  type: 'error' | 'success' | 'info';
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
    error: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    success: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  };

  return (
    <div 
      className={cn("p-3 rounded-lg text-sm", styles[type])}
      role={type === 'error' ? 'alert' : 'status'}
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
  submittingText = 'Saving...',
  idleText,
  disabled = false,
  className,
  ariaLabel,
}: SubmitButtonProps) {
  return (
    <button
      type="submit" onClick={() => haptics.medium()}
      disabled={isSubmitting || disabled}
      aria-busy={isSubmitting}
      aria-label={ariaLabel}
      className={cn(
        "w-full py-3 px-4 bg-theme-accent hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg",
        "transition-colors duration-200 flex items-center justify-center",
        className
      )}
    >
      {isSubmitting ? submittingText : idleText}
    </button>
  );
}
