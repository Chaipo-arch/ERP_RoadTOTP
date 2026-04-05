import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Configuration axios avec credentials
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    withCredentials: true,
    timeout: 300000000,
});

// ========== LEAVE REQUESTS (Demandes de Congés) ==========

export const leaveRequestApi = {
    /**
     * Liste des demandes de congés (avec filtres)
     */
    getAll: (params = {}) => api.get('/leave-requests', { params }),

    /**
     * Créer une demande de congé
     */
    create: (data) => api.post('/leave-requests', data),

    /**
     * Détail d'une demande
     */
    getById: (id) => api.get(`/leave-requests/${id}`),

    /**
     * Modifier une demande (seulement si pending)
     */
    update: (id, data) => api.put(`/leave-requests/${id}`, data),

    /**
     * Supprimer une demande (seulement si pending)
     */
    delete: (id) => api.delete(`/leave-requests/${id}`),

    /**
     * Approuver une demande (manager uniquement)
     */
    approve: (id) => api.patch(`/leave-requests/${id}/approve`),

    /**
     * Rejeter une demande (manager uniquement)
     */
    reject: (id, reason = null) => api.patch(`/leave-requests/${id}/reject`, { reason }),

    /**
     * Annuler une demande (employé)
     */
    cancel: (id) => api.patch(`/leave-requests/${id}/cancel`),

    /**
     * Obtenir le solde de congés d'un employé
     */
    getBalance: (employeId) => api.get(`/employes/${employeId}/leave-balance`),
};

// ========== TEAMS (Équipes) ==========

export const teamApi = {
    /**
     * Liste des équipes
     */
    getAll: (params = {}) => api.get('/teams', { params }),

    /**
     * Créer une équipe
     */
    create: (data) => api.post('/teams', data),

    /**
     * Détail d'une équipe
     */
    getById: (id) => api.get(`/teams/${id}`),

    /**
     * Modifier une équipe
     */
    update: (id, data) => api.put(`/teams/${id}`, data),

    /**
     * Supprimer une équipe
     */
    delete: (id) => api.delete(`/teams/${id}`),

    /**
     * Obtenir les membres d'une équipe
     */
    getMembers: (teamId) => api.get(`/teams/${teamId}/members`),

    /**
     * Ajouter un membre à l'équipe
     */
    addMember: (teamId, employeId, joinedAt = null) =>
        api.post(`/teams/${teamId}/members`, { employe_id: employeId, joined_at: joinedAt }),

    /**
     * Retirer un membre de l'équipe
     */
    removeMember: (teamId, employeId) =>
        api.delete(`/teams/${teamId}/members/${employeId}`),
};

// ========== HIERARCHY (Hiérarchie / Organigramme) ==========

export const hierarchyApi = {
    /**
     * Arbre hiérarchique complet de l'entreprise
     */
    getTree: () => api.get('/hierarchy/tree'),

    /**
     * Statistiques hiérarchiques
     */
    getStats: () => api.get('/hierarchy/stats'),

    /**
     * Sous-arbre d'un employé spécifique
     */
    getSubtree: (employeId) => api.get(`/hierarchy/subtree/${employeId}`),

    /**
     * Subordonnés directs d'un employé
     */
    getSubordinates: (employeId) => api.get(`/employes/${employeId}/subordinates`),

    /**
     * Tous les subordonnés (récursif)
     */
    getAllSubordinates: (employeId) => api.get(`/employes/${employeId}/all-subordinates`),

    /**
     * Chemin hiérarchique d'un employé
     */
    getPath: (employeId) => api.get(`/employes/${employeId}/hierarchy-path`),
};

// ========== LEAVE TYPES (Types de Congés) ==========

export const leaveTypeApi = {
    /**
     * Liste des types de congés disponibles
     * Note: Cette route devra être créée côté backend si elle n'existe pas
     */
    getAll: () => api.get('/leave-types'),
};

// ========== EMPLOYES (Employés) ==========

export const employeApi = {
    /**
     * Liste des employés (avec recherche et filtres)
     */
    getAll: (params = {}) => api.get('/employes', { params }),

    /**
     * Créer un employé
     */
    create: (data) => api.post('/employes', data),

    /**
     * Détail d'un employé
     */
    getById: (id) => api.get(`/employes/${id}`),

    /**
     * Modifier un employé
     */
    update: (id, data) => api.put(`/employes/${id}`, data),

    /**
     * Supprimer un employé
     */
    delete: (id) => api.delete(`/employes/${id}`),

    /**
     * Obtenir les subordonnés d'un employé
     */
    getSubordinates: (id) => api.get(`/employes/${id}/subordinates`),
};

// Export par défaut d'un objet contenant tous les services
export default {
    leaveRequests: leaveRequestApi,
    teams: teamApi,
    hierarchy: hierarchyApi,
    leaveTypes: leaveTypeApi,
    employes: employeApi,
};
