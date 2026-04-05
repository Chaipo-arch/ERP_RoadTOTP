import React, { useState, useEffect } from 'react';
import { rolesApi, permissionsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Roles() {
    const { hasPermission } = useAuth();
    const [roles, setRoles] = useState([]);
    const [groupedPermissions, setGroupedPermissions] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({ name: '', permissions: [] });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await rolesApi.getAll();
            setRoles(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await permissionsApi.getAll();
            setGroupedPermissions(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenModal = (role = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name,
                permissions: role.permissions.map(p => p.id)
            });
        } else {
            setEditingRole(null);
            setFormData({ name: '', permissions: [] });
        }
        setShowModal(true);
    };

    const handlePermissionChange = (permissionId) => {
        setFormData(prev => {
            const newPermissions = prev.permissions.includes(permissionId)
                ? prev.permissions.filter(id => id !== permissionId)
                : [...prev.permissions, permissionId];
            return { ...prev, permissions: newPermissions };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await rolesApi.update(editingRole.id, formData);
            } else {
                await rolesApi.create(formData);
            }
            setShowModal(false);
            fetchRoles();
        } catch (err) {
            setError('Erreur lors de l\'enregistrement du rôle');
        }
    };

    const handleDelete = async (roleId) => {
        if (window.confirm('Voulez-vous vraiment supprimer ce rôle ?')) {
            try {
                await rolesApi.delete(roleId);
                fetchRoles();
            } catch (err) {
                alert('Impossible de supprimer ce rôle. Il est peut-être assigné à un utilisateur.');
            }
        }
    };

    if (isLoading) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestion des Rôles</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition"
                >
                    + Nouveau Rôle
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du Rôle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {roles.map(role => (
                            <tr key={role.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{role.name}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        {role.permissions.slice(0, 5).map(p => (
                                            <span key={p.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {p.name}
                                            </span>
                                        ))}
                                        {role.permissions.length > 5 && (
                                            <span className="text-xs text-gray-500">+{role.permissions.length - 5} autres</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleOpenModal(role)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => handleDelete(role.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        {editingRole ? 'Modifier le Rôle' : 'Créer un Nouveau Rôle'}
                                    </h3>

                                    {error && <div className="mb-4 text-red-600 bg-red-50 p-2 rounded">{error}</div>}

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Nom du Rôle</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            required
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">Permissions par Module</label>
                                        <div className="space-y-4 max-h-96 overflow-y-auto border p-4 rounded">
                                            {Object.entries(groupedPermissions).map(([module, permissions]) => (
                                                <div key={module}>
                                                    <h4 className="font-semibold text-gray-800 border-b pb-1 mb-2">{module}</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {permissions.map(p => (
                                                            <label key={p.id} className="inline-flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-checkbox h-4 w-4 text-blue-600"
                                                                    checked={formData.permissions.includes(p.id)}
                                                                    onChange={() => handlePermissionChange(p.id)}
                                                                />
                                                                <span className="ml-2 text-sm text-gray-700">{p.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Enregistrer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
