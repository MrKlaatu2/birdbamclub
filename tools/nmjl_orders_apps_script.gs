/**
 * Bird Bam — 2027 NMJL card orders (collector program)
 *
 * Paste this whole file into a NEW Google Sheet: Extensions > Apps Script.
 * 1. Fill in SETTINGS below (Venmo handle).
 * 2. Run setup() once (choose "setup" in the function menu, click Run, allow access).
 * 3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 *    Copy the Web app URL into ENDPOINT at the top of nmjl/index.html.
 *
 * Tabs it builds:
 *   Orders      one row per order: who paid, how much, Paid checkbox (you tick it when Venmo/cash arrives)
 *   Recipients  one row per person getting cards (their mailing address); Paid copies from Orders
 *   Manifest    the 12 NMJL portal columns, only PAID people not yet sent to NMJL
 *
 * Sheet menu "NMJL Cards":
 *   Save manifest CSV to Drive   makes the upload file for the NMJL portal
 *   Mark manifest as sent to NMJL   stamps today's date so those people drop off the Manifest
 *
 * Online orders (birdbamclub.com/nmjl) are Venmo only: placing the order opens Venmo with the amount filled in.
 * Venmo payments are matched automatically: the script reads Venmo's "paid you" emails in this Google account's
 * Gmail every 15 minutes, finds the order number in the note, and ticks Paid when the amount is right.
 * (If Jordana's Venmo emails go to a different inbox, add a Gmail filter there that forwards
 *  emails from venmo@venmo.com to the account that owns this sheet.)
 * Unpaid online orders get a reminder email after reminderHours and are cancelled after cancelDays.
 * You can always tick Paid by hand; Status updates to Paid.
 * Desk orders (birdbamclub.com/nmjl/?desk + deskPin) are cash or credit card, recorded as already paid.
 */

const SETTINGS = {
  priceSP: 16.00,                 // Standard card (NMJL item 9001)
  priceLP: 18.00,                 // Large print card (NMJL item 9002)
  venmoHandle: "",                // Jordana's Venmo handle (no @). Online ordering stays closed until set.
  deskPin: "",                    // PIN staff type on the desk page (birdbamclub.com/nmjl/?desk). Desk entry is off until set.
  cardFeePct: 3,                  // fee added to in-person credit card orders, in percent
  reminderHours: 24,              // email a Venmo reminder to unpaid online orders after this many hours
  cancelDays: 3,                  // cancel unpaid online orders after this many days
  notifyEmail: "info@birdbamclub.com",
  country: "USA",                 // value written to the Country column
  clubName: "Bird Bam Mahjong Club",
  collector: "Jordana Signer",     // NMJL collector whose personal Venmo receives payments
  charity: "Milken Community School",
  maxCardsPerOrder: 40
};

const ORDERS_HEAD = ["Order ID","Ordered","First","Last","Email","Phone","Standard (SP)","Large (LP)","Cards","Amount Due","Pay Method","Paid","Amount Received","Paid Date","Payment Note","Notes","Status"];
const RECIP_HEAD  = ["Order ID","MemberID","First_Name","Last_Name","Email","Address1","Address2","City","State","Zip","Country","SP","LP","Paid","Sent to NMJL"];
const MANIFEST_HEAD = ["MemberID","First_Name","Last_Name","Email","Address1","Address2","City","State","Zip","Country","SP","LP"];
const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR VI GU AS MP AA AE AP".split(" ");

/* ---------- one-time setup ---------- */
function setup() {
  const ss = SpreadsheetApp.getActive();
  const orders = sheet_(ss, "Orders"), recip = sheet_(ss, "Recipients"), man = sheet_(ss, "Manifest");

  orders.getRange(1, 1, 1, ORDERS_HEAD.length).setValues([ORDERS_HEAD]);
  recip.getRange(1, 1, 1, RECIP_HEAD.length).setValues([RECIP_HEAD]);
  [orders, recip].forEach(s => {
    s.setFrozenRows(1);
    s.getRange(1, 1, 1, s.getLastColumn()).setFontWeight("bold").setBackground("#EFEADB");
  });
  orders.getRange("B2:B").setNumberFormat("m/d/yyyy h:mm am/pm");
  orders.getRange("J2:J").setNumberFormat("$0.00");
  orders.getRange("M2:M").setNumberFormat("$0.00");
  orders.getRange("N2:N").setNumberFormat("m/d/yyyy");
  orders.getRange("L2:L1000").insertCheckboxes();
  recip.getRange("B2:B").setNumberFormat("@");   // keep member numbers as text
  recip.getRange("J2:J").setNumberFormat("@");   // keep ZIP leading zeros
  recip.getRange("O2:O").setNumberFormat("m/d/yyyy");

  // Highlight paid orders green
  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied("=$L2=TRUE").setBackground("#EEF3E2")
    .setRanges([orders.getRange("A2:Q1000")]).build();
  orders.setConditionalFormatRules([rule]);

  // Manifest: paid people not yet sent to NMJL, in the portal's column order
  man.clear();
  man.getRange(1, 1, 1, MANIFEST_HEAD.length).setValues([MANIFEST_HEAD]).setFontWeight("bold").setBackground("#EFEADB");
  man.getRange("A2").setFormula('=IFERROR(FILTER(Recipients!B2:M, Recipients!N2:N=TRUE, Recipients!O2:O=""), "")');
  man.getRange("A2:A").setNumberFormat("@");
  man.getRange("I2:I").setNumberFormat("@");
  man.setFrozenRows(1);

  // Totals summary to the right of the orders
  orders.getRange("R1:S1").setValues([["Summary", ""]]).setFontWeight("bold");
  orders.getRange("R2:S7").setValues([
    ["Orders", '=COUNTA(A2:A)'],
    ["Cards ordered", '=SUM(I2:I)'],
    ["Cards paid", '=SUMIF(L2:L,TRUE,I2:I)'],
    ["Amount due (all)", '=SUM(J2:J)'],
    ["Amount received", '=SUM(M2:M)'],
    ["Still owed", '=SUMIF(L2:L,FALSE,J2:J)']
  ]);
  orders.getRange("S5:S7").setNumberFormat("$0.00");

  const blank = ss.getSheetByName("Sheet1");
  if (blank && ss.getSheets().length > 1 && blank.getLastRow() === 0) ss.deleteSheet(blank);
  // Automatic jobs: Venmo email matching every 15 minutes, reminders/cancellations hourly
  ScriptApp.getProjectTriggers().forEach(t => {
    if (["checkVenmoPayments", "followUpUnpaid"].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("checkVenmoPayments").timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger("followUpUnpaid").timeBased().everyHours(1).create();
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === "onEditInstalled") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("onEditInstalled").forSpreadsheet(ss).onEdit().create();

  SpreadsheetApp.getUi().alert("Setup done. Now Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).");
}

function sheet_(ss, name) { return ss.getSheetByName(name) || ss.insertSheet(name); }

/* ---------- menu ---------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("NMJL Cards")
    .addItem("Save manifest CSV to Drive", "saveManifestCsv")
    .addItem("Mark manifest as sent to NMJL", "markManifestSent")
    .addItem("Check Venmo payments now", "checkVenmoPayments")
    .addSeparator()
    .addItem("Run setup again", "setup")
    .addToUi();
}

function pendingRecipients_() {
  const s = SpreadsheetApp.getActive().getSheetByName("Recipients");
  const n = s.getLastRow() - 1;
  if (n < 1) return [];
  return s.getRange(2, 1, n, RECIP_HEAD.length).getValues()
    .map((r, i) => ({ row: i + 2, r }))
    .filter(x => x.r[0] && x.r[13] === true && !x.r[14]);
}

function csvCell_(v) {
  v = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

function saveManifestCsv() {
  const ui = SpreadsheetApp.getUi();
  const rows = pendingRecipients_().map(x => x.r.slice(1, 13));
  if (!rows.length) { ui.alert("Nothing to send: no paid people waiting for NMJL."); return; }
  const csv = [MANIFEST_HEAD].concat(rows).map(r => r.map(csvCell_).join(",")).join("\r\n");
  const name = "NMJL-manifest-" + Utilities.formatDate(new Date(), "America/Los_Angeles", "yyyy-MM-dd-HHmm") + ".csv";
  const file = DriveApp.createFile(name, csv, MimeType.CSV);
  const cards = rows.reduce((t, r) => t + Number(r[10] || 0) + Number(r[11] || 0), 0);
  const html = HtmlService.createHtmlOutput(
    '<p style="font-family:sans-serif">' + rows.length + ' people, ' + cards + ' cards.</p>' +
    '<p style="font-family:sans-serif"><a href="https://drive.google.com/uc?export=download&id=' + file.getId() + '" target="_blank">Download ' + name + '</a></p>' +
    '<p style="font-family:sans-serif;font-size:13px;color:#555">Upload it in the NMJL collector portal, then use NMJL Cards &gt; Mark manifest as sent to NMJL.</p>'
  ).setWidth(420).setHeight(170);
  ui.showModalDialog(html, "Manifest ready");
}

function markManifestSent() {
  const ui = SpreadsheetApp.getUi();
  const pend = pendingRecipients_();
  if (!pend.length) { ui.alert("Nothing to mark: no paid people waiting for NMJL."); return; }
  const ok = ui.alert("Mark " + pend.length + " people as sent to NMJL today?", ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return;
  const s = SpreadsheetApp.getActive().getSheetByName("Recipients");
  const today = new Date();
  pend.forEach(x => s.getRange(x.row, 15).setValue(today));
}

/* ---------- web form endpoint ---------- */
function doGet() {
  return json_({ ok: true, priceSP: SETTINGS.priceSP, priceLP: SETTINGS.priceLP });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const p = (e && e.parameter) || {};
    const order = parseOrder_(p);
    save_(order);
    try { sendEmails_(order); } catch (mailErr) { console.error(mailErr); }
    return json_({ ok: true, orderId: order.id, total: order.total, fee: order.fee, cards: order.cards, paid: order.paid });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  v = String(v === undefined || v === null ? "" : v).replace(/[\r\n\t]+/g, " ").trim().slice(0, max || 100);
  return /^[=+@-]/.test(v) ? "'" + v : v;   // never let a value become a formula
}

function parseOrder_(p) {
  if (p.website) throw new Error("Spam check failed.");   // hidden honeypot field
  const id = /^BB-[A-Z0-9]{5}$/.test(p.orderId || "") ? p.orderId
    : "BB-" + Utilities.getUuid().replace(/-/g, "").slice(0, 5).toUpperCase();
  const payer = {
    first: clean_(p.first, 40), last: clean_(p.last, 40),
    email: clean_(p.email, 120).toLowerCase(), phone: clean_(p.phone, 30)
  };
  const desk = !!SETTINGS.deskPin && p.deskPin === SETTINGS.deskPin;
  if (p.deskPin && !desk) throw new Error("Wrong desk PIN.");
  if (!desk && !SETTINGS.venmoHandle) throw new Error("Online ordering isn't open yet. Please check back soon.");
  if (!payer.first || !payer.last) throw new Error("Please enter your name.");
  if ((payer.email || !desk) && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payer.email)) throw new Error("Please enter a valid email.");
  const venmoUser = clean_(p.venmoUser, 40).replace(/^'?@/, "");
  if (!desk && !venmoUser) throw new Error("Please enter your Venmo username so we can match your payment.");

  let list;
  try { list = JSON.parse(p.recipients || "[]"); } catch (x) { throw new Error("Order data was garbled. Please try again."); }
  if (!Array.isArray(list) || !list.length) throw new Error("Please add at least one person.");
  if (list.length > 25) throw new Error("Too many people on one order. Please split it up.");

  const recips = list.map((r, i) => {
    const o = {
      memberId: clean_(r.memberId, 20).replace(/[^0-9A-Za-z]/g, ""),
      first: clean_(r.first, 40), last: clean_(r.last, 40),
      email: clean_(r.email, 120).toLowerCase(),
      address1: clean_(r.address1, 80), address2: clean_(r.address2, 80),
      city: clean_(r.city, 50), state: clean_(r.state, 2).toUpperCase(),
      zip: clean_(r.zip, 10),
      sp: Math.max(0, Math.min(20, parseInt(r.sp, 10) || 0)),
      lp: Math.max(0, Math.min(20, parseInt(r.lp, 10) || 0))
    };
    const who = "Person " + (i + 1);
    if (!o.first || !o.last) throw new Error(who + ": name is missing.");
    if (!o.address1 || !o.city) throw new Error(who + ": address is missing.");
    if (STATES.indexOf(o.state) < 0) throw new Error(who + ": choose a state.");
    if (!/^\d{5}(-\d{4})?$/.test(o.zip)) throw new Error(who + ": ZIP code should be 5 digits.");
    if (o.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)) throw new Error(who + ": email looks wrong.");
    if (o.sp + o.lp < 1) throw new Error(who + ": choose at least one card.");
    return o;
  });

  const sp = recips.reduce((t, r) => t + r.sp, 0), lp = recips.reduce((t, r) => t + r.lp, 0);
  if (sp + lp > SETTINGS.maxCardsPerOrder) throw new Error("That's a lot of cards! Please call the club for orders over " + SETTINGS.maxCardsPerOrder + ".");
  const subtotal = Math.round((sp * SETTINGS.priceSP + lp * SETTINGS.priceLP) * 100) / 100;
  let method = "Venmo", fee = 0, paid = false, payNote = "Venmo @" + venmoUser;
  if (desk) {
    method = p.payMethod === "card" ? "Card at club" : "Cash at club";
    if (method === "Card at club") fee = Math.round(subtotal * SETTINGS.cardFeePct) / 100;
    paid = true;
    payNote = "Desk" + (fee ? ", includes $" + fee.toFixed(2) + " card fee" : "") + (p.staff ? " (" + clean_(p.staff, 30) + ")" : "");
  }
  const total = Math.round((subtotal + fee) * 100) / 100;

  return { id, payer, recips, sp, lp, cards: sp + lp, subtotal, fee, total, method, paid, payNote, notes: clean_(p.notes, 300) };
}

function save_(o) {
  const ss = SpreadsheetApp.getActive();
  const orders = ss.getSheetByName("Orders"), recip = ss.getSheetByName("Recipients");
  if (!orders || !recip) throw new Error("The order sheet isn't set up yet.");

  // Same order submitted twice (double click / retry)? Don't duplicate it.
  const ids = orders.getLastRow() > 1 ? orders.getRange(2, 1, orders.getLastRow() - 1, 1).getValues().flat() : [];
  if (ids.indexOf(o.id) >= 0) return;

  const or = orders.getLastRow() + 1;
  orders.getRange(or, 1, 1, ORDERS_HEAD.length).setValues([[
    o.id, new Date(), o.payer.first, o.payer.last, o.payer.email, o.payer.phone,
    o.sp, o.lp, o.cards, o.total, o.method, o.paid, o.paid ? o.total : "", o.paid ? new Date() : "", o.payNote, o.notes, o.paid ? "Paid" : "Awaiting payment"
  ]]);
  orders.getRange(or, 12).insertCheckboxes().setValue(o.paid);

  const start = recip.getLastRow() + 1;
  const rows = o.recips.map(r => [
    o.id, r.memberId, r.first, r.last, r.email, r.address1, r.address2, r.city, r.state, r.zip,
    SETTINGS.country, r.sp, r.lp, "", ""
  ]);
  recip.getRange(start, 2, rows.length, 1).setNumberFormat("@");
  recip.getRange(start, 10, rows.length, 1).setNumberFormat("@");
  recip.getRange(start, 1, rows.length, RECIP_HEAD.length).setValues(rows);
  recip.getRange(start, 14, rows.length, 1).setFormulas(rows.map((_, i) =>
    ['=IFERROR(VLOOKUP($A' + (start + i) + ',Orders!$A:$L,12,FALSE),FALSE)']));
}

function venmoLink_(o) {
  return "https://venmo.com/" + encodeURIComponent(SETTINGS.venmoHandle) + "?txn=pay&amount=" + o.total.toFixed(2) +
    "&note=" + encodeURIComponent("NMJL 2027 cards " + o.id);
}

function sendEmails_(o) {
  const money = n => "$" + n.toFixed(2);
  const lines = o.recips.map(r => "• " + r.first + " " + r.last + ": " +
    [r.sp ? r.sp + " standard" : "", r.lp ? r.lp + " large print" : ""].filter(String).join(", ") +
    " → " + r.address1 + (r.address2 ? ", " + r.address2 : "") + ", " + r.city + ", " + r.state + " " + r.zip).join("\n");
  const pay = o.paid
    ? "Paid " + money(o.total) + " at the club (" + (o.method === "Card at club" ? "credit card, includes " + money(o.fee) + " processing fee" : "cash") + "). Thank you!"
    : "If you haven't finished paying yet, please send " + money(o.total) + " by Venmo to " + SETTINGS.collector + " (@" + SETTINGS.venmoHandle + "), our NMJL collector, as a regular friends payment, and keep " + o.id + " in the note:\n" + venmoLink_(o) +
      "\nOrders not paid within 3 days are cancelled.";

  if (o.payer.email) MailApp.sendEmail({
    to: o.payer.email,
    replyTo: SETTINGS.notifyEmail,
    name: SETTINGS.clubName,
    subject: "Your 2027 NMJL card order " + o.id,
    body: "Hi " + o.payer.first + ",\n\nThanks for ordering your 2027 National Mah Jongg League cards through " + SETTINGS.clubName +
      ". " + SETTINGS.collector + ", our NMJL collector, sends the orders to the League. We take orders at cost, and a donation is made to " + SETTINGS.charity + " for every card.\n\nOrder " + o.id + "\n" + lines + "\n\nTotal: " + money(o.total) + "\n\n" + pay +
      "\n\nPaid orders go to the League, and the League mails the cards to each address when the 2027 card is released.\n\nQuestions? Just reply to this email.\n\n" + SETTINGS.clubName
  });
  if (SETTINGS.notifyEmail) {
    MailApp.sendEmail(SETTINGS.notifyEmail, "NMJL order " + o.id + ": " + o.cards + " cards, " + money(o.total) + " (" + o.method + ")",
      o.payer.first + " " + o.payer.last + " <" + o.payer.email + "> " + o.payer.phone + "\n\n" + lines + (o.notes ? "\n\nNote: " + o.notes : "") +
      (o.paid ? "\n\n" + o.payNote + ". Already marked Paid.\n" : "\n\n" + o.payNote + ". Tick Paid in the Orders tab when the Venmo payment arrives.\n") + SpreadsheetApp.getActive().getUrl());
  }
}

/* ---------- payment follow-through ---------- */
const COL = { id: 1, ordered: 2, first: 3, email: 5, due: 10, method: 11, paid: 12, received: 13, paidDate: 14, note: 15, status: 17 };

// Ticking Paid by hand keeps Status in step
function onEditInstalled(e) {
  const r = e.range, s = r.getSheet();
  if (s.getName() !== "Orders" || r.getColumn() !== COL.paid || r.getRow() < 2) return;
  const row = r.getRow(), paid = r.getValue() === true;
  s.getRange(row, COL.status).setValue(paid ? "Paid" : "Awaiting payment");
  if (paid && !s.getRange(row, COL.paidDate).getValue()) s.getRange(row, COL.paidDate).setValue(new Date());
  if (paid && !s.getRange(row, COL.received).getValue()) s.getRange(row, COL.received).setValue(s.getRange(row, COL.due).getValue());
}

// Reads Venmo "paid you" emails and ticks Paid when the order number and amount match
function checkVenmoPayments() {
  const ss = SpreadsheetApp.getActive(), orders = ss.getSheetByName("Orders");
  if (!orders || orders.getLastRow() < 2) return;
  const label = GmailApp.getUserLabelByName("NMJL Venmo matched") || GmailApp.createLabel("NMJL Venmo matched");
  const threads = GmailApp.search('from:venmo@venmo.com "paid you" newer_than:30d -label:"NMJL Venmo matched"', 0, 50);
  if (!threads.length) return;
  const data = orders.getRange(2, 1, orders.getLastRow() - 1, COL.status).getValues();
  const rowOf = {}; data.forEach((r, i) => rowOf[r[0]] = i);
  threads.forEach(th => {
    let matched = false;
    th.getMessages().forEach(m => {
      if (!/venmo\.com/i.test(m.getFrom())) return;
      const text = m.getSubject() + "\n" + m.getPlainBody();
      const amt = (m.getSubject().match(/paid you \$([\d,]+\.\d{2})/i) || text.match(/\$([\d,]+\.\d{2})/) || [])[1];
      const ids = text.match(/BB-[A-Z0-9]{5}/g) || [];
      ids.forEach(id => {
        const i = rowOf[id]; if (i === undefined || !amt) return;
        const r = data[i], got = Number(amt.replace(/,/g, "")), row = i + 2;
        if (r[COL.paid - 1] === true) { matched = true; return; }
        if (got + 0.005 >= Number(r[COL.due - 1])) {
          orders.getRange(row, COL.paid).setValue(true);
          orders.getRange(row, COL.received).setValue(got);
          orders.getRange(row, COL.paidDate).setValue(m.getDate());
          orders.getRange(row, COL.note).setValue(String(r[COL.note - 1] || "") + " · auto-matched Venmo email");
          orders.getRange(row, COL.status).setValue("Paid");
          r[COL.paid - 1] = true;
          paymentReceivedEmail_(r, got);
        } else {
          orders.getRange(row, COL.received).setValue(got);
          orders.getRange(row, COL.status).setValue("Underpaid: check Venmo");
        }
        matched = true;
      });
    });
    if (matched) th.addLabel(label);
  });
}

function paymentReceivedEmail_(r, got) {
  const email = r[COL.email - 1]; if (!email) return;
  try {
    MailApp.sendEmail({
      to: email, replyTo: SETTINGS.notifyEmail, name: SETTINGS.clubName,
      subject: "Payment received: NMJL card order " + r[0],
      body: "Hi " + r[COL.first - 1] + ",\n\nWe received your $" + got.toFixed(2) + " Venmo payment for order " + r[0] +
        ". You're all set. Your order goes to the League, and your 2027 card will be mailed to you when it's released.\n\nThank you!\n" + SETTINGS.clubName
    });
  } catch (e) { console.error(e); }
}

// Reminder after reminderHours, cancel after cancelDays (online Venmo orders only)
function followUpUnpaid() {
  const orders = SpreadsheetApp.getActive().getSheetByName("Orders");
  if (!orders || orders.getLastRow() < 2) return;
  const now = Date.now(), data = orders.getRange(2, 1, orders.getLastRow() - 1, COL.status).getValues();
  data.forEach((r, i) => {
    const row = i + 2, status = String(r[COL.status - 1] || "");
    if (!r[0] || r[COL.paid - 1] === true || r[COL.method - 1] !== "Venmo") return;
    if (status === "Cancelled" || /^Underpaid/.test(status)) return;
    const ageH = (now - new Date(r[COL.ordered - 1]).getTime()) / 36e5;
    const o = { id: r[0], total: Number(r[COL.due - 1]) };
    if (ageH >= SETTINGS.cancelDays * 24) {
      orders.getRange(row, COL.status).setValue("Cancelled");
      if (r[COL.email - 1]) try {
        MailApp.sendEmail({ to: r[COL.email - 1], replyTo: SETTINGS.notifyEmail, name: SETTINGS.clubName,
          subject: "NMJL card order " + o.id + " cancelled",
          body: "Hi " + r[COL.first - 1] + ",\n\nWe didn't receive payment for NMJL card order " + o.id + ", so it has been cancelled. If you still want a 2027 card, you can order again any time at https://birdbamclub.com/nmjl or in person at the club.\n\nIf you did pay, just reply to this email and we'll sort it out.\n\n" + SETTINGS.clubName });
      } catch (e) { console.error(e); }
    } else if (ageH >= SETTINGS.reminderHours && status === "Awaiting payment") {
      orders.getRange(row, COL.status).setValue("Reminder sent");
      if (r[COL.email - 1]) try {
        MailApp.sendEmail({ to: r[COL.email - 1], replyTo: SETTINGS.notifyEmail, name: SETTINGS.clubName,
          subject: "Reminder: finish paying for NMJL card order " + o.id,
          body: "Hi " + r[COL.first - 1] + ",\n\nWe haven't received the Venmo payment for your 2027 NMJL card order " + o.id + " yet. Please send $" + o.total.toFixed(2) +
            " to " + SETTINGS.collector + " (@" + SETTINGS.venmoHandle + ") with " + o.id + " in the note:\n" + venmoLink_(o) +
            "\n\nUnpaid orders are cancelled after " + SETTINGS.cancelDays + " days.\n\n" + SETTINGS.clubName });
      } catch (e) { console.error(e); }
    }
  });
}
