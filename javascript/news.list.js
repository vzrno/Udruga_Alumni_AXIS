import { fetchNews } from "./news.service.js";

("use strict");

function normalizeNewsItem(item) {
  return {
    id: item?.id,
    title: item?.title ?? "Bez naslova",
    date: item?.date ?? "",
    dateEnd: item?.dateEnd ?? null,
    time: item?.time ?? "",
    location: item?.location ?? "",
    image: item?.image || "images/placeholder.svg",
    description: item?.description ?? "",
    tags: Array.isArray(item?.tags) ? item.tags : [],
    agenda: Array.isArray(item?.agenda) ? item.agenda : [],
    board: Array.isArray(item?.board) ? item.board : [],
  };
}

const container = document.getElementById("novosti-container");
const searchInput = document.getElementById("newsSearch");

const ITEMS_PER_PAGE = 6;

let news = [];
let filteredNews = [];
let currentPage = 1;

init();

async function init() {
  const rawNews = await fetchNews();
  news = rawNews.map(normalizeNewsItem);
  filteredNews = news;

  // Remove loading spinner if present
  document.getElementById("news-loading")?.remove();

  wireEvents();
  render();
}

function wireEvents() {
  // Search
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      applyFilter(e.target.value || "");
    });
  }

  // Open modal by delegated click
  document.addEventListener("click", (e) => {
    const button = e.target.closest("[data-id]");
    if (!button) return;

    const item = news.find((n) => String(n.id) === String(button.dataset.id));
    if (!item) return;

    fillModal(item);
  });

  // Pagination delegated click
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn) return;

    const page = Number(btn.dataset.page);
    if (!Number.isFinite(page)) return;

    currentPage = page;
    render();
  });
}

/* ================= FILTER ================= */

function applyFilter(value) {
  const q = String(value).trim().toLowerCase();

  if (!q) {
    filteredNews = news;
  } else {
    filteredNews = news.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const location = (item.location || "").toLowerCase();
      const tags = Array.isArray(item.tags) ? item.tags : [];

      return (
        title.includes(q) ||
        location.includes(q) ||
        tags.some((tag) => String(tag).toLowerCase().includes(q))
      );
    });
  }

  currentPage = 1;
  render();
}

/* ================= RENDER ================= */

function render() {
  // Remove old pagination(s)
  document.querySelectorAll(".pagination").forEach((p) => p.remove());

  if (!container) return;
  container.innerHTML = "";

  renderCards();
  renderPagination();
}

function renderCards() {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const items = filteredNews.slice(start, start + ITEMS_PER_PAGE);

  if (!items.length) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning mb-0">
          Nema rezultata za prikaz.
        </div>
      </div>
    `;
    return;
  }

  items.forEach((item) => {
    container.insertAdjacentHTML("beforeend", createCard(item));
  });

  // Image fallback (no inline handlers)
  container.querySelectorAll("img[data-fallback]").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        img.src = img.getAttribute("data-fallback") || "images/placeholder.svg";
      },
      { once: true },
    );
  });
}

function createCard(item) {
  const desc = item.description || "";
  const shortDesc = desc.length > 100 ? desc.slice(0, 100) + "..." : desc;

  const safeTitle = escapeHtml(item.title);

  return `
    <div class="col-md-6 col-lg-4">
      <article class="card axis-card h-100 shadow-sm">
        <img 
          src="${item.image}" 
          class="card-img-top" data-fallback="images/placeholder.svg"
          alt="${safeTitle}"
           >
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${safeTitle}</h5>

          <p class="axis-meta">
            ${item.date ? `📅 ${escapeHtml(item.date)}` : ""}
            ${item.time ? ` • ⏰ ${escapeHtml(item.time)}` : ""}
            ${item.location ? `<br>📍 ${escapeHtml(item.location)}` : ""}
          </p>

          <p class="card-text text-muted">${escapeHtml(shortDesc)}</p>

          <button
            class="btn btn-axis mt-auto"
            data-bs-toggle="modal"
            data-bs-target="#newsModal"
            data-id="${escapeHtml(String(item.id))}"
          >
            Pročitaj više
          </button>
        </div>
      </article>
    </div>
  `;
}

/* ================= PAGINATION ================= */

function renderPagination() {
  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
  if (totalPages <= 1) return;

  let html = `
    <nav class="mt-5">
      <ul class="pagination justify-content-center">
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${i === currentPage ? "active" : ""}">
        <button class="page-link" type="button" data-page="${i}">
          ${i}
        </button>
      </li>
    `;
  }

  html += `</ul></nav>`;

  container.insertAdjacentHTML("afterend", html);
}

/* ================= MODAL ================= */

function fillModal(item) {
  document.getElementById("modalTitle").textContent = item.title;

  const modalImage = document.getElementById("modalImage");
  if (modalImage) {
    modalImage.src = item.image;
    modalImage.onerror = () => (modalImage.src = "images/placeholder.svg");
  }

  const meta = [item.date, item.time, item.location]
    .filter(Boolean)
    .join(" • ");
  const metaEl = document.getElementById("modalMeta");
  if (metaEl) metaEl.textContent = meta;

  // If description is a URL → clickable link
  const descEl = document.getElementById("modalDescription");
  if (descEl) {
    const desc = String(item.description || "");
    if (desc.startsWith("http")) {
      descEl.innerHTML = `<a href="${escapeAttr(desc)}" target="_blank" rel="noopener">Otvori poveznicu</a>`;
    } else {
      descEl.textContent = desc;
    }
  }

  setSection("modalAgenda", renderAgenda(item.agenda));
  setSection("modalBoard", renderBoard(item.board));
}

/**
 * Hides/shows the whole “block” around the section in your modal:
 * <hr><h6>...<div id="modalAgenda"></div>
 * <hr><h6>...<div id="modalBoard"></div>
 */
function setSection(id, html) {
  const el = document.getElementById(id);
  if (!el) return;

  const show = Boolean(html);
  el.innerHTML = html;

  // Hide this section's own <div>
  el.classList.toggle("d-none", !show);

  // Also hide the preceding <h6> and <hr> if present
  const h6 = findPrev(el, "H6");
  const hr = findPrev(el, "HR");

  if (h6) h6.classList.toggle("d-none", !show);
  if (hr) hr.classList.toggle("d-none", !show);
}

function findPrev(el, tagName) {
  let node = el.previousElementSibling;
  while (node) {
    if (node.tagName === tagName) return node;
    // stop if we hit another content section
    if (node.id && node.id.startsWith("modal")) break;
    node = node.previousElementSibling;
  }
  return null;
}

function renderAgenda(agenda) {
  if (!Array.isArray(agenda) || !agenda.length) return "";

  return `
    <ul class="list-group list-group-flush">
      ${agenda
        .map((a) =>
          typeof a === "string"
            ? `<li class="list-group-item">${escapeHtml(a)}</li>`
            : `<li class="list-group-item">
                <strong>${escapeHtml(a?.time ?? "")}</strong> – ${escapeHtml(a?.topic ?? "")}
              </li>`,
        )
        .join("")}
    </ul>
  `;
}

function renderBoard(board) {
  if (!Array.isArray(board) || !board.length) return "";

  return `
    <ul class="list-unstyled">
      ${board
        .map(
          (b) => `
        <li>
          👤 <strong>${escapeHtml(b?.name ?? "")}</strong> – ${escapeHtml(b?.role ?? "")}
        </li>`,
        )
        .join("")}
    </ul>
  `;
}

/* ================= tiny escaping helpers ================= */

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  // good enough for href attributes here
  return escapeHtml(str).replaceAll("`", "&#096;");
}
