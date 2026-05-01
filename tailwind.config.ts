import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

/**
 * InvoiceForge — Tailwind Config
 * --------------------------------------------------------------------
 * Custom theme extension untuk InvoiceForge. Warna pakai sistem
 * CSS variables (HSL) supaya kompatibel dengan shadcn/ui dan dark mode.
 * Lihat src/styles/theme.css untuk definisi variabelnya.
 */
const config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "hsl(var(--primary-50))",
          100: "hsl(var(--primary-100))",
          200: "hsl(var(--primary-200))",
          300: "hsl(var(--primary-300))",
          400: "hsl(var(--primary-400))",
          500: "hsl(var(--primary-500))",
          600: "hsl(var(--primary-600))",
          700: "hsl(var(--primary-700))",
          800: "hsl(var(--primary-800))",
          900: "hsl(var(--primary-900))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Status invoice colors (semantic tokens)
        status: {
          draft: "hsl(var(--status-draft))",
          sent: "hsl(var(--status-sent))",
          viewed: "hsl(var(--status-viewed))",
          partial: "hsl(var(--status-partial))",
          paid: "hsl(var(--status-paid))",
          overdue: "hsl(var(--status-overdue))",
          cancelled: "hsl(var(--status-cancelled))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Type scale 1.25 (Major Third)
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }], // 10px
        xs: ["0.75rem", { lineHeight: "1rem" }],         // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem" }],     // 14px
        base: ["1rem", { lineHeight: "1.5rem" }],        // 16px
        lg: ["1.125rem", { lineHeight: "1.75rem" }],     // 18px
        xl: ["1.25rem", { lineHeight: "1.875rem" }],     // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }],       // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],  // 30px
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],    // 36px
        "5xl": ["3rem", { lineHeight: "1" }],            // 48px
      },
      spacing: {
        // Spasi tambahan untuk konsistensi
        "4.5": "1.125rem",
        "5.5": "1.375rem",
        "13": "3.25rem",
        "15": "3.75rem",
        "18": "4.5rem",
        "112": "28rem",
        "128": "32rem",
      },
      boxShadow: {
        // Custom elevations
        "soft-sm": "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        soft: "0 2px 8px -2px rgb(0 0 0 / 0.06)",
        "soft-md": "0 4px 16px -4px rgb(0 0 0 / 0.08)",
        "soft-lg": "0 8px 32px -8px rgb(0 0 0 / 0.12)",
        "soft-xl": "0 16px 48px -16px rgb(0 0 0 / 0.16)",
        "inner-soft": "inset 0 1px 2px 0 rgb(0 0 0 / 0.04)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 200ms ease-out",
        "fade-in-up": "fade-in-up 200ms ease-out",
        "slide-in-right": "slide-in-right 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        shimmer: "shimmer 2s linear infinite",
        "count-up": "count-up 400ms ease-out",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh":
          "radial-gradient(at 0% 0%, hsl(var(--primary) / 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, hsl(var(--secondary) / 0.15) 0px, transparent 50%)",
      },
      typography: () => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": "hsl(var(--foreground))",
            "--tw-prose-headings": "hsl(var(--foreground))",
            "--tw-prose-links": "hsl(var(--primary))",
          },
        },
      }),
    },
  },
  plugins: [animatePlugin],
} satisfies Config;

export default config;
