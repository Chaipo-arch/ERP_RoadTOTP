
import {
    FileText, Plus, X, Edit2, Trash2, Upload, Download, Calendar,
    DollarSign, Briefcase, AlertCircle, CheckCircle2, Clock,
    ChevronDown, ChevronUp, File, Shield, FileSignature, Paperclip,
    Search, Filter, MoreHorizontal, Eye, Save
} from 'lucide-react';
import api from '../services/api';

/* ───────── Helpers ───────── */

const statusConfig = {
    'Actif': { badge: 'badge-success', icon: CheckCircle2, color: '#10b981' },
    'Suspendu': { badge: 'badge-warning', icon: Clock, color: '#f59e0b' },
    'Terminé': { badge: 'badge-info', icon: CheckCircle2, color: '#3b82f6' },
    'Résilié': { badge: 'badge-danger', icon: AlertCircle, color: '#ef4444' },
};

const documentTypeConfig = {
    'contrat': { label: 'Contrat', icon: FileSignature, color: '#3b82f6' },
    'assurance': { label: 'Assurance', icon: Shield, color: '#10b981' },
    'avenant': { label: 'Avenant', icon: FileText, color: '#f59e0b' },
    'attestation': { label: 'Attestation', icon: File, color: '#8b5cf6' },
    'autre': { label: 'Autre', icon: Paperclip, color: '#6b7280' },
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
};

const formatCurrency = (value) => {
    if (!value || value === 0) return '—';
    return parseFloat(value).toFixed(2) + ' €';
};

/* ───────── Toast ───────── */
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className={`ged-toast ${type === 'success' ? 'ged-toast--success' : 'ged-toast--error'}`}>
            {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message}</span>
            <button onClick={onClose} className="ged-toast-close"><X size={14} /></button>
        </div>
    );
}

/* ───────── Document Card ───────── */
function DocumentItem({ doc, onDelete, onDownload }) {
    const config = documentTypeConfig[doc.type] || documentTypeConfig.autre;
    const { Icon, label, color } = config;

    return (
        <div className="contrat-doc-item">
            <div className="contrat-doc-icon" style={{ backgroundColor: color + '15', color }}>
                <Icon size={18} />
            </div>
            <div className="contrat-doc-info">
                <p className="contrat-doc-name" title={doc.name}>{doc.name}</p>
                <span className="contrat-doc-meta">{label} • {formatDate(doc.created_at)}</span>
            </div>
            <div className="contrat-doc-actions">
                <button onClick={() => onDownload(doc)} title="Télécharger">
                    <Download size={14} />
                </button>
                <button onClick={() => onDelete(doc.id)} title="Supprimer" className="contrat-btn--danger">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

/* ───────── Contrat Card ───────── */
function ContratCard({ contrat, onEdit, onDelete, onUploadDoc, onDeleteDoc, onDownloadDoc, isExpanded, onToggle }) {
    const config = statusConfig[contrat.status] || statusConfig['Actif'];
    const { badge, icon: StatusIcon, color } = config;

    return (
        <div className={`contrat-card ${isExpanded ? 'contrat-card--expanded' : ''}`}>
            <div className="contrat-card-header" onClick={onToggle}>
                <div className="contrat-card-main">
                    <div className="contrat-card-icon" style={{ backgroundColor: color + '15', color }}>
                        <Briefcase size={20} />
                    </div>
                    <div className="contrat-card-info">
                        <h4 className="contrat-card-title">{contrat.job_title}</h4>
                        <div className="contrat-card-subtitle">
                            <span className={`badge ${badge}`}>
                                <StatusIcon size={12} /> {contrat.status}
                            </span>
                            <span className="contrat-card-type">{contrat.contrat_type?.name || 'Contrat'}</span>
                        </div>
                    </div>
                </div>
                <div className="contrat-card-meta">
                    <div className="contrat-card-dates">
                        <Calendar size={14} />
                        <span>{formatDate(contrat.start_date)}</span>
                        {contrat.end_date && (
                            <>
                                <span>→</span>
                                <span>{formatDate(contrat.end_date)}</span>
                            </>
                        )}
                    </div>
                    <div className="contrat-card-salary">
                        <DollarSign size={14} />
                        <span>{formatCurrency(contrat.hourly_salary)}/h</span>
                    </div>
                    <button className="contrat-card-toggle">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="contrat-card-body">
                    {/* Détails du contrat */}
                    <div className="contrat-details">
                        <div className="contrat-detail-row">
                            <div className="contrat-detail-item">
                                <span className="contrat-detail-label">Type de contrat</span>
                                <span className="contrat-detail-value">{contrat.contrat_type?.name || '—'}</span>
                            </div>
                            <div className="contrat-detail-item">
                                <span className="contrat-detail-label">Taux horaire</span>
                                <span className="contrat-detail-value">{formatCurrency(contrat.hourly_salary)}/h</span>
                            </div>
                            <div className="contrat-detail-item">
                                <span className="contrat-detail-label">Taux (brut)</span>
                                <span className="contrat-detail-value">{formatCurrency(contrat.hourly_rate)}/h</span>
                            </div>
                            <div className="contrat-detail-item">
                                <span className="contrat-detail-label">Date de début</span>
                                <span className="contrat-detail-value">{formatDate(contrat.start_date)}</span>
                            </div>
                            <div className="contrat-detail-item">
                                <span className="contrat-detail-label">Date de fin</span>
                                <span className="contrat-detail-value">{formatDate(contrat.end_date) || 'Indéterminée'}</span>
                            </div>
                            <div className="contrat-detail-item">
                                <span className="contrat-detail-label">Statut</span>
                                <span className="contrat-detail-value">
                                    <span className={`badge ${badge}`}>{contrat.status}</span>
                                </span>
                            </div>
                        </div>
                        {contrat.notes && (
                            <div className="contrat-notes">
                                <span className="contrat-detail-label">Notes</span>
                                <p>{contrat.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Documents */}
                    <div className="contrat-documents">
                        <div className="contrat-documents-header">
                            <h5>
                                <Paperclip size={16} />
                                Documents attachés ({contrat.documents?.length || 0})
                            </h5>
                            <label className="contrat-upload-btn">
                                <Upload size={14} />
                                Ajouter un document
                                <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={(e) => onUploadDoc(contrat.id, e.target.files[0])}
                                />
                            </label>
                        </div>
                        {contrat.documents && contrat.documents.length > 0 ? (
                            <div className="contrat-documents-list">
                                {contrat.documents.map(doc => (
                                    <DocumentItem
                                        key={doc.id}
                                        doc={doc}
                                        onDelete={(docId) => onDeleteDoc(contrat.id, docId)}
                                        onDownload={onDownloadDoc}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="contrat-empty-docs">Aucun document attaché</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="contrat-card-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(contrat)}>
                            <Edit2 size={14} /> Modifier
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => onDelete(contrat.id)}>
                            <Trash2 size={14} /> Supprimer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ───────── Modal Formulaire ───────── */
function ContratModal({ isOpen, onClose, onSubmit, contratTypes, initialData = null, employeId }) {
    const [formData, setFormData] = useState({
        contrat_id: '',
        job_title: '',
        hourly_salary: '',
        hourly_rate: '',
        start_date: '',
        end_date: '',
        status: 'Actif',
        notes: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                contrat_id: initialData.contrat_id?.toString() || '',
                job_title: initialData.job_title || '',
                hourly_salary: initialData.hourly_salary || '',
                hourly_rate: initialData.hourly_rate || '',
                start_date: initialData.start_date || '',
                end_date: initialData.end_date || '',
                status: initialData.status || 'Actif',
                notes: initialData.notes || '',
            });
        } else {
            setFormData({
                contrat_id: '',
                job_title: '',
                hourly_salary: '',
                hourly_rate: '',
                start_date: '',
                end_date: '',
                status: 'Actif',
                notes: '',
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <FileSignature size={22} style={{ color: 'var(--primary-400)' }} />
                        {initialData ? 'Modifier le contrat' : 'Nouveau contrat'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
                    <div className="modal-body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Type de contrat *</label>
                                <select
                                    className="form-input form-select"
                                    value={formData.contrat_id}
                                    onChange={(e) => setFormData({ ...formData, contrat_id: e.target.value })}
                                    required
                                >
                                    <option value="">Sélectionner...</option>
                                    {contratTypes.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Intitulé du poste *</label>
                                <input
                                    className="form-input"
                                    value={formData.job_title}
                                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                    placeholder="Ex: Chef de chantier"
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Salaire horaire (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={formData.hourly_salary}
                                    onChange={(e) => setFormData({ ...formData, hourly_salary: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Taux brut horaire (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={formData.hourly_rate}
                                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Date de début *</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date de fin</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Statut</label>
                            <select
                                className="form-input form-select"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="Actif">Actif</option>
                                <option value="Suspendu">Suspendu</option>
                                <option value="Terminé">Terminé</option>
                                <option value="Résilié">Résilié</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Notes additionnelles..."
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={16} />
                            {initialData ? 'Enregistrer' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ───────── Composant Principal ───────── */
export default function EmployeContrats({ employeId, employeName }) {
    const [contrats, setContrats] = useState([]);
    const [contratTypes, setContratTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingContrat, setEditingContrat] = useState(null);
    const [toast, setToast] = useState(null);
    const [filterStatus, setFilterStatus] = useState('Tous');

    const showToast = (message, type = 'success') => {
        setToast({ message, type, key: Date.now() });
    };

    const fetchContrats = async () => {
        try {
            setLoading(true);
            const [contratsRes, typesRes] = await Promise.all([
                api.get(`/employes/${employeId}/contrats`),
                api.get('/contrats/types'),
            ]);
            setContrats(contratsRes.data || []);
            setContratTypes(typesRes.data || []);
        } catch (error) {
            console.error('Erreur chargement contrats:', error);
            showToast('Erreur lors du chargement des contrats', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (employeId) fetchContrats();
    }, [employeId]);

    const handleCreate = async (formData) => {
        try {
            const payload = {
                ...formData,
                contrat_id: parseInt(formData.contrat_id),
                hourly_salary: parseFloat(formData.hourly_salary) || 0,
                hourly_rate: parseFloat(formData.hourly_rate) || null,
            };
            await api.post(`/employes/${employeId}/contrats`, payload);
            showToast('Contrat créé avec succès');
            setShowModal(false);
            fetchContrats();
        } catch (error) {
            console.error('Erreur création contrat:', error);
            showToast(error.response?.data?.error || 'Erreur lors de la création', 'error');
        }
    };

    const handleUpdate = async (formData) => {
        try {
            const payload = {
                ...formData,
                contrat_id: parseInt(formData.contrat_id),
                hourly_salary: parseFloat(formData.hourly_salary) || 0,
                hourly_rate: parseFloat(formData.hourly_rate) || null,
            };
            await api.put(`/employes/${employeId}/contrats/${editingContrat.id}`, payload);
            showToast('Contrat mis à jour');
            setShowModal(false);
            setEditingContrat(null);
            fetchContrats();
        } catch (error) {
            console.error('Erreur mise à jour contrat:', error);
            showToast(error.response?.data?.error || 'Erreur lors de la mise à jour', 'error');
        }
    };

    const handleDelete = async (contratId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) return;
        try {
            await api.delete(`/employes/${employeId}/contrats/${contratId}`);
            showToast('Contrat supprimé');
            fetchContrats();
        } catch (error) {
            console.error('Erreur suppression:', error);
            showToast('Erreur lors de la suppression', 'error');
        }
    };

    const handleUploadDocument = async (contratId, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'contrat');
        formData.append('name', file.name);

        try {
            await api.post(`/employes/${employeId}/contrats/${contratId}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast('Document ajouté');
            fetchContrats();
        } catch (error) {
            console.error('Erreur upload:', error);
            showToast('Erreur lors de l\'upload', 'error');
        }
    };

    const handleDeleteDocument = async (contratId, docId) => {
        if (!window.confirm('Supprimer ce document ?')) return;
        try {
            await api.delete(`/employes/${employeId}/contrats/${contratId}/documents/${docId}`);
            showToast('Document supprimé');
            fetchContrats();
        } catch (error) {
            console.error('Erreur suppression doc:', error);
            showToast('Erreur lors de la suppression', 'error');
        }
    };

    const handleDownloadDocument = async (doc) => {
        try {
            const response = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur téléchargement:', error);
            showToast('Erreur lors du téléchargement', 'error');
        }
    };

    const openEditModal = (contrat) => {
        setEditingContrat(contrat);
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingContrat(null);
        setShowModal(true);
    };

    const filteredContrats = filterStatus === 'Tous'
        ? contrats
        : contrats.filter(c => c.status === filterStatus);

    const stats = {
        total: contrats.length,
        actifs: contrats.filter(c => c.status === 'Actif').length,
        termines: contrats.filter(c => c.status === 'Terminé').length,
        documents: contrats.reduce((acc, c) => acc + (c.documents?.length || 0), 0),
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
                <div className="spinner" style={{ width: 32, height: 32 }} />
                <span style={{ marginLeft: 12, color: 'var(--text-muted)' }}>Chargement des contrats...</span>
            </div>
        );
    }

    return (
        <div className="contrats-page">
            {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="contrats-header">
                <div>
                    <h3 className="contrats-title">
                        <FileSignature size={22} style={{ color: 'var(--primary-400)' }} />
                        Contrats & Documents
                    </h3>
                    <p className="contrats-subtitle">
                        {employeName ? `Gestion des contrats de ${employeName}` : 'Gestion des contrats'}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={16} />
                    Nouveau contrat
                </button>
            </div>

            {/* Stats */}
            <div className="contrats-stats">
                <div className="contrat-stat-card">
                    <span className="contrat-stat-value">{stats.total}</span>
                    <span className="contrat-stat-label">Contrats</span>
                </div>
                <div className="contrat-stat-card contrat-stat-card--success">
                    <span className="contrat-stat-value">{stats.actifs}</span>
                    <span className="contrat-stat-label">Actifs</span>
                </div>
                <div className="contrat-stat-card contrat-stat-card--info">
                    <span className="contrat-stat-value">{stats.termines}</span>
                    <span className="contrat-stat-label">Terminés</span>
                </div>
                <div className="contrat-stat-card contrat-stat-card--warning">
                    <span className="contrat-stat-value">{stats.documents}</span>
                    <span className="contrat-stat-label">Documents</span>
                </div>
            </div>

            {/* Filtres */}
            <div className="contrats-filters">
                <div className="contrats-filter-group">
                    <Filter size={16} />
                    {['Tous', 'Actif', 'Suspendu', 'Terminé', 'Résilié'].map(status => (
                        <button
                            key={status}
                            className={`contrats-filter-btn ${filterStatus === status ? 'contrats-filter-btn--active' : ''}`}
                            onClick={() => setFilterStatus(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Liste des contrats */}
            {filteredContrats.length === 0 ? (
                <div className="empty-state" style={{ padding: '48px 24px' }}>
                    <FileSignature size={56} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: 16 }} />
                    <p className="empty-state-title">Aucun contrat</p>
                    <p className="empty-state-text">
                        {filterStatus !== 'Tous'
                            ? `Aucun contrat avec le statut "${filterStatus}"`
                            : 'Commencez par créer un nouveau contrat pour cet employé'}
                    </p>
                    <button className="btn btn-primary" onClick={openCreateModal} style={{ marginTop: 16 }}>
                        <Plus size={16} /> Créer un contrat
                    </button>
                </div>
            ) : (
                <div className="contrats-list">
                    {filteredContrats.map(contrat => (
                        <ContratCard
                            key={contrat.id}
                            contrat={contrat}
                            isExpanded={expandedId === contrat.id}
                            onToggle={() => setExpandedId(expandedId === contrat.id ? null : contrat.id)}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                            onUploadDoc={handleUploadDocument}
                            onDeleteDoc={handleDeleteDocument}
                            onDownloadDoc={handleDownloadDocument}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            <ContratModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingContrat(null); }}
                onSubmit={editingContrat ? handleUpdate : handleCreate}
                contratTypes={contratTypes}
                initialData={editingContrat}
                employeId={employeId}
            />
        </div>
    );
}

