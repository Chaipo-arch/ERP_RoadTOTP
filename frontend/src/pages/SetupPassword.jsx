import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { invitationApi } from '../services/api';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, User, ArrowRight, Shield } from 'lucide-react';
import '../index.css';

export default function SetupPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const [validating, setValidating] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [tokenError, setTokenError] = useState('');
    const [companyName, setCompanyName] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        validateToken();
    }, []);

    const validateToken = async () => {
        if (!token || !email) {
            setTokenError('Lien d\'invitation invalide. Paramètres manquants.');
            setValidating(false);
            return;
        }

        try {
            const res = await invitationApi.validate({ token, email });
            setTokenValid(true);
            setCompanyName(res.data.company || '');
        } catch (err) {
            setTokenError(err.response?.data?.message || 'Ce lien d\'invitation est invalide ou a expiré.');
        } finally {
            setValidating(false);
        }
    };

    const passwordStrength = (pwd) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    };

    const strengthLabel = (score) => {
        if (score <= 1) return { text: 'Faible', color: 'var(--danger-500)' };
        if (score <= 2) return { text: 'Moyen', color: 'var(--warning-500)' };
        if (score <= 3) return { text: 'Bon', color: 'var(--info-500)' };
        return { text: 'Fort', color: 'var(--success-500)' };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.password_confirmation) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        if (formData.password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }

        setLoading(true);

        try {
            await invitationApi.setupPassword({
                token,
                email,
                name: formData.name,
                password: formData.password,
                password_confirmation: formData.password_confirmation,
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la création du compte.');
        } finally {
            setLoading(false);
        }
    };

    const strength = passwordStrength(formData.password);
    const strengthInfo = strengthLabel(strength);

    // Loading state
    if (validating) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--slate-950)', fontFamily: "'Inter', sans-serif"
            }}>
                <div style={{ textAlign: 'center' }}>
                    <span className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 20px', display: 'block' }}></span>
                    <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Vérification du lien d'invitation...</p>
                </div>
            </div>
        );
    }

    // Invalid token
    if (!tokenValid) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--slate-950)', fontFamily: "'Inter', sans-serif", padding: '20px'
            }}>
                <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '48px 40px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 24px',
                        background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <AlertCircle size={32} style={{ color: 'var(--danger-500)' }} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                        Lien invalide
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
                        {tokenError}
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/login')}>
                        Aller à la page de connexion
                    </button>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--slate-950)', fontFamily: "'Inter', sans-serif", padding: '20px'
            }}>
                <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '48px 40px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 24px',
                        background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <CheckCircle size={32} style={{ color: 'var(--success-500)' }} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                        Compte créé avec succès !
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
                        Votre compte a été créé. Vous pouvez maintenant vous connecter avec votre adresse email et le mot de passe que vous venez de définir.
                    </p>
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={() => navigate('/login')}
                    >
                        Se connecter
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    // Setup password form
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--slate-950)', fontFamily: "'Inter', sans-serif", padding: '20px'
        }}>
            <div className="card" style={{ maxWidth: '500px', width: '100%', padding: 0, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08))',
                    padding: '36px 40px', textAlign: 'center',
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '14px', margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Shield size={28} style={{ color: 'white' }} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Créez votre mot de passe
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                        {companyName && <>Vous rejoignez <strong style={{ color: 'var(--primary-400)' }}>{companyName}</strong><br /></>}
                        Finalisez votre inscription en choisissant vos identifiants.
                    </p>
                </div>

                {/* Form */}
                <div style={{ padding: '32px 40px' }}>
                    {/* Email display (read only) */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                        background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-md)',
                        marginBottom: '24px', border: '1px solid var(--border-color)'
                    }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: 'var(--border-radius-sm)',
                            background: 'rgba(245, 158, 11, 0.15)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <Lock size={16} style={{ color: 'var(--primary-400)' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Adresse email
                            </div>
                            <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                {email}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: '14px 16px', marginBottom: '20px', borderRadius: 'var(--border-radius-md)',
                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#fca5a5', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px'
                        }}>
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Nom complet</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Votre nom et prénom"
                                    required
                                    style={{ paddingLeft: '44px' }}
                                />
                                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Mot de passe</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Minimum 8 caractères"
                                    required
                                    minLength={8}
                                    style={{ paddingLeft: '44px', paddingRight: '44px' }}
                                />
                                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                                        padding: 0, display: 'flex'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Password strength indicator */}
                            {formData.password && (
                                <div style={{ marginTop: '10px' }}>
                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    height: '4px', flex: 1, borderRadius: '2px',
                                                    background: i <= strength ? strengthInfo.color : 'var(--bg-tertiary)',
                                                    transition: 'background 0.2s'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span style={{ fontSize: '12px', color: strengthInfo.color, fontWeight: 500 }}>
                                        Sécurité : {strengthInfo.text}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirmer le mot de passe</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    className="form-input"
                                    value={formData.password_confirmation}
                                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                    placeholder="Retapez votre mot de passe"
                                    required
                                    minLength={8}
                                    style={{ paddingLeft: '44px', paddingRight: '44px' }}
                                />
                                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    style={{
                                        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                                        padding: 0, display: 'flex'
                                    }}
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Match indicator */}
                            {formData.password_confirmation && (
                                <div style={{ marginTop: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {formData.password === formData.password_confirmation ? (
                                        <><CheckCircle size={14} style={{ color: 'var(--success-500)' }} /><span style={{ color: 'var(--success-500)' }}>Les mots de passe correspondent</span></>
                                    ) : (
                                        <><AlertCircle size={14} style={{ color: 'var(--danger-500)' }} /><span style={{ color: 'var(--danger-500)' }}>Les mots de passe ne correspondent pas</span></>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || formData.password !== formData.password_confirmation}
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '8px', padding: '16px' }}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    Créer mon compte
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
