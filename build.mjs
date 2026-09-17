#!/usr/bin/env node
/* ===========================================================================
   Alumni AXIS Split — static site builder
   ---------------------------------------------------------------------------
   Builds, for both languages:
     • the standing pages            (src/pages/<lang>/<id>.html)
     • one page per news item        (data/news.json)
     • one page per event            (data/events.json)
     • sitemap.xml, robots.txt, RSS feeds, 404
   Every page gets canonical + hreflang links and JSON-LD structured data.

   Run:  npm run build
   =========================================================================== */

import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

/* ------------------------------------------------------------------ config */

/** Public address of the site. Change before going live. */
const SITE = "https://alumniaxis-st.hr";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const SRC = path.join(ROOT, "src");
const LANGS = ["hr", "en"];

/** Standing pages. `nav: false` keeps a page out of the main menu. */
const PAGES = [
  { id: "home", hr: "index.html", en: "en/index.html" },
  { id: "about", hr: "o-nama.html", en: "en/about.html" },
  { id: "events", hr: "dogadanja.html", en: "en/events.html" },
  { id: "news", hr: "novosti.html", en: "en/news.html" },
  { id: "careers", hr: "poslovi.html", en: "en/careers.html" },
  { id: "membership", hr: "clanstvo.html", en: "en/membership.html" },
  { id: "contact", hr: "kontakt.html", en: "en/contact.html" },
  { id: "privacy", hr: "privatnost.html", en: "en/privacy.html", nav: false },
];

/** Data-driven detail pages. */
const COLLECTIONS = [
  {
    key: "news",
    file: "news.json",
    index: "news",
    dir: { hr: "novosti", en: "en/news" },
    schema: "NewsArticle",
  },
  {
    key: "events",
    file: "events.json",
    index: "events",
    dir: { hr: "dogadanja", en: "en/events" },
    schema: "Event",
  },
];

const ICONS_CSS = '    <link rel="stylesheet" href="{{root}}css/icons.css" />';

/** Old address -> new address. Add a line here whenever a slug changes, so a
 *  link that Google or someone's bookmark still holds keeps working. */
const REDIRECTS = [
  { from: "novosti/ciet-2026-poziv-radove.html", to: "novosti/konferencija-ciet-2026.html" },
  { from: "dogadanja/ciet-2026-poziv-radove.html", to: "dogadanja/konferencija-ciet-2026.html" },
  { from: "en/news/ciet-2026-call-papers.html", to: "en/news/ciet-2026-conference.html" },
  { from: "en/events/ciet-2026-call-papers.html", to: "en/events/ciet-2026-conference.html" },
];

/* ----------------------------------------------------------------- helpers */

const read = (p) => readFile(p, "utf8");

function flatten(obj, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) flatten(value, full, out);
    else out[full] = value;
  }
  return out;
}

function fill(template, values) {
  return template.replace(/\{\{([\w.]+)\}\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}

function frontMatter(source) {
  const match = source.match(/^\s*<!--(\{[\s\S]*?\})-->\s*/);
  if (!match) throw new Error("page is missing its <!--{ ... }--> front matter");
  return { meta: JSON.parse(match[1]), body: source.slice(match[0].length) };
}

/** Pick one language out of a { hr, en } field; plain values pass through. */
function L(value, lang) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && !Array.isArray(value)) return value[lang] ?? value.hr ?? "";
  return value;
}

function LArr(value, lang) {
  const picked = Array.isArray(value) ? value : L(value, lang);
  return Array.isArray(picked) ? picked : [];
}

const esc = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

/** "../" repeated as deep as the output file sits. */
const rootFor = (outPath) => "../".repeat(outPath.split("/").length - 1);

const absolute = (outPath) =>
  outPath.endsWith("index.html")
    ? `${SITE}/${outPath.replace(/index\.html$/, "")}`
    : `${SITE}/${outPath}`;

function fmtDate(date, lang) {
  if (!date) return "";
  const d = new Date(`${date}T12:00`);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "hr-HR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function fmtRange(from, to, lang) {
  if (!to || to === from) return fmtDate(from, lang);
  const a = new Date(`${from}T12:00`);
  const b = new Date(`${to}T12:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return fmtDate(from, lang);
  // Within one month, only the first day is spelled out: "11.–12. lipnja 2026."
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    const locale = lang === "en" ? "en-GB" : "hr-HR";
    const day = new Intl.DateTimeFormat(locale, { day: "numeric" }).format(a);
    return `${day}–${fmtDate(to, lang)}`;
  }
  return `${fmtDate(from, lang)} – ${fmtDate(to, lang)}`;
}

const isUrl = (text) => /^https?:\/\//i.test(String(text || "").trim());

/** Plain text with blank lines -> paragraphs. */
function paragraphs(text) {
  return String(text || "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${esc(block).replaceAll("\n", "<br>")}</p>`)
    .join("\n              ");
}

/* -------------------------------------------------------------- load input */

const shell = await read(path.join(SRC, "partials/base.html"));
const headerTpl = await read(path.join(SRC, "partials/header.html"));
const footerTpl = await read(path.join(SRC, "partials/footer.html"));
const articleTpl = await read(path.join(SRC, "partials/article.html"));

const dict = {};
for (const lang of LANGS) dict[lang] = JSON.parse(await read(path.join(SRC, `i18n/${lang}.json`)));

const collections = {};
for (const collection of COLLECTIONS) {
  const items = JSON.parse(await read(path.join(ROOT, "data", collection.file)));
  collections[collection.key] = items.filter((item) => {
    if (item.slug && item.slug.hr && item.slug.en) return true;
    console.warn(`skipped  ${collection.file} id=${item.id}: missing slug.hr / slug.en`);
    return false;
  });
}

/* --------------------------------------------------- prerendered card lists
   The list pages used to be filled in by the browser: the HTML shipped an
   empty <div> and js/*.js fetched data/*.json. Now the build writes the
   cards, and the browser only tags, sorts, filters and pages through markup
   that is already there. So the pages carry their own content on first paint,
   for a visitor without JavaScript, and for every crawler.

   IMPORTANT: nothing rendered here may depend on the current date. The
   "Uskoro / Završeno" tag and the "soonest first" order are applied by
   js/events.js in the browser, because two builds of the same sources must
   stay byte-identical (the CI check in .github/workflows/build.yml).       */

const jobs = JSON.parse(await read(path.join(ROOT, "data/jobs.json")));

/** Kept in step with PER_PAGE in js/news.js and js/careers.js. */
const NEWS_PER_PAGE = 6;
const JOBS_PER_PAGE = 9;

const PLACEHOLDER = "images/placeholder.svg";

/** Newest first, by an ISO date field: string compare, no time zone in play. */
const newestFirst = (field) => (a, b) =>
  String(b[field] || "").localeCompare(String(a[field] || ""));

const detailPath = (collection, item, lang, root) =>
  `${root}${collection.dir[lang]}/${item.slug[lang]}.html`;

/** Same markup js/util.js used to build: card image + small variant + chip. */
function cardMedia(src, alt, root, eager, overlay = "") {
  const full = `${root}${src || PLACEHOLDER}`;
  const small = /\.webp$/.test(src || "") ? `${root}${src.replace(/\.webp$/, "-700.webp")}` : "";
  const srcset = small
    ? `\n                 srcset="${esc(small)} 700w, ${esc(full)} 1400w"\n                 sizes="(min-width: 992px) 30vw, (min-width: 576px) 46vw, 92vw"`
    : "";
  return `<div class="card-media">
            <img src="${esc(full)}"${srcset}
                 alt="${esc(alt)}"
                 width="1400" height="933"
                 data-fallback="${esc(`${root}${PLACEHOLDER}`)}"
                 loading="${eager ? "eager" : "lazy"}" decoding="async" />${overlay}
          </div>`;
}

/** Day + short month laid over a card image. */
function dateChip(date, lang) {
  const d = new Date(`${date}T12:00`);
  if (Number.isNaN(d.getTime())) return "";
  const locale = lang === "en" ? "en-GB" : "hr-HR";
  const day = new Intl.DateTimeFormat(locale, { day: "numeric" }).format(d);
  const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(d).replace(".", "");
  return `
            <span class="date-chip" aria-hidden="true"><b>${esc(day)}</b><span>${esc(month)}</span></span>`;
}

function shorten(text, max = 130) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, s.lastIndexOf(" ", max) || max)}…`;
}

function eventCard(item, lang, root) {
  const strings = dict[lang];
  const title = L(item.title, lang);
  const url = detailPath(COLLECTIONS[1], item, lang, root);
  const where = L(item.location, lang);
  const when = fmtRange(item.date, item.dateEnd, lang);

  return `
          <div class="col-sm-6 col-lg-4 reveal" data-event
               data-date="${esc(item.date)}" data-time="${esc(item.time || "")}"
               data-date-end="${esc(item.dateEnd || "")}" data-time-end="${esc(item.endTime || "")}">
            <article class="axis-card">
              <a href="${esc(url)}" tabindex="-1" aria-hidden="true">${cardMedia(item.image, title, root, false, dateChip(item.date, lang))}</a>
              <div class="card-inner">
                <div class="d-flex justify-content-between align-items-start gap-2">
                  <h3><a href="${esc(url)}" class="card-title-link">${esc(title)}</a></h3>
                  <span class="tag" data-state-tag hidden></span>
                </div>
                <p class="card-meta">
                  ${esc(when)}${item.time ? ` · ${esc(item.time)}` : ""}${where ? `<br>${esc(where)}` : ""}
                </p>
                <p class="card-text">${esc(shorten(L(item.description, lang), 120))}</p>
                <div class="card-actions">
                  <a class="btn btn-outline-primary btn-sm" href="${esc(url)}">${esc(strings.js.openEvent || strings.js.details)}</a>
                </div>
              </div>
            </article>
          </div>`;
}

function newsCard(item, lang, root, eager = false, overflow = false) {
  const strings = dict[lang];
  const title = L(item.title, lang);
  const url = detailPath(COLLECTIONS[0], item, lang, root);
  const where = L(item.location, lang);
  const desc = L(item.description, lang);
  // What js/news.js searches on, lower-cased once here instead of on every keystroke.
  const haystack = [title, where, ...LArr(item.tags, lang).map((tag) => L(tag, lang))]
    .join(" ")
    .toLowerCase();

  return `
          <div class="col-sm-6 col-lg-4 reveal" data-news data-search="${esc(haystack)}"${overflow ? ' data-overflow="1"' : ""}>
            <article class="axis-card">
              <a href="${esc(url)}" tabindex="-1" aria-hidden="true">${cardMedia(item.image, title, root, eager, dateChip(item.date, lang))}</a>
              <div class="card-inner">
                <h3><a href="${esc(url)}" class="card-title-link">${esc(title)}</a></h3>
                <p class="card-meta">
                  ${esc(fmtRange(item.date, item.dateEnd, lang))}${item.time ? ` · ${esc(item.time)}` : ""}${where ? `<br>${esc(where)}` : ""}
                </p>
                <p class="card-text">${esc(isUrl(desc) ? strings.js.externalNews : shorten(desc))}</p>
                <div class="card-actions">
                  <a class="btn btn-outline-primary btn-sm" href="${esc(url)}">${esc(strings.js.openPage || strings.js.readMore)}</a>
                </div>
              </div>
            </article>
          </div>`;
}

function jobCard(item, lang, overflow = false) {
  const strings = dict[lang];
  const isJob = item.type === "job";
  const role = L(item.role || item.description, lang);
  const company = L(item.company, lang);
  const place = L(item.location, lang);
  const posted = fmtDate(item.publishedAt, lang);
  const deadline = item.deadline ? fmtDate(item.deadline, lang) : "";

  return `
          <div class="col-sm-6 col-lg-4 reveal" data-job data-type="${esc(item.type || "job")}"${overflow ? ' data-overflow="1"' : ""}>
            <article class="axis-card is-boxed">
              <div class="card-inner">
                <div>
                  <span class="tag ${isJob ? "tag-soon" : "tag-done"}">${esc(isJob ? strings.js.typeJob : strings.js.typeEdu)}</span>
                </div>
                <h3>${esc(role)}</h3>
                <p class="card-meta">${esc(company)}${place ? ` · ${esc(place)}` : ""}</p>
                ${deadline ? `<p class="card-meta"><strong>${esc(strings.js.deadline)}:</strong> ${esc(deadline)}</p>` : ""}
                <div class="card-actions">
                  <a class="btn btn-outline-primary btn-sm" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(strings.js.openAd)}</a>
                </div>
              </div>
              ${posted ? `<p class="card-foot">${esc(strings.js.published)}: ${esc(posted)}</p>` : ""}
            </article>
          </div>`;
}

/** Writes `inner` into the empty <div id="..."> the page ships. */
function fillList(html, id, render) {
  const re = new RegExp(`<div([^>]*\\bid="${id}"[^>]*)></div>`);
  const match = html.match(re);
  if (!match) return html;
  const attrs = match[1].replace('aria-busy="true"', 'aria-busy="false"');
  const limit = Number((match[1].match(/data-limit="(\d+)"/) || [])[1] || 0);
  const inner = render(limit);
  return html.replace(re, () => `<div${attrs}>${inner}\n        </div>`);
}

/** Same, for a small element that only holds a number or a count. */
function fillText(html, id, text) {
  const re = new RegExp(`(<(\\w+)[^>]*\\bid="${id}"[^>]*>)[^<]*(</\\2>)`);
  return html.replace(re, (m, open, tag, close) => `${open}${esc(text)}${close}`);
}

function prerenderLists(html, lang, root) {
  const news = [...collections.news].sort(newestFirst("date"));
  const events = [...collections.events].sort(newestFirst("date"));
  const openJobs = [...jobs].sort(newestFirst("publishedAt"));
  const strings = dict[lang];

  // Home preview: the newest `limit` events, reordered "soonest first" by
  // js/events.js once it knows today's date.
  html = fillList(html, "events-list", (limit) =>
    (limit ? events.slice(0, limit) : events).map((item) => eventCard(item, lang, root)).join(""),
  );
  html = fillList(html, "news-preview", (limit) =>
    news.slice(0, limit || 3).map((item, i) => newsCard(item, lang, root, i === 0)).join(""),
  );
  html = fillList(html, "news-list", () =>
    news.map((item, i) => newsCard(item, lang, root, i === 0, i >= NEWS_PER_PAGE)).join(""),
  );
  html = fillList(html, "jobs-list", () =>
    openJobs.map((item, i) => jobCard(item, lang, i >= JOBS_PER_PAGE)).join(""),
  );

  const count = news.length;
  html = fillText(html, "news-count", `${count} ${count === 1 ? strings.js.itemOne : strings.js.itemMany}`);
  html = fillText(html, "jobs-count", String(openJobs.length));
  return html;
}

/* ------------------------------------------------------- asset versioning
   Stylesheets and scripts are served with the same name for years, so a
   visitor can sit on a cached base.css after a deploy. Each link gets
   ?v=<hash of the file>, which changes only when the file does — the pages
   stay byte-identical between builds, and the browser refetches exactly the
   files that changed. None of the js files import each other, so one query
   per file is enough.                                                      */

const ASSET_RE = /(?:src|href)="((?:\.\.\/)*(?:css|js|vendor)\/[\w./-]+\.(?:css|js))"/g;
const assetHashes = new Map();

function assetVersion(relPath) {
  if (!assetHashes.has(relPath)) {
    const hash = createHash("sha256").update(readFileSync(path.join(ROOT, relPath))).digest("hex");
    assetHashes.set(relPath, hash.slice(0, 8));
  }
  return assetHashes.get(relPath);
}

function stampAssets(html, outPath) {
  const dir = path.posix.dirname(outPath);
  return html.replace(ASSET_RE, (whole, rel) => {
    const target = path.posix.normalize(path.posix.join(dir === "." ? "" : dir, rel));
    if (!existsSync(path.join(ROOT, target))) return whole;
    return whole.replace(`"${rel}"`, `"${rel}?v=${assetVersion(target)}"`);
  });
}

/* ------------------------------------------------------------ page writing */

const outputs = [];

/** The one place that turns content into a finished HTML file. */
async function renderPage({ outPath, lang, altPaths, meta, content, jsonld = [] }) {
  const strings = flatten(dict[lang]);
  const root = rootFor(outPath);

  const paths = {};
  for (const page of PAGES) paths[`p.${page.id}`] = page[lang];

  const homePath = PAGES.find((p) => p.id === "home")[lang];
  const feedPath = lang === "hr" ? "feed.xml" : "en/feed.xml";
  const base = { ...strings, ...paths, root, home: homePath, lang, site: SITE, feedPath };

  // header: mark the active menu item, then build the language switch
  let header = fill(headerTpl, base);
  const activePath = meta.activeId ? PAGES.find((p) => p.id === meta.activeId)?.[lang] : null;
  if (activePath) {
    header = header.replace(
      `<a class="nav-link" href="${root}${activePath}">`,
      `<a class="nav-link active" aria-current="page" href="${root}${activePath}">`,
    );
  }

  const langLinks = LANGS.map((code) => {
    const label = dict[lang].nav[code === "hr" ? "toHr" : "toEn"];
    const short = code.toUpperCase();
    if (code === lang) {
      return `              <a aria-current="true" hreflang="${code}" lang="${code}" title="${esc(label)}">${short}</a>`;
    }
    return `              <span class="sep" aria-hidden="true">/</span>\n              <a href="${root}${altPaths[code]}" hreflang="${code}" lang="${code}" title="${esc(label)}">${short}</a>`;
  }).join("\n");
  header = header.replace("{{langLinks}}", langLinks);

  const alternates = [
    ...LANGS.map(
      (code) => `    <link rel="alternate" hreflang="${code}" href="${absolute(altPaths[code])}" />`,
    ),
    `    <link rel="alternate" hreflang="x-default" href="${absolute(altPaths.hr)}" />`,
    `    <link rel="alternate" type="application/rss+xml" title="${esc(dict[lang].feed.title)}" href="${root}${lang === "hr" ? "feed.xml" : "en/feed.xml"}" />`,
  ].join("\n");

  const config = JSON.stringify({
    lang: dict[lang].lang,
    locale: dict[lang].locale,
    base: root,
    paths: {
      news: `${COLLECTIONS[0].dir[lang]}/`,
      events: `${COLLECTIONS[1].dir[lang]}/`,
    },
    t: dict[lang].js,
  });

  const scripts = (meta.scripts || [])
    .map((name) => `    <script type="module" src="${root}js/${name}"></script>`)
    .join("\n");

  const html = fill(shell, {
    ...base,
    title: meta.title,
    description: meta.description,
    canonical: absolute(outPath),
    alternates,
    robots: meta.robots || "index, follow",
    iconsCss: ICONS_CSS.replace("{{root}}", root),
    bodyClass: `page-${meta.bodyId || meta.activeId || "detail"}`,
    ogType: meta.ogType || "website",
    ogImage: meta.ogImage ? `${SITE}/${meta.ogImage}` : `${SITE}/images/brand/og-cover.jpg`,
    jsonld: jsonld.length
      ? `    <script type="application/ld+json">\n${JSON.stringify(jsonld.length === 1 ? jsonld[0] : jsonld, null, 2)}\n    </script>`
      : "",
    config,
    header,
    footer: fill(footerTpl, base),
    content: prerenderLists(fill(content, base), lang, root),
    scripts,
  });

  const out = path.join(ROOT, outPath);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, stampAssets(html, outPath), "utf8");
  outputs.push(outPath);
}

/* ---------------------------------------------------------------- JSON-LD  */

const organisation = (lang) => ({
  "@type": "Organization",
  "@id": `${SITE}/#organization`,
  name: "Alumni AXIS Split",
  alternateName: dict[lang].brand.legalName,
  url: SITE,
  logo: `${SITE}/images/brand/logo.png`,
  email: "alumniaxis.st@gmail.com",
  taxID: "80913220993",
  sameAs: ["https://www.facebook.com/profile.php?id=61584468421064"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Kopilica 5",
    postalCode: "21000",
    addressLocality: "Split",
    addressCountry: "HR",
  },
  parentOrganization: {
    "@type": "CollegeOrUniversity",
    name: "Sveučilište u Splitu",
    url: "https://www.unist.hr",
  },
});

function breadcrumbs(trail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: absolute(step.path),
    })),
  };
}

/* ------------------------------------------------------- standing pages */

for (const lang of LANGS) {
  for (const page of PAGES) {
    const file = path.join(SRC, "pages", lang, `${page.id}.html`);
    if (!existsSync(file)) {
      console.warn(`skipped  ${lang}/${page.id}: no source file`);
      continue;
    }
    const { meta, body } = frontMatter(await read(file));
    const altPaths = Object.fromEntries(LANGS.map((code) => [code, page[code]]));

    const jsonld = [];
    if (page.id === "home") {
      jsonld.push({
        "@context": "https://schema.org",
        "@graph": [
          organisation(lang),
          {
            "@type": "WebSite",
            "@id": `${SITE}/#website`,
            url: SITE,
            name: "Alumni AXIS Split",
            inLanguage: lang,
            publisher: { "@id": `${SITE}/#organization` },
          },
        ],
      });
    } else if (page.id === "about" || page.id === "contact") {
      jsonld.push({ "@context": "https://schema.org", ...organisation(lang) });
    }

    await renderPage({
      outPath: page[lang],
      lang,
      altPaths,
      meta: { ...meta, activeId: page.nav === false ? null : page.id, bodyId: page.id },
      content: body,
      jsonld,
    });
  }
}

/* --------------------------------------------------------- detail pages */

// Generated folders are rebuilt from scratch, so a renamed slug cannot leave
// a stale page behind.
for (const collection of COLLECTIONS) {
  for (const lang of LANGS) {
    await rm(path.join(ROOT, collection.dir[lang]), { recursive: true, force: true });
  }
}

for (const collection of COLLECTIONS) {
  const items = collections[collection.key];
  const indexPage = PAGES.find((p) => p.id === collection.index);

  for (const lang of LANGS) {
    const strings = dict[lang];

    for (const item of items) {
      const outPath = `${collection.dir[lang]}/${item.slug[lang]}.html`;
      const altPaths = Object.fromEntries(
        LANGS.map((code) => [code, `${collection.dir[code]}/${item.slug[code]}.html`]),
      );

      const title = L(item.title, lang);
      const where = L(item.location, lang);
      const descRaw = L(item.description, lang);
      const external = isUrl(descRaw) ? descRaw : item.url || "";
      const when = fmtRange(item.date, item.dateEnd, lang);
      const time = item.time ? `${item.time}${item.endTime ? `–${item.endTime}` : ""}` : "";

      const bodyHtml = isUrl(descRaw)
        ? `<p>${esc(strings.js.externalNews)}</p>`
        : paragraphs(descRaw) || `<p>${esc(strings.article.noText)}</p>`;

      const blocks = [];
      const highlights = LArr(item.highlights, lang);
      if (highlights.length) {
        blocks.push(`<h2 class="h5 mt-4">${esc(strings.js.topics)}</h2>
              <ul>${highlights.map((h) => `<li>${esc(L(h, lang))}</li>`).join("")}</ul>`);
      }
      const agenda = LArr(item.agenda, lang);
      if (agenda.length) {
        blocks.push(`<h2 class="h5 mt-4">${esc(strings.article.programme)}</h2>
              <ul class="data-list">${agenda
                .map((a) =>
                  a && typeof a === "object"
                    ? `<li>${a.time ? `<span class="k">${esc(L(a.time, lang))}</span>` : ""}<span>${esc(L(a.topic, lang))}</span></li>`
                    : `<li>${esc(L(a, lang))}</li>`,
                )
                .join("")}</ul>`);
      }
      const board = LArr(item.board, lang);
      if (board.length) {
        blocks.push(`<h2 class="h5 mt-4">${esc(strings.article.board)}</h2>
              <ul class="data-list">${board
                .map(
                  (b) =>
                    `<li><span class="k">${esc(L(b.role, lang))}</span><span>${esc(L(b.name, lang))}</span></li>`,
                )
                .join("")}</ul>`);
      }

      const facts = [
        when && `<li><span class="k">${esc(strings.article.date)}</span><span>${esc(when)}</span></li>`,
        time && `<li><span class="k">${esc(strings.article.time)}</span><span>${esc(time)}</span></li>`,
        where && `<li><span class="k">${esc(strings.article.place)}</span><span>${esc(where)}</span></li>`,
      ]
        .filter(Boolean)
        .join("\n                ");

      const cta = external
        ? `<a class="btn btn-outline-primary btn-sm mt-3" href="${esc(external)}" target="_blank" rel="noopener">${esc(strings.js.moreInfo)}</a>`
        : "";

      const shareUrl = encodeURIComponent(absolute(outPath));
      const image = item.image || "images/brand/og-cover.jpg";

      const content = fill(articleTpl, {
        articleTitle: esc(title),
        articleKicker: esc(strings.article[collection.key]),
        articleMeta: esc([when, time, where].filter(Boolean).join(" · ")),
        articleImage: esc(image),
        articleImageSmall: esc(image.replace(/\.webp$/, "-700.webp")),
        articleImageAlt: esc(title),
        articleBody: bodyHtml,
        articleBlocks: blocks.join("\n              "),
        articleFacts: facts,
        articleCta: cta,
        indexPath: indexPage[lang],
        backLabel: esc(strings.article.back[collection.key]),
        detailsLabel: esc(strings.article.details),
        shareLabel: esc(strings.article.share),
        copyLabel: esc(strings.article.copy),
        shareFacebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
        shareLinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
        shareMail: `mailto:?subject=${encodeURIComponent(title)}&body=${shareUrl}`,
      });

      const jsonld = [];
      if (collection.schema === "Event") {
        jsonld.push({
          "@context": "https://schema.org",
          "@type": "Event",
          name: title,
          startDate: item.time ? `${item.date}T${item.time}` : item.date,
          endDate: item.dateEnd || item.date,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          inLanguage: lang,
          url: absolute(outPath),
          image: `${SITE}/${image}`,
          description: isUrl(descRaw) ? title : descRaw.slice(0, 300),
          location: {
            "@type": "Place",
            name: where || "Split",
            address: { "@type": "PostalAddress", addressLocality: "Split", addressCountry: "HR" },
          },
          organizer: { "@id": `${SITE}/#organization` },
        });
      } else {
        jsonld.push({
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: title,
          datePublished: item.date,
          dateModified: item.dateEnd || item.date,
          inLanguage: lang,
          url: absolute(outPath),
          image: `${SITE}/${image}`,
          description: isUrl(descRaw) ? title : descRaw.slice(0, 300),
          author: { "@id": `${SITE}/#organization` },
          publisher: { "@id": `${SITE}/#organization` },
        });
      }
      jsonld.push(
        breadcrumbs([
          { name: dict[lang].nav.home, path: PAGES[0][lang] },
          { name: dict[lang].nav[collection.index], path: indexPage[lang] },
          { name: title, path: outPath },
        ]),
      );

      await renderPage({
        outPath,
        lang,
        altPaths,
        meta: {
          title: `${title} — Alumni AXIS Split`,
          description: (isUrl(descRaw) ? title : descRaw.replace(/\s+/g, " ").slice(0, 155)) || title,
          icons: true,
          ogType: "article",
          ogImage: image,
          activeId: collection.index,
          bodyId: "article",
        },
        content,
        jsonld,
      });
    }
  }
}

/* ------------------------------------------------------------- redirects */

for (const { from, to } of REDIRECTS) {
  const target = absolute(to);
  const out = path.join(ROOT, from);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(
    out,
    `<!doctype html>
<html lang="hr">
  <head>
    <meta charset="utf-8" />
    <title>Preusmjeravanje / Redirecting…</title>
    <meta name="robots" content="noindex" />
    <link rel="canonical" href="${target}" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <script>location.replace(${JSON.stringify(target)});</script>
  </head>
  <body>
    <p>Stranica je premještena / This page has moved: <a href="${target}">${target}</a></p>
  </body>
</html>
`,
    "utf8",
  );
  outputs.push(from);
}

/* ------------------------------------------------------------------- 404 */

const notFound = await read(path.join(SRC, "partials/404.html"));
await writeFile(path.join(ROOT, "404.html"), fill(notFound, { site: SITE }), "utf8");
outputs.push("404.html");

/* ------------------------------------------------------------- RSS feeds */

for (const lang of LANGS) {
  const feedPath = lang === "hr" ? "feed.xml" : "en/feed.xml";
  const newsDir = COLLECTIONS[0].dir[lang];
  const items = [...collections.news]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20)
    .map((item) => {
      const url = absolute(`${newsDir}/${item.slug[lang]}.html`);
      const desc = L(item.description, lang);
      return `    <item>
      <title>${esc(L(item.title, lang))}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${item.date}T12:00`).toUTCString()}</pubDate>
      <description>${esc(isUrl(desc) ? L(item.title, lang) : desc.replace(/\s+/g, " ").slice(0, 400))}</description>
    </item>`;
    })
    .join("\n");

  await writeFile(
    path.join(ROOT, feedPath),
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(dict[lang].feed.title)}</title>
    <link>${absolute(PAGES.find((p) => p.id === "news")[lang])}</link>
    <description>${esc(dict[lang].feed.description)}</description>
    <language>${lang}</language>
    <atom:link href="${SITE}/${feedPath}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`,
    "utf8",
  );
  outputs.push(feedPath);
}

/* --------------------------------------------------------------- sitemap */

// lastmod comes from the content itself, so two builds of the same sources are
// byte-identical (the CI check depends on that) and Google sees a real date.
const allDates = Object.values(collections)
  .flat()
  .flatMap((item) => [item.date, item.dateEnd])
  .filter(Boolean)
  .sort();
const today = allDates.at(-1) || new Date().toISOString().slice(0, 10);
const entries = [];

for (const page of PAGES) {
  for (const lang of LANGS) {
    if (!outputs.includes(page[lang])) continue;
    entries.push({
      loc: absolute(page[lang]),
      alt: LANGS.map((code) => [code, absolute(page[code])]),
      freq: page.id === "home" || page.id === "news" ? "weekly" : "monthly",
      priority: page.id === "home" ? "1.0" : "0.7",
    });
  }
}

for (const collection of COLLECTIONS) {
  for (const item of collections[collection.key]) {
    for (const lang of LANGS) {
      entries.push({
        loc: absolute(`${collection.dir[lang]}/${item.slug[lang]}.html`),
        alt: LANGS.map((code) => [code, absolute(`${collection.dir[code]}/${item.slug[code]}.html`)]),
        freq: "yearly",
        priority: "0.6",
        lastmod: item.dateEnd || item.date,
      });
    }
  }
}

await writeFile(
  path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .map(
    (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod || today}</lastmod>
    <changefreq>${entry.freq}</changefreq>
    <priority>${entry.priority}</priority>
${entry.alt.map(([code, href]) => `    <xhtml:link rel="alternate" hreflang="${code}" href="${href}"/>`).join("\n")}
  </url>`,
  )
  .join("\n")}
</urlset>
`,
  "utf8",
);

await writeFile(
  path.join(ROOT, "robots.txt"),
  `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`,
  "utf8",
);

/* ------------------------------------------------- local link integrity */

const files = new Set();
async function walk(dir, prefix = "") {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "src" || entry.name === "node_modules") continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await walk(path.join(dir, entry.name), rel);
    else files.add(rel);
  }
}
await walk(ROOT);

const problems = [];
for (const outPath of outputs) {
  if (!outPath.endsWith(".html")) continue;
  const html = await read(path.join(ROOT, outPath));
  const dir = path.posix.dirname(outPath);
  // The ?v=<hash> a stylesheet or script carries is stripped before the file
  // is looked up, so versioned links are still checked.
  for (const match of html.matchAll(
    /(?:src|href)="((?:\.\.\/)*[\w][\w./-]*\.(?:webp|png|svg|jpg|jpeg|pdf|css|js|html|xml))(?:\?[^"]*)?"/g,
  )) {
    const target = path.posix.normalize(path.posix.join(dir === "." ? "" : dir, match[1]));
    if (files.has(target)) continue;
    const caseTwin = [...files].find((f) => f.toLowerCase() === target.toLowerCase());
    problems.push(
      caseTwin
        ? `${outPath} → ${match[1]}   (postoji kao "${caseTwin}": razlika u velikim/malim slovima — Git na Windowsu to ne vidi; vidi README §6b)`
        : `${outPath} → ${match[1]}`,
    );
  }
}

console.log(`${outputs.filter((o) => o.endsWith(".html")).length} pages, 2 feeds, sitemap, robots`);
if (problems.length) {
  console.log(`\n${problems.length} broken local link(s):`);
  problems.forEach((p) => console.log(`  ${p}`));
  process.exitCode = 1;
} else {
  console.log("no broken local links");
}
