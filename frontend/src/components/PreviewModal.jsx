import React from 'react';
import { X, Edit, FileText, Calendar, Tag, CheckCircle, AlertCircle } from 'lucide-react';

export default function PreviewModal({ template, onClose, onEdit }) {
    if (!template) return null;

    return (
        <div className="modal-overlay active">
            <div className="modal-container" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <FileText size={20} className="text-primary" /> 
                        Détails du modèle
                    </h2>
                    <button className="btn-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <div className="mb-4">
                        <label className="text-muted small text-uppercase fw-bold">Nom du document</label>
                        <h4 className="mb-0">{template.name}</h4>
                    </div>

                    <div className="row g-3 mb-4">
                        <div className="col-6">
                            <label className="text-muted small text-uppercase fw-bold">Catégorie</label>
                            <div className="d-flex align-items-center gap-2 mt-1">
                                <Tag size={16} className="text-muted" />
                                <span className="badge bg-light text-primary border text-capitalize">
                                    {template.category}
                                </span>
                            </div>
                        </div>
                        <div className="col-6">
                            <label className="text-muted small text-uppercase fw-bold">Statut</label>
                            <div className="d-flex align-items-center gap-2 mt-1">
                                {template.is_active ? (
                                    <><CheckCircle size={16} className="text-success" /> <span className="text-success">Actif</span></>
                                ) : (
                                    <><AlertCircle size={16} className="text-muted" /> <span className="text-muted">Inactif</span></>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-muted small text-uppercase fw-bold">Description</label>
                        <p className="mt-1 text-secondary">
                            {template.description || "Aucune description fournie pour ce modèle."}
                        </p>
                    </div>

                    {template.created_at && (
                        <div className="p-3 bg-light rounded d-flex align-items-center gap-3">
                            <Calendar size={18} className="text-muted" />
                            <div>
                                <div className="small text-muted">Créé le</div>
                                <div className="fw-medium">{new Date(template.created_at).toLocaleDateString('fr-FR')}</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Fermer</button>
                    <button 
                        type="button" 
                        className="btn btn-primary" 
                        onClick={() => {
                            onEdit(template);
                            onClose();
                        }}
                    >
                        <Edit size={16} /> Modifier le contenu
                    </button>
                </div>
            </div>
        </div>
    );
}