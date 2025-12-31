// dohvat novosti (JSON / API)

export async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");
    return res.json();
    }