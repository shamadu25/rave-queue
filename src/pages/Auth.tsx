import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Hospital, Mail, Lock, User, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { toast } from 'sonner';
import { AnimatedBackground } from '@/components/AnimatedBackground';

export default function Auth() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const { settings } = useSystemSettings();
  
  // Form states
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: ''
  });
  
  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'doctor',
    department: 'Consultation'
  });

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/monitor" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(signInForm.email, signInForm.password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Welcome back! Redirecting to dashboard...');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signUp(
        signUpForm.email,
        signUpForm.password,
        signUpForm.fullName,
        signUpForm.role,
        signUpForm.department
      );
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created successfully! Please check your email to verify your account.');
        setIsSignIn(true);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const hospitalName = settings?.clinic_name || 'Your Hospital Name';
  const hasLogo = settings?.clinic_logo;

  return (
    <AnimatedBackground variant="login">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Glassmorphism login card */}
          <Card className="glass-card border-white/20 shadow-2xl animate-fade-in-up">
            {/* Hospital branding */}
            <CardHeader className="text-center pb-4">
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center glow-on-hover">
                  {hasLogo ? (
                    <img 
                      src={settings.clinic_logo} 
                      alt={hospitalName}
                      className="w-12 h-12 object-contain rounded-full"
                    />
                  ) : (
                    <Hospital className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-black mb-1">
                    {hospitalName}
                  </CardTitle>
                  <CardDescription className="text-black text-sm font-bold">
                    Smart Queue Management System
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Tabs value={isSignIn ? 'signin' : 'signup'} onValueChange={(value) => setIsSignIn(value === 'signin')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm">
                  <TabsTrigger value="signin" className="text-black font-bold data-[state=active]:bg-white/20 data-[state=active]:text-black data-[state=active]:font-bold">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-black font-bold data-[state=active]:bg-white/20 data-[state=active]:text-black data-[state=active]:font-bold">
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                {/* Sign In Form */}
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                     <div className="space-y-2">
                      <Label htmlFor="email" className="text-black font-bold">Email</Label>
                      <div className="relative auth-input">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60 w-4 h-4 z-10" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={signInForm.email}
                          onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                          className="pl-10 auth-input-field text-black font-bold placeholder:text-black/80 focus:outline-none focus:ring-0"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-black font-bold">Password</Label>
                      <div className="relative auth-input">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60 w-4 h-4 z-10" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={signInForm.password}
                          onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                          className="pl-10 pr-10 auth-input-field text-black font-bold placeholder:text-black/80 focus:outline-none focus:ring-0"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/60 hover:text-black z-10"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full auth-button-gradient py-3 text-lg font-bold text-white shadow-lg transition-all duration-300 disabled:opacity-50"
                      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>

                    {/* Demo credentials */}
                    <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-xs text-black/90 font-bold mb-2">Demo Credentials:</p>
                      <div className="grid grid-cols-1 gap-1 text-xs text-black/80 font-medium">
                        <span>Admin: admin@hospital.com / 123456</span>
                        <span>User: user@queue.com / 123456</span>
                      </div>
                    </div>
                  </form>
                </TabsContent>

                {/* Sign Up Form */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-black font-bold">Full Name</Label>
                        <div className="relative auth-input">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60 w-4 h-4 z-10" />
                          <Input
                            id="fullName"
                            type="text"
                            placeholder="Enter your full name"
                            value={signUpForm.fullName}
                            onChange={(e) => setSignUpForm(prev => ({ ...prev, fullName: e.target.value }))}
                            className="pl-10 auth-input-field text-black font-bold placeholder:text-black/80 focus:outline-none focus:ring-0"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-black font-bold">Email</Label>
                        <div className="relative auth-input">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60 w-4 h-4 z-10" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={signUpForm.email}
                            onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
                            className="pl-10 auth-input-field text-black font-bold placeholder:text-black/80 focus:outline-none focus:ring-0"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-black font-bold">Password</Label>
                        <div className="relative auth-input">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60 w-4 h-4 z-10" />
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={signUpForm.password}
                            onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                            className="pl-10 pr-10 auth-input-field text-black font-bold placeholder:text-black/80 focus:outline-none focus:ring-0"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/60 hover:text-black z-10"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-black font-bold">Role</Label>
                        <Select value={signUpForm.role} onValueChange={(value) => setSignUpForm(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger className="auth-input-field text-black font-bold">
                            <Shield className="w-4 h-4 mr-2 text-black/60" />
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="doctor">Doctor</SelectItem>
                            <SelectItem value="nurse">Nurse</SelectItem>
                            <SelectItem value="receptionist">Receptionist</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-black font-bold">Department</Label>
                        <Select value={signUpForm.department} onValueChange={(value) => setSignUpForm(prev => ({ ...prev, department: value }))}>
                          <SelectTrigger className="auth-input-field text-black font-bold">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Consultation">Consultation</SelectItem>
                            <SelectItem value="Lab">Laboratory</SelectItem>
                            <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                            <SelectItem value="X-ray">X-ray</SelectItem>
                            <SelectItem value="Billing">Billing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full auth-button-gradient py-3 text-lg font-bold text-white shadow-lg transition-all duration-300 disabled:opacity-50"
                      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Tagline */}
              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-black text-sm font-bold">
                  Smart Queue Management for Modern Hospitals
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AnimatedBackground>
  );
}