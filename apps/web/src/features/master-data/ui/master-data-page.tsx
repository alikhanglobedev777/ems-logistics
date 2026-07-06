import { zodResolver } from '@hookform/resolvers/zod';
import {
  DataTable,
  ErrorState,
  FormInput,
  FormSelect,
  LoadingState,
  Modal,
  PageHeader,
} from '@ems/ui';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { Fragment, useEffect, useId, useState, type ReactNode } from 'react';
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
  columns: Array<{ header: string; render: (row: T) => ReactNode; className?: string }>;
  fields: FormField[];
  schema: ZodType<FormValues, FormValues>;
  initial?: FormValues;
  detail?: T;
  loading?: boolean;
  onSubmit: (values: FormValues) => Promise<void>;
  description?: string;
  listToolbar?: ReactNode;
  detailActions?: ReactNode;
  detailContent?: ReactNode;
  emptyMessage?: string;
  createLabel?: string;
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
  description = 'Manage operational records and supporting data.',
  listToolbar,
  detailActions,
  detailContent,
  emptyMessage,
  createLabel = 'Create new',
}: MasterDataPageProps<T>) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: initial ?? {} });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formTitleId = useId();
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (initial) form.reset(initial);
  }, [initial, form]);

  useEffect(() => {
    if (mode !== 'create') return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mode]);

  async function handleSubmit(values: FormValues) {
    setSubmitError('');

    try {
      await onSubmit(values);
      await queryClient.invalidateQueries({
        predicate: (query) => isResourceQuery(query.queryKey, resource),
      });
    } catch (failure) {
      setSubmitError(apiErrorMessage(failure));
    }
  }

  if (mode === 'list') {
    return (
      <Fragment>
        <section className="page-card">
          <PageHeader
            title={title}
            description={description}
            breadcrumbs={`Operations / ${title}`}
            actions={
              <Link className="button-link" to={`/${resource}/new` as never}>
                {createLabel}
              </Link>
            }
          />

          {listToolbar}

          <DataTable
            rows={rows}
            columns={[
              ...columns,
              {
                header: 'Actions',
                className: 'table-actions-cell',
                render: (row) => (
                  <span className="table-actions">
                    <Link to={`/${resource}/${row.id}` as never}>View</Link>
                    <Link to={`/${resource}/${row.id}/edit` as never}>Edit</Link>
                  </span>
                ),
              },
            ]}
            getRowKey={(row) => row.id}
            loading={loading}
            emptyMessage={emptyMessage ?? `No ${title.toLowerCase()} records were found.`}
          />
        </section>
        <Outlet />
      </Fragment>
    );
  }

  if (mode === 'detail') {
    return (
      <section className="page-card">
        <PageHeader
          title={`${title} detail`}
          description={description}
          breadcrumbs={`Operations / ${title}`}
          actions={
            <div className="detail-actions">
              {detailActions}
              {detail ? (
                <Link className="button-link secondary" to={`/${resource}/${detail.id}/edit` as never}>
                  Edit record
                </Link>
              ) : null}
            </div>
          }
        />

        {loading ? (
          <LoadingState title={`Loading ${title.toLowerCase()}`} message="Fetching the selected record from the workspace." />
        ) : detail ? (
          <Fragment>
            <DetailGrid detail={detail} />
            {detailContent}
          </Fragment>
        ) : (
          <ErrorState title="Record not found" message={`The selected ${title.toLowerCase()} record could not be loaded.`} />
        )}
      </section>
    );
  }

  const formSection = (
    <section className={mode === 'create' ? 'modal-panel' : 'page-card'}>
      {mode === 'create' ? (
        <div className="modal-panel-copy">
          <p>Fields follow the centralized API contract and existing validation rules.</p>
        </div>
      ) : (
        <PageHeader
          title={`Edit ${title}`}
          description="Fields follow the centralized API contract and existing validation rules."
          breadcrumbs={`Operations / ${title}`}
        />
      )}

      <form className="entity-form" onSubmit={form.handleSubmit(handleSubmit)}>
        {fields.map((field) => {
          const error = form.formState.errors[field.name]?.message;

          if (field.options) {
            return (
              <FormSelect key={field.name} label={field.label} error={error} {...form.register(field.name)}>
                <option value="">Select</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FormSelect>
            );
          }

          return (
            <FormInput
              key={field.name}
              label={field.label}
              error={error}
              type={field.type ?? 'text'}
              {...form.register(field.name)}
            />
          );
        })}

        {submitError ? <p className="form-error" role="alert">{submitError}</p> : null}

        <div className="form-actions">
          <button type="submit" className="button">
            Save record
          </button>
          <Link to={`/${resource}` as never}>Cancel</Link>
        </div>
      </form>
    </section>
  );

  if (mode === 'create') {
    return (
      <div className="modal-backdrop">
        <Modal
          title={`Create ${title}`}
          titleId={formTitleId}
          onClose={() => void navigate({ to: `/${resource}` as never })}
        >
          {formSection}
        </Modal>
      </div>
    );
  }

  return formSection;
}

function DetailGrid<T extends Record<string, unknown>>({ detail }: { detail: T }) {
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
  if (value === null || value === undefined || value === '') return '--';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function apiErrorMessage(failure: unknown) {
  if (failure && typeof failure === 'object' && 'data' in failure) {
    const data = (failure as { data?: unknown }).data;

    if (data && typeof data === 'object' && 'error' in data) {
      const error = (data as { error?: unknown }).error;

      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string') return message;
      }
    }
  }

  return 'Unable to save. Please try again.';
}

function isResourceQuery(queryKey: QueryKey, resource: string) {
  const firstSegment = queryKey[0];

  if (typeof firstSegment !== 'string') return false;

  return (
    firstSegment === resource ||
    firstSegment === `/${resource}` ||
    firstSegment.startsWith(`/${resource}/`)
  );
}
