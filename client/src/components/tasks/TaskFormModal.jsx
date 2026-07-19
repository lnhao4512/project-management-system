import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { X, Loader } from 'lucide-react';
import { createTask, updateTask } from '../../redux/slices/tasksSlice';
import { teamsAPI, projectsAPI, usersAPI, tasksAPI } from '../../api';
import toast from 'react-hot-toast';

const TaskFormModal = ({ task, onClose, defaultProjectId, defaultParentId }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [assignMode, setAssignMode] = useState(task?.assignedTeam ? 'team' : 'user');

  const { register, handleSubmit, watch, control, reset, getValues, formState: { errors } } = useForm({
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      project: task?.project?._id || task?.project || defaultProjectId || '',
      priority: task?.priority || 'medium',
      status: task?.status || 'todo',
      assignedTo: task?.assignedTo?._id || task?.assignedTo || '',
      assignedTeam: task?.assignedTeam?._id || task?.assignedTeam || '',
      parentTask: task?.parentTask?._id || task?.parentTask || defaultParentId || '',
      deadline: task?.deadline ? new Date(task.deadline) : null,
      sendEmail: true,
    },
  });

  const selectedAssignee = watch('assignedTo');
  const taskLimit = parseInt(localStorage.getItem('pm_task_limit') || '15', 10);

  const [assigneeTaskCount, setAssigneeTaskCount] = useState(0);
  
  useEffect(() => {
    if (!selectedAssignee) {
      setAssigneeTaskCount(0);
      return;
    }
    const fetchUserTasksCount = async () => {
      try {
        const res = await tasksAPI.getAll({ assignedTo: selectedAssignee, limit: 500 });
        const activeTasks = (res.data.data || []).filter(t => t.status !== 'done' && t._id !== task?._id);
        setAssigneeTaskCount(activeTasks.length);
      } catch (error) {
        console.error('Error fetching assignee tasks:', error);
      }
    };
    fetchUserTasksCount();
  }, [selectedAssignee, task]);

  const isOverloaded = assigneeTaskCount >= taskLimit;

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, usersRes, teamsRes] = await Promise.all([
          projectsAPI.getAll({ limit: 100 }),
          usersAPI.getAll({ limit: 100 }),
          teamsAPI.getAll({ limit: 100 })
        ]);
        setProjects(projRes.data.data || []);
        setUsers(usersRes.data.data || []);
        setTeams(teamsRes.data.data || []);
        
        // Đợi option render xong thì reset lại values để select tự động chọn đúng dự án
        setTimeout(() => reset(getValues()), 50);
      } catch {}
    };
    load();
  }, [reset, getValues]);

  const onSubmit = async (data) => {
    if (isOverloaded && data.status !== 'done') {
      if (!window.confirm(`Nhân viên này đang bị quá tải (${assigneeTaskCount}/${taskLimit} công việc). Bạn có chắc chắn muốn giao thêm không?`)) {
        return;
      }
    }
    setLoading(true);
    const payload = {
      ...data,
      assignedTo: assignMode === 'user' ? (data.assignedTo || null) : null,
      assignedTeam: assignMode === 'team' ? (data.assignedTeam || null) : null,
      parentTask: data.parentTask || null,
      deadline: data.deadline ? data.deadline.toISOString() : null,
      sendEmail: data.sendEmail,
    };

    const action = task
      ? dispatch(updateTask({ id: task._id, data: payload }))
      : dispatch(createTask(payload));

    const res = await action;
    setLoading(false);

    if (res.meta.requestStatus === 'fulfilled') {
      toast.success(task ? 'Đã cập nhật công việc!' : 'Đã tạo công việc!');
      onClose();
    } else {
      toast.error(res.payload || 'Thao tác thất bại');
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-xl">
        <div className="modal-header">
          <h2 className="text-lg font-semibold text-dark-100">
            {task ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Title */}
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="label mb-0">Tiêu đề *</label>
                <span className={`text-xs font-medium transition-colors ${(watch('title')?.length || 0) >= 25 ? 'text-danger-500' : 'text-dark-400'}`}>
                  {watch('title')?.length || 0}/25 ký tự
                </span>
              </div>
              <input
                {...register('title', { 
                  required: 'Vui lòng nhập tiêu đề',
                  maxLength: { value: 25, message: 'Tiêu đề không được vượt quá 25 ký tự' }
                })}
                className={`input ${errors.title || (watch('title')?.length || 0) >= 25 ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''}`}
                placeholder="Tiêu đề công việc..."
              />
              {errors.title && <p className="text-danger-500 text-xs mt-1 animate-fade-in">{errors.title.message}</p>}
              {!errors.title && (watch('title')?.length || 0) >= 25 && (
                <p className="text-danger-500 text-xs mt-1 animate-fade-in">Đã đạt giới hạn tối đa ký tự cho phép.</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="label">Mô tả</label>
              <textarea
                {...register('description')}
                className="input h-24 resize-none"
                placeholder="Mô tả công việc..."
              />
            </div>

            {/* Project */}
            <div>
              <label className="label">Dự án *</label>
              <select {...register('project', { required: 'Vui lòng chọn dự án' })} className={`input ${errors.project ? 'input-error' : ''}`}>
                <option value="">Chọn dự án...</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              {errors.project && <p className="text-danger-500 text-xs mt-1">{errors.project.message}</p>}
            </div>

            {/* Priority & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Độ ưu tiên</label>
                <select {...register('priority')} className="input">
                  <option value="high">Cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </select>
              </div>
              <div>
                <label className="label">Trạng thái</label>
                <select {...register('status')} className="input">
                  <option value="todo">Cần làm</option>
                  <option value="doing">Đang làm</option>
                  <option value="done">Hoàn thành</option>
                </select>
              </div>
            </div>

            {/* Assign Mode & Assignee */}
            <div>
              {(!defaultParentId && !task?.parentTask) ? (
                <div className="flex items-center gap-4 mb-2">
                  <label className="label mb-0">Phân công cho</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm text-dark-200">
                      <input type="radio" checked={assignMode === 'user'} onChange={() => setAssignMode('user')} className="accent-primary-500" /> Cá nhân
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm text-dark-200">
                      <input type="radio" checked={assignMode === 'team'} onChange={() => setAssignMode('team')} className="accent-primary-500" /> Phòng ban
                    </label>
                  </div>
                </div>
              ) : (
                <label className="label">Phân công cho (Cá nhân)</label>
              )}

              {assignMode === 'user' || defaultParentId || task?.parentTask ? (
                <>
                  <select {...register('assignedTo')} className={`input ${isOverloaded ? 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/20' : ''}`}>
                    <option value="">Chưa giao</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role?.replace('_', ' ')})</option>)}
                  </select>
                  {selectedAssignee && (
                    <p className={`text-xs mt-1 font-medium ${isOverloaded ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {isOverloaded ? `⚠️ Nhân viên này đang quá tải (${assigneeTaskCount}/${taskLimit} công việc chưa hoàn thành)` : `Nhân viên đang có ${assigneeTaskCount} công việc chưa hoàn thành.`}
                    </p>
                  )}
                </>
              ) : (
                <select {...register('assignedTeam')} className="input">
                  <option value="">Chọn phòng ban...</option>
                  {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              )}
            </div>

            {/* Deadline */}
            <div>
              <label className="label">Hạn chót</label>
              <Controller
                control={control}
                name="deadline"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={(date) => field.onChange(date)}
                    dateFormat="dd/MM/yyyy"
                    className="input w-full"
                    placeholderText="dd/MM/yyyy"
                    isClearable
                  />
                )}
              />
            </div>

            {/* Email Notification Checkbox */}
            {selectedAssignee && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-700/50">
                <input
                  type="checkbox"
                  id="sendEmail"
                  {...register('sendEmail')}
                  className="w-4 h-4 rounded border-dark-600 text-primary-600 focus:ring-primary-500/50 bg-dark-900 cursor-pointer"
                />
                <label htmlFor="sendEmail" className="text-sm font-medium text-dark-200 cursor-pointer select-none">
                  Gửi email nhắc nhở/thông báo công việc cho người phụ trách
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-5 border-t border-dark-700/50 bg-dark-900/50 rounded-b-xl">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2 text-sm font-medium text-dark-300 hover:text-dark-100 hover:bg-dark-700/50 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {task ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
