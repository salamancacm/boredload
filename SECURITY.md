# Security Policy

## Supported Versions

Only the latest published `0.x` release of `boredload` is actively supported with security
fixes.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities. Instead, report them
privately via [GitHub Security Advisories](https://github.com/salamancacm/boredload/security/advisories/new)
or by emailing the maintainer.

We'll acknowledge reports as promptly as possible and aim to ship a fix or mitigation before any
public disclosure.

## Scope

`boredload` has zero runtime dependencies and only touches the DOM/Canvas APIs it's given a
container/canvas element for — it does not perform network requests, read cookies, or access
storage.
