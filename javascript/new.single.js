// single news page

document.addEventListener("DOMContentLoaded", async() => {
    const container = document.getElementById("single-news");
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (id) {
        container.innerHTML = "<p>Novost nije pronađena.</p>";
        return;
    }

    try {
        const news = await NewService.getById(id);

        if (!news) {
            container.innerHTML = "<p>Novost ne postoji.</p>";
            return;
        }

        document.title = news.title;

        container.innerHTML = `
                    <h1>${news.title}</h1>
                    <small>Objavljeno: ${news.date}</small>
                    <img src="${news.image}" alt="${news.title}">
                    <p>${news.content}</p>
                    <a href="novosti.html">← Povratak na novosti</a>
                `;
    } catch {
        container.innerHTML = "<p>Došlo je do pogreške prilikom učitavanja novosti.</p>";
    }
});