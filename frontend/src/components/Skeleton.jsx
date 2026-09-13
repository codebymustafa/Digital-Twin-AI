import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ className }) => (
    <div className={`bg-[#120b18] overflow-hidden relative ${className}`}>
        <motion.div
            animate={{
                x: ['-100%', '100%'],
            }}
            transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "linear",
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-[0_0_20px_rgba(255,255,255,0.05)]"
        />
    </div>
);

export const DashboardSkeleton = () => (
    <div className="pt-20 px-4 md:px-8 max-w-[1800px] mx-auto space-y-8 animate-pulse">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/2 flex gap-6">
            <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-1/3 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/2 h-32">
                    <Skeleton className="w-8 h-8 rounded-lg mb-4" />
                    <Skeleton className="h-6 w-1/2 rounded-lg mb-2" />
                    <Skeleton className="h-3 w-3/4 rounded-lg" />
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/2 h-64">
                <Skeleton className="h-6 w-1/3 rounded-lg mb-6" />
                <Skeleton className="h-40 w-full rounded-lg" />
            </div>
            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/2 h-[460px]">
                <Skeleton className="h-6 w-1/2 rounded-lg mb-8" />
                <Skeleton className="w-40 h-40 rounded-full mx-auto mb-8" />
                <Skeleton className="h-8 w-2/3 mx-auto rounded-xl mb-4" />
                <Skeleton className="h-4 w-3/4 mx-auto rounded-lg" />
            </div>
            <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/2 h-64">
                <Skeleton className="h-6 w-1/3 rounded-lg mb-6" />
                <Skeleton className="h-40 w-full rounded-lg" />
            </div>
        </div>
    </div>
);

export default Skeleton;
