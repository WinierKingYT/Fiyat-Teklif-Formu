import React from 'react';
import { TrendingUp, Package, ChevronDown } from 'lucide-react';

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

const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'RUB', 'AZN', 'AED'];

const DashboardHero = ({ quoteData, items, totalAmount, onCurrencyChange }) => {
    const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const itemCount = items.length;
    const [showCurrency, setShowCurrency] = React.useState(false);
    const ref = React.useRef(null);

    React.useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowCurrency(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="mb-3" data-testid="dashboard-hero">
            <div className="card relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-accent)]"></div>
                <div className="card-body !py-2.5 !px-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div>
                                <h1 className="text-base font-bold text-[var(--color-text)] leading-tight">
                                    {quoteData.title || 'Yeni Teklif'}
                                </h1>
                                <p className="text-[11px] text-[var(--color-text-muted)]">
                                    {today}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <div ref={ref} className="relative">
                                <button
                                    onClick={() => setShowCurrency(!showCurrency)}
                                    className="flex items-center gap-1 rounded-[var(--radius)] bg-[var(--color-bg-muted)] hover:bg-[var(--color-bg-hover)] px-2 py-1.5 border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text)] transition-colors"
                                >
                                    {quoteData.currency || 'TRY'} <ChevronDown size={12} />
                                </button>
                                {showCurrency && (
                                    <div className="absolute right-0 top-full mt-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius)] shadow-lg z-50 min-w-[80px]">
                                        {CURRENCIES.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => { onCurrencyChange(c); setShowCurrency(false); }}
                                                className={`w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--color-bg-hover)] transition-colors ${quoteData.currency === c ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-text)]'}`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-bg-muted)] px-2 py-1.5 border border-[var(--color-border)]">
                                <Package size={12} className="text-[var(--color-primary)]" />
                                <span className="text-[10px] text-[var(--color-text-muted)] font-medium">Kalem</span>
                                <span className="text-xs font-bold text-[var(--color-text)]">
                                    <CountUp end={itemCount} duration={800} />
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-bg-muted)] px-2 py-1.5 border border-[var(--color-border)]">
                                <TrendingUp size={12} className="text-[var(--color-primary)]" />
                                <span className="text-[10px] text-[var(--color-text-muted)] font-medium">Toplam</span>
                                <span className="text-xs font-bold text-[var(--color-text)] truncate max-w-[120px]" title={totalAmount}>
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