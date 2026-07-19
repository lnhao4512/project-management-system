import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Loader, Users, Edit, Trash2 } from 'lucide-react';
import { usersAPI } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import UserFormModal from '../../components/users/UserFormModal';
import { ROLES } from '../../constants';

const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Quản trị viên',
  [ROLES.PROJECT_MANAGER]: 'Quản lý dự án',
  [ROLES.EMPLOYEE]: 'Thành viên',
};

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [posFilter, setPosFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getAll({
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter || undefined,
        department: deptFilter || undefined,
        position: posFilter || undefined,
      });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error('Không thể tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, deptFilter, posFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này?')) return;
    try {
      await usersAPI.delete(id);
      toast.success('Xóa thành viên thành công');
      loadUsers();
    } catch (error) {
      toast.error('Không thể xóa thành viên này');
    }
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setEditUser(null);
    loadUsers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Thành viên</h1>
          <p className="text-dark-400 text-sm mt-1">Quản lý danh sách thành viên trong hệ thống</p>
        </div>
        <button 
          onClick={() => { setEditUser(null); setShowModal(true); }} 
          className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
          <Plus size={18} className="relative z-10 transition-transform duration-300 group-hover:rotate-90" /> 
          <span className="relative z-10">Thêm thành viên</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Tìm theo tên/email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input text-sm w-full h-full"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        
        <select 
          className="input text-sm w-full sm:w-40"
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">Tất cả vai trò</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Lọc phòng ban..."
          value={deptFilter}
          onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
          className="input text-sm w-full sm:w-40"
        />

        <input
          type="text"
          placeholder="Lọc chức vụ..."
          value={posFilter}
          onChange={e => { setPosFilter(e.target.value); setPage(1); }}
          className="input text-sm w-full sm:w-40"
        />
      </div>

      {/* User Table */}
      {loading ? (
        <div className="card p-8 flex items-center justify-center">
          <Loader size={32} className="animate-spin text-primary-500" />
        </div>
      ) : users.length === 0 ? (
        <div className="card p-16 text-center">
          <Users size={48} className="text-dark-600 mx-auto mb-4" />
          <h3 className="text-dark-300 font-semibold mb-2">Không tìm thấy thành viên nào</h3>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Phòng ban</th>
                <th>Chức vụ</th>
                <th className="text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="animate-fade-in">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold text-white">
                        {u.name?.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="font-medium text-dark-200">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-dark-400">{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === ROLES.ADMIN ? 'badge-high' : u.role === ROLES.PROJECT_MANAGER ? 'badge-medium' : 'badge-low'}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="text-dark-400">{u.department || '—'}</td>
                  <td className="text-dark-400">{u.position || '—'}</td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditUser(u); setShowModal(true); }}
                        className="btn-ghost btn-sm"
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                      {currentUser?._id !== u._id && (
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="btn-ghost btn-sm text-danger-500 hover:bg-danger-500/10"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={!pagination.hasPrevPage}
            onClick={() => setPage(p => p - 1)}
            className="btn-secondary btn-sm"
          >
            Trước
          </button>
          <span className="text-sm text-dark-400">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <button
            disabled={!pagination.hasNextPage}
            onClick={() => setPage(p => p + 1)}
            className="btn-secondary btn-sm"
          >
            Sau
          </button>
        </div>
      )}

      {showModal && (
        <UserFormModal
          user={editUser}
          onClose={() => { setShowModal(false); setEditUser(null); }}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default UsersPage;
