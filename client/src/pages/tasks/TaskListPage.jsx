import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchTasks, deleteTask } from '../../redux/slices/tasksSlice';
import { Search, Filter, Plus, Loader, Settings, Edit2, Trash2, Bell, FileDown, FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { tasksAPI } from '../../api';
import TaskFormModal from '../../components/tasks/TaskFormModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const STATUS_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'todo', label: 'Cần làm' },
  { id: 'doing', label: 'Đang làm' },
  { id: 'review', label: 'Chờ duyệt' },
  { id: 'done', label: 'Hoàn thành' }
];

const priorityColor = {
  high: 'text-rose-500',
  medium: 'text-amber-500',
  low: 'text-emerald-500'
};

const priorityLabel = {
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp'
};

const statusLabel = {
  todo: 'Cần làm',
  doing: 'Đang làm',
  review: 'Chờ duyệt',
  done: 'Hoàn thành'
};

const TaskListPage = () => {
  const dispatch = useDispatch();
  const { items: tasks, loading } = useSelector(s => s.tasks);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskLimit, setTaskLimit] = useState(parseInt(localStorage.getItem('pm_task_limit') || '15', 10));
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInput, setLimitInput] = useState('');

  const [filters, setFilters] = useState({
    assignee: '',
    project: '', // Replacing tags with project as it makes more sense in this system
    priority: '',
    month: '',
    startDate: null,
    endDate: null
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(localStorage.getItem('pm_items_per_page') || '8', 10));
  const [pageLimitInput, setPageLimitInput] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filters, activeTab]);

  useEffect(() => {
    dispatch(fetchTasks({ limit: 1000 }));
  }, [dispatch]);

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
      try {
        await dispatch(deleteTask(id)).unwrap();
        toast.success('Đã xóa công việc thành công!');
      } catch (error) {
        toast.error(error || 'Có lỗi xảy ra khi xóa công việc');
      }
    }
  };

  const handleRemind = async (id) => {
    try {
      const res = await tasksAPI.remind(id);
      toast.success(res.data?.message || 'Đã gửi email nhắc nhở thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi email nhắc nhở');
    }
  };

  const handleSetLimit = () => {
    const currentLimit = localStorage.getItem('pm_task_limit') || '15';
    const currentItemsPerPage = localStorage.getItem('pm_items_per_page') || '8';
    setLimitInput(currentLimit);
    setPageLimitInput(currentItemsPerPage);
    setShowLimitModal(true);
  };

  // Export helpers
  const buildExportRows = () =>
    processedTasks.filtered.map(task => ({
      ID: `TASK-${task._id.slice(-4).toUpperCase()}`,
      'Tiêu đề': task.title,
      'Trạng thái': statusLabel[task.status] || task.status,
      'Mức độ': priorityLabel[task.priority] || task.priority,
      'Hạn chót': task.deadline ? format(new Date(task.deadline), 'dd/MM/yyyy') : '-',
      'Phụ trách': task.assignedTo?.name || '-',
      'Dự án': task.project?.name || '-',
    }));

  const handleExportExcel = () => {
    try {
      const rows = buildExportRows();
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách công việc');
      XLSX.writeFile(wb, `tasks_export_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
      toast.success('Đã xuất file Excel!');
    } catch (e) {
      toast.error('Lỗi khi xuất Excel');
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(14);
      doc.text('Danh sách công việc', 14, 15);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Xuất lúc: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);

      const rows = buildExportRows();
      autoTable(doc, {
        startY: 27,
        head: [Object.keys(rows[0] || {})],
        body: rows.map(r => Object.values(r)),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 },
      });

      doc.save(`tasks_export_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
      toast.success('Đã xuất file PDF!');
    } catch (e) {
      toast.error('Lỗi khi xuất PDF');
    }
  };

  const handleSaveLimit = () => {
    let isValid = true;
    
    if (limitInput !== '' && !isNaN(limitInput) && parseInt(limitInput, 10) > 0) {
      localStorage.setItem('pm_task_limit', limitInput);
      setTaskLimit(parseInt(limitInput, 10));
    } else {
      isValid = false;
      toast.error('Vui lòng nhập giới hạn quá tải hợp lệ lớn hơn 0');
    }

    if (pageLimitInput !== '' && !isNaN(pageLimitInput) && parseInt(pageLimitInput, 10) > 0) {
      localStorage.setItem('pm_items_per_page', pageLimitInput);
      setItemsPerPage(parseInt(pageLimitInput, 10));
    } else {
      isValid = false;
      toast.error('Vui lòng nhập số công việc trên mỗi trang hợp lệ lớn hơn 0');
    }

    if (isValid) {
      setShowLimitModal(false);
      toast.success('Đã lưu cài đặt thành công');
    }
  };

  // Extract unique filter options
  const assignees = useMemo(() => {
    if (!tasks) return [];
    const map = new Map();
    tasks.forEach(t => {
      if (t.assignedTo) map.set(t.assignedTo._id, t.assignedTo.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const projects = useMemo(() => {
    if (!tasks) return [];
    const map = new Map();
    tasks.forEach(t => {
      if (t.project) map.set(t.project._id, t.project.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const userTaskCounts = useMemo(() => {
    if (!tasks) return {};
    const counts = {};
    tasks.forEach(t => {
      if (t.status !== 'done' && t.assignedTo) {
        counts[t.assignedTo._id] = (counts[t.assignedTo._id] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  // Filter tasks based on search, filters, and active tab
  const processedTasks = useMemo(() => {
    if (!tasks) return { filtered: [], counts: {} };

    // 1. Calculate base counts regardless of the tab, but applying other filters (or not, depending on design)
    // The design in the screenshot suggests the counts are based on ALL tasks matching the filters
    const counts = { all: 0, todo: 0, doing: 0, review: 0, done: 0 };

    const baseFiltered = tasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filters.assignee && t.assignedTo?._id !== filters.assignee) return false;
      if (filters.project && t.project?._id !== filters.project) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.month === 'custom' && filters.startDate && filters.endDate) {
        const taskDate = new Date(t.createdAt);
        taskDate.setHours(0, 0, 0, 0);
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        
        if (taskDate < start || taskDate > end) {
          return false;
        }
      } else if (filters.month === 'this_month') {
        const taskDate = new Date(t.createdAt);
        const now = new Date();
        if (taskDate.getMonth() !== now.getMonth() || taskDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }
      return true;
    });

    baseFiltered.forEach(t => {
      counts.all++;
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });

    // 2. Apply tab filter
    const finalFiltered = baseFiltered.filter(t => {
      if (activeTab !== 'all' && t.status !== activeTab) return false;
      return true;
    });

    return { filtered: finalFiltered, counts };
  }, [tasks, search, filters, activeTab]);

  const totalPages = Math.ceil(processedTasks.filtered.length / itemsPerPage);
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedTasks.filtered.slice(start, start + itemsPerPage);
  }, [processedTasks.filtered, currentPage]);

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-100px)]">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Tìm kiếm công việc..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-dark-800/80 border border-dark-700/50 text-dark-100 text-sm rounded-full py-2.5 pl-11 pr-4 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all placeholder-dark-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Export buttons */}
          <div className="flex items-center gap-1 bg-dark-800/80 border border-dark-700/50 rounded-full px-2 py-1.5">
            <span className="text-xs text-dark-500 font-medium px-1 hidden sm:inline">Xuất:</span>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-success-600 hover:bg-success-500/10 transition-colors"
              title="Xuất Excel"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden md:inline">Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-danger-500 hover:bg-danger-500/10 transition-colors"
              title="Xuất PDF"
            >
              <FileText size={14} />
              <span className="hidden md:inline">PDF</span>
            </button>
          </div>
          <button onClick={handleSetLimit} className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-dark-700/50 bg-dark-800/80 text-dark-300 hover:text-primary-400 hover:bg-dark-700 hover:border-primary-500/30 transition-all text-sm font-medium shadow-sm">
            <Settings size={16} />
            <span className="hidden sm:inline">Cài đặt hiển thị</span>
          </button>
          <button onClick={() => { setTaskToEdit(null); setShowModal(true); }} className="btn-primary rounded-full px-5 py-2.5 flex items-center gap-2 shadow-lg shadow-primary-500/20 font-medium">
            <Plus size={18} strokeWidth={2.5} />
            <span>Tạo Mới</span>
          </button>
        </div>
      </div>

      {/* Filters & Tabs Section */}
      <div className="flex flex-col gap-5">
        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-dark-300 pl-1 pr-2">
            <Filter size={16} />
            <span className="text-sm font-semibold uppercase tracking-wider">Bộ lọc:</span>
          </div>
          
          <select
            value={filters.assignee}
            onChange={e => setFilters(f => ({ ...f, assignee: e.target.value }))}
            className="bg-dark-900 border border-dark-700 text-dark-300 text-sm rounded-lg py-1.5 px-3 focus:outline-none focus:border-dark-500 transition-colors cursor-pointer appearance-none min-w-[140px]"
          >
            <option value="">Tất cả phụ trách</option>
            {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          <select
            value={filters.project}
            onChange={e => setFilters(f => ({ ...f, project: e.target.value }))}
            className="bg-dark-900 border border-dark-700 text-dark-300 text-sm rounded-lg py-1.5 px-3 focus:outline-none focus:border-dark-500 transition-colors cursor-pointer appearance-none min-w-[120px]"
          >
            <option value="">Tất cả dự án</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select
            value={filters.priority}
            onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
            className="bg-dark-900 border border-dark-700 text-dark-300 text-sm rounded-lg py-1.5 px-3 focus:outline-none focus:border-dark-500 transition-colors cursor-pointer appearance-none min-w-[130px]"
          >
            <option value="">Tất cả mức độ</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>

          <select
            value={filters.month}
            onChange={e => setFilters(f => ({ ...f, month: e.target.value }))}
            className="bg-dark-900 border border-dark-700 text-dark-300 text-sm rounded-lg py-1.5 px-3 focus:outline-none focus:border-dark-500 transition-colors cursor-pointer appearance-none min-w-[120px]"
          >
            <option value="">Toàn thời gian</option>
            <option value="this_month">Tháng này</option>
            <option value="custom">Tùy chọn...</option>
          </select>

          {filters.month === 'custom' && (
            <div className="flex items-center gap-2 bg-dark-900 border border-dark-700 rounded-lg pr-1 h-[34px]">
              <DatePicker
                selected={filters.startDate}
                onChange={(date) => setFilters(f => ({ ...f, startDate: date }))}
                selectsStart
                startDate={filters.startDate}
                endDate={filters.endDate}
                placeholderText="Từ ngày"
                className="bg-transparent text-dark-300 text-sm py-1.5 px-3 focus:outline-none w-24 placeholder:text-dark-500"
                dateFormat="dd/MM/yyyy"
              />
              <span className="text-dark-500">-</span>
              <DatePicker
                selected={filters.endDate}
                onChange={(date) => setFilters(f => ({ ...f, endDate: date }))}
                selectsEnd
                startDate={filters.startDate}
                endDate={filters.endDate}
                minDate={filters.startDate}
                placeholderText="Đến ngày"
                className="bg-transparent text-dark-300 text-sm py-1.5 px-3 focus:outline-none w-24 placeholder:text-dark-500"
                dateFormat="dd/MM/yyyy"
              />
            </div>
          )}
        </div>

        {/* Tabs Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {STATUS_TABS.map(tab => {
            const count = processedTasks.counts[tab.id] || 0;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
                  isActive 
                    ? 'bg-primary-500/10 border-primary-500 text-primary-400' 
                    : 'bg-transparent border-dark-700 text-dark-400 hover:text-dark-200 hover:border-dark-600'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 bg-dark-900 border border-dark-700/50 rounded-2xl overflow-hidden flex flex-col shadow-xl">
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Loader className="animate-spin text-primary-500" size={32} />
            </div>
          ) : processedTasks.filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-dark-500">
              <p>Không có công việc nào phù hợp</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
              <thead className="bg-dark-800/80 text-dark-300 sticky top-0 z-10 shadow-sm border-b border-dark-700">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">ID</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider w-[40%]">Tiêu đề</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Mức độ</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Hạn chót</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Phụ trách</th>
                  <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider rounded-tr-xl text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {paginatedTasks.map(task => {
                  const fakeId = `TASK-${task._id.slice(-4).toUpperCase()}`;
                  return (
                    <tr key={task._id} className="hover:bg-dark-800/40 transition-colors group">
                      <td className="px-6 py-4 text-dark-400 font-mono text-xs">{fakeId}</td>
                      <td className="px-6 py-4">
                        <Link to={`/tasks/${task._id}`} className="font-semibold text-dark-100 hover:text-primary-400 transition-colors line-clamp-1 block">
                          {task.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-dark-400 text-xs">
                        {statusLabel[task.status]}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${priorityColor[task.priority]}`}>
                          {priorityLabel[task.priority]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-dark-300">
                        {task.deadline ? format(new Date(task.deadline), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 text-dark-300">
                        {task.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[100px] block">{task.assignedTo.name}</span>
                            {userTaskCounts[task.assignedTo._id] >= taskLimit && (
                              <span title={`Quá tải (${userTaskCounts[task.assignedTo._id]}/${taskLimit})`} className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20 whitespace-nowrap">
                                QUÁ TẢI
                              </span>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setTaskToEdit(task);
                              setShowModal(true);
                            }}
                            className="p-1.5 text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                            title="Sửa công việc"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleRemind(task._id)}
                            className="p-1.5 text-dark-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Gửi email nhắc nhở"
                          >
                            <Bell size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(task._id)}
                            className="p-1.5 text-dark-400 hover:text-danger-500 hover:bg-danger-500/10 rounded-lg transition-colors"
                            title="Xóa công việc"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer info showing count and pagination */}
        {!loading && processedTasks.filtered.length > 0 && (
          <div className="bg-dark-800/50 border-t border-dark-700 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-dark-400 font-medium">
            <div>
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, processedTasks.filtered.length)} trong tổng số {processedTasks.filtered.length} công việc
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-dark-600 hover:bg-dark-700 hover:text-dark-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Trước
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold transition-colors ${
                        currentPage === i + 1 
                          ? 'bg-primary-600 text-white' 
                          : 'border border-dark-600 hover:bg-dark-700 hover:text-dark-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-dark-600 hover:bg-dark-700 hover:text-dark-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <TaskFormModal
          task={taskToEdit}
          onClose={() => {
            setShowModal(false);
            setTaskToEdit(null);
          }}
        />
      )}

      {showLimitModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowLimitModal(false)}>
          <div className="modal max-w-sm animate-fade-in">
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-dark-100">Cài đặt hiển thị</h2>
            </div>
            <div className="modal-body space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Giới hạn quá tải nhân viên</label>
                <p className="text-xs text-dark-400 mb-2">Số lượng công việc tối đa trước khi cảnh báo quá tải:</p>
                <input
                  type="number"
                  min="1"
                  className="input w-full"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  placeholder="Ví dụ: 15"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveLimit()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Số lượng trên mỗi trang</label>
                <p className="text-xs text-dark-400 mb-2">Số công việc hiển thị trên một trang danh sách:</p>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="input w-full"
                  value={pageLimitInput}
                  onChange={(e) => setPageLimitInput(e.target.value)}
                  placeholder="Ví dụ: 8"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveLimit()}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-dark-700/50 bg-dark-900/50 rounded-b-xl">
              <button onClick={() => setShowLimitModal(false)} className="px-4 py-2 text-sm font-medium text-dark-300 hover:text-dark-100 transition-colors">
                Hủy
              </button>
              <button onClick={handleSaveLimit} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 rounded-lg shadow-sm transition-colors">
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskListPage;
