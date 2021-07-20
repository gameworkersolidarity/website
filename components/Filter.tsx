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
  const hasSelections = !!selectionCount
  return (
    <div className={cx(
      !isOpen && !hasSelections ? 'border-gray-300' : '',
      isOpen ? 'border-b-0 rounded-b-none bg-white z-50 border-gwPink' : 'hover:shadow-innerGwPink',
      hasSelections ? 'border-gwPink' : '',
      (
        !isOpen && hasSelections ? 'shadow-innerGwPink' :
        isOpen && hasSelections ? 'border-gwPink' : 
        // Untouched state
        'hover:border-gwPink active:bg-gwPink'
      ),
      'rounded-lg text-black border-2 px-3 py-2 text-sm font-semibold w-full relative'
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
      selected ? 'bg-gwPink'
      : disabled ? 'text-gray-400 cursor-not-allowed'
      : active ? 'bg-gray-100'
      : 'bg-white',
      'px-3 py-2 cursor-pointer text-left flex justify-start items-baseline w-full'
    )}>{children}</div>
  )
}