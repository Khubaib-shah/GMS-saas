export function TableTdSkeleton({ className }: { className?: string }) {
    return (
        <tr className="border-b border-black/5 dark:border-white/5 animate-pulse">
            {/* Name */}
            <td className="py-6 px-6">
                <div className="h-5 w-[60%] max-w-[160px] bg-white/10 rounded"></div>
            </td>

            {/* Amount */}
            <td className="py-6 px-6">
                <div className="h-5 w-20 bg-primary/20 rounded"></div>
            </td>

            {/* Date */}
            <td className="py-6 px-6">
                <div className="h-3 w-24 bg-white/10 rounded"></div>
            </td>

            {/* Method badge */}
            <td className="py-6 px-6">
                <div className="h-6 w-16 bg-white/10 rounded-lg"></div>
            </td>

            {/* Description */}
            <td className="py-6 px-6">
                <div className="h-3 w-[80%] max-w-[220px] bg-white/10 rounded"></div>
            </td>
        </tr>
    )
}
