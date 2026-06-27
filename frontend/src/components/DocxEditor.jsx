import React, { useState, useEffect, useRef } from 'react';
import { 
    Bold, Italic, Save, FileType, Printer, 
    Maximize, Download, Undo, Redo, Type 
} from 'lucide-react';
import './DocxEditor.css'; // On va créer un style "Page"

export default function DocxEditor({ initialContent, onChange, readOnly = false }) {
    const editorRef = useRef(null);

    // Fonction pour sauvegarder le contenu vers ton format final
    const handleSave = () => {
        const content = editorRef.current.innerHTML;
        onChange(content);
    };

    return (
        <div className="docx-editor-container">
            {/* Barre d'outils style Office */}
            <div className="docx-toolbar">
                <div className="toolbar-group">
                    <button type="button" className="t-btn" onClick={() => document.execCommand('bold')}><Bold size={16}/></button>
                    <button type="button" className="t-btn" onClick={() => document.execCommand('italic')}><Italic size={16}/></button>
                    <button type="button" className="t-btn" onClick={() => document.execCommand('underline')}><Type size={16}/></button>
                </div>
                
                <div className="toolbar-divider" />
                
                <div className="toolbar-group">
                    <select className="t-select" onChange={(e) => document.execCommand('formatBlock', false, e.target.value)}>
                        <option value="p">Texte normal</option>
                        <option value="h1">Titre 1</option>
                        <option value="h2">Titre 2</option>
                    </select>
                </div>

                <div className="toolbar-status">
                    <span className="badge">Format DOCX compatible</span>
                </div>
            </div>

            {/* Zone d'édition style "Feuille A4" */}
            <div className="docx-viewport">
                <div 
                    ref={editorRef}
                    className="docx-page"
                    contentEditable={!readOnly}
                    onInput={handleSave}
                    suppressContentEditableWarning={true}
                >
                    {/* Le contenu est injecté ici */}
                    <div dangerouslySetInnerHTML={{ __html: initialContent }} />
                </div>
            </div>

            {/* Pied de page de l'éditeur */}
            <div className="docx-footer">
                <span>Variables : {'{nom_employe}'}, {'{date_contrat}'}</span>
                <span>Page 1 sur 1</span>
            </div>
        </div>
    );
}