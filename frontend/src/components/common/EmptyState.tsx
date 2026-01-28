import { ReactNode, memo } from 'react';
import {
  FolderIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface EmptyStateProps {
  icon?: 'folder' | 'search' | 'document' | 'trash' | 'error' | ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const iconComponents = {
  folder: FolderIcon,
  search: MagnifyingGlassIcon,
  document: DocumentTextIcon,
  trash: TrashIcon,
  error: ExclamationTriangleIcon,
};

const sizeClasses = {
  sm: {
    wrapper: 'py-8',
    icon: 'w-12 h-12',
    iconWrapper: 'w-16 h-16',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    wrapper: 'py-12',
    icon: 'w-16 h-16',
    iconWrapper: 'w-20 h-20',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    wrapper: 'py-16',
    icon: 'w-20 h-20',
    iconWrapper: 'w-24 h-24',
    title: 'text-xl',
    description: 'text-base',
  },
};

function EmptyState({
  icon = 'document',
  title,
  description,
  action,
  size = 'md',
}: EmptyStateProps) {
  const classes = sizeClasses[size];

  const renderIcon = () => {
    if (typeof icon === 'string' && icon in iconComponents) {
      const IconComponent = iconComponents[icon as keyof typeof iconComponents];
      return <IconComponent className={`${classes.icon} text-content-quaternary`} />;
    }
    return icon;
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center px-4 ${classes.wrapper}`}>
      <div
        className={`${classes.iconWrapper} rounded-2xl bg-surface-secondary flex items-center justify-center mb-4`}
      >
        {renderIcon()}
      </div>
      <h3 className={`font-semibold text-content-primary ${classes.title} mb-1`}>
        {title}
      </h3>
      {description && (
        <p className={`text-content-tertiary ${classes.description} max-w-sm mb-4`}>
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default memo(EmptyState);
