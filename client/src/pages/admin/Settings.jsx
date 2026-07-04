import { useState, useContext } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ToastContext } from '../../context/ToastContext';
import { authAPI } from '../../services/api';
import { User, Mail, Phone, Lock, Save, Settings as SettingsIcon, Camera } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function Settings() {
  const { user, reloadUser } = useAuth();
  const { addToast } = useContext(ToastContext);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar ? `http://localhost:5000/uploads/${user.avatar}` : ''
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePasswordChange = (field) => (e) => {
    setPasswords((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      addToast('Name is required', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', profile.name.trim());
      formData.append('email', profile.email.trim());
      if (avatarFile) formData.append('file', avatarFile);

      await authAPI.updateProfile(formData);
      addToast('Profile updated successfully', 'success');
      if (reloadUser) reloadUser();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      addToast('Please fill in all password fields', 'error');
      return;
    }
    if (passwords.newPassword.length < 6) {
      addToast('New password must be at least 6 characters', 'error');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      addToast('Password changed successfully', 'success');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <SettingsIcon size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Settings
          </h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div className="grid grid-2 gap-lg" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-header">
            <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={20} /> Profile Information
            </h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveProfile}>
              <div className="flex-col gap-md">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <label 
                    style={{ 
                      position: 'relative', 
                      cursor: 'pointer', 
                      display: 'inline-block',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      width: 100,
                      height: 100,
                      border: '3px solid var(--border)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    className="avatar-upload-wrapper"
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        color: 'var(--bg-primary, #000)'
                      }}
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (profile.name || 'A')[0].toUpperCase()
                      )}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div 
                      className="avatar-overlay"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        height: '33%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <Camera size={16} />
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setAvatarFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => setAvatarPreview(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 500 }}>
                    Click to change photo
                  </p>
                </div>
                <Input
                  label="Full Name"
                  type="text"
                  value={profile.name}
                  onChange={handleProfileChange('name')}
                  icon={<User size={18} />}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={handleProfileChange('email')}
                  icon={<Mail size={18} />}
                  placeholder="your@email.com"
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  value={profile.phone}
                  onChange={() => {}}
                  icon={<Phone size={18} />}
                  disabled
                />
                <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                  Phone number cannot be changed
                </p>
                <Button type="submit" variant="primary" loading={savingProfile} icon={<Save size={18} />}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={20} /> Change Password
            </h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleChangePassword}>
              <div className="flex-col gap-md">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwords.currentPassword}
                  onChange={handlePasswordChange('currentPassword')}
                  icon={<Lock size={18} />}
                  placeholder="Enter current password"
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange('newPassword')}
                  icon={<Lock size={18} />}
                  placeholder="Enter new password"
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange('confirmPassword')}
                  icon={<Lock size={18} />}
                  placeholder="Confirm new password"
                  required
                />
                <Button type="submit" variant="primary" loading={savingPassword} icon={<Save size={18} />}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
