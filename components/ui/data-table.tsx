"use client";

import * as React from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Settings2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    searchPlaceholder?: string;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Search...",
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center flex-1 max-w-sm relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={(table.getColumn(searchKey || "")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn(searchKey || "")?.setFilterValue(event.target.value)
                        }
                        className="pl-10 h-10 bg-white/5 border-white/10 focus:border-primary/50 text-xs font-bold tracking-wider placeholder:text-slate-600 rounded-xl transition-all"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 ml-auto flex bg-white/5 border-white/10 text-[10px] font-black italic uppercase tracking-widest hover:bg-white hover:text-black rounded-xl gap-2 px-4"
                        >
                            <Settings2 className="w-3.5 h-3.5" />
                            Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-950 border-white/10 min-w-[150px]">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize text-[10px] font-bold text-slate-400 focus:bg-primary focus:text-black"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-xl overflow-hidden relative after:absolute after:top-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary/10 after:to-transparent">
                <Table>
                    <TableHeader className="bg-white/[0.02]">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-white/5">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={cn(
                                                "h-12 text-[10px] font-black italic uppercase tracking-[0.2em] text-slate-500 px-6",
                                                header.column.getCanSort() && "cursor-pointer select-none hover:text-primary transition-colors"
                                            )}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-2">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                {header.column.getCanSort() && (
                                                    <div className="flex items-center">
                                                        {header.column.getIsSorted() === "asc" ? (
                                                            <ArrowUp className="ml-1 h-3 w-3 text-primary" />
                                                        ) : header.column.getIsSorted() === "desc" ? (
                                                            <ArrowDown className="ml-1 h-3 w-3 text-primary" />
                                                        ) : (
                                                            <ArrowUpDown className="ml-1 h-3 w-3 opacity-20 group-hover:opacity-100 transition-opacity" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="border-white/5 hover:bg-white/[0.02] transition-colors"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="px-6 py-4 text-[11px] font-bold tracking-wide text-slate-300">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-[10px] font-black italic uppercase tracking-widest text-slate-500">
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between px-2">
                <div className="text-[10px] font-black italic uppercase tracking-widest text-slate-500">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="h-8 w-8 p-0 bg-white/5 border-white/10 text-slate-400 hover:bg-primary hover:text-black rounded-lg transition-all"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="h-8 w-8 p-0 bg-white/5 border-white/10 text-slate-400 hover:bg-primary hover:text-black rounded-lg transition-all"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
