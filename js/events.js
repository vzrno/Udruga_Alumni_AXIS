/* Events: the cards are written by the build (see build.mjs), so this file
   only does what needs today's date — stamp the "Uskoro / Danas / Završeno"
   tag, put the soonest event first, and drive the filter and sort controls.
   Nothing is fetched and no card markup lives here. */

"use strict";

const CFG = window.AXIS || {};
const T = CFG.t || {};
const DAY = 86400000;

const list = document.getElementById("events-list");
if (list) init();

function toDate(dateStr, timeStr) {
  if (!dateStr) return null;
  const time = /^\d{2}:\d{2}$/.test(timeStr || "") ? timeStr : "00:00";
  const d = new Date(`${dateStr}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "upcoming" | "today" | "past" — same rule the old data-driven code used. */
function status(card) {
  const { date, time, dateEnd, timeEnd } = card.dataset;
  const start = toDate(date);
  if (!start) return "past";
  const end = toDate(dateEnd || date, timeEnd || time) || start;
  const grace = timeEnd || time ? 0 : DAY;
  if (end.getTime() + grace > Date.now()) {
    return start.toDateString() === new Date().toDateString() ? "today" : "upcoming";
  }
  return "past";
}

function tagFor(state) {
  if (state === "today") return { cls: "tag tag-live", text: T.today || "Danas" };
  if (state === "upcoming") return { cls: "tag tag-soon", text: T.upcoming || "Uskoro" };
  return { cls: "tag tag-done", text: T.finished || "Završeno" };
}

function init() {
  const cards = Array.from(list.querySelectorAll("[data-event]"));
  if (!cards.length) return;

  const states = new Map();
  cards.forEach((card) => {
    const state = status(card);
    states.set(card, state);
    const tag = card.querySelector("[data-state-tag]");
    if (tag) {
      const { cls, text } = tagFor(state);
      tag.className = cls;
      tag.textContent = text;
      tag.hidden = false;
    }
  });

  const filters = document.getElementById("events-filters");
  const sortSelect = document.getElementById("events-sort");
  const startAt = (card) => toDate(card.dataset.date)?.getTime() ?? 0;

  // The home page has no controls: upcoming ones first, soonest of them at the
  // front, then the most recent past ones.
  if (!filters) {
    const upcoming = cards
      .filter((c) => states.get(c) !== "past")
      .sort((a, b) => startAt(a) - startAt(b));
    const past = cards
      .filter((c) => states.get(c) === "past")
      .sort((a, b) => startAt(b) - startAt(a));
    [...upcoming, ...past].forEach((card) => list.append(card));
    return;
  }

  let view = list.dataset.view || "upcoming";
  let sortDir = "asc";
  if (!cards.some((c) => states.get(c) !== "past")) view = "past";

  const empty = document.createElement("div");
  empty.className = "col-12";
  empty.setAttribute("data-empty", "");

  const render = () => {
    filters.querySelectorAll("[data-view]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.view === view));
    });

    const shown = cards.filter((card) => {
      const state = states.get(card);
      if (view === "upcoming") return state !== "past";
      if (view === "past") return state === "past";
      return true;
    });

    // Past events read best newest first, upcoming ones soonest first.
    const dir = sortDir === "desc" ? -1 : 1;
    const natural = view === "past" && sortDir === "asc" ? -1 : dir;
    shown.sort((a, b) => (startAt(a) - startAt(b)) * natural);

    cards.forEach((card) => {
      card.hidden = !shown.includes(card);
    });
    shown.forEach((card) => {
      card.classList.add("is-visible");
      list.append(card);
    });

    if (shown.length) {
      empty.remove();
      return;
    }
    list.append(empty);

    const hasPast = cards.some((c) => states.get(c) === "past");
    if (view === "upcoming" && hasPast) {
      empty.innerHTML = `
        <div class="state-msg">
          <p></p>
          <button type="button" class="btn btn-outline-primary btn-sm" id="goPast"></button>
        </div>`;
      empty.querySelector("p").textContent = T.noUpcoming || "";
      const btn = empty.querySelector("#goPast");
      btn.textContent = T.showPast || "";
      btn.addEventListener("click", () => {
        view = "past";
        render();
      });
    } else {
      empty.innerHTML = '<div class="state-msg"><p></p></div>';
      empty.querySelector("p").textContent = T.noEvents || "";
    }
  };

  filters.addEventListener("click", (e) => {
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
