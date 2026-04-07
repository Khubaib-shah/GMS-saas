"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { 
  Field, 
  FieldLabel, 
  FieldError, 
  FieldDescription 
} from "@/components/ui/field"
import { useInputValidation } from "@/hooks/use-input-validation"
import { type ValidationType } from "@/lib/utils/validators"

interface InputFieldProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  label?: string
  validateType?: ValidationType
  description?: string
  required?: boolean
  hideLabel?: boolean
  leadingIcon?: React.ReactNode
  value?: string
  onChange?: (value: string, event?: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onValidationError?: (error: string) => void
  customRule?: {
    pattern: RegExp
    errorMessage: string
    restrictPattern?: RegExp
  }
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ 
    label, 
    validateType = "text", 
    description, 
    required, 
    hideLabel = false,
    leadingIcon,
    value: controlledValue,
    onChange,
    onValidationError,
    customRule,
    className,
    placeholder,
    ...props 
  }, ref) => {
    const {
      value,
      error,
      handleChange,
      handleBlur,
      handlePaste,
      isInvalid,
    } = useInputValidation({
      type: validateType,
      initialValue: controlledValue || "",
      required,
      customRule,
    })

    // Notify parent of changes
    React.useEffect(() => {
      // Only call onChange if it's NOT a file input, as file inputs are handled manually in handleChange
      // to avoid losing the event object.
      if (onChange && validateType !== 'text' && props.type !== 'file') {
        onChange(value)
      }
    }, [value, onChange, validateType, props.type])

    // Notify parent of errors
    React.useEffect(() => {
      if (onValidationError) onValidationError(error)
    }, [error, onValidationError])

    return (
      <Field className={cn("w-full", className)}>
        {label && !hideLabel && (
          <FieldLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">
            {label} {required && <span className="text-primary">*</span>}
          </FieldLabel>
        )}
        
        <div className="relative group/input-field">
          {leadingIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input-field:text-primary transition-colors z-10">
              {leadingIcon}
            </div>
          )}
          <Input
            {...props}
            ref={ref}
            value={value}
            onChange={(e) => {
              handleChange(e);
              if (onChange) onChange(e.target.value, e);
            }}
            onBlur={handleBlur}
            onPaste={handlePaste}
            placeholder={placeholder}
            aria-invalid={isInvalid}
            className={cn(
              "h-12 bg-white/5 border-transparent focus:bg-white/10 text-[11px] font-bold tracking-wider uppercase transition-all duration-300 rounded-xl",
              leadingIcon && "pl-12",
              isInvalid 
                ? "border-destructive/50 focus:border-destructive ring-destructive/20" 
                : "focus:border-primary/50",
              !isInvalid && value && "border-primary/20",
              className
            )}
          />
          
          {/* Tactical status indicator (bottom right) */}
          {value && !isInvalid && validateType !== "text" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50 group-focus-within/input-field:opacity-100 transition-opacity">
              <div className="w-1 h-1 rounded-full bg-primary animate-pulse"></div>
              <span className="text-[8px] font-black text-primary uppercase italic">Valid</span>
            </div>
          )}
        </div>

        {description && <FieldDescription className="text-[9px] text-slate-500 font-bold uppercase">{description}</FieldDescription>}
        
        {error && !hideLabel && (
          <FieldError className="text-[10px] font-bold italic tracking-wider mt-1 text-destructive animate-fade-in">
            {error}
          </FieldError>
        )}
      </Field>
    )
  }
)

InputField.displayName = "InputField"

export { InputField }
