import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'neutral',
  trend,
}) {
  const getDotStyle = () => {
    switch (badgeType) {
      case 'success': return 'status-dot status-dot-emerald';
      case 'danger':  return 'status-dot status-dot-rose';
      case 'warning': return 'status-dot status-dot-amber';
      case 'info':    return 'status-dot status-dot-blue';
      default:        return 'status-dot status-dot-zinc';
    }
  };

  return (
    <div className="bank-panel p-5 hover:border-[#2E323D] transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            {title}
          </span>
          {Icon && (
            <div className="p-2 rounded-lg bg-[#111217] border border-[#1E2028] text-zinc-300 shrink-0">
              <Icon className="w-4 h-4 text-amex-blue" />
            </div>
          )}
        </div>

        <div className="mt-3">
          <div className="text-3xl font-extrabold tracking-tight text-white tabular-nums">
            {value ?? '—'}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#1E2028] flex items-center justify-between text-sm">
        {subtitle && (
          <span className="text-zinc-400 text-sm truncate font-medium">
            {subtitle}
          </span>
        )}
        {badgeText && (
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className={getDotStyle()} />
            <span className="text-xs font-semibold text-zinc-200 uppercase tracking-tight">
              {badgeText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
