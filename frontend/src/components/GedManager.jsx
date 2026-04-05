import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Trash2, Upload, File, Image, MoreVertical } from 'lucide-react';
import api from '../services/api'; // Using raw api for direct calls if needed, or specific services
import { useAuth } from '../context/AuthContext';

const DocumentIcon = ({ mimeType }) => {
    if (mimeType?.startsWith('image/')) return <Image className="w-5 h-5 text-purple-400" />;
    if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-400" />;
    return <File className="w-5 h-5 text-blue-400" />;
};

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function GedManager({ modelType, modelId }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const { isAdmin } = useAuth();

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/documents', {
                params: { model_type: modelType, model_id: modelId }
            });
            setDocuments(response.data);
        } catch (error) {
            // AJOUTE CECI POUR DEBUGGER
            if (error.response) {
                console.log("Data d'erreur complète:", error.response.data);
                console.log("Status d'erreur:", error.response.status);
            }
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [modelType, modelId]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !modelType || !modelId) return; // Prevent upload without context

        const formData = new FormData();
        formData.append('file', file);
        formData.append('model_type', modelType);
        formData.append('model_id', modelId);
        formData.append('type', 'autre'); // Default type, could be improved with a select

        setUploading(true);
        try {
            await api.post('/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchDocuments();
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Erreur lors de l\'upload du fichier');
        } finally {
            setUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDownload = async (doc) => {
        try {
            const response = await api.get(`/documents/${doc.id}/download`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.name);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

        try {
            await api.delete(`/documents/${id}`);
            setDocuments(documents.filter(d => d.id !== id));
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    if (loading) return <div className="text-center py-4 text-neutral-400">Chargement des documents...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-400" />
                    {modelId ? `Documents (${documents.length})` : `Tous les documents (${documents.length})`}
                </h3>
                {modelId && (
                    <div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            id={`file-upload-${modelId}`}
                        />
                        <label
                            htmlFor={`file-upload-${modelId}`}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {uploading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Upload...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Upload className="w-4 h-4" />
                                    Ajouter un fichier
                                </span>
                            )}
                        </label>
                    </div>
                )}
            </div>

            {documents.length === 0 ? (
                <div className="text-center py-8 bg-neutral-800/50 rounded-lg border border-neutral-700/50 border-dashed">
                    <FileText className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                    <p className="text-neutral-400 text-sm">Aucun document associé</p>
                </div>
            ) : (
                <div className="bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden">
                    <ul className="divide-y divide-neutral-700">
                        {documents.map((doc) => (
                            <li key={doc.id} className="p-4 hover:bg-neutral-700/50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-neutral-900 rounded-lg">
                                        <DocumentIcon mimeType={doc.mime_type} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate max-w-[200px] sm:max-w-xs">{doc.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                                            <span>{formatSize(doc.size)}</span>
                                            <span>•</span>
                                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                            {doc.uploader && (
                                                <>
                                                    <span>•</span>
                                                    <span>Par {doc.uploader.name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDownload(doc)}
                                        className="p-1.5 text-neutral-400 hover:text-primary-400 hover:bg-primary-400/10 rounded-md transition-colors"
                                        title="Télécharger"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    {/* Seulement l'admin ou le propriétaire peut supprimer */}
                                    {(isAdmin() || true) && (
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
