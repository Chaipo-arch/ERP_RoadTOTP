import { useState, useEffect } from 'react';
import { rhApi } from '../services/api';
import { Plus, Search, Phone, Mail, Edit, Trash2, X, Briefcase, Calendar, Loader, User, Users } from 'lucide-react';
import '../index.css';

const statusOptions = ['Tous', 'Actif', 'Congé', 'Formation', 'Inactif'];

function Employes() {
    const [employes, setEmployes] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous');
    const [showModal, setShowModal] = useState(false);
    const [editingEmploye, setEditingEmploye] = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);

    const initialFormState = {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        job_title: '',
        hire_date: '',
        hourly_salary: '',
        status: 'Actif',
        manager_id: '',
        user_id: '',
        department: '',
        contrat_id: '1',
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await rhApi.getAllEmployes();
            const data = res.data.data || res.data || [];
            setEmployes(data);
            setManagers(data);
        } catch (error) {
            console.error("Erreur chargement employés:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableUsers = async () => {
        try {
            const res = await rhApi.getAvailableUsers();
            const data = res.data.data || res.data || [];
            setAvailableUsers(data);
        } catch (error) {
            console.error("Erreur chargement utilisateurs:", error);
        }
    };

    const getStatusBadge = (status) => ({
        'Actif': 'badge-success',
        'Congé': 'badge-warning',
        'Formation': 'badge-info',
        'Inactif': 'badge-danger'
    }[status] || 'badge-primary');

    const getInitials = (f, l) => `${(f || '').charAt(0)}${(l || '').charAt(0)}`.toUpperCase();

    const filteredEmployes = employes.filter(e => {
        const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
            (e.job_title || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'Tous' || e.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                hourly_salary: parseFloat(formData.hourly_salary) || 0,
                manager_id: formData.manager_id ? parseInt(formData.manager_id) : null,
                user_id: formData.user_id ? parseInt(formData.user_id) : null
            };

            if (editingEmploye) {
                await rhApi.updateEmploye(editingEmploye.id, payload);
                alert('Employé modifié avec succès');
            } else {
                await rhApi.createEmploye(payload);
                alert('Employé créé avec succès');
            }

            closeModal();
            fetchData();
        } catch (error) {
            console.error("Erreur sauvegarde:", error);
            alert(error.response?.data?.message || "Erreur lors de l'enregistrement");
        }
    };

    const openModal = (employe = null) => {
        setEditingEmploye(employe);
        loadAvailableUsers();
        rhApi.getEmployeById(employe.id).then((res) => {
            const data = res.data.data || res.data || [];
            setFormData(data);
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEmploye(null);
        setFormData(initialFormState);
    };

    const deleteEmploye = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
            try {
                await rhApi.deleteEmploye(id);
                fetchData();
            } catch (error) {
                console.error("Erreur suppression:", error);
                alert("Erreur lors de la suppression");
            }
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                <Loader className="spinner" size={48} style={{ color: 'var(--primary-400)' }} />
            </div>
        );
    }

    const actifs = employes.filter(e => e.status === 'Actif').length;
    const enConge = employes.filter(e => e.status === 'Congé').length;
    const avecManager = employes.filter(e => e.manager_id).length;

    return (
        <div>
            {/* Header Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="search-box" style={{ width: '300px' }}>
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Rechercher un employé..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-input form-select"
                        style={{ width: '180px' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        {statusOptions.map(s => (
                            <option key={s} value={s}>{s === 'Tous' ? 'Tous les statuts' : s}</option>
                        ))}
                    </select>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    Nouvel Employé
                </button>
            </div>

            {/* Statistiques */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary-400)' }}>{employes.length}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Employés</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success-500)' }}>{actifs}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Actifs</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--warning-500)' }}>{enConge}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>En Congé</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--info-500)' }}>{avecManager}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Avec Manager</div>
                </div>
            </div>

            {/* Liste des employés */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                {filteredEmployes.map((emp) => (
                    <div key={emp.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        {/* Card Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))',
                            padding: '20px',
                            borderBottom: '1px solid var(--border-color)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div className="avatar" style={{
                                        width: '48px',
                                        height: '48px',
                                        fontSize: '16px',
                                        flexShrink: 0
                                    }}>
                                        {getInitials(emp.first_name, emp.last_name)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                            {emp.first_name} {emp.last_name}
                                        </h3>
                                        <div style={{ fontSize: '13px', color: 'var(--primary-400)', fontWeight: 500, marginBottom: '6px' }}>
                                            {emp.job_title}
                                        </div>
                                        <span className={`badge ${getStatusBadge(emp.status)}`}>{emp.status}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openModal(emp)}>
                                        <Edit size={16} />
                                    </button>
                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteEmploye(emp.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <Mail size={15} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.email}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <Phone size={15} />
                                    <span>{emp.phone}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <Briefcase size={15} />
                                    <span>{emp.department || emp.job_title}</span>
                                </div>
                                {emp.hire_date && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        <Calendar size={15} />
                                        <span>Embauché le {new Date(emp.hire_date).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Manager info */}
                            {emp.manager && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '12px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--border-radius-sm)',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <User size={14} style={{ color: 'var(--info-500)' }} />
                                    <span style={{ color: 'var(--text-muted)' }}>Manager :</span>
                                    <span style={{ fontWeight: 500 }}>
                                        {emp.manager.full_name || `${emp.manager.first_name} ${emp.manager.last_name}`}
                                    </span>
                                </div>
                            )}

                            {/* Salaire */}
                            {emp.hourly_salary && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '12px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--border-radius-sm)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '13px'
                                }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Taux horaire</span>
                                    <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>
                                        {parseFloat(emp.hourly_salary).toFixed(2)}€/h
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredEmployes.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Users size={80} />
                    </div>
                    <h3 className="empty-state-title">Aucun employé trouvé</h3>
                    <p className="empty-state-text">
                        Modifiez vos critères de recherche ou ajoutez un nouvel employé.
                    </p>
                </div>
            )}

            {/* Modal */}
            <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={closeModal}>
                <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">
                            {editingEmploye ? 'Modifier un employé' : 'Nouvel employé'}
                        </h2>
                        <button className="modal-close" onClick={closeModal}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {/* Section Identité */}
                            <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary-400)' }}>
                                Identité
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Prénom</label>
                                    <input
                                        className="form-input"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        placeholder="Prénom de l'employé"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nom</label>
                                    <input
                                        className="form-input"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        placeholder="Nom de l'employé"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Section Contact */}
                            <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary-400)' }}>
                                Contact
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="email@exemple.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Téléphone</label>
                                    <input
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="06 12 34 56 78"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Section Professionnelle */}
                            <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary-400)' }}>
                                Informations professionnelles
                            </div>
                            <div className="form-group">
                                <label className="form-label">Département</label>
                                <input
                                    className="form-input"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="Ex: Travaux publics"
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Poste</label>
                                    <input
                                        className="form-input"
                                        value={formData.job_title}
                                        onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                        placeholder="Ex: Chef de chantier"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Utilisateur lié</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.user_id}
                                        onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                    >
                                        <option value="">Aucun compte lié</option>
                                        {availableUsers.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Manager direct</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.manager_id}
                                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                                >
                                    <option value="">Aucun manager</option>
                                    {managers
                                        .filter((m) => !editingEmploye || m.id !== editingEmploye.id)
                                        .map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.first_name} {m.last_name} ({m.job_title})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Section Administration */}
                            <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary-400)' }}>
                                Administration
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Date d'embauche</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.hire_date}
                                        onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Statut</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Actif">Actif</option>
                                        <option value="Congé">Congé</option>
                                        <option value="Formation">Formation</option>
                                        <option value="Inactif">Inactif</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Type de contrat</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.contrat_id}
                                        onChange={(e) => setFormData({ ...formData, contrat_id: e.target.value })}
                                        required
                                    >
                                        <option value="1">CDI</option>
                                        <option value="2">CDD</option>
                                        <option value="3">Intérim</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Taux horaire (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        value={formData.hourly_salary}
                                        onChange={(e) => setFormData({ ...formData, hourly_salary: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                Annuler
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editingEmploye ? 'Enregistrer' : 'Créer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Employes;
