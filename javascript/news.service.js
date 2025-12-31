// dohvat novosti (JSON / API)

const NewsService = (() => {
    const DATA_URL = "data/novosti.json"; // Promijeniti samo DATA_URL za CMS / API migraciju
    

    async function getAll() {
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error("Ne mogu učitati novosti");
        return await res.json();
    }

        async function getById(id) {
        const news = await getAll();
        return news.find(item => item.id === Number(id));
    }

    return {
        getAll,
        getById
    };
})();