import { DetailLayout, DetailHeader, InfoCard } from '@fixture/ui';

export function CustomerDetail({ customer }) {
  return (
    <DetailLayout>
      <DetailHeader title={customer.name} />
      <InfoCard title="Contact" variant="outlined" />
    </DetailLayout>
  );
}
