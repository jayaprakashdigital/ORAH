import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Trash2, CheckCircle, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [clearing, setClearing] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    try {
      setSaving(true);
      setMessage(null);

      const { error } = await supabase
        .from('users')
        .update({
          name,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    setClearing(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error('Error clearing cache:', error);
      setClearing(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;

    try {
      setResettingPassword(true);
      setPasswordMessage(null);

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setPasswordMessage({
        type: 'success',
        text: 'Password reset link sent to your email'
      });
      setTimeout(() => setPasswordMessage(null), 5000);
    } catch (error) {
      console.error('Error sending reset email:', error);
      setPasswordMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send reset email'
      });
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Profile</h3>
          </div>
          <div className="p-5">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  type="text"
                  value={profile?.role || ''}
                  disabled
                  className="bg-slate-50 capitalize"
                />
              </div>

              {message && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {message.type === 'success' && <CheckCircle className="w-4 h-4" />}
                  {message.text}
                </div>
              )}

              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Browser Cache</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-4">
                Clear browser cache to see the latest version of the application
              </p>
              <Button onClick={handleClearCache} disabled={clearing} variant="secondary">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                {clearing ? 'Clearing...' : 'Clear Cache'}
              </Button>
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Password</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-4">
                Reset your password via email verification
              </p>
              {passwordMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {passwordMessage.type === 'success' && <CheckCircle className="w-4 h-4" />}
                  {passwordMessage.text}
                </div>
              )}
              <Button onClick={handleResetPassword} disabled={resettingPassword} variant="secondary">
                <Key className="w-3.5 h-3.5 mr-1.5" />
                {resettingPassword ? 'Sending...' : 'Reset Password'}
              </Button>
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Account Info</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Company ID</span>
                <span className="text-sm font-mono text-slate-900">{profile?.company_id?.substring(0, 8)}...</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">User ID</span>
                <span className="text-sm font-mono text-slate-900">{user?.id?.substring(0, 8)}...</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
