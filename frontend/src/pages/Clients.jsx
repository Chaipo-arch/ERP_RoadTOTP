import { useState } from 'react';
import { Plus, Search, Edit, Trash2, X, Phone, Mail, MapPin, Building, Euro, FileText } from 'lucide-react';

const initialClients = [
    { id: 1, name: 'Mairie de Lyon', type: 'Public', contact: 'Pierre Duval', email: 'contact@lyon.fr', phone: '04 72 10 30 30', address: '1 Place de la Comédie, 69001 Lyon', siret: '21690123400019', totalContracts: 5, activeContracts: 2, totalRevenue: 1250000 },
    { id: 2, name: 'SCI Batinord', type: 'Privé', contact: 'Marc Lefebvre', email: 'contact@batinord.fr', phone: '04 78 95 12 34', address: '45 Rue de la République, 69100 Villeurbanne', siret: '45678912300045', totalContracts: 3, activeContracts: 1, totalRevenue: 580000 },
    { id: 3, name: 'Bouygues Immobilier', type: 'Privé', contact: 'Sophie Martin', email: 's.martin@bouygues.com', phone: '01 55 38 25 00', address: '3 Boulevard Gallieni, 92130 Issy-les-Moulineaux', siret: '57209547600012', totalContracts: 8, activeContracts: 3, totalRevenue: 2100000 },
    { id: 4, name: 'Métropole de Lyon', type: 'Public', contact: 'Jean Roux', email: 'contact@grandlyon.com', phone: '04 78 63 40 40', address: '20 Rue du Lac, 69003 Lyon', siret: '24690001800099', totalContracts: 12, activeContracts: 4, totalRevenue: 3500000 },
    { id: 5, name: 'Carrefour Property', type: 'Privé', contact: 'Anne Dubois', email: 'a.dubois@carrefour.com', phone: '01 41 04 26 00', address: '93 Avenue de Paris, 91300 Massy', siret: '42148254200088', totalContracts: 2, activeContracts: 1, totalRevenue: 420000 },
];

const clientTypes = ['Tous', 'Public', 'Privé'];

function Clients() {
    const [clients, setClients] = useState(initialClients);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('Tous');
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({ name: '', type: '', contact: '', email: '', phone: '', address: '', siret: '' });

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.contact.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch && (typeFilter === 'Tous' || c.type === typeFilter);
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingClient) {
            setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...formData } : c));
        } else {
            setClients([...clients, { id: Date.now(), ...formData, totalContracts: 0, activeContracts: 0, totalRevenue: 0 }]);
        }
        closeModal();
    };

    const openModal = (client = null) => {
        setEditingClient(client);
        setFormData(client ? { name: client.name, type: client.type, contact: client.contact, email: client.email, phone: client.phone, address: client.address, siret: client.siret } : { name: '', type: '', contact: '', email: '', phone: '', address: '', siret: '' });
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditingClient(null); };
    const deleteClient = (id) => { if (confirm('Supprimer ce client ?')) setClients(clients.filter(c => c.id !== id)); };
    const totalRevenue = clients.reduce((sum, c) => sum + c.totalRevenue, 0);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="search-box" style={{ width: '300px' }}><Search className="search-icon" size={18} /><input className="search-input" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                    <select className="form-input form-select" style={{ width: '180px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>{clientTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}><Plus size={18} />Nouveau Client</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}><div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--primary-400)' }}>{clients.length}</div><div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Clients</div></div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}><div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--info-500)' }}>{clients.filter(c => c.type === 'Public').length}</div><div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Publics</div></div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}><div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success-500)' }}>{clients.reduce((s, c) => s + c.activeContracts, 0)}</div><div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Contrats actifs</div></div>
                <div className="card" style={{ padding: '16px', textAlign: 'center' }}><div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--warning-500)' }}>{(totalRevenue / 1000000).toFixed(1)}M€</div><div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>CA Total</div></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                {filteredClients.map((client) => (
                    <div key={client.id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--border-radius-md)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-400)' }}><Building size={24} /></div>
                                <div><h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{client.name}</h3><span className={`badge ${client.type === 'Public' ? 'badge-info' : 'badge-primary'}`}>{client.type}</span></div>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}><button className="btn btn-ghost btn-icon btn-sm" onClick={() => openModal(client)}><Edit size={14} /></button><button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteClient(client.id)}><Trash2 size={14} /></button></div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}><Mail size={14} />{client.email}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}><Phone size={14} />{client.phone}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}><MapPin size={14} />{client.address}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)' }}>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '18px', fontWeight: 700 }}>{client.totalContracts}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Contrats</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success-500)' }}>{client.activeContracts}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Actifs</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-400)' }}>{(client.totalRevenue / 1000).toFixed(0)}K€</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CA</div></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={closeModal}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header"><h2 className="modal-title">{editingClient ? 'Modifier' : 'Nouveau'} Client</h2><button className="modal-close" onClick={closeModal}><X size={20} /></button></div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}><div className="form-group"><label className="form-label">Raison sociale</label><input className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div><div className="form-group"><label className="form-label">Type</label><select className="form-input form-select" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required><option value="">Choisir...</option><option value="Public">Public</option><option value="Privé">Privé</option></select></div></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}><div className="form-group"><label className="form-label">Contact</label><input className="form-input" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} required /></div><div className="form-group"><label className="form-label">SIRET</label><input className="form-input" value={formData.siret} onChange={(e) => setFormData({ ...formData, siret: e.target.value })} /></div></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}><div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div><div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required /></div></div>
                            <div className="form-group"><label className="form-label">Adresse</label><input className="form-input" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                        </div>
                        <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={closeModal}>Annuler</button><button type="submit" className="btn btn-primary">{editingClient ? 'Enregistrer' : 'Créer'}</button></div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Clients;
