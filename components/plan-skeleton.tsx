export const PlanSkeleton = () => {
    return (
        <div className="glass-premium p-8 border-border flex flex-col justify-between animate-pulse">
            <div>
                {/* Title + Duration */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                    <div className="h-5 w-24 bg-white/10 rounded"></div>
                    <div className="h-4 w-12 bg-primary/20 rounded"></div>
                </div>

                {/* Price */}
                <div className="mb-2 flex items-end gap-1">
                    <div className="h-10 w-20 bg-primary/20 rounded"></div>
                    <div className="h-3 w-8 bg-white/10 rounded mb-1"></div>
                </div>

                {/* Description */}
                <div className="space-y-2 mb-2">
                    <div className="h-3 w-full bg-white/10 rounded"></div>
                    <div className="h-3 w-5/6 bg-white/10 rounded"></div>
                </div>

                {/* Members */}
                <div className="p-4 mb-2 flex gap-4 items-center justify-center border-t border-white/5">
                    <div className="h-8 w-10 bg-white/10 rounded"></div>
                    <div className="space-y-1">
                        <div className="h-2 w-12 bg-white/10 rounded"></div>
                        <div className="h-2 w-16 bg-white/10 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-auto">
                <div className="h-[38px] w-full bg-white/10 rounded-xl"></div>
                <div className="h-[38px] w-full bg-white/10 rounded-xl"></div>
            </div>
        </div>
    );
};