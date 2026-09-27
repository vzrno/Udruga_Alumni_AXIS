/* Shared helpers. Every module imports from here so the language handling
   lives in exactly one place. */

import { createFormat } from "./format.js";

const CFG = window.AXIS || {};
const F = createFormat({ ...CFG, lang: CFG.lang || document.documentElement.lang || "hr" });

// The pure helpers and the card markup live in format.js (build.mjs uses them too).
export const {
  lang, locale, base, t, paths,
  L, LArr, detailUrl, asset, PLACEHOLDER, escapeHtml, safeUrl, toDate,
  formatDate, formatDateRange, tagFor, dateChip, media, truncate, isUrl,
  newsCard, eventCard,
} = F;

export async function loadJson(name) {
  const res = await fetch(`${base}data/${name}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} — data/${name}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

const DAY = 86400000;

/** "upcoming" | "today" | "past" */
export function status(item) {
  const now = new Date();
  const end = toDate(item.dateEnd || item.date, item.endTime || item.time) || toDate(item.date);
  const start = toDate(item.date);
  if (!start) return "past";
  if (end && end.getTime() + (item.endTime || item.time ? 0 : DAY) > now.getTime()) {
    const sameDay = start.toDateString() === now.toDateString();
    return sameDay ? "today" : "upcoming";
  }
  return "past";
}

/** Fade-up animation for elements marked .reveal (no-op without IO support). */
let observer = null;
export function reveal(root = document) {
  const nodes = root.querySelectorAll(".reveal:not(.is-visible)");
  if (!nodes.length) return;
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((n) => n.classList.add("is-visible"));
    return;
  }
  observer ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  nodes.forEach((n) => observer.observe(n));
}

export function wireFallbacks(root) {
  root.querySelectorAll("img[data-fallback]").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        img.src = img.getAttribute("data-fallback");
      },
      { once: true },
    );
  });
}

export function stateMsg(message, actionLabel, actionId) {
  return `
    <div class="col-12">
      <div class="state-msg">
        <p>${escapeHtml(message)}</p>
        ${actionId ? `<button type="button" class="btn btn-outline-primary btn-sm" id="${actionId}">${escapeHtml(actionLabel)}</button>` : ""}
      </div>
    </div>`;
}
