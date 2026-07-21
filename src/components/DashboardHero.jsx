import React from 'react';
import { TrendingUp, Package } from 'lucide-react';

const CountUp = ({ end, duration = 1000, prefix = '', enabled = true }) => {
    const [count, setCount] = React.useState(0);
    React.useEffect(() => {
        if (!enabled) { setCount(end); return; }
        let startTime = null, animationFrame;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
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
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 relative overflow-hidden">
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
                        <div className="bg-[var(--color-bg-muted)] rounded-[var(--radius)] p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Package size={15} className="text-[var(--color-text-muted)]" />
                                <span className="text-xs text-[var(--color-text-muted)]">Kalem</span>
                            </div>
                            <div className="text-xl font-bold text-[var(--color-text)]">
                                <CountUp end={itemCount} duration={800} />
                            </div>
                        </div>
                        <div className="bg-[var(--color-bg-muted)] rounded-[var(--radius)] p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp size={15} className="text-[var(--color-text-muted)]" />
                                <span className="text-xs text-[var(--color-text-muted)]">Toplam</span>
                            </div>
                            <div className="text-xl font-bold text-[var(--color-text)] truncate" title={totalAmount}>
                                {totalAmount}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHero;
