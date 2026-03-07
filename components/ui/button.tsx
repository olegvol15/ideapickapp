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
          "bg-brand text-black shadow-[0_2px_12px_rgba(255,71,20,0.25)] hover:brightness-110 hover:scale-[1.02] hover:shadow-[0_4px_24px_rgba(255,71,20,0.45)] active:scale-[0.97] active:shadow-[0_1px_6px_rgba(255,71,20,0.2)]",
        outline:
          "border border-zinc-700 bg-transparent text-zinc-300 hover:border-brand hover:text-brand",
        ghost: "text-zinc-500 hover:text-white",
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
