// Reads a 3-day weather forecast from Open-Meteo and writes weather.js for
// the dashboard (SPEC.md section 4a). Open-Meteo is a free public API:
// no key, no account, no secret. The page never talks to Open-Meteo.
//
// Run on a computer:  node scripts/fetch-weather.mjs
//
// The weather is less important than the leads. If Open-Meteo does not
// answer, or the answer breaks a data rule, this script writes an empty
// forecast, prints why, and still ends successfully.

import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const OUTPUT = "weather.js";
const DAYS = 3;
const TIMEOUT_MS = 10000;

// Moshav HaYogev, the centre of the service area.
const PLACE = { name: "Moshav HaYogev", latitude: 32.61, longitude: 35.20 };

const URL_FORECAST =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=" + PLACE.latitude +
  "&longitude=" + PLACE.longitude +
  "&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,weather_code" +
  "&timezone=Asia%2FJerusalem" +
  "&forecast_days=" + DAYS;

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

// Turns the Open-Meteo answer into 3 simple day objects.
// Throws an error with the reason when a data rule is broken.
export function toDays(answer) {
  const daily = answer && answer.daily;
  if (!daily) throw new Error("the answer has no daily forecast");
  const lists = {
    date: daily.time,
    minC: daily.temperature_2m_min,
    maxC: daily.temperature_2m_max,
    rainMm: daily.precipitation_sum,
    code: daily.weather_code
  };
  for (const [name, list] of Object.entries(lists)) {
    if (!Array.isArray(list) || list.length !== DAYS) {
      throw new Error(name + " does not have exactly " + DAYS + " days");
    }
  }
  const days = [];
  for (let i = 0; i < DAYS; i++) {
    const day = {
      date: lists.date[i],
      minC: lists.minC[i],
      maxC: lists.maxC[i],
      rainMm: lists.rainMm[i],
      code: lists.code[i]
    };
    if (typeof day.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)) {
      throw new Error("day " + (i + 1) + ": date is missing or not a date");
    }
    for (const key of ["minC", "maxC", "rainMm", "code"]) {
      if (!isNumber(day[key])) throw new Error("day " + (i + 1) + ": " + key + " is not a number");
    }
    if (day.minC > day.maxC) throw new Error("day " + (i + 1) + ": lowest temperature is above highest");
    if (day.rainMm < 0) throw new Error("day " + (i + 1) + ": rain is below zero");
    days.push(day);
  }
  return days;
}

async function fetchForecast() {
  const response = await fetch(URL_FORECAST, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error("Open-Meteo answered " + response.status + " " + response.statusText);
  }
  return response.json();
}

function write(days, problem) {
  const fetchedAt = new Date().toISOString();
  const weather = { place: PLACE.name, fetchedAt: fetchedAt, days: days };
  const content =
    "// Generated from Open-Meteo by scripts/fetch-weather.mjs. Do not edit by hand.\n" +
    "// Never commit this file (see .gitignore).\n" +
    (problem ? "// Forecast not available: " + problem.replace(/\s+/g, " ") + "\n" : "") +
    "const WEATHER = Object.freeze(" + JSON.stringify(weather, null, 2) + ");\n";
  writeFileSync(OUTPUT, content, "utf8");
  console.log("Wrote " + OUTPUT + " at " + fetchedAt);
}

async function main() {
  let days;
  try {
    days = toDays(await fetchForecast());
  } catch (error) {
    console.log("Forecast not available: " + error.message);
    console.log("Writing an empty forecast. The dashboard is still published.");
    write([], error.message);
    return;
  }
  console.log("Forecast for " + PLACE.name + ", " + days.length + " days:");
  for (const day of days) {
    console.log("  " + day.date + "  low " + day.minC + " C, high " + day.maxC +
      " C, rain " + day.rainMm + " mm, weather code " + day.code);
  }
  write(days, "");
}

// Run only when started directly, so the tests can import the functions.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(function (error) {
    // Even an unexpected error must not stop the leads from being published.
    console.log("Forecast not available: " + error.message);
    write([], error.message);
  });
}
