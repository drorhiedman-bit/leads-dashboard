// Mock data only. All names and phone numbers are made up.
// Service area: up to 40 km from Moshav HaYogev.
// receivedMinutesAgo is measured from the moment the page is opened,
// so "waited over 3 hours" stays true whenever the page is loaded.
// Stages: New, Contacted, Quote sent, Won, Lost.
// Sources: Referral, Repeat customer, Google, Facebook, Facebook group.

const LEADS = Object.freeze([
  // ---- Stage: New (9) ----
  { id: 1, name: "מיכל אברהם", phone: "050-555-0101", town: "מגדל העמק", jobType: "burst pipe", urgency: 5, value: 1100, source: "Referral", distanceKm: 5, receivedMinutesAgo: 40, stage: "New" },
  { id: 2, name: "יוסי לוי", phone: "050-555-0102", town: "נהלל", jobType: "leak repair", urgency: 3, value: 520, source: "Repeat customer", distanceKm: 8, receivedMinutesAgo: 10, stage: "New" },
  { id: 3, name: "דנה מזרחי", phone: "050-555-0103", town: "עפולה", jobType: "water heater", urgency: 4, value: 2400, source: "Google", distanceKm: 16, receivedMinutesAgo: 95, stage: "New" },
  { id: 4, name: "רונית שמעוני", phone: "050-555-0104", town: "נוף הגליל", jobType: "burst pipe", urgency: 5, value: 1350, source: "Google", distanceKm: 11, receivedMinutesAgo: 250, stage: "New" },
  { id: 5, name: "אבי דהן", phone: "050-555-0105", town: "יקנעם עילית", jobType: "blocked drain", urgency: 2, value: 280, source: "Google", distanceKm: 12, receivedMinutesAgo: 200, stage: "New" },
  { id: 6, name: "שרית בן דוד", phone: "050-555-0106", town: "קריית טבעון", jobType: "faucet", urgency: 1, value: 220, source: "Facebook", distanceKm: 14, receivedMinutesAgo: 25, stage: "New" },
  { id: 7, name: "עומר פרץ", phone: "050-555-0107", town: "טבריה", jobType: "bathroom renovation", urgency: 1, value: 18500, source: "Facebook", distanceKm: 35, receivedMinutesAgo: 330, stage: "New" },
  { id: 8, name: "ליאת גולן", phone: "050-555-0108", town: "בית שאן", jobType: "leak repair", urgency: 4, value: 750, source: "Facebook group", distanceKm: 38, receivedMinutesAgo: 210, stage: "New" },
  { id: 9, name: "חיים אוחיון", phone: "050-555-0109", town: "כפר יהושע", jobType: "water heater", urgency: 5, value: 3200, source: "Facebook group", distanceKm: 9, receivedMinutesAgo: 8, stage: "New" },

  // ---- Stage: Contacted (6) ----
  { id: 10, name: "נועה ברק", phone: "050-555-0110", town: "בית שערים", jobType: "blocked drain", urgency: 3, value: 450, source: "Referral", distanceKm: 15, receivedMinutesAgo: 1500, stage: "Contacted" },
  { id: 11, name: "אלון מרום", phone: "050-555-0111", town: "גבת", jobType: "faucet", urgency: 2, value: 350, source: "Repeat customer", distanceKm: 6, receivedMinutesAgo: 900, stage: "Contacted" },
  { id: 12, name: "תמר חזן", phone: "050-555-0112", town: "מרחביה", jobType: "leak repair", urgency: 4, value: 680, source: "Google", distanceKm: 18, receivedMinutesAgo: 2000, stage: "Contacted" },
  { id: 13, name: "רועי אשכנזי", phone: "050-555-0113", town: "מגדל העמק", jobType: "water heater", urgency: 3, value: 1800, source: "Google", distanceKm: 4, receivedMinutesAgo: 700, stage: "Contacted" },
  { id: 14, name: "סיגל נחום", phone: "050-555-0114", town: "נצרת", jobType: "bathroom renovation", urgency: 2, value: 14000, source: "Facebook", distanceKm: 12, receivedMinutesAgo: 3000, stage: "Contacted" },
  { id: 15, name: "דוד שלום", phone: "050-555-0115", town: "עין חרוד", jobType: "burst pipe", urgency: 5, value: 900, source: "Facebook group", distanceKm: 27, receivedMinutesAgo: 1200, stage: "Contacted" },

  // ---- Stage: Quote sent (5) ----
  { id: 16, name: "אורית כץ", phone: "050-555-0116", town: "נהלל", jobType: "bathroom renovation", urgency: 2, value: 22000, source: "Referral", distanceKm: 8, receivedMinutesAgo: 5000, stage: "Quote sent" },
  { id: 17, name: "משה ביטון", phone: "050-555-0117", town: "יקנעם עילית", jobType: "water heater", urgency: 3, value: 2900, source: "Repeat customer", distanceKm: 13, receivedMinutesAgo: 4000, stage: "Quote sent" },
  { id: 18, name: "ענבל רוזן", phone: "050-555-0118", town: "עפולה", jobType: "burst pipe", urgency: 4, value: 1200, source: "Google", distanceKm: 17, receivedMinutesAgo: 2500, stage: "Quote sent" },
  { id: 19, name: "אסף לביא", phone: "050-555-0119", town: "טבריה", jobType: "bathroom renovation", urgency: 1, value: 12500, source: "Facebook", distanceKm: 37, receivedMinutesAgo: 6000, stage: "Quote sent" },
  { id: 20, name: "מירב סעדה", phone: "050-555-0120", town: "כפר ברוך", jobType: "leak repair", urgency: 2, value: 450, source: "Facebook group", distanceKm: 7, receivedMinutesAgo: 3500, stage: "Quote sent" },

  // ---- Stage: Won (7) ----
  { id: 21, name: "גיל שפירא", phone: "050-555-0121", town: "מגדל העמק", jobType: "bathroom renovation", urgency: 1, value: 28000, source: "Referral", distanceKm: 3, receivedMinutesAgo: 12000, stage: "Won" },
  { id: 22, name: "הדס אילן", phone: "050-555-0122", town: "נוף הגליל", jobType: "water heater", urgency: 3, value: 3100, source: "Referral", distanceKm: 11, receivedMinutesAgo: 9000, stage: "Won" },
  { id: 23, name: "ניר אלמוג", phone: "050-555-0123", town: "כפר יהושע", jobType: "faucet", urgency: 2, value: 280, source: "Repeat customer", distanceKm: 9, receivedMinutesAgo: 8000, stage: "Won" },
  { id: 24, name: "ציפי מזרחי", phone: "050-555-0124", town: "נהלל", jobType: "blocked drain", urgency: 4, value: 380, source: "Repeat customer", distanceKm: 8, receivedMinutesAgo: 7000, stage: "Won" },
  { id: 25, name: "בועז טל", phone: "050-555-0125", town: "עפולה", jobType: "leak repair", urgency: 3, value: 640, source: "Google", distanceKm: 16, receivedMinutesAgo: 10000, stage: "Won" },
  { id: 26, name: "יעל סגל", phone: "050-555-0126", town: "קריית טבעון", jobType: "burst pipe", urgency: 5, value: 1450, source: "Facebook", distanceKm: 14, receivedMinutesAgo: 9500, stage: "Won" },
  { id: 27, name: "אייל קורן", phone: "050-555-0127", town: "בית שאן", jobType: "faucet", urgency: 1, value: 240, source: "Facebook group", distanceKm: 36, receivedMinutesAgo: 11000, stage: "Won" },

  // ---- Stage: Lost (3) ----
  { id: 28, name: "שלומי עמר", phone: "050-555-0128", town: "טבריה", jobType: "water heater", urgency: 2, value: 1600, source: "Referral", distanceKm: 34, receivedMinutesAgo: 8000, stage: "Lost" },
  { id: 29, name: "רחל ישראלי", phone: "050-555-0129", town: "יקנעם עילית", jobType: "blocked drain", urgency: 1, value: 250, source: "Google", distanceKm: 12, receivedMinutesAgo: 15000, stage: "Lost" },
  { id: 30, name: "טל גבאי", phone: "050-555-0130", town: "עין חרוד", jobType: "leak repair", urgency: 2, value: 320, source: "Facebook", distanceKm: 28, receivedMinutesAgo: 13000, stage: "Lost" }
]);
