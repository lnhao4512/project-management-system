import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { notificationsAPI } from '../../api';
import toast from 'react-hot-toast';
import {
  Loader,
  Bell,
  Check,
  CheckCheck,
  Trash2,
  MessageSquare,
  AtSign,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  Clock,
  FolderOpen,
  ExternalLink,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckSquare,
  Info
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  markRead,
  markAllRead as markAllReadAction,
  removeNotification,
  setUnreadCount
} from '../../redux/slices/notificationsSlice';

const FILTER_TABS = [
  { id: 'all', label: 'Tất cả', icon: Bell },
  { id: 'unread', label: 'Chưa đọc', icon: Eye },
  { id: 'comment_mention', label: 'Bình luận & Tag @', icon: MessageSquare },
  { id: 'task_activity', label: 'Công việc', icon: CheckSquare },
  { id: 'deadline', label: 'Cảnh báo hạn', icon: AlertTriangle },
  { id: 'project', label: 'Dự án', icon: FolderOpen },
];

const TYPE_CONFIG = {
  task_commented: {
    label: 'Bình luận mới',
    icon: MessageSquare,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  mention: {
    label: 'Được nhắc đến',
    icon: AtSign,
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    badge: 'bg-indigo-500/20 text-indigo-300',
  },
  task_assigned: {
    label: 'Giao việc mới',
    icon: UserPlus,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
  },
  task_status_changed: {
    label: 'Trạng thái công việc',
    icon: RefreshCw,
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300',
  },
  task_updated: {
    label: 'Cập nhật công việc',
    icon: CheckSquare,
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300',
  },
  task_deadline_warning: {
    label: 'Sắp đến hạn',
    icon: Clock,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  task_overdue: {
    label: 'Quá hạn',
    icon: AlertTriangle,
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300',
  },
  project_member_added: {
    label: 'Dự án mới',
    icon: FolderOpen,
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    text: 'text-teal-400',
    badge: 'bg-teal-500/20 text-teal-300',
  },
  project_updated: {
    label: 'Cập nhật dự án',
    icon: FolderOpen,
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
    badge: 'bg-sky-500/20 text-sky-300',
  },
  system: {
    label: 'Hệ thống',
    icon: Info,
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    badge: 'bg-slate-500/20 text-slate-300',
  },
};

const DEFAULT_CONFIG = {
  label: 'Thông báo',
  icon: Bell,
  bg: 'bg-indigo-500/10',
  border: 'border-indigo-500/30',
  text: 'text-indigo-400',
  badge: 'bg-indigo-500/20 text-indigo-300',
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [totalUnread, setTotalUnread] = useState(0);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async (page = 1, tab = activeTab) => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (tab === 'unread') {
        params.isRead = false;
      } else if (tab !== 'all') {
        params.type = tab;
      }

      const [res, countRes] = await Promise.all([
        notificationsAPI.getAll(params),
        notificationsAPI.getUnreadCount(),
      ]);

      const data = res.data.data || [];
      const meta = res.data.meta || { page: 1, limit: 15, total: data.length, totalPages: 1 };
      const unreadCountVal = countRes.data?.data?.count || 0;

      setNotifications(data);
      setPagination(meta);
      setTotalUnread(unreadCountVal);
      dispatch(setUnreadCount(unreadCountVal));
    } catch (error) {
      toast.error('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    fetchNotifications(1, activeTab);
  }, [activeTab, fetchNotifications]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      dispatch(markRead(id));
      setTotalUnread(prev => Math.max(0, prev - 1));
      if (selectedNotif && selectedNotif._id === id) {
        setSelectedNotif(prev => ({ ...prev, isRead: true }));
      }
    } catch (error) {
      toast.error('Lỗi khi đánh dấu đã đọc');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      dispatch(markAllReadAction());
      setTotalUnread(0);
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      toast.error('Lỗi thực hiện');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationsAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      dispatch(removeNotification(id));
      if (selectedNotif && selectedNotif._id === id) {
        setSelectedNotif(null);
      }
      toast.success('Đã xóa thông báo');
    } catch (error) {
      toast.error('Lỗi khi xóa thông báo');
    }
  };

  const handleOpenDetail = (notif) => {
    setSelectedNotif(notif);
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }
  };

  const handleNavigateLink = (link) => {
    setSelectedNotif(null);
    if (link) navigate(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
              <Bell size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-dark-50">Trung tâm thông báo</h1>
              <p className="text-dark-400 text-sm">
                Bạn có <span className="font-semibold text-primary-400">{totalUnread}</span> thông báo chưa đọc
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchNotifications(pagination.page, activeTab)}
            disabled={loading}
            className="btn-secondary text-sm flex items-center gap-2"
            title="Làm mới"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          {totalUnread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <CheckCheck size={16} />
              <span>Đánh dấu tất cả đã đọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-dark-800 scrollbar-thin">
        {FILTER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'bg-dark-800/60 text-dark-300 hover:bg-dark-700/60 hover:text-dark-100 border border-dark-700/40'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.id === 'unread' && totalUnread > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? 'bg-white text-primary-700' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {totalUnread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="card divide-y divide-dark-800/80 overflow-hidden shadow-xl border border-dark-700/50">
        {loading ? (
          <div className="p-16 text-center text-dark-400 flex flex-col items-center justify-center">
            <Loader size={36} className="animate-spin text-primary-500 mb-3" />
            <p className="text-sm">Đang tải danh sách thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-dark-400 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-500 mb-4 shadow-inner">
              <Bell size={28} />
            </div>
            <h3 className="text-base font-semibold text-dark-200">Không có thông báo nào</h3>
            <p className="text-sm text-dark-500 mt-1 max-w-sm">
              {activeTab === 'unread'
                ? 'Bạn đã đọc hết tất cả thông báo.'
                : 'Mọi thông báo mới về công việc và dự án sẽ xuất hiện tại đây.'}
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const config = TYPE_CONFIG[notif.type] || DEFAULT_CONFIG;
            const Icon = config.icon;
            const isUnread = !notif.isRead;

            return (
              <div
                key={notif._id}
                onClick={() => handleOpenDetail(notif)}
                className={`group p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all cursor-pointer ${
                  isUnread
                    ? 'bg-primary-950/20 hover:bg-primary-900/30 border-l-4 border-l-primary-500'
                    : 'hover:bg-dark-800/40 bg-dark-900/20'
                }`}
              >
                {/* Type Icon / Sender Avatar */}
                <div className="relative flex-shrink-0 mt-0.5">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.border} border flex items-center justify-center ${config.text} shadow-sm`}>
                    <Icon size={18} />
                  </div>
                  {isUnread && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary-500 ring-2 ring-dark-900 animate-pulse" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${config.badge}`}>
                      {config.label}
                    </span>
                    {notif.sender && (
                      <span className="text-xs font-medium text-dark-300 flex items-center gap-1">
                        bởi <span className="text-dark-100 font-semibold">{notif.sender.name}</span>
                      </span>
                    )}
                    <span className="text-xs text-dark-500 ml-auto flex items-center gap-1">
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                    </span>
                  </div>

                  <h4 className={`text-sm sm:text-base leading-snug ${isUnread ? 'font-bold text-dark-50' : 'font-medium text-dark-200'}`}>
                    {notif.title}
                  </h4>

                  <p className="text-dark-400 text-sm mt-1 leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>

                  {/* Badges / Links */}
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    {notif.relatedTask && typeof notif.relatedTask === 'object' && (
                      <span className="inline-flex items-center gap-1 text-xs bg-dark-800 text-dark-300 border border-dark-700/80 px-2 py-0.5 rounded-md">
                        <CheckSquare size={12} className="text-primary-400" />
                        <span className="truncate max-w-[200px]">{notif.relatedTask.title}</span>
                      </span>
                    )}

                    {notif.relatedProject && typeof notif.relatedProject === 'object' && (
                      <span className="inline-flex items-center gap-1 text-xs bg-dark-800 text-dark-300 border border-dark-700/80 px-2 py-0.5 rounded-md">
                        <FolderOpen size={12} className="text-cyan-400" />
                        <span className="truncate max-w-[150px]">{notif.relatedProject.name}</span>
                      </span>
                    )}

                    {notif.link && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isUnread) handleMarkAsRead(notif._id);
                          navigate(notif.link);
                        }}
                        className="text-xs text-primary-400 hover:text-primary-300 font-medium inline-flex items-center gap-1 transition-colors ml-auto sm:ml-0"
                      >
                        <span>Chi tiết</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 self-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUnread && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif._id, e)}
                      className="p-2 text-dark-400 hover:text-emerald-400 hover:bg-dark-800 rounded-lg transition-colors"
                      title="Đánh dấu đã đọc"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(notif._id, e)}
                    className="p-2 text-dark-400 hover:text-rose-400 hover:bg-dark-800 rounded-lg transition-colors"
                    title="Xóa thông báo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <p className="text-xs text-dark-400">
            Trang <span className="font-semibold text-dark-200">{pagination.page}</span> / {pagination.totalPages} (Tổng {pagination.total} thông báo)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNotifications(pagination.page - 1, activeTab)}
              disabled={pagination.page <= 1 || loading}
              className="p-2 rounded-lg bg-dark-800 border border-dark-700 text-dark-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold px-2 py-1 bg-dark-800 rounded border border-dark-700 text-dark-200">
              {pagination.page}
            </span>
            <button
              onClick={() => fetchNotifications(pagination.page + 1, activeTab)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-2 rounded-lg bg-dark-800 border border-dark-700 text-dark-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Trang kế"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal (Đọc toàn bộ nội dung thông báo) */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-dark-900 border border-dark-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            {(() => {
              const config = TYPE_CONFIG[selectedNotif.type] || DEFAULT_CONFIG;
              const Icon = config.icon;
              return (
                <div className="p-5 border-b border-dark-800 flex items-start justify-between gap-4 bg-dark-800/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.border} border flex items-center justify-center ${config.text}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${config.badge}`}>
                        {config.label}
                      </span>
                      <h3 className="text-base font-bold text-dark-100 mt-1">{selectedNotif.title}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNotif(null)}
                    className="p-1.5 text-dark-400 hover:text-dark-200 rounded-lg hover:bg-dark-800 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              );
            })()}

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Sender & Timestamp */}
              <div className="flex items-center justify-between text-xs text-dark-400 bg-dark-800/40 p-3 rounded-xl border border-dark-700/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xs">
                    {(selectedNotif.sender?.name?.slice(0, 1) || 'H').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-dark-200">{selectedNotif.sender?.name || 'Hệ thống'}</p>
                    <p className="text-[10px] text-dark-400">{selectedNotif.sender?.role ? selectedNotif.sender.role.replace('_', ' ') : 'System'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="flex items-center gap-1 text-dark-300">
                    <Calendar size={12} />
                    {format(new Date(selectedNotif.createdAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                  <p className="text-[11px] text-dark-500">
                    {formatDistanceToNow(new Date(selectedNotif.createdAt), { addSuffix: true, locale: vi })}
                  </p>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Nội dung chi tiết</label>
                <div className="p-4 rounded-xl bg-dark-800/60 border border-dark-700/50 text-dark-100 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedNotif.message}
                </div>
              </div>

              {/* Related Info */}
              {(selectedNotif.relatedTask || selectedNotif.relatedProject) && (
                <div className="space-y-2 pt-2 border-t border-dark-800">
                  <label className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Liên kết liên quan</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedNotif.relatedTask && (
                      <div className="p-3 rounded-xl bg-dark-800/40 border border-dark-700/40 flex items-center gap-2.5">
                        <CheckSquare size={16} className="text-primary-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-dark-400">Công việc</p>
                          <p className="text-xs font-semibold text-dark-200 truncate">
                            {selectedNotif.relatedTask.title || 'Xem công việc'}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedNotif.relatedProject && (
                      <div className="p-3 rounded-xl bg-dark-800/40 border border-dark-700/40 flex items-center gap-2.5">
                        <FolderOpen size={16} className="text-cyan-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-dark-400">Dự án</p>
                          <p className="text-xs font-semibold text-dark-200 truncate">
                            {selectedNotif.relatedProject.name || 'Xem dự án'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-dark-800 bg-dark-800/20 flex items-center justify-between gap-3">
              <button
                onClick={(e) => handleDelete(selectedNotif._id, e)}
                className="btn-danger text-xs flex items-center gap-1.5 py-2"
              >
                <Trash2 size={14} /> Xóa
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="btn-secondary text-xs py-2"
                >
                  Đóng
                </button>
                {selectedNotif.link && (
                  <button
                    onClick={() => handleNavigateLink(selectedNotif.link)}
                    className="btn-primary text-xs flex items-center gap-1.5 py-2"
                  >
                    <span>Xem trang đích</span>
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
