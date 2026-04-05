import { useState, useEffect } from 'react';
import { rhApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, Check, X, Loader, Plus, Filter, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import '../../index.css';

export default function Conges() {
    const { user } = useAuth();
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [balance, setBalance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
    const [currentEmployeId, setCurrentEmployeId] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        leave_type_id: '',
        start_date: '',
        duration: '',
        reason: '',
    });

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarSelection, setCalendarSelection] = useState({ start: null, end: null });

    // Charger les données initiales
    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const employeResponse = await rhApi.getEmployeByUserId();

            if (employeResponse.data) {
                const empId = employeResponse.data.id;
                setCurrentEmployeId(empId);

                // Charger les demandes de congés
                const params = filter !== 'all' ? { status: filter, employe_id: empId } : { employe_id: empId };
                const requestsRes = await rhApi.getLeaveRequests(params);
                setLeaveRequests(requestsRes.data.data || requestsRes.data);

                // Charger le solde
                const balanceRes = await rhApi.getLeaveBalance(empId);
                setBalance(balanceRes.data.balances || []);
            }
            const leaveTypesRes = await rhApi.getLeaveTypes();
            setLeaveTypes(leaveTypesRes.data.data || leaveTypesRes.data || []);


        } catch (error) {
            console.error('Erreur chargement données:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentEmployeId) {
            alert("Erreur : Employé non trouvé. Veuillez vous assurer que votre compte est lié à un employé.");
            return;
        }

        try {
            setSubmitting(true);
            await rhApi.createLeaveRequest({
                ...formData,
                employe_id: currentEmployeId,
            });

            // Réinitialiser le formulaire
            setFormData({
                leave_type_id: '',
                start_date: '',
                duration: '',
                reason: '',
            });
            setCalendarSelection({ start: null, end: null });

            setShowModal(false);
            fetchData(); // Recharger les données
        } catch (error) {
            console.error('Erreur création demande:', error);
            alert(error.response?.data?.message || 'Erreur lors de la création de la demande');
        } finally {
            setSubmitting(false);
        }
    };

    // Calendar & Balance logic
    const getAvailableBalance = (typeId) => {
        const lType = leaveTypes.find(t => String(t.id) === String(typeId));
        if (!lType) return 0;
        const empBalance = balance.find(b => b.leave_type === lType.name);
        return empBalance ? parseFloat(empBalance.balance) : 0;
    };

    const currentBalance = formData.leave_type_id ? getAvailableBalance(formData.leave_type_id) : 0;

    const firstDayOfMonth = (year, month) => {
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; 
    };

    const handleDateClick = (dayNum) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
        const dayOfWeek = clickedDate.getDay();
        
        // Ignorer les week-ends
        if (dayOfWeek === 0 || dayOfWeek === 6) return;

        let newStart = calendarSelection.start;
        let newEnd = calendarSelection.end;

        if (!newStart || (newStart && newEnd)) {
            newStart = clickedDate;
            newEnd = null;
        } else {
            if (clickedDate < newStart) {
                newStart = clickedDate;
            } else {
                newEnd = clickedDate;
            }
        }

        setCalendarSelection({ start: newStart, end: newEnd });

        // Calculer la durée en jours ouvrés
        let count = 0;
        if (newStart && !newEnd) {
            count = 1;
        } else if (newStart && newEnd) {
            let cur = new Date(newStart);
            while (cur <= newEnd) {
                const d = cur.getDay();
                if (d !== 0 && d !== 6) count++;
                cur.setDate(cur.getDate() + 1);
            }
        }

        const tzOff = newStart.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(newStart - tzOff)).toISOString().slice(0, 10);
        
        setFormData(prev => ({ 
            ...prev, 
            start_date: localISOTime, 
            duration: count 
        }));
    };

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDay = firstDayOfMonth(year, month);
        
        const days = [];
        for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="cal-day empty"></div>);
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            let isSelected = false;
            let isStart = false;
            let isEnd = false;
            let isBetween = false;

            if (calendarSelection.start && date.getTime() === calendarSelection.start.getTime()) {
                isSelected = true; isStart = true;
            }
            if (calendarSelection.end && date.getTime() === calendarSelection.end.getTime()) {
                isSelected = true; isEnd = true;
            }
            if (calendarSelection.start && calendarSelection.end && date > calendarSelection.start && date < calendarSelection.end) {
                isBetween = true;
                if (!isWeekend) isSelected = true;
            }

            days.push(
                <div 
                    key={`day-${i}`} 
                    onClick={() => handleDateClick(i)}
                    className={`cal-day ${isWeekend ? 'weekend' : 'workday'} ${isSelected ? 'selected' : ''} ${isStart ? 'start-date' : ''} ${isEnd ? 'end-date' : ''} ${isBetween ? 'between-date' : ''}`}
                    style={{
                        padding: '8px', textAlign: 'center', cursor: isWeekend ? 'not-allowed' : 'pointer',
                        borderRadius: isStart ? '8px 0 0 8px' : (isEnd ? '0 8px 8px 0' : (isSelected ? '0' : '8px')),
                        backgroundColor: isSelected ? 'var(--primary-500)' : (isWeekend ? 'var(--bg-tertiary)' : 'transparent'),
                        color: isSelected ? 'white' : (isWeekend ? 'var(--text-muted)' : 'var(--text-primary)'),
                        opacity: isWeekend ? 0.5 : 1
                    }}
                >
                    {i}
                </div>
            );
        }

        const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

        return (
            <div className="custom-calendar" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <button type="button" onClick={prevMonth} className="btn-icon" style={{ background: 'var(--bg-tertiary)' }}><ChevronLeft size={16}/></button>
                    <h4 style={{ fontWeight: 600 }}>{monthNames[month]} {year}</h4>
                    <button type="button" onClick={nextMonth} className="btn-icon" style={{ background: 'var(--bg-tertiary)' }}><ChevronRight size={16}/></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div><div>Ven</div><div>Sam</div><div>Dim</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px 0' }}>
                    {days}
                </div>
            </div>
        );
    };

    const handleCancel = async (id) => {
        if (!confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) return;

        try {
            await rhApi.cancelLeaveRequest(id);
            fetchData();
        } catch (error) {
            console.error('Erreur annulation:', error);
            alert(error.response?.data?.message || "Erreur lors de l'annulation");
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'badge-warning',
            approved: 'badge-success',
            rejected: 'badge-error',
            cancelled: 'badge-ghost',
        };

        const labels = {
            pending: 'En attente',
            approved: 'Approuvé',
            rejected: 'Rejeté',
            cancelled: 'Annulé',
        };

        return <span className={`badge ${badges[status]}`}>{labels[status]}</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="animate-spin" size={48} />
            </div>
        );
    }

    return (
        <div className="ged-page">
            <div className="ged-page-header">
                <div>
                    <h2 className="ged-page-title">Mes Congés</h2>
                    <p className="ged-page-subtitle">Gérez vos demandes de congés et consultez votre solde</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary" style={{ height: 'fit-content' }}>
                    <Plus size={20} />
                    Nouvelle demande
                </button>
            </div>

            {/* Solde de congés */}
            <div className="stats-grid mb-8">
                {balance.map((item, index) => (
                    <div key={index} className="stat-card animate-slide-up" style={{ animationDelay: `${index * 80}ms` }}>
                        <div className={`stat-icon ${item.is_paid ? 'success' : 'warning'}`}>
                            <Calendar size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-label">{item.leave_type}</div>
                            <div className="stat-value">{item.balance} jours</div>
                            <div className="stat-change neutral">
                                {item.is_paid ? 'Congés payés' : 'Congés non payés'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtres */}
            <div className="ged-category-tabs mb-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                {[
                    { id: 'all', label: 'Tous', icon: Filter },
                    { id: 'pending', label: 'En attente', icon: Clock },
                    { id: 'approved', label: 'Approuvés', icon: Check },
                    { id: 'rejected', label: 'Rejetés', icon: X }
                ].map(f => (
                    <button
                        key={f.id}
                        className={`ged-category-tab ${filter === f.id ? 'ged-category-tab--active' : ''}`}
                        onClick={() => setFilter(f.id)}
                    >
                        <f.icon size={16} />
                        <span>{f.label}</span>
                    </button>
                ))}
            </div>

            {/* Liste des demandes */}
            <div className="card ged-library-card animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="card-header ged-library-header">
                    <div>
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Calendar size={20} style={{ color: 'var(--primary-400)' }} />
                            Historique des demandes
                        </h3>
                        <p className="card-subtitle">{leaveRequests.length} demande{leaveRequests.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {leaveRequests.length === 0 ? (
                    <div className="empty-state" style={{ padding: '48px 24px' }}>
                        <Calendar size={56} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: 16 }} />
                        <p className="empty-state-title">Aucune demande de congé</p>
                        <p className="empty-state-text">Vous n'avez pas encore fait de demande pour ce statut.</p>
                    </div>
                ) : (
                    <div className="table-container" style={{ border: 'none' }}>
                        <table className="table ged-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Période</th>
                                    <th>Durée</th>
                                    <th>Statut</th>
                                    <th>Motif</th>
                                    <th style={{ width: 100 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaveRequests.map((request) => (
                                    <tr key={request.id} className="ged-doc-row">
                                        <td>
                                            <div className="ged-doc-row-name">
                                                <div className="ged-doc-row-icon" style={{ '--file-color': request.status === 'approved' ? '#34d399' : (request.status === 'rejected' ? '#f87171' : '#60a5fa') }}>
                                                    <Calendar size={18} />
                                                </div>
                                                <div>
                                                    <p className="ged-doc-row-filename">{request.leave_type?.name}</p>
                                                    {request.approved_by && (
                                                        <span className="ged-doc-row-ext" style={{ fontSize: '0.75rem' }}>Traité par {request.approved_by.full_name}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {new Date(request.start_date).toLocaleDateString('fr-FR')} - {new Date(request.end_date).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{request.duration} j</td>
                                        <td>{getStatusBadge(request.status)}</td>
                                        <td>
                                            <span style={{ maxWidth: '150px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={request.reason}>
                                                {request.reason || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="ged-doc-row-actions">
                                                {request.status === 'pending' ? (
                                                    <button onClick={() => handleCancel(request.id)} title="Annuler" className="ged-row-btn ged-row-btn--danger">
                                                        <X size={16} />
                                                    </button>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Nouvelle demande */}
            {showModal && (
                <div className="modal-overlay active" onClick={() => setShowModal(false)}>
                    <div className="modal-pro" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-pro-header">
                            <div>
                                <h2>Nouvelle demande de congé</h2>
                                <p>Sélectionnez vos dates de congés directement sur le planning</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="modal-pro-close">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-pro-body" style={{ display: 'flex', gap: '32px', paddingBottom: '32px' }}>
                                {/* Left side: Form */}
                                <div style={{ flex: 1 }}>
                                    <div className="form-group">
                                        <label className="form-label">Type de congé</label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                className="form-input form-select"
                                                value={formData.leave_type_id}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, leave_type_id: e.target.value });
                                                }}
                                                required
                                            >
                                                <option value="">Sélectionner un type</option>
                                                {leaveTypes.map((type) => {
                                                    const b = getAvailableBalance(type.id);
                                                    return (
                                                        <option key={type.id} value={type.id}>
                                                            {type.name}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>

                                    {formData.leave_type_id && (
                                        <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', background: currentBalance > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: currentBalance > 0 ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '14px', color: currentBalance > 0 ? 'var(--success-500)' : 'var(--danger-500)', fontWeight: 600 }}>Jours disponibles</span>
                                                <span style={{ fontSize: '24px', fontWeight: 'bold', color: currentBalance > 0 ? 'var(--success-500)' : 'var(--danger-500)' }}>{currentBalance}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                            <label className="form-label">Date (début)</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                required
                                                readOnly // We encourage using calendar
                                                style={{ background: 'var(--bg-tertiary)', opacity: 0.8 }}
                                            />
                                        </div>

                                        <div className="form-group" style={{ width: '100px', marginBottom: 0 }}>
                                            <label className="form-label">Durée</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0.5"
                                                className="form-input"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                                required
                                                style={{ fontWeight: 'bold', color: formData.duration > currentBalance ? 'var(--danger-500)' : 'inherit' }}
                                            />
                                        </div>
                                    </div>

                                    {formData.duration > currentBalance && formData.leave_type_id && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger-500)', fontSize: '13px', marginBottom: '20px', marginTop: '-12px' }}>
                                            <AlertTriangle size={14} />
                                            <span>Attention, la durée dépasse votre solde disponible.</span>
                                        </div>
                                    )}

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Motif (optionnel)</label>
                                        <textarea
                                            className="form-input"
                                            rows="3"
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                            placeholder="Indiquez la raison de votre demande..."
                                        />
                                    </div>
                                </div>
                                
                                {/* Right side: Calendar */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <label className="form-label">Planning</label>
                                    {renderCalendar()}
                                </div>
                            </div>

                            <div className="modal-pro-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" disabled={submitting}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn-primary" disabled={submitting || (formData.duration > currentBalance && formData.leave_type_id)}>
                                    {submitting ? 'Envoi...' : 'Soumettre la demande'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
