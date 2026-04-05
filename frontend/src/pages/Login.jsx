import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, Loader, AlertTriangle } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Identifiants incorrects. Veuillez réessayer.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-split">
                {/* Left Side - Image */}
                <div className="login-image-section">
                    <img
                        src="/login-bg.png"
                        alt="Chantier TP"
                        className="login-image-bg"
                    />
                    <div className="login-image-overlay">
                        <div className="login-brand">
                            <div className="login-logo-box">R</div>
                            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>RoadToTP</span>
                        </div>

                        <div className="login-hero-text">
                            <h1>
                                L'excellence <br />
                                sur tous vos <br />
                                <span style={{ color: 'var(--primary-500)' }}>chantiers</span>.
                            </h1>
                            <p>
                                La solution ERP complète pour piloter vos projets de travaux publics avec précision et simplicité.
                            </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                            <div style={{ width: '8px', height: '8px', background: 'var(--success-500)', borderRadius: '50%' }}></div>
                            <span>Système opérationnel v1.0.0</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="login-form-section">
                    <div className="login-form-card">

                        <div style={{ marginBottom: '32px' }}>
                            <h2 className="login-title">Connexion</h2>
                            <p className="login-subtitle">Bienvenue sur votre espace de gestion RoadToTP.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="login-error">
                                    <AlertTriangle size={20} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="login-input-group">
                                <label>Email professionnel</label>
                                <div className="login-input-wrapper">
                                    <User className="login-input-icon" size={20} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="login-input"
                                        placeholder="ex: admin@roadtotp.fr"
                                    />
                                </div>
                            </div>

                            <div className="login-input-group">
                                <label>Mot de passe</label>
                                <div className="login-input-wrapper">
                                    <Lock className="login-input-icon" size={20} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="login-input"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="login-options">
                                <label className="login-checkbox">
                                    <input type="checkbox" style={{ accentColor: 'var(--primary-500)' }} />
                                    <span>Se souvenir de moi</span>
                                </label>
                                <a href="#" className="login-forgot">Mot de passe oublié ?</a>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="login-btn"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="animate-spin" size={20} />
                                        Connexion...
                                    </>
                                ) : (
                                    <>
                                        Se connecter
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                            © 2026 RoadToTP ERP. Tous droits réservés.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
