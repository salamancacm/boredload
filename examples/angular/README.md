# boredload — Angular example

Standard `ng new` scaffold with the default page replaced by a `boredload` demo using
`BoredloadGameDirective` from `boredload/angular`.

## Run it

```bash
npm install
npm start
```

## A note on local development

This example depends on `boredload` via `file:../..`, which npm typically realizes as a
**symlink** back to the repo root. The repo root also has its own `node_modules/@angular/core`
installed (needed to build `boredload/angular` with `ng-packagr`). When both exist, a
symlink-preserving bundler resolution can end up loading **two separate `@angular/core` module
instances** — one for this app, one reached through the symlinked package — which surfaces as a
spurious `NG0203: ... injection context` runtime error that has nothing to do with the actual
directive code.

If you hit `NG0203` while testing this example against a local checkout, install from a real
packed tarball instead of the symlinked `file:` dependency:

```bash
cd ../..
npm pack --pack-destination examples/angular
cd examples/angular
npm install ./boredload-0.1.0.tgz --no-save
```

This does not affect real consumers — a normal `npm install boredload` from the registry is a
plain copy into your app's own `node_modules`, with no second `@angular/core` install anywhere
nearby to conflict with.
