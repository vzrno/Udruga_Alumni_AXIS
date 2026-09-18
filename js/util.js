/* Shared helpers. Every module imports from here so the language handling
   lives in exactly one place. */

"use strict";

const CFG = window.AXIS || {};

export const lang = CFG.lang || document.documentElement.lang || "hr";
export const locale = CFG.locale || (lang === "en" ? "en-GB" : "hr-HR");
export const base = CFG.base || "";
export const t = CFG.t || {};
export const paths = CFG.paths || { news: "novosti/", events: "dogadanja/" };

/** Address of the generated detail page for a news item or an event. */
export function detailUrl(kind, item) {
  const slug = L(item.slug);
  return slug ? `${base}${paths[kind] || ""}${slug}.html` : "";
}

/** Pick the current language out of a {hr, en} field. Plain strings pass through. */
export function L(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && !Array.isArray(value)) {
    return value[lang] ?? value.hr ?? value.en ?? "";
  }
  return value;
}

/** Same, for array fields such as highlights or agenda. */
export function LArr(value) {
  const picked = Array.isArray(value) ? value : L(value);
  return Array.isArray(picked) ? picked : [];
}

export function asset(path) {
  if (!path) return "";
  if (/^(https?:|data:|\/)/.test(path)) return path;
  return base + path;
}

export const PLACEHOLDER = () => asset("images/placeholder.svg");

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** Only http(s), mailto, image data URIs and local paths survive. */
export function safeUrl(url) {
  const raw = String(url || "").trim();
  return /^(https?:\/\/|mailto:|data:image\/|\/|[\w./-]+$)/i.test(raw)
    ? escapeHtml(raw)
    : "#";
}

export async function loadJson(name) {
  const res = await fetch(`${base}data/${name}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} — data/${name}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

const DAY = 86400000;

export function toDate(dateStr, timeStr) {
  if (!dateStr) return null;
  const time = /^\d{2}:\d{2}$/.test(timeStr || "") ? timeStr : "00:00";
  const d = new Date(`${dateStr}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Human date: "10. ožujka 2026." / "10 March 2026" */
export function formatDate(dateStr) {
  const d = toDate(dateStr);
  if (!d) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Range aware: single day, or "10.–12. December 2025" style range. */
export function formatDateRange(from, to) {
  if (!to || to === from) return formatDate(from);
  const a = toDate(from);
  const b = toDate(to);
  if (!a || !b) return formatDate(from);
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameMonth) {
    // Intl gives "11." in Croatian and "11" in English, so no extra dot here.
    const dayOnly = new Intl.DateTimeFormat(locale, { day: "numeric" }).format(a);
    return `${dayOnly}–${formatDate(to)}`;
  }
  return `${formatDate(from)} – ${formatDate(to)}`;
}

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

export function tagFor(state) {
  if (state === "today") return `<span class="tag tag-live">${escapeHtml(t.today || "Danas")}</span>`;
  if (state === "upcoming") return `<span class="tag tag-soon">${escapeHtml(t.upcoming || "Uskoro")}</span>`;
  return `<span class="tag tag-done">${escapeHtml(t.finished || "Završeno")}</span>`;
}

/** Card image with a working fallback and a small variant for narrow screens. */
export function media(src, alt, eager = false, overlay = "") {
  const full = asset(src) || PLACEHOLDER();
  const small = /\.webp$/.test(src || "") ? asset(src.replace(/\.webp$/, "-700.webp")) : "";
  return `
    <div class="card-media">
      <img src="${safeUrl(full)}"
           ${small ? `srcset="${safeUrl(small)} 700w, ${safeUrl(full)} 1400w"
           sizes="(min-width: 992px) 30vw, (min-width: 576px) 46vw, 92vw"` : ""}
           alt="${escapeHtml(alt || "")}"
           data-fallback="${PLACEHOLDER()}"
           loading="${eager ? "eager" : "lazy"}"
           decoding="async">
      ${overlay}
    </div>`;
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

/** Small day/month chip laid over a card image. */
export function dateChip(dateStr) {
  const d = toDate(dateStr);
  if (!d) return "";
  const day = new Intl.DateTimeFormat(locale, { day: "numeric" }).format(d);
  const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(d).replace(".", "");
  return `<span class="date-chip" aria-hidden="true"><b>${escapeHtml(day)}</b><span>${escapeHtml(month)}</span></span>`;
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

export function truncate(text, max = 130) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return s.slice(0, s.lastIndexOf(" ", max) || max) + "…";
}

export function isUrl(text) {
  return /^https?:\/\//i.test(String(text || "").trim());
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
