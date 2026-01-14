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
  try {
    const res = await fetch("data/jobs.json");
    data = await res.json();
  } catch (err) {
    container.innerHTML = `
      <div class="alert alert-danger col-12">
        Greška pri učitavanju podataka.
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
  return date > new Date()
    ? "Uskoro"
    : date.toLocaleDateString("hr-HR");
}

function getFilteredData() {
  if (currentFilter === "all") return data;
  return data.filter(item => item.type === currentFilter);
}

function paginate(items) {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  return items.slice(start, start + ITEMS_PER_PAGE);
}

/* ================= UI ================= */
function createCard(item) {
  const isJob = item.type === "job";

  return `
    <div class="col">
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <span class="badge ${isJob ? "bg-axis-primary" : "bg-axis-secondary"} mb-2">
            ${isJob ? "Posao" : "Edukacija"}
          </span>

          <h3 class="h5 mb-1">${item.company}</h3>
          <p class="small text-muted mb-2">${item.location}</p>

          <p class="card-text text-muted flex-grow-1">
            ${item.description}
          </p>

          <a
            href="${item.url}"
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
  paginationEl.innerHTML = "";
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === currentPage ? "active" : ""}`;
    li.innerHTML = `<button class="page-link">${i}</button>`;
    li.onclick = () => {
      currentPage = i;
      render();
    };
    paginationEl.appendChild(li);
  }
}

/* ================= RENDER ================= */
function render() {
  container.innerHTML = "";

  const filtered = getFilteredData()
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

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
if (filterEl) {
  filterEl.addEventListener("change", e => {
    currentFilter = e.target.value;
    currentPage = 1;
    render();
  });
}

/* ================= INIT ================= */
loadData();
