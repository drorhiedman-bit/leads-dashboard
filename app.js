// Smart Lead Dashboard. Plain script, no modules: works by double-click.
// The leads are read from Airtable in the browser, after the user types
// a Personal Access Token in the connection screen (SPEC.md section 4).
// The token is never written in a file of this project.
(function () {
  "use strict";

  const STAGE_LABELS = {
    "New": "חדש",
    "Contacted": "נוצר קשר",
    "Quote sent": "נשלחה הצעה",
    "Won": "נסגר",
    "Lost": "אבד"
  };

  const SOURCE_LABELS = {
    "Referral": "המלצה",
    "Repeat customer": "לקוח חוזר",
    "Google": "גוגל",
    "Facebook": "פייסבוק",
    "Facebook group": "קבוצת פייסבוק"
  };

  const JOB_LABELS = {
    "blocked drain": "סתימה",
    "faucet": "ברז",
    "leak repair": "תיקון נזילה",
    "burst pipe": "פיצוץ צינור",
    "water heater": "דוד מים",
    "bathroom renovation": "שיפוץ חדר אמבטיה"
  };

  // ---- Lead score (SPEC section 5). Boundaries: a value that sits on the
  // edge of two bands gets the higher band (for example 1500 = 24 points).
  const MAX_POINTS = { value: 30, urgency: 25, waiting: 20, source: 15, distance: 10 };
  const URGENCY_POINTS = { 5: 25, 4: 20, 3: 15, 2: 10, 1: 5 };
  const SOURCE_POINTS = {
    "Repeat customer": 15,
    "Referral": 13,
    "Google": 9,
    "Facebook group": 7,
    "Facebook": 5
  };
  const HIGH_SCORE_MIN = 70;
  const MEDIUM_SCORE_MIN = 40;
  const LEVEL_LABELS = { high: "גבוה", medium: "בינוני", low: "נמוך" };

  function label(labels, key) {
    return Object.prototype.hasOwnProperty.call(labels, key) ? labels[key] : key;
  }

  function valuePoints(value) {
    if (value > 5000) { return 30; }
    if (value >= 1500) { return 24; }
    if (value >= 600) { return 17; }
    if (value >= 300) { return 10; }
    return 5;
  }

  function waitingPoints(lead) {
    if (lead.stage !== "New") { return 0; }
    const minutes = lead.receivedMinutesAgo;
    if (minutes <= 15) { return 20; }
    if (minutes <= 60) { return 15; }
    if (minutes <= 180) { return 8; }
    return 3;
  }

  function distancePoints(km) {
    if (km <= 10) { return 10; }
    if (km <= 25) { return 7; }
    if (km <= 40) { return 3; }
    return 0;
  }

  function levelOf(total) {
    if (total >= HIGH_SCORE_MIN) { return "high"; }
    if (total >= MEDIUM_SCORE_MIN) { return "medium"; }
    return "low";
  }

  // ---- Formatting helpers
  const moneyFormat = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0
  });

  function formatMoney(amount) {
    return moneyFormat.format(amount);
  }

  // Hebrew plurals: one and two have their own words.
  function formatHours(hours) {
    if (hours === 1) { return "שעה"; }
    if (hours === 2) { return "שעתיים"; }
    return hours + " שעות";
  }

  function formatMinutes(minutes) {
    if (minutes === 1) { return "דקה"; }
    if (minutes === 2) { return "שתי דקות"; }
    return minutes + " דקות";
  }

  function formatWait(totalMinutes) {
    if (totalMinutes < 60) {
      return formatMinutes(totalMinutes);
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) {
      return formatHours(hours);
    }
    const joiner = minutes <= 2 ? " ו" : " ו-";
    return formatHours(hours) + joiner + formatMinutes(minutes);
  }

  function scoreLead(lead) {
    const factors = [
      {
        label: "שווי העבודה",
        detail: formatMoney(lead.value),
        points: valuePoints(lead.value),
        max: MAX_POINTS.value
      },
      {
        label: "דחיפות",
        detail: "רמה " + lead.urgency + " מתוך 5",
        points: URGENCY_POINTS[lead.urgency] || 0,
        max: MAX_POINTS.urgency
      },
      {
        label: "זמן המתנה",
        detail: lead.stage === "New"
          ? "ממתין " + formatWait(lead.receivedMinutesAgo)
          : "לא נספר (רק ללידים חדשים)",
        points: waitingPoints(lead),
        max: MAX_POINTS.waiting
      },
      {
        label: "מקור",
        detail: label(SOURCE_LABELS, lead.source),
        points: SOURCE_POINTS[lead.source] || 0,
        max: MAX_POINTS.source
      },
      {
        label: "מרחק",
        detail: lead.distanceKm + " ק״מ",
        points: distancePoints(lead.distanceKm),
        max: MAX_POINTS.distance
      }
    ];
    const total = factors.reduce(function (sum, factor) { return sum + factor.points; }, 0);
    return { total: total, level: levelOf(total), factors: factors };
  }

  // Each lead gets a score; the original lead objects are not changed.
  function scoreAll(leads) {
    return leads.map(function (lead) {
      return Object.assign({}, lead, { score: scoreLead(lead) });
    });
  }

  // Highest score first. Ties: bigger job first, then lower id.
  function sortedByScore(leads) {
    return leads.slice().sort(function (a, b) {
      return b.score.total - a.score.total || b.value - a.value || a.id - b.id;
    });
  }

  // ---- DOM helpers
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined) {
      node.textContent = text;
    }
    return node;
  }

  function buildScoreBadge(score) {
    return el(
      "span",
      "score-badge level-" + score.level,
      "ציון " + score.total + " · " + LEVEL_LABELS[score.level]
    );
  }

  function buildBreakdown(score, panelId) {
    const panel = el("ul", "breakdown");
    panel.id = panelId;
    panel.hidden = true;
    score.factors.forEach(function (factor) {
      const row = el("li", "breakdown-row");
      row.appendChild(el("span", "breakdown-name", factor.label));
      row.appendChild(el("span", "breakdown-detail", factor.detail));
      row.appendChild(el("span", "breakdown-points", factor.points + " מתוך " + factor.max));
      panel.appendChild(row);
    });
    const totalRow = el("li", "breakdown-row breakdown-total");
    totalRow.appendChild(el("span", "breakdown-name", "סך הכל"));
    totalRow.appendChild(el("span", "breakdown-detail", LEVEL_LABELS[score.level]));
    totalRow.appendChild(el("span", "breakdown-points", score.total + " מתוך 100"));
    panel.appendChild(totalRow);
    return panel;
  }

  // Tapping anywhere on the card (except a link) opens or closes the
  // score breakdown. Keyboard users use the button inside the card.
  function makeCardTappable(card, button, panel) {
    card.classList.add("tappable");
    card.addEventListener("click", function (event) {
      if (event.target.closest("a, .breakdown")) {
        return;
      }
      const isOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isOpen));
      panel.hidden = isOpen;
    });
  }

  function buildScoreToggle(score, panelId) {
    const button = el("button", "score-toggle");
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", panelId);
    button.appendChild(buildScoreBadge(score));
    // A real space keeps the words apart in the button's accessible name.
    button.appendChild(document.createTextNode(" "));
    button.appendChild(el("span", "score-toggle-hint", "פירוט הציון"));
    return button;
  }

  // The phone number as a tel: link: digits only, so it dials on a phone.
  function buildCallButton(lead) {
    const link = el("a", "call-button", "התקשר");
    link.href = "tel:" + lead.phone.replace(/[^0-9+]/g, "");
    link.setAttribute("aria-label", "התקשר ל" + lead.name);
    return link;
  }

  // Red alert: a New lead that has waited more than 3 hours for a reply.
  const ALERT_AFTER_MINUTES = 3 * 60;

  function needsAlert(lead) {
    return lead.stage === "New" && lead.receivedMinutesAgo > ALERT_AFTER_MINUTES;
  }

  // The alert always has an icon and words, never color alone.
  function buildAlert() {
    const alert = el("p", "lead-alert");
    const icon = el("span", "", "⚠");
    icon.setAttribute("aria-hidden", "true");
    alert.appendChild(icon);
    alert.appendChild(document.createTextNode(" ממתין יותר מ-3 שעות"));
    return alert;
  }

  // variant "call": name, job, town, score, Call button (Call now list).
  // variant "list": name, job, town, source, stage, score (All leads list).
  function buildLeadCard(lead, variant) {
    const item = el("li");
    const card = el("article", "lead-card");
    const panelId = "breakdown-" + variant + "-" + lead.id;

    card.appendChild(el("h3", "lead-name", lead.name));
    if (needsAlert(lead)) {
      card.classList.add("has-alert");
      card.appendChild(buildAlert());
    }
    card.appendChild(el("p", "lead-line", label(JOB_LABELS, lead.jobType) + " · " + lead.town));
    if (variant === "list") {
      card.appendChild(el("p", "lead-line", "מקור: " + label(SOURCE_LABELS, lead.source)));
      card.appendChild(el("p", "lead-stage", "שלב: " + label(STAGE_LABELS, lead.stage)));
    }

    const button = buildScoreToggle(lead.score, panelId);
    const panel = buildBreakdown(lead.score, panelId);
    card.appendChild(button);
    card.appendChild(panel);
    if (variant === "call") {
      card.appendChild(buildCallButton(lead));
    }
    makeCardTappable(card, button, panel);

    item.appendChild(card);
    return item;
  }

  function renderLeadList(listId, leads, variant) {
    const list = document.getElementById(listId);
    if (!list) {
      return;
    }
    const fragment = document.createDocumentFragment();
    leads.forEach(function (lead) {
      fragment.appendChild(buildLeadCard(lead, variant));
    });
    list.replaceChildren(fragment);
  }

  // ---- Call now: the top leads that still need a call (New or Contacted).
  const CALL_NOW_COUNT = 5;
  const CALLABLE_STAGES = ["New", "Contacted"];

  function callNowLeads(sortedLeads) {
    return sortedLeads
      .filter(function (lead) { return CALLABLE_STAGES.indexOf(lead.stage) !== -1; })
      .slice(0, CALL_NOW_COUNT);
  }

  // ---- "Show all" button: the full list is closed until it is pressed.
  function setUpShowAll() {
    const button = document.getElementById("show-all");
    const panel = document.getElementById("all-leads-panel");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      const willOpen = panel.hidden;
      panel.hidden = !willOpen;
      button.setAttribute("aria-expanded", String(willOpen));
      button.textContent = willOpen ? "הסתר את כל הלידים" : "הצג את כל הלידים";
    });
  }

  // ---- Statistics
  const STAGES = ["New", "Contacted", "Quote sent", "Won", "Lost"];

  function formatPercent(part, whole) {
    return whole === 0 ? "0%" : Math.round((part / whole) * 100) + "%";
  }

  function countByStage(leads) {
    return STAGES.map(function (stage) {
      return {
        stage: stage,
        count: leads.filter(function (lead) { return lead.stage === stage; }).length
      };
    });
  }

  // ---- Sales funnel: one horizontal bar per stage, built with CSS only.
  // Every lead starts as New, so conversion from New to Won is Won / all leads.
  function renderFunnel(leads) {
    const list = document.getElementById("funnel");
    const summary = document.getElementById("funnel-summary");
    if (!list || !summary) {
      return;
    }
    const rows = countByStage(leads);
    const biggest = Math.max.apply(null, rows.map(function (row) { return row.count; }));
    const fragment = document.createDocumentFragment();
    rows.forEach(function (row) {
      const item = el("li", "bar-row");
      item.appendChild(el("span", "bar-label", label(STAGE_LABELS, row.stage)));
      const track = el("div", "bar-track");
      const fill = el("div", "bar-fill");
      fill.style.width = (biggest === 0 ? 0 : (row.count / biggest) * 100) + "%";
      fill.appendChild(el("span", "bar-count", String(row.count)));
      track.appendChild(fill);
      item.appendChild(track);
      fragment.appendChild(item);
    });
    list.replaceChildren(fragment);

    const won = rows.filter(function (row) { return row.stage === "Won"; })[0].count;
    summary.textContent = "המרה מ״חדש״ ל״נסגר״: " + formatPercent(won, leads.length) +
      " (" + won + " מתוך " + leads.length + " לידים)";
  }

  // ---- Best source: for each source, leads, Won, and closing percentage
  // (Won / leads from that source). Best source first.
  const SOURCES = ["Referral", "Repeat customer", "Google", "Facebook", "Facebook group"];

  function sourceStats(leads) {
    return SOURCES.map(function (source) {
      const fromSource = leads.filter(function (lead) { return lead.source === source; });
      const won = fromSource.filter(function (lead) { return lead.stage === "Won"; }).length;
      const rate = fromSource.length === 0 ? 0 : won / fromSource.length;
      return { source: source, leads: fromSource.length, won: won, rate: rate };
    }).sort(function (a, b) {
      return b.rate - a.rate || b.leads - a.leads;
    });
  }

  function renderBestSource(leads) {
    const list = document.getElementById("sources");
    if (!list) {
      return;
    }
    const fragment = document.createDocumentFragment();
    sourceStats(leads).forEach(function (stat) {
      const item = el("li", "bar-row");
      item.appendChild(el("span", "bar-label", label(SOURCE_LABELS, stat.source)));

      const line = el("div", "bar-line");
      const track = el("div", "bar-track");
      const fill = el("div", "bar-fill bar-fill-plain");
      fill.style.width = Math.round(stat.rate * 100) + "%";
      track.appendChild(fill);
      line.appendChild(track);
      line.appendChild(el("span", "bar-value", formatPercent(stat.won, stat.leads)));
      item.appendChild(line);

      const wonText = stat.won === 1 ? "נסגר אחד" : stat.won + " נסגרו";
      item.appendChild(el("span", "bar-detail", stat.leads + " לידים · " + wonText));
      fragment.appendChild(item);
    });
    list.replaceChildren(fragment);
  }

  // ---- Three big numbers: money in pipeline, new leads today, closing rate.
  // Pipeline = value of leads in Contacted and Quote sent.
  // "Today" = received in the last 24 hours. Closing rate = Won / all leads.
  const PIPELINE_STAGES = ["Contacted", "Quote sent"];
  const MINUTES_PER_DAY = 24 * 60;

  function sumValues(leads) {
    return leads.reduce(function (sum, lead) { return sum + lead.value; }, 0);
  }

  function bigNumbers(leads) {
    const inPipeline = leads.filter(function (lead) {
      return PIPELINE_STAGES.indexOf(lead.stage) !== -1;
    });
    const won = leads.filter(function (lead) { return lead.stage === "Won"; });
    const today = leads.filter(function (lead) {
      return lead.receivedMinutesAgo < MINUTES_PER_DAY;
    });
    return [
      {
        label: "כסף בצנרת",
        value: formatMoney(sumValues(inPipeline)),
        note: "שווי הלידים בשלבים ״נוצר קשר״ ו״נשלחה הצעה״. נסגרו עד היום: " + formatMoney(sumValues(won))
      },
      {
        label: "לידים חדשים היום",
        value: String(today.length),
        note: "התקבלו ב-24 השעות האחרונות"
      },
      {
        label: "אחוז סגירה",
        value: formatPercent(won.length, leads.length),
        note: won.length + " מתוך " + leads.length + " לידים נסגרו"
      }
    ];
  }

  function renderBigNumbers(leads) {
    const list = document.getElementById("big-numbers");
    if (!list) {
      return;
    }
    const fragment = document.createDocumentFragment();
    bigNumbers(leads).forEach(function (stat) {
      const box = el("div", "big-number");
      box.appendChild(el("dt", "big-number-label", stat.label));
      box.appendChild(el("dd", "big-number-value", stat.value));
      box.appendChild(el("dd", "big-number-note", stat.note));
      fragment.appendChild(box);
    });
    list.replaceChildren(fragment);
  }

  // ---- Filters for the All leads list: by stage and by source.
  const ALL_VALUE = "";

  function fillFilter(select, labels, keys) {
    const options = [new Option("הכל", ALL_VALUE)].concat(
      keys.map(function (key) { return new Option(label(labels, key), key); })
    );
    select.replaceChildren.apply(select, options);
  }

  function matchesFilter(lead, stage, source) {
    return (stage === ALL_VALUE || lead.stage === stage) &&
      (source === ALL_VALUE || lead.source === source);
  }

  // The leads shown now, highest score first. Empty until connected.
  let shownLeads = [];

  function updateFilteredList() {
    const stageSelect = document.getElementById("filter-stage");
    const sourceSelect = document.getElementById("filter-source");
    const status = document.getElementById("filter-status");
    const shown = shownLeads.filter(function (lead) {
      return matchesFilter(lead, stageSelect.value, sourceSelect.value);
    });
    renderLeadList("all-leads", shown, "list");
    status.textContent = shown.length === 0
      ? "אין לידים שמתאימים לסינון"
      : "מוצגים " + shown.length + " מתוך " + shownLeads.length + " לידים";
  }

  function setUpFilters() {
    const stageSelect = document.getElementById("filter-stage");
    const sourceSelect = document.getElementById("filter-source");
    fillFilter(stageSelect, STAGE_LABELS, STAGES);
    fillFilter(sourceSelect, SOURCE_LABELS, SOURCES);
    stageSelect.addEventListener("change", updateFilteredList);
    sourceSelect.addEventListener("change", updateFilteredList);
  }

  // Draws the whole dashboard from the leads that were just read.
  function showDashboard(leads, fetchedAt) {
    const scored = scoreAll(leads);
    shownLeads = sortedByScore(scored);
    renderLeadList("call-now", callNowLeads(shownLeads), "call");
    renderBigNumbers(scored);
    renderFunnel(scored);
    renderBestSource(scored);
    updateFilteredList();
    renderDataSource(scored.length, fetchedAt);
    document.getElementById("dashboard").hidden = false;
  }

  // Removes every lead from the page, for example after "delete saved key".
  function hideDashboard() {
    shownLeads = [];
    document.getElementById("dashboard").hidden = true;
    ["call-now", "big-numbers", "funnel", "sources", "all-leads"].forEach(function (id) {
      document.getElementById(id).replaceChildren();
    });
    document.getElementById("data-source").textContent = "";
  }

  setUpFilters();
  setUpShowAll();

  // ---- Weather strip (SPEC section 4a). WEATHER comes from weather.js,
  // which scripts/fetch-weather.mjs generates from the Open-Meteo public API.
  const FROST_MAX_C = 2;
  const HEAVY_RAIN_MIN_MM = 15;

  // WMO weather codes, as Open-Meteo returns them.
  function weatherWord(code) {
    if (code === 0) { return { icon: "☀️", word: "בהיר" }; }
    if (code <= 2) { return { icon: "🌤️", word: "מעונן חלקית" }; }
    if (code === 3) { return { icon: "☁️", word: "מעונן" }; }
    if (code <= 48) { return { icon: "🌫️", word: "ערפל" }; }
    if (code <= 57) { return { icon: "🌦️", word: "טפטוף" }; }
    if (code <= 67) { return { icon: "🌧️", word: "גשם" }; }
    if (code <= 77) { return { icon: "🌨️", word: "שלג" }; }
    if (code <= 82) { return { icon: "🌧️", word: "ממטרים" }; }
    if (code <= 86) { return { icon: "🌨️", word: "שלג" }; }
    return { icon: "⛈️", word: "סופת רעמים" };
  }

  // The first rule that matches wins.
  function workHint(day) {
    if (day.minC <= FROST_MAX_C) {
      return { icon: "❄️", text: "כפור: צפויות קריאות על פיצוץ צינור", warning: true };
    }
    if (day.rainMm >= HEAVY_RAIN_MIN_MM) {
      return { icon: "⚠️", text: "גשם כבד: צפויות סתימות ונזילות", warning: true };
    }
    return { icon: "✓", text: "יום רגיל", warning: false };
  }

  function dayTitle(dateText) {
    // Noon, so the date does not slip a day in any time zone.
    return new Date(dateText + "T12:00:00").toLocaleDateString("he-IL", {
      weekday: "long",
      day: "numeric",
      month: "numeric"
    });
  }

  function iconText(parent, icon, text) {
    const mark = el("span", "", icon + " ");
    mark.setAttribute("aria-hidden", "true");
    parent.appendChild(mark);
    parent.appendChild(document.createTextNode(text));
  }

  function renderWeather() {
    const strip = document.getElementById("weather");
    const status = document.getElementById("weather-status");
    if (!strip || !status) {
      return;
    }
    const days = typeof WEATHER === "undefined" ? [] : WEATHER.days;
    if (!days || days.length === 0) {
      status.textContent = "התחזית לא זמינה כרגע";
      return;
    }
    const fragment = document.createDocumentFragment();
    days.forEach(function (day) {
      const card = el("li", "weather-day");
      card.appendChild(el("p", "weather-date", dayTitle(day.date)));
      const sky = weatherWord(day.code);
      iconText(card.appendChild(el("p", "weather-line")), sky.icon, sky.word);
      card.appendChild(el("p", "weather-line",
        Math.round(day.minC) + "° עד " + Math.round(day.maxC) + "°"));
      card.appendChild(el("p", "weather-line", "גשם: " + Math.round(day.rainMm) + " מ\"מ"));
      const hint = workHint(day);
      const hintLine = el("p", hint.warning ? "weather-hint is-warning" : "weather-hint");
      iconText(hintLine, hint.icon, hint.text);
      card.appendChild(hintLine);
      fragment.appendChild(card);
    });
    strip.appendChild(fragment);
    status.textContent = "תחזית למושב היוגב. מעלות צלזיוס, נמוך עד גבוה.";
  }
  renderWeather();

  // ---- Footer: where the leads came from and when they were read.
  function renderDataSource(count, fetchedAt) {
    const when = fetchedAt.toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
    document.getElementById("data-source").textContent =
      count + " לידים נקראו מ-Airtable. עדכון אחרון: " + when;
  }

  // ---- Connection to Airtable (SPEC section 4). The page asks for a
  // Personal Access Token, reads the table with it, and only then shows
  // the leads. The token lives in the page memory, and in this browser's
  // localStorage only when "remember" is ticked.
  const AIRTABLE_API = "https://api.airtable.com/v0/";
  const STORAGE_KEY = "leadsDashboard.airtable";
  const JOB_TYPES = Object.keys(JOB_LABELS);

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

  const FIELD_HELP = {
    "Lead ID": "מספר שלם, שונה לכל ליד",
    "Name": "שם הלקוח",
    "Phone": "טלפון",
    "Town": "יישוב",
    "Job type": JOB_TYPES.join(", "),
    "Urgency": "מספר שלם מ-1 עד 5",
    "Value": "שווי העבודה בשקלים, 0 ומעלה",
    "Source": SOURCES.join(", "),
    "Distance km": "מרחק בק״מ, 0 ומעלה",
    "Received minutes ago": "לפני כמה דקות התקבל, 0 ומעלה",
    "Stage": STAGES.join(", ")
  };

  function isNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function isAmount(value) {
    return isNumber(value) && value >= 0;
  }

  // Returns the reason a record breaks the data rules in SPEC.md
  // section 4, or null when it is fine.
  function problemWith(fields) {
    for (const name of Object.keys(FIELDS)) {
      if (fields[name] === undefined || fields[name] === null || fields[name] === "") {
        return "חסר השדה " + name;
      }
    }
    if (!Number.isInteger(fields["Lead ID"])) { return "Lead ID אינו מספר שלם"; }
    const urgency = fields["Urgency"];
    if (!Number.isInteger(urgency) || urgency < 1 || urgency > 5) {
      return "Urgency אינו מספר שלם מ-1 עד 5";
    }
    if (!isAmount(fields["Value"])) { return "Value אינו מספר, 0 ומעלה"; }
    if (!isAmount(fields["Distance km"])) { return "Distance km אינו מספר, 0 ומעלה"; }
    if (!isAmount(fields["Received minutes ago"])) {
      return "Received minutes ago אינו מספר, 0 ומעלה";
    }
    if (STAGES.indexOf(fields["Stage"]) === -1) { return "Stage לא מוכר: " + fields["Stage"]; }
    if (SOURCES.indexOf(fields["Source"]) === -1) { return "Source לא מוכר: " + fields["Source"]; }
    if (JOB_TYPES.indexOf(fields["Job type"]) === -1) {
      return "Job type לא מוכר: " + fields["Job type"];
    }
    return null;
  }

  // Turns Airtable records into dashboard leads. A record that breaks a
  // rule is not shown as a lead: it goes to rejected, with the reason.
  function toLeads(records) {
    const leads = [];
    const rejected = [];
    const seenIds = new Set();
    records.forEach(function (record) {
      const fields = record.fields || {};
      let problem = problemWith(fields);
      if (!problem && seenIds.has(fields["Lead ID"])) {
        problem = "Lead ID כפול: " + fields["Lead ID"];
      }
      if (problem) {
        rejected.push({ name: String(fields["Name"] || record.id), problem: problem });
        return;
      }
      seenIds.add(fields["Lead ID"]);
      const lead = {};
      Object.keys(FIELDS).forEach(function (name) { lead[FIELDS[name]] = fields[name]; });
      ["name", "phone", "town"].forEach(function (key) { lead[key] = String(lead[key]); });
      leads.push(lead);
    });
    return { leads: leads, rejected: rejected };
  }

  // An error whose message is ready to be shown to the user, in Hebrew.
  function userError(message) {
    const error = new Error(message);
    error.forUser = true;
    return error;
  }

  function airtableError(status) {
    if (status === 401) {
      return userError("Airtable לא מזהה את המפתח. בדקו שהעתקתם את כל המפתח ושהוא עדיין בתוקף.");
    }
    if (status === 403 || status === 404) {
      return userError("למפתח אין גישה לטבלה הזו, או שה-Base ID או ה-Table ID שגויים. " +
        "בדקו שלמפתח יש הרשאת data.records:read על הבסיס הזה.");
    }
    if (status === 429) {
      return userError("יותר מדי בקשות ל-Airtable. המתינו חצי דקה ונסו שוב.");
    }
    return userError("Airtable החזיר שגיאה (" + status + "). נסו שוב בעוד רגע.");
  }

  // Airtable returns up to 100 records per request, with an offset for more.
  // The token travels only in the Authorization header, never in the address.
  async function fetchAllRecords(settings) {
    const records = [];
    let offset = "";
    do {
      const url = AIRTABLE_API + encodeURIComponent(settings.baseId) + "/" +
        encodeURIComponent(settings.tableId) + "?pageSize=100" +
        (offset ? "&offset=" + encodeURIComponent(offset) : "");
      let response;
      try {
        response = await fetch(url, { headers: { Authorization: "Bearer " + settings.token } });
      } catch (error) {
        throw userError("אין חיבור ל-Airtable. בדקו את האינטרנט ונסו שוב.");
      }
      if (!response.ok) {
        throw airtableError(response.status);
      }
      const page = await response.json();
      records.push.apply(records, page.records || []);
      offset = page.offset || "";
    } while (offset);
    return records;
  }

  // localStorage can be blocked (private mode), so every use is guarded.
  function readSaved() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function writeSaved(saved) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (error) {
      // Nothing to do: the page still works, it just will not remember.
    }
  }

  function setUpConnection() {
    const form = document.getElementById("connect-form");
    const details = document.getElementById("connect-details");
    const tokenInput = document.getElementById("airtable-token");
    const baseInput = document.getElementById("airtable-base");
    const tableInput = document.getElementById("airtable-table");
    const remember = document.getElementById("remember-token");
    const connectButton = document.getElementById("connect-button");
    const forgetButton = document.getElementById("forget-token");
    const status = document.getElementById("connect-status");
    const problems = document.getElementById("connect-problems");
    const problemsTitle = document.getElementById("connect-problems-title");
    const problemsList = document.getElementById("connect-problems-list");

    const help = document.getElementById("expected-fields");
    Object.keys(FIELD_HELP).forEach(function (name) {
      const item = el("li");
      const code = el("strong", "", name);
      code.dir = "ltr";
      item.appendChild(code);
      item.appendChild(document.createTextNode(": " + FIELD_HELP[name]));
      help.appendChild(item);
    });

    function say(message, isError) {
      status.textContent = message;
      status.classList.toggle("connect-status-error", Boolean(isError));
    }

    function showProblems(rejected) {
      problems.hidden = rejected.length === 0;
      if (rejected.length === 0) {
        return;
      }
      problemsTitle.textContent = "⚠ " + rejected.length + " שורות לא הוצגו כי הן לא לפי הכללים";
      const fragment = document.createDocumentFragment();
      rejected.forEach(function (item) {
        fragment.appendChild(el("li", "", item.name + ": " + item.problem));
      });
      problemsList.replaceChildren(fragment);
    }

    function fail(message) {
      hideDashboard();
      details.open = true;
      say(message, true);
    }

    async function connect() {
      const settings = {
        token: tokenInput.value.trim(),
        baseId: baseInput.value.trim(),
        tableId: tableInput.value.trim()
      };
      showProblems([]);
      if (!settings.token || !settings.baseId || !settings.tableId) {
        fail("צריך למלא את שלושת השדות: מפתח API, Base ID ו-Table ID.");
        return;
      }
      connectButton.disabled = true;
      say("מתחבר ל-Airtable...");
      try {
        const records = await fetchAllRecords(settings);
        const result = toLeads(records);
        showProblems(result.rejected);
        if (result.leads.length === 0) {
          fail(records.length === 0
            ? "ההתחברות הצליחה, אבל הטבלה ריקה."
            : "ההתחברות הצליחה, אבל אף שורה בטבלה לא לפי הכללים. ראו את הפירוט למטה.");
          return;
        }
        // Base and table ids are not secrets, so they are always remembered.
        // The token is remembered only when the box is ticked.
        const saved = { baseId: settings.baseId, tableId: settings.tableId };
        if (remember.checked) {
          saved.token = settings.token;
        }
        writeSaved(saved);
        showDashboard(result.leads, new Date());
        details.open = false;
        say("מחובר ל-Airtable. " + result.leads.length + " לידים מוצגים.");
      } catch (error) {
        fail(error.forUser ? error.message : "משהו השתבש בקריאת הנתונים. נסו שוב.");
      } finally {
        connectButton.disabled = false;
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      connect();
    });

    // Deletes the token from the browser and from the page, and hides the leads.
    forgetButton.addEventListener("click", function () {
      const saved = readSaved();
      delete saved.token;
      writeSaved(saved);
      tokenInput.value = "";
      remember.checked = false;
      showProblems([]);
      hideDashboard();
      details.open = true;
      say("המפתח נמחק מהדפדפן והלוח נותק. כדי לראות שוב את הלידים, הזינו מפתח.");
    });

    const saved = readSaved();
    baseInput.value = saved.baseId || "";
    tableInput.value = saved.tableId || "";
    if (saved.token) {
      tokenInput.value = saved.token;
      remember.checked = true;
      connect();
    }
  }
  setUpConnection();
})();
