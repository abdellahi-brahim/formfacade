export type GoogleFormFieldType =
  | "short-answer"
  | "paragraph"
  | "multiple-choice"
  | "checkboxes"
  | "linear-scale"
  | "grid"
  | "dropdown"
  | "date"
  | "time"
  | "unknown";

export type GoogleFormSubmissionFieldId = `entry.${number}` | "emailAddress";

export type InspectedGoogleFormField = {
  itemId: string;
  entryId: GoogleFormSubmissionFieldId;
  localName: string;
  label: string;
  description?: string;
  type: GoogleFormFieldType;
  typeCode: number;
  required: boolean;
  options: string[];
};

export type InspectedGoogleForm = {
  title: string;
  description?: string;
  formId: string;
  formUrl: string;
  actionUrl: string;
  fields: InspectedGoogleFormField[];
  fieldMap: Record<string, GoogleFormSubmissionFieldId>;
};

export type InspectGoogleFormOptions = {
  fetch?: typeof globalThis.fetch;
  signal?: AbortSignal;
};

const TYPE_NAMES: Record<number, GoogleFormFieldType> = {
  0: "short-answer",
  1: "paragraph",
  2: "multiple-choice",
  3: "checkboxes",
  4: "linear-scale",
  5: "grid",
  7: "dropdown",
  9: "date",
  10: "time",
};

type UnknownArray = unknown[];

function isArray(value: unknown): value is UnknownArray {
  return Array.isArray(value);
}

function parsePublishedUrl(formUrl: string): {
  formId: string;
  formUrl: string;
  actionUrl: string;
} {
  let url: URL;
  try {
    url = new URL(formUrl);
  } catch {
    throw new TypeError("formUrl must be a valid URL.");
  }

  if (url.hostname !== "docs.google.com" || !url.pathname.includes("/forms/")) {
    throw new TypeError("formUrl must be a docs.google.com/forms URL.");
  }
  if (!/\/(viewform|formResponse)\/?$/.test(url.pathname)) {
    throw new TypeError("formUrl must be a published Google Form URL.");
  }

  const formIdMatch = url.pathname.match(/\/forms\/d\/(?:e\/)?([^/]+)/);
  if (!formIdMatch) {
    throw new TypeError("Could not read the Google Form ID from formUrl.");
  }

  url.pathname = url.pathname.replace(
    /\/(viewform|formResponse)\/?$/,
    "/viewform",
  );
  url.search = "";
  url.hash = "";

  const publishedUrl = url.toString();
  url.pathname = url.pathname.replace(/\/viewform$/, "/formResponse");

  return {
    formId: formIdMatch[1],
    formUrl: publishedUrl,
    actionUrl: url.toString(),
  };
}

function extractPublicData(html: string): UnknownArray {
  const marker = "FB_PUBLIC_LOAD_DATA_";
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(
      "Could not find public form metadata. Make sure the form is published and available without signing in.",
    );
  }

  const assignmentIndex = html.indexOf("=", markerIndex + marker.length);
  const startIndex = html.indexOf("[", assignmentIndex + 1);
  if (assignmentIndex === -1 || startIndex === -1) {
    throw new Error("The published form metadata is malformed.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < html.length; index += 1) {
    const character = html[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === "[") {
      depth += 1;
    } else if (character === "]") {
      depth -= 1;
      if (depth === 0) {
        const data: unknown = JSON.parse(html.slice(startIndex, index + 1));
        if (!isArray(data)) throw new Error("The public form metadata is invalid.");
        return data;
      }
    }
  }

  throw new Error("The published form metadata is incomplete.");
}

function toLocalName(label: string, fallback: string): string {
  const words = label
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[A-Za-z0-9]+/g);

  if (!words?.length) return fallback;

  const [first, ...rest] = words;
  const name =
    first.toLowerCase() +
    rest
      .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
      .join("");

  return /^\d/.test(name) ? `field${name[0].toUpperCase()}${name.slice(1)}` : name;
}

function uniqueLocalName(base: string, names: Set<string>): string {
  if (!names.has(base)) {
    names.add(base);
    return base;
  }

  let suffix = 2;
  while (names.has(`${base}${suffix}`)) suffix += 1;
  const name = `${base}${suffix}`;
  names.add(name);
  return name;
}

function readOptions(rawOptions: unknown): string[] {
  if (!isArray(rawOptions)) return [];

  return rawOptions.flatMap((option) => {
    if (!isArray(option) || typeof option[0] !== "string" || !option[0]) return [];
    return [option[0]];
  });
}

function readSubEntryLabel(rawEntry: UnknownArray): string | undefined {
  if (!isArray(rawEntry[3])) return undefined;
  const parts = rawEntry[3].filter(
    (part): part is string => typeof part === "string" && Boolean(part),
  );
  return parts.length ? parts.join(" - ") : undefined;
}

/**
 * Parses the metadata embedded in a published Google Form page.
 * Google does not document this page format, so callers should handle errors.
 */
export function parseGoogleFormHtml(
  html: string,
  formUrl: string,
): InspectedGoogleForm {
  const urls = parsePublishedUrl(formUrl);
  const publicData = extractPublicData(html);
  const formData = publicData[1];

  if (!isArray(formData) || !isArray(formData[1])) {
    throw new Error("The published form does not contain readable questions.");
  }

  const title =
    (typeof formData[8] === "string" && formData[8]) ||
    (typeof publicData[3] === "string" && publicData[3]) ||
    "Untitled Google Form";
  const description =
    typeof formData[0] === "string" && formData[0] ? formData[0] : undefined;
  const fields: InspectedGoogleFormField[] = [];
  const localNames = new Set<string>();

  const settings = formData[10];
  const emailCollectionMode = isArray(settings) ? settings[6] : undefined;
  if (typeof emailCollectionMode === "number" && emailCollectionMode > 1) {
    const localName = uniqueLocalName("emailAddress", localNames);
    fields.push({
      itemId: "emailAddress",
      entryId: "emailAddress",
      localName,
      label: "Email Address",
      type: "short-answer",
      typeCode: 0,
      required: true,
      options: [],
    });
  }

  for (const rawItem of formData[1]) {
    if (!isArray(rawItem) || !isArray(rawItem[4])) continue;

    const itemId = String(rawItem[0] ?? "");
    const label =
      typeof rawItem[1] === "string" && rawItem[1]
        ? rawItem[1]
        : `Question ${fields.length + 1}`;
    const itemDescription =
      typeof rawItem[2] === "string" && rawItem[2]
        ? rawItem[2]
        : undefined;
    const typeCode = typeof rawItem[3] === "number" ? rawItem[3] : -1;
    const entries = rawItem[4];

    for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
      const rawEntry = entries[entryIndex];
      if (!isArray(rawEntry) || typeof rawEntry[0] !== "number") continue;

      const subEntryLabel = readSubEntryLabel(rawEntry);
      const fieldLabel = subEntryLabel ? `${label} - ${subEntryLabel}` : label;
      const baseName = toLocalName(fieldLabel, `field${fields.length + 1}`);
      const indexedName =
        entryIndex === 0 || subEntryLabel
          ? baseName
          : `${baseName}${entryIndex + 1}`;
      const localName = uniqueLocalName(indexedName, localNames);
      fields.push({
        itemId,
        entryId: `entry.${rawEntry[0]}`,
        localName,
        label: fieldLabel,
        description: itemDescription,
        type: TYPE_NAMES[typeCode] ?? "unknown",
        typeCode,
        required: Boolean(rawEntry[2]),
        options: readOptions(rawEntry[1]),
      });
    }
  }

  if (!fields.length) {
    throw new Error("The published form does not contain any submittable fields.");
  }

  return {
    ...urls,
    title,
    description,
    fields,
    fieldMap: Object.fromEntries(
      fields.map((field) => [field.localName, field.entryId]),
    ),
  };
}

/**
 * Fetches and inspects a published Google Form without OAuth.
 * This is intended for Node.js; browsers normally block the request with CORS.
 */
export async function inspectGoogleForm(
  formUrl: string,
  options: InspectGoogleFormOptions = {},
): Promise<InspectedGoogleForm> {
  const { formUrl: publishedUrl } = parsePublishedUrl(formUrl);
  const fetchImplementation = options.fetch ?? globalThis.fetch;
  if (!fetchImplementation) {
    throw new Error("inspectGoogleForm requires a fetch implementation.");
  }

  const response = await fetchImplementation(publishedUrl, {
    headers: { accept: "text/html" },
    redirect: "follow",
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(
      `Google Forms returned ${response.status} ${response.statusText || ""}`.trim(),
    );
  }

  const html = await response.text();
  return parseGoogleFormHtml(html, publishedUrl);
}
