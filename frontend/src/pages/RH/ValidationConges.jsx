import { useState, useEffect } from 'react';
import { rhApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Check, X, Clock, Calendar, User, Loader, AlertCircle } from 'lucide-react';
import '../../index.css';

export default function ValidationConges() {
    const { user } = useAuth();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [subordinates, setSubordinates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentEmploye, setCurrentEmploye] = useState(null);
    const [filter, setFilter] = useState('all'); // all, my-team

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Récupérer l'employé manager actuel
            const employeResponse = await rhApi.getEmployeByUserId();
            const manager = employeResponse.data;
            setCurrentEmploye(manager);

            if (manager) {
                // Récupérer les subordonnés
                const subordinatesRes = await rhApi.getEmployeSubordinates(manager.id);
                setSubordinates(subordinatesRes.data.subordinates || subordinatesRes.data || []);

                // Récupérer les demandes en attente
                const requestsRes = await rhApi.getLeaveRequests({
                    status: 'pending',
                    manager_id: manager.id,
                });

                setPendingRequests(requestsRes.data.data || requestsRes.data || []);
            }
        } catch (error) {
            console.error('Erreur chargement données:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        if (!confirm('Êtes-vous sûr de vouloir approuver cette demande ?')) return;

        try {
            await rhApi.approveLeaveRequest(requestId);
            fetchData(); // Recharger
            alert('Demande approuvée avec succès !');
        } catch (error) {
            console.error('Erreur approbation:', error);
            alert(error.response?.data?.message || 'Erreur lors de l\'approbation');
        }
    };

    const handleReject = async (requestId) => {
        const reason = prompt('Motif du refus (optionnel):');
        if (reason === null) return; // Annulation

        try {
            await rhApi.rejectLeaveRequest(requestId, reason || undefined);
            fetchData(); // Recharger
            alert('Demande rejetée');
        } catch (error) {
            console.error('Erreur rejet:', error);
            alert(error.response?.data?.message || 'Erreur lors du rejet');
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
                    <h1 className="page-title">Validation des Congés</h1>
                    <p className="page-subtitle">Approuvez ou rejetez les demandes de votre équipe</p>
                </div>
                <div className="flex items-center gap-3">
                    <User size={20} className="text-gray-600" />
                    <span className="text-sm text-gray-600">
                        {subordinates.length} personne(s) sous votre responsabilité
                    </span>
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card-modern">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="text-warning" size={24} />
                        <h3 className="font-semibold text-gray-800">En attente</h3>
                    </div>
                    <p className="text-3xl font-bold text-warning">{pendingRequests.length}</p>
                    <p className="text-sm text-gray-500 mt-1">Demandes à traiter</p>
                </div>

                <div className="card-modern">
                    <div className="flex items-center gap-3 mb-2">
                        <User className="text-primary" size={24} />
                        <h3 className="font-semibold text-gray-800">Équipe</h3>
                    </div>
                    <p className="text-3xl font-bold text-primary">{subordinates.length}</p>
                    <p className="text-sm text-gray-500 mt-1">Collaborateurs</p>
                </div>

                <div className="card-modern">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="text-success" size={24} />
                        <h3 className="font-semibold text-gray-800">Ce mois</h3>
                    </div>
                    <p className="text-3xl font-bold text-success">
                        {pendingRequests.filter(r => {
                            const startDate = new Date(r.start_date);
                            const now = new Date();
                            return startDate.getMonth() === now.getMonth();
                        }).length}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Demandes du mois</p>
                </div>
            </div>

            {/* Liste des demandes en attente */}
            <div className="card-modern">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Demandes en attente</h2>
                    {pendingRequests.length > 0 && (
                        <span className="badge badge-warning">{pendingRequests.length} en attente</span>
                    )}
                </div>

                {pendingRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Check size={64} className="mx-auto mb-4 opacity-50 text-green-500" />
                        <p className="text-lg font-medium">Aucune demande en attente</p>
                        <p className="text-sm mt-2">Toutes les demandes ont été traitées</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingRequests.map((request) => (
                            <div key={request.id} className="card-hover p-6 border-2 border-gray-200 rounded-lg">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Employé */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-primary bg-opacity-10 rounded-lg">
                                                <User className="text-primary" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{request.employe?.full_name}</h3>
                                                <p className="text-sm text-gray-600">{request.employe?.job_title}</p>
                                            </div>
                                        </div>

                                        {/* Type de congé */}
                                        <div className="mb-3">
                                            <span className="badge badge-info text-sm">{request.leave_type?.name}</span>
                                        </div>

                                        {/* Dates */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} />
                                                <span>Du {new Date(request.start_date).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} />
                                                <span>Au {new Date(request.end_date).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} />
                                                <span className="font-semibold">{request.duration} jour(s)</span>
                                            </div>
                                        </div>

                                        {/* Motif */}
                                        {request.reason && (
                                            <div className="flex items-start gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                                                <AlertCircle size={16} className="text-gray-500 mt-0.5" />
                                                <div>
                                                    <strong className="text-gray-700">Motif:</strong>
                                                    <p className="text-gray-600 mt-1">{request.reason}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex md:flex-col gap-2">
                                        <button
                                            onClick={() => handleApprove(request.id)}
                                            className="btn-success flex items-center gap-2 justify-center"
                                        >
                                            <Check size={18} />
                                            Approuver
                                        </button>
                                        <button
                                            onClick={() => handleReject(request.id)}
                                            className="btn-error flex items-center gap-2 justify-center"
                                        >
                                            <X size={18} />
                                            Rejeter
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Liste de l'équipe */}
            <div className="card-modern mt-8">
                <h2 className="text-xl font-semibold mb-4">Votre Équipe</h2>

                {subordinates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <User size={48} className="mx-auto mb-3 opacity-50" />
                        <p>Aucun collaborateur sous votre responsabilité</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subordinates.map((sub) => (
                            <div key={sub.id} className="card-hover p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary bg-opacity-10 rounded-full">
                                        <User className="text-primary" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{sub.full_name}</h4>
                                        <p className="text-sm text-gray-600">{sub.job_title}</p>
                                        <p className="text-xs text-gray-500">{sub.department}</p>
                                    </div>
                                </div>

                                {sub.subordinates_count > 0 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        ({sub.subordinates_count} subordonné{sub.subordinates_count > 1 ? 's' : ''})
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
