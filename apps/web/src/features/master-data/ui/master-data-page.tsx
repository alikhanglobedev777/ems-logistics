import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { DataTable, type DataTableColumn } from '@ems/ui';
import { useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import type { ZodType } from 'zod';

export type FormValues = Record<string, string>;
export type FormField = {
  name: string;
  label: string;
  type?: string;
  options?: Array<{ label: string; value: string }>;
};

type MasterDataPageProps<T extends { id: number }> = {
  title: string;
  resource: string;
  mode: 'list' | 'create' | 'edit' | 'detail';
  rows: T[];
  columns: DataTableColumn<T>[];
  fields: FormField[];
  schema: ZodType<FormValues, FormValues>;
  initial?: FormValues;
  detail?: T;
  loading?: boolean;
  onSubmit: (values: FormValues) => Promise<void>;
};

export function MasterDataPage<T extends { id: number }>({
  title,
  resource,
  mode,
  rows,
  columns,
  fields,
  schema,
  initial,
  detail,
  loading,
  onSubmit,
}: MasterDataPageProps<T>) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: initial ?? {} });

  useEffect(() => {
    if (initial) form.reset(initial);
  }, [initial, form]);

  if (mode === 'list') {
    return (
      <section className="page-card">
        <div className="page-heading">
          <div>
            <h1>{title}</h1>
            <p>Manage operational master data.</p>
          </div>
          <Link className="button-link" to={`/${resource}/new` as any}>
            Create new
          </Link>
        </div>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <DataTable
            rows={rows}
            columns={[
              ...columns,
              {
                header: 'Actions',
                render: (row) => (
                  <span className="table-actions">
                    <Link to={`/${resource}/${row.id}` as any}>View</Link>
                    <Link to={`/${resource}/${row.id}/edit` as any}>Edit</Link>
                  </span>
                ),
              },
            ]}
            getRowKey={(row) => row.id}
          />
        )}
      </section>
    );
  }

  if (mode === 'detail') {
    return (
      <section className="page-card">
        <div className="page-heading">
          <h1>{title} detail</h1>
          {detail ? (
            <Link className="button-link secondary" to={`/${resource}/${detail.id}/edit` as any}>
              Edit
            </Link>
          ) : null}
        </div>
        {loading ? <p>Loading…</p> : <DetailGrid detail={detail} />}
      </section>
    );
  }

  return (
    <section className="page-card">
      <div className="page-heading">
        <div>
          <h1>
            {mode === 'create' ? 'Create' : 'Edit'} {title}
          </h1>
          <p>Fields follow the centralized API contract.</p>
        </div>
      </div>
      <form className="entity-form" onSubmit={form.handleSubmit(onSubmit)}>
        {fields.map((field) => (
          <label key={field.name}>
            {field.label}
            {field.options ? (
              <select {...form.register(field.name)}>
                <option value="">Select</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input type={field.type ?? 'text'} {...form.register(field.name)} />
            )}
            <small>{form.formState.errors[field.name]?.message}</small>
          </label>
        ))}
        <div className="form-actions">
          <button disabled={form.formState.isSubmitting}>Save</button>
          <Link to={`/${resource}` as any}>Cancel</Link>
        </div>
      </form>
    </section>
  );
}

function DetailGrid<T extends Record<string, unknown>>({ detail }: { detail?: T }) {
  if (!detail) return <p>No record found.</p>;

  const entries = Object.entries(detail).filter(([, value]) => typeof value !== 'object');

  return (
    <dl className="detail-grid">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt>{humanize(key)}</dt>
          <dd>{formatValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function humanize(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
