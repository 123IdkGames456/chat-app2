const SHEET_ID = "1w3yCZtxLh1cWSWadEEOq7NngDCxdFePN-5zp891iAYw";
const TAB = "Messages";
const MAX_ROWS = 500;

function doGet(e) {
  const p = e.parameter || {};
  const callback = /^[A-Za-z_$][\\w$]*$/.test(p.callback || "") ? p.callback : "";
  let result;
  try {
    if (p.action === "send") result = send_(p);
    else if (p.action === "poll") result = poll_(p);
    else if (p.action === "setup") result = setup_();
    else result = { ok: true, service: "Chat App 2 Sheets API", actions: ["setup", "poll", "send"] };
  } catch (err) {
    result = { ok: false, error: String(err && err.message || err) };
  }
  const json = JSON.stringify(result).replace(/</g, "\\u003c");
  if (callback) return ContentService.createTextOutput(callback + "(" + json + ");").setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function setup_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(TAB) || ss.insertSheet(TAB);
  if (sh.getLastRow() === 0) sh.appendRow(["id","timestamp","room","name","device","text","image","avatar"]);
  sh.setFrozenRows(1);
  return { ok: true, sheet: ss.getName(), tab: TAB, rows: Math.max(0, sh.getLastRow()-1) };
}

function sheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(TAB);
  if (!sh) {
    sh = ss.insertSheet(TAB);
    sh.appendRow(["id","timestamp","room","name","device","text","image","avatar"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function send_(p) {
  const room = clean_(p.room || "general", 40);
  const name = clean_(p.name, 32);
  const device = clean_(p.device, 80);
  const text = clean_(p.text, 1500);
  const image = String(p.image || "").slice(0, 180000);
  const avatar = String(p.avatar || "").slice(0, 40000);
  if (!name || (!text && !image)) throw new Error("Name and message/image required");
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_();
    const id = Utilities.getUuid();
    const now = new Date();
    sh.appendRow([id, now, room, name, device, text, image, avatar]);
    const last = sh.getLastRow();
    if (last > MAX_ROWS + 1) sh.deleteRows(2, last - MAX_ROWS - 1);
    return { ok: true, id: id, timestamp: now.toISOString() };
  } finally { lock.releaseLock(); }
}

function poll_(p) {
  const room = clean_(p.room || "general", 40);
  const after = Number(p.after || 0);
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return { ok: true, messages: [], cursor: 0 };
  const start = Math.max(2, last - 99);
  const rows = sh.getRange(start, 1, last - start + 1, 8).getValues();
  const messages = [];
  rows.forEach((r, i) => {
    const row = start + i;
    if (row <= after || String(r[2]) !== room) return;
    messages.push({ row: row, id: String(r[0]), timestamp: r[1] instanceof Date ? r[1].toISOString() : String(r[1]), room: String(r[2]), name: String(r[3]), device: String(r[4]), text: String(r[5]), image: String(r[6]), avatar: String(r[7]) });
  });
  return { ok: true, messages: messages, cursor: last };
}

function clean_(v, max) {
  return String(v || "").replace(/[\\u0000-\\u001f]/g, " ").trim().slice(0, max);
}
