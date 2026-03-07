import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "textarea-depth brand-focus flex w-full rounded-xl border border-zinc-800/80 bg-[#0d0d0d] px-5 py-4 text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-[border-color,box-shadow] duration-300",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
