import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

type SharedFieldProps = {
  label: string;
  error?: ReactNode;
  hint?: ReactNode;
};

export function FormInput({
  label,
  error,
  hint,
  ...props
}: SharedFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input className="field-control" {...props} />
      {hint ? <span className="field-hint">{hint}</span> : null}
      <span className="field-error">{error}</span>
    </label>
  );
}

export function DateInput(props: SharedFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return <FormInput {...props} type={props.type ?? 'date'} />;
}

export function FormSelect({
  label,
  error,
  hint,
  children,
  ...props
}: SharedFieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select className="field-control" {...props}>
        {children}
      </select>
      {hint ? <span className="field-hint">{hint}</span> : null}
      <span className="field-error">{error}</span>
    </label>
  );
}
