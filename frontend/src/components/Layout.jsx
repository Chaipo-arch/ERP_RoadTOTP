import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    HardHat,
    Users,
    Truck,
    Building,
    CalendarDays,
    Settings,
    Bell,
    Search,
    Menu,
    ChevronRight,
    LogOut,
    FileText,
    UserPlus,
    Shield,
    Bot,
    Calendar,
    CheckSquare,
    UsersRound,
    Network,
    Map,
    FileSignature,
    Scale
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, permission: null },
    { name: 'Chantiers', href: '/chantiers', icon: HardHat, permission: 'view_chantiers' },
    { name: 'Employés', href: '/employes', icon: Users, permission: 'view_employes' },
    { name: 'Matériels', href: '/materiels', icon: Truck, permission: 'view_materiels' },
    { name: 'Cartographie', href: '/cartographie', icon: Map, permission: null },
    { name: 'Clients', href: '/clients', icon: Building, permission: 'view_clients' },
    { name: 'Planning', href: '/planning', icon: CalendarDays, permission: 'view_planning' },
];

const secondaryNav = [
    { name: 'Assistant IA', href: '/chat', icon: Bot, permission: null },
    { name: 'Documents', href: '/documents', icon: FileText, permission: 'view_documents' },
    { name: 'Paramètres', href: '/parametres', icon: Settings, permission: null },
];

const rhNav = [
    { name: 'Mes Congés', href: '/rh/conges', icon: Calendar, permission: null },
    { name: 'Validation', href: '/rh/validation-conges', icon: CheckSquare, permission: null },
    { name: 'Équipes', href: '/rh/equipes', icon: UsersRound, permission: 'view_teams' },
    { name: 'Organigramme', href: '/rh/organigramme', icon: Network, permission: null },
];

const legalNav = [
    { name: 'Modèles de contrat', href: '/contrats/modeles', icon: FileSignature, permission: null },
];

function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, logout, hasPermission, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getCurrentPageTitle = () => {
        const allNav = [...navigation, ...secondaryNav, ...rhNav, ...legalNav];
        const current = allNav.find(item => item.href === location.pathname);
        return current?.name || 'ERP RoadToTP';
    };

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">TP</div>
                        <div>
                            <div className="sidebar-logo-text">RoadToTP</div>
                            <div className="sidebar-logo-subtitle">{user?.company?.name || 'ERP Travaux Publics'}</div>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">Navigation</div>
                        {navigation.map((item) => {
                            if (item.permission && !hasPermission(item.permission)) return null;
                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <item.icon className="nav-item-icon" size={20} />
                                    <span>{item.name}</span>
                                    <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                </NavLink>
                            );
                        })}
                    </div>

                    <div className="nav-section">
                        <div className="nav-section-title">Ressources Humaines</div>
                        {rhNav.map((item) => {
                            if (item.permission && !hasPermission(item.permission)) return null;
                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <item.icon className="nav-item-icon" size={20} />
                                    <span>{item.name}</span>
                                </NavLink>
                            );
                        })}
                    </div>

                    <div className="nav-section">
                        <div className="nav-section-title">Légal &amp; Contrats</div>
                        {legalNav.map((item) => {
                            if (item.permission && !hasPermission(item.permission)) return null;
                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <item.icon className="nav-item-icon" size={20} />
                                    <span>{item.name}</span>
                                </NavLink>
                            );
                        })}
                    </div>

                    <div className="nav-section">
                        <div className="nav-section-title">Gestion</div>
                        {secondaryNav.map((item) => {
                            if (item.permission && !hasPermission(item.permission)) return null;
                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <item.icon className="nav-item-icon" size={20} />
                                    <span>{item.name}</span>
                                </NavLink>
                            );
                        })}

                        {/* Admin Section */}
                        {isAdmin() && (
                            <>
                                <div className="nav-section-title mt-4">Administration</div>
                                <NavLink
                                    to="/admin/create-user"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <UserPlus className="nav-item-icon" size={20} />
                                    <span>Créer Utilisateur</span>
                                </NavLink>
                                <NavLink
                                    to="/admin/roles"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <Shield className="nav-item-icon" size={20} />
                                    <span>Rôles & Permissions</span>
                                </NavLink>
                            </>
                        )}
                    </div>
                </nav>

                {/* User section at bottom */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: 'auto'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div className="avatar">{user?.name?.substring(0, 2).toUpperCase() || 'AD'}</div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Utilisateur'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</div>
                        </div>
                        <button className="btn-ghost btn-icon" onClick={handleLogout} title="Déconnexion">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="main-content">
                <header className="main-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ display: 'none' }}
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="header-title">{getCurrentPageTitle()}</h1>
                    </div>

                    <div className="header-actions">
                        <div className="search-box">
                            <Search className="search-icon" size={18} />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Rechercher..."
                            />
                        </div>

                        <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }}>
                            <Bell size={20} />
                            <span className="notification-dot"></span>
                        </button>

                        <div className="avatar">AD</div>
                    </div>
                </header>

                <div className="main-body animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default Layout;
