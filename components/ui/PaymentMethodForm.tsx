export const PAYMENT_TYPES = [
  { value: 'VENMO', label: 'Venmo' },
  { value: 'CASH_APP', label: 'Cash App' },
  { value: 'ZELLE', label: 'Zelle' },
  { value: 'APPLE_PAY', label: 'Apple Pay' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'DEBIT_CARD', label: 'Debit Card' },
]

export function getIdentifierLabel(type: string) {
  if (type === 'VENMO' || type === 'CASH_APP') return 'Username'
  if (type === 'APPLE_PAY' || type === 'PAYPAL' || type === 'ZELLE') return 'Email or phone number'
  return 'Account info'
}

const inputClass = 'w-full px-4 py-3 bg-surface-raised border border-outline rounded-xl text-on-surface focus:border-on-surface focus:outline-none transition-all duration-150'

interface PaymentMethodFormProps {
  paymentType: string
  identifier: string
  nickname: string
  onChangeType: (v: string) => void
  onChangeIdentifier: (v: string) => void
  onChangeNickname: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel?: () => void
  loading?: boolean
  error?: string
  submitLabel?: string
  excludeTypes?: string[]
}

export function PaymentMethodForm({
  paymentType,
  identifier,
  nickname,
  onChangeType,
  onChangeIdentifier,
  onChangeNickname,
  onSubmit,
  onCancel,
  loading,
  error,
  submitLabel = 'Add',
  excludeTypes = [],
}: PaymentMethodFormProps) {
  const availableTypes = PAYMENT_TYPES.filter((t) => !excludeTypes.includes(t.value))

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-on-surface-variant mb-2">Type</label>
        <select
          value={paymentType}
          onChange={(e) => onChangeType(e.target.value)}
          className={inputClass}
        >
          {availableTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-on-surface-variant mb-2">
          {getIdentifierLabel(paymentType)}
        </label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => onChangeIdentifier(e.target.value)}
          className={inputClass}
          required
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm text-on-surface-variant mb-2">
          Nickname <span className="text-on-surface-variant opacity-60">(optional)</span>
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => onChangeNickname(e.target.value)}
          placeholder="e.g., My Venmo"
          className={inputClass}
        />
      </div>

      {error && <div className="text-error text-sm">{error}</div>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 h-11 bg-primary text-on-primary font-medium rounded-xl active:scale-95 disabled:opacity-40 transition-all duration-200"
        >
          {loading ? 'Adding...' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 h-11 border border-outline text-on-surface rounded-xl hover:bg-surface-raised transition-all duration-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
