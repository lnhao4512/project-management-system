import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tasksAPI, commentsAPI } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft, Send, User, Clock, Loader, Paperclip, Edit2, Check, X, Plus, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../constants';
import { useSocket } from '../../hooks/useSocket';
import TaskFormModal from '../../components/tasks/TaskFormModal';

const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [subTasks, setSubTasks] = useState([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const { socket, joinTask, leaveTask } = useSocket();

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const [taskRes, commentsRes, subTasksRes] = await Promise.all([
          tasksAPI.getById(id),
          commentsAPI.getByTask(id),
          tasksAPI.getAll({ parentTask: id, limit: 100 }),
        ]);
        setTask(taskRes.data.data);
        setComments(commentsRes.data.data);
        setSubTasks(subTasksRes.data.data || []);
      } catch (error) {
        toast.error('Không thể tải thông tin công việc');
        navigate('/my-tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTaskDetails();

    if (socket) {
      joinTask(id);

      const handleNewComment = (newComm) => {
        // Prevent duplicate comments if user is the author and API already added it locally
        setComments(prev => {
          if (prev.some(c => c._id === newComm._id)) return prev;
          return [...prev, newComm];
        });
      };

      const handleUpdateComment = (updatedComm) => {
        setComments(prev => prev.map(c => c._id === updatedComm._id ? updatedComm : c));
      };

      const handleDeleteCommentEvent = (deletedId) => {
        setComments(prev => prev.map(c => c._id === deletedId ? { ...c, isDeleted: true } : c));
      };

      socket.on('comment:new', handleNewComment);
      socket.on('comment:updated', handleUpdateComment);
      socket.on('comment:deleted', handleDeleteCommentEvent);

      return () => {
        leaveTask(id);
        socket.off('comment:new', handleNewComment);
        socket.off('comment:updated', handleUpdateComment);
        socket.off('comment:deleted', handleDeleteCommentEvent);
      };
    }
  }, [id, navigate, socket]); // Note: joinTask, leaveTask are stable, but could be dependencies if needed.

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && attachments.length === 0) return;

    try {
      setSubmitting(true);
      let payload;
      if (attachments.length > 0) {
        payload = new FormData();
        payload.append('content', newComment.trim() ? newComment : 'Đã đính kèm tệp');
        attachments.forEach(file => payload.append('attachments', file));
      } else {
        payload = { content: newComment };
      }

      const res = await commentsAPI.create(id, payload);
      setComments([...comments, res.data.data]);
      setNewComment('');
      setAttachments([]);
      toast.success('Đã thêm bình luận');
    } catch (error) {
      toast.error('Lỗi khi thêm bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (comment) => {
    setEditingCommentId(comment._id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      setEditSubmitting(true);
      const res = await commentsAPI.update(id, commentId, { content: editContent.trim() });
      setComments(comments.map(c => c._id === commentId ? { ...c, content: editContent.trim(), updatedAt: new Date() } : c));
      setEditingCommentId(null);
      setEditContent('');
      toast.success('Đã cập nhật bình luận');
    } catch (error) {
      toast.error('Lỗi khi cập nhật bình luận');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
    try {
      await commentsAPI.delete(id, commentId);
      setComments(comments.map(c => c._id === commentId ? { ...c, isDeleted: true } : c));
      toast.success('Đã xóa bình luận');
    } catch (error) {
      toast.error('Lỗi khi xóa bình luận');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (!task) return null;

  const canManageComment = (comment) =>
    user.role === 'admin' || user.role === 'project_manager' || user._id === comment.author?._id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-dark-800 rounded-lg transition-colors text-dark-400">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-dark-50 flex items-center gap-2">
            {task.title}
            {task.parentTask && (
               <Link to={`/tasks/${task.parentTask}`} className="text-xs bg-primary-500/10 text-primary-400 px-2 py-1 rounded-md ml-2 border border-primary-500/20 hover:bg-primary-500/20 transition-colors flex items-center gap-1">
                 <Layers size={12} /> Công việc con
               </Link>
            )}
          </h1>
          {task.project && (
            <p className="text-dark-400 text-sm mt-1">Dự án: {task.project.name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Mô tả chi tiết</h3>
            <div className="prose prose-invert max-w-none text-dark-300 whitespace-pre-wrap">
              {task.description || <span className="text-dark-500 italic">Không có mô tả</span>}
            </div>
          </div>

          {/* Sub-tasks Section */}
          {(task.assignedTeam || subTasks.length > 0) && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dark-100 flex items-center gap-2">
                  <Layers size={18} className="text-primary-500" />
                  Công việc con ({subTasks.length})
                </h3>
                {task.assignedTeam && (user.role === 'admin' || user.role === 'project_manager' || user.team === task.assignedTeam?._id) && (
                  <button 
                    onClick={() => setIsTaskFormOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Thêm việc con
                  </button>
                )}
              </div>
            
            <div className="space-y-3">
              {subTasks.length === 0 ? (
                <p className="text-dark-500 text-sm italic text-center py-4 bg-dark-900/50 rounded-lg border border-dashed border-dark-700/50">Chưa có công việc con nào</p>
              ) : (
                subTasks.map(st => (
                  <Link key={st._id} to={`/tasks/${st._id}`} className="flex items-center justify-between p-3 bg-dark-800 hover:bg-dark-700 border border-dark-700/50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${st.status === 'done' ? 'bg-success-500' : st.status === 'doing' ? 'bg-blue-500' : 'bg-warning-500'}`}></span>
                      <span className={`font-medium text-sm ${st.status === 'done' ? 'line-through text-dark-400' : 'text-dark-200'}`}>{st.title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {st.assignedTo && (
                        <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-xs text-white font-bold" title={st.assignedTo.name}>
                          {(st.assignedTo.name.slice(0, 1) || '').toUpperCase()}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-dark-300">
                        <span>{st.progress || 0}%</span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-6">
              Bình luận ({comments.filter(c => !c.isDeleted).length})
            </h3>

            {/* Comment List */}
            <div className="space-y-5 mb-6">
              {comments.length === 0 ? (
                <p className="text-center text-dark-500 italic py-4">Chưa có bình luận nào.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                      {(comment.author?.name?.slice(0, 1) || '').toUpperCase() || <User size={16} />}
                    </div>
                    <div className="flex-1">
                      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-dark-200">{comment.author?.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-dark-500 flex items-center gap-1">
                              <Clock size={12} />
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                            </span>
                          </div>
                        </div>

                        {comment.isDeleted ? (
                          <p className="text-dark-500 italic text-sm">Bình luận này đã bị xóa.</p>
                        ) : editingCommentId === comment._id ? (
                          /* Edit Mode */
                          <div className="space-y-2">
                            <textarea
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              className="input min-h-[80px] resize-y text-sm"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveEdit(comment._id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                            />
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={handleCancelEdit}
                                className="flex items-center gap-1 text-xs text-dark-400 hover:text-dark-200 transition-colors px-2 py-1 rounded hover:bg-dark-700"
                              >
                                <X size={12} /> Hủy
                              </button>
                              <button
                                onClick={() => handleSaveEdit(comment._id)}
                                disabled={editSubmitting || !editContent.trim()}
                                className="flex items-center gap-1 text-xs text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 px-3 py-1 rounded transition-colors"
                              >
                                {editSubmitting ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                                Lưu
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-dark-300 whitespace-pre-wrap text-sm">{comment.content}</p>
                            {comment.attachments && comment.attachments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {comment.attachments.map((url, i) => {
                                  const fileName = url.split('/').pop();
                                  return (
                                    <a
                                      key={i}
                                      href={`http://localhost:5000${url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs bg-dark-900/50 hover:bg-dark-900 px-2 py-1.5 rounded-md text-primary-400 border border-dark-700 transition-colors"
                                    >
                                      <Paperclip size={12} />
                                      {fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Comment Actions */}
                      {!comment.isDeleted && canManageComment(comment) && editingCommentId !== comment._id && (
                        <div className="mt-1.5 ml-2 flex gap-3">
                          {/* Only author can edit */}
                          {user._id === comment.author?._id && (
                            <button
                              onClick={() => handleStartEdit(comment)}
                              className="text-xs text-dark-500 hover:text-primary-400 flex items-center gap-1 transition-colors"
                            >
                              <Edit2 size={11} /> Chỉnh sửa
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-xs text-dark-500 hover:text-danger-400 transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                {(user?.name?.slice(0, 1) || 'U').toUpperCase()}
              </div>
              <div className="flex-1">
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs bg-dark-700 px-2 py-1 rounded text-dark-200">
                        <Paperclip size={12} /> {file.name}
                        <button
                          type="button"
                          onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-danger-400 ml-1 hover:text-danger-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleAddComment} className="relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Viết bình luận hoặc tải file... (Ctrl+Enter để gửi)"
                    className="input min-h-[44px] py-3 pr-20 resize-y"
                    rows="1"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleAddComment(e);
                      }
                    }}
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <label className="p-2 text-dark-400 hover:bg-dark-700/50 hover:text-dark-200 rounded-lg cursor-pointer transition-colors" title="Đính kèm file">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => setAttachments(prev => [...prev, ...Array.from(e.target.files)])}
                      />
                      <Paperclip size={16} />
                    </label>
                    <button
                      type="submit"
                      disabled={submitting || (!newComment.trim() && attachments.length === 0)}
                      className="p-2 text-primary-500 hover:bg-primary-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">Thông tin</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-dark-400 block mb-1">Trạng thái</span>
                <span className={`badge ${
                  task.status === 'done' ? 'badge-done' :
                  task.status === 'doing' ? 'badge-doing' :
                  task.status === 'review' ? 'badge-review' : 'badge-todo'
                }`}>
                  {STATUS_LABELS[task.status] || task.status}
                </span>
              </div>
              <div>
                <span className="text-sm text-dark-400 block mb-1">Độ ưu tiên</span>
                <span className={`badge ${
                  task.priority === 'high' ? 'badge-high' :
                  task.priority === 'medium' ? 'badge-medium' : 'badge-low'
                }`}>
                  {PRIORITY_LABELS[task.priority] || task.priority}
                </span>
              </div>
              <div>
                <span className="text-sm text-dark-400 block mb-1">Người phụ trách</span>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-dark-700 flex items-center justify-center text-xs text-white font-bold">
                    {(task.assignedTo?.name?.slice(0, 1) || '').toUpperCase() || <User size={12} />}
                  </div>
                  <span className="text-dark-200 text-sm">{task.assignedTo?.name || 'Chưa giao'}</span>
                </div>
              </div>
              {task.deadline && (
                <div>
                  <span className="text-sm text-dark-400 block mb-1">Hạn chót</span>
                  <span className="text-dark-200 text-sm font-medium">
                    {format(new Date(task.deadline), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
              {task.progress !== undefined && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-dark-400">Tiến độ</span>
                    <span className="font-bold text-primary-400">{task.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill transition-all duration-500 ${task.status === 'done' ? 'bg-success-500' : 'bg-primary-500'}`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {isTaskFormOpen && (
        <TaskFormModal 
          onClose={() => {
            setIsTaskFormOpen(false);
            // Refresh sub-tasks
            tasksAPI.getAll({ parentTask: id, limit: 100 }).then(res => setSubTasks(res.data.data || []));
          }}
          defaultProjectId={task.project?._id || task.project}
          defaultParentId={id}
        />
      )}
    </div>
  );
};

// You need to import TaskFormModal at the top, let's do another replace.

export default TaskDetailPage;
