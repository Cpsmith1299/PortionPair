interface StepperProps {
  label: string;
  value: string | number;
  help: string;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseDisabled?: boolean;
  increaseDisabled?: boolean;
  decreaseLabel: string;
  increaseLabel: string;
  error?: string;
}

export function Stepper({ label, value, help, onDecrease, onIncrease, decreaseDisabled, increaseDisabled, decreaseLabel, increaseLabel, error }: StepperProps) {
  const id = label.toLowerCase().replaceAll(' ', '-');
  return (
    <div className="field-group">
      <span className="field-label" id={`${id}-label`}>{label}</span>
      <div className={`stepper ${error ? 'stepper--error' : ''}`} aria-labelledby={`${id}-label`}>
        <button type="button" onClick={onDecrease} disabled={decreaseDisabled} aria-label={decreaseLabel}>−</button>
        <output aria-live="polite">{value}</output>
        <button type="button" onClick={onIncrease} disabled={increaseDisabled} aria-label={increaseLabel}>+</button>
      </div>
      <span className={error ? 'field-error' : 'field-help'}>{error ?? help}</span>
    </div>
  );
}
