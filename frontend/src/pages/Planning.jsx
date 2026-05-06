import { useState, useEffect, useMemo, Fragment } from 'react';
import { planningApi, rhApi } from '../services/api';
import {
    ChevronLeft, ChevronRight, Plus, Calendar, Users, MapPin, Clock,
    Loader, X, HardHat, Truck, Wrench, UserCheck, GraduationCap,
    ClipboardCheck, CalendarDays, CalendarRange, Trash2, Edit
} from 'lucide-react';
import '../index.css';

const EVENT_TYPES = [
    { value: 'chantier', label: 'Chantier', color: '#f59e0b', icon: HardHat },
    { value: 'livraison', label: 'Livraison', color: '#3b82f6', icon: Truck },
    { value: 'maintenance', label: 'Maintenance', color: '#eab308', icon: Wrench },
    { value: 'reunion', label: 'Réunion', color: '#a855f7', icon: UserCheck },
    { value: 'formation', label: 'Formation', color: '#22c55e', icon: GraduationCap },
    { value: 'inspection', label: 'Inspection', color: '#ef4444', icon: ClipboardCheck },
];

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAY_NAMES_FULL = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function getEventColor(type) {
    return EVENT_TYPES.find(t => t.value === type)?.color || '#64748b';
}

function getEventIcon(type) {
    return EVENT_TYPES.find(t => t.value === type)?.icon || Calendar;
}

function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

// ===== MONTHLY CALENDAR VIEW =====
function MonthlyView({ currentDate, events, onPrevMonth, onNextMonth, onToday, onAddEvent, onEditEvent, onDeleteEvent, chantiers }) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const today = new Date();
    const isToday = (day) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const getEventsForDate = (day) => {
        const dateStr = formatDate(new Date(year, month, day));
        return events.filter(e => {
            const start = e.date?.substring(0, 10);
            const end = e.end_date?.substring(0, 10);
            if (end) {
                return dateStr >= start && dateStr <= end;
            }
            return start === dateStr;
        });
    };

    // Build chantier timeline bars
    const chantierBars = useMemo(() => {
        if (!chantiers?.length) return [];
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);

        return chantiers
            .filter(c => {
                const cStart = new Date(c.start_date);
                const cEnd = new Date(c.end_date);
                return cStart <= monthEnd && cEnd >= monthStart;
            })
            .map((c, idx) => {
                const cStart = new Date(c.start_date);
                const cEnd = new Date(c.end_date);
                const barStart = Math.max(1, cStart <= monthStart ? 1 : cStart.getDate());
                const barEnd = Math.min(daysInMonth, cEnd >= monthEnd ? daysInMonth : cEnd.getDate());
                const colors = ['#f59e0b', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4'];
                return {
                    ...c,
                    barStart,
                    barEnd,
                    color: colors[idx % colors.length],
                };
            });
    }, [chantiers, year, month, daysInMonth]);

    const [selectedDay, setSelectedDay] = useState(null);
    const selectedEvents = selectedDay ? getEventsForDate(selectedDay) : [];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
            {/* Calendar */}
            <div className="card" style={{ padding: '24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button className="btn btn-ghost btn-icon" onClick={onPrevMonth}><ChevronLeft size={20} /></button>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, minWidth: '200px', textAlign: 'center' }}>
                            {MONTH_NAMES[month]} {year}
                        </h2>
                        <button className="btn btn-ghost btn-icon" onClick={onNextMonth}><ChevronRight size={20} /></button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={onToday}>Aujourd'hui</button>
                        <button className="btn btn-primary btn-sm" onClick={() => onAddEvent()}><Plus size={16} />Ajouter</button>
                    </div>
                </div>

                {/* Chantier timeline bars */}
                {chantierBars.length > 0 && (
                    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                            Chantiers en cours
                        </div>
                        {chantierBars.map(bar => {
                            const totalCols = daysInMonth;
                            const startPct = ((bar.barStart - 1) / totalCols) * 100;
                            const widthPct = ((bar.barEnd - bar.barStart + 1) / totalCols) * 100;
                            return (
                                <div key={bar.id} style={{ position: 'relative', height: '28px', background: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: `${startPct}%`,
                                        width: `${widthPct}%`,
                                        height: '100%',
                                        background: `linear-gradient(135deg, ${bar.color}30, ${bar.color}18)`,
                                        borderLeft: `3px solid ${bar.color}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        paddingLeft: '8px',
                                        borderRadius: '4px',
                                    }}>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: bar.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {bar.name}
                                        </span>
                                        {bar.progress > 0 && (
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px' }}>{bar.progress}%</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '1px',
                    background: 'var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    overflow: 'hidden',
                }}>
                    {DAY_NAMES.map(day => (
                        <div key={day} style={{
                            padding: '10px',
                            textAlign: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            background: 'var(--bg-tertiary)',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                        }}>{day}</div>
                    ))}

                    {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                        <div key={`empty-${i}`} style={{ padding: '8px', background: 'var(--bg-secondary)', minHeight: '96px', opacity: 0.4 }} />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayEvents = getEventsForDate(day);
                        const isSelected = selectedDay === day;
                        return (
                            <div
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                style={{
                                    padding: '6px',
                                    background: isSelected ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-secondary)',
                                    minHeight: '96px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    borderLeft: isSelected ? '2px solid var(--primary-400)' : '2px solid transparent',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: isToday(day) ? 700 : 500,
                                        background: isToday(day) ? 'var(--primary-500)' : 'transparent',
                                        color: isToday(day) ? 'white' : 'var(--text-primary)',
                                    }}>{day}</span>
                                    {dayEvents.length > 0 && (
                                        <span style={{
                                            width: '6px', height: '6px', borderRadius: '50%',
                                            background: 'var(--primary-400)', marginTop: '10px'
                                        }} />
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {dayEvents.slice(0, 3).map(event => (
                                        <div key={event.id} style={{
                                            fontSize: '10px',
                                            padding: '2px 5px',
                                            borderRadius: '3px',
                                            background: `${getEventColor(event.type)}18`,
                                            color: getEventColor(event.type),
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            borderLeft: `2px solid ${getEventColor(event.type)}`,
                                        }}>{event.title}</div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', paddingLeft: '5px' }}>+{dayEvents.length - 3} autres</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Selected day events */}
                <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} style={{ color: 'var(--primary-400)' }} />
                        {selectedDay
                            ? `${selectedDay} ${MONTH_NAMES[month]}`
                            : "Sélectionnez un jour"
                        }
                    </h3>
                    {selectedDay && selectedEvents.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            Aucun événement ce jour
                            <br />
                            <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => onAddEvent(new Date(year, month, selectedDay))}>
                                <Plus size={14} />Ajouter
                            </button>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedEvents.map(event => {
                            const Icon = getEventIcon(event.type);
                            return (
                                <div key={event.id} style={{
                                    padding: '12px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--border-radius-sm)',
                                    borderLeft: `3px solid ${getEventColor(event.type)}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <Icon size={14} style={{ color: getEventColor(event.type) }} />
                                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{event.title}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn btn-ghost btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => onEditEvent(event)}>
                                                <Edit size={12} />
                                            </button>
                                            <button className="btn btn-ghost btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => onDeleteEvent(event.id)}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {event.time && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <Clock size={10} />{event.time}{event.end_time && ` - ${event.end_time}`}
                                            </span>
                                        )}
                                        {event.location && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <MapPin size={10} />{event.location}
                                            </span>
                                        )}
                                        {event.chantier && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <HardHat size={10} />{event.chantier.name}
                                            </span>
                                        )}
                                    </div>
                                    {event.description && (
                                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>{event.description}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Légende</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {EVENT_TYPES.map(item => (
                            <div key={item.value} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color, flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming */}
                <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Prochains événements</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {events.filter(e => new Date(e.date) >= new Date()).slice(0, 5).map(event => (
                            <div key={event.id} style={{
                                padding: '10px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--border-radius-sm)',
                                borderLeft: `3px solid ${getEventColor(event.type)}`,
                            }}>
                                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>{event.title}</div>
                                <div style={{ display: 'flex', gap: '10px', fontSize: '10px', color: 'var(--text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <Calendar size={9} />{new Date(event.date).toLocaleDateString('fr-FR')}
                                    </span>
                                    {event.location && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <MapPin size={9} />{event.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {events.filter(e => new Date(e.date) >= new Date()).length === 0 && (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                                Aucun événement à venir
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== WEEKLY PERSONAL VIEW =====
function WeeklyView({ weekStart, events, onPrevWeek, onNextWeek, onToday, onAddEvent, onEditEvent, onDeleteEvent }) {
    const today = new Date();
    const todayStr = formatDate(today);

    const days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
    });

    const hours = Array.from({ length: 14 }).map((_, i) => i + 7); // 7h -> 20h

    const getEventsForDay = (date) => {
        const dateStr = formatDate(date);
        return events.filter(e => {
            const start = e.date?.substring(0, 10);
            const end = e.end_date?.substring(0, 10);
            if (end) return dateStr >= start && dateStr <= end;
            return start === dateStr;
        });
    };

    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    return (
        <div className="card" style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button className="btn btn-ghost btn-icon" onClick={onPrevWeek}><ChevronLeft size={20} /></button>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, minWidth: '280px', textAlign: 'center' }}>
                        {weekStart.getDate()} {MONTH_NAMES[weekStart.getMonth()].substring(0, 3)} — {weekEndDate.getDate()} {MONTH_NAMES[weekEndDate.getMonth()].substring(0, 3)} {weekEndDate.getFullYear()}
                    </h2>
                    <button className="btn btn-ghost btn-icon" onClick={onNextWeek}><ChevronRight size={20} /></button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={onToday}>Cette semaine</button>
                    <button className="btn btn-primary btn-sm" onClick={() => onAddEvent()}><Plus size={16} />Ajouter</button>
                </div>
            </div>

            {/* Weekly grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gap: '0', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden' }}>
                {/* Day headers */}
                <div style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', padding: '8px' }} />
                {days.map((d, i) => {
                    const isCurrentDay = formatDate(d) === todayStr;
                    return (
                        <div key={i} style={{
                            padding: '12px 8px',
                            textAlign: 'center',
                            background: isCurrentDay ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-tertiary)',
                            borderBottom: '1px solid var(--border-color)',
                            borderLeft: '1px solid var(--border-color)',
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {DAY_NAMES[i]}
                            </div>
                            <div style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                marginTop: '2px',
                                color: isCurrentDay ? 'var(--primary-400)' : 'var(--text-primary)',
                            }}>
                                {d.getDate()}
                            </div>
                        </div>
                    );
                })}

                {/* Hour rows */}
                {hours.map(hour => (
                    <Fragment key={`row-${hour}`}>
                        <div key={`h-${hour}`} style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'var(--text-muted)',
                            textAlign: 'right',
                            borderTop: '1px solid var(--border-color)',
                            minHeight: '48px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-end',
                        }}>
                            {String(hour).padStart(2, '0')}:00
                        </div>
                        {days.map((d, di) => {
                            const dayEvents = getEventsForDay(d);
                            const hourEvents = dayEvents.filter(e => {
                                if (!e.time) return hour === 8; // default to 8h if no time
                                const eventHour = parseInt(e.time.split(':')[0]);
                                return eventHour === hour;
                            });
                            const isCurrentDay = formatDate(d) === todayStr;

                            return (
                                <div key={`${hour}-${di}`} style={{
                                    borderTop: '1px solid var(--border-color)',
                                    borderLeft: '1px solid var(--border-color)',
                                    padding: '2px',
                                    minHeight: '48px',
                                    background: isCurrentDay ? 'rgba(245, 158, 11, 0.03)' : 'transparent',
                                    cursor: 'pointer',
                                }}
                                    onClick={() => {
                                        if (hourEvents.length === 0) {
                                            const eventDate = new Date(d);
                                            onAddEvent(eventDate, `${String(hour).padStart(2, '0')}:00`);
                                        }
                                    }}
                                >
                                    {hourEvents.map(event => (
                                        <div
                                            key={event.id}
                                            onClick={(e) => { e.stopPropagation(); onEditEvent(event); }}
                                            style={{
                                                padding: '4px 6px',
                                                borderRadius: '4px',
                                                background: `${getEventColor(event.type)}20`,
                                                borderLeft: `3px solid ${getEventColor(event.type)}`,
                                                marginBottom: '2px',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <div style={{ fontSize: '11px', fontWeight: 600, color: getEventColor(event.type), lineHeight: 1.3 }}>
                                                {event.title}
                                            </div>
                                            {event.time && (
                                                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                                                    {event.time}{event.end_time && ` → ${event.end_time}`}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </Fragment>
                ))}
            </div>

            {/* All day events */}
            {events.filter(e => !e.time).length > 0 && (
                <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Événements toute la journée
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {events.filter(e => !e.time).map(event => (
                            <div key={event.id} onClick={() => onEditEvent(event)} style={{
                                padding: '8px 12px',
                                borderRadius: 'var(--border-radius-sm)',
                                background: `${getEventColor(event.type)}15`,
                                borderLeft: `3px solid ${getEventColor(event.type)}`,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: getEventColor(event.type) }}>{event.title}</span>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                    {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                    {event.end_date && ` → ${new Date(event.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ===== EVENT MODAL =====
function EventModal({ show, event, onClose, onSave, onDelete, chantiers, employes }) {
    const isEditing = !!event?.id;
    const [formData, setFormData] = useState({
        title: '', type: 'chantier', description: '', date: '', end_date: '',
        time: '', end_time: '', location: '', chantier_id: '', employe_id: '', team: '',
    });

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title || '',
                type: event.type || 'chantier',
                description: event.description || '',
                date: event.date?.substring(0, 10) || '',
                end_date: event.end_date?.substring(0, 10) || '',
                time: event.time || '',
                end_time: event.end_time || '',
                location: event.location || '',
                chantier_id: event.chantier_id || '',
                employe_id: event.employe_id || '',
                team: event.team || '',
            });
        } else {
            setFormData({
                title: '', type: 'chantier', description: '', date: formatDate(new Date()),
                end_date: '', time: '', end_time: '', location: '', chantier_id: '', employe_id: '', team: '',
            });
        }
    }, [event]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...formData,
            chantier_id: formData.chantier_id || null,
            employe_id: formData.employe_id || null,
            end_date: formData.end_date || null,
            end_time: formData.end_time || null,
        };
        onSave(payload, event?.id);
    };

    if (!show) return null;

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEditing ? 'Modifier l\'événement' : 'Nouvel événement'}</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Type selector - visual */}
                        <div style={{ marginBottom: '20px' }}>
                            <label className="form-label">Type</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                {EVENT_TYPES.map(t => {
                                    const Icon = t.icon;
                                    const isActive = formData.type === t.value;
                                    return (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: t.value })}
                                            style={{
                                                padding: '10px',
                                                borderRadius: 'var(--border-radius-sm)',
                                                background: isActive ? `${t.color}20` : 'var(--bg-tertiary)',
                                                border: isActive ? `2px solid ${t.color}` : '2px solid transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                color: isActive ? t.color : 'var(--text-secondary)',
                                            }}
                                        >
                                            <Icon size={16} />
                                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Titre</label>
                            <input className="form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Titre de l'événement" required />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Date début</label>
                                <input type="date" className="form-input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date fin</label>
                                <input type="date" className="form-input" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Heure début</label>
                                <input type="time" className="form-input" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Heure fin</label>
                                <input type="time" className="form-input" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Lieu</label>
                            <input className="form-input" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Localisation" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Chantier lié</label>
                                <select className="form-input form-select" value={formData.chantier_id} onChange={(e) => setFormData({ ...formData, chantier_id: e.target.value })}>
                                    <option value="">Aucun</option>
                                    {chantiers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Employé assigné</label>
                                <select className="form-input form-select" value={formData.employe_id} onChange={(e) => setFormData({ ...formData, employe_id: e.target.value })}>
                                    <option value="">Aucun</option>
                                    {employes.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-input" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Notes ou détails..." />
                        </div>
                    </div>

                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            {isEditing && (
                                <button type="button" className="btn btn-ghost" style={{ color: 'var(--danger-500)' }} onClick={() => { onDelete(event.id); onClose(); }}>
                                    <Trash2 size={16} />Supprimer
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                            <button type="submit" className="btn btn-primary">{isEditing ? 'Enregistrer' : 'Créer'}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ===== MAIN PLANNING COMPONENT =====
function Planning() {
    const [view, setView] = useState('month'); // 'month' | 'week'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weekStart, setWeekStart] = useState(getMonday(new Date()));
    const [events, setEvents] = useState([]);
    const [myEvents, setMyEvents] = useState([]);
    const [chantiers, setChantiers] = useState([]);
    const [employes, setEmployes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    // Fetch monthly events
    useEffect(() => {
        if (view === 'month') {
            fetchMonthlyEvents();
        }
    }, [currentDate, view]);

    // Fetch weekly events
    useEffect(() => {
        if (view === 'week') {
            fetchWeeklyEvents();
        }
    }, [weekStart, view]);

    // Initial data load
    useEffect(() => {
        fetchContextData();
    }, []);

    const fetchContextData = async () => {
        try {
            const [chantiersRes, employesRes] = await Promise.all([
                planningApi.getChantiers(),
                rhApi.getAllEmployes(),
            ]);
            setChantiers(chantiersRes.data.data || chantiersRes.data || []);
            setEmployes(employesRes.data.data || employesRes.data || []);
        } catch (err) {
            console.error('Erreur chargement contexte:', err);
        }
    };

    const fetchMonthlyEvents = async () => {
        try {
            setLoading(true);
            const res = await planningApi.getEvents({
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear(),
            });
            setEvents(res.data.data || res.data || []);
        } catch (err) {
            console.error('Erreur chargement événements:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchWeeklyEvents = async () => {
        try {
            setLoading(true);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            const res = await planningApi.getMyEvents({
                start_date: formatDate(weekStart),
                end_date: formatDate(weekEnd),
            });
            setMyEvents(res.data.data || res.data || []);
        } catch (err) {
            console.error('Erreur chargement planning perso:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEvent = async (data, eventId) => {
        try {
            if (eventId) {
                await planningApi.updateEvent(eventId, data);
            } else {
                await planningApi.createEvent(data);
            }
            setShowModal(false);
            setEditingEvent(null);
            if (view === 'month') fetchMonthlyEvents();
            else fetchWeeklyEvents();
        } catch (err) {
            console.error('Erreur sauvegarde:', err);
            alert(err.response?.data?.message || 'Erreur lors de la sauvegarde');
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Supprimer cet événement ?')) return;
        try {
            await planningApi.deleteEvent(eventId);
            if (view === 'month') fetchMonthlyEvents();
            else fetchWeeklyEvents();
        } catch (err) {
            console.error('Erreur suppression:', err);
        }
    };

    const openAddModal = (date, time) => {
        const newEvent = {
            date: date ? formatDate(date) : formatDate(new Date()),
            time: time || '',
        };
        setEditingEvent(newEvent);
        setShowModal(true);
    };

    const openEditModal = (event) => {
        setEditingEvent(event);
        setShowModal(true);
    };

    // Navigation
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const goToToday = () => {
        setCurrentDate(new Date());
        setWeekStart(getMonday(new Date()));
    };
    const prevWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        setWeekStart(d);
    };
    const nextWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        setWeekStart(d);
    };

    if (loading && events.length === 0 && myEvents.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                <Loader className="spinner" size={48} style={{ color: 'var(--primary-400)' }} />
            </div>
        );
    }

    return (
        <div>
            {/* Tab switcher */}
            <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '24px',
                padding: '4px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--border-radius-md)',
                width: 'fit-content',
            }}>
                <button
                    onClick={() => setView('month')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: 'var(--border-radius-sm)',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: view === 'month' ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' : 'transparent',
                        color: view === 'month' ? 'white' : 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: view === 'month' ? '0 4px 14px rgba(245, 158, 11, 0.3)' : 'none',
                    }}
                >
                    <CalendarDays size={16} />
                    Planning Mensuel
                </button>
                <button
                    onClick={() => setView('week')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: 'var(--border-radius-sm)',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: view === 'week' ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' : 'transparent',
                        color: view === 'week' ? 'white' : 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: view === 'week' ? '0 4px 14px rgba(245, 158, 11, 0.3)' : 'none',
                    }}
                >
                    <CalendarRange size={16} />
                    Mon Planning
                </button>
            </div>

            {/* Views */}
            {view === 'month' && (
                <MonthlyView
                    currentDate={currentDate}
                    events={events}
                    chantiers={chantiers}
                    onPrevMonth={prevMonth}
                    onNextMonth={nextMonth}
                    onToday={goToToday}
                    onAddEvent={openAddModal}
                    onEditEvent={openEditModal}
                    onDeleteEvent={handleDeleteEvent}
                />
            )}

            {view === 'week' && (
                <WeeklyView
                    weekStart={weekStart}
                    events={myEvents}
                    onPrevWeek={prevWeek}
                    onNextWeek={nextWeek}
                    onToday={goToToday}
                    onAddEvent={openAddModal}
                    onEditEvent={openEditModal}
                    onDeleteEvent={handleDeleteEvent}
                />
            )}

            {/* Event Modal */}
            <EventModal
                show={showModal}
                event={editingEvent}
                onClose={() => { setShowModal(false); setEditingEvent(null); }}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                chantiers={chantiers}
                employes={employes}
            />
        </div>
    );
}

export default Planning;
