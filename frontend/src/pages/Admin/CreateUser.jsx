import { useState, useEffect } from 'react';
import { usersApi, rolesApi } from '../../services/api';
import { Mail, Send, Clock, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';

export default function CreateUser() {
    const [roles, setRoles] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [formData, setFormData] = useState({ email: '', role_id: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingInvitations, setLoadingInvitations] = useState(true);

    useEffect(() => {
        fetchRoles();
        fetchInvitations();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await rolesApi.getAll();
            setRoles(response.data);
            if (response.data.length > 0) {
                setFormData(prev => ({ ...prev, role_id: response.data[0].id }));
            }
        } catch (err) {
            console.error('Erreur chargement rôles', err);
        }
    };

    const fetchInvitations = async () => {
        try {
            setLoadingInvitations(true);
            const response = await usersApi.getInvitations();
            setInvitations(response.data);
        } catch (err) {
            console.error('Erreur chargement invitations', err);
        } finally {
            setLoadingInvitations(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await usersApi.invite(formData);
            setSuccess(response.data.message || 'Invitation envoyée avec succès !');
            setFormData(prev => ({ ...prev, email: '' }));
            fetchInvitations();
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'envoi de l'invitation");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            'En attente': 'badge-warning',
            'Utilisée': 'badge-success',
            'Expirée': 'badge-danger',
        };
        return map[status] || 'badge-primary';
    };

    const getStatusIcon = (status) => {
        if (status === 'En attente') return <Clock size={14} />;
        if (status === 'Utilisée') return <CheckCircle size={14} />;
        return <XCircle size={14} />;
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Inviter un utilisateur</h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Envoyez une invitation par email pour créer un nouveau compte</p>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary-400)' }}>
                        {invitations.length}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total invitations</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--warning-500)' }}>
                        {invitations.filter(i => i.status === 'En attente').length}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>En attente</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success-500)' }}>
                        {invitations.filter(i => i.status === 'Utilisée').length}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Comptes créés</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
                {/* Invitation Form */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))',
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--border-color)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: 'var(--border-radius-md)',
                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.15))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-400)'
                            }}>
                                <Mail size={20} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Nouvelle invitation</h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Le lien expire après 48h</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '24px' }}>
                        {error && (
                            <div style={{
                                padding: '14px 16px', marginBottom: '20px', borderRadius: 'var(--border-radius-md)',
                                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#fca5a5', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px'
                            }}>
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div style={{
                                padding: '14px 16px', marginBottom: '20px', borderRadius: 'var(--border-radius-md)',
                                background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)',
                                color: '#86efac', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px'
                            }}>
                                <CheckCircle size={18} />
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Adresse email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="utilisateur@exemple.com"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Rôle attribué</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.role_id}
                                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                    required
                                >
                                    <option value="">Sélectionner un rôle</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '8px' }}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Envoyer l'invitation
                                    </>
                                )}
                            </button>
                        </form>

                        <div style={{
                            marginTop: '20px', padding: '14px', borderRadius: 'var(--border-radius-sm)',
                            background: 'var(--bg-tertiary)', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6
                        }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>Comment ça marche ?</strong><br />
                            1. L'utilisateur reçoit un email d'invitation<br />
                            2. Il clique sur le lien pour choisir son mot de passe<br />
                            3. Son compte est créé automatiquement
                        </div>
                    </div>
                </div>

                {/* Invitations List */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={20} />
                            Historique des invitations
                        </h3>
                    </div>

                    {loadingInvitations ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <span className="spinner" style={{ margin: '0 auto 12px', display: 'block', width: '24px', height: '24px' }}></span>
                            Chargement...
                        </div>
                    ) : invitations.length === 0 ? (
                        <div className="empty-state" style={{ padding: '40px 24px' }}>
                            <div className="empty-state-icon" style={{ marginBottom: '16px' }}>
                                <Mail size={48} />
                            </div>
                            <h3 className="empty-state-title" style={{ fontSize: '16px' }}>Aucune invitation</h3>
                            <p className="empty-state-text" style={{ fontSize: '13px' }}>
                                Les invitations envoyées apparaîtront ici.
                            </p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Rôle</th>
                                        <th>Statut</th>
                                        <th>Envoyée le</th>
                                        <th>Expire le</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invitations.map((inv) => (
                                        <tr key={inv.id}>
                                            <td style={{ fontWeight: 500 }}>{inv.email}</td>
                                            <td>{inv.role}</td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(inv.status)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                    {getStatusIcon(inv.status)}
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{inv.created_at}</td>
                                            <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{inv.expires_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
