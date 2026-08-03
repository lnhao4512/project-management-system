import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../api';
import { APP_NAME } from '../../constants';
import { Mail, Zap, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  
  // 0: Input Email, 1: Input OTP & New Password, 2: Success
  const [step, setStep] = useState(0);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setPwdError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return toast.error('Vui lòng nhập email');
    
    try {
      setLoading(true);
      const res = await authAPI.forgotPassword({ email: cleanEmail });
      setEmail(cleanEmail);
      setStep(1);
      if (res.data?.data?.otp) {
        toast.success(`Mã OTP demo của bạn: ${res.data.data.otp}`, { duration: 10000 });
      } else {
        toast.success('Mã OTP đã được gửi đến email của bạn');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Lỗi khi gửi yêu cầu';
      setPwdError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (!otp || otp.length !== 6) return setPwdError('Vui lòng nhập mã OTP 6 số.');
    
    try {
      setLoading(true);
      await authAPI.verifyOTP({ email, otp });
      setStep(1.5);
      toast.success('Mã OTP hợp lệ!');
    } catch (error) {
      const msg = error.response?.data?.message || 'Lỗi khi xác minh OTP';
      setPwdError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setPwdError('');

    if (!otp || otp.length !== 6) return setPwdError('Vui lòng nhập mã OTP 6 số.');
    
    if (newPassword.length < 8 || newPassword.length > 20) return setPwdError('Mật khẩu không đúng quy định. Vui lòng nhập lại');
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9\s])(?!.*\s).*$/;
    if (!pwdRegex.test(newPassword)) return setPwdError('Mật khẩu không đúng quy định. Vui lòng nhập lại');
    if (newPassword !== confirmPassword) return setPwdError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
    
    try {
      setLoading(true);
      await authAPI.resetPassword({ email, otp, password: newPassword, confirmPassword });
      setStep(2);
      toast.success('Mật khẩu đã được đặt lại thành công');
    } catch (error) {
      const msg = error.response?.data?.message || 'Lỗi khi đặt lại mật khẩu';
      setPwdError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-600/30">
              <Zap size={24} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-dark-50">{APP_NAME}</h1>
        </div>

        {/* Card */}
        <div className="bg-dark-800/80 backdrop-blur-xl border border-dark-700 p-8 rounded-2xl shadow-2xl shadow-black/50 relative overflow-hidden">
          {/* Subtle top highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50" />
          
          <div className="mb-8">
            <Link to="/login" className="inline-flex items-center gap-2 text-dark-400 hover:text-primary-400 text-sm mb-5 transition-colors font-medium">
              <ArrowLeft size={16} /> Quay lại đăng nhập
            </Link>
            <h2 className="text-2xl font-bold text-white tracking-tight">Quên Mật Khẩu</h2>
            <p className="text-dark-400 text-sm mt-2">Nhập mã xác nhận và thiết lập mật khẩu mới của bạn</p>
          </div>

          {step === 2 ? (
            <div className="text-center space-y-4">
              <div className="bg-success-500/10 border border-success-500/30 text-success-500 px-4 py-4 rounded-xl mb-5 text-sm">
                <p className="mb-2 font-bold text-lg flex justify-center"><ShieldCheck size={32} className="text-success-500" /></p>
                <p className="font-semibold text-base mt-2">Hoàn tất!</p>
                <p className="mt-1">Mật khẩu của bạn đã được cập nhật thành công.</p>
              </div>
              <p className="text-dark-400 text-sm">Vui lòng sử dụng mật khẩu mới để đăng nhập.</p>
              <Link to="/login" className="btn-primary w-full inline-flex justify-center btn-lg rounded-xl font-bold mt-2 shadow-lg shadow-primary-500/20">
                Đi đến Đăng nhập
              </Link>
            </div>
          ) : step === 1.5 ? (
            <form onSubmit={handleResetPassword} className="space-y-6 animate-fade-in">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-success-500/10 rounded-full mb-3 shadow-lg shadow-success-500/20 text-success-500">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Mã OTP Hợp Lệ</h3>
                <p className="text-dark-400 text-sm mt-1">Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn</p>
              </div>

              {/* Box Quy Định */}
              <div className="p-5 bg-dark-900/40 border border-dark-700/50 rounded-2xl text-sm text-dark-300 animate-fade-in">
                <p className="font-semibold text-dark-100 mb-3 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-primary-500" />
                  Quy định mật khẩu an toàn:
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" /> Từ 8 đến 20 ký tự.</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" /> Có chứa chữ hoa (A-Z) và chữ thường (a-z).</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" /> Có chứa số (0-9) và ký tự đặc biệt (!@#$...).</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary-500" /> Không chứa khoảng trắng.</div>
                </div>
              </div>

              {pwdError && (
                <div className="p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-500 text-sm flex items-start gap-3 animate-fade-in shadow-sm">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span className="font-medium leading-relaxed">{pwdError}</span>
                </div>
              )}
              
              <div className="space-y-4 pt-2">
                <div>
                  <label className="label text-dark-200">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {setNewPassword(e.target.value); setPwdError('');}}
                    placeholder="••••••••"
                    className={`input rounded-xl py-2.5 bg-dark-900/50 ${pwdError && newPassword.length === 0 ? 'border-danger-500/50 focus:border-danger-500 focus:ring-danger-500/20' : pwdError ? 'border-danger-500/50 focus:border-danger-500 focus:ring-danger-500/20' : ''}`}
                    required
                  />
                </div>

                <div>
                  <label className="label text-dark-200">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {setConfirmPassword(e.target.value); setPwdError('');}}
                    placeholder="••••••••"
                    className={`input rounded-xl py-2.5 bg-dark-900/50 ${pwdError && newPassword !== confirmPassword ? 'border-danger-500/50 focus:border-danger-500 focus:ring-danger-500/20' : ''}`}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
                {loading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
              </button>
            </form>
          ) : step === 1 ? (
            <form onSubmit={handleVerifyOTP} className="space-y-6 animate-fade-in">
              {/* Nổi bật Email */}
              <div className="bg-dark-900/80 border border-dark-700/80 px-5 py-5 rounded-2xl text-sm mb-6 flex flex-col items-center text-center shadow-inner relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="text-dark-300">Mã xác nhận (OTP) đã được gửi đến:</span>
                <div className="mt-3 inline-flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 text-primary-300 font-bold px-4 py-2 rounded-xl text-base shadow-lg shadow-primary-500/10">
                  <Mail size={18} className="text-primary-400" />
                  {email}
                </div>
                <span className="mt-3 text-dark-400 text-xs">Vui lòng kiểm tra hộp thư của bạn.</span>
              </div>

              {pwdError && (
                <div className="p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-500 text-sm flex items-start gap-3 animate-fade-in shadow-sm">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span className="font-medium leading-relaxed">{pwdError}</span>
                </div>
              )}
              
              <div className="space-y-4 pt-2">
                <div>
                  <label className="label text-dark-200">Mã OTP (6 số)</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setPwdError('');}}
                    placeholder="123456"
                    className={`input text-center tracking-[0.75em] font-black text-xl py-3 rounded-xl bg-dark-900/50 ${pwdError && (!otp || otp.length !== 6) ? 'border-danger-500/50 focus:border-danger-500 focus:ring-danger-500/20' : ''}`}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
                {loading ? 'Đang kiểm tra...' : 'Xác nhận OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSendOTP} className="space-y-5 animate-fade-in">
              {pwdError && (
                <div className="p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl text-danger-500 text-sm flex items-start gap-3 animate-fade-in shadow-sm">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span className="font-medium leading-relaxed">{pwdError}</span>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="label">Địa chỉ Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setPwdError(''); }}
                    placeholder="ban@congty.com"
                    className={`input ${pwdError ? 'border-danger-500/50 focus:border-danger-500 focus:ring-danger-500/20' : ''}`}
                    style={{ paddingLeft: '2.25rem' }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full btn-lg"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Đặt lại mật khẩu'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
