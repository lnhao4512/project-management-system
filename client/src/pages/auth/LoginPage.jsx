import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { loginUser, clearError } from '../../redux/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { APP_NAME } from '../../constants';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Kanban, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = yup.object({
  email: yup.string().email('Email không hợp lệ').required('Vui lòng nhập Email'),
  password: yup.string().min(6, 'Tối thiểu 6 ký tự').required('Vui lòng nhập Mật khẩu'),
});

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  useEffect(() => { if (isAuthenticated) navigate('/', { replace: true }); }, [isAuthenticated, navigate]);
  useEffect(() => { return () => { dispatch(clearError()); }; }, [dispatch]);

  const onSubmit = async (data) => {
    const result = await dispatch(loginUser(data));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Chào mừng trở lại! 🎉');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex bg-dark-950 transition-colors duration-300">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden items-center justify-center p-12 bg-dark-900 border-r border-dark-700/50">
        {/* Gradient blobs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-50" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-50" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-50" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', filter: 'blur(30px)' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/30">
            <Kanban size={36} className="text-white" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-dark-50 mb-4 leading-tight tracking-tight">
            Quản lý dự án<br />
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              thông minh hơn
            </span>
          </h1>
          <p className="text-dark-400 text-lg leading-relaxed">
            Theo dõi tiến độ, phân công công việc và cộng tác với đội nhóm một cách hiệu quả.
          </p>


        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 relative">
        {/* Subtle ambient top */}
        <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none opacity-50" style={{ background: 'radial-gradient(circle at top right, rgba(99,102,241,0.08) 0%, transparent 60%)' }} />

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Kanban size={20} className="text-white" />
            </div>
            <span className="text-dark-50 font-bold text-lg">{APP_NAME}</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-dark-50 mb-2 tracking-tight">Đăng nhập</h2>
            <p className="text-dark-400 text-sm">Chào mừng trở lại! Nhập thông tin tài khoản để tiếp tục.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-sm animate-slide-down bg-red-500/10 border border-red-500/20 text-red-500 font-medium">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-dark-400 uppercase tracking-widest mb-2">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  {...register('email')} type="email" placeholder="ban@congty.com" autoComplete="email"
                  className={`w-full py-3 pl-10 pr-4 text-sm text-dark-100 placeholder-dark-500 rounded-xl outline-none transition-all bg-dark-800/50 border ${errors.email ? 'border-red-500/40 focus:border-red-500/40 focus:bg-red-500/5' : 'border-dark-700/50 focus:border-indigo-500/50 focus:bg-indigo-500/5'}`}
                  style={{ boxShadow: errors.email ? '0 0 0 3px rgba(239,68,68,0.1)' : '' }}
                  onFocus={e => !errors.email && (e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)')}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-dark-400 uppercase tracking-widest">Mật khẩu</label>
                <Link to="/forgot-password" className="text-xs font-medium text-indigo-500 hover:text-indigo-400 transition-colors">Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password"
                  className={`w-full py-3 pl-10 pr-10 text-sm text-dark-100 placeholder-dark-500 rounded-xl outline-none transition-all bg-dark-800/50 border ${errors.password ? 'border-red-500/40 focus:border-red-500/40 focus:bg-red-500/5' : 'border-dark-700/50 focus:border-indigo-500/50 focus:bg-indigo-500/5'}`}
                  style={{ boxShadow: errors.password ? '0 0 0 3px rgba(239,68,68,0.1)' : '' }}
                  onFocus={e => !errors.password && (e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)')}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white mt-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed group"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang đăng nhập...</>
              ) : (
                <>Đăng Nhập <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>



          <p className="text-center text-dark-500 text-xs mt-8">© 2024 {APP_NAME}. Bản quyền đã được bảo lưu.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
