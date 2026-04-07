# 🛡️ Global Validation & Sanitization System

A high-performance, scalable system for handling form inputs in **GymFlow**. This system prevents invalid data at the UX level (typing), logic level (validation), and security level (sanitization).

---

## 🚀 Quick Start: `InputField` Component

The easiest way to use the system is via the `InputField` component. It automatically handles labels, errors, and real-time typing restrictions.

```tsx
import { InputField } from "@/components/ui/input-field";

// In your form:
<InputField
  label="Full Name"
  validateType="name"
  required
  placeholder="Enter name"
  onChange={(val) => setFormData({ ...formData, name: val })}
/>
```

---

## 🧩 Core Architecture

### 1. `lib/utils/validators.ts` (The Logic)
Contains regex patterns and sanitization rules. This is where you add new global field types.

**Available Types:**
- `name`: Alpha & spaces only.
- `phone`: Pakistan format (`03...` or `+92...`).
- `email`: Standard email validation.

### 2. `hooks/use-input-validation.ts` (The Brain)
A custom hook that intercepts `onChange` to block invalid characters (e.g., typing numbers in a name field).

**Features:**
- **Real-time Restriction**: Blocks keys that don't match the `restrictPattern`.
- **Paste Protection**: Automatically filters invalid characters when data is pasted.
- **Sanitization**: normalization of data (e.g., removing extra spaces).

### 3. `components/ui/input-field.tsx` (The UI)
A premium UI wrapper with built-in HUD indicators for validation status.

---

## 🛠️ Advanced Usage

### Custom Validation
If you need a specific rule not in the global config, pass a `customRule`:

```tsx
<InputField
  label="Custom Code"
  validateType="custom"
  customRule={{
    pattern: /^[A-Z]{3}-\d{4}$/,
    restrictPattern: /[A-Z0-9-]/,
    errorMessage: "Format must be XXX-0000"
  }}
/>
```

### Manual Sanitization
Before sending data to the API, you can use the sanitizer directly:

```tsx
import { sanitizeInput } from "@/lib/utils/validators";

const finalData = {
  name: sanitizeInput(rawName, "name"),
};
```

---

## 🛡️ Security Best Practices
1. **Frontend != Backend**: While this system provides a great UX, always validate again on the API level.
2. **Sanitize on Submit**: Use the `sanitizedValue` returned by the hook or the `sanitizeInput` utility before DB storage.
3. **Trim early**: The system automatically trims whitespace to prevent "invisible" data errors.
