import { useState, useEffect } from 'react';
import {
    FileSignature, Plus, Search, Edit, Trash2, X, Copy,
    FileText, Briefcase, Wrench, HelpCircle, Eye, EyeOff,
    Loader, Save, Tag, Calendar, User, CheckCircle, AlertCircle,
    Download
} from 'lucide-react';
import api,{contractTemplatesApi} from '../services/api';
import TipTapEditor from '../components/TipTapEditor';
import TemplateModal from '../components/TemplateModal';
import { generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';


import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

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

/* ── Toast ── */
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

/* ── Carte de modèle ── */
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
            {/* Bande de couleur en haut */}
            <div style={{ height: 4, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)` }} />

            <div style={{ padding: '20px' }}>
                {/* Header */}
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
                        <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={(e) => { e.stopPropagation(); onDownload(template); }}
                            title="Téléchargez"
                        >
                            <Download size={14} />
                        </button>
                        <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={(e) => { e.stopPropagation(); onPreview(template); }}
                            title="Aperçu"
                        >
                            <Eye size={14} />
                        </button>
                        <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={(e) => { e.stopPropagation(); onDuplicate(template.id); }}
                            title="Dupliquer"
                        >
                            <Copy size={14} />
                        </button>
                        <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={(e) => { e.stopPropagation(); onEdit(template); }}
                            title="Modifier"
                        >
                            <Edit size={14} />
                        </button>
                        <button
                            className="btn btn-ghost btn-icon btn-sm"
                            style={{ color: 'var(--error-400)' }}
                            onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
                            title="Supprimer"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Description */}
                {template.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                        {template.description}
                    </p>
                )}

                {/* Footer */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: 12, borderTop: '1px solid var(--border-color)',
                    fontSize: 12, color: 'var(--text-muted)',
                }}>
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


/* ── Modal Aperçu ── */
function PreviewModal({ template, onClose, onEdit }) {
    if (!template) return null;
    const cat = getCategoryConfig(template.category);
    const CatIcon = cat.icon;

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div
                className="modal"
                style={{ maxWidth: 800, width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CatIcon size={20} style={{ color: cat.color }} />
                        {template.name}
                    </h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => { onClose(); onEdit(template); }}>
                            <Edit size={14} /> Modifier
                        </button>
                        <button className="modal-close" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>
                <div className="modal-body" style={{ overflow: 'auto' }}>
                    {template.description && (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)' }}>
                            {template.description}
                        </p>
                    )}
                    <TipTapEditor content={template.content} readOnly minHeight={300} />
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
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [toast, setToast] = useState(null);

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
            console.error('Erreur chargement modèles:', error);
            showToast('Erreur lors du chargement', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, [activeCategory]);

    // Recherche côté client pour plus de réactivité
    const filtered = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = async (data) => {
        try {
            await api.post('/contract-templates', data);
            showToast('Modèle créé avec succès');
            setShowModal(false);
            fetchTemplates();
        } catch (error) {
            showToast(error.response?.data?.error || 'Erreur lors de la création', 'error');
        }
    };

    const handleUpdate = async (data) => {
        try {
            await api.put(`/contract-templates/${editingTemplate.id}`, data);
            showToast('Modèle mis à jour');
            setShowModal(false);
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
        } catch (error) {
            showToast('Erreur lors de la suppression', 'error');
        }
    };

    const handleDuplicate = async (id) => {
        try {
            await api.post(`/contract-templates/${id}/duplicate`);
            showToast('Modèle dupliqué avec succès');
            fetchTemplates();
        } catch (error) {
            showToast('Erreur lors de la duplication', 'error');
        }
    };
    // Au début de votre composant ContratModeles, ajoutez un état de chargement :
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // Remplacez votre fonction d'ouverture de modification par celle-ci :
    const openEdit = async (templateSummary) => {
        try {
            setIsLoadingDetails(true);
            // On récupère le contenu lourd uniquement lors du clic
            const response = await contractTemplatesApi.getOne(templateSummary.id);
            setEditingTemplate(response.data);
            setShowModal(true);
        } catch (error) {
            console.error("Erreur de chargement", error);
            // Afficher un toast d'erreur ici si nécessaire
        } finally {
            setIsLoadingDetails(false);
        }
    };

    // Remplacez votre fonction d'ouverture de prévisualisation par celle-ci :
    const openPreview = async (templateSummary) => {
        try {
            setIsLoadingDetails(true);
            // Idem, on récupère le contenu pour la prévisualisation
            const response = await contractTemplatesApi.getOne(templateSummary.id);
            setPreviewTemplate(response.data);
        } catch (error) {
            console.error("Erreur de chargement", error);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const download = async (templateSummary) => {
        try {
            setIsLoadingDetails(true);
            const response = await contractTemplatesApi.getOne(templateSummary.id);
            const fullTemplate = response.data;

            // --- ÉTAPE CRUCIALE : Conversion JSON -> HTML ---
            let htmlContent = "";
            try {
                // On parse le JSON s'il est stocké sous forme de string, 
                // sinon on l'utilise directement
                const jsonContent = typeof fullTemplate.content === 'string' 
                    ? JSON.parse(fullTemplate.content) 
                    : fullTemplate.content;

                // On génère le HTML à partir du JSON en utilisant les règles de TipTap
                htmlContent = generateHTML(jsonContent, [
                    StarterKit,    
                    Image.configure({ 
                        allowBase64: true, 
                        inline: true 
                    }),
                    Table.configure({ resizable: true }),
                    TableRow,
                    TableCell,
                    TableHeader,
                    TextAlign.configure({ types: ['heading', 'paragraph'] }),
                    Underline,
                    TextStyle,
                    Color,
                    Highlight.configure({ multicolor: true }),
                    Link.configure({ openOnClick: false }),
                ],
            );
            } catch (e) {
                console.error("Erreur de conversion JSON", e);
                htmlContent = fullTemplate.content; // Backup
            }
            // ------------------------------------------------
            console.log(htmlContent);
            const header = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                    xmlns:w='urn:schemas-microsoft-com:office:word' 
                    xmlns='http://www.w3.org/TR/REC-html40'>
                <head><meta charset='utf-8'></head>
                <body>`;
            const footer = "</body></html>";
            
            const sourceHTML = header + htmlContent + footer;

            const blob = new Blob([sourceHTML], { type: 'application/msword' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fullTemplate.name.replace(/\s+/g, '_')}.doc`;
            
            document.body.appendChild(link);
            link.click();
            
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            showToast('Document exporté avec succès');
        } catch (error) {
            console.error(error);
            showToast('Erreur lors de la génération', 'error');
        } finally {
            setIsLoadingDetails(false);
        }
    };
    const openCreate = () => {
        setEditingTemplate(null);
        setShowModal(true);
    };

    /* Stats */
    const totalActifs = templates.filter(t => t.is_active).length;
    const byCategory = CATEGORIES.filter(c => c.value !== 'tous').reduce((acc, cat) => {
        acc[cat.value] = templates.filter(t => t.category === cat.value).length;
        return acc;
    }, {});

    return (
        <div>
            {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                    <div className="search-box" style={{ width: 300 }}>
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Rechercher un modèle..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Filtres catégorie */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        {CATEGORIES.map(cat => {
                            const CatIcon = cat.icon;
                            const isActive = activeCategory === cat.value;
                            return (
                                <button
                                    key={cat.value}
                                    onClick={() => setActiveCategory(cat.value)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '6px 14px', borderRadius: 8,
                                        border: isActive ? `1px solid ${cat.color}` : '1px solid var(--border-color)',
                                        background: isActive ? cat.color + '15' : 'transparent',
                                        color: isActive ? cat.color : 'var(--text-muted)',
                                        cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 600 : 400,
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    <CatIcon size={14} />
                                    {cat.label}
                                    {cat.value !== 'tous' && byCategory[cat.value] > 0 && (
                                        <span style={{
                                            fontSize: 11, fontWeight: 700,
                                            background: isActive ? cat.color : 'var(--bg-tertiary)',
                                            color: isActive ? '#fff' : 'var(--text-muted)',
                                            borderRadius: 4, padding: '0 5px',
                                        }}>
                                            {byCategory[cat.value]}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button className="btn btn-primary" onClick={openCreate}>
                    <Plus size={18} /> Nouveau modèle
                </button>
            </div>

            {/* Statistiques */}
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

            {/* Grille de modèles */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                    <Loader size={48} className="spinner" style={{ color: 'var(--primary-400)' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <FileSignature size={80} />
                    </div>
                    <h3 className="empty-state-title">Aucun modèle trouvé</h3>
                    <p className="empty-state-text">
                        {search ? 'Modifiez votre recherche ou' : 'Commencez par'} créer un nouveau modèle de contrat.
                    </p>
                    <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 16 }}>
                        <Plus size={16} /> Créer un modèle
                    </button>
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

            {/* Modals */}
            <TemplateModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingTemplate(null); }}
                onSubmit={editingTemplate ? handleUpdate : handleCreate}
                initialData={editingTemplate}
            />

            <PreviewModal
                template={previewTemplate}
                onClose={() => setPreviewTemplate(null)}
                onEdit={openEdit}
            />
        </div>
    );
}
