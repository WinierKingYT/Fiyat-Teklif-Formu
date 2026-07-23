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
        <div className="mb-6" data-testid="dashboard-hero">
            <div className="card relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-accent)]"></div>
                <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="md:col-span-2">
                            <div>
                                <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">
                                    {quoteData.title || 'Yeni Teklif'}
                                </h1>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    {today}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-[var(--radius)] bg-[var(--color-bg-muted)] p-3 border border-[var(--color-border)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                                        <Package size={13} className="text-[var(--color-primary)]" />
                                    </div>
                                    <span className="text-xs text-[var(--color-text-muted)] font-medium">Kalem</span>
                                </div>
                                <div className="text-xl font-bold text-[var(--color-text)] ml-9">
                                    <CountUp end={itemCount} duration={800} />
                                </div>
                            </div>
                            <div className="rounded-[var(--radius)] bg-[var(--color-bg-muted)] p-3 border border-[var(--color-border)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-primary-muted)] flex items-center justify-center">
                                        <TrendingUp size={13} className="text-[var(--color-primary)]" />
                                    </div>
                                    <span className="text-xs text-[var(--color-text-muted)] font-medium">Toplam</span>
                                </div>
                                <div className="text-xl font-bold text-[var(--color-text)] truncate ml-9" title={totalAmount}>
                                    {totalAmount}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHero;