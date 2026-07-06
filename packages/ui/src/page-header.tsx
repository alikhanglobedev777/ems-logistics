import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  secondaryActions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
  secondaryActions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {breadcrumbs ? <div className="page-breadcrumbs">{breadcrumbs}</div> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions || secondaryActions ? (
        <div className="page-actions">
          {secondaryActions ? <div className="page-actions-secondary">{secondaryActions}</div> : null}
          {actions ? <div className="page-actions-primary">{actions}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
