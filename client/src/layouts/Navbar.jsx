import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Bell, Menu, Search, X, Sun, Moon, Eye,
  CheckSquare, FolderOpen, Users, Loader
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { markAllRead, setNotifications, setUnreadCount } from '../redux/slices/notificationsSlice';
import { notificationsAPI, searchAPI } from '../api';

const statusColors = { todo: 'text-dark-400', doing: 'text-indigo-500', review: 'text-purple-500', done: 'text-emerald-500' };
const statusLabels = { todo: 'Cần làm', doing: 'Đang làm', review: 'Chờ duyệt', done: 'Xong' };

const Navbar = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: notifications, unreadCount } = useSelector(s => s.notifications);
  const [showNotifs, setShowNotifs] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [nRes, cRes] = await Promise.all([
          notificationsAPI.getAll({ limit: 10 }),
          notificationsAPI.getUnreadCount(),
        ]);
        dispatch(setNotifications(nRes.data.data || []));
        if (cRes.data?.data?.count !== undefined) dispatch(setUnreadCount(cRes.data.data.count));
      } catch {}
    };
    load();
  }, [user, dispatch]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : t === 'dark' ? 'sepia' : 'light');
  };

  const handleMarkAllRead = async () => {
    try { await notificationsAPI.markAllAsRead(); dispatch(markAllRead()); } catch {}
  };

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) { setSearchResults(null); return; }
    clearTimeout(searchTimeout.current);
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await searchAPI.global(searchQuery.trim());
        setSearchResults(res.data.data);
      } catch { setSearchResults(null); }
      finally { setSearchLoading(false); }
    }, 350);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) { setShowSearch(false); setSearchQuery(''); setSearchResults(null); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const goTo = (path) => { navigate(path); setShowSearch(false); setSearchQuery(''); setSearchResults(null); };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Eye;
  const themeLabel = theme === 'dark' ? 'Tối' : theme === 'light' ? 'Sáng' : 'Dịu';

  const hasResults = searchResults && (
    searchResults.tasks?.length > 0 || searchResults.projects?.length > 0 || searchResults.users?.length > 0
  );

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 z-30 flex items-center px-4 lg:px-6 gap-3 glass border-x-0 border-t-0 rounded-none transition-colors duration-300">
      <button onClick={onMenuToggle} className="btn-ghost p-2 lg:hidden text-dark-300">
        <Menu size={20} />
      </button>

      {/* Date pill */}
      <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium text-dark-400 bg-dark-900/30 border border-dark-700/50 flex-1">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
      </div>
      <div className="flex-1 md:hidden" />

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 ml-auto">

        {/* Global Search */}
        <div className="relative" ref={searchRef}>
          {showSearch ? (
            <div className="flex items-center">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
                <input
                  autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm task, dự án, thành viên..."
                  className="w-72 py-2 pl-9 pr-9 text-sm text-dark-100 placeholder-dark-500 rounded-full outline-none transition-all bg-dark-800/50 border border-primary-500/30 focus:border-primary-500/60 focus:bg-primary-500/5"
                  style={{ boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' }}
                />
                {searchLoading
                  ? <Loader size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 animate-spin" />
                  : <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults(null); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-dark-400 hover:text-dark-200 rounded-full hover:bg-dark-700 transition-colors"><X size={13} /></button>
                }
              </div>

              {searchQuery.trim().length >= 2 && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50 glass shadow-2xl animate-slide-down">
                  {!hasResults && !searchLoading ? (
                    <p className="py-8 text-center text-dark-400 text-sm">Không có kết quả</p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {searchResults?.tasks?.length > 0 && (
                        <>
                          <div className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-dark-500 flex items-center gap-1.5 bg-dark-800/30">
                            <CheckSquare size={10} /> Công việc
                          </div>
                          {searchResults.tasks.map(t => (
                            <button key={t._id} onClick={() => goTo(`/tasks/${t._id}`)} className="w-full text-left px-4 py-2.5 hover:bg-dark-700/50 transition-colors">
                              <p className="text-sm text-dark-100 font-medium truncate">{t.title}</p>
                              <div className="flex gap-2 mt-0.5">
                                <span className={`text-xs ${statusColors[t.status]}`}>{statusLabels[t.status]}</span>
                                {t.project && <span className="text-xs text-dark-400">· {t.project.name}</span>}
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                      {searchResults?.projects?.length > 0 && (
                        <>
                          <div className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-dark-500 flex items-center gap-1.5 bg-dark-800/30">
                            <FolderOpen size={10} /> Dự án
                          </div>
                          {searchResults.projects.map(p => (
                            <button key={p._id} onClick={() => goTo(`/projects/${p._id}`)} className="w-full text-left px-4 py-2.5 hover:bg-dark-700/50 transition-colors flex items-center gap-3">
                              <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ background: p.color || '#6366f1' }}>{p.name.slice(0,2).toUpperCase()}</div>
                              <span className="text-sm text-dark-100 truncate">{p.name}</span>
                            </button>
                          ))}
                        </>
                      )}
                      {searchResults?.users?.length > 0 && (
                        <>
                          <div className="px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-dark-500 flex items-center gap-1.5 bg-dark-800/30">
                            <Users size={10} /> Thành viên
                          </div>
                          {searchResults.users.map(u => (
                            <button key={u._id} onClick={() => goTo('/users')} className="w-full text-left px-4 py-2.5 hover:bg-dark-700/50 transition-colors flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">{u.name?.slice(0,2).toUpperCase()}</div>
                              <div>
                                <p className="text-sm text-dark-100 font-medium">{u.name}</p>
                                <p className="text-xs text-dark-400 capitalize">{u.role?.replace('_',' ')}</p>
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setShowSearch(true)} className="btn-ghost p-2.5" title="Tìm kiếm">
              <Search size={18} className="text-dark-300 hover:text-dark-100" />
            </button>
          )}
        </div>

        {/* Theme */}
        <button onClick={cycleTheme} title={`Giao diện: ${themeLabel}`}
          className="btn-ghost p-2.5 text-dark-300 hover:text-dark-100 transition-colors"
        >
          <ThemeIcon size={18} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifs(v => !v)}
            className="btn-ghost p-2.5 relative text-dark-300 hover:text-dark-100 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-pulse border-2 border-dark-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50 glass shadow-2xl animate-slide-down">
              <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700/50">
                <span className="text-sm font-semibold text-dark-100">Thông báo</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-indigo-500 hover:text-indigo-400 font-medium">Đọc tất cả</button>
                  )}
                  <button onClick={() => setShowNotifs(false)} className="text-dark-400 hover:text-dark-200 transition-colors"><X size={14} /></button>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {notifications.length === 0
                  ? <p className="py-8 text-center text-dark-400 text-sm">Không có thông báo mới</p>
                  : notifications.slice(0, 10).map(n => (
                    <div key={n._id} onClick={() => { setShowNotifs(false); if (n.link) navigate(n.link); }}
                      className={`px-4 py-3 cursor-pointer transition-colors hover:bg-dark-800/50 ${!n.isRead ? 'border-l-2 border-l-indigo-500 bg-indigo-500/5' : ''}`}
                    >
                      <p className="text-sm text-dark-100 font-medium">{n.title}</p>
                      <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                }
              </div>
              <div className="px-4 py-2.5 border-t border-dark-700/50">
                <button onClick={() => { setShowNotifs(false); navigate('/notifications'); }} className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 w-full text-center">
                  Xem tất cả
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <button onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full transition-all hover:bg-dark-800 border border-dark-700/50 ml-1"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-dark-100 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-dark-400 capitalize leading-tight">{user?.role?.replace('_',' ')}</p>
          </div>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
