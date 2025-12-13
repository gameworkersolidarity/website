'use client'

import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface MultiSelectProps<T, K extends keyof T> {
  options: T[]
  value: string[]
  valueKey: K
  onChange: (value: string[]) => void
  renderLabel: (item: T) => React.ReactNode
  placeholder?: string
  name?: string // For form integration
}

export function MultiSelect<T, K extends keyof T>({
  value,
  onChange,
  valueKey,
  renderLabel,
  options = [],
  placeholder = 'Select...',
  name,
}: MultiSelectProps<T, K>) {
  const [open, setOpen] = useState(false)
  const selectedItems =
    options?.filter((option) => value.includes(String(option[valueKey]))).filter(Boolean) || []

  const toggleValue = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const removeValue = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== optionValue))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          type="button"
          className={twMerge(
            'w-full justify-between overflow-hidden min-h-10 h-auto',
            value.length > 0 && 'bg-snot-300',
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1 items-start justify-start">
            {selectedItems?.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : selectedItems?.length <= 1 ? (
              selectedItems?.map((item) => (
                <div key={String(item[valueKey])} className="flex items-center gap-1 text-sm">
                  {renderLabel(item)}
                </div>
              ))
            ) : (
              <span className="text-sm flex flex-row flex-wrap items-center gap-1">
                {selectedItems?.slice(0, 1).map((item) => (
                  <span key={String(item[valueKey])}>{renderLabel(item)}</span>
                ))}
                <span>+ {selectedItems?.length - 1} more</span>
              </span>
            )}
          </div>
          <ChevronsUpDown className="opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} className="h-9" />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options?.map((option) => {
                const optionValue = String(option[valueKey])
                const isSelected = value.includes(optionValue)
                return (
                  <CommandItem
                    key={optionValue}
                    onSelect={() => {
                      toggleValue(optionValue)
                    }}
                    className={twMerge('cursor-pointer', isSelected && 'bg-snot-300')}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleValue(optionValue)}
                      className="mr-2"
                    />
                    {renderLabel(option)}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
