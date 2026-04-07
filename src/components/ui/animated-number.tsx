"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

interface AnimatedNumberProps {
  value: number;
  format?: "currency" | "percent" | "decimal" | "integer";
  decimals?: number;
  prefix?: string;
  suffix?: string;
  showSign?: boolean;
  colorize?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses: Record<string, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-4xl",
};

function formatValue(
  value: number,
  format: string,
  decimals?: number
): { formatted: string; sign: string } {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : value > 0 ? "+" : "";

  let formatted: string;

  switch (format) {
    case "currency": {
      const d = decimals ?? 2;
      formatted = "$" + abs.toLocaleString("en-US", {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      });
      break;
    }
    case "percent": {
      const d = decimals ?? 1;
      formatted = abs.toFixed(d) + "%";
      break;
    }
    case "integer": {
      formatted = Math.round(abs).toLocaleString("en-US");
      break;
    }
    case "decimal":
    default: {
      const d = decimals ?? 2;
      formatted = abs.toLocaleString("en-US", {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      });
      break;
    }
  }

  return { formatted, sign };
}

function DigitColumn({
  digit,
  delay,
}: {
  digit: number;
  delay: number;
}) {
  return (
    <span className="digit-column">
      <span
        className="digit-column-inner"
        style={{
          transform: `translateY(${-digit * 100}%)`,
          transitionDelay: `${delay}ms`,
        }}
      >
        {DIGITS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </span>
    </span>
  );
}

export function AnimatedNumber({
  value,
  format = "decimal",
  decimals,
  prefix,
  suffix,
  showSign = false,
  colorize = false,
  className,
  size = "md",
}: AnimatedNumberProps) {
  const { formatted, sign } = formatValue(value, format, decimals);
  const prevValueRef = useRef(value);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  // Parse formatted string into characters, keyed from the right
  const chars = formatted.split("");

  // Find digit positions from right for stagger
  const digitPositions: number[] = [];
  for (let i = chars.length - 1; i >= 0; i--) {
    if (/\d/.test(chars[i])) {
      digitPositions.push(i);
    }
  }

  const colorClass = colorize
    ? value >= 0
      ? "text-green-400"
      : "text-red-400"
    : "";

  const displaySign = showSign ? sign : value < 0 ? "-" : "";

  return (
    <span
      className={cn(
        "inline-flex items-baseline tabular-nums leading-none tracking-tight",
        sizeClasses[size],
        colorClass,
        className
      )}
      aria-label={`${displaySign}${formatted}`}
    >
      {prefix && <span className="digit-static">{prefix}</span>}

      {displaySign && (
        <span className="digit-sign">{displaySign}</span>
      )}

      {chars.map((char, i) => {
        const isDigit = /\d/.test(char);

        if (!isDigit) {
          return (
            <span key={`static-${i}`} className="digit-static">
              {char}
            </span>
          );
        }

        // Stagger: rightmost digit animates first
        const digitIndex = digitPositions.indexOf(i);
        const delay = mounted ? digitIndex * 40 : 0;

        return (
          <DigitColumn
            key={`digit-${chars.length - i}`}
            digit={parseInt(char, 10)}
            delay={delay}
          />
        );
      })}

      {suffix && <span className="digit-static">{suffix}</span>}
    </span>
  );
}
