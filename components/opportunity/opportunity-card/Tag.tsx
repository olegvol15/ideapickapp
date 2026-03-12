import { Badge, type BadgeProps } from '@/components/ui/badge';

export interface TagProps {
  label: string;
  value: string;
  variant: BadgeProps['variant'];
}

/** Signal tag — wraps <Badge> with the label·value pattern. */
export function Tag({ label, value, variant }: TagProps) {
  return (
    <Badge variant={variant}>
      <span className="opacity-50">{label}</span>
      <span className="opacity-30">·</span>
      {value}
    </Badge>
  );
}
