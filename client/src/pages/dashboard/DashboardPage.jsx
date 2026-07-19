import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  BarChart2, CheckCircle2, Clock, AlertTriangle, FolderOpen,
  ArrowRight, TrendingUp, CalendarClock, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { statsAPI } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { fetchTasks } from '../../redux/slices/tasksSlice';
import { fetchProjects } from '../../redux/slices/projectsSlice';
import { format, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import AISuggestionPanel from '../../components/tasks/AISuggestionPanel';

const StatCard = ({ title, value, subtitle, icon: Icon, color, gradient }) => (
  <div className="card-hover p-6 relative overflow-hidden group cursor-default">
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${gradient}`} />
    <div className="relative z-10">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="text-3xl font-bold text-dark-50 mb-1">{value ?? '—'}</div>
      <div className="text-sm font-medium text-dark-300">{title}</div>
      {subtitle && <div className="text-xs text-dark-500 mt-0.5">{subtitle}</div>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 shadow-2xl text-sm">
      <p className="font-semibold text-dark-100 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-dark-300">{p.name}:</span>
          <span className="font-bold text-dark-100">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { user, isAdminOrPM } = useAuth();
  const { items: tasks, loading: tasksLoading } = useSelector(s => s.tasks);
  const { items: projects } = useSelector(s => s.projects);

  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [weeklyChart, setWeeklyChart] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [projectProgress, setProjectProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchTasks({ limit: 5, sort: '-updatedAt' }));
    dispatch(fetchProjects({ limit: 5, status: 'active' }));

    const loadStats = async () => {
      try {
        const [dashRes, recentRes, weeklyRes, deadlinesRes, progressRes] = await Promise.all([
          statsAPI.getDashboard(),
          statsAPI.getRecentTasks(),
          statsAPI.getWeeklyChart(),
          statsAPI.getUpcomingDeadlines(),
          statsAPI.getProjectProgress(),
        ]);
        setStats(dashRes.data.data);
        setRecentTasks(recentRes.data.data);
        setWeeklyChart(weeklyRes.data.data || []);
        setUpcomingDeadlines(deadlinesRes.data.data || []);
        setProjectProgress(progressRes.data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [dispatch]);

  const statusColors = {
    todo: 'bg-dark-700 text-dark-300',
    doing: 'bg-blue-500/20 text-blue-400',
    review: 'bg-purple-500/20 text-purple-400',
    done: 'bg-success-500/20 text-success-500',
  };

  const statusLabels = { todo: 'Cần làm', doing: 'Đang làm', review: 'Chờ duyệt', done: 'Xong' };

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? 'sáng' : greetHour < 17 ? 'chiều' : 'tối';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">
            Chào buổi {greeting}, {user?.name?.split(' ').pop()}! 👋
          </h1>
          <p className="text-dark-400 mt-1 text-sm">
            {format(new Date(), "EEEE, dd 'tháng' MM 'năm' yyyy", { locale: vi })}
          </p>
        </div>
        {upcomingDeadlines.length > 0 && (
          <div className="hidden md:flex items-center gap-2 bg-warning-500/10 border border-warning-500/30 text-warning-500 text-xs font-semibold px-4 py-2 rounded-full animate-pulse">
            <AlertTriangle size={14} />
            {upcomingDeadlines.length} deadline trong 7 ngày tới
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng công việc"
          value={stats?.tasks?.total}
          subtitle={`Hoàn thành ${stats?.tasks?.completionRate || 0}%`}
          icon={CheckCircle2}
          color="bg-primary-600"
          gradient="bg-gradient-to-br from-primary-600/10 to-transparent"
        />
        <StatCard
          title="Đang thực hiện"
          value={stats?.tasks?.byStatus?.doing}
          subtitle="Công việc đang làm"
          icon={Clock}
          color="bg-blue-600"
          gradient="bg-gradient-to-br from-blue-600/10 to-transparent"
        />
        <StatCard
          title="Quá hạn"
          value={stats?.tasks?.overdue}
          subtitle="Cần chú ý ngay"
          icon={AlertTriangle}
          color="bg-danger-600"
          gradient="bg-gradient-to-br from-danger-600/10 to-transparent"
        />
        <StatCard
          title="Dự án đang chạy"
          value={stats?.projects?.active}
          subtitle={`Trong tổng ${stats?.projects?.total || 0} dự án`}
          icon={FolderOpen}
          color="bg-purple-600"
          gradient="bg-gradient-to-br from-purple-600/10 to-transparent"
        />
      </div>

      {/* AI Suggestion Panel */}
      <AISuggestionPanel defaultOpen={false} />

      {/* Weekly Chart + Task Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Area Chart */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-dark-100">Công việc 8 tuần qua</h2>
              <p className="text-xs text-dark-500 mt-0.5">Tạo mới & Hoàn thành theo tuần</p>
            </div>
            <TrendingUp size={18} className="text-primary-400" />
          </div>
          {weeklyChart.length > 0 ? (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-dark-700)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--color-dark-500)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--color-dark-500)" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Area type="monotone" dataKey="created" name="Tạo mới" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCreated)" dot={{ r: 3, fill: '#3b82f6' }} />
                  <Area type="monotone" dataKey="completed" name="Hoàn thành" stroke="#10b981" strokeWidth={2} fill="url(#colorCompleted)" dot={{ r: 3, fill: '#10b981' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-dark-500 text-sm">
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* Task Status Progress */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-dark-100">Trạng thái</h2>
            <span className="badge bg-primary-600/20 text-primary-400 border border-primary-600/30">
              Tổng {stats?.tasks?.total || 0}
            </span>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Cần làm', key: 'todo', color: 'bg-dark-500' },
              { label: 'Đang làm', key: 'doing', color: 'bg-blue-500' },
              { label: 'Chờ duyệt', key: 'review', color: 'bg-purple-500' },
              { label: 'Hoàn thành', key: 'done', color: 'bg-success-500' },
            ].map(({ label, key, color }) => {
              const count = stats?.tasks?.byStatus?.[key] || 0;
              const pct = stats?.tasks?.total > 0 ? Math.round((count / stats.tasks.total) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-dark-300">{label}</span>
                    <span className="text-dark-400">{count} <span className="text-dark-600">({pct}%)</span></span>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Progress Bar Chart + Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        {isAdminOrPM && projectProgress.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-dark-100">Tiến độ dự án</h2>
                <p className="text-xs text-dark-500 mt-0.5">% công việc hoàn thành</p>
              </div>
              <BarChart2 size={18} className="text-purple-400" />
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectProgress.slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-dark-700)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="var(--color-dark-500)" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="name" stroke="var(--color-dark-500)" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    content={({ active, payload }) => active && payload?.[0] ? (
                      <div className="bg-dark-800 border border-dark-600 rounded-xl px-3 py-2 text-xs shadow-xl">
                        <p className="font-bold text-dark-100">{payload[0].payload.name}</p>
                        <p className="text-dark-300">{payload[0].payload.done}/{payload[0].payload.total} task — {payload[0].value}%</p>
                      </div>
                    ) : null}
                  />
                  <Bar dataKey="percent" name="Hoàn thành" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-dark-700">
            <div>
              <h2 className="font-semibold text-dark-100">Deadline sắp tới</h2>
              <p className="text-xs text-dark-500 mt-0.5">Trong 7 ngày tới</p>
            </div>
            <CalendarClock size={18} className="text-warning-500" />
          </div>
          <div className="divide-y divide-dark-700/50">
            {upcomingDeadlines.length === 0 ? (
              <div className="py-10 text-center text-dark-500 text-sm">
                🎉 Không có deadline nào sắp tới
              </div>
            ) : (
              upcomingDeadlines.slice(0, 6).map((task) => {
                const daysLeft = differenceInDays(new Date(task.deadline), new Date());
                const urgencyClass = daysLeft <= 1
                  ? 'text-danger-500 bg-danger-500/10 border-danger-500/20'
                  : daysLeft <= 3
                  ? 'text-warning-500 bg-warning-500/10 border-warning-500/20'
                  : 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                return (
                  <Link
                    key={task._id}
                    to={`/tasks/${task._id}`}
                    className="flex items-center gap-3 p-4 hover:bg-dark-700/20 transition-colors group"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: task.project?.color || '#6366f1' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-200 truncate group-hover:text-primary-400 transition-colors">
                        {task.title}
                      </p>
                      <p className="text-xs text-dark-500">{task.project?.name}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${urgencyClass}`}>
                      {daysLeft === 0 ? 'Hôm nay' : daysLeft === 1 ? 'Ngày mai' : `${daysLeft} ngày`}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Tasks + Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-dark-700">
            <h2 className="font-semibold text-dark-100">Công việc gần đây</h2>
            <Link to={isAdminOrPM ? "/tasks" : "/my-tasks"} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              Xem tất cả <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-dark-700/50">
            {tasksLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              ))
            ) : recentTasks.length === 0 ? (
              <div className="py-10 text-center text-dark-500 text-sm">Chưa có công việc nào</div>
            ) : (
              recentTasks.map((task) => (
                <Link key={task._id} to={`/tasks/${task._id}`} className="block p-4 hover:bg-dark-700/20 transition-colors group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          task.priority === 'high' ? 'bg-danger-500' : task.priority === 'medium' ? 'bg-warning-500' : 'bg-dark-500'
                        }`} />
                        <p className="text-sm font-medium text-dark-200 truncate group-hover:text-primary-400 transition-colors">{task.title}</p>
                      </div>
                      <p className="text-xs text-dark-500 truncate">{task.project?.name}</p>
                    </div>
                    <span className={`badge flex-shrink-0 ${statusColors[task.status]}`}>
                      {statusLabels[task.status]}
                    </span>
                  </div>
                  {task.progress > 0 && (
                    <div className="mt-2">
                      <div className="progress-bar">
                        <div
                          className={`progress-fill transition-all duration-500 ${task.status === 'done' ? 'bg-success-500' : 'bg-primary-500'}`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Active Projects */}
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-dark-700">
            <h2 className="font-semibold text-dark-100">Dự án đang hoạt động</h2>
            {isAdminOrPM && (
              <Link to="/projects" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                Xem tất cả <ArrowRight size={12} />
              </Link>
            )}
          </div>
          <div className="divide-y divide-dark-700/50">
            {projects.length === 0 ? (
              <div className="py-10 text-center text-dark-500 text-sm">Không có dự án nào đang chạy</div>
            ) : (
              projects.map((project) => (
                <Link
                  key={project._id}
                  to={isAdminOrPM ? `/projects/${project._id}` : '#'}
                  className={`flex items-center gap-4 p-4 hover:bg-dark-700/20 transition-colors group ${!isAdminOrPM ? 'pointer-events-none' : ''}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-md"
                    style={{ backgroundColor: project.color || '#6366f1' }}
                  >
                    {project.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-200 truncate group-hover:text-primary-400 transition-colors">{project.name}</p>
                    <p className="text-xs text-dark-500">{project.members?.length || 0} thành viên</p>
                  </div>
                  <ChevronRight size={14} className="text-dark-600 group-hover:text-dark-400 transition-colors" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
