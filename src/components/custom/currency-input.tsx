"use client";

import { forwardRef, useState } from "react";
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
    const [focused, setFocused] = useState(false);
    const [raw, setRaw] = useState("");

    const displayValue = focused ? raw : (value > 0 ? value.toLocaleString("id-ID") : "");

    const handleFocus = () => {
      setFocused(true);
      setRaw(value > 0 ? String(value) : "");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "");
      setRaw(digits);
      onChange(digits === "" ? 0 : parseInt(digits, 10));
    };

    const handleBlur = () => {
      setFocused(false);
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {symbol}
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn("pl-8 font-mono text-right", className)}
          disabled={disabled}
          placeholder={placeholder ?? "0"}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
