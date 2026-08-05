import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './components.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({ children, variant = 'primary', fullWidth, loading, disabled, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`button button--${variant} ${fullWidth ? 'button--full' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="button__spinner" aria-hidden="true" />}
      <span>{loading ? 'Creating your week…' : children}</span>
    </button>
  );
}
