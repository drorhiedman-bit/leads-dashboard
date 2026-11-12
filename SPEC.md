# SPEC: Smart Lead Dashboard for a Solo Plumber

## 1. Who

Primary user: a solo plumber, about 40 years old, in the Jezreel Valley.
He works alone, mostly outdoors and on job sites, and uses the dashboard
almost only on his phone, often with one free hand, dirty hands or gloves,
and in bright sunlight. He loses jobs by calling back too late or by
chasing the wrong leads, and many competitors operate in the same area.
He does not want to learn an app. He needs one screen that answers:
"Who do I call first?"
Design rules that follow from this user:

- Mobile first. Design for a 360 px wide phone screen, then scale up.
- One scrolling page. No popups, no tabs, no multi-step windows.
- Few numbers on screen, with the most important thing first.
- Large buttons: at least 48 x 48 px, with space between them.
- Body text at least 16 px. Urgent items in bold.

## 2. What / What not

WHAT: A dashboard that scores every incoming lead from 0 to 100, shows a
"Call now" list of the top 5 leads, the sales funnel, which lead source
pays off, and how much money is in the pipeline.
WHAT NOT: no user login, no sending of messages or emails, no real
database, no connection to a real system. All data is mock data.

## 3. Where

A static web page that opens in any browser, with no server.
Files: index.html, style.css, app.js, data.js (mock data only).
Plain HTML, CSS and JavaScript. No external libraries. Charts are built
with CSS only. Deployable to GitHub Pages.
UI language: Hebrew, right to left (lang="he", dir="rtl").
On a phone each lead is a card. On a wide screen the cards may be shown
as a table.

## 4. Data

30 mock leads in data.js. Each lead has: id, name, phone, town,
job type, urgency (1-5), estimated value in ILS, source, distance in km,
received time, stage.
Stages: New, Contacted, Quote sent, Won, Lost.
Sources: Referral, Repeat customer, Google, Facebook, Facebook group.
Job types with typical value: blocked drain 250-500, faucet 200-400,
leak repair 300-800, burst pipe 600-1500, water heater 1500-3500,
bathroom renovation 12000-30000.
The 30 leads are spread across all stages and all sources, and include
at least 3 emergencies and 3 New leads that waited over 3 hours.
Towns are in the Jezreel Valley area. Service area: up to 40 km from
Moshav HaYogev.

## 5. Lead score (0-100)

- Job value, up to 30: over 5000 = 30, 1500-5000 = 24, 600-1500 = 17,
  300-600 = 10, under 300 = 5.
- Urgency, up to 25: level 5 = 25, 4 = 20, 3 = 15, 2 = 10, 1 = 5.
  Urgency is the customer's problem and does not change over time.
- Waiting time, up to 20 (only for leads in stage New): up to 15 minutes
  = 20, 15-60 minutes = 15, 1-3 hours = 8, over 3 hours = 3.
  Waiting time is how long the lead has waited for a reply.
  The shorter the wait, the more points.
  Leads in other stages get 0 for this factor.
- Source, up to 15: repeat customer 15, referral 13, Google 9,
  Facebook group 7, Facebook 5.
- Distance, up to 10: up to 10 km = 10, 10-25 km = 7, 25-40 km = 3,
  over 40 km = 0.

Score levels, always shown with a word and not only a color:
70 and up = High, 40-69 = Medium, under 40 = Low.

## 6. Screen order (top to bottom, one page)

1. Call now: 5 cards, highest score first, only stages New or Contacted.
   Each card shows name, job, town, score with level word, and a large
   "Call" button that dials the phone (tel: link).
2. Three big numbers: money in pipeline, new leads today, closing rate.
3. Funnel chart: horizontal bars, one per stage, with the count on each.
4. Best source chart: one horizontal bar per source, length by closing
   percentage, with the number shown.
5. All leads: closed by default, opens with a "Show all" button.
   Each lead card shows name, job, town, source, stage and score.
   Sorted by score.

## 7. Features

MUST (version 1):

1. Lead score as defined in section 5, with the factor breakdown
   visible when a card is tapped.
2. Call now list (section 6, item 1).
3. Sales funnel with counts and conversion percentage from New to Won.
4. Best source: for each source, number of leads, number Won, closing %.
5. Money in pipeline: total estimated value of leads in Contacted and
   Quote sent, and the total value of Won leads.
6. All leads list as cards (section 6, item 5).

SHOULD:

7. Red alert on any New lead waiting more than 3 hours.
8. Filter the all-leads list by stage and by source.
9. Accessibility statement page (Hebrew), linked from the footer.

LATER (not in version 1):

10. Add or edit leads, saved in the browser.
11. Real WhatsApp or SMS buttons.
12. Map of the service area.
13. Connection to a real CRM or database.

## 8. Design and accessibility

Theme: sea and sand, a calm vacation feel.
Colors: page background sand #F6EBD3, cards #FFFDF8, text deep sea
#0B2A4A, buttons and headings sea blue #0A5C8F, highlight turquoise
#8FD3DC, borders sand #E9CF9A, urgent alert coral #B53A22 (alerts only).
Score levels: High = deep blue, Medium = sand, Low = blue-gray.
Accessibility, aiming for WCAG AA and the Israeli standard SI 5568:

- Contrast at least 4.5:1 for text, 3:1 for large text and controls.
- Never use color alone. Always add a word or an icon.
- Correct heading order, labels for buttons, keyboard navigation with a
  clearly visible focus outline.
- Respect the user's text-size settings. No fixed tiny text.
- Reduce animation for users who ask for it (prefers-reduced-motion).

## 9. Done means

1. Opening index.html shows 30 leads and no console errors.
2. The Call now list shows exactly 5 leads, all in stage New or
   Contacted, sorted by score, and each has a working Call button.
3. Funnel counts add up to 30.
4. Pipeline total equals the sum of values of Contacted and Quote sent
   leads, checked by hand against data.js.
5. On a 360 px wide screen there is no horizontal scrolling and all
   buttons are at least 48 px.
6. Text contrast passes a WCAG AA check, and each score has a word.
7. The page is live on GitHub Pages (bonus).
