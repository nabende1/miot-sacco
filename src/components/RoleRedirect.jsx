// src/components/RoleRedirect.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

export default function RoleRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectUser = async () => {
      try {
        // Get current user
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          navigate('/login');
          return;
        }

        // Get user role from localStorage or fetch from API
        let userRole = localStorage.getItem('user_role') || 'FACILITATOR';
        
        // If no role in localStorage, fetch it
        if (userRole === 'FACILITATOR') {
          const { data: metaData } = await supabase
            .from('users_meta')
            .select('role')
            .eq('id', user.id)
            .single();
          
          userRole = metaData?.role || 'FACILITATOR';
          localStorage.setItem('user_role', userRole);
        }

        // Redirect based on role
        const redirectPaths = {
          'SUPER_ADMIN': '/super-admin',
          'GENERAL_MANAGER': '/general-manager-dashboard',
          'BRANCH_MANAGER': '/branch-dashboard',
          'FACILITATOR': '/facilitator-dashboard',
          'MEMBER': '/member-dashboard'
        };

        const redirectTo = redirectPaths[userRole] || '/login';
        navigate(redirectTo, { replace: true });

      } catch (error) {
        console.error('Error in RoleRedirect:', error);
        navigate('/login', { replace: true });
      }
    };

    redirectUser();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}