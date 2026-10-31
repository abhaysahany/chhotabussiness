import React, { useState, useMemo } from 'react';

/**
 * Vyapar AdNET Reusable DataTable Component with Live Search, Multi-Column Sorting,
 * Pagination Controls, Page Size Selection, and High-Information-Density Responsive Styling.
 */
function DataTable({
  columns = [],
  data = [],
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
  searchPlaceholder = 'Search records...',
  searchable = true,
  showPageSize = true,
  actions = null,
  emptyMessage = 'No records found matching your criteria.',
  loading = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Value getter helper
  const getCellValue = (row, col) => {
    if (typeof col.accessor === 'function') {
      return col.accessor(row);
    }
    if (typeof col.accessor === 'string') {
      return row[col.accessor];
    }
    return '';
  };

  // 1. Search Filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      return columns.some((col) => {
        const val = getCellValue(row, col);
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, columns]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    const col = columns.find((c) => (c.accessor === sortConfig.key || c.header === sortConfig.key));
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal = getCellValue(a, col);
      let bVal = getCellValue(b, col);

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();

      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, columns]);

  // Reset to page 1 on search or page size change
  const totalEntries = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, safeCurrentPage, pageSize]);

  // Handle Sort Header Click
  const handleSort = (col) => {
    if (col.sortable === false) return;
    const key = typeof col.accessor === 'string' ? col.accessor : col.header;

    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Generate pagination items
  const paginationRange = useMemo(() => {
    const range = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      range.push(1);
      if (safeCurrentPage > 3) range.push('...');

      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!range.includes(i)) range.push(i);
      }

      if (safeCurrentPage < totalPages - 2) range.push('...');
      if (!range.includes(totalPages)) range.push(totalPages);
    }
    return range;
  }, [totalPages, safeCurrentPage]);

  const startEntry = totalEntries === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endEntry = Math.min(safeCurrentPage * pageSize, totalEntries);

  return (
    <div className="van-table-container">
      {/* Header Toolbar (Search + PageSize + Custom Actions) */}
      {(searchable || showPageSize || actions) && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--van-border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: 'var(--van-bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {showPageSize && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--van-text-secondary)' }}>
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="van-select"
                  style={{ height: '30px', padding: '0 0.5rem', width: 'auto', fontSize: '0.78rem' }}
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <span>rows</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {actions}
            {searchable && (
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="van-input"
                  style={{ height: '32px', paddingLeft: '1.85rem', fontSize: '0.8rem' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '0.6rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--van-text-muted)',
                    fontSize: '0.8rem',
                    pointerEvents: 'none',
                  }}
                >
                  🔍
                </span>
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--van-text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Section */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table className="van-table">
          <thead>
            <tr>
              {columns.map((col, idx) => {
                const isSortable = col.sortable !== false;
                const colKey = typeof col.accessor === 'string' ? col.accessor : col.header;
                const isSorted = sortConfig.key === colKey;

                return (
                  <th
                    key={idx}
                    onClick={() => handleSort(col)}
                    className={col.align === 'right' ? 'van-table-num' : col.align === 'center' ? 'van-table-center' : ''}
                    style={{
                      cursor: isSortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      width: col.width || 'auto',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                        width: '100%',
                      }}
                    >
                      <span>{col.header}</span>
                      {isSortable && (
                        <span style={{ fontSize: '0.7rem', color: isSorted ? 'var(--van-brand-blue)' : 'var(--van-text-muted)' }}>
                          {isSorted ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--van-brand-blue)', fontWeight: '600' }}>
                  Loading records...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--van-text-muted)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr key={row.id || rowIdx}>
                  {columns.map((col, colIdx) => {
                    const rawVal = getCellValue(row, col);
                    const renderedVal = col.render ? col.render(rawVal, row, (safeCurrentPage - 1) * pageSize + rowIdx) : rawVal;

                    return (
                      <td
                        key={colIdx}
                        className={col.align === 'right' ? 'van-table-num' : col.align === 'center' ? 'van-table-center' : ''}
                      >
                        {renderedVal}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && totalEntries > 0 && (
        <div className="van-table-pagination">
          <div>
            Showing <strong>{startEntry}</strong> to <strong>{endEntry}</strong> of <strong>{totalEntries}</strong> entries
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="van-btn van-btn-sm van-btn-outline"
              style={{ height: '28px', padding: '0 0.5rem' }}
            >
              Previous
            </button>

            {paginationRange.map((pg, idx) => {
              if (pg === '...') {
                return (
                  <span key={idx} style={{ padding: '0 0.4rem', color: 'var(--van-text-muted)' }}>
                    ...
                  </span>
                );
              }
              const isActive = pg === safeCurrentPage;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(pg)}
                  className={`van-btn van-btn-sm ${isActive ? 'van-btn-primary' : 'van-btn-outline'}`}
                  style={{ height: '28px', minWidth: '28px', padding: '0 0.45rem' }}
                >
                  {pg}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="van-btn van-btn-sm van-btn-outline"
              style={{ height: '28px', padding: '0 0.5rem' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
