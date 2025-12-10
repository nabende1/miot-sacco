// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import supabase from '../supabaseClient';
import '../styles/pages/Auth/Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login for:', email);
      
      // 1. Authenticate user
      const { data: { user, session }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Login failed: ${authError.message}`);
      }

      if (!user) {
        throw new Error('Login failed: No user data returned');
      }

      console.log('User authenticated:', user.id);
      
      // 2. Store session immediately
      localStorage.setItem('supabase.auth.token', JSON.stringify(session));
      localStorage.setItem('user_id', user.id);
      localStorage.setItem('user_email', user.email || '');

      // 3. Get user role from users_meta
      let userRole = null; // Initial default is null
      let assignedBranch = null;
      let fullName = '';

      try {
        // Fetch user metadata (role, branch, name)
        const { data: metaData, error: metaError } = await supabase
          .from('users_meta')
          .select('role, assigned_branch, full_name')
          .eq('id', user.id)
          .single();

        // FIX: If metaData is not found or there's an error, prevent login (removed auto-FACILITATOR creation)
        if (metaError || !metaData) {
          console.warn('User metadata not found for user ID:', user.id, metaError);
          // Throw a specific error to ensure user cannot proceed without a role
          throw new Error('User role not assigned. Please contact your administrator.');
        } else {
          // User metadata found, use the actual role
          userRole = metaData.role; 
          assignedBranch = metaData.assigned_branch;
          fullName = metaData.full_name || user.email?.split('@')[0] || 'User';
          console.log('User role found:', userRole);
        }
      } catch (metaErr) {
        // Re-throw the error to be handled by the outer catch block
        throw metaErr; 
      }

      // Check for a valid role before proceeding
      if (!userRole) {
        throw new Error('Critical: User role is missing after successful lookup.');
      }

      // 4. Store user info for frontend use
      localStorage.setItem('user_role', userRole);
      localStorage.setItem('user_name', fullName); // Store the full name for the dashboard
      if (assignedBranch) {
        localStorage.setItem('assigned_branch', assignedBranch);
      }

      // 5. Redirect based on role
      console.log('Redirecting user with role:', userRole);
      
      const redirectPaths = {
        'SUPER_ADMIN': '/super-admin',
        'GENERAL_MANAGER': '/general-manager-dashboard',
        'BRANCH_MANAGER': '/branch-dashboard',
        'FACILITATOR': '/facilitator-dashboard',
        'MEMBER': '/member-dashboard'
      };

      const redirectTo = redirectPaths[userRole] || '/dashboard'; 
      
      // Check if user was trying to access a specific page
      if (from !== '/dashboard') {
        navigate(from, { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }

    } catch (err) {
      console.error('Login error:', err);
      
      // Handle specific error cases
      if (err.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Please confirm your email before logging in.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.'); 
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    const demoCredentials = {
      'SUPER_ADMIN': { email: 'admin@miotsacco.com', password: 'Admin123!' },
      'GENERAL_MANAGER': { email: 'gm@miotsacco.com', password: 'Gm123!' },
      'BRANCH_MANAGER': { email: 'bm@miotsacco.com', password: 'Bm123!' },
      'FACILITATOR': { email: 'facilitator@miotsacco.com', password: 'Facilitator123!' },
    };

    const creds = demoCredentials[role];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.password);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="logo">
            <div className="logo-icon">🏦</div>
            <h1>MIOT SACCO</h1>
          </div>
          <h2>Login to Your Account</h2>
          <p className="auth-subtitle">Enter your credentials to access the SACCO system</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="auth-form">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <Mail size={18} />
              <span>Email Address</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@miotsacco.com"
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              <span>Password</span>
            </label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="form-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Demo Login Buttons */}
          <div className="demo-login-section">
            <p className="demo-label">Quick Demo:</p>
            <div className="demo-buttons">
              <button
                type="button"
                className="demo-btn admin"
                onClick={() => handleDemoLogin('SUPER_ADMIN')}
                disabled={loading}
              >
                Super Admin
              </button>
              <button
                type="button"
                className="demo-btn gm"
                onClick={() => handleDemoLogin('GENERAL_MANAGER')}
                disabled={loading}
              >
                General Manager
              </button>
              <button
                type="button"
                className="demo-btn bm"
                onClick={() => handleDemoLogin('BRANCH_MANAGER')}
                disabled={loading}
              >
                Branch Manager
              </button>
              <button
                type="button"
                className="demo-btn facilitator"
                onClick={() => handleDemoLogin('FACILITATOR')}
                disabled={loading}
              >
                Facilitator
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <p className="text-center">
            Don't have an account?{' '}
            <a href="#" className="text-link">
              Contact administrator
            </a>
          </p>
          <div className="version-info">
            <span>v1.0.0 • MIOT SACCO System</span>
          </div>
        </div>
      </div>
    </div>
  );
}