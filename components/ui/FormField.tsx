interface FormFieldProps {
  label: string
  children: React.ReactNode
  hint?: string
  required?: boolean
}

export function FormField({ label, children, hint, required }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-on-surface-variant mb-2">
        {label}{required && <span className="text-error ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-on-surface-variant mt-1.5">{hint}</p>}
    </div>
  )
}
