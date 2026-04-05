import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

export default function Landing() {
    const { user } = useAuth();

    return (
        <div className="landing-page">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="landing-container">
                    <div className="nav-content">
                        <div className="brand">
                            <div className="brand-logo">R</div>
                            <span className="brand-text">RoadToTP</span>
                        </div>
                        <div>
                            {user ? (
                                <Link to="/dashboard" className="btn btn-primary btn-sm">
                                    Tableau de bord
                                </Link>
                            ) : (
                                <Link to="/login" className="btn btn-ghost btn-sm">
                                    Connexion
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-glow">
                    <div className="glow-blob blob-1"></div>
                    <div className="glow-blob blob-2"></div>
                </div>

                <div className="landing-container hero-content">
                    <h1 className="hero-title">
                        Gérez vos chantiers <br /> avec une simplicité absolue.
                    </h1>
                    <p className="hero-subtitle">
                        La solution ERP complète pour les professionnels du BTP. Planification, suivi de chantier, gestion des ressources et facturation en un seul endroit.
                    </p>
                    <div className="hero-actions">
                        <Link
                            to={user ? "/dashboard" : "/login"}
                            className="btn-landing-primary"
                        >
                            Commencer maintenant
                        </Link>
                        <a
                            href="#features"
                            className="btn-landing-secondary"
                        >
                            En savoir plus
                        </a>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div id="features" className="features-section">
                <div className="landing-container">
                    <div className="section-header">
                        <h2 className="section-title">Tout ce dont vous avez besoin</h2>
                        <p className="section-subtitle">Une suite d'outils puissants pour piloter votre activité.</p>
                    </div>
                    <div className="features-grid">
                        {[
                            { title: 'Gestion de Chantiers', desc: 'Suivez l\'avancement, les coûts et les ressources de chaque projet en temps réel.', icon: '🏗️' },
                            { title: 'Planification Intelligente', desc: 'Assignez facilement vos équipes et matériels avec notre calendrier interactif.', icon: '📅' },
                            { title: 'Suivi Financier', desc: 'Analysez la rentabilité, gérez les devis et factures en quelques clics.', icon: '💰' },
                            { title: 'Gestion des Ressources', desc: 'Invitez vos employés, gérez les rôles et suivez les heures travaillées.', icon: '👥' },
                            { title: 'GED Centralisée', desc: 'Stockez et partagez tous vos documents de chantier en toute sécurité.', icon: '📂' },
                            { title: 'Rapports Détaillés', desc: 'Des tableaux de bord précis pour prendre les bonnes décisions.', icon: '📊' },
                        ].map((feature, i) => (
                            <div key={i} className="feature-card">
                                <span className="feature-icon">{feature.icon}</span>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-desc">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            <div className="pricing-section">
                <div className="landing-container">
                    <div className="section-header">
                        <h2 className="section-title">Tarification Simple</h2>
                        <p className="section-subtitle">Choisissez le plan qui correspond à votre entreprise.</p>
                    </div>

                    <div className="pricing-grid">
                        {/* Starter */}
                        <div className="pricing-card">
                            <h3 className="pricing-name">Starter</h3>
                            <div className="pricing-price">49€<span className="pricing-period">/mois</span></div>
                            <ul className="pricing-features">
                                <li className="pricing-feature"><span className="pricing-check">✓</span> Jusqu'à 5 utilisateurs</li>
                                <li className="pricing-feature"><span className="pricing-check">✓</span> 10 chantiers actifs</li>
                                <li className="pricing-feature"><span className="pricing-check">✓</span> Support par email</li>
                            </ul>
                            <button className="btn-pricing outline">
                                Commencer
                            </button>
                        </div>

                        {/* Pro */}
                        <div className="pricing-card highlight">
                            <div className="pricing-badge">POPULAIRE</div>
                            <h3 className="pricing-name highlight-text">Pro</h3>
                            <div className="pricing-price">99€<span className="pricing-period">/mois</span></div>
                            <ul className="pricing-features">
                                <li className="pricing-feature"><span className="pricing-check highlight-icon">✓</span> Jusqu'à 20 utilisateurs</li>
                                <li className="pricing-feature"><span className="pricing-check highlight-icon">✓</span> Chantiers illimités</li>
                                <li className="pricing-feature"><span className="pricing-check highlight-icon">✓</span> Planning avancé</li>
                                <li className="pricing-feature"><span className="pricing-check highlight-icon">✓</span> Support prioritaire</li>
                            </ul>
                            <button className="btn-pricing primary">
                                Commencer
                            </button>
                        </div>

                        {/* Enterprise */}
                        <div className="pricing-card">
                            <h3 className="pricing-name">Enterprise</h3>
                            <div className="pricing-price">Sur devis</div>
                            <ul className="pricing-features">
                                <li className="pricing-feature"><span className="pricing-check">✓</span> Utilisateurs illimités</li>
                                <li className="pricing-feature"><span className="pricing-check">✓</span> API dédiée</li>
                                <li className="pricing-feature"><span className="pricing-check">✓</span> Hébergement personnalisé</li>
                                <li className="pricing-feature"><span className="pricing-check">✓</span> Manager dédié</li>
                            </ul>
                            <button className="btn-pricing outline">
                                Contactez-nous
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-container">
                    <p>&copy; 2026 ROADTOTP. Tous droits réservés.</p>
                </div>
            </footer>
        </div>
    );
}
