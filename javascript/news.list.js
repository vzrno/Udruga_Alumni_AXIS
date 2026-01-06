import { fetchNews } from "./news.service.js";

const container = document.getElementById("novosti-container");
const ITEMS_PER_PAGE = 6;

let news = [];
let filteredNews = [];
let currentPage = 1;

init();

async function init() {
  news = await fetchNews();
  filteredNews = news;
  render();
}

/* ================= RENDER ================= */

function render() {
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
  return `
    <div class="col-md-6 col-lg-4">
      <article class="card axis-card h-100 shadow-sm">
        <img src="${item.image}" class="card-img-top" alt="${item.title}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${item.title}</h5>

          <p class="axis-meta">
            📅 ${item.date} • ⏰ ${item.time}<br>
            📍 ${item.location}
          </p>

          <p class="card-text text-muted">
            ${item.description.slice(0, 100)}...
          </p>

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
  if (!e.target.matches("[data-id]")) return;

  const item = news.find((n) => n.id == e.target.dataset.id);
  fillModal(item);
});

function fillModal(item) {
  document.getElementById("modalTitle").textContent = item.title;
  document.getElementById("modalImage").src = item.image;
  document.getElementById(
    "modalMeta"
  ).textContent = `${item.date} • ${item.time} • ${item.location}`;

  document.getElementById("modalDescription").textContent = item.description;

  document.getElementById("modalAgenda").innerHTML = renderAgenda(item.agenda);

  document.getElementById("modalBoard").innerHTML = renderBoard(item.board);
}

/* ================= HELPERS ================= */

function renderAgenda(agenda = []) {
  if (!agenda.length) return "<p class='text-muted'>Nema agende.</p>";

  return `
    <ul class="list-group list-group-flush">
      ${agenda
        .map(
          (a) => `
            <li class="list-group-item">
              <strong>${a.time}</strong> – ${a.topic}
            </li>`
        )
        .join("")}
    </ul>
  `;
}

function renderBoard(board = []) {
  if (!board.length) return "<p class='text-muted'>Nema podataka.</p>";

  return `
    <ul class="list-unstyled">
      ${board
        .map(
          (b) => `
            <li>
              👤 <strong>${b.name}</strong> – ${b.role}
            </li>`
        )
        .join("")}
    </ul>
  `;
}
