const DEFAULT_HEADERS = {
  Accept: "application/json",
};

export async function fetchJSON(url) {
  try {
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}
