import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, children, ...props }, ref) => {
    return (
      <div className="relative">
        {label && (
          <label className="mb-1.5 block text-xs font-medium text-zinc-500">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              "w-full appearance-none rounded-xl border border-zinc-800/80 bg-[#0d0d0d] px-4 py-2.5 pr-10 text-xs uppercase tracking-widest text-zinc-400 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/10 hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 cursor-pointer",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
