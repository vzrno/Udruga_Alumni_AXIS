/* Pure helpers for dates, text and card markup.
   No window, no document: the same code runs in the browser (through util.js)
   and in build.mjs, which uses it to write the news and event lists straight
   into the HTML. That way both produce exactly the same cards.

   createFormat(cfg) takes the page settings that build.mjs writes into every
   page ({ lang, locale, base, paths, t }) and returns the helpers bound to them. */

export function createFormat(cfg = {}) {
  const lang = cfg.lang || "hr";
  const locale = cfg.locale || (lang === "en" ? "en-GB" : "hr-HR");
  const base = cfg.base || "";
  const t = cfg.t || {};
  const paths = cfg.paths || { news: "novosti/", events: "dogadanja/" };

  /** Pick the current language out of a {hr, en} field. Plain strings pass through. */
  function L(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "object" && !Array.isArray(value)) {
      return value[lang] ?? value.hr ?? value.en ?? "";
    }
    return value;
  }

  /** Same, for array fields such as highlights or agenda. */
  function LArr(value) {
    const picked = Array.isArray(value) ? value : L(value);
    return Array.isArray(picked) ? picked : [];
  }

  /** Address of the generated detail page for a news item or an event. */
  function detailUrl(kind, item) {
    const slug = L(item.slug);
    return slug ? `${base}${paths[kind] || ""}${slug}.html` : "";
  }

  function asset(path) {
    if (!path) return "";
    if (/^(https?:|data:|\/)/.test(path)) return path;
    return base + path;
  }

  const PLACEHOLDER = () => asset("images/placeholder.svg");

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /** Only http(s), mailto, image data URIs and local paths survive. */
  function safeUrl(url) {
    const raw = String(url || "").trim();
    return /^(https?:\/\/|mailto:|data:image\/|\/|[\w./-]+$)/i.test(raw)
      ? escapeHtml(raw)
      : "#";
  }

  function toDate(dateStr, timeStr) {
    if (!dateStr) return null;
    const time = /^\d{2}:\d{2}$/.test(timeStr || "") ? timeStr : "00:00";
    const d = new Date(`${dateStr}T${time}`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /** Human date: "10. ožujka 2026." / "10 March 2026" */
  function formatDate(dateStr) {
    const d = toDate(dateStr);
    if (!d) return "";
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  }

  /** Range aware: single day, or "10.–12. December 2025" style range. */
  function formatDateRange(from, to) {
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

  function tagFor(state) {
    if (state === "today") return `<span class="tag tag-live">${escapeHtml(t.today || "Danas")}</span>`;
    if (state === "upcoming") return `<span class="tag tag-soon">${escapeHtml(t.upcoming || "Uskoro")}</span>`;
    return `<span class="tag tag-done">${escapeHtml(t.finished || "Završeno")}</span>`;
  }

  /** Small day/month chip laid over a card image. */
  function dateChip(dateStr) {
    const d = toDate(dateStr);
    if (!d) return "";
    const day = new Intl.DateTimeFormat(locale, { day: "numeric" }).format(d);
    const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(d).replace(".", "");
    return `<span class="date-chip" aria-hidden="true"><b>${escapeHtml(day)}</b><span>${escapeHtml(month)}</span></span>`;
  }

  /** Card image with a working fallback and a small variant for narrow screens. */
  function media(src, alt, eager = false, overlay = "") {
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

  /** Shorten at a word boundary. */
  function truncate(text, max = 130) {
    const s = String(text || "").replace(/\s+/g, " ").trim();
    if (s.length <= max) return s;
    const cut = s.lastIndexOf(" ", max);
    return s.slice(0, cut > 0 ? cut : max) + "…";
  }

  function isUrl(text) {
    return /^https?:\/\//i.test(String(text || "").trim());
  }

  const timeRange = (item) =>
    item.time ? ` · ${escapeHtml(item.time)}${item.endTime ? `–${escapeHtml(item.endTime)}` : ""}` : "";

  /** Card for a news item. */
  function newsCard(item, eager = false) {
    const title = L(item.title);
    const desc = L(item.description);
    const where = L(item.location);
    const url = detailUrl("news", item);

    return `
    <div class="col-sm-6 col-lg-4 reveal">
      <article class="axis-card">
        <a href="${safeUrl(url)}" tabindex="-1" aria-hidden="true">${media(item.image, title, eager, dateChip(item.date))}</a>
        <div class="card-inner">
          <h3><a href="${safeUrl(url)}" class="card-title-link">${escapeHtml(title)}</a></h3>
          <p class="card-meta">
            ${escapeHtml(formatDateRange(item.date, item.dateEnd))}
            ${timeRange(item)}
            ${where ? `<br>${escapeHtml(where)}` : ""}
          </p>
          <p class="card-text">
            ${escapeHtml(isUrl(desc) ? t.externalNews : truncate(desc))}
          </p>
          <div class="card-actions">
            <a class="btn btn-outline-primary btn-sm" href="${safeUrl(url)}">
              ${escapeHtml(t.openPage || t.readMore)}
            </a>
          </div>
        </div>
      </article>
    </div>`;
  }

  /** Card for an event. state = "upcoming" | "today" | "past", or null for no label
   *  (build.mjs passes null: the label depends on today's date, so the browser adds it). */
  function eventCard(item, state = null) {
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
            ${state ? tagFor(state) : ""}
          </div>
          <p class="card-meta">
            ${escapeHtml(when)}${timeRange(item)}
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

  return {
    lang, locale, base, t, paths,
    L, LArr, detailUrl, asset, PLACEHOLDER, escapeHtml, safeUrl, toDate,
    formatDate, formatDateRange, tagFor, dateChip, media, truncate, isUrl,
    newsCard, eventCard,
  };
}
