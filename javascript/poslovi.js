"use strict";

/* ================= ELEMENTS ================= */
const container = document.getElementById("poslovi-container");
const paginationEl = document.getElementById("pagination");
const filterEl = document.getElementById("typeFilter");

/* ================= CONFIG ================= */
const ITEMS_PER_PAGE = 6;

/* ================= STATE ================= */
let data = [];
let currentPage = 1;
let currentFilter = "all";

/* ================= LOAD DATA ================= */
async function loadData() {
  if (!container) return;

  try {
    const res = await fetch("data/jobs.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    data = Array.isArray(json) ? json : [];
  } catch (err) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger">
          Greška pri učitavanju podataka.
        </div>
      </div>
    `;
    return;
  } finally {
    document.getElementById("loading")?.remove();
  }

  render();
}

/* ================= HELPERS ================= */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date > new Date() ? "Uskoro" : date.toLocaleDateString("hr-HR");
}

function getFilteredData() {
  if (currentFilter === "all") return data;
  return data.filter((item) => item.type === currentFilter);
}

function paginate(items) {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  return items.slice(start, start + ITEMS_PER_PAGE);
}

/* ================= UI ================= */
function createCard(item) {
  const isJob = item.type === "job";

  // FIX: bg-axis-primary doesn't exist in your CSS → use Bootstrap bg-primary instead
  const badgeClass = isJob ? "bg-primary" : "bg-axis-secondary";
  const badgeText = isJob ? "Posao" : "Edukacija";

  return `
    <div class="col">
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <span class="badge ${badgeClass} mb-2">
            ${badgeText}
          </span>

          <h3 class="h5 mb-1">${escapeHtml(item.company || "")}</h3>
          <p class="small text-muted mb-2">${escapeHtml(item.location || "")}</p>

          <p class="card-text text-muted flex-grow-1">
            ${escapeHtml(item.description || "")}
          </p>

          <a
            href="${escapeAttr(item.url || "#")}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-axis mt-auto"
          >
            Saznaj više
          </a>
        </div>

        <div class="card-footer small text-muted">
          Objavljeno: ${formatDate(item.publishedAt)}
        </div>
      </div>
    </div>
  `;
}

function renderPagination(totalItems) {
  if (!paginationEl) return;

  paginationEl.innerHTML = "";
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentPage ? "active" : ""}`;
    li.innerHTML = `<button class="page-link" type="button">${i}</button>`;
    li.addEventListener("click", () => {
      currentPage = i;
      render();
    });
    paginationEl.appendChild(li);
  }
}

/* ================= RENDER ================= */
function render() {
  if (!container) return;

  container.innerHTML = "";

  const filtered = getFilteredData().sort(
    (a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
  );

  const paginated = paginate(filtered);

  if (!filtered.length) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning">
          Trenutno nema dostupnog sadržaja.
        </div>
      </div>
    `;
    if (paginationEl) paginationEl.innerHTML = "";
    return;
  }

  paginated.forEach((item) => {
    container.insertAdjacentHTML("beforeend", createCard(item));
  });

  renderPagination(filtered.length);
}

/* ================= EVENTS ================= */
if (filterEl) {
  filterEl.addEventListener("change", (e) => {
    currentFilter = e.target.value;
    currentPage = 1;
    render();
  });
}

/* ================= INIT ================= */
loadData();

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
  return escapeHtml(str).replaceAll("`", "&#096;");
}
