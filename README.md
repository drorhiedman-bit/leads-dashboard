# Smart Lead Dashboard for a Solo Plumber

Live site: https://drorhiedman-bit.github.io/leads-dashboard/

A mobile-first dashboard that helps a solo plumber decide which lead to
call first. It scores every lead from 0 to 100 and shows a "Call now"
list, a sales funnel, the best lead sources, and the money in the
pipeline. The leads are read from an Airtable base, after you type an
Airtable token in the connection screen. They are made-up sample leads,
not real customers.

## Features

- All leads list: all the leads as cards (name, job, town, source and stage), in Hebrew, right to left. The list is closed at first and opens with a "Show all" button.
- Call now list: at the top of the page, the 5 best leads to call (stage New or Contacted), each with a large Call button that dials the phone.
- Three big numbers: the money in the pipeline (Contacted and Quote sent, plus the value of Won leads), the new leads from the last 24 hours, and the closing rate.
- Accessibility statement: a Hebrew page linked from the footer that says what was done for accessibility and what is still missing.
- Filters: the All leads list can be filtered by stage and by source, and it says how many leads are shown.
- Red alert: a New lead that has waited more than 3 hours for a reply shows a red alert with an icon and the words "waiting more than 3 hours".
- Sales funnel: one bar per stage with the number of leads, and the conversion percentage from New to Won.
- Best source: for each lead source, the number of leads, how many were won and the closing percentage, shown as bars with the best source first.
- Lead score: every lead gets a score from 0 to 100 with a level word (high, medium or low), the list is sorted by score, and tapping a card shows how the score was built.
- Connection screen: the page first asks for an Airtable token, a Base ID and a Table ID, and shows no lead until you press Connect. The token stays in the page memory, or in your browser if you tick "remember", and "Delete saved key" removes it. A wrong token gives a clear message.
- Leads from Airtable: after connecting, the page reads the leads straight from the Airtable table, checks them against the data rules, lists any row that breaks a rule, and the footer shows how many leads were read and when.
- Weather strip: under the Call now list, the next 3 days in Moshav HaYogev (weather, low and high temperature, rain) from the free Open-Meteo public API, each with a work hint: frost means burst pipe calls, heavy rain means blocked drains and leaks. If Open-Meteo is down, the dashboard is still published and the strip says the forecast is not available.

## Project files

- SPEC.md: what we are building and why.
- Practice.md: the rules we follow while building.
- README.md: this file, the project overview.
- index.html: the main dashboard page.
- accessibility.html: the accessibility statement page.
- style.css: the look of both pages.
- app.js: the dashboard logic (connection to Airtable, data rules, score, lists, charts, filters).
- weather.js: the 3-day forecast, generated from Open-Meteo. Not kept in the repository.
- scripts/fetch-weather.mjs: reads the forecast from Open-Meteo (no key needed), checks it and writes weather.js.
- .github/workflows/publish.yml: reads the weather and publishes the site to GitHub Pages.

## Run it on your computer

1. Run `node scripts/fetch-weather.mjs`. It prints the 3 days it wrote. No token is needed.
2. Open index.html in a browser.
3. In the connection screen, type your Airtable token (scope data.records:read, this base only), the Base ID and the Table ID, and press Connect. Never write the token in a file of this project.

## Status

In development.
