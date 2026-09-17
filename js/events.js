/* Events list: upcoming / past / all. Cards link to the generated detail page,
   so every event has its own shareable address.
   If nothing is upcoming the page does not go blank — it says so and offers
   the archive. */

import {
  L, t, escapeHtml, loadJson, formatDateRange, status, tagFor, media, wireFallbacks,
  truncate, stateMsg, toDate, detailUrl, safeUrl, dateChip, reveal,
} from "./util.js";

const list = document.getElementById("events-list");
if (list) init();

let events = [];
let view = list?.dataset.view || "upcoming";
let sortDir = "asc";
const limit = Number(list?.dataset.limit || 0);

const filterBar = document.getElementById("events-filters");
const sortSelect = document.getElementById("events-sort");

async function init() {
  try {
    events = await loadJson("events.json");
  } catch (err) {
    console.error(err);
    list.innerHTML = stateMsg(t.loadError);
    return;
  }

  if (!events.some((e) => status(e) !== "past")) {
    view = "past";
    if (!filterBar) sortDir = "desc";
  }

  filterBar?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view]");
    if (!btn) return;
    view = btn.dataset.view;
    render();
  });

  sortSelect?.addEventListener("change", () => {
    sortDir = sortSelect.value === "desc" ? "desc" : "asc";
    render();
  });

  render();
}

function visible() {
  // Home page (no filter bar): upcoming first, then the most recent past ones,
  // so the section never looks empty while still leading with what is next.
  if (!filterBar) {
    const upcoming = events
      .filter((e) => status(e) !== "past")
      .sort((a, b) => (toDate(a.date) || 0) - (toDate(b.date) || 0));
    const past = events
      .filter((e) => status(e) === "past")
      .sort((a, b) => (toDate(b.date) || 0) - (toDate(a.date) || 0));
    const merged = [...upcoming, ...past];
    return limit ? merged.slice(0, limit) : merged;
  }

  const items = events.filter((e) => {
    const s = status(e);
    if (view === "upcoming") return s !== "past";
    if (view === "past") return s === "past";
    return true;
  });

  // Past events read best newest-first, upcoming ones soonest-first.
  const dir = sortDir === "desc" ? -1 : 1;
  const naturalDir = view === "past" && sortDir === "asc" ? -1 : dir;
  items.sort((a, b) => ((toDate(a.date) || 0) - (toDate(b.date) || 0)) * naturalDir);
  return limit ? items.slice(0, limit) : items;
}

function render() {
  filterBar?.querySelectorAll("[data-view]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.view === view));
  });

  const items = visible();
  list.setAttribute("aria-busy", "false");

  if (!items.length) {
    const hasPast = events.some((e) => status(e) === "past");
    if (view === "upcoming" && hasPast) {
      list.innerHTML = stateMsg(t.noUpcoming, t.showPast, "goPast");
      document.getElementById("goPast")?.addEventListener("click", () => {
        view = "past";
        render();
      });
    } else {
      list.innerHTML = stateMsg(t.noEvents);
    }
    return;
  }

  list.innerHTML = items.map(card).join("");
  wireFallbacks(list);
  reveal(list);
}

function card(item) {
  const state = status(item);
  const title = L(item.title);
  const url = detailUrl("events", item);
  const when = formatDateRange(item.date, item.dateEnd);
  const where = L(item.location);

  return `
    <div class="col-sm-6 col-lg-4 reveal">
      <article class="axis-card">
        <a href="${safeUrl(url)}" tabindex="-1" aria-hidden="true">${media(item.image, title, false, dateChip(item.date))}</a>
        <div class="card-inner">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <h3><a href="${safeUrl(url)}" class="card-title-link">${escapeHtml(title)}</a></h3>
            ${tagFor(state)}
          </div>
          <p class="card-meta">
            ${escapeHtml(when)}${item.time ? ` · ${escapeHtml(item.time)}` : ""}
            ${where ? `<br>${escapeHtml(where)}` : ""}
          </p>
          <p class="card-text">${escapeHtml(truncate(L(item.description), 120))}</p>
          <div class="card-actions">
            <a class="btn btn-outline-primary btn-sm" href="${safeUrl(url)}">
              ${escapeHtml(t.openEvent || t.details)}
            </a>
          </div>
        </div>
      </article>
    </div>`;
}
