"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 disabled:pointer-events-none disabled:opacity-30 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)] text-white shadow-[0_2px_12px_var(--accent-hi)] hover:bg-[var(--accent-2)] hover:scale-[1.02] hover:shadow-[0_4px_24px_var(--accent-hi)] active:scale-[0.97]",
        outline:
          "border border-[var(--border)] bg-transparent text-[var(--text-1)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
        ghost: "text-[var(--text-3)] hover:text-[var(--text-1)]",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
