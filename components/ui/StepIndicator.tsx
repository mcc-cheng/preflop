import { Fragment } from 'react'

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const completed = stepNum < currentStep
        const active = stepNum === currentStep
        return (
          <Fragment key={label}>
            {i > 0 && <div className="flex-1 h-px bg-outline" />}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  completed
                    ? 'bg-success text-on-primary'
                    : active
                    ? 'bg-on-surface text-on-primary'
                    : 'bg-surface-raised text-on-surface-variant'
                }`}
              >
                {completed ? '✓' : stepNum}
              </div>
              <span className={`text-sm ${active ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>
                {label}
              </span>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}
