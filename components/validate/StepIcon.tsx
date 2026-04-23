import { CheckCircle } from 'lucide-react';
import type { StepStatus } from '@/lib/validate/progress';

interface StepIconProps {
  status: StepStatus;
  Icon: React.ElementType;
}

export function StepIcon({ status, Icon }: StepIconProps) {
  if (status === 'done')
    return <CheckCircle className="h-4 w-4 text-emerald-500/80 shrink-0" />;
  if (status === 'active')
    return <Icon className="h-4 w-4 text-foreground/70 shrink-0 animate-pulse" />;
  return <Icon className="h-4 w-4 text-muted-foreground/30 shrink-0" />;
}
