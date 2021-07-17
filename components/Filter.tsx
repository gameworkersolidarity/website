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
      isOpen ? 'rounded-t-lg border-b-0 z-50' : 'hover:bg-gray-100 rounded-lg',
      'active:bg-gwYellow text-black border-2 border-gray-300 px-3 py-2 text-sm font-semibold w-full relative bg-white'
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
      selected ? 'bg-gwYellow'
      : disabled ? 'text-gray-400 cursor-not-allowed'
      : active ? 'bg-gwPinkLight'
      : 'bg-white',
      'px-3 py-2 cursor-pointer text-left flex justify-start items-baseline w-full'
    )}>{children}</div>
  )
}