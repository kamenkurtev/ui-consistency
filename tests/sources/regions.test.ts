import { describe, it, expect } from 'vitest';
import { regionsOf } from '../../src/sources/regions.js';

const page = `
export function OrdersPage() {
  return (
    <PageLayout>
      <PageHeader title="Orders" />
      <Breadcrumbs items={crumbs} />
      <SideNav />
      <Content>
        <DataGrid rows={rows} />
      </Content>
      <PageFooter />
    </PageLayout>
  );
}`;

describe('the regions of a page, in the order they appear', () => {
  it('reads the holder and then each region', () => {
    const regions = regionsOf(page);
    expect(regions!.holder).toBe('PageLayout');
    expect(regions!.order.map((region) => region.region)).toEqual([
      'header',
      'breadcrumbs',
      'nav',
      'content',
      'footer',
    ]);
  });

  it('keeps the component that filled each region', () => {
    const regions = regionsOf(page);
    expect(regions!.order[0]!.component).toBe('PageHeader');
    expect(regions!.order[4]!.component).toBe('PageFooter');
  });

  it('records what the content holds', () => {
    // "A list page's content is a grid" is a different statement from "the
    // page has a content region", and both are things a rule may say.
    expect(regionsOf(page)!.body).toContain('DataGrid');
  });

  it('reads a different order as a different order', () => {
    // The whole point. Today's flat, de-duplicated pattern cannot tell these
    // two apart, so "the header is below the content" is unsayable (#75).
    const shuffled = `
      export function InvoicesPage() {
        return (
          <PageLayout>
            <Content><DataGrid /></Content>
            <PageHeader title="Invoices" />
          </PageLayout>
        );
      }`;
    expect(regionsOf(shuffled)!.order.map((r) => r.region)).toEqual(['content', 'header']);
  });
});

describe('what counts as a region', () => {
  it('recognises the plain HTML landmarks', () => {
    const source = `
      export const P = () => (
        <div><header>x</header><nav>y</nav><main>z</main><footer>w</footer></div>
      );`;
    expect(regionsOf(source)!.order.map((r) => r.region)).toEqual([
      'header',
      'nav',
      'content',
      'footer',
    ]);
  });

  it('recognises the kebab-case names a template framework uses', () => {
    const source = '<app-page><app-page-header /><app-content><app-grid /></app-content></app-page>';
    const regions = regionsOf(source, 'angular');
    expect(regions!.holder).toBe('app-page');
    expect(regions!.order.map((r) => r.region)).toEqual(['header', 'content']);
  });

  it('leaves anything it does not recognise out rather than guessing', () => {
    const source = 'export const P = () => (<Shell><Widgetry /><Doodad /></Shell>);';
    expect(regionsOf(source)!.order).toEqual([]);
  });
});

describe('a design system that prefixes every component it exports', () => {
  // Measured on a real Ionic app: 17 screens read, zero layouts. `ionheader`
  // is not `header`, so a page as plain as this one matched nothing at all,
  // and `uic init` drafted nothing about pages for any project of that shape.
  it('reads the layout under the prefix', () => {
    const source = `
      export const Words = () => (
        <IonPage>
          <IonHeader><IonToolbar><IonTitle>Words</IonTitle></IonToolbar></IonHeader>
          <IonContent><IonList /></IonContent>
        </IonPage>
      );`;
    const regions = regionsOf(source)!;
    expect(regions.holder).toBe('IonPage');
    expect(regions.order.map((r) => r.region)).toEqual(['header', 'content']);
  });

  it('reads it in a template dialect too', () => {
    const source = '<nz-layout><nz-header /><nz-content><nz-table /></nz-content></nz-layout>';
    const regions = regionsOf(source, 'angular')!;
    expect(regions.order.map((r) => r.region)).toEqual(['header', 'content']);
  });

  it("does not read a card's own header as the page's", () => {
    // The condition the whole thing depends on: `Card` and `CardHeader` share
    // `Card`, but the prefix may not be the entire holder. Otherwise every
    // component family in every design system becomes a page layout.
    const source = `
      export const P = () => (
        <Card><CardHeader /><CardContent><Table /></CardContent></Card>
      );`;
    expect(regionsOf(source)!.order).toEqual([]);
  });

  it('does not read a list subheader as a page header', () => {
    const source = `
      export const P = () => (
        <IonPage><IonListHeader /><IonSubheader /></IonPage>
      );`;
    expect(regionsOf(source)!.order).toEqual([]);
  });

  it('does not treat a component family as a vendor prefix', () => {
    // `Dialog` shared by `DialogShell` and `DialogTitle` is six characters and
    // a family, not a prefix — and a dialog's title is not a page header.
    const source = `
      export const P = () => (
        <DialogShell><DialogHeader /><DialogBody /></DialogShell>
      );`;
    expect(regionsOf(source)!.order).toEqual([]);
  });

  it('still reads a plain name first, whatever the holder is called', () => {
    // `Container` and `Content` share `Con`; stripping before trying the plain
    // reading would turn a content region into `tent` and lose it.
    const source = 'export const P = () => (<Container><Content /></Container>);';
    expect(regionsOf(source)!.order.map((r) => r.region)).toEqual(['content']);
  });
});

describe('when there is no page to read', () => {
  it('is null for a file with no JSX', () => {
    expect(regionsOf('export const add = (a, b) => a + b;')).toBeNull();
  });

  it('is null for a file that does not parse', () => {
    expect(regionsOf('export const P = ( {')).toBeNull();
  });
});

describe('the ways a region is written in real code', () => {
  it('counts a conditionally rendered region as present', () => {
    // `{showCrumbs && <Breadcrumbs />}` is near-universal in React, and it was
    // reported as a missing region on an otherwise conforming page.
    const source = `
      export const P = () => (
        <PageLayout>
          <PageHeader />
          {showCrumbs && <Breadcrumbs />}
          <Content><A /></Content>
        </PageLayout>
      );`;
    expect(regionsOf(source)!.order.map((r) => r.region)).toEqual([
      'header',
      'breadcrumbs',
      'content',
    ]);
  });

  it('counts one behind a ternary too', () => {
    const source = `
      export const P = () => (
        <PageLayout>{compact ? <PageHeader /> : <PageHeader dense />}<Content><A /></Content></PageLayout>
      );`;
    expect(regionsOf(source)!.order.map((r) => r.region)).toContain('header');
  });

  it('sees past an Angular structural wrapper', () => {
    // <ng-container *ngIf> is the idiomatic conditional and pushed everything
    // beneath it out of view entirely.
    const source =
      '<app-page><app-page-header /><ng-container *ngIf="x"><app-content><app-grid /></app-content></ng-container><app-page-footer /></app-page>';
    const regions = regionsOf(source, 'angular')!;
    expect(regions.order.map((r) => r.region)).toEqual(['header', 'content', 'footer']);
    expect(regions.body).toContain('app-grid');
  });

  it('stops seeing past it once its subtree ends', () => {
    // The wrapper's depths were only ever added, never dropped, so one
    // <ng-container> anywhere shifted the arithmetic for the rest of the page.
    // <app-footer> here sits inside a real <section> — it is not a region, and
    // it was reported as one purely because of a wrapper in another branch
    // (#151).
    const page = (wrapped: boolean): string =>
      '<app-page>' +
      (wrapped
        ? '<ng-container *ngIf="ready"><app-page-header /></ng-container>'
        : '<app-page-header />') +
      '<section class="wrapper"><app-footer /></section>' +
      '</app-page>';

    const withWrapper = regionsOf(page(true), 'angular')!;
    const without = regionsOf(page(false), 'angular')!;

    expect(withWrapper.order.map((r) => r.region)).toEqual(['header']);
    // The same markup either way. A page that reads differently because an
    // unrelated branch is wrapped is the defect, not the wrapping.
    expect(withWrapper.order).toEqual(without.order);
  });

  it('drops a wrapper for a sibling at its own depth, not only for a shallower one', () => {
    const source =
      '<app-page>' +
      '<ng-container *ngIf="x"><app-page-header /></ng-container>' +
      '<app-content><app-grid /></app-content>' +
      '</app-page>';
    const regions = regionsOf(source, 'angular')!;

    expect(regions.order.map((r) => r.region)).toEqual(['header', 'content']);
    expect(regions.body).toContain('app-grid');
  });

  it('takes the page, not a helper defined above it', () => {
    const source = `
      const Row = ({ x }) => <TableRow><Cell>{x}</Cell></TableRow>;
      export const P = () => (
        <PageLayout><PageHeader /><Content><Row /></Content></PageLayout>
      );`;
    expect(regionsOf(source)!.holder).toBe('PageLayout');
  });

  it('does not take a second root as part of the first', () => {
    const source =
      '<app-page><app-page-header /></app-page><app-other><app-page-footer /></app-other>';
    expect(regionsOf(source, 'angular')!.order.map((r) => r.region)).toEqual(['header']);
  });
});

describe('component names a design system actually uses', () => {
  it('recognises an AppBar as the header', () => {
    // MUI's header component. `normalise` strips a leading `app`, so it
    // arrived as `bar` and matched nothing — the header of a MUI project went
    // unrecognised entirely.
    const source = 'export const P = () => (<Page><AppBar /><Content><A /></Content></Page>);';
    expect(regionsOf(source)!.order.map((r) => r.region)).toEqual(['header', 'content']);
  });

  it('still reads a toolbar as actions, not as a header', () => {
    const source = 'export const P = () => (<Page><Toolbar /><Content><A /></Content></Page>);';
    expect(regionsOf(source)!.order[0]!.region).toBe('actions');
  });
});
