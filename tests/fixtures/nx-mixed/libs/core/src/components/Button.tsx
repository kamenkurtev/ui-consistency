import { forwardRef } from 'react';
import { Button as Base } from 'some-ui-lib';

export const Button = forwardRef((props: Record<string, unknown>) => <Base {...props} />);
