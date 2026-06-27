import { useState, useEffect } from 'react';
import {
    FileSignature, Plus, Search, Edit, Trash2, X, Copy,
    FileText, Briefcase, Wrench, HelpCircle, Eye, EyeOff,
    Loader, Save, Tag, Calendar, User, CheckCircle, AlertCircle,
    Download
} from 'lucide-react';
import api, { contractTemplatesApi } from '../services/api';
import TemplateModal from '../components/TemplateModal';
import TemplateEditorPage from './TemplateEditorPage'; // Importe la nouvelle page


/* ── Catégories ── */
const CATEGORIES = [
    { value: 'tous', label: 'Toutes', icon: FileText, color: '#94a3b8' },
    { value: 'employe', label: 'Employé', icon: Briefcase, color: '#f59e0b' },
    { value: 'chantier', label: 'Chantier', icon: Wrench, color: '#3b82f6' },
    { value: 'prestation', label: 'Prestation', icon: FileSignature, color: '#10b981' },
    { value: 'autre', label: 'Autre', icon: HelpCircle, color: '#8b5cf6' },
];

const getCategoryConfig = (cat) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ── Toast (Ton composant) ── */
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [onClose]);
    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 20px',
            background: type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)',
            color: '#fff', borderRadius: 'var(--border-radius)', backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            animation: 'slideInRight 0.3s ease',
        }}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span style={{ fontSize: 14 }}>{message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 8 }}>
                <X size={14} />
            </button>
        </div>
    );
}

/* ── Carte de modèle (Ton style intact) ── */
function TemplateCard({ template, onEdit, onDelete, onDuplicate, onPreview, onDownload }) {
    const cat = getCategoryConfig(template.category);
    const CatIcon = cat.icon;
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="card"
            style={{
                padding: 0, overflow: 'hidden', cursor: 'pointer',
                transform: hovered ? 'translateY(-2px)' : 'none',
                transition: 'all 0.2s ease',
                boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.15)' : undefined,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={{ height: 4, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)` }} />
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: cat.color + '15', color: cat.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <CatIcon size={20} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                {template.name}
                            </h4>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: 11, fontWeight: 500, padding: '2px 8px',
                                borderRadius: 4, background: cat.color + '15', color: cat.color,
                            }}>
                                <Tag size={10} /> {cat.label}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); onDownload(template); }} title="Téléchargez"><Download size={14} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); onPreview(template); }} title="Aperçu"><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); onDuplicate(template.id); }} title="Dupliquer"><Copy size={14} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); onEdit(template); }} title="Modifier"><Edit size={14} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--error-400)' }} onClick={(e) => { e.stopPropagation(); onDelete(template.id); }} title="Supprimer"><Trash2 size={14} /></button>
                    </div>
                </div>
                {template.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{template.description}</p>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-color)', fontSize: 12, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={12} />
                        <span>Modifié {formatDate(template.updated_at)}</span>
                    </div>
                    {template.user && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={12} />
                            <span>{template.user.name}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Modal Aperçu (Ton style intact) ── */
function PreviewModal({ template, onClose, onEdit }) {
    if (!template) return null;
    const cat = getCategoryConfig(template.category);
    const CatIcon = cat.icon;
    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 800, width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CatIcon size={20} style={{ color: cat.color }} />
                        {template.name}
                    </h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => { onClose(); onEdit(template); }}><Edit size={14} /> Modifier</button>
                        <button className="modal-close" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>
                <div className="modal-body" style={{ overflow: 'auto' }}>
                    {template.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)' }}>{template.description}</p>}
                    {/* <TipTapEditor content={template.content} readOnly minHeight={300} /> */}
                </div>
            </div>
        </div>
    );
}

/* ── Page principale ── */
export default function ContratModeles() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('tous');
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [toast, setToast] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const showToast = (message, type = 'success') => setToast({ message, type, key: Date.now() });

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const params = {};
            if (activeCategory !== 'tous') params.category = activeCategory;
            if (search) params.search = search;
            const res = await api.get('/contract-templates', { params });
            setTemplates(res.data || []);
        } catch (error) {
            showToast('Erreur lors du chargement', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, [activeCategory]);

    const filtered = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(search.toLowerCase())
    );

    // --- Actions API modifiées pour fermer le plein écran ---
    const handleCreate = async (data) => {
        try {
            await api.post('/contract-templates', data);
            showToast('Modèle créé avec succès');
            setIsEditing(false); // Ferme la page d'édition
            fetchTemplates();
        } catch (error) {
            showToast(error.response?.data?.error || 'Erreur lors de la création', 'error');
        }
    };

    const handleUpdate = async (data) => {
        try {
            await api.put(`/contract-templates/${editingTemplate.id}`, data);
            showToast('Modèle mis à jour');
            setIsEditing(false); // Ferme la page d'édition
            setEditingTemplate(null);
            fetchTemplates();
        } catch (error) {
            showToast(error.response?.data?.error || 'Erreur lors de la mise à jour', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce modèle de contrat ?')) return;
        try {
            await api.delete(`/contract-templates/${id}`);
            showToast('Modèle supprimé');
            fetchTemplates();
        } catch (error) { showToast('Erreur lors de la suppression', 'error'); }
    };

    const handleDuplicate = async (id) => {
        try {
            await api.post(`/contract-templates/${id}/duplicate`);
            showToast('Modèle dupliqué avec succès');
            fetchTemplates();
        } catch (error) { showToast('Erreur lors de la duplication', 'error'); }
    };

    const openEdit = (template) => {
        setEditingTemplate(template);
        setIsEditing(true);
    };

    const openCreate = () => {
        setEditingTemplate(null);
        setIsEditing(true);
    };

    const openPreview = async (templateSummary) => {
        try {
            setIsLoadingDetails(true);
            const response = await contractTemplatesApi.getOne(templateSummary.id);
            setPreviewTemplate(response.data);
        } catch (error) { console.error("Erreur", error); } 
        finally { setIsLoadingDetails(false); }
    };

    // --- Ta fonction de téléchargement DOC ---
    const download = async (templateSummary) => {
        try {
            console.log(templateSummary);
            const response = await api.get(`/documents/${templateSummary.document_id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', templateSummary.name+ ".docx");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showToast(`"${templateSummary.name + ".docx"}" téléchargé`);
        } catch (error) {
            console.error('Error downloading:', error);
            showToast('Erreur lors du téléchargement', 'error');
        }
    };

    /* Stats */
    const totalActifs = templates.filter(t => t.is_active).length;
    const byCategory = CATEGORIES.filter(c => c.value !== 'tous').reduce((acc, cat) => {
        acc[cat.value] = templates.filter(t => t.category === cat.value).length;
        return acc;
    }, {});

    // ─── BASOULE PLEIN ÉCRAN (C'est ici que ça se passe) ───
    if (isEditing) {
        return (
            <TemplateEditorPage 
                initialData={editingTemplate}
                onBack={() => setIsEditing(false)}
                onSave={editingTemplate ? handleUpdate : handleCreate}
            />
        );
    }

    return (
        <div>
            {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header (Ton style) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                    <div className="search-box" style={{ width: 300 }}>
                        <Search className="search-icon" size={18} />
                        <input type="text" className="search-input" placeholder="Rechercher un modèle..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>

                    {/* Filtres catégorie (Ton style) */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        {CATEGORIES.map(cat => {
                            const CatIcon = cat.icon;
                            const isActive = activeCategory === cat.value;
                            return (
                                <button key={cat.value} onClick={() => setActiveCategory(cat.value)} style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8,
                                    border: isActive ? `1px solid ${cat.color}` : '1px solid var(--border-color)',
                                    background: isActive ? cat.color + '15' : 'transparent',
                                    color: isActive ? cat.color : 'var(--text-muted)',
                                    cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 600 : 400, transition: 'all 0.15s ease',
                                }}>
                                    <CatIcon size={14} />
                                    {cat.label}
                                    {cat.value !== 'tous' && byCategory[cat.value] > 0 && (
                                        <span style={{ fontSize: 11, fontWeight: 700, background: isActive ? cat.color : 'var(--bg-tertiary)', color: isActive ? '#fff' : 'var(--text-muted)', borderRadius: 4, padding: '0 5px' }}>
                                            {byCategory[cat.value]}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Nouveau modèle</button>
            </div>

            {/* Statistiques (Ton style) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
                <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary-400)' }}>{templates.length}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total modèles</div>
                </div>
                <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{totalActifs}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Actifs</div>
                </div>
                {CATEGORIES.filter(c => c.value !== 'tous').slice(0, 3).map(cat => (
                    <div key={cat.value} className="card" style={{ padding: 16, textAlign: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: cat.color }}>{byCategory[cat.value] || 0}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{cat.label}s</div>
                    </div>
                ))}
            </div>

            {/* Grille de modèles (Ton style) */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                    <Loader size={48} className="spinner" style={{ color: 'var(--primary-400)' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><FileSignature size={80} /></div>
                    <h3 className="empty-state-title">Aucun modèle trouvé</h3>
                    <p className="empty-state-text">{search ? 'Modifiez votre recherche ou' : 'Commencez par'} créer un nouveau modèle de contrat.</p>
                    <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 16 }}><Plus size={16} /> Créer un modèle</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                    {filtered.map(template => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                            onPreview={openPreview}
                            onDownload={download}
                        />
                    ))}
                </div>
            )}

            <PreviewModal
                template={previewTemplate}
                onClose={() => setPreviewTemplate(null)}
                onEdit={openEdit}
            />
        </div>
    );
}