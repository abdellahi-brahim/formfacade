# @abdellahi/formfacade

[![CI](https://github.com/abdellahi-brahim/formfacade/actions/workflows/ci.yml/badge.svg)](https://github.com/abdellahi-brahim/formfacade/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40abdellahi%2Fformfacade)](https://www.npmjs.com/package/@abdellahi/formfacade)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A headless bridge between your own React form and Google Forms. The package
renders nothing, owns no field state, and ships no CSS. Your application keeps
complete control of its inputs, validation, components, and styling.

## Install

```bash
npm install @abdellahi/formfacade
```

## Inspect a Google Form

Pass a published form URL to the CLI. It reads the public form metadata and
prints the field names and `entry.*` IDs without an API key or Google login.

```bash
npx @abdellahi/formfacade inspect "https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform"
```

```text
Fields (2)

  emailAddress
    Email Address
    entry.123456 · short-answer · required

  message
    Message
    entry.789012 · paragraph · optional

fieldMap
const fieldMap = {
  emailAddress: "entry.123456",
  message: "entry.789012",
};
```

Add `--json` for machine-readable output:

```bash
npx @abdellahi/formfacade inspect "FORM_URL" --json
```

The same inspector is available from Node.js:

```js
import { inspectGoogleForm } from "@abdellahi/formfacade/inspect";

const form = await inspectGoogleForm(FORM_URL);
console.log(form.fieldMap);
```

The inspector reads metadata embedded in the public form page. Google does not
document that page format, so inspection can break if Google changes it. It also
cannot inspect forms that require sign-in.

## React hook

```jsx
import { useState } from "react";
import { useGoogleForm } from "@abdellahi/formfacade";

const FORM_URL =
  "https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const { submit, isSubmitting, isSuccess, error } = useGoogleForm({
    formUrl: FORM_URL,
    fieldMap: {
      email: "entry.YOUR_EMAIL_FIELD_ID",
    },
  });

  if (isSuccess) return <p>You're on the list.</p>;

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        await submit({ email });
      }}
    >
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <button disabled={isSubmitting}>
        {isSubmitting ? "Joining…" : "Join waitlist"}
      </button>
      {error && <p>Could not submit the form.</p>}
    </form>
  );
}
```

`fieldMap` maps the names used by your application to the `entry.*` IDs used by
Google Forms. Arrays are submitted as repeated fields for checkbox questions.

## Framework-neutral function

The low-level function can be used without the React hook:

```js
import { submitGoogleForm } from "@abdellahi/formfacade";

await submitGoogleForm({
  formUrl: FORM_URL,
  fieldMap: { email: "entry.YOUR_EMAIL_FIELD_ID" },
  values: { email: "person@example.com" },
});
```

You may omit `fieldMap` when `values` already uses Google entry IDs:

```js
await submitGoogleForm({
  formUrl: FORM_URL,
  values: { "entry.YOUR_EMAIL_FIELD_ID": "person@example.com" },
});
```

## Important limitation

Google Forms accepts the cross-origin POST but does not expose a browser-readable
response. A resolved promise means the browser sent the request; it cannot prove
that Google accepted or stored the response. The result therefore explicitly
contains `verified: false`. Use your own server endpoint when confirmed delivery
is required.

## Development

To build the publishable ESM, CommonJS, and TypeScript declaration files:

```bash
npm install
npm run build
```

## Contributing

Bug reports and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md)
before starting a larger change. Report security issues using the process in
[SECURITY.md](SECURITY.md).

## License

MIT © Abdellahi Brahim. See [LICENSE](LICENSE).
