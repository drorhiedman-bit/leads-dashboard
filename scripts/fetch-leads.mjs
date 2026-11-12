// Reads the Leads table from Airtable and writes data.js for the dashboard.
// The page never talks to Airtable: this script does, with a read-only token.
//
// Run on a computer:  node --env-file=.env scripts/fetch-leads.mjs
// On GitHub the workflow gives the same names from Secrets and Variables.
//
// Needs: AIRTABLE_TOKEN (secret) and AIRTABLE_BASE_ID.

import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const TABLE = "Leads";
const OUTPUT = "data.js";

const STAGES = ["New", "Contacted", "Quote sent", "Won", "Lost"];
const SOURCES = ["Referral", "Repeat customer", "Google", "Facebook", "Facebook group"];
const JOB_TYPES = ["blocked drain", "faucet", "leak repair", "burst pipe", "water heater", "bathroom renovation"];

// Airtable field name -> name the dashboard uses.
const FIELDS = {
  "Lead ID": "id",
  "Name": "name",
  "Phone": "phone",
  "Town": "town",
  "Job type": "jobType",
  "Urgency": "urgency",
  "Value": "value",
  "Source": "source",
  "Distance km": "distanceKm",
  "Received minutes ago": "receivedMinutesAgo",
  "Stage": "stage"
};

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

// Returns the reason a lead breaks the data rules in SPEC.md section 4,
// or null when the lead is fine.
export function problemWith(lead) {
  for (const key of Object.values(FIELDS)) {
    if (lead[key] === undefined || lead[key] === null || lead[key] === "") {
      return "missing " + key;
    }
  }
  if (!Number.isInteger(lead.id)) return "id is not a whole number";
  if (!Number.isInteger(lead.urgency) || lead.urgency < 1 || lead.urgency > 5) {
    return "urgency is not a whole number from 1 to 5";
  }
  if (!isNumber(lead.value) || lead.value < 0) return "value is not a number, zero or more";
  if (!isNumber(lead.distanceKm) || lead.distanceKm < 0) return "distance is not a number, zero or more";
  if (!isNumber(lead.receivedMinutesAgo) || lead.receivedMinutesAgo < 0) {
    return "received minutes ago is not a number, zero or more";
  }
  if (!STAGES.includes(lead.stage)) return "unknown stage: " + lead.stage;
  if (!SOURCES.includes(lead.source)) return "unknown source: " + lead.source;
  if (!JOB_TYPES.includes(lead.jobType)) return "unknown job type: " + lead.jobType;
  return null;
}

// Turns Airtable records into dashboard leads. Bad leads go to rejected.
export function toLeads(records) {
  const leads = [];
  const rejected = [];
  const seenIds = new Set();
  for (const record of records) {
    const lead = {};
    for (const [fieldName, key] of Object.entries(FIELDS)) {
      lead[key] = record.fields[fieldName];
    }
    let problem = problemWith(lead);
    if (!problem && seenIds.has(lead.id)) problem = "duplicate id " + lead.id;
    if (problem) {
      rejected.push({ record: record.id, name: lead.name, problem: problem });
    } else {
      seenIds.add(lead.id);
      leads.push(lead);
    }
  }
  leads.sort(function (a, b) { return a.id - b.id; });
  return { leads: leads, rejected: rejected };
}

// Airtable returns up to 100 records per request, with an offset for more.
async function fetchAllRecords(baseId, token) {
  const records = [];
  let offset = "";
  do {
    const url = "https://api.airtable.com/v0/" + baseId + "/" + encodeURIComponent(TABLE) +
      "?pageSize=100" + (offset ? "&offset=" + encodeURIComponent(offset) : "");
    const response = await fetch(url, { headers: { Authorization: "Bearer " + token } });
    if (!response.ok) {
      throw new Error("Airtable answered " + response.status + " " + response.statusText +
        ". Check the token, its scope, and the base id.");
    }
    const page = await response.json();
    records.push(...page.records);
    offset = page.offset || "";
  } while (offset);
  return records;
}

async function main() {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) {
    throw new Error("AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be set (see .env.example).");
  }

  const records = await fetchAllRecords(baseId, token);
  const { leads, rejected } = toLeads(records);

  console.log("Records read from Airtable: " + records.length);
  console.log("Leads written:              " + leads.length);
  console.log("Leads rejected:             " + rejected.length);

  if (rejected.length > 0) {
    for (const item of rejected) {
      console.error("Rejected " + item.record + " (" + (item.name || "no name") + "): " + item.problem);
    }
    throw new Error("Fix the rejected leads in Airtable. Nothing was written.");
  }
  if (leads.length === 0) {
    throw new Error("The Leads table is empty. Nothing was written.");
  }

  const fetchedAt = new Date().toISOString();
  const content =
    "// Generated from Airtable by scripts/fetch-leads.mjs. Do not edit by hand.\n" +
    "// Never commit this file (see .gitignore).\n" +
    "const DATA_FETCHED_AT = " + JSON.stringify(fetchedAt) + ";\n" +
    "const LEADS = Object.freeze(" + JSON.stringify(leads, null, 2) + ");\n";
  writeFileSync(OUTPUT, content, "utf8");
  console.log("Wrote " + OUTPUT + " at " + fetchedAt);
}

// Run only when started directly, so the tests can import the functions.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(function (error) {
    console.error(error.message);
    process.exit(1);
  });
}
