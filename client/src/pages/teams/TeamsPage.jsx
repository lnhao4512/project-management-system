import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeams, createTeam, updateTeam, deleteTeam } from '../../redux/slices/teamsSlice';
import { usersAPI } from '../../api';
import { Plus, Users, Shield, Trash2, Pencil, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const TeamsPage = () => {
  const dispatch = useDispatch();
  const { items: teams, loading } = useSelector(s => s.teams);
  const { isAdminOrPM } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', leader: '', members: [] });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    dispatch(fetchTeams());
    usersAPI.getAll({ limit: 100 }).then(res => setUsers(res.data.data));
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.leader) {
      return toast.error('Vui lòng nhập tên nhóm và chọn trưởng nhóm');
    }
    try {
      if (editData) {
        await dispatch(updateTeam({ id: editData._id, data: formData })).unwrap();
        toast.success('Đã cập nhật nhóm');
      } else {
        await dispatch(createTeam(formData)).unwrap();
        toast.success('Đã tạo nhóm mới');
      }
      setShowModal(false);
      setFormData({ name: '', description: '', leader: '', members: [] });
      setEditData(null);
    } catch (error) {
      toast.error(error);
    }
  };

  const handleEdit = (team) => {
    setEditData(team);
    setFormData({
      name: team.name,
      description: team.description,
      leader: team.leader?._id || '',
      members: team.members?.map(m => m._id) || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nhóm này?')) return;
    try {
      await dispatch(deleteTeam(id)).unwrap();
      toast.success('Đã xóa nhóm');
    } catch (error) {
      toast.error(error);
    }
  };

  const toggleMember = (userId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Quản lý Nhóm</h1>
          <p className="text-dark-400 text-sm mt-1">Danh sách phòng ban & nhóm làm việc</p>
        </div>
        {isAdminOrPM && (
          <button onClick={() => { setEditData(null); setFormData({ name: '', description: '', leader: '', members: [] }); setShowModal(true); }} className="btn-primary">
            <Plus size={18} /> Tạo nhóm mới
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin text-primary-500" size={32} /></div>
      ) : teams.length === 0 ? (
        <div className="card p-16 text-center">
          <Users size={48} className="text-dark-600 mx-auto mb-4" />
          <h3 className="text-dark-300 font-semibold mb-2">Chưa có nhóm nào</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <div key={team._id} className="card p-6 flex flex-col h-full hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {team.name ? team.name.slice(0, 2).toUpperCase() : 'T'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-dark-100">{team.name}</h3>
                    <p className="text-sm text-dark-400">{team.members?.length || 0} thành viên</p>
                  </div>
                </div>
                {isAdminOrPM && (
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(team)} className="p-1.5 text-dark-400 hover:text-primary-400 hover:bg-dark-700 rounded transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(team._id)} className="p-1.5 text-dark-400 hover:text-danger-400 hover:bg-dark-700 rounded transition-colors"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
              
              <div className="bg-dark-800 rounded-lg p-3 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-success-600/20 text-success-500 flex items-center justify-center"><Shield size={16} /></div>
                <div>
                  <p className="text-xs text-dark-400 uppercase font-medium">Trưởng nhóm</p>
                  <p className="text-sm text-dark-200 font-medium">{team.leader?.name || 'Chưa có'}</p>
                </div>
              </div>

              {team.description && (
                <p className="text-dark-400 text-sm mb-4 flex-1 line-clamp-3">{team.description}</p>
              )}

              <div className="mt-auto">
                <p className="text-xs text-dark-400 font-medium mb-2 uppercase">Thành viên ({team.members?.length})</p>
                <div className="flex flex-wrap gap-1">
                  {team.members?.slice(0, 5).map((m, idx) => {
                    const memberName = m?.name || 'U';
                    const memberId = m?._id || m || idx;
                    return (
                    <div key={memberId} title={memberName} className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-xs font-medium text-dark-200 border-2 border-dark-900 z-10 -ml-2 first:ml-0">
                      {memberName.slice(0, 1).toUpperCase()}
                    </div>
                  )})}
                  {team.members?.length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center text-xs font-medium text-dark-400 border-2 border-dark-900 z-10 -ml-2">
                      +{team.members.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 animate-fade-in flex flex-col max-h-[90vh]">
            <h2 className="text-xl font-bold text-dark-50 mb-6">{editData ? 'Cập nhật Nhóm' : 'Tạo Nhóm Mới'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Tên nhóm *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input" placeholder="VD: Nhóm Thiết kế" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Mô tả</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input" rows="2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Trưởng nhóm *</label>
                <select required value={formData.leader} onChange={e => setFormData({ ...formData, leader: e.target.value })} className="input">
                  <option value="">Chọn trưởng nhóm</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Thành viên ({formData.members.length})</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 border border-dark-700 rounded-lg custom-scrollbar">
                  {users.map(u => (
                    <label key={u._id} className="flex items-center gap-2 p-2 hover:bg-dark-800 rounded cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={formData.members.includes(u._id)} 
                        onChange={() => toggleMember(u._id)}
                        className="rounded border-dark-600 bg-dark-900 text-primary-500 focus:ring-primary-500/20"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm text-dark-200">{u.name}</span>
                        <span className="text-xs text-dark-500">{u.role}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </form>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-800">
              <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Hủy</button>
              <button onClick={handleSubmit} className="btn-primary">Lưu lại</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
