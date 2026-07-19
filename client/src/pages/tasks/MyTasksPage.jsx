import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Clock, Plus, Search, Filter, Calendar, LayoutGrid, List as ListIcon, Sparkles, MoreHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import { fetchMyTasks, changeTaskStatus, updateTaskProgress } from '../../redux/slices/tasksSlice';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import AISuggestionPanel from '../../components/tasks/AISuggestionPanel';

const MyTasksPage = () => {
  const dispatch = useDispatch();
  const { myTasks, loading } = useSelector(s => s.tasks);
  const { isAdminOrPM, isEmployee } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('board');
  
  // New State for Advanced Kanban Layout
  const [colSearch, setColSearch] = useState({ todo: '', doing: '', review: '', done: '' });
  const [colLimits, setColLimits] = useState({ todo: 10, doing: 10, review: 10, done: 10 });
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (colKey, groupTitle) => {
    const key = `${colKey}-${groupTitle}`;
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLoadMore = (colKey) => {
    setColLimits(prev => ({ ...prev, [colKey]: prev[colKey] + 10 }));
  };

  useEffect(() => {
    dispatch(fetchMyTasks({ sort: 'deadline', limit: 100 }));
  }, [dispatch]);

  const handleStatusChange = async (taskId, currentStatus) => {
    const next = currentStatus === 'todo' ? 'doing' : currentStatus === 'doing' ? 'review' : currentStatus === 'review' ? 'done' : null;
    if (!next) return;
    
    if (isEmployee && next === 'done') {
      toast.error('Chỉ Quản lý mới có thể chuyển công việc sang Hoàn thành');
      return;
    }

    const res = await dispatch(changeTaskStatus({ id: taskId, status: next }));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success(`Chuyển sang ${STATUS_LABELS[next]}`);
    }
  };

  const handleProgressChange = async (taskId, progress) => {
    try {
      await dispatch(updateTaskProgress({ id: taskId, progress: parseInt(progress, 10) })).unwrap();
      // Only show success toast if we want, but it might be spammy. 
      // toast.success('Đã cập nhật tiến độ');
    } catch (error) {
      toast.error('Lỗi khi cập nhật tiến độ');
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    
    if (isEmployee && newStatus === 'done') {
      toast.error('Chỉ Quản lý mới có thể chuyển công việc sang Hoàn thành');
      return;
    }

    const res = await dispatch(changeTaskStatus({ id: draggableId, status: newStatus }));
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success(`Đã chuyển sang ${STATUS_LABELS[newStatus]}`);
      dispatch(fetchMyTasks({ sort: 'deadline' }));
    }
  };

  // Lấy danh sách phụ trách (unique)
  const uniqueAssignees = [];
  const assigneeMap = new Map();
  
  myTasks.forEach(t => {
    if (t.assignedTo) {
      const assigneeId = typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo._id;
      if (assigneeId && !assigneeMap.has(assigneeId)) {
        assigneeMap.set(assigneeId, true);
        uniqueAssignees.push(t.assignedTo);
      }
    }
  });

  let filteredTasks = myTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter ? task.priority === priorityFilter : true;
    const matchesAssignee = assigneeFilter ? task.assignedTo?._id === assigneeFilter : true;
    
    let matchesStatus = true;
    if (statusFilter === 'uncompleted') {
      matchesStatus = task.status !== 'done';
    } else if (statusFilter !== '') {
      matchesStatus = task.status === statusFilter;
    }

    let matchesDate = true;
    if (dateFilter === 'custom' && startDate && endDate) {
      if (!task.deadline) matchesDate = false;
      else {
        const d = new Date(task.deadline);
        d.setHours(0, 0, 0, 0);
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        matchesDate = d >= s && d <= e;
      }
    } else if (dateFilter === 'this_month') {
      if (!task.deadline) matchesDate = false;
      else {
        const d = new Date(task.deadline);
        const now = new Date();
        matchesDate = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
    } else if (dateFilter === 'next_month') {
      if (!task.deadline) matchesDate = false;
      else {
        const d = new Date(task.deadline);
        const now = new Date();
        matchesDate = d.getMonth() === (now.getMonth() + 1) % 12 && 
                      d.getFullYear() === (now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear());
      }
    } else if (dateFilter === 'overdue') {
      if (!task.deadline || task.status === 'done') matchesDate = false;
      else {
        // Only ignore time of day for overdue check
        const d = new Date(task.deadline);
        const now = new Date();
        d.setHours(23, 59, 59, 999);
        matchesDate = d < now;
      }
    } else if (dateFilter === 'almost_overdue') {
      if (!task.deadline || task.status === 'done') matchesDate = false;
      else {
        const d = new Date(task.deadline);
        const now = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(now.getDate() + 3);
        
        now.setHours(0, 0, 0, 0);
        d.setHours(23, 59, 59, 999);
        matchesDate = d >= now && d <= threeDaysLater;
      }
    }

    return matchesSearch && matchesPriority && matchesAssignee && matchesDate && matchesStatus;
  });

  filteredTasks.sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  const grouped = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    doing: filteredTasks.filter(t => t.status === 'doing'),
    review: filteredTasks.filter(t => t.status === 'review'),
    done: filteredTasks.filter(t => t.status === 'done'),
  };

  const columns = [
    { key: 'todo', label: 'Cần làm' },
    { key: 'doing', label: 'Đang làm' },
    { key: 'review', label: 'Chờ duyệt' },
    { key: 'done', label: 'Hoàn thành' },
  ];

  const getCardStyle = (status) => {
    switch (status) {
      case 'todo': return 'bg-warning-500/5 border-warning-500/20 border-l-[4px] border-l-warning-500';
      case 'doing': return 'bg-blue-500/5 border-blue-500/20 border-l-[4px] border-l-blue-500';
      case 'review': return 'bg-danger-500/5 border-danger-500/20 border-l-[4px] border-l-danger-500';
      case 'done': return 'bg-success-500/5 border-success-500/20 border-l-[4px] border-l-success-500';
      default: return 'bg-dark-800 border-dark-700 border-l-[4px] border-l-dark-500';
    }
  };

  const renderColumnContent = (colKey, allTasksInCol) => {
    let tasks = allTasksInCol;
    const cSearch = colSearch[colKey];
    if (cSearch) {
      tasks = tasks.filter(t => t.title.toLowerCase().includes(cSearch.toLowerCase()) || t._id.toLowerCase().includes(cSearch.toLowerCase()));
    }
  
    const isCapped = tasks.length > colLimits[colKey];
    const displayTasks = tasks.slice(0, colLimits[colKey]);
  
    const groups = {
      'Quá hạn': [],
      'Hôm nay': [],
      'Tuần này': [],
      'Sau này': [],
      'Trước đó': []
    };
  
    const now = new Date();
    now.setHours(0,0,0,0);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
  
    displayTasks.forEach(task => {
      if (colKey === 'done') {
        if (task.completedAt) {
          const d = new Date(task.completedAt);
          d.setHours(0,0,0,0);
          if (d.getTime() === now.getTime()) groups['Hôm nay'].push(task);
          else if (d > now - 7*24*3600*1000) groups['Tuần này'].push(task);
          else groups['Trước đó'].push(task);
        } else {
          groups['Trước đó'].push(task);
        }
        return;
      }
  
      if (!task.deadline) {
        groups['Sau này'].push(task);
        return;
      }
      const d = new Date(task.deadline);
      d.setHours(0,0,0,0);
      
      if (d < now && task.status !== 'done') groups['Quá hạn'].push(task);
      else if (d.getTime() === now.getTime()) groups['Hôm nay'].push(task);
      else if (d > now && d <= endOfWeek) groups['Tuần này'].push(task);
      else groups['Sau này'].push(task);
    });
  
    let order = ['Quá hạn', 'Hôm nay', 'Tuần này', 'Sau này'];
    if (colKey === 'done') order = ['Hôm nay', 'Tuần này', 'Trước đó'];
  
    let globalIndex = 0;
    const elements = [];
  
    order.forEach(gTitle => {
      const groupTasks = groups[gTitle];
      if (groupTasks.length === 0) return;
  
      const isCollapsed = collapsedGroups[`${colKey}-${gTitle}`];
  
      elements.push(
        <div key={`header-${colKey}-${gTitle}`} 
             onClick={() => toggleGroup(colKey, gTitle)}
             className={`flex items-center justify-between text-xs font-bold py-2 mt-1 cursor-pointer hover:bg-dark-800/30 rounded-lg px-2 transition-colors ${
               gTitle === 'Quá hạn' ? 'text-danger-500 border-l-[3px] border-danger-500 bg-danger-500/5' : 
               gTitle === 'Hôm nay' ? 'text-dark-200 border-l-[3px] border-warning-500 bg-warning-500/5' :
               gTitle === 'Tuần này' ? 'text-dark-300 border-l-[3px] border-primary-500 bg-primary-500/5' :
               'text-dark-400 border-l-[3px] border-dark-500'
             }`}>
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className={gTitle === 'Quá hạn' ? 'text-danger-500' : 'text-dark-400'} />
            <span>{gTitle} ({groupTasks.length})</span>
          </div>
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </div>
      );
  
      if (!isCollapsed) {
        groupTasks.forEach(task => {
          const taskIdStr = task._id.substring(task._id.length - 4).toUpperCase();
          
          elements.push(
            <Draggable key={task._id} draggableId={task._id} index={globalIndex}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={`mt-2 rounded-xl p-3 bg-white dark:bg-dark-800 border shadow-sm transition-all duration-300 cursor-grab active:cursor-grabbing ${
                    colKey === 'todo' ? 'border-warning-500/30' :
                    colKey === 'doing' ? 'border-blue-500/30' :
                    colKey === 'review' ? 'border-danger-500/30' :
                    'border-success-500/30'
                  } ${
                    snapshot.isDragging 
                      ? 'ring-2 ring-primary-500 shadow-xl scale-105 rotate-1 z-50 bg-white/90 dark:bg-dark-800/90 backdrop-blur-md' 
                      : 'hover:shadow-md hover:border-dark-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[10px] font-bold text-dark-400 uppercase">
                      TASK-{taskIdStr}
                    </div>
                    {task.deadline && colKey !== 'done' && (
                      <div className="text-[10px] font-medium text-dark-500">
                        {format(new Date(task.deadline), 'dd/MM')}
                      </div>
                    )}
                  </div>
  
                  <Link to={`/tasks/${task._id}`} className="font-bold text-sm text-dark-50 hover:text-primary-500 transition-colors line-clamp-2 leading-tight mb-3">
                    {task.title}
                  </Link>
  
                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      task.priority === 'high' ? 'bg-danger-500/10 text-danger-500' :
                      task.priority === 'medium' ? 'bg-warning-500/10 text-warning-500' : 
                      'bg-success-500/10 text-success-500'
                    }`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
  
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-[8px] font-bold text-white shadow-sm ring-1 ring-white/10">
                        {(task.assignedTo?.name?.slice(0, 2) || 'NA').toUpperCase()}
                      </div>
                      
                      {colKey !== 'todo' && colKey !== 'done' && (
                        <div className="flex items-center gap-1">
                          <div className="relative flex items-center justify-center w-[18px] h-[18px]" title="Tiến độ" onClick={e => e.stopPropagation()}>
                             <svg className="w-full h-full transform -rotate-90 cursor-pointer" onClick={() => handleProgressChange(task._id, Math.min((task.progress||0) + 10, 100))}>
                               <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" fill="transparent" className="text-dark-700" />
                               <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" fill="transparent" 
                                 strokeDasharray={2 * Math.PI * 7} 
                                 strokeDashoffset={2 * Math.PI * 7 - ((task.progress||0) / 100) * 2 * Math.PI * 7} 
                                 className={colKey === 'doing' ? 'text-blue-500' : 'text-danger-500'} 
                               />
                             </svg>
                          </div>
                          <span className="text-[10px] font-semibold text-dark-300">{task.progress || 0}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Draggable>
          );
          globalIndex++;
        });
      }
    });
  
    if (elements.length === 0 && !cSearch) {
      elements.push(
        <div key="empty" className="p-4 text-center text-dark-500 text-xs border-2 border-dashed border-dark-700/50 rounded-xl mt-2">
          Không có công việc nào
        </div>
      );
    } else if (elements.length === 0 && cSearch) {
      elements.push(
        <div key="empty" className="p-4 text-center text-dark-500 text-xs border-2 border-dashed border-dark-700/50 rounded-xl mt-2">
          Không tìm thấy công việc
        </div>
      );
    }
  
    return (
      <>
        {elements}
        {isCapped && (
          <button 
            onClick={() => handleLoadMore(colKey)}
            className="w-full mt-3 py-2 text-xs font-semibold text-dark-400 border border-dark-700/50 rounded-lg hover:bg-dark-800/50 transition-colors flex items-center justify-center gap-1"
          >
            <Plus size={12} /> Xem thêm {tasks.length - colLimits[colKey]} task khác
          </button>
        )}
      </>
    );
  };

  const getDeadlineStyle = (status, isOverdue) => {
    if (status === 'done') return 'bg-success-500/20 text-success-500 font-bold';
    if (isOverdue) return 'bg-danger-500/20 text-danger-500 font-bold';
    return 'bg-warning-500/20 text-warning-500 font-bold';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4 space-y-3">
            <div className="skeleton h-6 w-1/2" />
            {[...Array(3)].map((_, j) => (
              <div key={j} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Panel — full width at top */}
      <AISuggestionPanel defaultOpen={true} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50 flex items-center gap-2">
            Việc của tôi
          </h1>
          <p className="text-dark-400 text-sm mt-1">Đang hiển thị {filteredTasks.length} / {myTasks.length} công việc</p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col xl:flex-row items-center gap-4 w-full bg-dark-900/50 p-2 sm:p-3 rounded-2xl border border-dark-700/50 shadow-sm">
          <div className="relative w-full xl:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Tìm kiếm công việc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-800/80 border border-dark-700 focus:border-primary-500/50 text-sm rounded-full py-2.5 outline-none text-dark-100 placeholder-dark-500 transition-colors"
              style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
            />
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            <span className="text-dark-400 text-sm font-medium flex items-center gap-1.5 whitespace-nowrap pl-2">
              <Filter size={14} /> Bộ lọc:
            </span>
            
            {isAdminOrPM && (
              <select 
                className="bg-dark-800 border border-dark-700 text-dark-200 text-sm rounded-full py-1.5 px-3 min-w-[140px] focus:outline-none focus:border-primary-500/50 transition-colors"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
              >
                <option value="">Tất cả phụ trách</option>
                {uniqueAssignees.map(u => {
                  const uId = typeof u === 'string' ? u : u._id;
                  const uName = typeof u === 'string' ? `ID: ${uId.slice(-4)}` : u.name;
                  return <option key={uId} value={uId}>{uName}</option>;
                })}
              </select>
            )}
            
            <select 
              className="bg-dark-800 border border-dark-700 text-dark-200 text-sm rounded-full py-1.5 px-3 min-w-[140px] focus:outline-none focus:border-primary-500/50 transition-colors"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="uncompleted">Chưa hoàn thành</option>
              <option value="todo">Cần làm</option>
              <option value="doing">Đang làm</option>
              <option value="review">Chờ duyệt</option>
              <option value="done">Hoàn thành</option>
            </select>

            <select 
              className="bg-dark-800 border border-dark-700 text-dark-200 text-sm rounded-full py-1.5 px-3 min-w-[140px] focus:outline-none focus:border-primary-500/50 transition-colors"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">Tất cả mức độ</option>
              <option value="high">Cao</option>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
            </select>
            
            <select 
              className="bg-dark-800 border border-dark-700 text-dark-200 text-sm rounded-full py-1.5 px-3 min-w-[120px] focus:outline-none focus:border-primary-500/50 transition-colors"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="">Tất cả thời gian</option>
              <option value="this_month">Tháng này</option>
              <option value="next_month">Tháng sau</option>
              <option value="almost_overdue">Sắp quá hạn (≤ 3 ngày)</option>
              <option value="overdue">Quá hạn</option>
              <option value="custom">Tùy chọn...</option>
            </select>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 bg-dark-800 border border-dark-700 rounded-full pr-1 h-[34px]">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="Từ ngày"
                  className="bg-transparent text-dark-200 text-sm py-1.5 px-3 focus:outline-none w-24 placeholder:text-dark-500"
                  dateFormat="dd/MM/yyyy"
                />
                <span className="text-dark-500">-</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  placeholderText="Đến ngày"
                  className="bg-transparent text-dark-200 text-sm py-1.5 px-3 focus:outline-none w-24 placeholder:text-dark-500"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            )}
            
            <div className="h-6 w-px bg-dark-700 mx-1 hidden sm:block"></div>
            
            <div className="flex items-center bg-dark-800 p-1 rounded-full border border-dark-700/50 sm:ml-auto">
              <button 
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${viewMode === 'board' ? 'bg-primary-500 text-white shadow-sm' : 'text-dark-400 hover:text-dark-100'}`}
                title="Giao diện bảng (Board)"
              >
                <LayoutGrid size={14} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-white shadow-sm' : 'text-dark-400 hover:text-dark-100'}`}
                title="Giao diện danh sách (List)"
              >
                <ListIcon size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'board' ? (
        <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 h-[calc(100vh-210px)] min-h-[300px] max-h-[800px]">
          {columns.map(({ key, label }) => {
            const colColor = key === 'todo' ? 'bg-warning-500' : key === 'doing' ? 'bg-blue-500' : key === 'review' ? 'bg-danger-500' : 'bg-success-500';
            
            return (
              <div key={key} className="relative h-full min-h-[300px]">
                <div className="absolute inset-0 flex flex-col overflow-hidden bg-white/5 dark:bg-dark-900/20 rounded-2xl p-2 sm:p-3 border border-dark-700/50 shadow-sm transition-colors">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${colColor}`} />
                      <span className="font-bold text-dark-100 text-[15px]">{label} <span className="text-dark-400 font-medium ml-0.5">({grouped[key]?.length || 0})</span></span>
                    </div>
                    <button className="w-6 h-6 rounded flex items-center justify-center text-dark-400 hover:text-dark-100 transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                  
                  {/* Column Search */}
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm trong cột..."
                      value={colSearch[key] || ''}
                      onChange={(e) => setColSearch(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full bg-white dark:bg-dark-800/60 border border-dark-700 focus:border-primary-500/50 text-[13px] rounded-lg py-2 outline-none text-dark-100 placeholder-dark-500 transition-colors"
                      style={{ paddingLeft: '2.25rem', paddingRight: '0.75rem' }}
                    />
                  </div>
  
                  {/* Task cards Droppable */}
                  <Droppable droppableId={key}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 pb-4 transition-all duration-300 ${
                          snapshot.isDraggingOver ? 'bg-dark-800/40 rounded-xl p-1' : ''
                        }`}
                      >
                        {renderColumnContent(key, grouped[key] || [])}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            );
          })}
        </div>
        </DragDropContext>
      ) : (
        <div className="table-wrapper h-[calc(100vh-210px)] min-h-[500px] overflow-y-auto custom-scrollbar">
          <table className="table min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-dark-950 shadow-sm border-b border-dark-700">
              <tr>
                <th className="w-24">Task ID</th>
                <th>Tên công việc</th>
                <th>Trạng thái</th>
                <th>Mức độ</th>
                <th>Phụ trách</th>
                <th>Thời hạn</th>
                <th>Tiến độ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-dark-500">Không có công việc nào</td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
                  const taskIdStr = task._id.substring(task._id.length - 4).toUpperCase();
                  
                  return (
                    <tr key={task._id} className="hover:bg-dark-900/50 transition-colors border-b border-dark-700/50">
                      <td className="text-xs font-medium text-dark-500 uppercase">
                        TASK-{taskIdStr}
                      </td>
                      <td>
                        <Link to={`/tasks/${task._id}`} className="font-bold text-dark-50 hover:text-primary-400 transition-colors line-clamp-1">
                          {task.title}
                        </Link>
                      </td>
                      <td>
                        <span className={`badge badge-${task.status}`}>
                          {STATUS_LABELS[task.status]}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${task.priority}`}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                            {(task.assignedTo?.name?.slice(0, 2) || 'NA').toUpperCase()}
                          </div>
                          <span className="text-sm text-dark-300 line-clamp-1 max-w-[120px]">{task.assignedTo?.name || 'Chưa giao'}</span>
                        </div>
                      </td>
                      <td>
                        {task.deadline ? (
                          <span className={`text-[11px] px-2 py-1 rounded-md inline-flex items-center gap-1.5 ${getDeadlineStyle(task.status, isOverdue)}`}>
                            <Clock size={12} />
                            {format(new Date(task.deadline), 'dd/MM/yyyy')}
                          </span>
                        ) : (
                          <span className="text-dark-500 text-sm">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-[60px] max-w-[100px] h-2 bg-dark-700 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${task.progress || 0}%` }}></div>
                          </div>
                          <span className="text-xs text-dark-400 min-w-[28px]">{task.progress || 0}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyTasksPage;
