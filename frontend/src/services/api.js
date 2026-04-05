import axios from 'axios';

// En dev, utilise le chemin relatif pour passer par le proxy Vite (évite CORS)
// En prod, définir VITE_API_URL avec l'URL complète du backend
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    withCredentials: true,
    timeout: 30000000000,
});


// --- GESTION DES ERREURS & SESSION EXPIRÉE ---
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log detailed error for debugging
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        }

        // Si le serveur renvoie 401 ou 419, la session est probablement expirée
        if (error.response?.status === 401 || error.response?.status === 419) {

            // Redirection vers login si on n'y est pas déjà
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// --- AUTH API ---
export const authApi = {
    logout: async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            // On ne touche PAS aux cookies en JS. 
            // On redirige simplement, Laravel a déjà invalidé la session côté serveur.
            window.location.href = '/login';
        }
    },

    login: async (credentials) => {
        // UTILISE ton instance 'api' pour être sûr de passer par le proxy Vite
        await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
        return api.post('/auth/login', credentials);
    },

    getUser: () => api.get('/auth/user'),
};

// --- DASHBOARD API ---
export const dashboardApi = {
    getStats: () => api.get('/dashboard/stats'),
    getRevenue: () => api.get('/dashboard/revenue'),
    getRecentChantiers: () => api.get('/dashboard/recent-chantiers'),
    getUpcomingTasks: () => api.get('/dashboard/upcoming-tasks'),
};

// --- CHANTIERS API ---
export const chantiersApi = {
    getAll: (params) => api.get('/chantiers', { params }),
    getOne: (id) => api.get(`/chantiers/${id}`),
    create: (data) => api.post('/chantiers', data),
    update: (id, data) => api.put(`/chantiers/${id}`, data),
    delete: (id) => api.delete(`/chantiers/${id}`),
    updateProgress: (id, progress) => api.patch(`/chantiers/${id}/progress`, { progress }),
    getTeam: (id) => api.get(`/chantiers/${id}/team`),
    assignTeam: (id, employeIds) => api.post(`/chantiers/${id}/team`, { employe_ids: employeIds }),
};

// --- EMPLOYES API ---
export const employesApi = {
    getAll: (params) => api.get('/employes', { params }),
    getOne: (id) => api.get(`/employes/${id}`),
    create: (data) => api.post('/employes', data),
    update: (id, data) => api.put(`/employes/${id}`, data),
    delete: (id) => api.delete(`/employes/${id}`),
    updateStatus: (id, status) => api.patch(`/employes/${id}/status`, { status }),
};

// --- MATERIELS API ---
export const materielsApi = {
    getAll: (params) => api.get('/materiels', { params }),
    getOne: (id) => api.get(`/materiels/${id}`),
    create: (data) => api.post('/materiels', data),
    update: (id, data) => api.put(`/materiels/${id}`, data),
    delete: (id) => api.delete(`/materiels/${id}`),
    updateStatus: (id, status) => api.patch(`/materiels/${id}/status`, { status }),
    scheduleMaintenance: (id, data) => api.post(`/materiels/${id}/maintenance`, data),
    updatePosition: (id, data) => api.patch(`/materiels/${id}/position`, data),
    getCartography: () => api.get('/cartography'),
};

// --- CLIENTS API ---
export const clientsApi = {
    getAll: (params) => api.get('/clients', { params }),
    getOne: (id) => api.get(`/clients/${id}`),
    create: (data) => api.post('/clients', data),
    update: (id, data) => api.put(`/clients/${id}`, data),
    delete: (id) => api.delete(`/clients/${id}`),
    getChantiers: (id) => api.get(`/clients/${id}/chantiers`),
};

// --- PLANNING API ---
export const planningApi = {
    getEvents: (params) => api.get('/planning/events', { params }),
    createEvent: (data) => api.post('/planning/events', data),
    updateEvent: (id, data) => api.put(`/planning/events/${id}`, data),
    deleteEvent: (id) => api.delete(`/planning/events/${id}`),
    getTeams: () => api.get('/planning/teams'),
};

// --- UTILISATEURS, ROLES & PERMISSIONS ---
export const usersApi = {
    create: (data) => api.post('/users', data),
    invite: (data) => api.post('/users/invite', data),
    getInvitations: () => api.get('/users/invitations'),
};

// Public API (no auth redirect on 401) for invitation flow
const publicApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 30000,
});

export const invitationApi = {
    validate: (data) => publicApi.post('/invitation/validate', data),
    setupPassword: (data) => publicApi.post('/invitation/setup-password', data),
};

export const rolesApi = {
    getAll: () => api.get('/roles'),
    getOne: (id) => api.get(`/roles/${id}`),
    create: (data) => api.post('/roles', data),
    update: (id, data) => api.put(`/roles/${id}`, data),
    delete: (id) => api.delete(`/roles/${id}`),
};

export const permissionsApi = {
    getAll: () => api.get('/permissions'),
};

// --- CHAT API ---
export const chatApi = {
    getConversations: () => api.get('/conversations'),
    getMessages: (id) => api.get(`/conversations/${id}`),
    sendMessage: (data) => api.post('/chat', data),
    deleteConversation: (id) => api.delete(`/conversations/${id}`),
};

// --- RH API ---
export const rhApi = {
    // Demandes de congés
    getLeaveRequests: (params) => api.get('/leave-requests', { params }),
    createLeaveRequest: (data) => api.post('/leave-requests', data),
    updateLeaveRequest: (id, data) => api.put(`/leave-requests/${id}`, data),
    deleteLeaveRequest: (id) => api.delete(`/leave-requests/${id}`),
    approveLeaveRequest: (id) => api.patch(`/leave-requests/${id}/approve`),
    rejectLeaveRequest: (id, reason) => api.patch(`/leave-requests/${id}/reject`, { reason }),
    cancelLeaveRequest: (id) => api.patch(`/leave-requests/${id}/cancel`),
    getLeaveBalance: (employeId) => api.get(`/employes/${employeId}/leave-balance`),

    // Équipes
    getTeams: (params) => api.get('/teams', { params }),
    createTeam: (data) => api.post('/teams', data),
    updateTeam: (id, data) => api.put(`/teams/${id}`, data),
    deleteTeam: (id) => api.delete(`/teams/${id}`),
    getTeamMembers: (teamId) => api.get(`/teams/${teamId}/members`),
    addTeamMember: (teamId, employeId, joinedAt) => api.post(`/teams/${teamId}/members`, { employe_id: employeId, joined_at: joinedAt }),
    removeTeamMember: (teamId, employeId) => api.delete(`/teams/${teamId}/members/${employeId}`),

    // Hiérarchie
    getHierarchyTree: () => api.get('/hierarchy/tree'),
    getHierarchyStats: () => api.get('/hierarchy/stats'),
    getHierarchySubtree: (employeId) => api.get(`/hierarchy/subtree/${employeId}`),
    getHierarchyPath: (employeId) => api.get(`/employes/${employeId}/hierarchy-path`),

    // Types de congés
    getLeaveTypes: () => api.get('/leave-types'),

    // Employés (RH)
    getAllEmployes: (params) => api.get('/employes', { params }),
    getEmployeByUserId: () => api.get('/employes/user'),
    getEmployeById: (id) => api.get(`/employes/${id}`),
    createEmploye: (data) => api.post('/employes', data),
    updateEmploye: (id, data) => api.put(`/employes/${id}`, data),
    deleteEmploye: (id) => api.delete(`/employes/${id}`),
    getEmployeSubordinates: (id) => api.get(`/employes/${id}/subordinates`),
    getAvailableUsers: () => api.get('/employes/available-users'),
};

export default api;