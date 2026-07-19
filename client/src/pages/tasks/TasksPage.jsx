import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks } from '../../redux/slices/tasksSlice';
import { ListTodo, CheckCircle2, AlertTriangle, Percent, CheckSquare, Loader, Filter, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const StatCard = ({ title, value, subtitle, icon: Icon, color, bgClass }) => (
  <div className={`p-6 rounded-2xl border border-dark-700/50 shadow-lg relative overflow-hidden group ${bgClass}`}>
    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500">
      <Icon size={64} className="text-white" />
    </div>
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 shadow-inner ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <div className="text-3xl font-black text-white tracking-tight">{value ?? '—'}</div>
        <div className="text-sm font-medium text-dark-100 mt-1">{title}</div>
        {subtitle && <div className="text-xs text-dark-300 mt-1">{subtitle}</div>}
      </div>
    </div>
  </div>
);

const TasksPage = () => {
  const dispatch = useDispatch();
  const { items: tasks, loading } = useSelector(s => s.tasks);

  const [filters, setFilters] = useState({
    assignee: '',
    priority: '',
    month: '',
    startDate: null,
    endDate: null
  });

  useEffect(() => {
    dispatch(fetchTasks({ limit: 1000 }));
  }, [dispatch]);

  // Extract unique assignees from tasks for the filter dropdown
  const assignees = useMemo(() => {
    if (!tasks) return [];
    const map = new Map();
    tasks.forEach(t => {
      if (t.assignedTo) map.set(t.assignedTo._id, t.assignedTo.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const stats = useMemo(() => {
    if (!tasks) return null;

    // Apply filters
    const filteredTasks = tasks.filter(t => {
      if (filters.assignee && t.assignedTo?._id !== filters.assignee) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.month === 'custom' && filters.startDate && filters.endDate) {
        const taskDate = new Date(t.createdAt);
        // Set taskDate to start of day for comparison
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

    const total = filteredTasks.length;
    const todo = filteredTasks.filter(t => t.status === 'todo').length;
    const doing = filteredTasks.filter(t => t.status === 'doing').length;
    const review = filteredTasks.filter(t => t.status === 'review').length;
    const done = filteredTasks.filter(t => t.status === 'done').length;
    const highPriority = filteredTasks.filter(t => t.priority === 'high').length;
    const overdue = filteredTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done').length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    // Status Donut Chart
    const statusData = [
      { name: 'Cần làm', value: todo, color: '#64748b' }, // slate-500
      { name: 'Đang làm', value: doing, color: '#0ea5e9' }, // sky-500
      { name: 'Chờ duyệt', value: review, color: '#eab308' }, // yellow-500
      { name: 'Hoàn thành', value: done, color: '#22c55e' }, // green-500
    ].filter(d => d.value > 0);

    // Priority Bar Chart
    const low = filteredTasks.filter(t => t.priority === 'low').length;
    const medium = filteredTasks.filter(t => t.priority === 'medium').length;
    const priorityData = [
      { name: 'Thấp', count: low, fill: '#34d399' },
      { name: 'TB', count: medium, fill: '#fbbf24' },
      { name: 'Cao', count: highPriority, fill: '#f87171' },
    ];

    // Member Multi-Bar Chart (Full Width Layout)
    const memberMap = {};
    filteredTasks.forEach(t => {
      const name = t.assignedTo?.name?.split(' ')[0] || 'Chưa giao';
      if (!memberMap[name]) memberMap[name] = { name, todo: 0, doing: 0, review: 0, done: 0, total: 0 };
      
      memberMap[name].total += 1;
      if (t.status === 'todo') memberMap[name].todo += 1;
      else if (t.status === 'doing') memberMap[name].doing += 1;
      else if (t.status === 'review') memberMap[name].review += 1;
      else if (t.status === 'done') memberMap[name].done += 1;
    });
    
    // Sort members by total tasks
    const memberData = Object.values(memberMap).sort((a, b) => b.total - a.total);

    // Project Stats
    const projectMap = {};
    filteredTasks.forEach(t => {
      const projId = t.project?._id || t.project || 'unknown';
      const projName = t.project?.name || 'Dự án (Không rõ tên)';
      if (!projectMap[projId]) {
        projectMap[projId] = { name: projName, total: 0, done: 0 };
      }
      projectMap[projId].total += 1;
      if (t.status === 'done') projectMap[projId].done += 1;
    });

    const projectData = Object.values(projectMap)
      .map(p => ({
        ...p,
        completion: p.total > 0 ? Math.round((p.done / p.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);

    return { total, todo, done, highPriority, overdue, completionRate, statusData, priorityData, memberData, projectData };
  }, [tasks, filters]);

  if (loading || !stats) {
    return <div className="p-12 flex justify-center"><Loader className="animate-spin text-primary-500" size={40} /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header & Filters Section */}
      <div className="bg-dark-900 border border-dark-700 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
            Thống Kê Tổng Quan
          </h1>
          <p className="text-dark-400 text-sm mt-1">Phân tích hiệu suất và tiến độ công việc</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-dark-800 p-2 rounded-xl border border-dark-700/50">
          <div className="flex items-center gap-2 pl-2 pr-3 text-dark-300">
            <Filter size={16} />
            <span className="text-sm font-medium">Bộ lọc:</span>
          </div>
          
          <select
            value={filters.assignee}
            onChange={(e) => setFilters(f => ({ ...f, assignee: e.target.value }))}
            className="bg-dark-900 border border-dark-600 text-dark-100 text-sm rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary-500/50 transition-all outline-none"
          >
            <option value="">Tất cả người phụ trách</option>
            {assignees.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
            className="bg-dark-900 border border-dark-600 text-dark-100 text-sm rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary-500/50 transition-all outline-none"
          >
            <option value="">Tất cả ưu tiên</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>

          <select
            value={filters.month}
            onChange={(e) => setFilters(f => ({ ...f, month: e.target.value }))}
            className="bg-dark-900 border border-dark-600 text-dark-100 text-sm rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary-500/50 transition-all outline-none"
          >
            <option value="">Toàn thời gian</option>
            <option value="this_month">Tháng này</option>
            <option value="custom">Tùy chọn...</option>
          </select>

          {filters.month === 'custom' && (
            <div className="flex items-center gap-2 bg-dark-900 border border-dark-600 rounded-lg pr-1">
              <DatePicker
                selected={filters.startDate}
                onChange={(date) => setFilters(f => ({ ...f, startDate: date }))}
                selectsStart
                startDate={filters.startDate}
                endDate={filters.endDate}
                placeholderText="Từ ngày"
                className="bg-transparent text-dark-100 text-sm py-2 px-3 focus:outline-none w-24 placeholder:text-dark-500"
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
                className="bg-transparent text-dark-100 text-sm py-2 px-3 focus:outline-none w-24 placeholder:text-dark-500"
                dateFormat="dd/MM/yyyy"
              />
            </div>
          )}
        </div>
      </div>

      {/* 6 KPI Cards Row with Redesigned Gradient Backgrounds */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
        <StatCard
          title="Tổng Công Việc"
          value={stats.total}
          icon={ListTodo}
          bgClass="bg-gradient-to-br from-indigo-900/40 to-indigo-800/10"
          color="bg-indigo-500"
        />
        <StatCard
          title="Cần Làm"
          value={stats.todo}
          icon={CheckSquare}
          bgClass="bg-gradient-to-br from-amber-900/40 to-amber-800/10"
          color="bg-amber-500"
        />
        <StatCard
          title="Hoàn Thành"
          value={stats.done}
          icon={CheckCircle2}
          bgClass="bg-gradient-to-br from-emerald-900/40 to-emerald-800/10"
          color="bg-emerald-500"
        />
        <StatCard
          title="Ưu Tiên Cao"
          value={stats.highPriority}
          icon={AlertTriangle}
          bgClass="bg-gradient-to-br from-rose-900/40 to-rose-800/10"
          color="bg-rose-500"
        />
        <StatCard
          title="Quá Hạn"
          value={stats.overdue}
          icon={Clock}
          bgClass="bg-gradient-to-br from-red-900/40 to-red-800/10"
          color="bg-red-500"
        />
        <StatCard
          title="Tỷ Lệ Hoàn Thành"
          value={`${stats.completionRate}%`}
          icon={Percent}
          bgClass="bg-gradient-to-br from-fuchsia-900/40 to-fuchsia-800/10"
          color="bg-fuchsia-500"
        />
      </div>

      {/* 2 Charts Row: Status (Donut) and Priority (Modern Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Modern Donut Chart for Status */}
        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-dark-50 mb-2 border-b border-dark-700/50 pb-3">Phân Bổ Trạng Thái</h2>
          <div className="h-[320px] relative" style={{ minHeight: 320 }}>
            <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#64748b', strokeWidth: 1, length1: 10, length2: 10 }}
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  cursor={false}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }} 
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text for Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-3xl font-black text-white">{stats.total}</span>
              <span className="text-xs font-medium text-dark-400 uppercase tracking-widest mt-1">Tasks</span>
            </div>
          </div>
        </div>

        {/* Modern Bar Chart for Priority */}
        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-dark-50 mb-2 border-b border-dark-700/50 pb-3">Mức Độ Ưu Tiên</h2>
          <div className="h-[320px] mt-4" style={{ minHeight: 320 }}>
            <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={stats.priorityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  {/* Linear Gradients for Bars */}
                  <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip 
                  cursor={{ fill: '#1e293b', opacity: 0.6 }} 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }} 
                />
                <Bar dataKey="count" name="Số lượng" radius={[8, 8, 0, 0]} maxBarSize={50}>
                  {stats.priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.name === 'Thấp' ? 'url(#colorLow)' :
                      entry.name === 'TB' ? 'url(#colorMedium)' :
                      'url(#colorHigh)'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Thống Kê Dự Án (Project Stats) Row */}
      <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6 shadow-lg">
        <h2 className="text-lg font-bold text-dark-50 mb-4 border-b border-dark-700/50 pb-3">Thống Kê Dự Án</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.projectData.map((proj, idx) => (
            <div key={idx} className="bg-dark-800 p-4 rounded-xl border border-dark-700 shadow-sm flex flex-col gap-2 relative overflow-hidden transition-all hover:border-primary-500/50">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-dark-100 truncate pr-2" title={proj.name}>{proj.name}</h3>
                <span className="text-xs font-medium bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded-full whitespace-nowrap border border-primary-500/20">
                  {proj.total} công việc
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-dark-400">
                  Đã xong: <strong className="text-dark-200">{proj.done}/{proj.total}</strong>
                </span>
                <span className={`font-bold ${proj.completion === 100 ? 'text-success-500' : 'text-primary-500'}`}>{proj.completion}%</span>
              </div>
              <div className="w-full h-1.5 bg-dark-950 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full rounded-full ${proj.completion === 100 ? 'bg-success-500' : 'bg-primary-500'} transition-all duration-1000`} 
                  style={{ width: `${proj.completion}%` }}
                ></div>
              </div>
            </div>
          ))}
          {stats.projectData.length === 0 && (
            <div className="col-span-full py-8 text-center text-dark-400 bg-dark-800 rounded-xl border border-dark-700 border-dashed">
              Không có dự án nào phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TasksPage;
