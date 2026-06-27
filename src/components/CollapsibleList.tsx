import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { createContext, useContext, useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

export function CollapsibleList({
  children,
  ...props
}: {
  children: React.ReactNode
} & React.ComponentProps<typeof Collapsible>) {
  const [isOpen, setIsOpen] = useState<boolean>(props.defaultOpen ?? true)
  return (
    <CollapseContext.Provider value={{ isOpen, setIsOpen }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} {...props}>
        {children}
      </Collapsible>
    </CollapseContext.Provider>
  )
}

const CollapseContext = createContext<{ isOpen: boolean; setIsOpen: (isOpen: boolean) => void }>({
  isOpen: false,
  setIsOpen: () => {},
})

export function useCollapseContext() {
  return useContext(CollapseContext)
}

export function CollapsibleTriggerIcon({ className }: { className?: string }) {
  const { isOpen } = useCollapseContext()
  return <CollapsibleListButton open={isOpen} className={className} />
}

export function CollapsibleListButton({ open, className }: { open: boolean; className?: string }) {
  return open ? (
    <ChevronsDownUp className={twMerge('w-3.5 h-3.5 text-stone-500', className)} />
  ) : (
    <ChevronsUpDown className={twMerge('w-3.5 h-3.5 text-stone-500', className)} />
  )
}
