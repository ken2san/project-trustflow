import React, { useMemo } from "react";

const AnalyticsGraph = React.memo(() => {
    const data = [20, 45, 30, 60, 55, 85, 70];
    const width = 100;
    const height = 40;
    const max = Math.max(...data);
    const d = useMemo(() => {
        const points = data.map((val, i) => { const x = (i / (data.length - 1)) * width; const y = height - (val / max) * height; return {x, y}; });
        let path = `M ${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) { const cp1x = points[i-1].x + (points[i].x - points[i-1].x) / 2; const cp1y = points[i-1].y; const cp2x = points[i-1].x + (points[i].x - points[i-1].x) / 2; const cp2y = points[i].y; path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`; }
        return { path, points };
    }, []);

    return (
        <div className="w-full h-32 relative group">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs><linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" /><stop offset="100%" stopColor="#818cf8" stopOpacity="0" /></linearGradient></defs>
                <path d={`${d.path} L ${width},${height} L 0,${height} Z`} fill="url(#graphGradient)" className="opacity-50 transition-all duration-500 group-hover:opacity-70" />
                <path d={d.path} fill="none" stroke="#6366f1" strokeWidth="1" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                {d.points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#fff" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />)}
            </svg>
        </div>
    );
});

export default AnalyticsGraph;
