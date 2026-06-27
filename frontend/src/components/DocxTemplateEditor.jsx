import React, { useEffect, useRef, useState } from 'react';
import { Upload, Download, FileText, RefreshCw, Eye } from 'lucide-react';
import { renderAsync } from 'docx-preview'; // Nécessite: npm install docx-preview
import './TipTapEditor.css'; // On garde votre CSS original

export default function DocxTemplateEditor({ file, onFileChange, readOnly, minHeight = 400 }) {
    const previewRef = useRef(null);
    const [loading, setLoading] = useState(false);

    // Fonction pour générer la visualisation du DOCX
    const updatePreview = async (blob) => {
        if (!blob || !previewRef.current) return;
        setLoading(true);
        try {
            await renderAsync(blob, previewRef.current, previewRef.current, {
                className: "docx-render",
                inWrapper: false,
                ignoreWidth: false,
                ignoreHeight: false,
            });
        } catch (e) {
            console.error("Erreur de prévisualisation DOCX", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (file) {
            // Si c'est une URL (existant) ou un objet File (nouveau)
            if (typeof file === 'string') {
                fetch(file).then(res => res.blob()).then(updatePreview);
            } else {
                updatePreview(file);
            }
        }
    }, [file]);

    return (
        <div className="tiptap-wrapper">
            {!readOnly && (
                <div className="tiptap-toolbar">
                    <button 
                        type="button" 
                        className="tiptap-toolbar-btn" 
                        onClick={() => document.getElementById('docx-upload').click()}
                        title="Remplacer le modèle"
                    >
                        <Upload size={18} />
                        <span style={{marginLeft: 8, fontSize: 13}}>Charger DOCX</span>
                    </button>
                    
                    <div className="tiptap-divider" />
                    
                    {file && (
                        <button 
                            type="button" 
                            className="tiptap-toolbar-btn"
                            onClick={() => {
                                const url = typeof file === 'string' ? file : URL.createObjectURL(file);
                                window.open(url, '_blank');
                            }}
                        >
                            <Download size={18} />
                            <span style={{marginLeft: 8, fontSize: 13}}>Télécharger</span>
                        </button>
                    )}

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, paddingRight: 10 }}>
                        {loading && <RefreshCw size={14} className="spin" />}
                        <span className="text-muted" style={{ fontSize: 11 }}>Mode DOCX (Génération via react-docx)</span>
                    </div>
                </div>
            )}

            <input 
                id="docx-upload"
                type="file" 
                accept=".docx" 
                style={{ display: 'none' }} 
                onChange={(e) => onFileChange(e.target.files[0])}
            />

            <div 
                className="tiptap-content" 
                style={{ 
                    minHeight, 
                    overflowY: 'auto', 
                    background: '#f0f0f0',
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '20px'
                }}
            >
                {file ? (
                    <div 
                        ref={previewRef} 
                        style={{ 
                            background: 'white', 
                            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                            width: '100%',
                            maxWidth: '800px',
                            minHeight: '100%'
                        }} 
                    />
                ) : (
                    <div style={{ textAlign: 'center', margin: 'auto', color: '#999' }}>
                        <FileText size={48} style={{ opacity: 0.2, marginBottom: 10 }} />
                        <p>Aucun fichier sélectionné</p>
                        <button 
                            type="button" 
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => document.getElementById('docx-upload').click()}
                        >
                            Importer un modèle Word
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}