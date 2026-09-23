/* Printable copy of an application.
   The data travels in the address of this page (the link that main.js adds to
   every submission), so nothing is stored on the server. Empty fields — for
   example the year of graduation of a current student — are dropped. */

import { t } from "./util.js";

const params = new URLSearchParams(window.location.search);
const sheet = document.querySelector("[data-print-sheet]");
const empty = document.querySelector("[data-print-empty]");

/** 2026-04-02 → 2. travnja 2026. (and the English equivalent) */
function longDate(value) {
  const date = new Date(`${value}T12:00`);
  if (Number.isNaN(date.getTime())) return value;
  const lang = document.documentElement.lang || "hr";
  // Croatian already ends with a full stop ("2. travnja 1998."), so none is added.
  return new Intl.DateTimeFormat(lang === "hr" ? "hr-HR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function fill() {
  if (!sheet) return;
  if (![...params.keys()].length) {
    if (empty) empty.hidden = false;
    return;
  }

  sheet.hidden = false;
  sheet.querySelectorAll("[data-field]").forEach((cell) => {
    const value = (params.get(cell.dataset.field) || "").trim();
    if (!value) {
      cell.closest("li")?.remove(); // keep the sheet short: no empty rows
      return;
    }
    if (cell.hasAttribute("data-yesno")) {
      cell.textContent = value === "da" ? t.yes || "da" : t.no || "ne";
      return;
    }
    cell.textContent = cell.hasAttribute("data-date") ? longDate(value) : value;
  });

  const who = params.get("ime_i_prezime");
  if (who) document.title = `${document.title} — ${who}`;
}

fill();

document.querySelector("[data-print]")?.addEventListener("click", () => {
  window.print();
});
