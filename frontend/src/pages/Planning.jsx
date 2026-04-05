import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, Users, MapPin, Clock } from 'lucide-react';

const events = [
    { id: 1, title: 'Rénovation Route D47', type: 'chantier', date: '2024-02-15', endDate: '2024-02-20', team: 'Équipe A', location: 'Lyon' },
    { id: 2, title: 'Terrassement Zone Ind.', type: 'chantier', date: '2024-02-16', endDate: '2024-02-28', team: 'Équipe B', location: 'Villeurbanne' },
    { id: 3, title: 'Livraison béton', type: 'livraison', date: '2024-02-17', team: 'Transport', location: 'Lyon' },
    { id: 4, title: 'Maintenance grue GT-45', type: 'maintenance', date: '2024-02-18', team: 'Maintenance', location: 'Atelier' },
    { id: 5, title: 'Réunion équipe', type: 'reunion', date: '2024-02-19', team: 'Direction', location: 'Bureau' },
    { id: 6, title: 'Formation sécurité', type: 'formation', date: '2024-02-20', team: 'Tous', location: 'Salle A' },
    { id: 7, title: 'Inspection chantier', type: 'inspection', date: '2024-02-21', team: 'QSE', location: 'Vénissieux' },
];

const teams = [
    { id: 1, name: 'Équipe A', members: ['Jean Dupont', 'Marie Martin'], color: '#f59e0b' },
    { id: 2, name: 'Équipe B', members: ['Pierre Bernard', 'Sophie Durand'], color: '#22c55e' },
    { id: 3, name: 'Équipe C', members: ['Michel Petit', 'Anne Morel'], color: '#3b82f6' },
];

function Planning() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const getEventsForDate = (day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === dateStr);
    };

    const getEventColor = (type) => ({ chantier: '#f59e0b', livraison: '#3b82f6', maintenance: '#eab308', reunion: '#a855f7', formation: '#22c55e', inspection: '#ef4444' }[type] || '#64748b');

    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
    };

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button className="btn btn-ghost btn-icon" onClick={prevMonth}><ChevronLeft size={20} /></button>
                            <h2 style={{ fontSize: '20px', fontWeight: 600, minWidth: '180px', textAlign: 'center' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                            <button className="btn btn-ghost btn-icon" onClick={nextMonth}><ChevronRight size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={goToToday}>Aujourd'hui</button>
                            <button className="btn btn-primary btn-sm"><Plus size={16} />Ajouter</button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-color)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden' }}>
                        {dayNames.map(day => <div key={day} style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', textTransform: 'uppercase' }}>{day}</div>)}

                        {Array.from({ length: adjustedFirstDay }).map((_, i) => <div key={`empty-${i}`} style={{ padding: '12px', background: 'var(--bg-secondary)', minHeight: '100px' }} />)}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dayEvents = getEventsForDate(day);
                            return (
                                <div key={day} style={{ padding: '8px', background: 'var(--bg-secondary)', minHeight: '100px', cursor: 'pointer', transition: 'background var(--transition-fast)' }} onClick={() => setSelectedDate(day)} onMouseEnter={(e) => e.target.style.background = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.target.style.background = 'var(--bg-secondary)'}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: isToday(day) ? 700 : 500, background: isToday(day) ? 'var(--primary-500)' : 'transparent', color: isToday(day) ? 'white' : 'var(--text-primary)' }}>{day}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {dayEvents.slice(0, 2).map(event => (
                                            <div key={event.id} style={{ fontSize: '11px', padding: '4px 6px', borderRadius: '4px', background: `${getEventColor(event.type)}20`, color: getEventColor(event.type), fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</div>
                                        ))}
                                        {dayEvents.length > 2 && <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{dayEvents.length - 2} autres</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Équipes</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {teams.map(team => (
                                <div key={team.id} style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)', borderLeft: `3px solid ${team.color}` }}>
                                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{team.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{team.members.length} membres</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Légende</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[{ type: 'chantier', label: 'Chantier' }, { type: 'livraison', label: 'Livraison' }, { type: 'maintenance', label: 'Maintenance' }, { type: 'reunion', label: 'Réunion' }, { type: 'formation', label: 'Formation' }, { type: 'inspection', label: 'Inspection' }].map(item => (
                                <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: getEventColor(item.type) }} />
                                    <span style={{ fontSize: '13px' }}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Événements à venir</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {events.slice(0, 4).map(event => (
                                <div key={event.id} style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)' }}>
                                    <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '6px' }}>{event.title}</div>
                                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={10} />{new Date(event.date).toLocaleDateString('fr-FR')}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={10} />{event.location}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Planning;
