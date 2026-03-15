'use client';

interface PasswordStrengthProps {
  password: string;
}

function getScore(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length === 0) return 'weak';

  const classes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  if (password.length >= 10 && classes >= 3) return 'strong';
  if (password.length >= 8 && classes >= 2) return 'medium';
  return 'weak';
}

const config = {
  weak:   { filled: 1, color: 'bg-red-500',   label: 'Weak' },
  medium: { filled: 2, color: 'bg-amber-400',  label: 'Medium' },
  strong: { filled: 3, color: 'bg-green-500',  label: 'Strong' },
};

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (password.length === 0) return null;

  const score = getScore(password);
  const { filled, color, label } = config[score];

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= filled ? color : 'bg-muted'}`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground w-12 text-right">{label}</span>
    </div>
  );
}
