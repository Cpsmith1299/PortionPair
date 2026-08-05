import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './ui.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  loading?: boolean;
  /** Replaces the label while `loading`, so the busy state reads as progress. */
  loadingLabel?: string;
}

export function Button({
  children,
  variant = 'primary',
  fullWidth,
  loading,
  loadingLabel,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const classes = ['button', `button--${variant}`, fullWidth ? 'button--full' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <span className="button__spinner" aria-hidden="true" />}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </button>
  );
}
