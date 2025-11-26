/**
 * Form Field Validation Component
 * Date: 28 Janvier 2025
 * 
 * Composant réutilisable pour afficher les erreurs de validation de champs
 * Améliore l'UX et l'accessibilité
 */

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldValidationProps {
  error?: string | null;
  success?: string | null;
  hint?: string | null;
  className?: string;
  showIcon?: boolean;
}

export const FormFieldValidation = ({
  error,
  success,
  hint,
  className,
  showIcon = true,
}: FormFieldValidationProps) => {
  if (!error && !success && !hint) return null;

  return (
    <div
      className={cn(
        'flex items-start gap-2 mt-1 text-sm',
        error && 'text-destructive',
        success && 'text-green-600 dark:text-green-400',
        hint && !error && !success && 'text-muted-foreground',
        className
      )}
      role={error ? 'alert' : undefined}
      aria-live={error ? 'polite' : undefined}
    >
      {showIcon && (
        <>
          {error && (
            <AlertCircle
              className="h-4 w-4 shrink-0 mt-0.5"
              aria-hidden="true"
            />
          )}
          {success && (
            <CheckCircle2
              className="h-4 w-4 shrink-0 mt-0.5"
              aria-hidden="true"
            />
          )}
        </>
      )}
      <span className="flex-1">
        {error && <span className="font-medium">{error}</span>}
        {success && <span>{success}</span>}
        {hint && !error && !success && <span>{hint}</span>}
      </span>
    </div>
  );
};

