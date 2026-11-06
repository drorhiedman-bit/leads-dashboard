// Smart Lead Dashboard. Plain script, no modules: works by double-click.
// Needs LEADS from data.js, which must be loaded first.
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

  function formatWait(totalMinutes) {
    if (totalMinutes < 60) {
      return totalMinutes + " דקות";
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes === 0 ? hours + " שעות" : hours + " שעות ו-" + minutes + " דקות";
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

  // Each lead gets a score; the original LEADS objects are not changed.
  const SCORED_LEADS = LEADS.map(function (lead) {
    return Object.assign({}, lead, { score: scoreLead(lead) });
  });

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
      if (event.target.closest("a")) {
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

  // variant "call": name, job, town, score, Call button (Call now list).
  // variant "list": name, job, town, source, stage, score (All leads list).
  function buildLeadCard(lead, variant) {
    const item = el("li");
    const card = el("article", "lead-card");
    const panelId = "breakdown-" + variant + "-" + lead.id;

    card.appendChild(el("h3", "lead-name", lead.name));
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
    list.appendChild(fragment);
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
    list.appendChild(fragment);

    const won = rows.filter(function (row) { return row.stage === "Won"; })[0].count;
    summary.textContent = "המרה מ״חדש״ ל״נסגר״: " + formatPercent(won, leads.length) +
      " (" + won + " מתוך " + leads.length + " לידים)";
  }

  const SORTED_LEADS = sortedByScore(SCORED_LEADS);
  renderLeadList("call-now", callNowLeads(SORTED_LEADS), "call");
  renderFunnel(SCORED_LEADS);
  renderLeadList("all-leads", SORTED_LEADS, "list");
  setUpShowAll();
})();
