const container = document.getElementById("poslovi-container");
const paginationEl = document.getElementById("pagination");
const filterEl = document.getElementById("typeFilter");

const ITEMS_PER_PAGE = 6;

let data = [];
let currentPage = 1;
let currentFilter = "all";

/* ================= FETCH DATA ================= */
async function loadData() {
  const response = await fetch("data/jobs.json");
  data = await response.json();
  render();
}

/* ================= FILTERED DATA ================= */
function getFilteredData() {
  if (currentFilter === "all") return data;
  return data.filter(item => item.type === currentFilter);
}

/* ================= PAGINATION ================= */
function paginate(items) {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  return items.slice(start, start + ITEMS_PER_PAGE);
}

function renderPagination(totalItems) {
  paginationEl.innerHTML = "";
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentPage ? "active" : ""}`;

    li.innerHTML = `
      <button class="page-link">${i}</button>
    `;

    li.onclick = () => {
      currentPage = i;
      render();
    };

    paginationEl.appendChild(li);
  }
}

/* ================= CARD TEMPLATE ================= */
function createCard(item) {
  const badgeClass = item.type === "job" ? "bg-axis-primary" : "bg-axis-secondary";
  const badgeText = item.type === "job" ? "Posao" : "Edukacija";

  return `
    <div class="col">
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <span class="badge ${badgeClass} mb-2 align-self-start">${badgeText}</span>
          <h3 class="h5 card-title">${item.title}</h3>
          <p class="card-text text-muted flex-grow-1">
            ${item.description}
          </p>
          <a href="${item.url}" target="_blank" class="btn btn-axis mt-auto">
            Saznaj više
          </a>
        </div>
        <div class="card-footer small text-muted">
          Objavljeno: ${new Date(item.publishedAt).toLocaleDateString("hr-HR")}
        </div>
      </div>
    </div>
  `;
}

/* ================= RENDER ================= */
function render() {
  container.innerHTML = "";

  const filtered = getFilteredData();
  const paginated = paginate(filtered);

  if (!filtered.length) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning">
          Trenutno nema dostupnog sadržaja.
        </div>
      </div>
    `;
    paginationEl.innerHTML = "";
    return;
  }

  paginated.forEach(item => {
    container.insertAdjacentHTML("beforeend", createCard(item));
  });

  renderPagination(filtered.length);
}

/* ================= EVENTS ================= */
filterEl.addEventListener("change", e => {
  currentFilter = e.target.value;
  currentPage = 1;
  render();
});

/* ================= INIT ================= */
loadData();
