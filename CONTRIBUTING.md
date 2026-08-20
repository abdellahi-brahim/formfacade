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
