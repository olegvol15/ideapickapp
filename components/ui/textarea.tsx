import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'textarea-depth brand-focus flex w-full rounded-xl border px-5 py-4 text-[15px] leading-relaxed disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-[border-color,box-shadow] duration-300',
          className
        )}
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg-input)',
          color: 'var(--text-1)',
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
