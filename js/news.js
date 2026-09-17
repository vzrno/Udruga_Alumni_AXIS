/* News. Drives two containers:
   #news-list    — full archive with search + pagination (news page)
   #news-preview — newest items, no controls (home page)
   Cards link to the generated detail page for each item. */

import {
  L, LArr, t, escapeHtml, loadJson, formatDateRange, media, wireFallbacks,
  truncate, stateMsg, isUrl, toDate, detailUrl, safeUrl, dateChip, reveal,
} from "./util.js";

const listEl = document.getElementById("news-list");
const previewEl = document.getElementById("news-preview");
if (listEl || previewEl) init();

const PER_PAGE = 6;
const searchEl = document.getElementById("news-search");
const pagerEl = document.getElementById("news-pager");
const countEl = document.getElementById("news-count");

let news = [];
let filtered = [];
let page = 1;

async function init() {
  try {
    news = (await loadJson("news.json")).sort(
      (a, b) => (toDate(b.date) || 0) - (toDate(a.date) || 0),
    );
  } catch (err) {
    console.error(err);
    (listEl || previewEl).innerHTML = stateMsg(t.loadError);
    return;
  }

  filtered = news;

  if (previewEl) {
    const limit = Number(previewEl.dataset.limit || 3);
    previewEl.innerHTML = news.slice(0, limit).map((item, i) => card(item, i === 0)).join("");
    previewEl.setAttribute("aria-busy", "false");
    wireFallbacks(previewEl);
    reveal(previewEl);
  }

  if (listEl) {
    searchEl?.addEventListener("input", () => applySearch(searchEl.value));
    pagerEl?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn) return;
      page = Number(btn.dataset.page) || 1;
      render();
      listEl.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    render();
  }
}

function applySearch(value) {
  const q = String(value || "").trim().toLowerCase();
  filtered = !q
    ? news
    : news.filter((item) => {
        const hay = [L(item.title), L(item.location), ...LArr(item.tags).map(L)]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
  page = 1;
  render();
}

function render() {
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  page = Math.min(page, pages);
  listEl.setAttribute("aria-busy", "false");

  if (countEl) {
    countEl.textContent = total ? `${total} ${total === 1 ? t.itemOne : t.itemMany}` : "";
  }

  if (!total) {
    listEl.innerHTML = stateMsg(t.noResults);
    if (pagerEl) pagerEl.innerHTML = "";
    return;
  }

  const start = (page - 1) * PER_PAGE;
  listEl.innerHTML = filtered.slice(start, start + PER_PAGE).map((i) => card(i)).join("");
  wireFallbacks(listEl);
  reveal(listEl);
  renderPager(pages);
}

function renderPager(pages) {
  if (!pagerEl) return;
  if (pages <= 1) {
    pagerEl.innerHTML = "";
    return;
  }
  let html = "";
  for (let i = 1; i <= pages; i++) {
    html += `
      <li class="page-item ${i === page ? "active" : ""}">
        <button type="button" class="page-link" data-page="${i}"
          ${i === page ? 'aria-current="page"' : ""}>${i}</button>
      </li>`;
  }
  pagerEl.innerHTML = html;
}

function card(item, eager = false) {
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
            ${item.time ? ` · ${escapeHtml(item.time)}` : ""}
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
