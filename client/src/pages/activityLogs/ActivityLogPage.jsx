import { useState, useEffect } from 'react';
import { logsAPI, usersAPI } from '../../api';
import { Activity, Clock, Filter, AlertCircle, Users, Search as SearchIcon, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ACTION_LABELS = {
  login: 'Đăng nhập',
  logout: 'Đăng xuất',
  task_created: 'Tạo công việc',
  task_updated: 'Cập nhật công việc',
  task_deleted: 'Xóa công việc',
  task_status_changed: 'Thay đổi trạng thái công việc',
  task_assigned: 'Phân công công việc',
  task_progress_updated: 'Cập nhật tiến độ',
  task_priority_changed: 'Thay đổi độ ưu tiên',
  project_created: 'Tạo dự án',
  project_updated: 'Cập nhật dự án',
  project_deleted: 'Xóa dự án',
  project_member_added: 'Thêm thành viên dự án',
  project_member_removed: 'Xóa thành viên dự án',
  user_created: 'Tạo người dùng',
  user_updated: 'Cập nhật người dùng',
  user_deleted: 'Xóa người dùng',
};

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [users, setUsers] = useState([]);

  const handleDatePresetChange = (e) => {
    const preset = e.target.value;
    setDatePreset(preset);
    
    if (!preset || preset === 'custom') {
      if (!preset) {
        setStartDate('');
        setEndDate('');
        setPage(1);
      }
      return;
    }

    const today = new Date();
    let start, end;

    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'today') {
      start = today;
      end = today;
    } else if (preset === 'this_week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(today.setDate(diff));
      end = new Date(start.valueOf());
      end.setDate(start.getDate() + 6);
    } else if (preset === 'this_month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (preset === 'last_month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    }

    if (start && end) {
      setStartDate(formatDate(start));
      setEndDate(formatDate(end));
      setPage(1);
    }
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setDatePreset('custom');
    setPage(1);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setDatePreset('custom');
    setPage(1);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await usersAPI.getAll({ limit: 100 });
        setUsers(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };
    fetchUsers();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        action: actionFilter || undefined,
        userId: userFilter || undefined,
        search: searchFilter || undefined,
      };
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        params.endDate = end.toISOString();
      }
      const res = await logsAPI.getAll(params);
      setLogs(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, limit, actionFilter, userFilter, searchFilter, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50 flex items-center gap-2">
            <Activity className="text-primary-500" />
            Nhật ký hoạt động
          </h1>
          <p className="text-dark-400 mt-1">Theo dõi các hoạt động trên hệ thống</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input 
              type="text" 
              placeholder="Tìm theo từ khóa..." 
              value={searchFilter}
              onChange={(e) => { setSearchFilter(e.target.value); setPage(1); }}
              className="input bg-dark-800 text-dark-200 text-sm py-2 w-48"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-dark-400" />
            <select 
              value={datePreset}
              onChange={handleDatePresetChange}
              className="input bg-dark-800 text-dark-200 text-sm py-2 w-[140px]"
            >
              <option value="">Mọi lúc</option>
              <option value="today">Hôm nay</option>
              <option value="this_week">Tuần này</option>
              <option value="this_month">Tháng này</option>
              <option value="last_month">Tháng trước</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
            <input 
              type="date" 
              value={startDate}
              onChange={handleStartDateChange}
              className="input bg-dark-800 text-dark-200 text-sm py-2"
              title="Từ ngày"
            />
            <span className="text-dark-400">-</span>
            <input 
              type="date" 
              value={endDate}
              onChange={handleEndDateChange}
              className="input bg-dark-800 text-dark-200 text-sm py-2"
              title="Đến ngày"
            />
          </div>

          <div className="flex items-center gap-2">
            <Users size={18} className="text-dark-400" />
            <select 
              value={userFilter} 
              onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
              className="input bg-dark-800 text-dark-200 text-sm"
            >
              <option value="">Tất cả nhân viên</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-dark-400" />
            <select 
              value={actionFilter} 
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="input bg-dark-800 text-dark-200 text-sm"
            >
              <option value="">Tất cả hoạt động</option>
              {Object.entries(ACTION_LABELS).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center items-center text-dark-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-3"></div>
            Đang tải dữ liệu...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-dark-400 text-center">
            <AlertCircle size={48} className="text-dark-600 mb-4" />
            <h3 className="text-lg font-semibold text-dark-200">Không có dữ liệu</h3>
            <p>Chưa có hoạt động nào được ghi nhận hoặc không khớp với bộ lọc.</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-700/50">
            {logs.map((log) => {
              let actionColor = 'text-primary-500';
              if (log.action.includes('delete') || log.action.includes('remove') || log.action === 'logout') {
                actionColor = 'text-danger-500';
              } else if (log.action.includes('create') || log.action.includes('add') || log.action === 'login') {
                actionColor = 'text-success-500';
              } else if (log.action.includes('update') || log.action.includes('change') || log.action.includes('assign')) {
                actionColor = 'text-warning-500';
              }

              return (
                <div key={log._id} className="p-4 sm:p-5 hover:bg-dark-950/50 transition-colors flex gap-4">
                  <div className="mt-0.5 flex-shrink-0">
                    {log.performedBy?.avatar ? (
                      <img src={log.performedBy.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover ring-1 ring-dark-700 shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm ring-1 ring-primary-200 shadow-sm">
                        {log.performedBy?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-baseline flex-wrap gap-1.5 text-[15px]">
                        <span className="font-bold text-dark-50">
                          {log.performedBy?.name || 'Người dùng ẩn'}
                        </span>
                        <span className="text-dark-400 font-normal text-sm">đã</span>
                        <span className={`font-bold ${actionColor}`}>
                          {(ACTION_LABELS[log.action] || log.action).toLowerCase()}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-dark-400 gap-1.5">
                        <Clock size={14} className="text-dark-400" />
                        {format(new Date(log.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                      </div>
                    </div>
                    <p className="text-dark-400 text-sm">{log.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
        <div className="flex items-center gap-2 text-sm text-dark-300">
          <span>Hiển thị:</span>
          <select 
            value={limit} 
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="input bg-dark-800 text-dark-200 py-1 px-2 h-auto"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>dòng/trang</span>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button 
              className="btn-ghost" 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              Trước
            </button>
            <span className="px-4 py-2 bg-dark-800 rounded-lg text-dark-200 font-medium border border-dark-700">
              Trang {page} / {totalPages}
            </span>
            <button 
              className="btn-ghost" 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogPage;
