// src/components/RoleRedirect.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

export default function RoleRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser(); // ✅ fixed destructuring
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: meta } = await supabase
        .from('users_meta')
        .select('role')
        .eq('id', user.id)
        .single();

      switch (meta?.role) {
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
          navigate('/login');
      }
    };

    checkRole();
  }, [navigate]);

  return <div>Loading...</div>;
}