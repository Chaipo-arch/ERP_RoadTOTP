import { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const response = await authApi.getUser();
                setUser(response.data);
            } catch (error) {
                // Pas connecté ou session expirée
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        const response = await authApi.login({ email, password });
        const { user: userData } = response.data;

        setUser(userData);
        return userData;
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout error', error);
            // Même si le serveur crash, on veut que l'UI réagisse
        } finally {
            setUser(null);
            // On force un nettoyage local pour éviter que les vieux cookies 
            // ne polluent la prochaine tentative de login
            window.location.href = '/login';
        }
    };

    const hasRole = (role) => {
        return user?.role === role || user?.userRole?.name === role;
    };

    const isAdmin = () => hasRole('admin') || hasRole('Admin');

    const hasPermission = (permissionSlug) => {
        if (isAdmin()) return true;
        return user?.userRole?.permissions?.some(p => p.slug === permissionSlug) || false;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                logout,
                isAdmin,
                hasRole,
                hasPermission,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
