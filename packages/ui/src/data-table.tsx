import type { ReactNode } from 'react';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { LoadingState } from './loading-state';

export type DataTableColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage = 'No records found',
  loading = false,
  error,
  caption,
  dense = true,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  emptyMessage?: string;
  loading?: boolean;
  error?: string;
  caption?: string;
  dense?: boolean;
}) {
  if (loading) {
    return <LoadingState title="Loading table" message="Fetching the latest records for this workspace." compact />;
  }

  if (error) {
    return <ErrorState title="Unable to load records" message={error} compact />;
  }

  if (rows.length === 0) {
    return <EmptyState title="No records yet" message={emptyMessage} compact />;
  }

  return (
    <div className="data-table-wrap">
      <table className={`data-table${dense ? ' dense' : ''}`}>
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>{columns.map((column) => <th key={column.header}>{column.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.header} className={column.className}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
