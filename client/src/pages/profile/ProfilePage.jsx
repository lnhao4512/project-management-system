import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usersAPI, authAPI } from '../../api';
import toast from 'react-hot-toast';
import { User, Mail, Shield, Camera, Loader, Lock, HelpCircle } from 'lucide-react';
import { ROLE_LABELS } from '../../constants';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [showPwdRules, setShowPwdRules] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await usersAPI.getProfile();
        setProfile(data.data);
        setName(data.data.name);
      } catch (error) {
        toast.error('Không thể tải thông tin hồ sơ');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data } = await usersAPI.updateProfile({ name });
      setProfile(data.data);
      toast.success('Đã cập nhật thông tin cá nhân');
    } catch (error) {
      toast.error('Lỗi khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');

    if (newPassword !== confirmPassword) {
      setPwdError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 20) {
      setPwdError('Mật khẩu phải có từ 8 đến 20 ký tự.');
      return;
    }
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s])(?!.*\s).*$/;
    if (!pwdRegex.test(newPassword)) {
      setPwdError('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt và không chứa khoảng trắng.');
      return;
    }
    if (currentPassword === newPassword) {
      setPwdError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    try {
      setChangingPwd(true);
      await authAPI.changePassword({ currentPassword, newPassword, confirmPassword });
      toast.success('Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwdError('');
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Lỗi khi đổi mật khẩu';
      setPwdError(errMsg);
      toast.error(errMsg);
    } finally {
      setChangingPwd(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const { data } = await usersAPI.updateAvatar(formData);
      setProfile(data.data);
      toast.success('Đã cập nhật ảnh đại diện');
    } catch (error) {
      toast.error('Lỗi khi tải ảnh lên');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Hồ sơ cá nhân</h1>
        <p className="text-dark-400 mt-1">Quản lý thông tin cá nhân và bảo mật tài khoản của bạn</p>
      </div>
      
      <div className="space-y-6">
        {/* Profile Header Banner */}
        <div className="bg-dark-800 rounded-3xl border border-dark-700 overflow-hidden shadow-xl">
          <div className="h-32 bg-gradient-to-r from-primary-600/80 via-primary-500/80 to-purple-600/80 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          </div>
          <div className="px-8 pb-8 relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12">
            <div className="relative group z-10">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-dark-800 border-4 border-dark-800 flex items-center justify-center text-5xl text-dark-400 font-bold shadow-2xl shadow-black/50">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity backdrop-blur-sm">
                <Camera size={28} className="text-white drop-shadow-md" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </label>
            </div>
            <div className="text-center md:text-left flex-1 mb-2">
              <h2 className="text-2xl font-bold text-white">{profile?.name}</h2>
              <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
                <span className={`badge px-3 py-1 text-sm shadow-sm ${profile?.role === 'admin' ? 'badge-high' : profile?.role === 'project_manager' ? 'badge-medium' : 'badge-low'}`}>
                  {ROLE_LABELS[profile?.role] || profile?.role}
                </span>
                <span className="text-dark-400 text-sm flex items-center gap-1"><Mail size={14}/> {profile?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Info Form */}
          <div className="bg-dark-800 rounded-3xl border border-dark-700 p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User size={22} className="text-primary-500" /> Thông tin cơ bản
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">
                  Họ và tên
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input py-2.5 rounded-xl bg-dark-900/50"
                    style={{ paddingLeft: '2.75rem' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">
                  Địa chỉ Email <span className="text-dark-500 text-xs font-normal">(Không thể thay đổi)</span>
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                  <input
                    type="email"
                    value={profile?.email}
                    disabled
                    className="input py-2.5 rounded-xl bg-dark-900/80 text-dark-500 cursor-not-allowed border-dark-800"
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving || name === profile?.name}
                  className="btn-primary w-full py-2.5 rounded-xl font-semibold shadow-lg shadow-primary-500/20 disabled:shadow-none disabled:bg-dark-700 disabled:text-dark-500"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-dark-800 rounded-3xl border border-dark-700 p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-danger-500/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield size={22} className="text-danger-500" /> Bảo mật
              </h3>
              <button 
                type="button" 
                onClick={() => setShowPwdRules(!showPwdRules)} 
                className="text-dark-400 hover:text-white transition-colors bg-dark-700 hover:bg-dark-600 p-1.5 rounded-lg"
                title="Quy định mật khẩu"
              >
                <HelpCircle size={18} />
              </button>
            </div>

            {showPwdRules && (
              <div className="mb-5 p-4 bg-dark-900/50 border border-dark-700/50 rounded-xl text-xs text-dark-300 animate-fade-in shadow-inner">
                <p className="font-semibold text-white mb-2 flex items-center gap-2"><Shield size={14} className="text-danger-500"/> Quy định mật khẩu:</p>
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-danger-500" /> Từ 8 đến 20 ký tự, không chứa khoảng trắng.</div>
                  <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-danger-500" /> Ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt.</div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              {pwdError && (
                <div className="p-3 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-500 text-sm flex items-start gap-2 animate-fade-in">
                  <Shield size={16} className="mt-0.5 flex-shrink-0" />
                  <span className="leading-tight">{pwdError}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Mật khẩu hiện tại</label>
                <div className="relative">
                  <Lock size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${pwdError ? 'text-danger-400' : 'text-dark-400'}`} />
                  <input type="password" value={currentPassword} onChange={e => {setCurrentPassword(e.target.value); setPwdError('');}} className={`input py-2.5 rounded-xl bg-dark-900/50 ${pwdError ? 'border-danger-500/50 focus:border-danger-500 focus:ring-danger-500/20' : ''}`} style={{ paddingLeft: '2.75rem' }} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Mật khẩu mới</label>
                <div className="relative">
                  <Lock size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${pwdError ? 'text-danger-400' : 'text-dark-400'}`} />
                  <input type="password" value={newPassword} onChange={e => {setNewPassword(e.target.value); setPwdError('');}} className={`input py-2.5 rounded-xl bg-dark-900/50 ${pwdError ? 'border-danger-500/50 focus:border-danger-500 focus:ring-danger-500/20' : ''}`} style={{ paddingLeft: '2.75rem' }} required minLength={8} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${pwdError ? 'text-danger-400' : 'text-dark-400'}`} />
                  <input type="password" value={confirmPassword} onChange={e => {setConfirmPassword(e.target.value); setPwdError('');}} className={`input py-2.5 rounded-xl bg-dark-900/50 ${pwdError ? 'border-danger-500/50 focus:border-danger-500 focus:ring-danger-500/20' : ''}`} style={{ paddingLeft: '2.75rem' }} required minLength={8} />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={changingPwd} className="w-full py-2.5 rounded-xl font-semibold bg-danger-600 hover:bg-danger-500 text-white transition-colors shadow-lg shadow-danger-600/20 disabled:shadow-none disabled:bg-dark-700 disabled:text-dark-500">
                  {changingPwd ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
