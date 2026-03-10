import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'textarea-depth brand-focus flex w-full rounded-xl border border-border bg-input px-5 py-4 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-[border-color,box-shadow] duration-300',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
