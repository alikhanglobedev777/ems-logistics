import type { CustomerInvoice } from '../../features/customer-invoices/api/customer-invoices.api';
import { EmptyState, StatusBadge, getStatusTone } from '@ems/ui';

export function InvoicePreview({ invoice }: { invoice?: CustomerInvoice }) {
  if (!invoice) {
    return (
      <EmptyState
        title="Invoice preview unavailable"
        message="Open an invoice record to see the operational billing preview."
        compact
      />
    );
  }

  return (
    <section className="panel invoice-preview">
      <div className="invoice-preview-header">
        <div>
          <p className="section-kicker">Customer Invoice</p>
          <h2>{invoice.invoiceNumber}</h2>
          <p>{invoice.customer?.name ?? 'Customer'}</p>
        </div>
        <StatusBadge label={invoice.status ?? 'unknown'} tone={getStatusTone(invoice.status ?? 'unknown')} />
      </div>

      <div className="invoice-preview-grid">
        <div className="invoice-preview-block">
          <span>Booking / Bilty</span>
          <strong>{invoice.booking?.bookingNumber ?? 'N/A'}</strong>
        </div>
        <div className="invoice-preview-block">
          <span>Invoice date</span>
          <strong>{invoice.invoiceDate ?? 'Pending'}</strong>
        </div>
        <div className="invoice-preview-block">
          <span>Due date</span>
          <strong>{invoice.dueDate ?? 'Not set'}</strong>
        </div>
        <div className="invoice-preview-block">
          <span>Issued at</span>
          <strong>{invoice.issuedAt ?? 'Pending issue'}</strong>
        </div>
      </div>

      <div className="invoice-line-items">
        <table className="data-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Reference</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Freight billing</td>
              <td>{invoice.booking?.bookingNumber ?? 'N/A'}</td>
              <td>{invoice.subtotalAmount ?? '0'}</td>
            </tr>
            <tr>
              <td>Tax</td>
              <td>Invoice tax</td>
              <td>{invoice.taxAmount ?? '0'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="invoice-totals">
        <Metric label="Subtotal" value={invoice.subtotalAmount ?? '0'} />
        <Metric label="Tax" value={invoice.taxAmount ?? '0'} />
        <Metric label="Total" value={invoice.totalAmount ?? '0'} />
        <Metric label="Paid" value={invoice.paidAmount ?? '0'} />
        <Metric label="Balance" value={invoice.balanceAmount ?? '0'} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
