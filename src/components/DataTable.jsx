import { useMemo, useState } from "react";

function cellValue(row, column) {
  const value = column.render ? column.render(row) : row[column.key];

  if (Array.isArray(value)) return value.join(", ");
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null || value === undefined || value === "") return "-";

  return value;
}

export function DataTable({
  rows,
  columns,
  emptyText = "No records found",
  actions,
  pageSize = 6,
  initialSortKey
}) {
  const [sortKey, setSortKey] = useState(initialSortKey || columns[0]?.key);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;

    return [...rows].sort((first, second) => {
      const left = first[sortKey];
      const right = second[sortKey];

      if (Number.isFinite(Number(left)) && Number.isFinite(Number(right))) {
        return (Number(left) - Number(right)) * (sortDir === "asc" ? 1 : -1);
      }

      return String(left ?? "").localeCompare(String(right ?? "")) * (sortDir === "asc" ? 1 : -1);
    });
  }, [rows, sortDir, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  function sortBy(column) {
    if (column.sortable === false) return;

    if (sortKey === column.key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column.key);
      setSortDir("asc");
    }

    setPage(1);
  }

  if (!rows.length) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return (
    <div className="table-shell">
      <div className="table-meta">
        <span>{rows.length} record{rows.length === 1 ? "" : "s"}</span>
        <span>Page {safePage} of {totalPages}</span>
      </div>
      <div className="smart-table">
        <div className="smart-row head">
          {columns.map((column) => (
            <button key={column.key} type="button" onClick={() => sortBy(column)} disabled={column.sortable === false}>
              {column.label}
              {sortKey === column.key ? <small>{sortDir === "asc" ? "Asc" : "Desc"}</small> : null}
            </button>
          ))}
          {actions ? <span>Actions</span> : null}
        </div>
        {visibleRows.map((row) => (
          <div className="smart-row" key={row.id}>
            {columns.map((column) => (
              <span key={column.key} data-label={column.label}>{cellValue(row, column)}</span>
            ))}
            {actions ? <span className="row-actions" data-label="Actions">{actions(row)}</span> : null}
          </div>
        ))}
      </div>
      {totalPages > 1 ? (
        <div className="pagination">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage === 1}>Previous</button>
          <span>{safePage} / {totalPages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={safePage === totalPages}>Next</button>
        </div>
      ) : null}
    </div>
  );
}
