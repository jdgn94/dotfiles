---
name: dependency-guard
description: Use when adding, updating, or reviewing project dependencies across npm, cargo, pip, go, or system packages to prevent dependency bloat, duplicate libraries, deprecated packages, and security risks.
---

# Dependency Guard

Auditing and curation standards for adding or updating software dependencies across multi-language projects.

## Overview

Prevent dependency sprawl, supply chain vulnerabilities, oversized bundles, and redundant libraries by enforcing strict evaluation before installing new third-party packages.

## When to Use

- Considering introducing a new external library or package.
- Upgrading existing dependencies or auditing vulnerable packages.
- Reviewing package lockfile diffs.
- Identifying opportunities to replace bloated packages with standard library or native APIs.

## Procedure

1. **Evaluate Necessity (Native First)**:
   - Check if the required functionality is already present in modern language standards (e.g., native `fetch`, `node:crypto`, `structuredClone`, `Intl`, standard library equivalents).
   - Check if an existing installed library already provides this utility (e.g., avoid adding `lodash` if `radash` or native methods exist).
2. **Package Health & Maintenance Audit**:
   - Verify package recency: Is it actively maintained within the last 12 months?
   - Check for deprecation notices, unmaintained status, or open high-severity CVEs.
   - Inspect bundle footprint: Check bundle size on npm/crates.io. Prefer zero-dependency or tree-shakeable packages.
3. **Safe Installation**:
   - Install using exact, pinned or range-bounded semantic versions.
   - Ensure the respective lockfile (`package-lock.json`, `pnpm-lock.yaml`, `Cargo.lock`, `go.sum`) is committed alongside the manifest.
4. **Security Vulnerability Scan**:
   - Run the native audit tool:
     - Node: `npm audit` or `pnpm audit`
     - Rust: `cargo audit`
     - Python: `pip-audit`
   - Resolve any high/critical security advisories before proceeding.

## Verification Checklist

- [ ] Standard library or existing project utilities were evaluated before adding new package.
- [ ] Added package is actively maintained and free of critical CVEs.
- [ ] Lockfile is updated and consistent with manifest.
- [ ] Audit command passes with zero unresolved high/critical vulnerabilities.
