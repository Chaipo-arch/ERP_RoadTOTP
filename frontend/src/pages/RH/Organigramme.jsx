import { useState, useEffect } from 'react';
import { rhApi } from '../../services/api';
import { Network, Users, TrendingUp, Loader, ChevronDown, ChevronRight } from 'lucide-react';
import '../../index.css';

// Composant récursif pour afficher un nœud de l'arbre
function TreeNode({ node, level = 0 }) {
    const [isExpanded, setIsExpanded] = useState(level < 2); // Expand first 2 levels by default

    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="tree-node" style={{ marginLeft: `${level * 20}px` }}>
            <div className={`tree-node-card ${level === 0 ? 'root-node' : ''}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        {/* Expand/Collapse button */}
                        {hasChildren && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="btn-icon text-gray-600"
                            >
                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                        )}
                        {!hasChildren && <div className="w-6" />}

                        {/* Employee info */}
                        <div className={`p-2 ${level === 0 ? 'bg-primary' : 'bg-gray-100'} bg-opacity-20 rounded-lg`}>
                            <Users className={level === 0 ? 'text-primary' : 'text-gray-600'} size={20} />
                        </div>

                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{node.full_name}</h4>
                            <p className="text-sm text-gray-600">{node.job_title}</p>
                            <div className="flex gap-2 mt-1">
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                    {node.department}
                                </span>
                                {node.subordinates_count > 0 && (
                                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                        {node.subordinates_count} subordonné{node.subordinates_count > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <span className={`badge ${node.status === 'Actif' ? 'badge-success' : 'badge-ghost'}`}>
                            {node.status}
                        </span>
                        {node.teams && node.teams.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                Équipe{node.teams.length > 1 ? 's' : ''}: {node.teams.map(t => t.name).join(', ')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div className="tree-children">
                    {node.children.map((child) => (
                        <TreeNode key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Organigramme() {
    const [hierarchyTree, setHierarchyTree] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('tree'); // tree, list

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Charger l'arbre complet
            const treeRes = await rhApi.getTree();
            setHierarchyTree(treeRes.data.tree || []);

            // Charger les statistiques
            const statsRes = await rhApi.getStats();
            setStats(statsRes.data);

        } catch (error) {
            console.error('Erreur chargement organigramme:', error);
        } finally {
            setLoading(false);
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
                    <h1 className="page-title">Organigramme</h1>
                    <p className="page-subtitle">Visualisez la structure hiérarchique de l'entreprise</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('tree')}
                        className={viewMode === 'tree' ? 'btn-primary' : 'btn-secondary'}
                    >
                        <Network size={18} />
                        Arbre
                    </button>
                </div>
            </div>

            {/* Statistiques */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="card-modern">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="text-primary" size={24} />
                            <h3 className="font-semibold text-gray-800">Total Employés</h3>
                        </div>
                        <p className="text-3xl font-bold text-primary">{stats.total_employes}</p>
                    </div>

                    <div className="card-modern">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="text-success" size={24} />
                            <h3 className="font-semibold text-gray-800">Managers</h3>
                        </div>
                        <p className="text-3xl font-bold text-success">{stats.total_managers}</p>
                    </div>

                    <div className="card-modern">
                        <div className="flex items-center gap-3 mb-2">
                            <Network className="text-info" size={24} />
                            <h3 className="font-semibold text-gray-800">Positions Racines</h3>
                        </div>
                        <p className="text-3xl font-bold text-info">{stats.root_positions}</p>
                    </div>

                    <div className="card-modern">
                        <div className="flex items-center gap-3 mb-2">
                            <ChevronDown className="text-warning" size={24} />
                            <h3 className="font-semibold text-gray-800">Profondeur Max</h3>
                        </div>
                        <p className="text-3xl font-bold text-warning">{stats.max_hierarchy_depth} niveaux</p>
                    </div>
                </div>
            )}

            {/* Arbre hiérarchique */}
            <div className="card-modern">
                <h2 className="text-xl font-semibold mb-6">Structure Hiérarchique</h2>

                {hierarchyTree.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Network size={64} className="mx-auto mb-4 opacity-50" />
                        <p>Aucune structure hiérarchique disponible</p>
                    </div>
                ) : (
                    <div className="org-tree-container">
                        {hierarchyTree.map((root) => (
                            <TreeNode key={root.id} node={root} level={0} />
                        ))}
                    </div>
                )}
            </div>

            {/* CSS interne pour l'organigramme */}
            <style>{`
        .tree-node {
          margin-bottom: 0.75rem;
        }

        .tree-node-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1rem;
          transition: all 0.2s;
        }

        .tree-node-card:hover {
          border-color: var(--primary-color, #3b82f6);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }

        .root-node {
          border-color: var(--primary-color, #3b82f6);
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        }

        .tree-children {
          position: relative;
          margin-top: 0.75rem;
          padding-left: 1.5rem;
          border-left: 2px dashed #d1d5db;
        }

        .org-tree-container {
          max-height: 70vh;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .org-tree-container::-webkit-scrollbar {
          width: 8px;
        }

        .org-tree-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .org-tree-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .org-tree-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
        </div>
    );
}
