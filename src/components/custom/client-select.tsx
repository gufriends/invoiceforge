"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useClients } from "@/hooks/use-clients";
import type { ClientSelectProps } from "@/types/component-props";

export function ClientSelect({ value, onChange, onCreateNew, placeholder = "Pilih klien...", disabled }: ClientSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data } = useClients({ limit: 50, search: search || undefined, isActive: true });

  const selected = data?.data.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
          type="button"
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="font-medium">{selected.name}</span>
              {selected.company && <span className="text-xs text-muted-foreground">· {selected.company}</span>}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Cari klien..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              <div className="p-3 text-sm">
                Klien tidak ditemukan
                {onCreateNew && (
                  <Button variant="link" type="button" className="ml-1 h-auto p-0" onClick={onCreateNew}>
                    Buat baru
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {data?.data.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")} />
                  <div>
                    <div className="font-medium">{c.name}</div>
                    {c.company && <div className="text-xs text-muted-foreground">{c.company}</div>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreateNew && (
              <CommandGroup>
                <CommandItem onSelect={onCreateNew}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah klien baru
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}