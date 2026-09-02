import { Alert } from '@fixture/ui';

export default { title: 'Core/Alert', component: Alert };

export const Warning = {
  args: { severity: 'warning', title: 'This is an alert message', elevation: 'flat' },
};
export const Error = {
  args: { severity: 'error', title: 'Something went wrong and here is the detail' },
};
export const Labelled = { args: { severity: 'warning', label: 'Quantity' } };
export const Labelled2 = { args: { severity: 'error', label: 'Minutes' } };
