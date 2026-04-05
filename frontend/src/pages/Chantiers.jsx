import { useState } from 'react';
import { Plus, Search, Filter, Calendar, MapPin, Users, DollarSign, ExternalLink, X, FileText, Edit, Trash2 } from 'lucide-react';
import GedManager from '../components/GedManager';

const initialChantiers = [
    {
        id: 1,
        reference: 'CH-2024-001',
        name: 'Rénovation Route D47',
        client: 'Mairie de Lyon',
        clientId: 1,
        location: 'Lyon (69)',
        address: '123 Route Départementale 47, 69000 Lyon',
        startDate: '2024-01-15',
        endDate: '2024-06-30',
        status: 'En cours',
        progress: 75,
        budget: 450000,
        description: 'Réfection complète du revêtement et des bordures sur 2.5km',
        teamSize: 12,
        equipment: ['Pelleteuse x2', 'Compacteur', 'Camions x4']
    },
    {
        id: 2,
        reference: 'CH-2024-002',
        name: 'Terrassement Zone Industrielle',
        client: 'SCI Batinord',
        clientId: 2,
        location: 'Villeurbanne (69)',
        address: '45 Zone Industrielle Nord, 69100 Villeurbanne',
        startDate: '2024-02-01',
        endDate: '2024-08-15',
        status: 'En cours',
        progress: 45,
        budget: 280000,
        description: 'Terrassement et nivellement pour nouvelle zone commerciale',
        teamSize: 8,
        equipment: ['Bulldozer', 'Pelleteuse x3', 'Tombereaux x6']
    },
    {
        id: 3,
        reference: 'CH-2024-003',
        name: 'Voirie Lotissement Les Pins',
        client: 'Bouygues Immobilier',
        clientId: 3,
        location: 'Caluire (69)',
        address: 'Lotissement Les Pins, 69300 Caluire-et-Cuire',
        startDate: '2024-04-01',
        endDate: '2024-09-30',
        status: 'Planifié',
        progress: 0,
        budget: 520000,
        description: 'Création des voiries et réseaux pour nouveau lotissement 85 lots',
        teamSize: 15,
        equipment: ['Pelleteuse x2', 'Compacteurs x2', 'Finisseur']
    },
    {
        id: 4,
        reference: 'CH-2024-004',
        name: 'Assainissement Quartier Sud',
        client: 'Métropole de Lyon',
        clientId: 4,
        location: 'Vénissieux (69)',
        address: 'Quartier Sud, 69200 Vénissieux',
        startDate: '2023-10-01',
        endDate: '2024-03-15',
        status: 'En cours',
        progress: 90,
        budget: 380000,
        description: 'Rénovation du réseau d\'assainissement et création bassin de rétention',
        teamSize: 10,
        equipment: ['Mini-pelle x2', 'Aspiratrice', 'Camions x3']
    },
    {
        id: 5,
        reference: 'CH-2024-005',
        name: 'Parking Centre Commercial',
        client: 'Carrefour Property',
        clientId: 5,
        location: 'Bron (69)',
        address: 'Centre Commercial Porte des Alpes, 69500 Bron',
        startDate: '2023-08-15',
        endDate: '2024-01-31',
        status: 'Terminé',
        progress: 100,
        budget: 320000,
        description: 'Extension parking 200 places avec éclairage LED',
        teamSize: 8,
        equipment: ['Pelleteuse', 'Compacteur', 'Finisseur']
    }
];

function Chantiers() {
    const [chantiers, setChantiers] = useState(initialChantiers);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingChantier, setEditingChantier] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [formData, setFormData] = useState({
        name: '',
        client: '',
        location: '',
        address: '',
        startDate: '',
        endDate: '',
        budget: '',
        description: '',
        status: 'Planifié'
    });

    const getStatusBadge = (status) => {
        const statusMap = {
            'En cours': 'badge-success',
            'Planifié': 'badge-warning',
            'Terminé': 'badge-info',
            'En retard': 'badge-danger',
            'Suspendu': 'badge-danger'
        };
        return statusMap[status] || 'badge-primary';
    };

    const filteredChantiers = chantiers.filter(chantier => {
        const matchesSearch = chantier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            chantier.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
            chantier.reference.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || chantier.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingChantier) {
            setChantiers(chantiers.map(c =>
                c.id === editingChantier.id
                    ? { ...c, ...formData, budget: parseFloat(formData.budget) }
                    : c
            ));
        } else {
            const newChantier = {
                id: Math.max(...chantiers.map(c => c.id)) + 1,
                reference: `CH-2024-${String(chantiers.length + 1).padStart(3, '0')}`,
                ...formData,
                budget: parseFloat(formData.budget),
                progress: 0,
                teamSize: 0,
                equipment: []
            };
            setChantiers([...chantiers, newChantier]);
        }
        closeModal();
    };

    const openModal = (chantier = null) => {
        setEditingChantier(chantier);
        setActiveTab('details');
        if (chantier) {
            setFormData({
                name: chantier.name,
                client: chantier.client,
                location: chantier.location,
                address: chantier.address,
                startDate: chantier.startDate,
                endDate: chantier.endDate,
                budget: chantier.budget.toString(),
                description: chantier.description,
                status: chantier.status
            });
        } else {
            setFormData({
                name: '',
                client: '',
                location: '',
                address: '',
                startDate: '',
                endDate: '',
                budget: '',
                description: '',
                status: 'Planifié'
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingChantier(null);
        setActiveTab('details');
    };

    const deleteChantier = (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce chantier ?')) {
            setChantiers(chantiers.filter(c => c.id !== id));
        }
    };

    return (
        <div>
            {/* Header Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div className="search-box" style={{ width: '300px' }}>
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Rechercher un chantier..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-input form-select"
                        style={{ width: '180px' }}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="En cours">En cours</option>
                        <option value="Planifié">Planifié</option>
                        <option value="Terminé">Terminé</option>
                        <option value="Suspendu">Suspendu</option>
                    </select>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    Nouveau Chantier
                </button>
            </div>

            {/* Chantiers Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                {filteredChantiers.map((chantier) => (
                    <div key={chantier.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        {/* Card Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))',
                            padding: '20px',
                            borderBottom: '1px solid var(--border-color)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--primary-400)', fontWeight: 600, marginBottom: '4px' }}>
                                        {chantier.reference}
                                    </div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                                        {chantier.name}
                                    </h3>
                                    <span className={`badge ${getStatusBadge(chantier.status)}`}>
                                        {chantier.status}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openModal(chantier)}>
                                        <Edit size={16} />
                                    </button>
                                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteChantier(chantier.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                                    <MapPin size={16} />
                                    <span>{chantier.location}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                                    <Calendar size={16} />
                                    <span>{new Date(chantier.startDate).toLocaleDateString('fr-FR')} - {new Date(chantier.endDate).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                                    <Users size={16} />
                                    <span>{chantier.teamSize} personnes affectées</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                                    <DollarSign size={16} />
                                    <span style={{ fontWeight: 600, color: 'var(--primary-400)' }}>
                                        {chantier.budget.toLocaleString()}€
                                    </span>
                                </div>
                            </div>

                            {/* Progress */}
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Progression</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{chantier.progress}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${chantier.progress}%` }} />
                                </div>
                            </div>

                            {/* Client */}
                            <div style={{
                                marginTop: '16px',
                                padding: '12px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--border-radius-sm)',
                                fontSize: '13px'
                            }}>
                                <span style={{ color: 'var(--text-muted)' }}>Client: </span>
                                <span style={{ fontWeight: 500 }}>{chantier.client}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredChantiers.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <Search size={80} />
                    </div>
                    <h3 className="empty-state-title">Aucun chantier trouvé</h3>
                    <p className="empty-state-text">
                        Modifiez vos critères de recherche ou créez un nouveau chantier.
                    </p>
                </div>
            )}

            {/* Modal */}
            <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={closeModal}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">
                            {editingChantier ? 'Modifier le Chantier' : 'Nouveau Chantier'}
                        </h2>
                        <button className="modal-close" onClick={closeModal}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex gap-4 border-b border-neutral-700 mb-6 mt-4 px-6">
                        <button
                            className={`pb-2 px-1 ${activeTab === 'details' ? 'border-b-2 border-primary-500 text-white' : 'text-neutral-400 hover:text-white'}`}
                            onClick={() => setActiveTab('details')}
                        >
                            Détails
                        </button>
                        <button
                            className={`pb-2 px-1 ${activeTab === 'equipe' ? 'border-b-2 border-primary-500 text-white' : 'text-neutral-400 hover:text-white'}`}
                            onClick={() => setActiveTab('equipe')}
                        >
                            Équipe
                        </button>
                        <button
                            className={`pb-2 px-1 ${activeTab === 'documents' ? 'border-b-2 border-primary-500 text-white flex items-center gap-2' : 'text-neutral-400 hover:text-white flex items-center gap-2'}`}
                            onClick={() => setActiveTab('documents')}
                        >
                            <FileText className="w-4 h-4" />
                            Documents
                        </button>
                    </div>

                    <div className="px-6 pb-6">
                        {activeTab === 'details' && (
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div className="form-group">
                                        <label className="form-label">Nom du chantier</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Ex: Rénovation Route D47"
                                            required
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Client</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.client}
                                                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                                placeholder="Nom du client"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Statut</label>
                                            <select
                                                className="form-input form-select"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            >
                                                <option value="Planifié">Planifié</option>
                                                <option value="En cours">En cours</option>
                                                <option value="Terminé">Terminé</option>
                                                <option value="Suspendu">Suspendu</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Localisation</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="Ville (Département)"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Adresse complète</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Adresse du chantier"
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Date de début</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Date de fin</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Budget (€)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.budget}
                                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                            placeholder="Budget estimé"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-input"
                                            rows="3"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Description des travaux..."
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                            Annuler
                                        </button>
                                        <button type="submit" className="btn btn-primary">
                                            {editingChantier ? 'Enregistrer' : 'Créer'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {activeTab === 'equipe' && (
                            <div className="text-center py-8 text-neutral-400">
                                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Fonctionnalité de gestion d'équipe à venir</p>
                            </div>
                        )}

                        {activeTab === 'documents' && editingChantier && (
                            <GedManager modelType="chantier" modelId={editingChantier.id} />
                        )}
                        {activeTab === 'documents' && !editingChantier && (
                            <div className="text-center py-8 text-neutral-400">
                                <p>Veuillez d'abord créer le chantier avant d'ajouter des documents.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chantiers;
