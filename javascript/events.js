"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("events-list");
  const calendarView = document.getElementById("calendar-view");

  const btnUpcoming = document.getElementById("filter-upcoming");
  const btnPast = document.getElementById("filter-past");
  const btnAll = document.getElementById("filter-all");
  const sortSelect = document.getElementById("sort-select");
  const toggleCalendar = document.getElementById("toggle-calendar");

  if (!container) return;

  let events = [];
  let currentView = "upcoming";

  const modalEl = document.getElementById("eventModal");
  const modal = modalEl ? new bootstrap.Modal(modalEl) : null;

  // Load
  try {
    const response = await fetch("data/events.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    events = Array.isArray(data) ? data : [];
  } catch (e) {
    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger mb-0">
          Greška pri učitavanju događanja.
        </div>
      </div>
    `;
    return;
  }

  // UI handlers
  btnUpcoming?.addEventListener("click", () => {
    currentView = "upcoming";
    setActive(btnUpcoming);
    render();
  });

  btnPast?.addEventListener("click", () => {
    currentView = "past";
    setActive(btnPast);
    render();
  });

  btnAll?.addEventListener("click", () => {
    currentView = "all";
    setActive(btnAll);
    render();
  });

  sortSelect?.addEventListener("change", () => render());

  toggleCalendar?.addEventListener("click", () => {
    if (!calendarView) return;
    calendarView.classList.toggle("d-none");
    const expanded = !calendarView.classList.contains("d-none");
    toggleCalendar.setAttribute("aria-expanded", String(expanded));
    if (expanded) {
      calendarView.innerHTML = getVisibleEvents()
        .map((e) => `<div class="calendar-item">${escapeHtml(e.date)} – ${escapeHtml(e.title)}</div>`)
        .join("");
    }
  });

  // Delegated modal open
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-event-id]");
    if (!btn) return;

    const eventId = btn.getAttribute("data-event-id");
    const ev = events.find((x) => String(x.id) === String(eventId));
    if (!ev) return;

    fillModal(ev);
    modal?.show();
  });

  // Initial
  setActive(btnUpcoming);
  render();

  /* ---------- helpers ---------- */

  function setActive(activeBtn) {
    [btnUpcoming, btnPast, btnAll].forEach((b) => {
      if (!b) return;
      b.classList.remove("btn-primary");
      b.classList.add("btn-outline-primary");
    });

    if (activeBtn) {
      activeBtn.classList.add("btn-primary");
      activeBtn.classList.remove("btn-outline-primary");
    }
  }

  function parseEventEnd(ev) {
    const date = ev?.date;
    const endTime = ev?.endTime || ev?.time || "00:00";
    const d = new Date(`${date}T${endTime}`);
    return Number.isNaN(d.getTime()) ? new Date(0) : d;
  }

  function getVisibleEvents() {
    const now = new Date();

    let list = [...events];

    // filter view
    if (currentView === "upcoming") {
      list = list.filter((e) => parseEventEnd(e) > now);
    } else if (currentView === "past") {
      list = list.filter((e) => parseEventEnd(e) <= now);
    }

    // sort
    const dir = sortSelect?.value === "desc" ? -1 : 1;
    list.sort((a, b) => {
      const da = new Date(a.date || 0);
      const db = new Date(b.date || 0);
      return (da - db) * dir;
    });

    return list;
  }

  function render() {
    const list = getVisibleEvents();

    if (!list.length) {
      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-warning mb-0">
            Trenutno nema događanja za prikaz.
          </div>
        </div>
      `;
      if (calendarView && !calendarView.classList.contains("d-none")) {
        calendarView.innerHTML = "";
      }
      return;
    }

    container.innerHTML = list.map(createCard).join("");

    if (calendarView && !calendarView.classList.contains("d-none")) {
      calendarView.innerHTML = list
        .map((e) => `<div class="calendar-item">${escapeHtml(e.date)} – ${escapeHtml(e.title)}</div>`)
        .join("");
    }
  }

  function createCard(ev) {
    const isPast = parseEventEnd(ev) <= new Date();
    const badge = isPast
      ? `<span class="badge bg-secondary">Završeno</span>`
      : `<span class="badge bg-success">Uskoro</span>`;

    return `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 event-card shadow-sm">
          <img
            src="${escapeAttr(ev.image)}"
            class="card-img-top"
            alt="${escapeHtml(ev.title)}"
            onerror="this.src='images/placeholder.jpg'"
          >
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <h5 class="card-title mb-0">${escapeHtml(ev.title)}</h5>
              ${badge}
            </div>

            <p class="card-text text-muted">${escapeHtml(ev.description || "")}</p>

            <button
              type="button"
              class="btn btn-outline-primary btn-sm mt-auto"
              data-event-id="${escapeHtml(String(ev.id))}"
            >
              Detalji
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function fillModal(ev) {
    const setText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value ?? "";
    };

    const img = document.getElementById("modalImage");
    if (img) {
      img.src = ev.image ? String(ev.image) : "images/placeholder.jpg";
      img.onerror = () => (img.src = "images/placeholder.jpg");
    }

    setText("modalTitle", ev.title || "");
    setText("modalDescription", ev.description || "");
    setText("modalDate", ev.date ? `📅 ${ev.date}` : "");
    setText(
      "modalTime",
      ev.time
        ? `⏰ ${ev.time}${ev.endTime ? ` – ${ev.endTime}` : ""}`
        : ""
    );
    setText("modalLocation", ev.location ? `📍 ${ev.location}` : "");

    const highlightsEl = document.getElementById("modalHighlights");
    if (highlightsEl) {
      const list = Array.isArray(ev.highlights) ? ev.highlights : [];
      if (list.length) {
        highlightsEl.innerHTML = list.map((h) => `<li>✔ ${escapeHtml(h)}</li>`).join("");
        highlightsEl.classList.remove("d-none");
      } else {
        highlightsEl.innerHTML = "";
        highlightsEl.classList.add("d-none");
      }
    }
  }

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
});
