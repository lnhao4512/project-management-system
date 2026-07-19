import { useState, useEffect } from 'react';
import { X, Loader, HelpCircle } from 'lucide-react';
import { usersAPI } from '../../api';
import toast from 'react-hot-toast';

const ROLES_OPTIONS = [
  { value: 'employee', label: 'Thành viên' },
  { value: 'project_manager', label: 'Quản lý dự án' },
  { value: 'admin', label: 'Quản trị viên' },
];

const LabelWithTooltip = ({ label, rules }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1 w-full">
      <div 
        className="flex items-center gap-1 w-max cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <label className="text-sm font-medium text-dark-200 cursor-pointer">{label}</label>
        <HelpCircle size={14} className={`transition-colors ${isOpen ? 'text-danger-400' : 'text-dark-400 hover:text-dark-200'}`} />
      </div>
      
      {isOpen && (
        <div className="w-full p-3 bg-dark-800 border border-danger-500/30 rounded-lg shadow-sm mb-1 animate-fade-in">
          <p className="text-xs font-semibold text-danger-400 mb-1.5 border-b border-danger-500/20 pb-1">Điều kiện bắt buộc:</p>
          <ul className="space-y-1">
            {rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs text-danger-500 leading-tight">
                <span className="mt-0.5 text-danger-400 text-[10px]">●</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const UserFormModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    department: '',
    position: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'employee',
        department: user.department || '',
        position: user.position || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (user) {
        // Edit mode
        const updateData = { ...formData };
        await usersAPI.update(user._id, updateData);
        toast.success('Cập nhật thành công');
      } else {
        // Create mode
        const createData = { ...formData };
        if (createData.password === '') delete createData.password;
        await usersAPI.create(createData);
        toast.success('Tạo thành viên thành công');
      }
      onSuccess();
    } catch (error) {
      const data = error.response?.data;
      const errorMsg = data?.errors?.[0]?.message || data?.message || 'Có lỗi xảy ra';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-900 border border-dark-700/50 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700/50">
          <h2 className="text-lg font-bold text-dark-50">
            {user ? 'Cập nhật thành viên' : 'Thêm thành viên mới'}
          </h2>
          <button onClick={onClose} className="p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1">
            <LabelWithTooltip 
              label="Họ và tên *" 
              rules={[
                "Không được để trống",
                "Tối thiểu 2 ký tự",
                "Tối đa 100 ký tự"
              ]} 
            />
            <input
              required
              className="input"
              placeholder="Nguyễn Văn A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <LabelWithTooltip 
              label="Email *" 
              rules={[
                "Không được để trống",
                "Đúng định dạng email (vd: name@domain.com)"
              ]} 
            />
            <input
              required
              type="email"
              className="input"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>



          <div className="space-y-1">
            <label className="text-sm font-medium text-dark-200">Vai trò</label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {ROLES_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-dark-200">Phòng ban</label>
              <input
                className="input"
                placeholder="VD: IT"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-dark-200">Chức vụ</label>
              <input
                className="input"
                placeholder="VD: Developer"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-dark-700/50 bg-dark-900/50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary min-w-[100px]">
            {loading ? <Loader size={18} className="animate-spin" /> : 'Lưu lại'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserFormModal;
