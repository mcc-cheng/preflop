import Link from 'next/link'

interface BackLinkProps {
  href: string
  label: string
}

export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-sm mb-4 transition-all duration-200"
    >
      ← {label}
    </Link>
  )
}
