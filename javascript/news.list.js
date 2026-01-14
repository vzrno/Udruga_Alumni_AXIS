function normalizeNewsItem(item) {
  return {
    id: item.id,
    title: item.title ?? "Bez naslova",
    date: item.date ?? "",
    dateEnd: item.dateEnd ?? null,
    time: item.time ?? "",
    location: item.location ?? "",
    image: item.image || "images/placeholder.jpg",
    description: item.description ?? "",
    tags: Array.isArray(item.tags) ? item.tags : [],
    agenda: Array.isArray(item.agenda) ? item.agenda : [],
    board: Array.isArray(item.board) ? item.board : [],
  };
}

import { fetchNews } from "./news.service.js";

const container = document.getElementById("novosti-container");
const ITEMS_PER_PAGE = 6;

let news = [];
let filteredNews = [];
let currentPage = 1;

init();

async function init() {
  const rawNews = await fetchNews();
  news = rawNews.map(normalizeNewsItem);
  filteredNews = news;
  render();
}

/* ================= RENDER ================= */
function render() {
  document.querySelectorAll(".pagination").forEach((p) => p.remove());
  container.innerHTML = "";
  renderCards();
  renderPagination();
}

function renderCards() {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const items = filteredNews.slice(start, start + ITEMS_PER_PAGE);

  items.forEach((item) => {
    container.insertAdjacentHTML("beforeend", createCard(item));
  });
}

function createCard(item) {
  const shortDesc =
    item.description.length > 100
      ? item.description.slice(0, 100) + "..."
      : item.description;

  return `
    <div class="col-md-6 col-lg-4">
      <article class="card axis-card h-100 shadow-sm">
        <img 
          src="${item.image}" 
          class="card-img-top" 
          alt="${item.title}"
          onerror="this.src='images/placeholder.jpg'"
        >
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${item.title}</h5>

          <p class="axis-meta">
            ${item.date ? `📅 ${item.date}` : ""}
            ${item.time ? ` • ⏰ ${item.time}` : ""}
            ${item.location ? `<br>📍 ${item.location}` : ""}
          </p>

          <p class="card-text text-muted">${shortDesc}</p>

          <button
            class="btn btn-axis mt-auto"
            data-bs-toggle="modal"
            data-bs-target="#newsModal"
            data-id="${item.id}"
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
        <button class="page-link" onclick="setPage(${i})">${i}</button>
      </li>
    `;
  }

  html += "</ul></nav>";
  container.insertAdjacentHTML("afterend", html);
}

window.setPage = (page) => {
  currentPage = page;
  render();
};

/* ================= FILTER ================= */

window.filterNews = (value) => {
  const q = value.toLowerCase();

  filteredNews = news.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.tags?.some((tag) => tag.includes(q))
  );

  currentPage = 1;
  render();
};

/* ================= MODAL ================= */

document.addEventListener("click", (e) => {
  const button = e.target.closest("[data-id]");
  if (!button) return;

  const item = news.find((n) => n.id == button.dataset.id);
  fillModal(item);
});

function fillModal(item) {
  document.getElementById("modalTitle").textContent = item.title;

  const modalImage = document.getElementById("modalImage");
  modalImage.src = item.image;
  modalImage.onerror = () => (modalImage.src = "images/placeholder.jpg");

  document.getElementById("modalMeta").textContent = [
    item.date,
    item.time,
    item.location,
  ]
    .filter(Boolean)
    .join(" • ");

  // If description is a URL → clickable link
  const descEl = document.getElementById("modalDescription");
  if (item.description.startsWith("http")) {
    descEl.innerHTML = `<a href="${item.description}" target="_blank" rel="noopener">Otvori poveznicu</a>`;
  } else {
    descEl.textContent = item.description;
  }

  renderOptionalSection("modalAgenda", renderAgenda(item.agenda));
  renderOptionalSection("modalBoard", renderBoard(item.board));
}

/* ================= HELPERS ================= */
function renderOptionalSection(id, html) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = html;
  el.closest("section, div")?.classList.toggle("d-none", !html);
}

function renderAgenda(agenda) {
  if (!agenda.length) return "";

  return `
    <ul class="list-group list-group-flush">
      ${agenda
        .map((a) =>
          typeof a === "string"
            ? `<li class="list-group-item">${a}</li>`
            : `<li class="list-group-item">
                <strong>${a.time ?? ""}</strong> – ${a.topic ?? ""}
              </li>`
        )
        .join("")}
    </ul>
  `;
}

function renderBoard(board) {
  if (!board.length) return "";

  return `
    <ul class="list-unstyled">
      ${board
        .map(
          (b) => `
        <li>
          👤 <strong>${b.name ?? ""}</strong> – ${b.role ?? ""}
        </li>`
        )
        .join("")}
    </ul>
  `;
}
