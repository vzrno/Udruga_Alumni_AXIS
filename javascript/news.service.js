// dohvat novosti (JSON / API)

const NEWS_URL = "data/news.json";

export async function fetchNews() {
  try {
    const response = await fetch(NEWS_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Sort by date (newest first)
    return data.sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    );
  } catch (error) {
    console.error("Greška pri učitavanju novosti:", error);
    return [];
  }
}
