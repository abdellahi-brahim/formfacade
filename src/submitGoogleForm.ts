export type GoogleFormValue = string | number | boolean | null | undefined;
export type GoogleFormValues = Record<string, GoogleFormValue | GoogleFormValue[]>;
export type GoogleFieldMap = Record<string, `entry.${number}` | string>;

export type SubmitGoogleFormOptions = {
  formUrl: string;
  values: GoogleFormValues;
  fieldMap?: GoogleFieldMap;
  timeout?: number;
};

export type GoogleFormSubmissionResult = {
  status: "sent";
  verified: false;
  via: "load" | "timeout";
};

const ENTRY_NAME = /^entry\.\d+$/;

export function createGoogleFormAction(formUrl: string): string {
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

  url.pathname = url.pathname.replace(
    /\/(viewform|formResponse)\/?$/,
    "/formResponse",
  );
  url.search = "";
  url.hash = "";
  return url.toString();
}

function mapValues(
  values: GoogleFormValues,
  fieldMap?: GoogleFieldMap,
): GoogleFormValues {
  const entries: GoogleFormValues = {};

  for (const [localName, value] of Object.entries(values)) {
    const googleEntry = fieldMap ? fieldMap[localName] : localName;
    if (!googleEntry) continue;
    if (!ENTRY_NAME.test(googleEntry)) {
      throw new TypeError(
        `Invalid Google field ID for "${localName}": ${googleEntry}`,
      );
    }
    entries[googleEntry] = value;
  }

  return entries;
}

function hide(element: HTMLElement): void {
  Object.assign(element.style, {
    position: "fixed",
    width: "0",
    height: "0",
    border: "0",
    visibility: "hidden",
  });
}

/**
 * Posts values to a Google Form without rendering Google's UI.
 * The cross-origin response cannot be verified from browser JavaScript.
 */
export function submitGoogleForm({
  formUrl,
  values,
  fieldMap,
  timeout = 10_000,
}: SubmitGoogleFormOptions): Promise<GoogleFormSubmissionResult> {
  if (typeof document === "undefined") {
    return Promise.reject(
      new Error("submitGoogleForm can only run in a browser."),
    );
  }
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    return Promise.reject(new TypeError("values must be an object."));
  }

  let action: string;
  let entries: GoogleFormValues;
  try {
    action = createGoogleFormAction(formUrl);
    entries = mapValues(values, fieldMap);
  } catch (error) {
    return Promise.reject(error);
  }

  return new Promise((resolve) => {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const iframe = document.createElement("iframe");
    const form = document.createElement("form");
    let submitted = false;
    let settled = false;
    let timer: number;

    iframe.name = `formfacade-${token}`;
    iframe.title = "Google Form submission target";
    iframe.tabIndex = -1;
    iframe.src = "about:blank";
    hide(iframe);

    form.action = action;
    form.method = "POST";
    form.target = iframe.name;
    hide(form);

    for (const [name, rawValue] of Object.entries(entries)) {
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      for (const value of values) {
        if (value === undefined || value === null) continue;
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = String(value);
        form.appendChild(input);
      }
    }

    const finish = (via: GoogleFormSubmissionResult["via"]): void => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      form.remove();
      iframe.remove();
      resolve({ status: "sent", verified: false, via });
    };

    iframe.addEventListener("load", () => {
      if (!submitted) {
        submitted = true;
        form.submit();
        return;
      }
      finish("load");
    });

    document.body.append(iframe, form);
    timer = window.setTimeout(() => finish("timeout"), timeout);
  });
}
