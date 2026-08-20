#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { inspectGoogleForm } from "../dist/inspect.js";

function printHelp() {
  console.log(`formfacade

Inspect a published Google Form without OAuth.

Usage:
  formfacade inspect <form-url>
  formfacade inspect <form-url> --json
  formfacade --version

Example:
  npx @abdellahi/formfacade inspect "https://docs.google.com/forms/d/e/FORM_ID/viewform"`);
}

function printForm(form) {
  console.log(`Form: ${form.title}`);
  console.log(`Submit URL: ${form.actionUrl}`);
  console.log(`\nFields (${form.fields.length})`);

  for (const field of form.fields) {
    const requirement = field.required ? "required" : "optional";
    console.log(`\n  ${field.localName}`);
    console.log(`    ${field.label}`);
    console.log(`    ${field.entryId} · ${field.type} · ${requirement}`);
    if (field.options.length) {
      console.log(`    Options: ${field.options.join(", ")}`);
    }
  }

  console.log("\nfieldMap");
  console.log("const fieldMap = {");
  for (const [localName, entryId] of Object.entries(form.fieldMap)) {
    console.log(`  ${localName}: ${JSON.stringify(entryId)},`);
  }
  console.log("};");
}

async function readVersion() {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  return packageJson.version;
}

async function main() {
  const args = process.argv.slice(2);

  if (!args.length || args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }
  if (args.includes("--version") || args.includes("-v")) {
    console.log(await readVersion());
    return;
  }
  if (args[0] !== "inspect") {
    throw new Error(`Unknown command: ${args[0]}`);
  }

  const formUrl = args.find((arg, index) => index > 0 && !arg.startsWith("-"));
  if (!formUrl) throw new Error("Missing the published Google Form URL.");

  const unknownOption = args.find(
    (arg, index) => index > 0 && arg.startsWith("-") && arg !== "--json",
  );
  if (unknownOption) throw new Error(`Unknown option: ${unknownOption}`);

  const form = await inspectGoogleForm(formUrl);
  if (args.includes("--json")) {
    console.log(JSON.stringify(form, null, 2));
  } else {
    printForm(form);
  }
}

main().catch((error) => {
  console.error(`formfacade: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
