import { useState, useEffect } from 'react';
import { X, FileSignature, Loader, Save, Upload } from 'lucide-react';
import OnlyOfficeEditor from '../components/OnlyOfficeEditor';

export default function TemplateModal({ isOpen, onClose, onSubmit, initialData }) {
    const [formData, setFormData] = useState({
        name: '',
        category: 'employe',
        description: '',
        docUrl: '/blank.docx', // Par défaut : feuille vierge
        is_active: true
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    ...initialData,
                    docUrl: initialData.docUrl || '/blank.docx'
                });
            } else {
                setFormData({
                    name: '',
                    category: 'employe',
                    description: '',
                    docUrl: '/blank.docx',
                    is_active: true
                });
            }
        }
    }, [initialData, isOpen]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const data = new FormData();
        data.append("file", file);

        try {
            const res = await fetch("/api/documents/upload", { method: "POST", body: data });
            const result = await res.json();
            setFormData(prev => ({ ...prev, docUrl: result.url }));
        } catch (err) {
            alert("Erreur lors de l'import");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSubmit(formData);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active">
            <div className="modal-container modal-xl" style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2 className="modal-title"><FileSignature size={20} /> Modèle de document</h2>
                    <button className="btn-close" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="modal-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <input 
                                className="form-control" 
                                placeholder="Nom" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                required 
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select 
                                    className="form-control" 
                                    value={formData.category} 
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    <option value="employe">Employé</option>
                                    <option value="chantier">Chantier</option>
                                </select>
                                <label className="btn btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    <Upload size={16} /> Importer
                                    <input type="file" accept=".docx" onChange={handleFileUpload} hidden />
                                </label>
                            </div>
                        </div>

                        {/* L'ÉDITEUR PREND TOUTE LA PLACE */}
                        <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                            <OnlyOfficeEditor docUrl={formData.docUrl} />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? <Loader size={16} className="spinner" /> : <Save size={16} />} Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}