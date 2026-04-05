import {
    HardHat,
    Users,
    Truck,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    CalendarDays,
    Clock,
    MapPin,
    Euro
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from 'recharts';

// Mock data for charts
const revenueData = [
    { month: 'Jan', revenue: 125000, expenses: 85000 },
    { month: 'Fév', revenue: 145000, expenses: 92000 },
    { month: 'Mar', revenue: 178000, expenses: 105000 },
    { month: 'Avr', revenue: 165000, expenses: 98000 },
    { month: 'Mai', revenue: 198000, expenses: 112000 },
    { month: 'Juin', revenue: 220000, expenses: 125000 },
];

const chantiersStatus = [
    { name: 'En cours', value: 8, color: '#22c55e' },
    { name: 'En attente', value: 3, color: '#eab308' },
    { name: 'Terminés', value: 12, color: '#3b82f6' },
    { name: 'Planifiés', value: 5, color: '#f59e0b' },
];

const recentChantiers = [
    {
        id: 1,
        name: 'Rénovation Route D47',
        client: 'Mairie de Lyon',
        status: 'En cours',
        progress: 75,
        budget: 450000,
        location: 'Lyon (69)'
    },
    {
        id: 2,
        name: 'Terrassement Zone Industrielle',
        client: 'SCI Batinord',
        status: 'En cours',
        progress: 45,
        budget: 280000,
        location: 'Villeurbanne (69)'
    },
    {
        id: 3,
        name: 'Voirie Lotissement Les Pins',
        client: 'Bouygues Immobilier',
        status: 'En attente',
        progress: 0,
        budget: 520000,
        location: 'Caluire (69)'
    },
    {
        id: 4,
        name: 'Assainissement Quartier Sud',
        client: 'Métropole de Lyon',
        status: 'En cours',
        progress: 90,
        budget: 380000,
        location: 'Vénissieux (69)'
    }
];

const upcomingTasks = [
    { id: 1, title: 'Livraison béton - Chantier D47', time: '08:00', type: 'livraison' },
    { id: 2, title: 'Réunion équipe terrassement', time: '10:30', type: 'reunion' },
    { id: 3, title: 'Inspection chantier Vénissieux', time: '14:00', type: 'inspection' },
    { id: 4, title: 'Maintenance grue GT-45', time: '16:00', type: 'maintenance' },
];

function Dashboard() {
    const stats = [
        {
            label: 'Chantiers Actifs',
            value: '8',
            change: '+2 ce mois',
            changeType: 'positive',
            icon: HardHat,
            iconClass: 'primary'
        },
        {
            label: 'Employés Actifs',
            value: '47',
            change: '+3 recrutés',
            changeType: 'positive',
            icon: Users,
            iconClass: 'success'
        },
        {
            label: 'Matériels en Service',
            value: '23',
            change: '2 en maintenance',
            changeType: 'warning',
            icon: Truck,
            iconClass: 'info'
        },
        {
            label: 'CA du Mois',
            value: '220K€',
            change: '+12.5%',
            changeType: 'positive',
            icon: TrendingUp,
            iconClass: 'warning'
        }
    ];

    const getStatusBadge = (status) => {
        const statusMap = {
            'En cours': 'badge-success',
            'En attente': 'badge-warning',
            'Terminé': 'badge-info',
            'En retard': 'badge-danger'
        };
        return statusMap[status] || 'badge-primary';
    };

    return (
        <div>
            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className={`stat-icon ${stat.iconClass}`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">{stat.label}</div>
                            <div className="stat-value">{stat.value}</div>
                            <div className={`stat-change ${stat.changeType}`}>
                                {stat.changeType === 'positive' ? (
                                    <ArrowUpRight size={14} />
                                ) : stat.changeType === 'negative' ? (
                                    <ArrowDownRight size={14} />
                                ) : null}
                                {stat.change}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {/* Revenue Chart */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Chiffre d'affaires vs Dépenses</h3>
                            <p className="card-subtitle">Évolution sur les 6 derniers mois</p>
                        </div>
                        <button className="btn btn-secondary btn-sm">
                            <CalendarDays size={16} />
                            Cette année
                        </button>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="month" stroke="#64748b" />
                                <YAxis stroke="#64748b" tickFormatter={(value) => `${value / 1000}K`} />
                                <Tooltip
                                    contentStyle={{
                                        background: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value) => [`${value.toLocaleString()}€`, '']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    name="Revenus"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expenses"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorExpenses)"
                                    name="Dépenses"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chantiers Status Pie Chart */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Répartition Chantiers</h3>
                            <p className="card-subtitle">Par statut</p>
                        </div>
                    </div>
                    <div className="chart-container" style={{ height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chantiersStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {chantiersStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                        {chantiersStatus.map((item, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '3px',
                                    background: item.color
                                }} />
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    {item.name}: {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Chantiers and Tasks */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Recent Chantiers Table */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Chantiers Récents</h3>
                            <p className="card-subtitle">Dernières activités</p>
                        </div>
                        <button className="btn btn-primary btn-sm">
                            Voir tout
                        </button>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Chantier</th>
                                    <th>Client</th>
                                    <th>Statut</th>
                                    <th>Progression</th>
                                    <th>Budget</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentChantiers.map((chantier) => (
                                    <tr key={chantier.id}>
                                        <td>
                                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                                {chantier.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                <MapPin size={12} />
                                                {chantier.location}
                                            </div>
                                        </td>
                                        <td>{chantier.client}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(chantier.status)}`}>
                                                {chantier.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className="progress-bar" style={{ width: '80px' }}>
                                                    <div className="progress-fill" style={{ width: `${chantier.progress}%` }} />
                                                </div>
                                                <span style={{ fontSize: '13px', fontWeight: 500 }}>{chantier.progress}%</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Euro size={14} />
                                                {chantier.budget.toLocaleString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Upcoming Tasks */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Aujourd'hui</h3>
                            <p className="card-subtitle">Tâches planifiées</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {upcomingTasks.map((task) => (
                            <div
                                key={task.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '12px',
                                    padding: '12px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--border-radius-md)',
                                    transition: 'all var(--transition-fast)',
                                    cursor: 'pointer'
                                }}
                                className="task-item"
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: 'var(--border-radius-sm)',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    color: 'var(--primary-400)',
                                    flexShrink: 0
                                }}>
                                    <Clock size={18} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>
                                        {task.title}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        {task.time}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
