import { useNavigate } from '@tanstack/react-router';
import { CustomerType } from '@ems/shared';
import { z } from 'zod';
import { useCreateCustomer, useGetCustomerById, useGetCustomers, useUpdateCustomer, type Customer } from '../api/customers.api';
import { MasterDataPage, type FormValues } from '../../master-data';

export function CustomersPage({ mode, id }: { mode: 'list' | 'create' | 'edit' | 'detail'; id?: string }) {
  const navigate = useNavigate();
  const list = useGetCustomers({ page: 1, limit: 50 });
  const detail = useGetCustomerById(Number(id ?? 0), { query: { enabled: Boolean(id) } });
  const create = useCreateCustomer();
  const update = useUpdateCustomer();
  const rows: Customer[] = list.data?.status === 200 ? list.data.data.data : [];
  const item = detail.data?.status === 200 ? detail.data.data.data : undefined;
  const initial = item
    ? {
        name: item.name,
        contactPerson: item.contactPerson,
        phone: item.phone,
        email: item.email ?? '',
        billingAddress: item.billingAddress ?? '',
        customerType: item.customerType,
        ntn: item.ntn ?? '',
        strn: item.strn ?? '',
        isActive: String(item.isActive),
      }
    : undefined;

  async function submit(values: FormValues) {
    const data = {
      name: values.name,
      contactPerson: values.contactPerson,
      phone: values.phone,
      email: values.email || null,
      billingAddress: values.billingAddress || null,
      customerType: values.customerType as Customer['customerType'],
      ntn: values.ntn || null,
      strn: values.strn || null,
      isActive: values.isActive !== 'false',
    };
    if (mode === 'edit') await update.mutateAsync({ customerId: Number(id), data });
    else await create.mutateAsync({ data });
    await navigate({ to: '/customers' });
  }

  return (
    <MasterDataPage
      title="Customers"
      resource="customers"
      mode={mode}
      rows={rows}
      detail={item}
      loading={list.isLoading || detail.isLoading}
      columns={[
        { header: 'Name', render: (row) => row.name },
        { header: 'Contact', render: (row) => row.contactPerson },
        { header: 'Phone', render: (row) => row.phone },
        { header: 'Type', render: (row) => row.customerType },
      ]}
      fields={[
        { name: 'name', label: 'Name' },
        { name: 'contactPerson', label: 'Contact person' },
        { name: 'phone', label: 'Phone' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'billingAddress', label: 'Billing address' },
        { name: 'customerType', label: 'Customer type', options: Object.values(CustomerType).map((value) => ({ label: value, value })) },
        { name: 'ntn', label: 'NTN' },
        { name: 'strn', label: 'STRN' },
        {
          name: 'isActive',
          label: 'Status',
          options: [
            { label: 'Active', value: 'true' },
            { label: 'Inactive', value: 'false' },
          ],
        },
      ]}
      schema={z.object({
        name: z.string().min(1),
        contactPerson: z.string().min(1),
        phone: z.string().min(1),
        email: z.string(),
        billingAddress: z.string(),
        customerType: z.string().min(1),
        ntn: z.string(),
        strn: z.string(),
        isActive: z.string(),
      })}
      initial={initial}
      onSubmit={submit}
    />
  );
}
