\# Smart Lead Dashboard for a Solo Plumber

Live site: https://drorhiedman-bit.github.io/leads-dashboard/



A mobile-first dashboard that helps a solo plumber decide which lead to

call first. It scores every lead from 0 to 100 and shows a "Call now"

list, a sales funnel, the best lead sources, and the money in the

pipeline. All data is mock data.



\## Features

- All leads list: 30 mock leads as cards (name, job, town, source and stage), in Hebrew, right to left. The list is closed at first and opens with a "Show all" button.
- Call now list: at the top of the page, the 5 best leads to call (stage New or Contacted), each with a large Call button that dials the phone.
- Three big numbers: the money in the pipeline (Contacted and Quote sent, plus the value of Won leads), the new leads from the last 24 hours, and the closing rate.
- Accessibility statement: a Hebrew page linked from the footer that says what was done for accessibility and what is still missing.
- Filters: the All leads list can be filtered by stage and by source, and it says how many leads are shown.
- Red alert: a New lead that has waited more than 3 hours for a reply shows a red alert with an icon and the words "waiting more than 3 hours".
- Sales funnel: one bar per stage with the number of leads, and the conversion percentage from New to Won.
- Best source: for each lead source, the number of leads, how many were won and the closing percentage, shown as bars with the best source first.
- Lead score: every lead gets a score from 0 to 100 with a level word (high, medium or low), the list is sorted by score, and tapping a card shows how the score was built.



\## Project files

- SPEC.md: what we are building and why.
- Practice.md: the rules we follow while building.
- README.md: this file, the project overview.
- index.html: the main dashboard page.
- accessibility.html: the accessibility statement page.
- style.css: the look of both pages.
- app.js: the dashboard logic (score, lists, charts, filters).
- data.js: the 30 mock leads.

\## Status

In development.

