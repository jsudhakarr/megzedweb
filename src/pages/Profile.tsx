import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  X,
  Camera,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { apiService, UpdateProfileData } from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const { user, token, refreshProfile } = useAuth();
  const { settings } = useAppSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const primaryColor = settings?.primary_color || '#0073f0';

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || '',
    about: user?.about || '',
  });

  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await apiService.getProfile();
      console.log('Profile data:', data);
      setProfileData(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        mobile: data.mobile || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        about: data.about || '',
      });
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.message || 'Failed to load profile');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setError('');
    setUploadingPhoto(true);

    try {
      const response = await apiService.uploadProfilePhoto(file);
      setSuccess('Profile photo updated successfully!');
      setProfileData(response);
      await refreshProfile();
      await loadProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updateData: UpdateProfileData = {
        name: formData.name,
        email: formData.email || undefined,
        mobile: formData.mobile,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        about: formData.about,
      };

      const response = await apiService.updateProfile(updateData);
      setProfileData(response);
      await refreshProfile();
      setSuccess('Profile updated successfully!');
      setIsEditing(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    if (profileData) {
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        mobile: profileData.mobile || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        country: profileData.country || '',
        about: profileData.about || '',
      });
    }
  };

  const displayData = profileData || user;

  return (
    <div className="space-y-6">
      {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="h-32" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }}></div>

          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-6">
              <div className="relative group">
                <div className="relative">
                  {(() => {
  const photo =
    displayData?.profile_photo_url ||
    displayData?.avatar_url ||
    displayData?.profile_photo ||
    '';

  return photo ? (
    <img
      src={photo}
      alt={displayData?.name || 'User'}
      className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
      referrerPolicy="no-referrer"
      onError={(e) => {
        // prevent infinite loop
        e.currentTarget.onerror = null;
        // fallback to local default avatar (put this file in /public)
        e.currentTarget.src = '/default-avatar.png';
      }}
    />
  ) : (
    <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-slate-200 flex items-center justify-center">
      <UserIcon className="w-16 h-16 text-slate-400" />
    </div>
  );
})()}

                  <button
                    onClick={handlePhotoClick}
                    disabled={uploadingPhoto}
                    className="absolute bottom-0 right-0 text-white p-3 rounded-full shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {uploadingPhoto ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="mt-4 md:mt-0">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-3 text-white rounded-lg hover:opacity-90 transition-all"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="font-medium">Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span className="font-medium">Cancel</span>
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Save className="w-4 h-4" />
                      <span className="font-medium">
                        {loading ? 'Saving...' : 'Save Changes'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!isEditing ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {displayData?.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        displayData?.is_verified
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {displayData?.is_verified ? 'Verified' : 'Not Verified'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      KYC: {displayData?.kyc_status}
                    </span>
                  </div>
                </div>

                {displayData?.about && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">
                      About
                    </h3>
                    <p className="text-slate-700">{displayData.about}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase">
                      Contact Information
                    </h3>

                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-slate-900 font-medium">
                          {displayData?.email || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="text-slate-900 font-medium">
                          {displayData?.mobile ? `+${displayData.mobile}` : 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase">
                      Location
                    </h3>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500">Address</p>
                        <p className="text-slate-900 font-medium">
                          {displayData?.address || 'Not provided'}
                        </p>
                        {(displayData?.city || displayData?.state || displayData?.country) && (
                          <p className="text-sm text-slate-600 mt-1">
                            {[displayData?.city, displayData?.state, displayData?.country]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="917032202023"
                    />
                    <p className="text-xs text-slate-500 mt-1">Include country code without + sign</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="123 Main Street, Apt 4B"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    About
                  </label>
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </form>
            )}
          </div>
        </div>
    </div>
  );
}
