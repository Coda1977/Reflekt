"use client";

import { useAutoSave } from "@/hooks/useAutoSave";
import { Id } from "@/convex/_generated/dataModel";

interface TableColumn {
    id: string;
    header: string;
}

interface TableRow {
    id: string;
    label: string;
}

interface TableBlock {
    id: string;
    type: "table";
    label: string;
    columns: TableColumn[];
    rows: TableRow[];
}

interface TableInputProps {
    instanceId: Id<"workbookInstances">;
    block: TableBlock;
    existingResponse?: Record<string, string>;
}

export function TableInput({ instanceId, block, existingResponse = {} }: TableInputProps) {
    // We'll use a single aggregated auto-save for the whole table, 
    // or we can granularly save each cell. 
    // Given the current useAutoSave hook structure which takes (instanceId, blockId, initialValue),
    // it seems designed for 1:1 block-to-value mapping. 
    // If we want to save the whole table as one JSON object, we can use useAutoSave with the whole object.
    // However, `useAutoSave` likely expects a primitive or simple object. 
    // Let's assume `existingResponse` is a JSON object where keys are likely rowId_colId combinations or a nested structure.

    // To keep it simple and consistent with other inputs, we'll auto-save the ENTIRE table state as one object.

    const { value, setValue, saving, error } = useAutoSave(
        instanceId,
        block.id,
        existingResponse
    );

    const handleCellChange = (rowId: string, colId: string, cellValue: string) => {
        const currentData = (value as Record<string, string>) || {};
        const key = `${rowId}:${colId}`;

        setValue({
            ...currentData,
            [key]: cellValue
        });
    };

    const getCellValue = (rowId: string, colId: string) => {
        const currentData = (value as Record<string, string>) || {};
        return currentData[`${rowId}:${colId}`] || "";
    };

    return (
        <div className="space-y-4">
            <label className="block font-semibold text-gray-900">{block.label}</label>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {/* Empty corner cell */}
                            </th>
                            {block.columns.map((col) => (
                                <th key={col.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {block.rows.map((row) => (
                            <tr key={row.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                                    {row.label}
                                </td>
                                {block.columns.map((col) => (
                                    <td key={col.id} className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="text"
                                            value={getCellValue(row.id, col.id)}
                                            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-blue focus:border-accent-blue"
                                            placeholder="Type here..."
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center gap-2 h-5">
                {saving && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        Saving...
                    </p>
                )}
                {error && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                        ⚠️ {error}
                    </p>
                )}
            </div>
        </div>
    );
}
