const directions = new Set(["asc", "desc"]);

export function paginate(rows, page = 1, pageSize = 10) {
  const currentPage = Math.max(Number(page) || 1, 1);
  const size = Math.min(Math.max(Number(pageSize) || 10, 1), 500);
  const start = (currentPage - 1) * size;
  return {
    data: rows.slice(start, start + size),
    total: rows.length,
    page: currentPage,
    pageSize: size,
    totalPages: Math.max(Math.ceil(rows.length / size), 1)
  };
}

export function parseFilters(raw) {
  if (!raw || raw === "undefined") return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return {};
  }
}

export function filterRows(rows, filters = {}) {
  return rows.filter((row) =>
    Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === "" || value === "All") return true;
      return String(row[key]) === String(value);
    })
  );
}

export function searchRows(rows, search, keys) {
  if (!search) return rows;
  const term = String(search).toLowerCase();
  return rows.filter((row) => keys.some((key) => String(row[key] ?? "").toLowerCase().includes(term)));
}

export function sortRows(rows, key = "id", dir = "desc") {
  const direction = directions.has(String(dir).toLowerCase()) ? String(dir).toLowerCase() : "desc";
  return [...rows].sort((first, second) => {
    const a = first[key] ?? "";
    const b = second[key] ?? "";
    if (a === b) return 0;
    return (a > b ? 1 : -1) * (direction === "asc" ? 1 : -1);
  });
}

export function shapeList(rows, query, searchKeys) {
  const filters = parseFilters(query.filters);
  const searched = searchRows(rows, query.search, searchKeys);
  const filtered = filterRows(searched, filters);
  const sorted = sortRows(filtered, query.sortKey, query.sortDir);
  return paginate(sorted, query.page, query.pageSize);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
