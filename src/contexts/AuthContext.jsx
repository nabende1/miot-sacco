// src/contexts/AuthContext.jsx - UPDATED
import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const fetchUserAndRole = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error fetching user:', userError);
          setLoading(false);
          return;
        }
        
        setUser(user);
        
        if (user) {
          const { data: meta, error: metaError } = await supabase
            .from('users_meta')
            .select('role, is_super_admin')
            .eq('id', user.id)
            .single();
          
          if (metaError && metaError.code !== 'PGRST116') {
            console.error('Error fetching user meta:', metaError);
          }
          
          setUserRole(meta?.role || null);
          setIsSuperAdmin(meta?.role === 'SUPER_ADMIN' || meta?.is_super_admin === true);
        }
      } catch (error) {
        console.error('Error in fetchUserAndRole:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        const { data: meta } = await supabase
          .from('users_meta')
          .select('role, is_super_admin')
          .eq('id', currentUser.id)
          .single();
        
        setUserRole(meta?.role || null);
        setIsSuperAdmin(meta?.role === 'SUPER_ADMIN' || meta?.is_super_admin === true);
      } else {
        setUserRole(null);
        setIsSuperAdmin(false);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    userRole,
    isSuperAdmin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Enhanced useAuth with better error handling
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    // Return default values instead of throwing error
    console.warn('useAuth used outside AuthProvider, returning default values');
    return {
      user: null,
      userRole: null,
      isSuperAdmin: false,
      loading: true
    };
  }
  
  return context;
};