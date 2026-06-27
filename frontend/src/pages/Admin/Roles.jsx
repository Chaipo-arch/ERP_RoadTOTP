import React, { useState, useEffect } from 'react';
import { rolesApi, permissionsApi } from '../../services/api';
import { Shield, Users, Plus, Edit, Trash2, Check, X, Search, Lock } from 'lucide-react';

export default function Roles() {
    const [activeTab, setActiveTab] = useState('roles');
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [groupedPermissions, setGroupedPermissions] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({ name: '', permissions: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [justToggled, setJustToggled] = useState(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [r, p, u] = await Promise.all([
                rolesApi.getAll(),
                permissionsApi.getAll(),
                rolesApi.getUsers()
            ]);
            setRoles(r.data);
            setGroupedPermissions(p.data);
            setUsers(u.data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingRole(null);
        setFormData({ name: '', permissions: [] });
    };

    const handleTogglePermission = (id) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(id)
                ? prev.permissions.filter(p => p !== id)
                : [...prev.permissions, id]
        }));
        setJustToggled(id);
        setTimeout(() => setJustToggled(null), 350);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            editingRole
                ? await rolesApi.update(editingRole.id, formData)
                : await rolesApi.create(formData);
            handleCloseModal();
            fetchData();
        } catch (e) { alert("Erreur lors de l'enregistrement"); }
    };

    const selectedCount = formData.permissions.length;

    if (isLoading) return <div className="loading-state">Chargement des habilitations...</div>;

    return (
        <div className="roles-page">
            <header className="page-header">
                <div className="header-info">
                    <h1>Accès & Habilitations</h1>
                    <p>Gérez les droits d'accès et les rôles de vos collaborateurs.</p>
                </div>
                <div className="header-actions">
                    <div className="tab-switcher">
                        <button className={activeTab === 'roles' ? 'active' : ''} onClick={() => setActiveTab('roles')}>
                            <Shield size={16} /> Rôles
                        </button>
                        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
                            <Users size={16} /> Utilisateurs
                        </button>
                    </div>
                    {activeTab === 'roles' && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={18} /> Nouveau Rôle
                        </button>
                    )}
                </div>
            </header>

            {activeTab === 'roles' ? (
                <div className="roles-grid">
                    {roles.map(role => (
                        <div key={role.id} className="card role-card">
                            <div className="role-card-header">
                                <div className="role-icon"><Shield size={20} /></div>
                                <div className="role-actions">
                                    <button
                                        onClick={() => {
                                            setEditingRole(role);
                                            setFormData({ name: role.name, permissions: role.permissions.map(p => p.id) });
                                            setShowModal(true);
                                        }}
                                        className="btn btn-ghost btn-icon btn-sm"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button className="btn btn-ghost btn-icon btn-sm delete"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <h3>{role.name}</h3>
                            <p className="permission-count">{role.permissions.length} permissions actives</p>
                            <div className="permission-badges">
                                {role.permissions.slice(0, 3).map(p => (
                                    <span key={p.id} className="badge">{p.name.split('_').pop()}</span>
                                ))}
                                {role.permissions.length > 3 && <span className="more">+{role.permissions.length - 3}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card table-container">
                    <div className="table-search">
                        <Search size={18} />
                        <input type="text" placeholder="Rechercher un collaborateur..." onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Rôle Actuel</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-info">
                                            <span className="user-name">{user.name}</span>
                                            <span className="user-email">{user.email}</span>
                                        </div>
                                    </td>
                                    <td><span className="role-badge">{user.role?.name || 'Aucun'}</span></td>
                                    <td className="text-right">
                                        <select value={user.role_id || ''} onChange={(e) => rolesApi.updateUserRole(user.id, e.target.value).then(fetchData)} className="select-input">
                                            <option value="">Attribuer un rôle...</option>
                                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Modal ── */}
            <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={handleCloseModal}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <div>
                            <h2 className="modal-title">
                                {editingRole ? 'Modifier le Rôle' : 'Nouveau Rôle'}
                            </h2>
                            {/* Compteur live — visible dès qu'au moins 1 permission est cochée */}
                            <p className={`modal-perm-counter ${selectedCount > 0 ? 'visible' : ''}`}>
                                <Lock size={11} />
                                {selectedCount} permission{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
                            </p>
                        </div>
                        <button onClick={handleCloseModal} className="modal-close"><X size={20} /></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Nom du rôle</label>
                                <input
                                    className="form-input"
                                    type="text" required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ex: Chef de Chantier"
                                />
                            </div>

                            <div className="permissions-section">
                                <label className="form-label">Permissions disponibles</label>
                                {Object.entries(groupedPermissions).map(([group, perms]) => (
                                    <div key={group} className="permission-group">
                                        <h4>{group}</h4>
                                        <div className="permission-grid">
                                            {perms.map(p => {
                                                const isSelected = formData.permissions.includes(p.id);
                                                const isAnimating = justToggled === p.id;
                                                return (
                                                    <div
                                                        key={p.id}
                                                        className={[
                                                            'permission-item',
                                                            isSelected ? 'selected' : '',
                                                            isAnimating ? 'permission-item--pulse' : ''
                                                        ].filter(Boolean).join(' ')}
                                                        onClick={() => handleTogglePermission(p.id)}
                                                    >
                                                        <div className={`permission-checkbox ${isSelected ? 'permission-checkbox--checked' : ''}`}>
                                                            <Check size={11} className="permission-checkmark" />
                                                        </div>
                                                        <span className="permission-label">
                                                            {p.name}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" onClick={handleCloseModal} className="btn btn-ghost">Annuler</button>
                            <button type="submit" className="btn btn-primary">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}