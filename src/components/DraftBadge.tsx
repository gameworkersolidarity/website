import { twMerge } from 'tailwind-merge'

export function DraftBadge({ className }: { className?: string }) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center bg-snot-400 text-black px-2 py-1 rounded-md text-xs font-mono uppercase tracking-wide',
        className,
      )}
    >
      Draft
    </span>
  )
}
