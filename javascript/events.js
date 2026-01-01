const eventsList = document.getElementById("events-list");
const EVENTS_URL = "data/events.json";

function isFuture(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) >= today;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("hr-HR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function renderEvents(events) {
  if (!events.length) {
    eventsList.innerHTML = "<p>Nema nadolazećih događanja.</p>";
    return;
  }

  eventsList.innerHTML = events
    .map(
      (e) => `
      <article class="event-card fade-in">
        ${e.image ? `<img src="${e.image}" alt="${e.title}" />` : ""}
        <div class="event-content">
          <h3>${e.title}</h3>
          <p><strong>${formatDate(e.date)} | ${e.time}</strong></p>
          <p>${e.location}</p>
          <p>${e.description}</p>
        </div>
      </article>
    `
    )
    .join("");
}

fetch(EVENTS_URL)
  .then((res) => res.json())
  .then((events) =>
    events
      .filter((e) => isFuture(e.date))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  )
  .then(renderEvents);
