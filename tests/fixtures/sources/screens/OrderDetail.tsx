import { DetailLayout, DetailHeader, InfoCard, Button } from '@fixture/ui';

export function OrderDetail({ order }) {
  return (
    <DetailLayout>
      <DetailHeader title={order.name} />
      <InfoCard title="Summary" variant="outlined">
        <Button variant="contained" size="small">Refund</Button>
      </InfoCard>
    </DetailLayout>
  );
}
