import { useState } from 'react';
import { Save, ArrowLeft, Upload, Loader } from 'lucide-react';
import OnlyOfficeEditor from '../components/OnlyOfficeEditor';
import api from '../services/api'; 

export default function TemplateEditorPage({ initialData, onBack }) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        category: initialData?.category || 'employe',
        description: initialData?.description || '',
        docUrl: initialData?.docUrl || '/blank.docx',
    });
    
    const [saving, setSaving] = useState(false);

    // 1. Déclenche la préparation du document par OnlyOffice
    const triggerSave = () => {
        if (!formData.name.trim()) return alert("Le nom est obligatoire.");
        setSaving(true);
        
        if (window.docEditor) {
            window.docEditor.downloadAs(); // Va déclencher l'événement onDownload
        } else {
            setSaving(false);
        }
    };

    // 2. Récupère le document, et l'envoie avec les infos à Laravel
    const handleDownloadComplete = async (eventData) => {
        console.log("LOG: La fonction handleDownloadComplete est lancée !", eventData);
        setSaving(true);
        try {
           console.log("LOG: La fonction handleDownloadComplete est lancée !", eventData);
    
            let urlString = typeof eventData === 'string' ? eventData : eventData?.url;
            if (!urlString) throw new Error("URL manquante...");

            // 💡 TRADUCTION DE L'URL POUR PASSER PAR LE PROXY NGINX SANS CORS
            if (urlString.includes('http://localhost:8081/')) {
                urlString = urlString.replace('http://localhost:8081/', 'http://localhost/onlyoffice-download/');
            }

            console.log("LOG: Fetch final sur l'URL proxyfiée :", urlString);

            const response = await fetch(urlString);
            const blob = await response.blob();

            // Téléchargement du binaire
            
            const finalFile = new File([blob], 
                `${formData.name || 'modele'}.docx`, 
                { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
            );

            // Préparation du formulaire d'envoi
            const dataToSubmit = new FormData();
            dataToSubmit.append('name', formData.name);
            dataToSubmit.append('category', formData.category);
            dataToSubmit.append('description', formData.description || '');
            dataToSubmit.append('file', finalFile);

            if (initialData?.id) {
                // ASTUCE LARAVEL : On simule un PUT via un POST pour envoyer des fichiers
                dataToSubmit.append('_method', 'PUT'); 
                await api.post(`/contract-templates/${initialData.id}`, dataToSubmit, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/contract-templates', dataToSubmit, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            alert("Modèle sauvegardé avec succès dans la GED !");
            if (onBack) onBack(); // Retourne à la liste
        } catch (error) {
            console.error("Erreur d'enregistrement:", error);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'var(--slate-800)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
            <div className="main-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                    <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div style={{ width: '300px' }}>
                        <input className="form-input" style={{ margin: 0 }} placeholder="Nom du modèle" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                </div>

                <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary" onClick={triggerSave} disabled={saving}>
                        {saving ? <Loader size={18} className="spinner" /> : <Save size={18} />}
                        Enregistrer
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, backgroundColor: 'var(--slate-900)' }}>
                <OnlyOfficeEditor 
                    docUrl={formData.docUrl} 
                    title={formData.name || 'Nouveau Modèle'} 
                    onDownload={handleDownloadComplete}
                />
            </div>
        </div>
    );
}