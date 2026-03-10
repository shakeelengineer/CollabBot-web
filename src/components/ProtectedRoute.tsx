import React from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const [loading, setLoading] = React.useState(true);
    const [authenticated, setAuthenticated] = React.useState(false);

    React.useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setAuthenticated(!!session);
            setLoading(false);
        };

        checkAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setAuthenticated(!!session);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
