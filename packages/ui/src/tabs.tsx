import type { ReactNode } from 'react';

export type TabOption = {
  value: string;
  label: string;
};

export function Tabs({
  value,
  options,
  onChange,
  aside,
}: {
  value: string;
  options: TabOption[];
  onChange: (next: string) => void;
  aside?: ReactNode;
}) {
  return (
    <div className="tabs">
      <div className="tabs-list" role="tablist" aria-label="Content sections">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={option.value === value}
            className={`tab-trigger${option.value === value ? ' active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {aside ? <div className="tabs-aside">{aside}</div> : null}
    </div>
  );
}
