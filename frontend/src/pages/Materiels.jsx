import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, X, Calendar, MapPin, Satellite, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { materielsApi } from '../services/api';

const types = ['Tous', 'Engin', 'Véhicule', 'Outillage'];

function Materiels() {
    const [materiels, setMateriels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('Tous');
    const [showModal, setShowModal] = useState(false);
    const [editingMateriel, setEditingMateriel] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '', type: '', immatriculation: '', status: 'Disponible',
        hourly_rate: '', last_maintenance: '', next_maintenance: '', notes: '',
        latitude: '', longitude: '', sensolus_device_id: '', sensolus_tracker_name: ''
    });

    const fetchMateriels = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {};
            if (typeFilter !== 'Tous') params.type = typeFilter;
            if (searchTerm) params.search = searchTerm;
            const response = await materielsApi.getAll(params);
            setMateriels(response.data);
        } catch (err) {
            console.error('Erreur chargement matériels:', err);
            setError('Impossible de charger les matériels. Vérifiez votre connexion.');
        } finally {
            setLoading(false);
        }
    }, [typeFilter, searchTerm]);

    useEffect(() => {
        const debounce = setTimeout(() => fetchMateriels(), 300);
        return () => clearTimeout(debounce);
    }, [fetchMateriels]);

    const getStatusBadge = (status) => ({
        'En service': 'badge-success',
        'Disponible': 'badge-info',
        'Maintenance': 'badge-warning',
        'Hors service': 'badge-danger'
    }[status] || 'badge-primary');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                name: formData.name,
                type: formData.type,
                immatriculation: formData.immatriculation,
                status: formData.status,
                hourly_rate: parseFloat(formData.hourly_rate),
                last_maintenance: formData.last_maintenance || null,
                next_maintenance: formData.next_maintenance || null,
                notes: formData.notes || null,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                sensolus_device_id: formData.sensolus_device_id || null,
                sensolus_tracker_name: formData.sensolus_tracker_name || null,
            };

            if (editingMateriel) {
                await materielsApi.update(editingMateriel.id, payload);
            } else {
                await materielsApi.create(payload);
            }
            closeModal();
            fetchMateriels();
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
            const msg = err.response?.data?.message || 'Erreur lors de la sauvegarde.';
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const openModal = (materiel = null) => {
        setEditingMateriel(materiel);
        if (materiel) {
            setFormData({
                name: materiel.name || '',
                type: materiel.type || '',
                immatriculation: materiel.immatriculation || '',
                status: materiel.status || 'Disponible',
                hourly_rate: materiel.hourly_rate?.toString() || '',
                last_maintenance: materiel.last_maintenance ? materiel.last_maintenance.substring(0, 10) : '',
                next_maintenance: materiel.next_maintenance ? materiel.next_maintenance.substring(0, 10) : '',
                notes: materiel.notes || '',
                latitude: materiel.latitude?.toString() || '',
                longitude: materiel.longitude?.toString() || '',
                sensolus_device_id: materiel.sensolus_device_id || '',
                sensolus_tracker_name: materiel.sensolus_tracker_name || '',
            });
        } else {
            setFormData({
                name: '', type: '', immatriculation: '', status: 'Disponible',
                hourly_rate: '', last_maintenance: '', next_maintenance: '', notes: '',
                latitude: '', longitude: '', sensolus_device_id: '', sensolus_tracker_name: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingMateriel(null); };

    const deleteMateriel = async (id) => {
        if (!confirm('Supprimer ce matériel ?')) return;
        try {
            await materielsApi.delete(id);
            fetchMateriels();
        } catch (err) {
            console.error('Erreur suppression:', err);
            alert('Erreur lors de la suppression.');
        }
    };

    const stats = {
        total: materiels.length,
        enService: materiels.filter(m => m.status === 'En service').length,
        disponible: materiels.filter(m => m.status === 'Disponible').length,
        maintenance: materiels.filter(m => m.status === 'Maintenance').length,
        geolocated: materiels.filter(m => m.latitude && m.longitude).length,
    };

    return (
        <div>
            {/* Header actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="search-box" style={{ width: '300px' }}>
                        <Search className="search-icon" size={18} />
                        <input className="search-input" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <select className="form-input form-select" style={{ width: '180px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button className="btn btn-ghost btn-icon" onClick={fetchMateriels} title="Rafraîchir">
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />Nouveau Matériel
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div className="card" style={{ padding: '16px', marginBottom: '16px', background: 'var(--danger-500)', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                    <button className="btn btn-ghost" style={{ marginLeft: 'auto', color: 'white' }} onClick={fetchMateriels}>Réessayer</button>
                </div>
            )}

            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary-400)' }}>{stats.total}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success-500)' }}>{stats.enService}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>En service</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--info-500)' }}>{stats.disponible}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Disponibles</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--warning-500)' }}>{stats.maintenance}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Maintenance</div>
                </div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#8b5cf6' }}>{stats.geolocated}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Satellite size={12} />Géolocalisés
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="table-container">
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', gap: '12px', color: 'var(--text-muted)' }}>
                            <Loader2 size={24} className="spin" />
                            <span>Chargement des matériels...</span>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Matériel</th>
                                    <th>Type</th>
                                    <th>Immatriculation</th>
                                    <th>Statut</th>
                                    <th>Chantier</th>
                                    <th>Prochaine maintenance</th>
                                    <th>Taux/h</th>
                                    <th>GPS</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materiels.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                            Aucun matériel trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    materiels.map((m) => (
                                        <tr key={m.id}>
                                            <td style={{ fontWeight: 500 }}>
                                                <div>{m.name}</div>
                                                {m.sensolus_tracker_name && (
                                                    <div style={{ fontSize: '11px', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                        <Satellite size={10} />{m.sensolus_tracker_name}
                                                    </div>
                                                )}
                                            </td>
                                            <td>{m.type}</td>
                                            <td>
                                                <code style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px' }}>{m.immatriculation}</code>
                                            </td>
                                            <td><span className={`badge ${getStatusBadge(m.status)}`}>{m.status}</span></td>
                                            <td>{m.current_chantier_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                            <td>
                                                {m.next_maintenance ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Calendar size={14} />
                                                        {new Date(m.next_maintenance).toLocaleDateString('fr-FR')}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{m.hourly_rate}€</td>
                                            <td>
                                                {m.latitude && m.longitude ? (
                                                    <MapPin size={16} style={{ color: '#22c55e' }} title={`${m.latitude}, ${m.longitude}`} />
                                                ) : (
                                                    <MapPin size={16} style={{ color: 'var(--text-muted)', opacity: 0.3 }} title="Non géolocalisé" />
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openModal(m)}><Edit size={14} /></button>
                                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteMateriel(m.id)}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal */}
            <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={closeModal}>
                <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                    <div className="modal-header">
                        <h2 className="modal-title">{editingMateriel ? 'Modifier' : 'Nouveau'} Matériel</h2>
                        <button className="modal-close" onClick={closeModal}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Nom</label>
                                <input className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select className="form-input form-select" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required>
                                        <option value="">Choisir...</option>
                                        {types.filter(t => t !== 'Tous').map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Immatriculation</label>
                                    <input className="form-input" value={formData.immatriculation} onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value })} required />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Statut</label>
                                    <select className="form-input form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Disponible">Disponible</option>
                                        <option value="En service">En service</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Hors service">Hors service</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Taux horaire €</label>
                                    <input type="number" step="0.01" className="form-input" value={formData.hourly_rate} onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })} required />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Dernière maintenance</label>
                                    <input type="date" className="form-input" value={formData.last_maintenance} onChange={(e) => setFormData({ ...formData, last_maintenance: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Prochaine maintenance</label>
                                    <input type="date" className="form-input" value={formData.next_maintenance} onChange={(e) => setFormData({ ...formData, next_maintenance: e.target.value })} />
                                </div>
                            </div>

                            {/* Section Géolocalisation / Sensolus */}
                            <div style={{ marginTop: '8px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <Satellite size={16} style={{ color: '#8b5cf6' }} />
                                    <span style={{ fontWeight: 600, fontSize: '14px' }}>Géolocalisation & Sensolus</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Latitude</label>
                                        <input type="number" step="any" className="form-input" placeholder="45.7640" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Longitude</label>
                                        <input type="number" step="any" className="form-input" placeholder="4.8357" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">ID Capteur Sensolus</label>
                                        <input className="form-input" placeholder="SEN-XXXXX" value={formData.sensolus_device_id} onChange={(e) => setFormData({ ...formData, sensolus_device_id: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Nom du tracker</label>
                                        <input className="form-input" placeholder="Tracker Pelleteuse 01" value={formData.sensolus_tracker_name} onChange={(e) => setFormData({ ...formData, sensolus_tracker_name: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '16px' }}>
                                <label className="form-label">Notes</label>
                                <textarea className="form-input" rows="2" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={submitting}>Annuler</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting && <Loader2 size={16} className="spin" style={{ marginRight: '8px' }} />}
                                {editingMateriel ? 'Enregistrer' : 'Créer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}

export default Materiels;
