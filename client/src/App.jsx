import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import { fetchCurrentUser } from './redux/slices/authSlice';
import { useAuth } from './hooks/useAuth';
import { ROLES } from './constants';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'));
const ProjectDetailsPage = lazy(() => import('./pages/projects/ProjectDetailsPage'));
const TasksPage = lazy(() => import('./pages/tasks/TasksPage'));
const TaskListPage = lazy(() => import('./pages/tasks/TaskListPage'));
const MyTasksPage = lazy(() => import('./pages/tasks/MyTasksPage'));
const TimelinePage = lazy(() => import('./pages/timeline/TimelinePage'));
const UsersPage = lazy(() => import('./pages/users/UsersPage'));
const TaskDetailPage = lazy(() => import('./pages/tasks/TaskDetailPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const WorkloadPage = lazy(() => import('./pages/workload/WorkloadPage'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const TeamsPage = lazy(() => import('./pages/teams/TeamsPage'));
const ActivityLogPage = lazy(() => import('./pages/logs/ActivityLogPage'));

// Inline fallback pages (simple enough not to lazy load)
const UnauthorizedPage = () => (
  <div className="min-h-screen bg-dark-950 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-dark-100 mb-2">Access Denied</h1>
      <p className="text-dark-400 mb-6">You don't have permission to view this page.</p>
      <a href="/my-tasks" className="btn-primary">Go Home</a>
    </div>
  </div>
);

const NotFoundPage = () => (
  <div className="min-h-screen bg-dark-950 flex items-center justify-center">
    <div className="text-center">
      <div className="text-8xl font-black text-dark-800 mb-4">404</div>
      <h1 className="text-2xl font-bold text-dark-100 mb-2">Page Not Found</h1>
      <p className="text-dark-400 mb-6">The page you're looking for doesn't exist.</p>
      <a href="/my-tasks" className="btn-primary">Go Home</a>
    </div>
  </div>
);

const PageLoader = () => (
  <div className="flex items-center justify-center h-48">
    <Loader size={28} className="animate-spin text-primary-500" />
  </div>
);

const IndexRedirect = () => {
  const { user } = useAuth();
  if (user?.role === ROLES.EMPLOYEE) {
    return <Navigate to="/my-tasks" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  const dispatch = useDispatch();
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [token, user, dispatch]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<IndexRedirect />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/my-tasks" element={<MyTasksPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Admin/PM only */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.PROJECT_MANAGER]} />}>
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/task-list" element={<TaskListPage />} />
              <Route path="/workload" element={<WorkloadPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/logs" element={<ActivityLogPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
