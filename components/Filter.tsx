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
      'hover:bg-gray-100 active:bg-gwYellow relative text-black rounded-lg border-2 border-gray-300 px-3 py-2 text-sm font-semibold w-full'
    )}>
      {!selectionCount ? label : pluralize(label, selectionCount, true)}
      &nbsp;
      <span className={cx(isOpen ? 'rotate-180': '', 'transform text-gray-800 inline-block text-lg leading-none')}>
        ▾
      </span>
    </div>
  )
}

type HeadlessUiListBoxOptionArgs = {
  active: boolean;
  selected: boolean;
  disabled: boolean;
}

export function FilterOption ({
  children,
  active,
  selected,
  disabled
}: {
  children?: any
} & HeadlessUiListBoxOptionArgs) {
  return (
    <div className={cx(
      disabled ? 'text-gray-400 cursor-not-allowed'
      : active ? 'bg-gwPinkLight'
      : selected ? 'bg-gwYellow'
      : 'bg-white',
      'px-3 py-2 rounded-lg cursor-pointer text-left flex justify-start w-full'
    )}>{children}</div>
  )
}