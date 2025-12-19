import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Logo } from '../components/ui/Logo';
import { ArrowLeft } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <Logo variant="icon" className="w-16 h-16" />
          </div>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <p className="text-slate-500 text-sm mt-2">
            Enter your email and we'll send you instructions
          </p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="bg-success-50 text-success-700 p-4 rounded-lg text-sm">
                Check your email for password reset instructions.
              </div>
              <Link to="/login">
                <Button className="w-full" variant="secondary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>

              <Link to="/login">
                <Button className="w-full" variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
