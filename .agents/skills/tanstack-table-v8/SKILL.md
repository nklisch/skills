---
name: tanstack-table-v8
description: >
  TanStack Table v8 headless table reference. Auto-loads when working with
  useReactTable, createColumnHelper, ColumnDef, flexRender, sorting, filtering, pagination.
user-invocable: false
---

# TanStack Table Reference

> **Version:** 8.x
> **Docs:** https://tanstack.com/table/latest

Headless table library for building powerful data tables in React. Provides state management, sorting, filtering, pagination, row selection without any pre-built markup or styling.

## Imports

```typescript
// Core
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'

// Column definition
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'

// Features
import {
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel
} from '@tanstack/react-table'

// State types
import type {
  SortingState,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  VisibilityState,
} from '@tanstack/react-table'
```

## API Quick Reference

### useReactTable()

Required options:
- `data: TData[]` - Array of row objects (must be stable reference)
- `columns: ColumnDef<TData>[]` - Column definitions
- `getCoreRowModel: getCoreRowModel()` - Always required

```typescript
const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),

  // Sorting
  getSortedRowModel: getSortedRowModel(),
  state: { sorting },
  onSortingChange: setSorting,
  manualSorting: false,

  // Filtering
  getFilteredRowModel: getFilteredRowModel(),
  state: { columnFilters, globalFilter },
  onColumnFiltersChange: setColumnFilters,
  onGlobalFilterChange: setGlobalFilter,
  manualFiltering: false,

  // Pagination
  getPaginationRowModel: getPaginationRowModel(),
  manualPagination: true,
  pageCount: totalPages,
  rowCount: totalRows,
  state: { pagination },
  onPaginationChange: setPagination,

  // Row selection
  enableRowSelection: true,
  state: { rowSelection },
  onRowSelectionChange: setRowSelection,
  getRowId: (row) => row.id,

  // Column visibility
  state: { columnVisibility },
  onColumnVisibilityChange: setColumnVisibility,
})
```

### Table Instance Methods

**Row access:**
- `table.getRowModel().rows` - Current rows (after pagination)
- `table.getCoreRowModel().rows` - All rows
- `table.getFilteredRowModel().rows` - After filtering
- `table.getSortedRowModel().rows` - After sorting
- `table.getSelectedRowModel().rows` - Selected rows only

**Pagination:**
- `table.nextPage()` / `table.previousPage()` / `table.firstPage()` / `table.lastPage()`
- `table.setPageIndex(n)` / `table.setPageSize(n)`
- `table.getCanNextPage()` / `table.getCanPreviousPage()`
- `table.getPageCount()` / `table.getRowCount()`

**Row selection:**
- `table.toggleAllRowsSelected(bool)`
- `table.getIsAllRowsSelected()` / `table.getIsSomeRowsSelected()`

**Headers:**
- `table.getHeaderGroups()` - For rendering headers
- `table.getAllLeafColumns()` - For visibility toggles

### Column Definitions

```typescript
const columnHelper = createColumnHelper<User>()

// Accessor column (data-backed)
columnHelper.accessor('name', {
  header: 'Name',
  cell: (info) => info.getValue(),
})

// Accessor with function (needs id)
columnHelper.accessor(row => `${row.first} ${row.last}`, {
  id: 'fullName',
  header: 'Full Name',
})

// Display column (no data)
columnHelper.display({
  id: 'actions',
  header: 'Actions',
  cell: (props) => <button onClick={() => handle(props.row.original)}>Delete</button>,
})

// Group column
columnHelper.group({
  header: 'User Info',
  columns: [/* nested columns */],
})
```

**Column options:**
- `id` - Required for accessor functions and display columns
- `header` - `string | (props) => ReactNode`
- `cell` - `(props) => ReactNode`
- `enableSorting` - `boolean` (default true for accessor columns)
- `sortingFn` - Built-in: `'alphanumeric'`, `'text'`, `'datetime'`, `'basic'` or custom
- `enableColumnFilter` / `enableGlobalFilter` - `boolean`
- `filterFn` - Built-in: `'includesString'`, `'equalsString'`, `'inNumberRange'` or custom
- `size` - `number` (for column sizing)
- `meta` - Custom metadata

**Cell/header context:**
```typescript
cell: (info) => {
  info.getValue()        // Cell value
  info.row.original      // Full row object
  info.row.id            // Row ID
  info.table             // Table instance
  info.column            // Column instance
}

header: (props) => {
  props.column.getIsSorted()              // 'asc' | 'desc' | false
  props.column.toggleSorting()
  props.column.getToggleSortingHandler()  // For onClick
}
```

### Row Methods

```typescript
row.getIsSelected()
row.toggleSelected(bool)
row.getToggleSelectedHandler()
row.getCanSelect()
row.getVisibleCells()
row.original              // Full row data
row.id
```

### Column Methods

```typescript
column.getIsSorted()              // 'asc' | 'desc' | false
column.toggleSorting(desc?: boolean)
column.getToggleSortingHandler()
column.setFilterValue(value)
column.getFilterValue()
column.getIsVisible()
column.toggleVisibility()
```

### flexRender()

Renders header/cell content, handles both static strings and functions:

```typescript
flexRender(header.column.columnDef.header, header.getContext())
flexRender(cell.column.columnDef.cell, cell.getContext())
```

## Gotchas & Version Caveats

**v8 breaking changes from v7:**
- Package renamed: `react-table` → `@tanstack/react-table`
- Hook renamed: `useTable` → `useReactTable`
- Row models must be explicit: always need `getCoreRowModel()` at minimum
- State management changed: use `state` object and `on[State]Change` callbacks
- No plugins system: features are built-in, enabled via options

**Unstable data reference causes infinite re-renders:**
```typescript
// Bad - new array every render
const table = useReactTable({ data: [{ id: 1 }], columns })

// Good - stable reference
const [data] = useState([{ id: 1 }])
const table = useReactTable({ data, columns })
```

**Missing row model for features:**
```typescript
// Bad - sorting won't work
useReactTable({ getCoreRowModel: getCoreRowModel(), state: { sorting } })

// Good
useReactTable({
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  state: { sorting },
})
```

**Mixing manual/automatic features:**
```typescript
// Bad - sorts only current page
useReactTable({
  manualPagination: true,
  getSortedRowModel: getSortedRowModel(),
})

// Good - both server-side
useReactTable({
  manualPagination: true,
  manualSorting: true,
})
```

**Missing id for accessor functions:**
```typescript
// Bad
columnHelper.accessor(row => row.first + row.last, { /* no id! */ })

// Good
columnHelper.accessor(row => row.first + row.last, { id: 'fullName' })
```

**React 19:** Fully compatible.

## Anti-Patterns

### Recreating columns on every render
```typescript
// Bad
function Table() {
  const columns = [columnHelper.accessor('name', { /* ... */ })]
}

// Good - stable reference or memoized
const columns = [columnHelper.accessor('name', { /* ... */ })]
function Table() { /* ... */ }
```

### Not using flexRender
```typescript
// Bad - won't work for function headers/cells
<th>{header.column.columnDef.header}</th>

// Good
<th>{flexRender(header.column.columnDef.header, header.getContext())}</th>
```

### Mutating table state
```typescript
// Bad
table.getState().sorting.push({ id: 'name', desc: false })

// Good
table.setSorting(old => [...old, { id: 'name', desc: false }])
```

### Using numeric indices as row IDs
```typescript
// Bad - selection breaks if rows reorder
// (default behavior uses numeric index)

// Good - stable IDs
useReactTable({
  getRowId: (row) => row.id,
})
```

### Not handling empty states
```typescript
// Bad - shows nothing when empty
{table.getRowModel().rows.map(row => <tr>...</tr>)}

// Good
{table.getRowModel().rows.length === 0 ? (
  <tr><td colSpan={columns.length}>No data</td></tr>
) : (
  table.getRowModel().rows.map(row => <tr>...</tr>)
)}
```

### Forgetting to stop event propagation on nested interactive elements
```typescript
// Bad - clicking checkbox triggers row click
cell: ({ row }) => (
  <input type="checkbox" onChange={() => row.toggleSelected()} />
)

// Good
cell: ({ row }) => (
  <input
    type="checkbox"
    onChange={() => row.toggleSelected()}
    onClick={(e) => e.stopPropagation()}
  />
)
```
