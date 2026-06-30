import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Option = {
  label: string
  value: string
}

type Props = {
  options: Option[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function InputAutoFill({
  options,
  value,
  onChange,
  placeholder = "Select option",
}: Props) {

  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selected = options.find(o => o.value === value)

  const filtered = React.useMemo(() => {
    return options
      .filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 8) // limit results
  }, [options, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {selected?.label ?? placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0">
        <Command>

          <CommandInput
            placeholder="Search..."
            value={search}
            onValueChange={setSearch}
          />

          <CommandEmpty>No result found</CommandEmpty>

          <CommandGroup>
            {filtered.map(option => (
              <CommandItem
                key={option.value}
                value={option.label}
                onSelect={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                {option.label}

                <Check
                  className={`ml-auto h-4 w-4 ${
                    value === option.value ? "opacity-100" : "opacity-0"
                  }`}
                />

              </CommandItem>
            ))}
          </CommandGroup>

        </Command>
      </PopoverContent>
    </Popover>
  )
}