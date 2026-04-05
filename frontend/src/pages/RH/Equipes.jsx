import { useState, useEffect } from 'react';
import { rhApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, Edit, Trash2, UserPlus, UserMinus, Loader, X } from 'lucide-react';
import '../../index.css';

export default function Equipes() {
    const { user } = useAuth();
    const [teams, setTeams] = useState([]);
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        manager_id: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Charger les équipes
            const teamsRes = await rhApi.getTeams();
            setTeams(teamsRes.data);

            // Charger tous les employés (pour sélection manager)
            const employesRes = await rhApi.getAllEmployes();
            setEmployes(employesRes.data);

        } catch (error) {
            console.error('Erreur chargement données:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (selectedTeam) {
                // Modification
                await rhApi.updateTeam(selectedTeam.id, formData);
                alert('Équipe modifiée avec succès !');
            } else {
                // Création
                await rhApi.createTeam(formData);
                alert('Équipe créée avec succès !');
            }

            setFormData({ name: '', description: '', manager_id: '' });
            setSelectedTeam(null);
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error('Erreur:', error);
            alert(error.response?.data?.message || 'Erreur lors de l\'opération');
        }
    };

    const handleEdit = (team) => {
        setSelectedTeam(team);
        setFormData({
            name: team.name,
            description: team.description || '',
            manager_id: team.manager_id || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (teamId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette équipe ?')) return;

        try {
            await rhApi.deleteTeam(teamId);
            fetchData();
            alert('Équipe supprimée avec succès');
        } catch (error) {
            console.error('Erreur suppression:', error);
            alert('Erreur lors de la suppression');
        }
    };

    const handleViewMembers = async (team) => {
        try {
            setSelectedTeam(team);
            const res = await rhApi.getTeamMembers(team.id);
            setTeamMembers(res.data.members || []);
            setShowMembersModal(true);
        } catch (error) {
            console.error('Erreur chargement membres:', error);
            alert('Erreur lors du chargement des membres');
        }
    };

    const handleAddMember = async (teamId) => {
        const employeId = prompt('ID de l\'employé à ajouter:');
        if (!employeId) return;

        try {
            await rhApi.addTeamMember(teamId, parseInt(employeId));
            alert('Membre ajouté avec succès !');

            // Recharger les membres si le modal est ouvert
            if (showMembersModal && selectedTeam?.id === teamId) {
                handleViewMembers(selectedTeam);
            }
        } catch (error) {
            console.error('Erreur ajout membre:', error);
            alert(error.response?.data?.message || 'Erreur lors de l\'ajout');
        }
    };

    const handleRemoveMember = async (teamId, employeId) => {
        if (!confirm('Retirer ce membre de l\'équipe ?')) return;

        try {
            await rhApi.removeTeamMember(teamId, employeId);
            alert('Membre retiré');

            // Recharger les membres
            if (showMembersModal && selectedTeam?.id === teamId) {
                handleViewMembers(selectedTeam);
            }
        } catch (error) {
            console.error('Erreur retrait membre:', error);
            alert('Erreur lors du retrait');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="animate-spin" size={48} />
            </div>
        );
    }

    return (
        <div className="container-custom">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestion des Équipes</h1>
                    <p className="page-subtitle">Créez et gérez les équipes de votre entreprise</p>
                </div>
                <button onClick={() => { setSelectedTeam(null); setShowModal(true); }} className="btn-primary">
                    <Plus size={20} />
                    Nouvelle équipe
                </button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card-modern">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="text-primary" size={24} />
                        <h3 className="font-semibold text-gray-800">Total Équipes</h3>
                    </div>
                    <p className="text-3xl font-bold text-primary">{teams.length}</p>
                </div>
            </div>

            {/* Liste des équipes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                    <div key={team.id} className="card-modern card-hover">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary bg-opacity-10 rounded-lg">
                                    <Users className="text-primary" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{team.name}</h3>
                                    <p className="text-sm text-gray-600">{team.members_count || 0} membre(s)</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(team)} className="btn-icon text-blue-600">
                                    <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(team.id)} className="btn-icon text-red-600">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {team.description && (
                            <p className="text-sm text-gray-600 mb-4">{team.description}</p>
                        )}

                        {team.manager && (
                            <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded">
                                <span className="text-xs font-medium text-gray-600">Manager:</span>
                                <span className="text-sm font-semibold">{team.manager.full_name}</span>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleViewMembers(team)}
                                className="btn-secondary text-sm flex-1"
                            >
                                Voir membres
                            </button>
                            <button
                                onClick={() => handleAddMember(team.id)}
                                className="btn-primary text-sm"
                            >
                                <UserPlus size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {teams.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <Users size={64} className="mx-auto mb-4 opacity-50" />
                        <p>Aucune équipe créée</p>
                    </div>
                )}
            </div>

            {/* Modal Créer/Modifier Équipe */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-2xl font-bold">
                                {selectedTeam ? 'Modifier l\'équipe' : 'Nouvelle équipe'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="btn-icon">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Nom de l'équipe</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                    placeholder="Description de l'équipe..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Manager</label>
                                <select
                                    className="form-input"
                                    value={formData.manager_id}
                                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                                >
                                    <option value="">Aucun manager</option>
                                    {employes.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.full_name} - {emp.job_title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                    Annuler
                                </button>
                                <button type="submit" className="btn-primary">
                                    {selectedTeam ? 'Modifier' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Membres */}
            {showMembersModal && selectedTeam && (
                <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-2xl font-bold">Membres de {selectedTeam.name}</h2>
                            <button onClick={() => setShowMembersModal(false)} className="btn-icon">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {teamMembers.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Users size={48} className="mx-auto mb-3 opacity-50" />
                                    <p>Aucun membre dans cette équipe</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {teamMembers.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                            <div>
                                                <p className="font-semibold">{member.full_name}</p>
                                                <p className="text-sm text-gray-600">{member.job_title}</p>
                                                <p className="text-xs text-gray-500">
                                                    Membre depuis: {new Date(member.joined_at).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveMember(selectedTeam.id, member.id)}
                                                className="btn-error text-sm"
                                            >
                                                <UserMinus size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
