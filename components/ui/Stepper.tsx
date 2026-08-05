import { useId } from 'react';
import './ui.css';

interface StepperProps {
  label: string;
  value: string | number;
  help: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseDisabled?: boolean;
  increaseDisabled?: boolean;
  /** Must name the unit of change, e.g. "Decrease weekly budget by $5". */
  decreaseLabel: string;
  increaseLabel: string;
  error?: string;
}

export function Stepper({
  label,
  value,
  help,
  onDecrease,
  onIncrease,
  decreaseDisabled,
  increaseDisabled,
  decreaseLabel,
  increaseLabel,
  error,
}: StepperProps) {
  // useId rather than a slug of the label: two steppers could share a label, and
  // a slug is not guaranteed to be a valid or unique id.
  const id = useId();
  const labelId = `${id}-label`;
  const messageId = `${id}-message`;

  return (
    <div className="field-group">
      <span className="field-label" id={labelId}>{label}</span>
      <div
        className={`stepper ${error ? 'stepper--error' : ''}`}
        role="group"
        aria-labelledby={labelId}
        aria-describedby={messageId}
      >
        <button type="button" onClick={onDecrease} disabled={decreaseDisabled} aria-label={decreaseLabel}>
          −
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" onClick={onIncrease} disabled={increaseDisabled} aria-label={increaseLabel}>
          +
        </button>
      </div>
      <span className={error ? 'field-error' : 'field-help'} id={messageId}>
        {error ?? help}
      </span>
    </div>
  );
}
