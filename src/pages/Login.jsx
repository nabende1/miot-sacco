// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase, { supabaseAdmin } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Authenticate user
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(`Login failed: ${authError.message}`);
        setLoading(false);
        return;
      }

      if (!user) {
        setError('Login failed: No user data returned');
        setLoading(false);
        return;
      }

      console.log('User authenticated:', user.id);

      let userRole = 'FACILITATOR'; // Default role
      let assignedBranch = null;

      // 2. Try to get role using admin client first (bypasses RLS)
      if (supabaseAdmin) {
        try {
          const { data: metaData, error: metaError } = await supabaseAdmin
            .from('users_meta')
            .select('role, assigned_branch')
            .eq('id', user.id)
            .single();

          if (!metaError && metaData) {
            userRole = metaData.role;
            assignedBranch = metaData.assigned_branch;
            console.log('Role fetched via admin:', userRole);
          }
        } catch (adminError) {
          console.warn('Admin fetch failed, trying regular client:', adminError);
        }
      }

      // 3. If admin client failed or not available, try regular client
      if (userRole === 'FACILITATOR') {
        try {
          const { data: metaData, error: metaError } = await supabase
            .from('users_meta')
            .select('role, assigned_branch')
            .eq('id', user.id)
            .single();

          if (!metaError && metaData) {
            userRole = metaData.role;
            assignedBranch = metaData.assigned_branch;
            console.log('Role fetched via regular client:', userRole);
          } else if (metaError && metaError.code === 'PGRST116') {
            // User doesn't exist in users_meta - create default entry
            console.log('Creating default user meta entry');
            
            // Try to insert using admin client if available
            if (supabaseAdmin) {
              const { error: insertError } = await supabaseAdmin
                .from('users_meta')
                .insert({
                  id: user.id,
                  role: 'FACILITATOR',
                  assigned_branch: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

              if (!insertError) {
                console.log('Default user meta created via admin');
              }
            }
          }
        } catch (regularError) {
          console.error('Regular client fetch failed:', regularError);
        }
      }

      // 4. Store user info for frontend use
      localStorage.setItem('user_id', user.id);
      localStorage.setItem('user_email', user.email || '');
      localStorage.setItem('user_role', userRole);
      
      if (assignedBranch) {
        localStorage.setItem('assigned_branch', assignedBranch);
      }

      // 5. Redirect based on role
      console.log('Redirecting with role:', userRole);
      
      switch (userRole) {
        case 'SUPER_ADMIN':
          navigate('/super-admin');
          break;
        case 'GENERAL_MANAGER':
          navigate('/gm-dashboard');
          break;
        case 'BRANCH_MANAGER':
          navigate('/branch-dashboard');
          break;
        case 'FACILITATOR':
          navigate('/facilitator-dashboard');
          break;
        default:
          // Unknown role - go to default dashboard
          navigate('/dashboard');
      }

    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h2>MIOT SACCO Login</h2>
      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '10px',
          padding: '10px',
          backgroundColor: '#ffe6e6',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}