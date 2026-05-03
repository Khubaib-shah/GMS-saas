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
import { Eye, EyeOff } from "lucide-react"

interface InputFieldProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  label?: string
  containerClassName?: string
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
  showSuccessIndicator?: boolean
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({
    label,
    containerClassName,
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
    showSuccessIndicator = false,
    type: initialType = "text",
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const type = initialType === "password" ? (showPassword ? "text" : "password") : initialType

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
      onValueChange: onChange,
      onValidationError,
    })

    return (
      <Field className={cn("w-full relative", containerClassName)}>
        {label && !hideLabel && (
          <FieldLabel className="ml-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">
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
            type={type}
            ref={ref}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onPaste={handlePaste}
            placeholder={placeholder}
            aria-invalid={isInvalid}
            className={cn(
              "h-12 bg-white/5 border-transparent focus:bg-white/10 text-[11px] font-bold tracking-wider transition-all duration-300 rounded-md",
              leadingIcon && "!pl-12",
              initialType === "password" && "pr-12",
              isInvalid
                ? "border-destructive/50 focus:border-destructive ring-destructive/20"
                : "focus:border-primary/50",
              !isInvalid && value && "border-primary/20",
              className
            )}
          />

          {/* Password toggle */}
          {initialType === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {/* Tactical status indicator (bottom right) */}
          {showSuccessIndicator && value && !isInvalid && validateType !== "text" && initialType !== "password" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50 group-focus-within/input-field:opacity-100 transition-opacity">
              <div className="w-1 h-1 rounded-full bg-primary animate-pulse"></div>
              <span className="text-[8px] font-bold text-primary">Valid</span>
            </div>
          )}
        </div>

        {description && <FieldDescription className="text-[9px] text-slate-500 font-bold pl-[5px] !mt-px">{description}</FieldDescription>}

        {error && !hideLabel && (
          <FieldError className="text-[10px] font-bold italic tracking-wider mt-1 text-destructive animate-fade-in absolute top-full left-1">
            {error}
          </FieldError>
        )}
      </Field>
    )
  }
)

InputField.displayName = "InputField"

export { InputField }
