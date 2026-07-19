import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { logoutUser } from '../redux/slices/authSlice';
import { ROLES, APP_NAME } from '../constants';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users, Bell,
  BarChart2, ClipboardList, LogOut, Settings,
  CalendarDays, Network, ListTodo, Activity, Kanban, X
} from 'lucide-react';

const navGroups = [
  {
    label: 'Tổng quan',
    items: [
      { path: '/dashboard', label: 'Dashboard',     icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE] },
      { path: '/timeline',  label: 'Lịch trình',    icon: CalendarDays,    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.EMPLOYEE] },
      { path: '/my-tasks',  label: 'Việc của tôi',  icon: ClipboardList,   roles: [ROLES.EMPLOYEE, ROLES.PROJECT_MANAGER, ROLES.ADMIN] },
    ]
  },
  {
    label: 'Quản lý',
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
    items: [
      { path: '/projects',  label: 'Dự án',          icon: FolderKanban, roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER] },
      { path: '/task-list', label: 'Danh sách task', icon: ListTodo,     roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER] },
      { path: '/tasks',     label: 'Thống kê',       icon: BarChart2,    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER] },
    ]
  },
  {
    label: 'Nhóm',
    roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
    items: [
      { path: '/teams',     label: 'Nhóm/Phòng ban', icon: Network,   roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER] },
      { path: '/users',     label: 'Thành viên',     icon: Users,     roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER] },
      { path: '/logs',      label: 'Nhật ký',        icon: Activity,  roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER] },
    ]
  }
];

const Sidebar = ({ isMobileOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(user?.role)),
  })).filter(group => group.items.length > 0);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen w-64 z-50 flex flex-col
        bg-dark-900 border-r border-dark-700/50
        transition-transform duration-300 ease-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Ambient gradient */}
        <div className="absolute top-0 left-0 w-full h-40 pointer-events-none overflow-hidden rounded-b-3xl">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -top-10 right-0 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center justify-between px-5 h-16 border-b border-dark-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Kanban size={16} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-sm text-dark-50 tracking-tight">{APP_NAME}</span>
              <span className="block text-[10px] text-primary-500 font-medium">v1.0.0</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-dark-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-6">
          {filteredGroups.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-dark-500 px-3 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-200 group relative
                      ${isActive
                        ? 'bg-primary-500/15 text-primary-500 border border-primary-500/20'
                        : 'text-dark-300 hover:text-dark-100 hover:bg-dark-800/50 border border-transparent'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary-500 rounded-full" />
                        )}
                        <item.icon size={16} className={isActive ? 'text-primary-500' : 'text-dark-400 group-hover:text-dark-200'} />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="flex-shrink-0 px-3 py-4 border-t border-dark-700/50 space-y-1">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-dark-800/50 transition-colors group w-full"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-md">
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-dark-100 truncate">{user?.name}</p>
              <p className="text-[10px] text-dark-400 capitalize truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
            <Settings size={14} className="text-dark-400 group-hover:text-dark-200 transition-colors flex-shrink-0" />
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sm font-medium text-danger-500 hover:text-danger-600 hover:bg-danger-500/10 border border-transparent transition-all"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
