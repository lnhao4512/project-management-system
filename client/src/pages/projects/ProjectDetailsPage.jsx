import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjectById } from '../../redux/slices/projectsSlice';
import { fetchTasks, deleteTask } from '../../redux/slices/tasksSlice';
import { format } from 'date-fns';
import { Edit2, Trash2, Plus, ArrowLeft, Loader, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import TaskFormModal from '../../components/tasks/TaskFormModal';
import ProjectGanttChart from '../../components/tasks/ProjectGanttChart';
import { tasksAPI } from '../../api';

const priorityColor = {
  high: 'text-rose-500 bg-rose-500/10',
  medium: 'text-amber-500 bg-amber-500/10',
  low: 'text-emerald-500 bg-emerald-500/10'
};
const priorityLabel = { high: 'Cao', medium: 'Trung bình', low: 'Thấp' };

const statusColor = {
  todo: 'text-dark-400 bg-dark-700/50 border-dark-600',
  doing: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
  review: 'text-warning-500 bg-warning-500/10 border-warning-500/20',
  done: 'text-success-500 bg-success-500/10 border-success-500/20'
};
const statusLabel = { todo: 'Cần làm', doing: 'Đang làm', review: 'Chờ duyệt', done: 'Hoàn thành' };

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedProject: project, loading: projectLoading } = useSelector(s => s.projects);
  const { items: tasks, loading: tasksLoading } = useSelector(s => s.tasks);

  const [showModal, setShowModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'gantt'

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchTasks({ project: id, limit: 1000 }));
    }
  }, [id, dispatch]);

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này không?')) {
      try {
        await dispatch(deleteTask(taskId)).unwrap();
        toast.success('Đã xóa công việc');
      } catch (error) {
        toast.error('Lỗi khi xóa công việc');
      }
    }
  };

  const handleRemind = async (taskId) => {
    try {
      const res = await tasksAPI.remind(taskId);
      toast.success(res.data?.message || 'Đã gửi email nhắc nhở!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi gửi nhắc nhở');
    }
  };

  if (projectLoading || !project) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  const projectTasks = tasks.filter(t => t.project?._id === id || t.project === id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-dark-800 p-5 rounded-xl border border-dark-700 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-dark-700 rounded-lg text-dark-300 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-dark-100 flex items-center gap-3">
              {project.name}
              <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColor[project.status] || statusColor.todo}`}>
                {statusLabel[project.status] || project.status}
              </span>
            </h1>
            <p className="text-sm text-dark-400 mt-1">
              Quản lý: {project.createdBy?.name || 'Admin'} • {project.startDate ? format(new Date(project.startDate), 'dd/MM/yyyy') : ''} - {project.endDate ? format(new Date(project.endDate), 'dd/MM/yyyy') : ''} • {projectTasks.length} nhiệm vụ
            </p>
          </div>
        </div>
          <button 
            onClick={() => { setTaskToEdit(null); setShowModal(true); }} 
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-sm hover:shadow-lg hover:shadow-primary-500/20 transition-all font-semibold text-sm"
          >
            <Plus size={18} strokeWidth={2.5} /> Thêm công việc
          </button>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:text-dark-100 hover:bg-dark-700'}`}
        >
          Danh sách
        </button>
        <button
          onClick={() => setViewMode('gantt')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${viewMode === 'gantt' ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:text-dark-100 hover:bg-dark-700'}`}
        >
          Biểu đồ Gantt
        </button>
      </div>

      {viewMode === 'gantt' ? (
        <ProjectGanttChart tasks={projectTasks} />
      ) : (
        <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-xs text-dark-400 uppercase bg-dark-800/50 border-b border-dark-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Nhiệm vụ</th>
                <th className="px-6 py-4 font-semibold">Người thực hiện</th>
                <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-center">Ưu tiên</th>
                <th className="px-6 py-4 font-semibold text-center w-32">Tiến độ</th>
                <th className="px-6 py-4 font-semibold text-center">Ngày bắt đầu</th>
                <th className="px-6 py-4 font-semibold text-center">Hạn chót</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {tasksLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-dark-400">
                    <Loader size={24} className="animate-spin mx-auto mb-2" />
                    Đang tải công việc...
                  </td>
                </tr>
              ) : projectTasks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-dark-500">Chưa có công việc nào trong dự án này.</td>
                </tr>
              ) : (
                projectTasks.map(task => {
                  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
                  return (
                    <tr key={task._id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-dark-100">{task.title}</div>
                        <div className="text-xs text-dark-500 mt-1">{task._id.slice(-6)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-600/20 text-primary-500 flex flex-shrink-0 items-center justify-center text-xs font-bold">
                            {task.assignedTo?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="text-dark-300">{task.assignedTo?.name || 'Chưa phân công'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor[task.status]}`}>
                          {statusLabel[task.status]}
                        </span>
                        {isOverdue && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-danger-500/10 text-danger-500 border border-danger-500/20">
                            Quá hạn
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${priorityColor[task.priority]}`}>
                          {priorityLabel[task.priority]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${task.progress === 100 ? 'bg-success-500' : 'bg-primary-500'}`} style={{ width: `${task.progress || 0}%` }} />
                          </div>
                          <span className="text-xs font-medium text-dark-300 w-8">{task.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-dark-300">
                        {task.createdAt ? format(new Date(task.createdAt), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 text-center text-dark-300">
                        {task.deadline ? format(new Date(task.deadline), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleRemind(task._id)} className="p-1.5 text-dark-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Nhắc việc">
                            <Bell size={16} />
                          </button>
                          <button onClick={() => { setTaskToEdit(task); setShowModal(true); }} className="p-1.5 text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteTask(task._id)} className="p-1.5 text-dark-400 hover:text-danger-500 hover:bg-danger-500/10 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {showModal && (
        <TaskFormModal
          task={taskToEdit}
          defaultProjectId={id}
          onClose={() => {
            setShowModal(false);
            setTaskToEdit(null);
          }}
        />
      )}
    </div>
  );
};

export default ProjectDetailsPage;
