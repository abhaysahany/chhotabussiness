import React, { useState, useMemo } from 'react';

/**
 * Enterprise Reusable DataTable Component with Live Search, Multi-Column Sorting,
 * Pagination Controls, Page Size Selection, and Responsive Container.
 *
 * @param {Array} columns - Array of column definition objects:
 *   {
 *     header: string | ReactNode,
 *     accessor: string | Function,
 *     sortable?: boolean,
 *     align?: 'left' | 'center' | 'right',
 *     render?: (value, row, index) => ReactNode,
 *     width?: string,
 *   }
 * @param {Array} data - Array of row objects.
 * @param {number} defaultPageSize - Initial rows per page (default: 10).
 * @param {Array} pageSizeOptions - Available rows per page options (default: [5, 10, 25, 50, 100]).
 * @param {string} searchPlaceholder - Placeholder for the search input.
 * @param {boolean} searchable - Show search input (default: true).
 * @param {boolean} showPageSize - Show page size dropdown (default: true).
 * @param {ReactNode} actions - Optional action buttons on the right of search bar.
 * @param {string} emptyMessage - Message when no data matches.
 * @param {boolean} loading - Loading indicator state.
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
    <div
      style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}
    >
      {/* Header Toolbar (Search + PageSize + Custom Actions) */}
      {(searchable || showPageSize || actions) && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.85rem',
            background: '#fafbfc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {showPageSize && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', color: '#475569' }}>
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    background: '#fff',
                    fontWeight: '600',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <span>entries</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                  style={{
                    padding: '0.45rem 0.85rem 0.45rem 2.1rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    width: '100%',
                    background: '#ffffff',
                    outline: 'none',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '0.65rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
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
                      right: '0.6rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
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
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontSize: '0.74rem', fontWeight: '800', color: '#475569', letterSpacing: '0.3px' }}>
              {columns.map((col, idx) => {
                const isSortable = col.sortable !== false;
                const colKey = typeof col.accessor === 'string' ? col.accessor : col.header;
                const isSorted = sortConfig.key === colKey;

                return (
                  <th
                    key={idx}
                    onClick={() => handleSort(col)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderBottom: '2px solid #e2e8f0',
                      textAlign: col.align || 'left',
                      cursor: isSortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      width: col.width || 'auto',
                      whiteSpace: 'nowrap',
                      transition: 'background-color 0.15s',
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
                        <span style={{ fontSize: '0.72rem', color: isSorted ? '#2563eb' : '#94a3b8' }}>
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
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem', color: '#2563eb', fontWeight: '700' }}>
                  ⏳ Loading database records...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: rowIdx % 2 === 0 ? '#ffffff' : '#fafafa',
                  }}
                >
                  {columns.map((col, colIdx) => {
                    const rawVal = getCellValue(row, col);
                    const renderedVal = col.render ? col.render(rawVal, row, (safeCurrentPage - 1) * pageSize + rowIdx) : rawVal;

                    return (
                      <td
                        key={colIdx}
                        style={{
                          padding: '0.85rem 1rem',
                          textAlign: col.align || 'left',
                          color: '#334155',
                          borderBottom: '1px solid #f1f5f9',
                        }}
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
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: '#fafbfc',
            fontSize: '0.82rem',
            color: '#64748b',
          }}
        >
          <div>
            Showing <strong>{startEntry}</strong> to <strong>{endEntry}</strong> of <strong>{totalEntries}</strong> entries
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: safeCurrentPage === 1 ? '#f8fafc' : '#ffffff',
                color: safeCurrentPage === 1 ? '#cbd5e1' : '#334155',
                cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
            >
              Previous
            </button>

            {paginationRange.map((pg, idx) => {
              if (pg === '...') {
                return (
                  <span key={idx} style={{ padding: '0.35rem 0.5rem', color: '#94a3b8' }}>
                    ...
                  </span>
                );
              }
              const isActive = pg === safeCurrentPage;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(pg)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: isActive ? '#2563eb' : '#cbd5e1',
                    background: isActive ? '#2563eb' : '#ffffff',
                    color: isActive ? '#ffffff' : '#334155',
                    cursor: 'pointer',
                    fontWeight: '700',
                    minWidth: '32px',
                  }}
                >
                  {pg}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: safeCurrentPage === totalPages ? '#f8fafc' : '#ffffff',
                color: safeCurrentPage === totalPages ? '#cbd5e1' : '#334155',
                cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: '600',
              }}
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
