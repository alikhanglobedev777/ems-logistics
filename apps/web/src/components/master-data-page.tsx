import { zodResolver } from '@hookform/resolvers/zod';
import { DataTable, type DataTableColumn } from '@ems/ui';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { ZodType } from 'zod';

export type FormValues = Record<string, string>;
export type FormField = { name: string; label: string; type?: string; options?: Array<{label:string;value:string}> };

export function MasterDataPage<T extends { id: number }>({ title, resource, mode, rows, columns, fields, schema, initial, detail, loading, onSubmit }: {
  title:string; resource:string; mode:'list'|'create'|'edit'|'detail'; rows:T[]; columns:DataTableColumn<T>[]; fields:FormField[]; schema: ZodType<FormValues>;
  initial?:FormValues; detail?:T; loading?:boolean; onSubmit:(values:FormValues)=>Promise<void>;
}) {
  const form=useForm<FormValues>({resolver:zodResolver(schema),defaultValues:initial??{}});
  useEffect(()=>{if(initial)form.reset(initial);},[initial,form]);
  if(mode==='list')return <section className="page-card"><div className="page-heading"><div><h1>{title}</h1><p>Manage operational master data.</p></div><a className="button-link" href={`/${resource}/new`}>Create new</a></div>{loading?<p>Loading…</p>:<DataTable rows={rows} columns={[...columns,{header:'Actions',render:(row)=><span className="table-actions"><a href={`/${resource}/${row.id}`}>View</a><a href={`/${resource}/${row.id}/edit`}>Edit</a></span>}]} getRowKey={(row)=>row.id}/>}</section>;
  if(mode==='detail')return <section className="page-card"><div className="page-heading"><h1>{title} detail</h1><a className="button-link secondary" href={`/${resource}/${detail?.id}/edit`}>Edit</a></div>{loading?<p>Loading…</p>:<dl className="detail-grid">{detail&&Object.entries(detail).filter(([,v])=>typeof v!=='object').map(([key,value])=><div key={key}><dt>{key}</dt><dd>{String(value??'—')}</dd></div>)}</dl>}</section>;
  return <section className="page-card"><div className="page-heading"><div><h1>{mode==='create'?'Create':'Edit'} {title}</h1><p>Fields follow the centralized API contract.</p></div></div><form className="entity-form" onSubmit={form.handleSubmit(onSubmit)}>{fields.map((field)=><label key={field.name}>{field.label}{field.options?<select {...form.register(field.name)}><option value="">Select</option>{field.options.map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:<input type={field.type??'text'} {...form.register(field.name)}/>}<small>{form.formState.errors[field.name]?.message}</small></label>)}<div className="form-actions"><button disabled={form.formState.isSubmitting}>Save</button><a href={`/${resource}`}>Cancel</a></div></form></section>;
}
