/* Jobs and training list: type filter + pagination. */

import {
  L, t, escapeHtml, loadJson, formatDate, stateMsg, safeUrl, toDate, reveal,
} from "./util.js";

const listEl = document.getElementById("jobs-list");
if (listEl) init();

const PER_PAGE = 9;
const filterEl = document.getElementById("jobs-filter");
const pagerEl = document.getElementById("jobs-pager");
const countEl = document.getElementById("jobs-count");

let jobs = [];
let type = "all";
let page = 1;

async function init() {
  try {
    jobs = (await loadJson("jobs.json")).sort(
      (a, b) => (toDate(b.publishedAt) || 0) - (toDate(a.publishedAt) || 0),
    );
  } catch (err) {
    console.error(err);
    listEl.innerHTML = stateMsg(t.loadError || "Podatke nije bilo moguće učitati.");
    return;
  }

  filterEl?.addEventListener("change", () => {
    type = filterEl.value;
    page = 1;
    render();
  });

  pagerEl?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn) return;
    page = Number(btn.dataset.page) || 1;
    render();
  });

  render();
}

/** A listing disappears the day after its deadline; without a deadline it stays. */
function isOpen(job) {
  if (!job.deadline) return true;
  const end = toDate(job.deadline);
  return !end || end.getTime() + 86400000 > Date.now();
}

function render() {
  const open = jobs.filter(isOpen);
  const items = type === "all" ? open : open.filter((j) => j.type === type);
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  page = Math.min(page, pages);

  if (countEl) countEl.textContent = items.length ? `${items.length}` : "0";

  if (!items.length) {
    listEl.innerHTML = stateMsg(t.noJobs || "Trenutno nema otvorenih objava.");
    if (pagerEl) pagerEl.innerHTML = "";
    return;
  }

  const start = (page - 1) * PER_PAGE;
  listEl.innerHTML = items.slice(start, start + PER_PAGE).map(card).join("");
  reveal(listEl);

  if (pagerEl) {
    if (pages <= 1) {
      pagerEl.innerHTML = "";
    } else {
      let html = "";
      for (let i = 1; i <= pages; i++) {
        html += `<li class="page-item ${i === page ? "active" : ""}">
          <button type="button" class="page-link" data-page="${i}"
            ${i === page ? 'aria-current="page"' : ""}>${i}</button></li>`;
      }
      pagerEl.innerHTML = html;
    }
  }
}

function card(item) {
  const isJob = item.type === "job";
  const role = L(item.role || item.description);
  const company = L(item.company);
  const place = L(item.location);
  const posted = formatDate(item.publishedAt);
  const deadline = item.deadline ? formatDate(item.deadline) : "";

  return `
    <div class="col-sm-6 col-lg-4 reveal">
      <article class="axis-card is-boxed">
        <div class="card-inner">
          <div>
            <span class="tag ${isJob ? "tag-soon" : "tag-done"}">
              ${escapeHtml(isJob ? t.typeJob || "Posao" : t.typeEdu || "Edukacija")}
            </span>
          </div>
          <h3>${escapeHtml(role)}</h3>
          <p class="card-meta">${escapeHtml(company)}${place ? ` · ${escapeHtml(place)}` : ""}</p>
          ${
            deadline
              ? `<p class="card-meta"><strong>${escapeHtml(t.deadline || "Rok za prijavu")}:</strong> ${escapeHtml(deadline)}</p>`
              : ""
          }
          <div class="card-actions">
            <a class="btn btn-outline-primary btn-sm" href="${safeUrl(item.url)}"
               target="_blank" rel="noopener noreferrer">
              ${escapeHtml(t.openAd || "Otvori oglas")}
            </a>
          </div>
        </div>
        ${posted ? `<p class="card-foot">${escapeHtml(t.published || "Objavljeno")}: ${escapeHtml(posted)}</p>` : ""}
      </article>
    </div>`;
}
