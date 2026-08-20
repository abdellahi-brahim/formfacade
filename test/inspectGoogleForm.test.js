import assert from "node:assert/strict";
import test from "node:test";
import {
  inspectGoogleForm,
  parseGoogleFormHtml,
} from "../dist/inspect.js";

const FORM_URL = "https://docs.google.com/forms/d/e/example-form/viewform?usp=sharing";

const publicData = [
  null,
  [
    "Tell us what you think.",
    [
      [101, "Email address", null, 0, [[1001, null, 1]]],
      [102, "How can we help?", "Include any useful detail.", 1, [[1002, null, 0]]],
      [103, "Plan", null, 2, [[1003, [["Starter"], ["Pro"]], 1]]],
      [104, "Topics", null, 3, [[1004, [["API"], ["Billing"]], 0]]],
      [105, "Email address", null, 7, [[1005, [["Work"], ["Personal"]], 0]]],
      [107, "Rate each area", null, 5, [[1006, [["1"], ["2"]], 1, ["Support"]]]],
      [106, "A section", null, 8, null],
    ],
    null,
    null,
    null,
    null,
    null,
    null,
    "Product feedback",
    null,
    [null, null, null, null, null, null, 1],
  ],
  "/forms",
  "Fallback title",
];

const html = `<html><script>var FB_PUBLIC_LOAD_DATA_ = ${JSON.stringify(publicData)};</script></html>`;

test("parses field IDs and produces unique local names", () => {
  const result = parseGoogleFormHtml(html, FORM_URL);

  assert.equal(result.title, "Product feedback");
  assert.equal(result.description, "Tell us what you think.");
  assert.equal(result.formUrl, "https://docs.google.com/forms/d/e/example-form/viewform");
  assert.equal(result.actionUrl, "https://docs.google.com/forms/d/e/example-form/formResponse");
  assert.deepEqual(result.fieldMap, {
    emailAddress: "entry.1001",
    howCanWeHelp: "entry.1002",
    plan: "entry.1003",
    topics: "entry.1004",
    emailAddress2: "entry.1005",
    rateEachAreaSupport: "entry.1006",
  });
  assert.deepEqual(result.fields[2].options, ["Starter", "Pro"]);
  assert.equal(result.fields[0].required, true);
  assert.equal(result.fields[1].type, "paragraph");
  assert.equal(result.fields[5].label, "Rate each area - Support");
});

test("ignores brackets inside strings while extracting metadata", () => {
  const data = structuredClone(publicData);
  data[1][0] = 'A description with [brackets] and an escaped "quote".';
  const page = `<script>FB_PUBLIC_LOAD_DATA_ = ${JSON.stringify(data)};</script>`;

  assert.equal(parseGoogleFormHtml(page, FORM_URL).description, data[1][0]);
});

test("reports private or unrecognized pages clearly", () => {
  assert.throws(
    () => parseGoogleFormHtml("<html>Sign in</html>", FORM_URL),
    /published and available without signing in/,
  );
});

test("fetches and parses a published form", async () => {
  const result = await inspectGoogleForm(FORM_URL, {
    fetch: async (url) => {
      assert.equal(url, "https://docs.google.com/forms/d/e/example-form/viewform");
      return new Response(html, {
        headers: { "content-type": "text/html" },
      });
    },
  });

  assert.equal(result.fields.length, 6);
});

test("includes Google Forms' built-in collected email field", () => {
  const data = structuredClone(publicData);
  data[1][10][6] = 3;
  const page = `<script>FB_PUBLIC_LOAD_DATA_ = ${JSON.stringify(data)};</script>`;
  const result = parseGoogleFormHtml(page, FORM_URL);

  assert.equal(result.fields[0].entryId, "emailAddress");
  assert.equal(result.fields[0].localName, "emailAddress");
  assert.equal(result.fieldMap.emailAddress, "emailAddress");
  assert.equal(result.fieldMap.emailAddress2, "entry.1001");
});
