// lista novosti (novosti.html)

import {
    fetchData, 
    fetchJSON} from "./news.service.js";

    const DATA_URL = "data/novosti.json";

document.addEventListener("DOMContentLoaded", async() => {
    const data = await fetchJSON(DATA_URL);
});