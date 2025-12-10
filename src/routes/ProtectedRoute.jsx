import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import supabase from '../supabaseClient';

export default function ProtectedRoute() {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState('User'); // State for user name

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error || !session) {
                    setAuthenticated(false);
                    setUserRole(null);
                    setUserName('User');
                } else {
                    setAuthenticated(true);
                    
                    // FIX: Load role and name from localStorage immediately
                    const storedRole = localStorage.getItem('user_role');
                    const storedName = localStorage.getItem('user_name') || 'User';
                    
                    setUserRole(storedRole);
                    setUserName(storedName);
                }
            } catch (error) {
                console.error('Auth check error:', error);
                setAuthenticated(false);
                setUserRole(null);
                setUserName('User');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setAuthenticated(!!session);
                if (session) {
                    setUserRole(localStorage.getItem('user_role'));
                    setUserName(localStorage.getItem('user_name') || 'User');
                } else {
                    setUserRole(null);
                    setUserName('User');
                }
                // Note: We don't set loading to false here, as the initial checkAuth handles the first render.
                // setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // Redirect Map (Used for routing unassigned paths)
    const redirectPaths = {
        'SUPER_ADMIN': '/super-admin',
        'GENERAL_MANAGER': '/general-manager-dashboard',
        'BRANCH_MANAGER': '/branch-dashboard',
        'FACILITATOR': '/facilitator-dashboard',
        'MEMBER': '/member-dashboard'
    };
    
    // Determine the user-friendly role name for the loading screen
    const displayRole = userRole ? userRole.replace('_', ' ').toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'System';

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{
                        border: '3px solid #f3f3f3',
                        borderTop: '3px solid #3498db',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }} />
                    {/* FIX: Show the determined role in the loading message */}
                    <p>Checking {displayRole} permissions...</p>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // Centralized Redirect for the Root Protected Path or unknown path
    // If the user is authenticated and hits an undefined path, redirect them to their specific dashboard.
    const currentPath = window.location.pathname;
    const isDashboardPath = Object.values(redirectPaths).some(path => currentPath.startsWith(path));

    // If authenticated, and we have a role, but the current path is NOT their dashboard or a sub-route
    if (userRole && !isDashboardPath) {
        const redirectTo = redirectPaths[userRole] || '/dashboard'; 
        
        // Only redirect if the current path isn't a recognized route
        if (currentPath === '/' || currentPath === '/dashboard' || !redirectPaths[userRole]) {
             return <Navigate to={redirectTo} replace />;
        }
    }

    return <Outlet />;
}