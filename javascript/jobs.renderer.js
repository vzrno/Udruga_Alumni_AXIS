export function renderJobs(container, jobs) {
  container.innerHTML = "";

  if (!jobs.length) {
    container.innerHTML = "<p>Nema dostupnih oglasa.</p>";
    return;
  }

  jobs.forEach((job, index) => {
    const card = document.createElement("article");
    card.className = "card";
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
      <h3>${job.title}</h3>
      <p>${job.description}</p>
      ${
        job.url
          ? `<a href="${job.url}" class="card-link" target="_blank" rel="noopener">
              Saznaj više →
            </a>`
          : ""
      }
    `;

    container.appendChild(card);
  });
}
