import cx from 'classnames';
import pluralize from 'pluralize';

export function FilterButton ({
  label = 'Select',
  selectionCount,
  isOpen
}: {
  label?: string
  selectionCount?: number
  isOpen?: boolean
}) {
  return (
    <div className={cx(
      !!selectionCount ? 'bg-gwYellow border-black' : '',
      isOpen && 'shadow-gwPink z-50',
      'relative text-black rounded-lg border-2 border-gray-300 px-3 py-2 text-sm font-semibold w-full'
    )}>
      {!selectionCount ? label : pluralize(label, selectionCount, true)}
      &nbsp;
      <span className={cx(isOpen ? 'rotate-180': '', 'transform text-gray-800 inline-block text-lg leading-none')}>
        ▾
      </span>
    </div>
  )
}

export function FilterOption ({
  children,
  isActive,
  isSelected,
}: {
  children?: any
  isActive?: boolean
  isSelected?: boolean
}) {
  return (
    <div className={cx(
      isActive && 'bg-gwPink',
      isSelected && 'bg-gwYellow',
      'px-3 py-2 rounded-lg cursor-pointer text-left flex justify-start w-full'
    )}>{children}</div>
  )
}