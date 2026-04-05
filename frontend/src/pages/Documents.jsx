import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FileText, Download, Trash2, Upload, File, Image, Search,
    Filter, Grid, List, CloudUpload, HardDrive, Clock, FolderOpen,
    FileSpreadsheet, FileImage, FileVideo, FileAudio, Archive,
    CheckCircle2, AlertCircle, X, Eye, MoreHorizontal, ArrowUpRight
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ───────── Helpers ───────── */

const FILE_CATEGORIES = [
    { key: 'all', label: 'Tous', icon: FolderOpen },
    { key: 'document', label: 'Documents', icon: FileText },
    { key: 'image', label: 'Images', icon: FileImage },
    { key: 'spreadsheet', label: 'Tableurs', icon: FileSpreadsheet },
    { key: 'archive', label: 'Archives', icon: Archive },
    { key: 'other', label: 'Autres', icon: File },
];

const getFileCategory = (mimeType) => {
    if (!mimeType) return 'other';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf' || mimeType.includes('word') || mimeType.includes('text'))
        return 'document';
    if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv'))
        return 'spreadsheet';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('7z'))
        return 'archive';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'other';
};

const getFileIcon = (mimeType) => {
    const cat = getFileCategory(mimeType);
    const map = {
        image: { Icon: FileImage, color: '#a78bfa' },      // purple
        document: { Icon: FileText, color: '#f87171' },     // red
        spreadsheet: { Icon: FileSpreadsheet, color: '#34d399' }, // green
        archive: { Icon: Archive, color: '#fbbf24' },       // amber
        video: { Icon: FileVideo, color: '#60a5fa' },       // blue
        audio: { Icon: FileAudio, color: '#f472b6' },       // pink
        other: { Icon: File, color: '#94a3b8' },            // slate
    };
    return map[cat] || map.other;
};

const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHr < 24) return `Il y a ${diffHr}h`;
    if (diffDay < 7) return `Il y a ${diffDay}j`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getFileExtension = (name) => {
    if (!name) return '';
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop().toUpperCase() : '';
};

/* ───────── Toast Notification ───────── */
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className="ged-toast" data-type={type}>
            {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message}</span>
            <button onClick={onClose} className="ged-toast-close"><X size={14} /></button>
        </div>
    );
}

/* ───────── Upload Zone ───────── */
function UploadZone({ onUpload, uploading, uploadProgress }) {
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onUpload(Array.from(e.dataTransfer.files));
        }
    }, [onUpload]);

    const handleChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            onUpload(Array.from(e.target.files));
            e.target.value = '';
        }
    };

    return (
        <div
            className={`ged-upload-zone ${dragActive ? 'ged-upload-zone--active' : ''} ${uploading ? 'ged-upload-zone--uploading' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                onChange={handleChange}
                style={{ display: 'none' }}
                id="ged-file-input"
            />

            {/* Animated background particles */}
            <div className="ged-upload-particles">
                <div className="ged-particle ged-particle--1" />
                <div className="ged-particle ged-particle--2" />
                <div className="ged-particle ged-particle--3" />
            </div>

            <div className="ged-upload-content">
                {uploading ? (
                    <>
                        <div className="ged-upload-spinner">
                            <div className="ged-upload-spinner-ring" />
                            <span className="ged-upload-spinner-pct">{uploadProgress}%</span>
                        </div>
                        <p className="ged-upload-title">Upload en cours...</p>
                        <div className="ged-upload-progress-bar">
                            <div className="ged-upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                        </div>
                    </>
                ) : (
                    <>
                        <div className={`ged-upload-icon ${dragActive ? 'ged-upload-icon--bounce' : ''}`}>
                            <CloudUpload size={40} />
                        </div>
                        <p className="ged-upload-title">
                            {dragActive ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos fichiers'}
                        </p>
                        <p className="ged-upload-subtitle">
                            ou <span className="ged-upload-link">parcourez vos fichiers</span>
                        </p>
                        <div className="ged-upload-formats">
                            <span>PDF</span><span>DOC</span><span>XLS</span><span>IMG</span><span>ZIP</span>
                            <span>+</span>
                        </div>
                        <p className="ged-upload-limit">Taille max : 10 MB par fichier</p>
                    </>
                )}
            </div>
        </div>
    );
}

/* ───────── Document Card (Grid View) ───────── */
function DocumentCard({ doc, onDownload, onDelete, canDelete }) {
    const { Icon, color } = getFileIcon(doc.mime_type);
    const ext = getFileExtension(doc.name);

    return (
        <div className="ged-doc-card animate-slide-up">
            <div className="ged-doc-card-preview" style={{ '--file-color': color }}>
                <div className="ged-doc-card-icon">
                    <Icon size={32} />
                </div>
                {ext && <span className="ged-doc-card-ext">{ext}</span>}
                <div className="ged-doc-card-actions">
                    <button onClick={() => onDownload(doc)} title="Télécharger">
                        <Download size={16} />
                    </button>
                    {canDelete && (
                        <button onClick={() => onDelete(doc.id)} title="Supprimer" className="ged-action-delete">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
            <div className="ged-doc-card-info">
                <p className="ged-doc-card-name" title={doc.name}>{doc.name}</p>
                <div className="ged-doc-card-meta">
                    <span>{formatSize(doc.size)}</span>
                    <span className="ged-dot">•</span>
                    <span>{formatDate(doc.created_at)}</span>
                </div>
                {doc.uploader && (
                    <div className="ged-doc-card-uploader">
                        <div className="ged-doc-card-avatar">
                            {doc.uploader.name?.charAt(0).toUpperCase()}
                        </div>
                        <span>{doc.uploader.name}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ───────── Document Row (List View) ───────── */
function DocumentRow({ doc, onDownload, onDelete, canDelete }) {
    const { Icon, color } = getFileIcon(doc.mime_type);
    const ext = getFileExtension(doc.name);

    return (
        <tr className="ged-doc-row">
            <td>
                <div className="ged-doc-row-name">
                    <div className="ged-doc-row-icon" style={{ '--file-color': color }}>
                        <Icon size={18} />
                    </div>
                    <div>
                        <p className="ged-doc-row-filename">{doc.name}</p>
                        {ext && <span className="ged-doc-row-ext">{ext}</span>}
                    </div>
                </div>
            </td>
            <td>{formatSize(doc.size)}</td>
            <td>{formatDate(doc.created_at)}</td>
            <td>
                {doc.uploader ? (
                    <div className="ged-doc-card-uploader">
                        <div className="ged-doc-card-avatar" style={{ width: 24, height: 24, fontSize: 11 }}>
                            {doc.uploader.name?.charAt(0).toUpperCase()}
                        </div>
                        <span>{doc.uploader.name}</span>
                    </div>
                ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                )}
            </td>
            <td>
                <div className="ged-doc-row-actions">
                    <button onClick={() => onDownload(doc)} title="Télécharger" className="ged-row-btn">
                        <Download size={16} />
                    </button>
                    {canDelete && (
                        <button onClick={() => onDelete(doc.id)} title="Supprimer" className="ged-row-btn ged-row-btn--danger">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

/* ───────── Main Page ───────── */
export default function Documents() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [viewMode, setViewMode] = useState('grid');
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [toast, setToast] = useState(null);
    const { isAdmin } = useAuth();

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/documents');
            setDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
            showToast('Erreur lors du chargement des documents', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocuments(); }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type, key: Date.now() });
    };

    const handleUpload = async (files) => {
        if (!files.length) return;

        setUploading(true);
        setUploadProgress(0);
        let uploaded = 0;

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('model_type', 'chantier');
            formData.append('model_id', '1');
            formData.append('type', 'autre');

            try {
                await api.post('/documents', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const fileProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        const totalProgress = Math.round(((uploaded * 100) + fileProgress) / files.length);
                        setUploadProgress(totalProgress);
                    }
                });
                uploaded++;
            } catch (error) {
                console.error('Error uploading file:', error);
                showToast(`Erreur pour "${file.name}"`, 'error');
            }
        }

        setUploading(false);
        setUploadProgress(0);
        if (uploaded > 0) {
            showToast(`${uploaded} fichier${uploaded > 1 ? 's' : ''} uploadé${uploaded > 1 ? 's' : ''} avec succès`);
            await fetchDocuments();
        }
    };

    const handleDownload = async (doc) => {
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
            showToast(`"${doc.name}" téléchargé`);
        } catch (error) {
            console.error('Error downloading:', error);
            showToast('Erreur lors du téléchargement', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;
        try {
            await api.delete(`/documents/${id}`);
            setDocuments(prev => prev.filter(d => d.id !== id));
            showToast('Document supprimé');
        } catch (error) {
            console.error('Error deleting:', error);
            showToast('Erreur lors de la suppression', 'error');
        }
    };

    /* ── Computed ── */
    const totalSize = documents.reduce((acc, d) => acc + (d.size || 0), 0);
    const recentCount = documents.filter(d => {
        const diff = Date.now() - new Date(d.created_at).getTime();
        return diff < 7 * 86400000;
    }).length;

    const categoryCounts = documents.reduce((acc, d) => {
        const cat = getFileCategory(d.mime_type);
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const filteredDocs = documents.filter(d => {
        const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
        const matchCategory = activeCategory === 'all' || getFileCategory(d.mime_type) === activeCategory;
        return matchSearch && matchCategory;
    });

    /* ── Stats ── */
    const stats = [
        {
            label: 'Total Documents',
            value: documents.length,
            icon: FileText,
            iconClass: 'primary',
            change: `${recentCount} cette semaine`,
            changeType: recentCount > 0 ? 'positive' : 'neutral'
        },
        {
            label: 'Espace Utilisé',
            value: formatSize(totalSize),
            icon: HardDrive,
            iconClass: 'info',
            change: '10 GB disponible',
            changeType: 'neutral'
        },
        {
            label: 'Uploads Récents',
            value: recentCount,
            icon: Clock,
            iconClass: 'success',
            change: '7 derniers jours',
            changeType: 'neutral'
        },
        {
            label: 'Types de Fichiers',
            value: Object.keys(categoryCounts).length,
            icon: FolderOpen,
            iconClass: 'warning',
            change: `${categoryCounts.document || 0} PDF/DOC`,
            changeType: 'neutral'
        },
    ];

    return (
        <div className="ged-page">
            {/* Toast notifications */}
            {toast && <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Page Header */}
            <div className="ged-page-header">
                <div>
                    <h2 className="ged-page-title">Gestion Électronique des Documents</h2>
                    <p className="ged-page-subtitle">Centralisez, organisez et partagez vos documents en toute sécurité</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, i) => (
                    <div key={i} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className={`stat-icon ${stat.iconClass}`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">{stat.label}</div>
                            <div className="stat-value">{stat.value}</div>
                            {stat.change && (
                                <div className={`stat-change ${stat.changeType}`}>
                                    {stat.changeType === 'positive' && <ArrowUpRight size={14} />}
                                    {stat.change}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Upload Zone */}
            <div className="card ged-upload-card animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="card-header">
                    <div>
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Upload size={20} style={{ color: 'var(--primary-400)' }} />
                            Déposer des fichiers
                        </h3>
                        <p className="card-subtitle">Uploadez de nouveaux documents dans le système</p>
                    </div>
                </div>
                <UploadZone onUpload={handleUpload} uploading={uploading} uploadProgress={uploadProgress} />
            </div>

            {/* Documents Library */}
            <div className="card ged-library-card animate-slide-up" style={{ animationDelay: '400ms' }}>
                <div className="card-header ged-library-header">
                    <div>
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FolderOpen size={20} style={{ color: 'var(--primary-400)' }} />
                            Bibliothèque de Documents
                        </h3>
                        <p className="card-subtitle">{filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''} trouvé{filteredDocs.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="ged-library-controls">
                        <div className="ged-search-box">
                            <Search size={16} className="ged-search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher un document..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="ged-search-input"
                                id="ged-search"
                            />
                            {search && (
                                <button className="ged-search-clear" onClick={() => setSearch('')}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <div className="ged-view-toggle">
                            <button
                                className={`ged-view-btn ${viewMode === 'grid' ? 'ged-view-btn--active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Vue grille"
                                id="ged-view-grid"
                            >
                                <Grid size={18} />
                            </button>
                            <button
                                className={`ged-view-btn ${viewMode === 'list' ? 'ged-view-btn--active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="Vue liste"
                                id="ged-view-list"
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="ged-category-tabs">
                    {FILE_CATEGORIES.map(cat => {
                        const count = cat.key === 'all' ? documents.length : (categoryCounts[cat.key] || 0);
                        return (
                            <button
                                key={cat.key}
                                className={`ged-category-tab ${activeCategory === cat.key ? 'ged-category-tab--active' : ''}`}
                                onClick={() => setActiveCategory(cat.key)}
                                id={`ged-cat-${cat.key}`}
                            >
                                <cat.icon size={16} />
                                <span>{cat.label}</span>
                                <span className="ged-category-count">{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="ged-loading">
                        <div className="spinner" style={{ width: 32, height: 32 }} />
                        <p>Chargement des documents...</p>
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="empty-state" style={{ padding: '48px 24px' }}>
                        <FolderOpen size={56} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: 16 }} />
                        <p className="empty-state-title">
                            {search ? 'Aucun résultat' : 'Aucun document'}
                        </p>
                        <p className="empty-state-text">
                            {search
                                ? `Aucun document ne correspond à "${search}"`
                                : 'Commencez par uploader des fichiers dans la zone ci-dessus'
                            }
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="ged-doc-grid">
                        {filteredDocs.map(doc => (
                            <DocumentCard
                                key={doc.id}
                                doc={doc}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                canDelete={isAdmin() || true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="table-container" style={{ border: 'none' }}>
                        <table className="table ged-table">
                            <thead>
                                <tr>
                                    <th>Nom du fichier</th>
                                    <th>Taille</th>
                                    <th>Date</th>
                                    <th>Uploadé par</th>
                                    <th style={{ width: 100 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDocs.map(doc => (
                                    <DocumentRow
                                        key={doc.id}
                                        doc={doc}
                                        onDownload={handleDownload}
                                        onDelete={handleDelete}
                                        canDelete={isAdmin() || true}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
