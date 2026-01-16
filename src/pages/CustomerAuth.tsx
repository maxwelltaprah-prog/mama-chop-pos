import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, User, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';

const phoneSchema = z.string().regex(/^(?:\+233|0)[2-9]\d{8}$/, 'Invalid phone number. Use format: 0241234567');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function CustomerAuth() {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated } = useCustomerAuth();
  
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/order', { replace: true });
    return null;
  }

  const validatePhone = (value: string) => {
    const result = phoneSchema.safeParse(value.replace(/\s/g, ''));
    return result.success;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhone = phone.replace(/\s/g, '');
    
    if (!validatePhone(cleanPhone)) {
      toast.error('Invalid phone number. Use format: 0241234567');
      return;
    }

    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) {
      toast.error(passResult.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(cleanPhone, password);
    setIsLoading(false);

    if (!error) {
      navigate('/order');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanPhone = phone.replace(/\s/g, '');
    
    if (!validatePhone(cleanPhone)) {
      toast.error('Invalid phone number. Use format: 0241234567');
      return;
    }

    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) {
      toast.error(passResult.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(cleanPhone, password, fullName || undefined);
    setIsLoading(false);

    if (!error) {
      navigate('/order');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/order" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to menu
          </Link>
          <div className="flex justify-center mb-4">
            <img 
              src="/eidikos-logo.jpeg" 
              alt="Eidikos Kouzina" 
              className="w-20 h-20 rounded-2xl shadow-lg object-cover"
            />
          </div>
          <h1 className="text-2xl font-display font-bold text-gradient">Eidikos Kouzina</h1>
          <p className="text-muted-foreground text-sm">Sign in to track orders & earn rewards</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent>
            {activeTab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-phone"
                      type="tel"
                      placeholder="0241234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name (optional)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Your name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="0241234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Format: 0241234567 or +233241234567</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t">
              <p className="text-center text-sm text-muted-foreground">
                Continue as guest?{' '}
                <Link to="/order" className="text-primary hover:underline font-medium">
                  Order without account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Staff login link */}
        <div className="text-center mt-6">
          <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground">
            Staff login →
          </Link>
        </div>
      </div>
    </div>
  );
}
