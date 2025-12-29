// lista novosti (novosti.html)

document.addEventListener("DOMContentLoaded", async() => {
    const container = document.getElementById("novosti-container");
    if (!container) return;

    try {
        const news = await NewsService.getAll();

        container.innerHTML = news.map(item => `
            <article class="card">
            <img src="${item.image}" alt="${item.title}">
            h3>${item.title}</h3>
            <p>${item.description}</p>
            <small>Datum objave: ${item.date}</small><br>
            <a href="novost.html?id=${item.id}">Pročitaj više →</a>
            </article>
        `).join("");
    } catch (error) {
        container.innerHTML = "<p>Došlo je do pogreške pri učitavanju novosti.</p>";
    }
});