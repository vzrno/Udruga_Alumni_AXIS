// lista novosti (novosti.html)

import { fetchNews } from "./news.service.js";

const container = document.getElementById("novosti-container");

function renderNewsItem(news) {
  return `
    <article class="news-card">
      <div class="news-image">
        <img src="${news.image}"
             alt="${news.title}"
             loading="lazy" />
      </div>

      <div class="news-body">
        <p class="news-date">
          ${new Date(news.date).toLocaleDateString("hr-HR")}
        </p>

        <h3>${news.title}</h3>
        <p class="news-excerpt">${news.excerpt}</p>

        <button class="news-read-more">
          Pročitaj više
        </button>
      </div>
    </article>
  `;
}

export async function renderNews() {
  try {
    const newsList = await fetchNews();
    container.innerHTML = newsList.map(renderNewsItem).join("");
  } catch (error) {
    container.innerHTML =
      "<p class='error'>Trenutno nije moguće učitati novosti.</p>";
    console.error(error);
  }
}

