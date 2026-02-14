
import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Settings2, 
  Factory, 
  LayoutDashboard,
  Headphones,
  LogOut,
  User as UserIcon,
  Lock,
  Dog,
  PawPrint
} from 'lucide-react';
import { RequestStatus, ShortageRequest, UserRole, User } from './types';
import { getAllRequests, saveRequest, saveUser, getAllUsers } from './db';
import LogisticsView from './components/LogisticsView';
import PCPView from './components/PCPView';
import CSView from './components/CSView';
import ProductionView from './components/ProductionView';
import DashboardView from './components/DashboardView';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-4 transition-all relative overflow-hidden group ${
      active 
        ? 'bg-[#FAA61A] text-black font-black' 
        : 'text-gray-400 hover:text-white hover:bg-white/10'
    }`}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />}
    <div className={`relative z-10 transition-transform group-hover:scale-110 ${active ? 'text-black' : ''}`}>
      {icon}
    </div>
    <span className={`text-xs uppercase tracking-widest relative z-10 ${active ? 'font-black' : 'font-bold'}`}>{label}</span>
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UserRole>('ADMIN');
  const [requests, setRequests] = useState<ShortageRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const existingUsers = await getAllUsers();
      if (existingUsers.length === 0) {
        await saveUser({
          id: 'ADM001',
          username: 'admin',
          password: 'admin',
          name: 'Administrador Mestre',
          roles: ['ADMIN', 'LOGISTICS', 'PCP', 'CS', 'PRODUCTION']
        });
        await saveUser({
          id: 'ADM002',
          username: 'BrunoCosta',
          password: '2026Log',
          name: 'Bruno Costa',
          roles: ['ADMIN', 'LOGISTICS', 'PCP', 'CS', 'PRODUCTION']
        });
      }

      const data = await getAllRequests();
      setRequests(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const allUsers = await getAllUsers();
    const user = allUsers.find(u => u.username.toLowerCase() === usernameInput.toLowerCase());
    
    if (user && user.password === passwordInput) {
      setCurrentUser(user);
      setActiveTab(user.roles[0] || 'LOGISTICS');
    } else {
      setLoginError('Credenciais inválidas. Verifique usuário e senha.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUsernameInput('');
    setPasswordInput('');
  };

  const addRequest = async (req: Omit<ShortageRequest, 'id' | 'status' | 'timestamps'>) => {
    if (!currentUser) return;
    const newRequest: ShortageRequest = {
      ...req,
      id: `REQ${Math.floor(Math.random() * 1000000)}`,
      status: RequestStatus.PENDING_PCP,
      timestamps: { 
        reported: {
          date: new Date().toISOString(),
          user: currentUser.name
        }
      }
    };
    await saveRequest(newRequest);
    setRequests(prev => [newRequest, ...prev]);
  };

  const updateRequestStatus = async (id: string, newStatus: RequestStatus, extraData?: Partial<ShortageRequest>) => {
    if (!currentUser) return;
    const updatedRequests = requests.map(req => {
      if (req.id !== id) return req;
      
      const updatedTimestamps = { ...req.timestamps };
      const timestampEntry = { date: new Date().toISOString(), user: currentUser.name };

      if (newStatus === RequestStatus.PENDING_CS) updatedTimestamps.requestedByPCP = timestampEntry;
      if (newStatus === RequestStatus.WAITING_PRODUCTION || newStatus === RequestStatus.CANCELLED_CS) updatedTimestamps.csDecision = timestampEntry;
      if (newStatus === RequestStatus.WAITING_LOGISTICS) updatedTimestamps.finishedProduction = timestampEntry;
      if (newStatus === RequestStatus.COLLECTED) updatedTimestamps.collected = timestampEntry;

      const updated = { ...req, ...extraData, status: newStatus, timestamps: updatedTimestamps };
      saveRequest(updated);
      return updated;
    });
    setRequests(updatedRequests);
  };

  const renderActiveView = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'ADMIN': return <DashboardView requests={requests} />;
      case 'LOGISTICS': return <LogisticsView requests={requests} onAdd={addRequest} onCollect={(id) => updateRequestStatus(id, RequestStatus.COLLECTED)} />;
      case 'PCP': return <PCPView requests={requests} onApprove={(id, eta, directive) => updateRequestStatus(id, RequestStatus.PENDING_CS, { eta, directive })} />;
      case 'CS': return <CSView requests={requests} onDecision={(id, decision) => updateRequestStatus(id, decision === 'PRODUCE' ? RequestStatus.WAITING_PRODUCTION : RequestStatus.CANCELLED_CS)} />;
      case 'PRODUCTION': return <ProductionView requests={requests} onStart={(id) => updateRequestStatus(id, RequestStatus.PRODUCING)} onFinish={(id) => updateRequestStatus(id, RequestStatus.WAITING_LOGISTICS)} />;
      default: return <DashboardView requests={requests} />;
    }
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-[#FAA61A] font-black text-black text-xl"><PawPrint className="animate-bounce mr-2"/> Carregando...</div>;

  if (!currentUser) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FAA61A] relative overflow-hidden">
        {/* Background Elements simulating the Ad */}
        <div className="absolute bottom-0 w-full h-32 bg-black border-t-[6px] border-white rounded-t-[50%] scale-x-125 z-0"></div>
        
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 border-4 border-black">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center bg-[#D71920] text-white px-6 py-2 rounded-full mb-4 font-black text-2xl uppercase tracking-wider shadow-lg transform -rotate-2 border-2 border-white">
              Magnus
            </div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">De Sabor a Gente Entende</h2>
            <h1 className="text-xl font-black text-black mt-1">Portal de Logística & Produção</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Usuário</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 text-[#D71920]" size={16} />
                <input required value={usernameInput} onChange={e => setUsernameInput(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm bg-gray-50 text-black font-bold focus:border-[#D71920] outline-none transition-colors" placeholder="Ex: BrunoCosta" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-[#D71920]" size={16} />
                <input type="password" required value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm bg-gray-50 text-black font-bold focus:border-[#D71920] outline-none transition-colors" placeholder="••••••••" />
              </div>
            </div>
            {loginError && <p className="text-[10px] text-white font-bold bg-[#D71920] p-2 rounded text-center shadow-sm">{loginError}</p>}
            <button className="w-full bg-black text-[#FAA61A] hover:bg-gray-900 font-black py-3.5 rounded-lg shadow-lg uppercase tracking-wider transition-all hover:scale-[1.02] border-b-4 border-[#FAA61A] flex items-center justify-center gap-2">
              <PawPrint size={18} /> Acessar Sistema
            </button>
          </form>
        </div>
        
        <div className="absolute bottom-4 right-6 z-10 text-white text-xs font-bold opacity-80 flex items-center gap-2">
            <Dog size={16} /> Powered by SyncFlow
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f4f4]">
      {/* HEADER MAGNUS STYLE */}
      <header className="h-16 bg-[#FAA61A] flex items-center justify-between px-6 shadow-lg z-50 border-b-4 border-white">
        <div className="flex items-center gap-3">
            <div className="bg-[#D71920] text-white px-3 py-1 rounded-lg font-black text-xl italic tracking-tighter border-2 border-white shadow-sm transform -rotate-1">
                Magnus
            </div>
            <div className="h-6 w-px bg-black/20 mx-1"></div>
            <span className="font-bold text-black text-sm uppercase tracking-tight opacity-80 hidden md:block">Sistema de Gestão Industrial</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-black/5 px-3 py-1.5 rounded-full border border-black/10">
            <div className="w-8 h-8 rounded-full bg-black text-[#FAA61A] flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
              {currentUser.username.substring(0,2).toUpperCase()}
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-black uppercase leading-tight">{currentUser.name}</span>
                <span className="text-[8px] font-bold text-[#D71920] uppercase leading-tight">{currentUser.roles[0]}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="bg-white p-2 rounded-full text-[#D71920] hover:bg-[#D71920] hover:text-white transition-all shadow-sm">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR BLACK STYLE (Like the bottom of the Ad) */}
        <nav className="w-16 md:w-60 bg-black flex flex-col shadow-xl z-40">
          <div className="py-6 space-y-2">
            {currentUser.roles.includes('ADMIN') && <SidebarItem icon={<LayoutDashboard size={22} />} label="Painel Gerencial" active={activeTab === 'ADMIN'} onClick={() => setActiveTab('ADMIN')} />}
            {currentUser.roles.includes('LOGISTICS') && <SidebarItem icon={<Truck size={22} />} label="Expedição" active={activeTab === 'LOGISTICS'} onClick={() => setActiveTab('LOGISTICS')} />}
            {currentUser.roles.includes('PCP') && <SidebarItem icon={<Settings2 size={22} />} label="PCP" active={activeTab === 'PCP'} onClick={() => setActiveTab('PCP')} />}
            {currentUser.roles.includes('CS') && <SidebarItem icon={<Headphones size={22} />} label="Cust. Service" active={activeTab === 'CS'} onClick={() => setActiveTab('CS')} />}
            {currentUser.roles.includes('PRODUCTION') && <SidebarItem icon={<Factory size={22} />} label="Produção" active={activeTab === 'PRODUCTION'} onClick={() => setActiveTab('PRODUCTION')} />}
          </div>
          
          <div className="mt-auto p-4 opacity-30">
             <Dog className="text-white mx-auto w-10 h-10" />
          </div>
        </nav>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f4f4f4]">
          <div className="max-w-7xl mx-auto">
             {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
