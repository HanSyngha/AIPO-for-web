import { Toaster, toast } from 'react-hot-toast';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export { toast };

interface ToastOptions {
  duration?: number;
}

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-slideUp' : 'animate-fadeOut'
          } max-w-md w-full bg-surface-primary shadow-soft rounded-xl pointer-events-auto flex items-center gap-3 p-4 border border-border-primary`}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          </div>
          <p className="flex-1 text-sm font-medium text-content-primary">{message}</p>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-content-tertiary" />
          </button>
        </div>
      ),
      { duration: options?.duration || 4000 }
    );
  },

  error: (message: string, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-slideUp' : 'animate-fadeOut'
          } max-w-md w-full bg-surface-primary shadow-soft rounded-xl pointer-events-auto flex items-center gap-3 p-4 border border-red-200 dark:border-red-800`}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
          </div>
          <p className="flex-1 text-sm font-medium text-content-primary">{message}</p>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-content-tertiary" />
          </button>
        </div>
      ),
      { duration: options?.duration || 5000 }
    );
  },

  info: (message: string, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-slideUp' : 'animate-fadeOut'
          } max-w-md w-full bg-surface-primary shadow-soft rounded-xl pointer-events-auto flex items-center gap-3 p-4 border border-border-primary`}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <InformationCircleIcon className="w-5 h-5 text-primary-500" />
          </div>
          <p className="flex-1 text-sm font-medium text-content-primary">{message}</p>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-content-tertiary" />
          </button>
        </div>
      ),
      { duration: options?.duration || 4000 }
    );
  },

  loading: (message: string) => {
    return toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-slideUp' : 'animate-fadeOut'
          } max-w-md w-full bg-surface-primary shadow-soft rounded-xl pointer-events-auto flex items-center gap-3 p-4 border border-border-primary`}
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
          <p className="flex-1 text-sm font-medium text-content-primary">{message}</p>
        </div>
      ),
      { duration: Infinity }
    );
  },
};

export function ToastContainer() {
  return (
    <Toaster
      position="bottom-right"
      containerClassName="!bottom-6 !right-6"
      toastOptions={{
        duration: 4000,
      }}
    />
  );
}
