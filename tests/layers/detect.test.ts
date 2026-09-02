import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { detectPackages, findProjectRoot } from '../../src/layers/detect.js';
import { resolveChain } from '../../src/layers/chain.js';

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

describe('detectPackages', () => {
  it('finds packages declared by pnpm-workspace.yaml', async () => {
    const packages = await detectPackages(fixture('pnpm-ws'));
    const names = packages.map((p) => p.name).sort();
    expect(names).toEqual(['@fixture/core', '@fixture/orders']);
  });

  it('records each package dependencies', async () => {
    const packages = await detectPackages(fixture('pnpm-ws'));
    const orders = packages.find((p) => p.name === '@fixture/orders');
    expect(orders?.dependencies).toEqual(['@fixture/core']);
  });

  it('finds packages declared by npm workspaces', async () => {
    const packages = await detectPackages(fixture('npm-ws'));
    const names = packages.map((p) => p.name).sort();
    expect(names).toEqual(['@fixture/ui', '@fixture/web']);
  });

  it('treats a single-package project as one package', async () => {
    const packages = await detectPackages(fixture('single'));
    expect(packages.map((p) => p.name)).toEqual(['single-app']);
  });

  // An Nx workspace declares its libraries in tsconfig paths and gives them no
  // package.json at all. Requiring one made the tool silent in exactly the kind
  // of repository it was built for.
  describe('a workspace whose packages have no package.json', () => {
    it('finds packages declared by tsconfig paths', async () => {
      const packages = await detectPackages(fixture('nx-ws'));
      const names = packages.map((p) => p.name).sort();
      expect(names).toEqual(['@fixture/core', '@fixture/orders']);
    });

    it('roots each package at its directory, not at its entry file', async () => {
      const packages = await detectPackages(fixture('nx-ws'));
      const core = packages.find((p) => p.name === '@fixture/core');
      expect(core?.root).toBe(join(fixture('nx-ws'), 'libs/core'));
    });

    it('derives dependencies from imports when nothing declares them', async () => {
      const packages = await detectPackages(fixture('nx-ws'));
      const orders = packages.find((p) => p.name === '@fixture/orders');
      expect(orders?.dependencies.sort()).toEqual(['@fixture/core', 'some-ui-lib']);
    });

    it('does not invent a dependency the imports do not support', async () => {
      const packages = await detectPackages(fixture('nx-ws'));
      const core = packages.find((p) => p.name === '@fixture/core');
      expect(core?.dependencies).toEqual(['some-ui-lib']);
    });

    it('ignores the wildcard form of a path already mapped', async () => {
      const packages = await detectPackages(fixture('nx-ws'));
      expect(packages.map((p) => p.name)).not.toContain('@fixture/core/*');
    });
  });

  // Newer Nx gives some libraries a package.json and leaves others with only
  // an alias, so both mechanisms have to hold at once.
  describe('a workspace where only some packages have a package.json', () => {
    it('takes the declared package at its word and finds the aliased one too', async () => {
      const packages = await detectPackages(fixture('nx-mixed'));
      const names = packages.map((p) => p.name).sort();
      expect(names).toEqual(['@fixture/core', '@fixture/orders', '@fixture/widgets']);
    });

    it('keeps the dependencies the manifest declares rather than deriving its own', async () => {
      const packages = await detectPackages(fixture('nx-mixed'));
      const core = packages.find((p) => p.name === '@fixture/core');
      expect(core?.dependencies).toEqual(['some-ui-lib']);
    });

    // An Nx library's manifest is routinely a name and a version and nothing
    // else, because siblings resolve through the aliases rather than through
    // node_modules. Reading that as "depends on nothing" collapses the chain
    // to the file's own layer and brings back the silence in a second form.
    it('derives dependencies for a manifest that declares none', async () => {
      const packages = await detectPackages(fixture('nx-mixed'));
      const widgets = packages.find((p) => p.name === '@fixture/widgets');
      expect(widgets?.dependencies).toEqual(['@fixture/core', 'some-ui-lib']);
    });

    it('reads a tsconfig carrying comments and trailing commas', async () => {
      const packages = await detectPackages(fixture('nx-mixed'));
      expect(packages.map((p) => p.name)).toContain('@fixture/orders');
    });
  });
});

describe('findProjectRoot', () => {
  // A hook is handed a file, so the root has to come from the file. Stopping
  // at the first package.json above it lands inside the library and the rest
  // of the workspace — every layer the file should be checked against — is
  // never seen.
  it('walks past a package to the workspace its aliases are declared in', async () => {
    const root = fixture('nx-mixed');
    expect(await findProjectRoot(join(root, 'libs/core/src/components'))).toBe(root);
  });

  it('still stops at the nearest package when nothing declares a workspace', async () => {
    const root = fixture('single');
    expect(await findProjectRoot(root)).toBe(root);
  });
});

describe('tsconfig extends', () => {
  // Splitting paths into a file the base config extends is common, and a
  // reader that stops at the first tsconfig it can parse finds no aliases and
  // goes quiet — the same failure through a different door.
  it('follows extends to the file that actually declares the paths', async () => {
    const packages = await detectPackages(fixture('nx-extends'));
    expect(packages.map((p) => p.name)).toEqual(['@fixture/core']);
  });
});

// The shape a public Nx repository actually has (nrwl/nx-examples), which is
// none of the three above: workspaces globbed several levels deep, a manifest
// per library, no tsconfig paths at all, and every cross-library dependency
// recorded as a devDependency.
describe('a workspace globbed several levels deep', () => {
  it('expands a pattern with more than one segment of wildcard', async () => {
    const packages = await detectPackages(fixture('nx-workspaces'));
    const names = packages.map((p) => p.name).sort();
    expect(names).toEqual(['@fixture/shared-ui', '@fixture/shared-util', '@fixture/web']);
  });

  // Nothing about a dependency being for development makes it a different
  // edge in the import graph, and Nx records workspace siblings there.
  it('counts a devDependency as an edge', async () => {
    const packages = await detectPackages(fixture('nx-workspaces'));
    const web = packages.find((p) => p.name === '@fixture/web');
    expect(web?.dependencies).toEqual(['@fixture/shared-ui']);
  });

  it('derives edges for a manifest declaring none, with no aliases in sight', async () => {
    const packages = await detectPackages(fixture('nx-workspaces'));
    const util = packages.find((p) => p.name === '@fixture/shared-util');
    expect(util?.dependencies).toEqual(['some-ui-lib']);
  });
});

// Every finding below was reported by review against a synthesized repository,
// then reproduced here. Each is a way the tool goes quiet or answers
// differently depending on which surface asked — the same failure mode this
// whole branch exists to close.
describe('shapes that made it go quiet again', () => {
  it('does not treat a package self-alias as a workspace boundary', async () => {
    // A Next.js or Nx app carries its own tsconfig.json with "@/*": ["./src/*"].
    // Stopping there roots the hook inside the app, so it never sees the layers
    // the file should be checked against and reports nothing — while the CLI,
    // run from the real root, reports the violation.
    const root = fixture('nx-workspaces');
    expect(await findProjectRoot(join(root, 'apps/web/src'))).toBe(root);
  });

  it('expands a globstar workspace pattern', async () => {
    // "packages/**" is ordinary npm and yarn. Treated as a literal directory
    // name it matches nothing and every workspace member disappears.
    const packages = await detectPackages(fixture('deep-glob'));
    expect(packages.map((p) => p.name)).toContain('@fixture/ui');
  });

  it('roots an alias that names a directory at that directory', async () => {
    // TypeScript allows a directory target. Taking dirname of it unconditionally
    // lands on the grouping folder, which then contains every sibling library.
    const packages = await detectPackages(fixture('dir-alias'));
    const core = packages.find((p) => p.name === '@fixture/core');
    expect(core?.root).toBe(join(fixture('dir-alias'), 'libs/core'));
  });

  it('emits one layer per directory, whatever the alias calls it', async () => {
    // An alias naming a package differently from its manifest produced two
    // layers over one directory, and .uicrc.json keyed on either name left the
    // other on the chain.
    const packages = await detectPackages(fixture('alias-name-mismatch'));
    const roots = packages.map((p) => p.root);
    expect(roots).toHaveLength(new Set(roots).size);
  });
});

// #32, from a real Nx monorepo: aliases three and four segments deep.
// Detection found all 55 packages and `scan` listed correct export counts,
// yet `check` reported nothing on 2786 files — the edges pointed at names
// that were not layers, so no chain ever connected.
describe('aliases deeper than a two-segment scope', () => {
  it('derives an edge naming the layer, not a two-segment truncation of it', async () => {
    const packages = await detectPackages(fixture('deep-alias'));
    const invoices = packages.find((p) => p.name === '@fixture/client-ui/customers/invoices');
    expect(invoices?.dependencies).toContain('@fixture/client-ui/common');
  });

  it('still collapses an external subpath to its package', async () => {
    // The truncation is right for anything not detected as a layer:
    // `some-ui-lib/Drawer` is one package, not a layer per subpath.
    const packages = await detectPackages(fixture('deep-alias'));
    const ui = packages.find((p) => p.name === '@fixture/ui');
    expect(ui?.dependencies).toEqual(['some-ui-lib']);
  });
});

// #38, from a real single-package app. Its tsconfig carries convenience
// aliases into its own src, one of which has no wildcard — so it was taken as
// the repository's only package. Every file outside that one folder then had
// no owning package, an empty chain, and was silently unchecked: the whole app.
describe('a single package whose tsconfig aliases point into its own src', () => {
  it('keeps the package the manifest names', async () => {
    const packages = await detectPackages(fixture('single-alias'));
    expect(packages.map((p) => p.name)).toContain('ui-web');
  });

  it('leaves no file in the project without an owning package', async () => {
    const root = fixture('single-alias');
    const packages = await detectPackages(root);
    const chain = resolveChain(join(root, 'src/domains/ReportPage.tsx'), packages);
    expect(chain.length).toBeGreaterThan(0);
    expect(chain[0]?.name).toBe('ui-web');
  });
});

// #39 and #40, both found running against a real Nx repository of ~55 libs.
// Neither inverted into a wrong finding — the "never invent, only miss"
// invariant held — but both put things in the graph that are not layers.
describe('what an alias is allowed to name', () => {
  it('does not take an alias into node_modules for a first-party layer', async () => {
    // Pinning an external package's type entry point through paths is common.
    // Taken as a layer it builds a phantom inventory out of node_modules.
    const packages = await detectPackages(fixture('nx-ws'));
    expect(packages.map((p) => p.name)).not.toContain('@vendor/typed');
  });

  it('does not record a package as depending on itself', async () => {
    // A file reaching for its own package's alias instead of a relative path
    // resolved to the package's own name. The cycle guard makes it harmless,
    // but it is nonsense in the graph and a trap for anything that later
    // trusts the dependency list.
    const packages = await detectPackages(fixture('nx-ws'));
    const orders = packages.find((p) => p.name === '@fixture/orders');
    expect(orders?.dependencies).not.toContain('@fixture/orders');
  });
});
