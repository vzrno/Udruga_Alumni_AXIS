const container = document.getElementById("past-events");
const EVENTS_URL = "data/events.json";

function isPast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("hr-HR");
}

fetch(EVENTS_URL)
  .then((res) => res.json())
  .then((events) =>
    events
      .filter((e) => isPast(e.date))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  )
  .then((events) => {
    if (!events.length) {
      container.innerHTML = "<p>Nema arhiviranih događanja.</p>";
      return;
    }

    container.innerHTML = events
      .map(
        (e) => `
        <article class="event-card archive fade-in">
          ${e.image ? `<img src="${e.image}" alt="${e.title}" />` : ""}
          <h3>${e.title}</h3>
          <p>${formatDate(e.date)}</p>
          <p>${e.description}</p>
        </article>
      `
      )
      .join("");
  });
