import fs from "fs";

const raw = fs.readFileSync("./connect.csv", "utf8");

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function splitMultiValue(value) {
  if (!value) return [];
  return value
    .split(";")
    .map(v => v.trim())
    .filter(Boolean);
}

const lines = raw.split(/\r?\n/).filter(Boolean);
const headers = parseCSVLine(lines[0]);

const data = lines.slice(1).map(line => {
  const values = parseCSVLine(line);
  const row = Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));

  return {
    id: row.resource_id,
    slug: row.resource_slug,
    name: row.resource_name,
    organization: row.organization,
    url: row.url,
    description: row.short_description,
    theme: row.horizontal_theme,
    x: Number(row.horizontal_value),
    stage: row.vertical_stage,
    y: Number(row.vertical_value),
    identityCommunity: splitMultiValue(row.identity_community),
    accessMode: splitMultiValue(row.access_mode),
    geography: splitMultiValue(row.geography),
    resourceType: splitMultiValue(row.resource_type),
    eligibilityNotes: row.eligibility_notes
  };
});

fs.writeFileSync("./resources.json", JSON.stringify(data, null, 2));
console.log("Wrote resources.json");