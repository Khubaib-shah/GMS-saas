export type ValidationType = "name" | "phone" | "email" | "password" | "text" | "number" | "price" | "custom"

export interface ValidationRule {
  pattern: RegExp
  errorMessage: string
  restrictPattern?: RegExp // Pattern used to block characters during typing
}

export const VALIDATION_RULES: Record<string, ValidationRule> = {
  name: {
    pattern: /^[A-Za-z\s]+$/,
    restrictPattern: /[A-Za-z\s]/,
    errorMessage: "Only letters are allowed",
  },
  phone: {
    pattern: /^(\+92|0)[0-9]{10}$/,
    restrictPattern: /[0-9\+]/,
    errorMessage: "Enter a valid phone number (03xx... or +923xx...)",
  },
  email: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/,
    errorMessage: "Invalid email format",
  },
  password: {
    pattern: /^.{6,}$/,
    errorMessage: "Minimum 6 characters required",
  },
  text: {
    pattern: /.*/,
    errorMessage: "",
  },
  number: {
    pattern: /^\d+$/,
    restrictPattern: /[0-9]/,
    errorMessage: "Only numbers are allowed",
  },
  price: {
    pattern: /^\d+(\.\d{0,2})?$/,
    restrictPattern: /[0-9\.]/,
    errorMessage: "Invalid price format",
  },
}

/**
 * Sanitizes input based on type.
 */
export function sanitizeInput(value: string, type: ValidationType): string {
  let sanitized = value.trim()
  
  if (type === "name") {
    sanitized = sanitized.replace(/\s+/g, " ")
  }
  
  if (type === "email") {
    sanitized = sanitized.toLowerCase()
  }

  if (type === "number" || type === "price") {
    // Keep numbers and one decimal point for price
    sanitized = sanitized.replace(/[^0-9.]/g, "")
    if (type === "price") {
      const parts = sanitized.split(".")
      if (parts.length > 2) sanitized = parts[0] + "." + parts.slice(1).join("")
    }
  }

  return sanitized
}

/**
 * Validates a value against a rule type.
 */
export function validateValue(value: string, type: ValidationType | string, customRule?: ValidationRule) {
  const rule = customRule || VALIDATION_RULES[type]
  
  if (!rule) return { isValid: true, errorMessage: "" }
  if (type === "text" || type === "custom" && !rule.pattern) return { isValid: true, errorMessage: "" }
  if (!value) return { isValid: false, errorMessage: "Field is required" }

  const isValid = rule.pattern.test(value)
  return {
    isValid,
    errorMessage: isValid ? "" : rule.errorMessage,
  }
}

/**
 * Interceptor for onChange to block invalid characters.
 */
export function isCharacterAllowed(char: string, type: ValidationType | string): boolean {
  const rule = VALIDATION_RULES[type]
  if (!rule || !rule.restrictPattern) return true
  
  return rule.restrictPattern.test(char)
}
