// Renders the All leads list. Plain script, no modules: works by double-click.
// Depends on LEADS from data.js, which must be loaded first.
(function () {
  "use strict";

  var STAGE_LABELS = {
    "New": "חדש",
    "Contacted": "נוצר קשר",
    "Quote sent": "נשלחה הצעה",
    "Won": "נסגר",
    "Lost": "אבד"
  };

  var SOURCE_LABELS = {
    "Referral": "המלצה",
    "Repeat customer": "לקוח חוזר",
    "Google": "גוגל",
    "Facebook": "פייסבוק",
    "Facebook group": "קבוצת פייסבוק"
  };

  var JOB_LABELS = {
    "blocked drain": "סתימה",
    "faucet": "ברז",
    "leak repair": "תיקון נזילה",
    "burst pipe": "פיצוץ צינור",
    "water heater": "דוד מים",
    "bathroom renovation": "שיפוץ חדר אמבטיה"
  };

  function label(labels, key) {
    return Object.prototype.hasOwnProperty.call(labels, key) ? labels[key] : key;
  }

  // Newest lead first. Sorting by score comes in a later feature.
  function sortedByNewest(leads) {
    return leads.slice().sort(function (a, b) {
      return a.receivedMinutesAgo - b.receivedMinutesAgo || a.id - b.id;
    });
  }

  function textElement(tag, className, text) {
    var el = document.createElement(tag);
    el.className = className;
    el.textContent = text;
    return el;
  }

  function buildCard(lead) {
    var item = document.createElement("li");
    var card = document.createElement("article");
    card.className = "lead-card";

    card.appendChild(textElement("h3", "lead-name", lead.name));
    card.appendChild(textElement("p", "lead-line", label(JOB_LABELS, lead.jobType) + " · " + lead.town));
    card.appendChild(textElement("p", "lead-line", "מקור: " + label(SOURCE_LABELS, lead.source)));
    card.appendChild(textElement("p", "lead-stage", "שלב: " + label(STAGE_LABELS, lead.stage)));

    item.appendChild(card);
    return item;
  }

  function renderAllLeads(leads) {
    var list = document.getElementById("all-leads");
    if (!list) {
      return;
    }
    var fragment = document.createDocumentFragment();
    sortedByNewest(leads).forEach(function (lead) {
      fragment.appendChild(buildCard(lead));
    });
    list.appendChild(fragment);
  }

  renderAllLeads(LEADS);
})();
