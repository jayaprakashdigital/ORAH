import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Trash2 } from 'lucide-react';

export function Settings() {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [clearing, setClearing] = useState(false);

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

      setMessage({ type: 'success', text: 'Profile updated successfully!' });

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-slate-500">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
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
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Browser Cache</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Clear browser cache to see the latest version of the application
          </p>
          <Button onClick={handleClearCache} disabled={clearing} variant="secondary">
            <Trash2 className="w-4 h-4 mr-2" />
            {clearing ? 'Clearing...' : 'Clear Browser Cache'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
