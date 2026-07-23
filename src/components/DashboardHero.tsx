import React from 'react';
import { TrendingUp, Package } from 'lucide-react';

const CountUp = ({ end, duration = 1000, prefix = '', enabled = true }) => {
    const [count, setCount] = React.useState(0);
    React.useEffect(() => {
        if (!enabled) { setCount(end); return; }
        let startTime: number | null = null, animationFrame;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime!) / duration, 1);
            setCount(Math.floor((1 - Math.pow(1 - progress, 4)) * end));
            if (progress < 1) animationFrame = requestAnimationFrame(animate);
        };
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration, enabled]);
    return <span>{prefix}{count.toLocaleString('tr-TR')}</span>;
};

const DashboardHero = ({ quoteData, items, totalAmount }) => {
    const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const itemCount = items.length;

    return (
        <div className="mb-3" data-testid="dashboard-hero">
            <div className="card relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-accent)]"></div>
                <div className="card-body !py-3 !px-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <div>
                                <h1 className="text-lg font-bold text-[var(--color-text)] leading-tight">
                                    {quoteData.title || 'Yeni Teklif'}
                                </h1>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    {today}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-bg-muted)] px-3 py-1.5 border border-[var(--color-border)]">
                                <Package size={14} className="text-[var(--color-primary)]" />
                                <span className="text-xs text-[var(--color-text-muted)] font-medium">Kalem</span>
                                <span className="text-sm font-bold text-[var(--color-text)]">
                                    <CountUp end={itemCount} duration={800} />
                                </span>
                            </div>
                            <div className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-bg-muted)] px-3 py-1.5 border border-[var(--color-border)]">
                                <TrendingUp size={14} className="text-[var(--color-primary)]" />
                                <span className="text-xs text-[var(--color-text-muted)] font-medium">Toplam</span>
                                <span className="text-sm font-bold text-[var(--color-text)] truncate max-w-[150px]" title={totalAmount}>
                                    {totalAmount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHero;