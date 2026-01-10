document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("events-list");
  const calendarView = document.getElementById("calendar-view");

  const btnUpcoming = document.getElementById("filter-upcoming");
  const btnPast = document.getElementById("filter-past");
  const btnAll = document.getElementById("filter-all");
  const sortSelect = document.getElementById("sort-select");
  const toggleCalendar = document.getElementById("toggle-calendar");

  let events = [];
  let currentView = "upcoming";

  const modal = new bootstrap.Modal(document.getElementById("eventModal"));

  const response = await fetch("data/events.json");
  events = await response.json();

  renderUpcoming();

  btnUpcoming.onclick = () => { currentView = "upcoming"; renderUpcoming(); };
  btnPast.onclick = () => { currentView = "past"; renderPast(); };
  btnAll.onclick = () => { currentView = "all"; renderAll(); };
  sortSelect.onchange = () => rerender();
  toggleCalendar.onclick = toggleCalendarView;

  /* ---------- RENDER ---------- */

  function rerender() {
    if (currentView === "upcoming") renderUpcoming();
    if (currentView === "past") renderPast();
    if (currentView === "all") renderAll();
  }

  function renderUpcoming() {
    setActive(btnUpcoming);
    renderEvents(filterUpcoming());
  }

  function renderPast() {
    setActive(btnPast);
    renderEvents(filterPast());
  }

  function renderAll() {
    setActive(btnAll);
    renderEvents(sortEvents(events));
  }

  function renderEvents(list) {
    container.innerHTML = list.length
      ? sortEvents(list).map(createCard).join("")
      : `<p class="text-center text-muted">Nema događanja.</p>`;
  }

  /* ---------- LOGIC ---------- */

  function filterUpcoming() {
    return events.filter(e => getEndDate(e) > new Date());
  }

  function filterPast() {
    return events.filter(e => getEndDate(e) <= new Date());
  }

  function sortEvents(list) {
    return [...list].sort((a, b) =>
      sortSelect.value === "asc"
        ? getStartDate(a) - getStartDate(b)
        : getStartDate(b) - getStartDate(a)
    );
  }

  function getStartDate(e) {
    return new Date(`${e.date}T${e.time}`);
  }

  function getEndDate(e) {
    return new Date(`${e.date}T${e.endTime}`);
  }

  /* ---------- UI ---------- */

  function createCard(event) {
    const isPast = getEndDate(event) <= new Date();
    const badge = isPast
      ? `<span class="badge bg-secondary">Završeno</span>`
      : `<span class="badge bg-success">Uskoro</span>`;

    return `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 event-card shadow-sm">
          <img src="${encodeURI(event.image)}" class="card-img-top" alt="${event.title}">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between mb-2">
              <h5 class="card-title">${event.title}</h5>
              ${badge}
            </div>
            <p class="card-text">${event.description}</p>
            <button class="btn btn-outline-primary btn-sm mt-auto"
              onclick='openModal(${JSON.stringify(event)})'>
              Detalji
            </button>
          </div>
        </div>
      </div>`;
  }

  window.openModal = (event) => {
    modal.show();

    document.getElementById("modalTitle").textContent = event.title;
    document.getElementById("modalImage").src = encodeURI(event.image);
    document.getElementById("modalDescription").textContent = event.description;
    document.getElementById("modalDate").textContent = `📅 ${event.date}`;
    document.getElementById("modalTime").textContent = `⏰ ${event.time} – ${event.endTime}`;
    document.getElementById("modalLocation").textContent = `📍 ${event.location}`;

    const highlightsEl = document.getElementById("modalHighlights");
    if (highlightsEl && event.highlights?.length) {
      highlightsEl.innerHTML = event.highlights
        .map(h => `<li>${h}</li>`)
        .join("");
    }
  };

  function setActive(active) {
    [btnUpcoming, btnPast, btnAll].forEach(b => {
      b.classList.remove("btn-primary");
      b.classList.add("btn-outline-primary");
    });
    active.classList.add("btn-primary");
    active.classList.remove("btn-outline-primary");
  }

  /* ---------- CALENDAR VIEW ---------- */

  function toggleCalendarView() {
    calendarView.classList.toggle("d-none");
    if (!calendarView.classList.contains("d-none")) {
      calendarView.innerHTML = events
        .map(e => `<div class="calendar-item">${e.date} – ${e.title}</div>`)
        .join("");
    }
  }
});
