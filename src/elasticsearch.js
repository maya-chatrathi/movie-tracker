const HOST     = import.meta.env.VITE_ES_HOST     || "";
const USERNAME = import.meta.env.VITE_ES_USERNAME || "";
const PASSWORD = import.meta.env.VITE_ES_PASSWORD || "";

const authHeader = () =>
  "Basic " + btoa(`${USERNAME}:${PASSWORD}`);

/**
 * Search the index via the query-string API.
 * @param {string} query  - e.g. "mars" or "genre:Drama"
 * @param {number} size   - max results to return
 */
export async function searchIndex(query, size = 10) {
  const url = new URL(`${HOST.replace(/\/$/, "")}/_search`);
  url.searchParams.set("q", query);
  url.searchParams.set("size", size);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Bulk-upload an NDJSON string to the index.
 * @param {string} ndjson - raw NDJSON bulk payload
 */
export async function bulkUpload(ndjson) {
  const url = `${HOST.replace(/\/$/, "")}/_bulk`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-ndjson",
      Authorization: authHeader(),
    },
    body: ndjson,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}

export async function indexDocument(document) {
  const url = `${HOST.replace(/\/$/, "")}/_doc`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify(document),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}
