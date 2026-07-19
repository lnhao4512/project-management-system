import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { notificationsAPI } from '../../api';
import toast from 'react-hot-toast';
import { Loader, Bell, Check, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { markRead, markAllRead as markAllReadAction, removeNotification } from '../../redux/slices/notificationsSlice';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.data);
    } catch (error) {
      toast.error('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      dispatch(markRead(id));
    } catch (error) {
      toast.error('Lỗi khi đánh dấu đã đọc');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      dispatch(markAllReadAction());
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      toast.error('Lỗi thực hiện');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(notifications.filter(n => n._id !== id));
      dispatch(removeNotification(id));
      toast.success('Đã xóa thông báo');
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Thông báo</h1>
          <p className="text-dark-400 text-sm mt-1">Bạn có {unreadCount} thông báo chưa đọc</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary text-sm">
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="card divide-y divide-dark-800">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-dark-500 flex flex-col items-center">
            <Bell size={48} className="mb-4 text-dark-700" />
            <p>Bạn chưa có thông báo nào.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif._id} className={`p-4 flex gap-4 transition-colors ${!notif.isRead ? 'bg-primary-900/10' : 'hover:bg-dark-800/50'}`}>
              <div className="mt-1">
                <div className={`w-2 h-2 rounded-full ${!notif.isRead ? 'bg-primary-500' : 'bg-transparent'}`} />
              </div>
              <div className="flex-1">
                <h4 className={`text-sm ${!notif.isRead ? 'font-semibold text-dark-100' : 'text-dark-200'}`}>
                  {notif.title}
                </h4>
                <p className="text-dark-400 text-sm mt-1">{notif.message}</p>
                
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-dark-500">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                  </span>
                  
                  {notif.link && (
                    <Link to={notif.link} className="text-xs text-primary-400 hover:underline">
                      Xem chi tiết
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                {!notif.isRead && (
                  <button onClick={() => handleMarkAsRead(notif._id)} className="p-2 text-dark-400 hover:text-primary-400 hover:bg-dark-800 rounded-lg transition-colors" title="Đánh dấu đã đọc">
                    <Check size={16} />
                  </button>
                )}
                <button onClick={() => handleDelete(notif._id)} className="p-2 text-dark-400 hover:text-danger-400 hover:bg-dark-800 rounded-lg transition-colors" title="Xóa">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
