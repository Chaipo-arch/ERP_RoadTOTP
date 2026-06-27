import { useState, useEffect } from 'react';
import { X, FileSignature, Loader, Save } from 'lucide-react';
import DocxTemplateEditor from './DocxTemplateEditor'; // Le nouveau composant

export default function TemplateModal({ isOpen, onClose, onSubmit, initialData }) {
    const [formData, setFormData] = useState({
        name: '',
        category: 'employe',
        description: '',
        is_active: true
    });
    const [docxFile, setDocxFile] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                category: initialData.category || 'employe',
                description: initialData.description || '',
                is_active: initialData.is_active ?? true
            });
            // Si on a déjà un document lié à la GED
            if (initialData.document) {
                setDocxFile(initialData.document.url); 
            }
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        // On récupère le contenu de l'éditeur (qui est maintenant du HTML "propre" et paginé)
        // Et on l'envoie au backend qui va le convertir en DOCX via php-word ou react-docx
        const data = {
            name: formData.name,
            category: formData.category,
            html_content: htmlContent, // Le contenu de la "page"
            is_template: true
        };

        try {
            await onSubmit(data); // Appel à ton API Laravel
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`modal ${isOpen ? 'is-open' : ''}`}>
            <div className="modal-content" style={{ maxWidth: '1000px' }}>
                <div className="modal-header">
                    <div className="title-with-icon">
                        <FileSignature size={20} />
                        <h2>{initialData ? 'Modifier le modèle DOCX' : 'Nouveau modèle DOCX'}</h2>
                    </div>
                    <button onClick={onClose} className="btn-close"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-row">
                            <div className="form-group flex-1">
                                <label className="form-label">Nom du modèle</label>
                                <input 
                                    className="form-input"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ width: '200px' }}>
                                <label className="form-label">Catégorie</label>
                                <select 
                                    className="form-input"
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    <option value="employe">Employé</option>
                                    <option value="chantier">Chantier</option>
                                    <option value="prestation">Prestation</option>
                                    <option value="autre">Autre</option>
                                </select>
                            </div>
                        </div>

                        {/* Utilisation de DocxTemplateEditor à la place de TipTap */}
                        <DocxTemplateEditor 
                            file={docxFile}
                            onFileChange={(file) => setDocxFile(file)}
                            minHeight={500}
                        />

                        <div className="help-text" style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
                             Utilisez des tags comme <code>{`{nom_client}`}</code> dans votre document Word pour la génération.
                        </div>
                    </div>

                    <div className="modal-footer">
                        <label className="toggle-label" style={{ marginRight: 'auto' }}>
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            <span>Modèle actif</span>
                        </label>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <Loader className="spin" size={16} /> : <Save size={16} />}
                            Enregistrer le modèle
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}