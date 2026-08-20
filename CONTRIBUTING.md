# Contributing

Thanks for taking the time to help with FormFacade.

## Before you start

Search the existing issues before opening a new one. For larger changes, open
an issue first so we can agree on the API and scope before you spend time on an
implementation.

Do not open a public issue for a security vulnerability. Follow the process in
[SECURITY.md](SECURITY.md) instead.

## Local setup

You need Node.js 20 or newer.

```bash
npm install
npm run typecheck
npm run build
```

## Pull requests

Keep each pull request focused on one change. Include:

- A clear description of the problem and the proposed behavior
- Tests or a reproducible example when behavior changes
- Documentation for new or changed public APIs

Run `npm run check` before submitting. By contributing, you agree that your
work will be licensed under the MIT License.

## Releases

Package releases are published by `.github/workflows/publish.yml` when a
version tag is pushed. The tag must match the version in `package.json`.

Before using the workflow for the first time, configure the npm trusted
publisher for `@abdellahi/formfacade` with these values:

- Provider: GitHub Actions
- Organization or user: `abdellahi-brahim`
- Repository: `formfacade`
- Workflow filename: `publish.yml`
- Allowed action: npm publish

Then prepare and publish a release:

```bash
npm version 0.2.0 --no-git-tag-version
npm run check
git tag v0.2.0
git push origin main v0.2.0
```

Use the actual new version in place of `0.2.0`. The workflow uses npm trusted
publishing, so it does not require an `NPM_TOKEN` GitHub secret.
