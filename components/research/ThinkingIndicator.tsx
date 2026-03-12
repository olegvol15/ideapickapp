import { motion } from 'framer-motion';

interface ThinkingIndicatorProps {
  label: string;
}

export function ThinkingIndicator({ label }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center gap-[5px]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-[7px] w-[7px] rounded-full bg-primary"
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.75, 1, 0.75] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              delay: i * 0.18,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
