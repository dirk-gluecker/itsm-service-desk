/**
 * Table Component
 * Responsive data table with optional sorting and selection
 */

import React, { useState, useMemo } from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string | number;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export type SortDirection = 'asc' | 'desc';

export interface TableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  rowKey?: keyof T | ((record: T) => string);
  selectable?: boolean;
  onSelect?: (selectedRows: T[]) => void;
  onRowClick?: (record: T) => void;
  emptyMessage?: string;
  className?: string;
  style?: React.CSSProperties;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    overflowX: 'auto',
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'var(--font-family-sans)',
    fontSize: 'var(--font-size-sm)',
  },
  headerRow: {
    backgroundColor: 'var(--color-bg-surface)',
    borderBottom: '2px solid var(--color-border-default)',
  },
  cell: {
    padding: 'var(--spacing-md) var(--spacing-lg)',
    textAlign: 'left' as const,
    borderBottom: '1px solid var(--color-border-default)',
  },
  headerCell: {
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    userSelect: 'none',
  },
  bodyRow: {
    transition: 'background-color var(--duration-fast) var(--ease-default)',
  },
  bodyRowHover: {
    backgroundColor: 'var(--color-neutral-50)',
  },
  sortIcon: {
    marginLeft: 'var(--spacing-xs)',
    opacity: 0.6,
  },
  emptyState: {
    padding: 'var(--spacing-xl)',
    textAlign: 'center' as const,
    color: 'var(--color-text-tertiary)',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
};

/**
 * Table Component Implementation
 * 
 * Usage:
 * <Table 
 *   columns={[{ key: 'title', header: 'Title', sortable: true }]}
 *   data={tickets}
 * />
 */
export function Table<T extends Record<string, any>>({
  columns,
  data,
  rowKey = 'id',
  selectable = false,
  onSelect,
  onRowClick,
  emptyMessage = 'No data available',
  className,
  style,
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: SortDirection;
  } | null>(null);
  
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
      onSelect?.([]);
    } else {
      const allKeys = data.map((row) => {
        const key = typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]);
        return key;
      });
      setSelectedRows(new Set(allKeys));
      onSelect?.(data);
    }
  };

  const handleSelectRow = (row: T) => {
    const key = typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]);
    const newSelected = new Set(selectedRows);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    setSelectedRows(newSelected);
    
    // Pass selected rows to callback
    const selectedRecords = data.filter((row) => {
      const k = typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]);
      return newSelected.has(k);
    });
    onSelect?.(selectedRecords);
  };

  const isSelected = (row: T) => {
    const key = typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]);
    return selectedRows.has(key);
  };

  return (
    <div style={{ ...styles.container, ...style }} className={className}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.headerRow}>
            {selectable && (
              <th style={{ ...styles.cell, ...styles.headerCell, width: '40px' }}>
                <input
                  type="checkbox"
                  checked={data.length > 0 && selectedRows.size === data.length}
                  onChange={handleSelectAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            
            {columns.map((column) => (
              <th
                key={String(column.key)}
                style={{
                  ...styles.cell,
                  ...styles.headerCell,
                  width: column.width,
                  textAlign: column.align || 'left',
                }}
                onClick={() => column.sortable && handleSort(String(column.key))}
              >
                {column.header}
                {column.sortable && (
                  <span style={styles.sortIcon}>
                    {sortConfig?.key === column.key
                      ? sortConfig.direction === 'asc'
                        ? '▲'
                        : '▼'
                      : '⇅'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} style={styles.emptyState}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => {
              const rowIdentifier = typeof rowKey === 'function' ? rowKey(row) : String(row[rowKey]);
              const isRowSelected = isSelected(row);
              
              return (
                <tr
                  key={rowIdentifier}
                  style={{
                    ...styles.bodyRow,
                    ...(isRowSelected ? { backgroundColor: 'rgba(28, 126, 214, 0.08)' } : {}),
                  }}
                  className="table-row"
                  onClick={() => onRowClick?.(row)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-neutral-50)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isRowSelected ? 'rgba(28, 126, 214, 0.08)' : '';
                  }}
                >
                  {selectable && (
                    <td style={{ ...styles.cell, width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={isRowSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectRow(row);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select row: ${rowIdentifier}`}
                      />
                    </td>
                  )}
                  
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      style={{
                        ...styles.cell,
                        textAlign: column.align || 'left',
                      }}
                    >
                      {column.render
                        ? column.render(row[column.key as keyof T], row)
                        : row[column.key as keyof T]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
