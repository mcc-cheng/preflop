const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

interface AvatarProps {
  name: string
  size?: keyof typeof sizeMap
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-surface-raised flex items-center justify-center text-on-surface-variant font-medium flex-shrink-0`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
