import { useState, useEffect } from 'react';
import { X, FileSignature, Loader, Save, Upload } from 'lucide-react';
import TipTapEditor from '../components/TipTapEditor';
import mammoth from "mammoth";
import DOMPurify from "dompurify";

/* ── Catégories ── */
const CATEGORIES = [
    { value: 'employe', label: 'Employé' },
    { value: 'chantier', label: 'Chantier' },
    { value: 'prestation', label: 'Prestation' },
    { value: 'autre', label: 'Autre' },
];

/* ── FONCTION D'OPTIMISATION DES IMAGES ── */
const resizeImage = (base64Str, maxWidth = 800) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = maxWidth / img.width;
            if (scale >= 1) return resolve(base64Str);

            canvas.width = maxWidth;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => resolve(base64Str); 
    });
};

export default function TemplateModal({ isOpen, onClose, onSubmit, initialData }) {
    const [formData, setFormData] = useState({
        name: '',
        category: 'employe',
        description: '',
        content: null, // IMPORTANT: Utiliser null (et non '') pour le JSON
        is_active: true
    });

    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                category: initialData.category || 'employe',
                description: initialData.description || '',
                // On s'assure de récupérer l'objet JSON tel quel
                content: initialData.content || null, 
                is_active: initialData.is_active !== false,
            });
        } else {
            setFormData({
                name: '',
                category: 'employe',
                description: '',
                content: null,
                is_active: true
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    /* ── IMPORT DOCX ── */
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            
            const options = {
                convertImage: mammoth.images.inline((element) => {
                    return element.read("base64").then(async (imageBuffer) => {
                        const fullBase64 = `data:${element.contentType};base64,${imageBuffer}`;
                        const optimizedBase64 = await resizeImage(fullBase64, 800);
                        return { src: optimizedBase64 };
                    });
                })
            };
            
            const result = await mammoth.convertToHtml({ arrayBuffer }, options);
            
            const html = DOMPurify.sanitize(result.value, { 
                ADD_TAGS: ["img", "table", "tr", "td", "th", "tbody", "thead"],
                ADD_ATTR: ["src", "alt", "width", "height"],
                ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i 
            });
            
            // CORRECTION CRITIQUE : Au lieu d'additionner un objet et du texte,
            // on remplace le contenu par le HTML pur. 
            // TipTap va l'ingérer, le parser, et ressortir du JSON proprement.
            setFormData(prev => ({
                ...prev,
                content: html 
            }));

        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'import");
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

    /* ── SUBMIT ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSubmit(formData);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div
                className="modal"
                style={{ maxWidth: 900, width: '95vw', height: '90vh', display: 'flex', flexDirection: 'column' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="modal-title">
                        <FileSignature size={20} />
                        {initialData ? 'Modifier le modèle' : 'Nouveau modèle'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="modal-body" style={{ flex: 1, overflow: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <input
                                className="form-input"
                                placeholder="Nom du modèle"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />

                            <select
                                className="form-input"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <input
                            className="form-input"
                            placeholder="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            style={{ marginBottom: 16 }}
                        />

                        <div style={{ marginBottom: 12 }}>
                            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                                <Upload size={16} style={{ marginRight: 6 }} />
                                {importing ? 'Import en cours...' : 'Importer un DOCX (Écrase le contenu actuel)'}
                                <input
                                    type="file"
                                    accept=".docx"
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                       
                        <TipTapEditor
                            content={formData.content}
                            // L'éditeur nous renvoie maintenant un objet JSON
                            onChange={(jsonContent) => setFormData({ ...formData, content: jsonContent })}
                            placeholder="Rédigez votre contrat..."
                            minHeight={380}
                        />
                    </div>

                    <div className="modal-footer">
                        <label style={{ marginRight: 'auto' }}>
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            Actif
                        </label>

                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Annuler
                        </button>

                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <Loader size={16} /> : <Save size={16} />}
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}