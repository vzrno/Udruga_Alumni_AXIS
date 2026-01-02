// dohvat novosti (JSON / API)

const NEWS_URL = "/data/news.json";

export async function fetchNews() {
  const response = await fetch(NEWS_URL);

  if (!response.ok) {
    throw new Error("Neuspješno učitavanje novosti");
  }

  return await response.json();
}

