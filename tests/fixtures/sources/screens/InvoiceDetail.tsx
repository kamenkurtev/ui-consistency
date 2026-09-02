import { DetailLayout, DetailHeader, InfoCard } from '@fixture/ui';

export function InvoiceDetail() {
  return (
    <DetailLayout>
      <DetailHeader title="Invoice" />
      <InfoCard title="Lines" />
    </DetailLayout>
  );
}
