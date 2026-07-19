import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { aiAPI } from '../../api';
import {
  Sparkles, RefreshCw, ChevronDown, ChevronUp, Clock,
  AlertTriangle, CheckCircle2, Loader, X, ExternalLink,
  Brain, TrendingUp, Zap
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';

// Urgency color mappings
const urgencyConfig = {
  danger:  { bg: 'bg-danger-500/10',  border: 'border-danger-500/30',  text: 'text-danger-500',  badge: 'bg-danger-500/20 text-danger-500 border-danger-500/30' },
  warning: { bg: 'bg-warning-500/10', border: 'border-warning-500/30', text: 'text-warning-500', badge: 'bg-warning-500/20 text-warning-500 border-warning-500/30' },
  primary: { bg: 'bg-primary-500/10', border: 'border-primary-500/30', text: 'text-primary-500', badge: 'bg-primary-500/20 text-primary-400 border-primary-500/30' },
  success: { bg: 'bg-success-500/10', border: 'border-success-500/30', text: 'text-success-500', badge: 'bg-success-500/20 text-success-500 border-success-500/30' },
  neutral: { bg: 'bg-dark-800/50',    border: 'border-dark-600',       text: 'text-dark-400',    badge: 'bg-dark-700 text-dark-400 border-dark-600' },
};

const priorityColors = {
  high: 'text-danger-500',
  medium: 'text-warning-500',
  low: 'text-success-500',
};

const statusColors = {
  todo: 'text-dark-400',
  doing: 'text-blue-400',
  review: 'text-purple-400',
  done: 'text-success-500',
};

const statusLabels = {
  todo: 'Cần làm', doing: 'Đang làm', review: 'Chờ duyệt', done: 'Xong',
};

// Animated typing effect for the insight message
const TypingText = ({ text }) => {
  const [displayed, setDisplayed] = useState('');
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setDisplayed('');
    setIdx(0);
  }, [text]);

  useEffect(() => {
    if (idx < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(prev => prev + text[idx]);
        setIdx(i => i + 1);
      }, 18);
      return () => clearTimeout(timer);
    }
  }, [idx, text]);

  return (
    <span>
      {displayed}
      {idx < text.length && <span className="inline-block w-0.5 h-4 bg-primary-400 ml-0.5 animate-pulse" />}
    </span>
  );
};

// Single task suggestion card
const SuggestionCard = ({ item, rank }) => {
  const [expanded, setExpanded] = useState(false); // Collapsed by default to save space
  const cfg = urgencyConfig[item.urgencyLevel?.color] || urgencyConfig.neutral;

  const isOverdue = item.deadline && isPast(new Date(item.deadline));

  return (
    <div className={`rounded-xl border transition-all duration-200 ${cfg.bg} ${cfg.border} overflow-hidden`}>
      <div
        className="flex items-start gap-3 p-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Rank badge */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5 ${
          rank === 1 ? 'bg-yellow-400 text-yellow-900' :
          rank === 2 ? 'bg-gray-300 text-gray-700' :
          rank === 3 ? 'bg-amber-600 text-white' :
          'bg-dark-700 text-dark-300'
        }`}>
          {rank}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-dark-100 leading-snug line-clamp-2">{item.title}</p>
            <button className={`flex-shrink-0 mt-0.5 ${cfg.text}`}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Urgency badge */}
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
              {item.urgencyLevel?.emoji} {item.urgencyLevel?.label}
            </span>

            {/* Priority */}
            <span className={`text-xs font-semibold ${priorityColors[item.priority]}`}>
              {item.priorityLabel}
            </span>

            {/* Deadline */}
            {item.deadlineLabel && (
              <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-danger-500 font-semibold' : 'text-dark-400'}`}>
                <Clock size={11} />
                {item.deadlineLabel}
              </span>
            )}

            {/* Status */}
            <span className={`text-xs ${statusColors[item.status]}`}>
              {statusLabels[item.status]}
            </span>
          </div>

          {/* Progress bar */}
          {item.progress > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-dark-500 mb-1">
                <span>Tiến độ</span>
                <span>{item.progress}%</span>
              </div>
              <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-primary-500"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded: reasoning + action */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-dark-700/30 space-y-2">
          {/* AI Reasoning */}
          <div className="mt-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest font-bold text-dark-500 flex items-center gap-1.5">
              Lý do hệ thống đề xuất:
            </p>
            <ul className="space-y-1">
              {item.reasoning.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-dark-300">
                  <span className={`mt-0.5 flex-shrink-0 ${cfg.text}`}>•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Project */}
          {item.project && (
            <p className="text-xs text-dark-500">
              Dự án: <span className="text-dark-300 font-medium">{item.project.name}</span>
            </p>
          )}

          {/* Score debug (for admin feel) */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-dark-600">
              Điểm ưu tiên: <span className="font-mono font-bold text-dark-500">{item.score}</span>
            </span>
            <Link
              to={`/tasks/${item._id}`}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${cfg.text} hover:bg-dark-700/50`}
              onClick={e => e.stopPropagation()}
            >
              Xem chi tiết <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * AISuggestionPanel — Main component
 * Displays AI-powered task priority suggestions
 */
const AISuggestionPanel = ({ defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await aiAPI.getSuggestions(5);
      setData(res.data.data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('AI suggest error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !data) {
      fetchSuggestions();
    }
  }, [isOpen, data, fetchSuggestions]);

  const visibleSuggestions = showAll
    ? (data?.suggestions || [])
    : (data?.suggestions || []).slice(0, 2);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Floating Card */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] rounded-2xl border border-primary-500/20 bg-dark-900/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50 bg-gradient-to-r from-primary-900/20 to-purple-900/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-md">
                <Brain size={16} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-dark-100 text-sm flex items-center gap-1.5">
                  AI Gợi ý
                  <span className="text-[9px] bg-primary-500/20 text-primary-400 border border-primary-500/30 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Beta</span>
                </h2>
                <p className="text-[10px] text-dark-500">
                  {lastRefreshed ? `Cập nhật ${format(lastRefreshed, 'HH:mm', { locale: vi })}` : 'Tự động phân tích ưu tiên'}
                </p>
              </div>
            </div>
            <button
              onClick={fetchSuggestions}
              className="p-1.5 text-dark-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
              title="Làm mới"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-3 space-y-3 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {/* Loading state */}
            {loading && !data && (
              <div className="flex flex-col items-center gap-2 py-6">
                <div className="w-8 h-8 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
                <p className="text-xs text-dark-400 mt-2">Đang phân tích dữ liệu...</p>
              </div>
            )}

            {/* Data loaded */}
            {!loading && data && (
              <>
                {/* Summary insight */}
                {data.summary?.insight && (
                  <div className="flex items-start gap-2 bg-dark-800/80 rounded-xl px-3 py-2 border border-dark-700/50">
                    <Sparkles size={14} className="text-primary-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-dark-200 leading-relaxed">
                      <TypingText text={data.summary.insight} />
                    </p>
                  </div>
                )}

                {/* Stats row */}
                {data.summary && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Đang chờ', value: data.summary.totalPending, icon: Clock, color: 'text-dark-300' },
                      { label: 'Rất gấp', value: data.summary.urgentCount,   icon: Zap,   color: 'text-warning-500' },
                      { label: 'Quá hạn', value: data.summary.overdueCount,  icon: AlertTriangle, color: 'text-danger-500' },
                    ].map(s => (
                      <div key={s.label} className="bg-dark-800/80 rounded-lg p-2 border border-dark-700/50 flex flex-col items-center justify-center">
                        <div className="flex items-center gap-1 mb-0.5">
                          <s.icon size={10} className={s.color} />
                          <span className={`text-sm font-black leading-none ${s.color}`}>{s.value}</span>
                        </div>
                        <div className="text-[9px] text-dark-500 font-medium">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No suggestions state */}
                {data.suggestions.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <CheckCircle2 size={28} className="text-success-500" />
                    <p className="text-xs font-semibold text-dark-200">Tuyệt vời! Mọi việc đều ổn 🎉</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2.5">
                      {visibleSuggestions.map((item, i) => (
                        <SuggestionCard key={item._id} item={item} rank={i + 1} />
                      ))}
                    </div>

                    {data.suggestions.length > 2 && (
                      <button
                        onClick={() => setShowAll(s => !s)}
                        className="w-full text-[10px] text-primary-400 hover:text-primary-300 flex items-center justify-center gap-1 py-1.5 hover:bg-primary-500/10 rounded-lg transition-colors border border-primary-500/10"
                      >
                        {showAll ? (
                          <><ChevronUp size={12} /> Thu gọn</>
                        ) : (
                          <><ChevronDown size={12} /> Xem thêm {data.suggestions.length - 2} công việc khác</>
                        )}
                      </button>
                    )}
                  </>
                )}

              {/* Disclaimer */}
              <p className="text-[10px] text-dark-600 text-center flex items-center justify-center gap-1 mt-3">
                Gợi ý dựa trên thuật toán phân tích deadline, độ ưu tiên và tiến độ
              </p>
            </>
          )}
        </div>
      </div>
    )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen 
            ? 'bg-dark-800 text-dark-400 hover:text-dark-200 border border-dark-700' 
            : 'bg-gradient-to-br from-primary-500 to-purple-600 text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'
        }`}
        title="Gợi ý công việc thông minh"
      >
        {isOpen ? <X size={20} /> : <TrendingUp size={20} />}
      </button>
    </div>
  );
};

export default AISuggestionPanel;
