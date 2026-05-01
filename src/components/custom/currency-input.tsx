"use client";

import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { CURRENCY_SYMBOLS, type Currency } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: Currency;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, currency = "IDR", disabled, className, placeholder, ...props }, ref) => {
    const symbol = CURRENCY_SYMBOLS[currency];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.replace(/[^\d.]/g, "");
      const numValue = parseFloat(inputValue) || 0;
      onChange(numValue);
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {symbol}
        </span>
        <Input
          ref={ref}
          type="text"
          value={value === 0 ? "" : value.toLocaleString("id-ID")}
          onChange={handleChange}
          className={cn("pl-8 font-mono text-right", className)}
          disabled={disabled}
          placeholder={placeholder}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";