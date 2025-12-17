import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Smartphone, AlertCircle, Store } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';

// ✅ STEP 1: Move Wrapper OUTSIDE the main component
// It needs to accept 'isModal' as a prop now.
const Wrapper = ({ children, isModal }: { children: React.ReactNode; isModal: boolean }) => {
  if (isModal) return <>{children}</>;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      {children}
    </div>
  );
};

interface LoginProps {
  isModal?: boolean;
  onSuccess?: () => void;
}

export default function Login({ isModal = false, onSuccess }: LoginProps) {
  const navigate = useNavigate();
  const { login, loginWithGoogle, sendOTP, verifyOTP } = useAuth();
  const { settings } = useAppSettings();

  const [mode, setMode] = useState<'phone' | 'email'>('phone');

  // ... (Your existing state definitions for email, password, etc. remain here) ...
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const primaryColor = settings?.primary_color || '#0073f0';
  const appName = settings?.appname ? settings.appname.split(' - ')[0] : 'Megzed';
  const appLogoUrl = settings?.logo?.url || null;

  useEffect(() => {
    setError('');
    setOtp('');
    setConfirmationResult(null);
  }, [mode]);

  const afterSuccess = () => {
    if (isModal) {
      onSuccess?.();
      return;
    }
    navigate('/dashboard');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      afterSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      afterSuccess();
    } catch {
      setError('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (phone.length < 10) {
      setError('Please enter a valid phone number with country code');
      setLoading(false);
      return;
    }

    try {
      const result = await sendOTP(phone);
      setConfirmationResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOTP(confirmationResult, otp, phone);
      afterSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP or server error.');
    } finally {
      setLoading(false);
    }
  };

  // ❌ DELETED: The inner Wrapper definition was removed from here.

  return (
    // ✅ STEP 2: Pass 'isModal' to the Wrapper
    <Wrapper isModal={isModal}>
      <div className="w-full max-w-md">
        {/* ... (Rest of your JSX remains exactly the same) ... */}
        
        {/* Logo Section */}
        <div className="flex items-center justify-center gap-3 mb-5">
          {appLogoUrl ? (
            <img src={appLogoUrl} alt={appName} className="h-10 w-auto object-contain" />
          ) : (
            <Store className="w-8 h-8" style={{ color: primaryColor }} />
          )}
          <span className="text-2xl font-bold text-slate-900">{appName}</span>
        </div>

        <div className={isModal ? 'bg-white' : 'bg-white rounded-2xl shadow-xl p-8'}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border-2 border-slate-300 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
             <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.58 2.38 29.64 0 24 0 14.62 0 6.53 5.38 2.56 13.22l7.1 5.5C11.6 13.4 17.36 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.14 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.43c-.54 2.9-2.17 5.36-4.6 7.04l7.04 5.45c4.1-3.78 6.27-9.36 6.27-16.74z"/>
                <path fill="#FBBC05" d="M9.66 28.72c-.5-1.5-.78-3.1-.78-4.72s.28-3.22.78-4.72l-7.1-5.5C.92 16.42 0 20.12 0 24c0 3.88.92 7.58 2.56 10.22l7.1-5.5z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.14 15.9-5.8l-7.04-5.45c-1.96 1.32-4.48 2.1-8.86 2.1-6.64 0-12.4-3.9-14.34-9.22l-7.1 5.5C6.53 42.62 14.62 48 24 48z"/>
             </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="text-center text-xs text-slate-400 my-4">or continue with</div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode('phone')}
              className={`flex-1 py-2 rounded-md font-semibold transition-all ${
                mode === 'phone' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Phone
            </button>
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`flex-1 py-2 rounded-md font-semibold transition-all ${
                mode === 'email' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Email
            </button>
          </div>

          {/* Form Logic (Phone vs Email) */}
          {mode === 'phone' ? (
            <>
              {!confirmationResult ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+91xxxxxxxxxx"
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Enter number with country code (example: +91...)</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Enter OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-widest text-lg"
                      placeholder="123456"
                      required
                    />
                    <p className="text-xs text-slate-500 mt-2 text-center">Verification code sent to {phone}</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmationResult(null);
                      setOtp('');
                    }}
                    className="w-full text-sm text-slate-600 hover:text-slate-900 underline"
                  >
                    Change phone number
                  </button>
                </form>
              )}
            </>
          ) : (
            /* EMAIL FORM */
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Links */}
          <div className="mt-5 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold" style={{ color: primaryColor }}>
                Sign up
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            By continuing, you agree to our{' '}
            <Link to="/page/terms" className="underline font-medium">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/page/privacy-policy" className="underline font-medium">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </Wrapper>
  );
}