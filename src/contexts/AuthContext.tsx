import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { apiService, LoginCredentials, RegisterData, AuthResponse } from '../services/api';
import Toast from '../components/ui/Toast';

interface User {
  id: number;
  name: string;
  email: string | null;
  mobile?: string;
  about?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
  notification?: string | null;
  is_verified: boolean;
  kyc_status: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: () => Promise<void>;

  sendOTP: (phoneNumber: string) => Promise<ConfirmationResult>;
  verifyOTP: (
    confirmationResult: ConfirmationResult,
    code: string,
    phoneNumber?: string
  ) => Promise<void>;

  logout: () => void;
  refreshProfile: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const isUnauthorizedError = (error: unknown) =>
  error instanceof Error && error.message.toLowerCase().includes('unauthenticated');

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    auth.signOut();
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');

      if (!storedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      setToken(storedToken);

      if (storedUser && storedUser !== 'undefined') {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('user');
        }
      }

      try {
        const profileData = await apiService.getProfile();
        const updatedUser: User = {
          id: profileData.id,
          name: profileData.name,
          email: profileData.email,
          mobile: profileData.mobile,
          about: profileData.about,
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
          country: profileData.country,
          profile_photo: profileData.profile_photo,
          profile_photo_url: profileData.profile_photo_url || profileData.avatar_url,
          notification: profileData.notification,
          is_verified: profileData.is_verified || false,
          kyc_status: profileData.kyc_status || 'pending',
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        if (isUnauthorizedError(error)) {
          handleLogout();
          setLoading(false);
          return;
        }
        console.error('Failed to refresh profile on mount:', error);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    const handleAuthLogout = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const message = customEvent?.detail?.message;
      handleLogout();
      if (message) {
        setToastMessage(message);
      }
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  const handleAuthResponse = async (response: AuthResponse) => {
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    try {
      const profileData = await apiService.getProfile();
      const updatedUser: User = {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        mobile: profileData.mobile,
        about: profileData.about,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        country: profileData.country,
        profile_photo: profileData.profile_photo,
        profile_photo_url: profileData.profile_photo_url || profileData.avatar_url,
        notification: profileData.notification,
        is_verified: profileData.is_verified || false,
        kyc_status: profileData.kyc_status || 'pending',
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleLogout();
        return;
      }
      console.error('Failed to refresh profile after auth:', error);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiService.login(credentials);
      await handleAuthResponse(response);
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    const response = await apiService.register(data);
    await handleAuthResponse(response);
  };

  // ✅ FIX: send access_token field (not id_token/provider_id)
 const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    // ✅ FIX: get email from providerData if result.user.email is null
    const providerEmail =
      result.user.email ||
      result.user.providerData?.find((p) => p?.providerId === 'google.com')?.email ||
      undefined;

    const photoURL = result.user.photoURL;

const response = await apiService.socialLogin({
  provider: 'google',
  access_token: idToken,
  provider_id: result.user.uid,
  email: result.user.email || undefined,
  name: result.user.displayName || undefined,
  ...(photoURL ? { avatar: photoURL } : {}), // ✅ only send if exists
});


    await handleAuthResponse(response);
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
};



  const sendOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
    const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );

    return confirmationResult;
  };

  // ✅ FIX: send access_token (not id_token/provider_id)
  // phoneNumber optional, pass it from Login screen if backend requires mobile
  const verifyOTP = async (
    confirmationResult: ConfirmationResult,
    code: string,
    phoneNumber?: string
  ) => {
    try {
      const result = await confirmationResult.confirm(code);
      const idToken = await result.user.getIdToken();

      const response = await apiService.socialLogin({
        provider: 'phone',
        access_token: idToken, // ✅ REQUIRED
        mobile: phoneNumber ? phoneNumber.replace('+', '') : undefined, // ✅ optional
      });

      await handleAuthResponse(response);
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      return;
    }
    try {
      const profileData = await apiService.getProfile();
      const updatedUser: User = {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        mobile: profileData.mobile,
        about: profileData.about,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        country: profileData.country,
        profile_photo: profileData.profile_photo,
        profile_photo_url: profileData.profile_photo_url || profileData.avatar_url,
        notification: profileData.notification,
        is_verified: profileData.is_verified || false,
        kyc_status: profileData.kyc_status || 'pending',
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleLogout();
        return;
      }
      console.error('Failed to refresh profile:', error);
    }
  };

  const logout = () => {
    handleLogout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        loginWithGoogle,
        sendOTP,
        verifyOTP,
        logout,
        refreshProfile,
      }}
    >
      {children}
      {toastMessage ? (
        <div className="fixed right-4 top-4 z-[1000]">
          <Toast message={toastMessage} variant="error" />
        </div>
      ) : null}
    </AuthContext.Provider>
  );
};
