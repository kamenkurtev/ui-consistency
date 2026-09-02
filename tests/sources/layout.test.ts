import { describe, it, expect } from 'vitest';
import { shapeOf } from '../../src/sources/extract.js';

const withHolder = `
export function CustomerForm() {
  return (
    <Page>
      <PageHeader title="Customer" />
      <Content>
        <FormLayout>
          <FormField name="email" />
          <FormField name="name" />
        </FormLayout>
      </Content>
    </Page>
  );
}
`;

const withoutHolder = `
export function SupplierForm() {
  return (
    <Page>
      <PageHeader title="Supplier" />
      <Content>
        <Stack>
          <FormField name="vat" />
          <FormField name="name" />
        </Stack>
      </Content>
    </Page>
  );
}
`;

describe('the layout has to be visible deeper than its first branch', () => {
  it('shows the holder the fields sit in', () => {
    // Two levels stopped at <Page>'s children, so both of these read as
    // "Page > PageHeader, Content" — identical, which is exactly the
    // distinction the form case needed (#67). The holder is one level below
    // that, which is where holders usually are.
    expect(shapeOf(withHolder)!.pattern).toContain('FormLayout');
  });

  it('tells the two apart', () => {
    const held = shapeOf(withHolder)!.pattern.join('>');
    const loose = shapeOf(withoutHolder)!.pattern.join('>');
    expect(held).not.toBe(loose);
  });

  it('still starts at the outermost component', () => {
    expect(shapeOf(withHolder)!.pattern[0]).toBe('Page');
  });

  it('does not swallow the whole tree', () => {
    // The old comment's warning still holds: compare the contents of every
    // card and every screen becomes unique, which says nothing about any of
    // them.
    const deep = `
      export const X = () => (
        <Page><Body><Card><CardBody><Row><Cell><Chip /></Cell></Row></CardBody></Card></Body></Page>
      );
    `;
    expect(shapeOf(deep)!.pattern).not.toContain('Chip');
  });
});
