"use client"

import { useState, useCallback, useEffect } from "react"
import { 
  VALIDATION_RULES, 
  sanitizeInput, 
  validateValue, 
  type ValidationType 
} from "@/lib/utils/validators"

interface UseInputValidationOptions {
  type: ValidationType
  initialValue?: string
  required?: boolean
  customRule?: {
    pattern: RegExp
    errorMessage: string
    restrictPattern?: RegExp
  }
}

export function useInputValidation({
  type,
  initialValue = "",
  required = false,
  customRule,
}: UseInputValidationOptions) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState("")
  const [isTouched, setIsTouched] = useState(false)

  // Sync with initialValue if it changes from parent
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const validate = useCallback((val: string) => {
    if (required && !val.trim()) {
      setError("This field is required")
      return false
    }
    
    const result = validateValue(val, type, customRule)
    setError(result.errorMessage)
    return result.isValid
  }, [type, required, customRule])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const rule = customRule || VALIDATION_RULES[type]
    
    // 1. Typing Restriction (UX Level)
    // If typing, check the last character added
    if (rule?.restrictPattern && newValue.length > value.length) {
      const lastChar = newValue.slice(-1)
      if (!rule.restrictPattern.test(lastChar)) {
        return // Block the character
      }
    }

    setValue(newValue)
    if (isTouched) {
      validate(newValue)
    }
  }, [value, type, customRule, isTouched, validate])

  const handleBlur = useCallback(() => {
    setIsTouched(true)
    validate(value)
  }, [value, validate])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pastedData = e.clipboardData.getData("text")
    const rule = customRule || VALIDATION_RULES[type]
    
    if (rule?.restrictPattern) {
      // Filter out characters that are not allowed by the restrictPattern
      const filteredData = pastedData.split("").filter(char => rule.restrictPattern?.test(char)).join("")
      if (filteredData !== pastedData) {
        e.preventDefault()
        const newVal = value + filteredData
        setValue(newVal)
        validate(newVal)
      }
    }
  }, [value, type, customRule, validate])

  const getSanitizedValue = useCallback(() => {
    return sanitizeInput(value, type)
  }, [value, type])

  return {
    value,
    setValue,
    error,
    setError,
    handleChange,
    handleBlur,
    handlePaste,
    validate: () => validate(value),
    isInvalid: !!error,
    sanitizedValue: getSanitizedValue(),
  }
}
