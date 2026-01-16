// dohvat novosti (JSON / API)

"use strict";

const NEWS_URL = "data/news.json";

export async function fetchNews() {
  try {
    const response = await fetch(NEWS_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const list = Array.isArray(data) ? data : [];

    // Sort by date (newest first) without mutating original
    return [...list].sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    );
  } catch (error) {
    console.error("Greška pri učitavanju novosti:", error);
    return [];
  }
}
