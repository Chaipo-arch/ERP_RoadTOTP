import { useState, useEffect, useRef, useCallback } from 'react';
import { Map as MapIcon, Layers, Filter, RefreshCw, Loader2, AlertCircle, Truck, HardHat, X, Satellite, MapPin, Navigation } from 'lucide-react';
import { materielsApi } from '../services/api';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Couleurs par status matériel
const MATERIEL_COLORS = {
    'En service': '#22c55e',
    'Disponible': '#3b82f6',
    'Maintenance': '#f59e0b',
    'Hors service': '#ef4444',
};

// Couleurs par status chantier
const CHANTIER_COLORS = {
    'En cours': '#8b5cf6',
    'Planifié': '#06b6d4',
    'Terminé': '#6b7280',
    'Suspendu': '#f97316',
};

function Cartographie() {
    const mapContainer = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);

    const [data, setData] = useState({ materiels: [], chantiers: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMateriels, setShowMateriels] = useState(true);
    const [showChantiers, setShowChantiers] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [statusFilter, setStatusFilter] = useState('Tous');
    const [showFilters, setShowFilters] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    // Charger les données
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await materielsApi.getCartography();
            setData(response.data);
        } catch (err) {
            console.error('Erreur chargement cartographie:', err);
            setError('Impossible de charger les données cartographiques.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Initialiser la carte MapLibre
    useEffect(() => {
        if (!mapContainer.current || mapInstance.current) return;

        const map = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
            center: [4.8357, 45.7640], // Lyon par défaut
            zoom: 9,
            attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.addControl(new maplibregl.ScaleControl({ maxWidth: 150 }), 'bottom-left');
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

        map.on('load', () => {
            setMapReady(true);
        });

        mapInstance.current = map;

        return () => {
            map.remove();
            mapInstance.current = null;
        };
    }, []);

    // Mettre à jour les marqueurs quand les données ou filtres changent
    useEffect(() => {
        if (!mapInstance.current || !mapReady) return;

        // Supprimer les anciens marqueurs
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Ajouter les marqueurs matériels
        if (showMateriels) {
            data.materiels
                .filter(m => statusFilter === 'Tous' || m.status === statusFilter)
                .forEach(materiel => {
                    const color = MATERIEL_COLORS[materiel.status] || '#6b7280';
                    const el = createMaterielMarker(materiel, color);

                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        setSelectedItem({ type: 'materiel', data: materiel });
                    });

                    const marker = new maplibregl.Marker({ element: el })
                        .setLngLat([materiel.longitude, materiel.latitude])
                        .addTo(mapInstance.current);

                    markersRef.current.push(marker);
                });
        }

        // Ajouter les marqueurs chantiers
        if (showChantiers) {
            data.chantiers
                .filter(c => statusFilter === 'Tous' || c.status === statusFilter)
                .forEach(chantier => {
                    const color = CHANTIER_COLORS[chantier.status] || '#6b7280';
                    const el = createChantierMarker(chantier, color);

                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        setSelectedItem({ type: 'chantier', data: chantier });
                    });

                    const marker = new maplibregl.Marker({ element: el })
                        .setLngLat([chantier.longitude, chantier.latitude])
                        .addTo(mapInstance.current);

                    markersRef.current.push(marker);
                });
        }
    }, [data, showMateriels, showChantiers, statusFilter, mapReady]);

    const createMaterielMarker = (materiel, color) => {
        const el = document.createElement('div');
        el.style.cssText = `
            width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
            background: ${color}; border: 3px solid rgba(255,255,255,0.9);
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 2px ${color}40;
            transition: transform 0.2s ease;
            position: relative;
        `;
        el.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.25)'; el.style.zIndex = '10'; });
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; el.style.zIndex = '1'; });
        return el;
    };

    const createChantierMarker = (chantier, color) => {
        const el = document.createElement('div');
        el.style.cssText = `
            width: 40px; height: 40px; cursor: pointer;
            background: ${color}; border: 3px solid rgba(255,255,255,0.9);
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 2px ${color}40;
            transition: transform 0.2s ease;
            border-radius: 8px; position: relative;
        `;
        el.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v3h4v-3h3v3h4c.6 0 1-.4 1-1v-3"/><path d="M2 18h20"/><path d="M6 18V4c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v14"/></svg>`;
        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.2)'; el.style.zIndex = '10'; });
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; el.style.zIndex = '1'; });
        return el;
    };

    const flyTo = (lng, lat) => {
        if (mapInstance.current) {
            mapInstance.current.flyTo({ center: [lng, lat], zoom: 15, duration: 1500 });
        }
    };

    const fitAllMarkers = () => {
        if (!mapInstance.current) return;
        const points = [];
        if (showMateriels) data.materiels.forEach(m => points.push([m.longitude, m.latitude]));
        if (showChantiers) data.chantiers.forEach(c => points.push([c.longitude, c.latitude]));
        if (points.length === 0) return;
        if (points.length === 1) {
            mapInstance.current.flyTo({ center: points[0], zoom: 14 });
            return;
        }
        const bounds = new maplibregl.LngLatBounds(points[0], points[0]);
        points.forEach(p => bounds.extend(p));
        mapInstance.current.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 });
    };

    const allStatuses = ['Tous', 'En service', 'Disponible', 'Maintenance', 'Hors service', 'En cours', 'Planifié', 'Terminé', 'Suspendu'];

    return (
        <div style={{ position: 'relative', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>

            {/* Toolbar */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '16px', flexShrink: 0
            }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MapIcon size={22} style={{ color: 'var(--primary-400)' }} />
                        Cartographie
                    </h2>
                    <span className="badge badge-primary" style={{ fontSize: '12px' }}>
                        {data.materiels.length} matériels · {data.chantiers.length} chantiers
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ fontSize: '13px' }}
                    >
                        <Filter size={16} />Filtres
                    </button>
                    <button className="btn btn-secondary" onClick={fitAllMarkers} style={{ fontSize: '13px' }}>
                        <Navigation size={16} />Tout afficher
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={fetchData} title="Rafraîchir">
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filter panel */}
            {showFilters && (
                <div className="card" style={{
                    padding: '16px', marginBottom: '16px', display: 'flex', gap: '16px',
                    alignItems: 'center', flexShrink: 0, flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={16} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Couches :</span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={showMateriels} onChange={(e) => setShowMateriels(e.target.checked)} />
                        <Truck size={14} style={{ color: '#22c55e' }} />
                        Matériels ({data.materiels.length})
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={showChantiers} onChange={(e) => setShowChantiers(e.target.checked)} />
                        <HardHat size={14} style={{ color: '#8b5cf6' }} />
                        Chantiers ({data.chantiers.length})
                    </label>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Statut :</span>
                        <select
                            className="form-input form-select"
                            style={{ width: '180px', fontSize: '13px', height: '36px' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* Error banner */}
            {error && (
                <div style={{
                    padding: '12px 16px', marginBottom: '12px', background: 'var(--danger-500)', color: 'white',
                    display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px', flexShrink: 0
                }}>
                    <AlertCircle size={18} />
                    <span style={{ fontSize: '13px' }}>{error}</span>
                    <button className="btn btn-ghost" style={{ marginLeft: 'auto', color: 'white', fontSize: '12px' }} onClick={fetchData}>Réessayer</button>
                </div>
            )}

            {/* Map container */}
            <div style={{
                flex: 1, borderRadius: '16px', overflow: 'hidden', position: 'relative',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}>
                {/* Loading overlay */}
                {loading && (
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 10,
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', gap: '12px', color: 'white',
                    }}>
                        <Loader2 size={32} className="spin" />
                        <span style={{ fontSize: '14px' }}>Chargement de la carte...</span>
                    </div>
                )}

                <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

                {/* Légende */}
                <div style={{
                    position: 'absolute', bottom: '40px', left: '16px', zIndex: 5,
                    background: 'rgba(17,17,17,0.90)', backdropFilter: 'blur(12px)',
                    borderRadius: '12px', padding: '14px 18px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Légende
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {showMateriels && Object.entries(MATERIEL_COLORS).map(([status, color]) => (
                            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, border: '2px solid rgba(255,255,255,0.6)', flexShrink: 0 }} />
                                <Truck size={11} style={{ color, opacity: 0.8 }} />
                                {status}
                            </div>
                        ))}
                        {showChantiers && Object.entries(CHANTIER_COLORS).map(([status, color]) => (
                            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: color, border: '2px solid rgba(255,255,255,0.6)', flexShrink: 0 }} />
                                <HardHat size={11} style={{ color, opacity: 0.8 }} />
                                {status}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Panneau de détails */}
                {selectedItem && (
                    <div style={{
                        position: 'absolute', top: '16px', right: '60px', zIndex: 5,
                        width: '340px', background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(16px)',
                        borderRadius: '16px', overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            background: selectedItem.type === 'materiel'
                                ? `linear-gradient(135deg, ${MATERIEL_COLORS[selectedItem.data.status]}20, transparent)`
                                : `linear-gradient(135deg, ${CHANTIER_COLORS[selectedItem.data.status]}20, transparent)`,
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    {selectedItem.type === 'materiel'
                                        ? <Truck size={16} style={{ color: MATERIEL_COLORS[selectedItem.data.status] }} />
                                        : <HardHat size={16} style={{ color: CHANTIER_COLORS[selectedItem.data.status] }} />
                                    }
                                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.5)' }}>
                                        {selectedItem.type === 'materiel' ? 'Matériel' : 'Chantier'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>
                                    {selectedItem.data.name}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedItem(null)}
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'white', display: 'flex' }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        {/* Body */}
                        <div style={{ padding: '16px 20px' }}>
                            {selectedItem.type === 'materiel' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <DetailRow label="Type" value={selectedItem.data.type} />
                                    <DetailRow label="Immatriculation" value={selectedItem.data.immatriculation} mono />
                                    <DetailRow label="Statut" value={
                                        <span style={{
                                            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                            background: `${MATERIEL_COLORS[selectedItem.data.status]}25`,
                                            color: MATERIEL_COLORS[selectedItem.data.status],
                                        }}>{selectedItem.data.status}</span>
                                    } />
                                    {selectedItem.data.current_chantier && (
                                        <DetailRow label="Chantier" value={selectedItem.data.current_chantier} />
                                    )}
                                    {selectedItem.data.sensolus_tracker_name && (
                                        <DetailRow label="Tracker" value={
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Satellite size={12} style={{ color: '#8b5cf6' }} />
                                                {selectedItem.data.sensolus_tracker_name}
                                            </span>
                                        } />
                                    )}
                                    {selectedItem.data.last_position_at && (
                                        <DetailRow label="Dernière position" value={new Date(selectedItem.data.last_position_at).toLocaleString('fr-FR')} />
                                    )}
                                    <DetailRow label="Coordonnées" value={`${selectedItem.data.latitude.toFixed(5)}, ${selectedItem.data.longitude.toFixed(5)}`} mono />
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <DetailRow label="Référence" value={selectedItem.data.reference} mono />
                                    <DetailRow label="Localisation" value={selectedItem.data.location} />
                                    <DetailRow label="Statut" value={
                                        <span style={{
                                            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                            background: `${CHANTIER_COLORS[selectedItem.data.status]}25`,
                                            color: CHANTIER_COLORS[selectedItem.data.status],
                                        }}>{selectedItem.data.status}</span>
                                    } />
                                    <DetailRow label="Avancement" value={
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${selectedItem.data.progress}%`, height: '100%', background: CHANTIER_COLORS[selectedItem.data.status], borderRadius: '3px', transition: 'width 0.5s' }} />
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{selectedItem.data.progress}%</span>
                                        </div>
                                    } />
                                    {selectedItem.data.client_name && (
                                        <DetailRow label="Client" value={selectedItem.data.client_name} />
                                    )}
                                    {selectedItem.data.start_date && (
                                        <DetailRow label="Période" value={`${new Date(selectedItem.data.start_date).toLocaleDateString('fr-FR')} - ${selectedItem.data.end_date ? new Date(selectedItem.data.end_date).toLocaleDateString('fr-FR') : '...'}`} />
                                    )}
                                    <DetailRow label="Coordonnées" value={`${selectedItem.data.latitude.toFixed(5)}, ${selectedItem.data.longitude.toFixed(5)}`} mono />
                                </div>
                            )}
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '16px', fontSize: '13px', justifyContent: 'center' }}
                                onClick={() => flyTo(selectedItem.data.longitude, selectedItem.data.latitude)}
                            >
                                <Navigation size={14} />Centrer sur la carte
                            </button>
                        </div>
                    </div>
                )}

                {/* Sidebar liste */}
                <div style={{
                    position: 'absolute', top: '16px', left: '16px', bottom: '100px', zIndex: 5,
                    width: '260px', background: 'rgba(17,17,17,0.90)', backdropFilter: 'blur(12px)',
                    borderRadius: '14px', overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    display: 'flex', flexDirection: 'column',
                }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Éléments sur la carte</div>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
                        {showMateriels && data.materiels.length > 0 && (
                            <>
                                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', padding: '8px 8px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Truck size={10} /> Matériels
                                </div>
                                {data.materiels
                                    .filter(m => statusFilter === 'Tous' || m.status === statusFilter)
                                    .map(m => (
                                        <button
                                            key={`m-${m.id}`}
                                            onClick={() => { setSelectedItem({ type: 'materiel', data: m }); flyTo(m.longitude, m.latitude); }}
                                            style={{
                                                width: '100%', textAlign: 'left', background: selectedItem?.data.id === m.id && selectedItem?.type === 'materiel' ? 'rgba(255,255,255,0.08)' : 'transparent',
                                                border: 'none', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', color: 'white',
                                                display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = selectedItem?.data.id === m.id && selectedItem?.type === 'materiel' ? 'rgba(255,255,255,0.08)' : 'transparent'}
                                        >
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: MATERIEL_COLORS[m.status], flexShrink: 0 }} />
                                            <div style={{ overflow: 'hidden' }}>
                                                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{m.immatriculation}</div>
                                            </div>
                                        </button>
                                    ))
                                }
                            </>
                        )}
                        {showChantiers && data.chantiers.length > 0 && (
                            <>
                                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', padding: '12px 8px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <HardHat size={10} /> Chantiers
                                </div>
                                {data.chantiers
                                    .filter(c => statusFilter === 'Tous' || c.status === statusFilter)
                                    .map(c => (
                                        <button
                                            key={`c-${c.id}`}
                                            onClick={() => { setSelectedItem({ type: 'chantier', data: c }); flyTo(c.longitude, c.latitude); }}
                                            style={{
                                                width: '100%', textAlign: 'left', background: selectedItem?.data.id === c.id && selectedItem?.type === 'chantier' ? 'rgba(255,255,255,0.08)' : 'transparent',
                                                border: 'none', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', color: 'white',
                                                display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = selectedItem?.data.id === c.id && selectedItem?.type === 'chantier' ? 'rgba(255,255,255,0.08)' : 'transparent'}
                                        >
                                            <div style={{ width: '8px', height: '8px', borderRadius: '3px', background: CHANTIER_COLORS[c.status], flexShrink: 0 }} />
                                            <div style={{ overflow: 'hidden' }}>
                                                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{c.reference}</div>
                                            </div>
                                        </button>
                                    ))
                                }
                            </>
                        )}
                        {data.materiels.length === 0 && data.chantiers.length === 0 && !loading && (
                            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                                <MapPin size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                                <div>Aucun élément géolocalisé</div>
                                <div style={{ marginTop: '4px', fontSize: '11px' }}>Ajoutez des coordonnées GPS à vos matériels et chantiers</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin { animation: spin 1s linear infinite; }
                .maplibregl-ctrl-group {
                    background: rgba(17,17,17,0.85) !important;
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 10px !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
                }
                .maplibregl-ctrl-group button {
                    border-color: rgba(255,255,255,0.08) !important;
                }
                .maplibregl-ctrl-group button:not(:disabled):hover {
                    background-color: rgba(255,255,255,0.1) !important;
                }
                .maplibregl-ctrl-group button .maplibregl-ctrl-icon {
                    filter: invert(1) !important;
                }
                .maplibregl-ctrl-scale {
                    background: rgba(17,17,17,0.7) !important;
                    color: rgba(255,255,255,0.7) !important;
                    border-color: rgba(255,255,255,0.3) !important;
                    border-radius: 4px !important;
                    font-size: 10px !important;
                }
                .maplibregl-ctrl-attrib {
                    background: rgba(17,17,17,0.5) !important;
                    color: rgba(255,255,255,0.4) !important;
                    font-size: 10px !important;
                }
                .maplibregl-ctrl-attrib a {
                    color: rgba(255,255,255,0.5) !important;
                }
            `}</style>
        </div>
    );
}

function DetailRow({ label, value, mono }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>{label}</span>
            <span style={{
                fontSize: '12px', color: 'rgba(255,255,255,0.9)', fontWeight: 500, textAlign: 'right',
                fontFamily: mono ? 'monospace' : 'inherit',
            }}>{value}</span>
        </div>
    );
}

export default Cartographie;
