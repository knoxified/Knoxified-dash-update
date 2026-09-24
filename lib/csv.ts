// Minimal RFC 4180 CSV parser (quoted fields, embedded commas/newlines,
// escaped "" quotes, BOM, CRLF) plus header detection for lead imports. Kept
// dependency-free on purpose: it is only used for lead lists.

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully blank lines.
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export type LeadField = "name" | "firstName" | "lastName" | "phone" | "email" | "company";
export type ColumnMap = Partial<Record<LeadField, number>>;

const SYNONYMS: Record<LeadField, string[]> = {
  name: ["name", "full name", "fullname", "contact", "contact name", "lead name", "customer name"],
  firstName: ["first name", "firstname", "first", "given name"],
  lastName: ["last name", "lastname", "last", "surname", "family name"],
  phone: ["phone", "phone number", "phonenumber", "mobile", "mobile phone", "cell", "cell phone", "telephone", "tel", "whatsapp"],
  email: ["email", "email address", "e mail", "emailaddress", "work email"],
  company: ["company", "company name", "organization", "organisation", "business", "business name", "employer"],
};

const normalizeHeader = (h: string) => h.trim().toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");

// Best-effort guess at which column is which. The UI lets the user correct it.
export function detectColumns(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  const normalized = headers.map(normalizeHeader);
  (Object.keys(SYNONYMS) as LeadField[]).forEach((field) => {
    const idx = normalized.findIndex((h, i) => SYNONYMS[field].includes(h) && !Object.values(map).includes(i));
    if (idx !== -1) map[field] = idx;
  });
  // Prefer a single full-name column; only fall back to first+last.
  if (map.name !== undefined) {
    delete map.firstName;
    delete map.lastName;
  }
  return map;
}

export type ImportRow = { name: string; phone: string; email: string; company: string };

export function rowsToLeads(dataRows: string[][], map: ColumnMap): ImportRow[] {
  const get = (r: string[], k: LeadField) => (map[k] !== undefined ? (r[map[k] as number] ?? "").trim() : "");
  return dataRows.map((r) => ({
    name: get(r, "name") || [get(r, "firstName"), get(r, "lastName")].filter(Boolean).join(" "),
    phone: get(r, "phone"),
    email: get(r, "email"),
    company: get(r, "company"),
  }));
}
