import { memo, ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-tertiary text-content-secondary',
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-content-tertiary',
  primary: 'bg-primary-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-2.5 py-1',
};

function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

export default memo(Badge);

// Status badge preset
export const StatusBadge = memo(function StatusBadge({
  status,
  className = '',
}: {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  className?: string;
}) {
  const config: Record<
    typeof status,
    { variant: BadgeVariant; label: string; dot: boolean }
  > = {
    pending: { variant: 'default', label: 'Pending', dot: true },
    processing: { variant: 'primary', label: 'Processing', dot: true },
    completed: { variant: 'success', label: 'Completed', dot: false },
    failed: { variant: 'error', label: 'Failed', dot: false },
    cancelled: { variant: 'warning', label: 'Cancelled', dot: false },
  };

  const { variant, label, dot } = config[status];

  return (
    <Badge variant={variant} dot={dot} className={className}>
      {label}
    </Badge>
  );
});

// Language badge preset
export const LanguageBadge = memo(function LanguageBadge({
  language,
  className = '',
}: {
  language: 'KO' | 'EN' | 'CN';
  className?: string;
}) {
  const config: Record<typeof language, { variant: BadgeVariant; label: string }> = {
    KO: { variant: 'info', label: 'KO' },
    EN: { variant: 'success', label: 'EN' },
    CN: { variant: 'warning', label: 'CN' },
  };

  const { variant, label } = config[language];

  return (
    <Badge variant={variant} size="sm" className={className}>
      {label}
    </Badge>
  );
});
