import type { ReactNode } from 'react';

export function Modal({
  title,
  children,
  actions,
  onClose,
  titleId,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
  titleId?: string;
}) {
  return (
    <div className="modal-surface">
      <div className="modal-surface-header">
        <h2 id={titleId}>{title}</h2>
        {onClose ? (
          <button type="button" className="icon-button modal-close-button" onClick={onClose} aria-label={`Close ${title}`}>
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
      </div>
      <div className="modal-surface-body">{children}</div>
      {actions ? <div className="modal-surface-actions">{actions}</div> : null}
    </div>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      actions={
        <>
          <button type="button" className="button button-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="button button-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="modal-copy">{description}</p>
    </Modal>
  );
}
