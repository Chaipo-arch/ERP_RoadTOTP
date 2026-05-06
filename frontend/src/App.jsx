import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chantiers from './pages/Chantiers';
import Employes from './pages/Employes';
import Materiels from './pages/Materiels';
import Cartographie from './pages/Cartographie';
import Clients from './pages/Clients';
import Planning from './pages/Planning';
import Documents from './pages/Documents';
import Landing from './pages/Landing';
import CreateUser from './pages/Admin/CreateUser';
import Roles from './pages/Admin/Roles';
import Chat from './pages/Chat';
import SetupPassword from './pages/SetupPassword';
import { AdminRoute } from './components/AdminRoute';

// Pages RH
import Conges from './pages/RH/Conges';
import ValidationConges from './pages/RH/ValidationConges';
import Equipes from './pages/RH/Equipes';
import Organigramme from './pages/RH/Organigramme';
import ContratModeles from './pages/ContratModeles';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/setup-password" element={<SetupPassword />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/chantiers" element={<Chantiers />} />
                        <Route path="/employes" element={<Employes />} />
                        <Route path="/materiels" element={<Materiels />} />
                        <Route path="/cartographie" element={<Cartographie />} />
                        <Route path="/clients" element={<Clients />} />
                        <Route path="/planning" element={<Planning />} />
                        <Route path="/documents" element={<Documents />} />
                        <Route path="/chat" element={<Chat />} />

                        {/* Routes RH */}
                        <Route path="/rh/conges" element={<Conges />} />
                        <Route path="/rh/validation-conges" element={<ValidationConges />} />
                        <Route path="/rh/equipes" element={<Equipes />} />
                        <Route path="/rh/organigramme" element={<Organigramme />} />

                        {/* Routes Légal / Contrats */}
                        <Route path="/contrats/modeles" element={<ContratModeles />} />

                        <Route element={<AdminRoute />}>
                            <Route path="/admin/create-user" element={<CreateUser />} />
                            <Route path="/admin/roles" element={<Roles />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
