# @formfacade/react

A headless bridge between your own React form and Google Forms. The package
renders nothing, owns no field state, and ships no CSS. Your application keeps
complete control of its inputs, validation, components, and styling.

## Install

```bash
npm install @formfacade/react
```

## React hook

```jsx
import { useState } from "react";
import { useGoogleForm } from "@formfacade/react";

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfaJl5x8_ysm6RGrUeJq0EpfA9XnAXVyY7oyrVqKuB6dylx-Q/viewform";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const { submit, isSubmitting, isSuccess, error } = useGoogleForm({
    formUrl: FORM_URL,
    fieldMap: {
      email: "entry.348351691",
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
import { submitGoogleForm } from "@formfacade/react";

await submitGoogleForm({
  formUrl: FORM_URL,
  fieldMap: { email: "entry.348351691" },
  values: { email: "person@example.com" },
});
```

You may omit `fieldMap` when `values` already uses Google entry IDs:

```js
await submitGoogleForm({
  formUrl: FORM_URL,
  values: { "entry.348351691": "person@example.com" },
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
