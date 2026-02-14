
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { 
  Lightbulb, Activity, Upload, FileSpreadsheet, AlertOctagon, ChevronDown, ChevronUp, CheckCircle2, Circle, Download, FileText, Truck, Scale, Ban, Clock, Database, Users, UserPlus, Trash2, Key, Package, Plus, Lock, ShieldCheck, ArrowLeft, X, Save, TrendingUp, AlertTriangle, Factory, Percent, User as UserIcon
} from 'lucide-react';
import { ShortageRequest, RequestStatus, User, UserRole, Product, Criticality, TimestampEntry } from '../types';
import StatusBadge from './StatusBadge';
import { getAllUsers, saveUser, deleteUser, getAllProducts, saveProduct, deleteProduct, clearAllProducts } from '../db';

interface Props {
  requests: ShortageRequest[];
}

// PALETA MAGNUS
const COLORS = {
  primary: '#FAA61A', // Laranja Magnus
  secondary: '#000000', // Preto
  action: '#D71920', // Vermelho Logo
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#D71920', // Vermelho Magnus para perigo também
  neutral: '#94a3b8',
  production: '#7c3aed',
  waiting: '#8b5cf6'
};

const DashboardView: React.FC<Props> = ({ requests }) => {
  const [activeSubTab, setActiveSubTab] = useState<'METRICS' | 'KANBAN'>('METRICS');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<'USERS' | 'PRODUCTS' | 'DATA'>('USERS');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [newUser, setNewUser] = useState<Partial<User>>({ roles: [] });
  const [showUserModal, setShowUserModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({});
  const [showProductModal, setShowProductModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdminMode) {
      loadUsers();
      loadProducts();
    }
  }, [isAdminMode]);

  const loadUsers = async () => setDbUsers(await getAllUsers());
  const loadProducts = async () => setDbProducts(await getAllProducts());

  // --- PREPARAÇÃO DE DADOS PARA GRÁFICOS ---

  const filtered = useMemo(() => {
    return requests.filter(req => 
      req.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.loadNumber && req.loadNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [requests, searchTerm]);

  const metrics = useMemo(() => {
    const todayStr = new Date().toLocaleDateString();
    
    const deliveredToday = requests.filter(r => 
        r.status === RequestStatus.COLLECTED && 
        r.timestamps.collected && 
        new Date(r.timestamps.collected.date).toLocaleDateString() === todayStr
    );

    const cutsToday = requests.filter(r => 
        r.status === RequestStatus.CANCELLED_CS && 
        r.timestamps.csDecision && 
        new Date(r.timestamps.csDecision.date).toLocaleDateString() === todayStr
    );

    const active = requests.filter(r => r.status !== RequestStatus.COLLECTED && r.status !== RequestStatus.CANCELLED_CS);

    const producingItems = requests.filter(r => r.status === RequestStatus.PRODUCING);
    const producingWeight = producingItems.reduce((acc, curr) => acc + (curr.totalWeight || 0), 0);

    const completedItems = requests.filter(r => 
      (r.status === RequestStatus.WAITING_LOGISTICS || r.status === RequestStatus.COLLECTED) && 
      r.eta && 
      r.timestamps.finishedProduction
    );

    const onTimeItems = completedItems.filter(r => {
      if (!r.timestamps.finishedProduction || !r.eta) return false;
      return new Date(r.timestamps.finishedProduction.date) <= new Date(r.eta);
    });

    const slaPercentage = completedItems.length > 0 
      ? (onTimeItems.length / completedItems.length) * 100 
      : 100;

    return {
      activeCount: active.length,
      deliveredCountToday: deliveredToday.length,
      deliveredWeightToday: deliveredToday.reduce((acc, curr) => acc + (curr.totalWeight || 0), 0),
      cutsCountToday: cutsToday.length,
      producingCount: producingItems.length,
      producingWeight: producingWeight,
      slaPercentage: slaPercentage
    };
  }, [requests]);

  const statusChartData = useMemo(() => {
    const counts = {
      [RequestStatus.PENDING_PCP]: 0,
      [RequestStatus.PENDING_CS]: 0,
      [RequestStatus.WAITING_PRODUCTION]: 0,
      [RequestStatus.PRODUCING]: 0,
      [RequestStatus.WAITING_LOGISTICS]: 0,
    };
    requests.forEach(r => {
      if (counts[r.status] !== undefined) counts[r.status]++;
    });
    return [
      { name: 'PCP', value: counts[RequestStatus.PENDING_PCP], color: '#f59e0b' },
      { name: 'CS', value: counts[RequestStatus.PENDING_CS], color: '#3b82f6' },
      { name: 'Fila Fab', value: counts[RequestStatus.WAITING_PRODUCTION], color: '#6366f1' },
      { name: 'Prod', value: counts[RequestStatus.PRODUCING], color: '#16a34a' },
      { name: 'Aguard. Log', value: counts[RequestStatus.WAITING_LOGISTICS], color: '#FAA61A' },
    ];
  }, [requests]);

  const criticalityData = useMemo(() => {
    const active = requests.filter(r => r.status !== RequestStatus.COLLECTED && r.status !== RequestStatus.CANCELLED_CS);
    const counts = { [Criticality.HIGH]: 0, [Criticality.MEDIUM]: 0, [Criticality.LOW]: 0 };
    active.forEach(r => counts[r.criticality]++);
    return [
      { name: 'Alta', value: counts[Criticality.HIGH], color: '#D71920' },
      { name: 'Média', value: counts[Criticality.MEDIUM], color: '#f59e0b' },
      { name: 'Baixa', value: counts[Criticality.LOW], color: '#000000' },
    ].filter(i => i.value > 0);
  }, [requests]);

  const insights = useMemo(() => {
    const msgs = [];
    const highPriority = requests.filter(r => r.criticality === Criticality.HIGH && r.status !== RequestStatus.COLLECTED && r.status !== RequestStatus.CANCELLED_CS).length;
    const bottleneckPCP = requests.filter(r => r.status === RequestStatus.PENDING_PCP).length;
    const waitingLogistics = requests.filter(r => r.status === RequestStatus.WAITING_LOGISTICS).length;
    const cutsToday = metrics.cutsCountToday;

    if (highPriority > 0) msgs.push({ type: 'danger', text: `${highPriority} Itens de ALTA criticidade parados no fluxo.` });
    if (bottleneckPCP > 5) msgs.push({ type: 'warning', text: `Gargalo no PCP: ${bottleneckPCP} itens aguardando análise.` });
    if (waitingLogistics > 5) msgs.push({ type: 'info', text: `Atenção Logística: ${waitingLogistics} itens prontos aguardando coleta.` });
    if (cutsToday > 0) msgs.push({ type: 'danger', text: `${cutsToday} cortes realizados HOJE. Verificar impacto.` });
    if (msgs.length === 0) msgs.push({ type: 'success', text: 'Fluxo operacional fluindo normalmente. Sem gargalos críticos.' });
    
    return msgs;
  }, [requests, metrics]);

  // Helpers
  const toggleRow = (id: string) => setExpandedRequestId(expandedRequestId === id ? null : id);

  const getTimelineSteps = (req: ShortageRequest) => {
    const getData = (ts?: TimestampEntry) => ts ? { date: ts.date, user: ts.user, active: true } : { date: null, user: null, active: false };
    return [
      { label: 'Abertura (Logística)', ...getData(req.timestamps.reported) },
      { label: 'Análise PCP', ...getData(req.timestamps.requestedByPCP) },
      { label: 'Decisão CS', ...getData(req.timestamps.csDecision) },
      { label: 'Fim Produção (P/ Log)', ...getData(req.timestamps.finishedProduction) },
      { label: 'Expedição Confirmada', ...getData(req.timestamps.collected) },
    ];
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportRequests = () => {
    const headers = ['ID_REQ', 'CARGA', 'CODIGO_ITEM', 'DESCRICAO', 'QUANTIDADE', 'PESO_TOTAL_KG', 'PRIORIDADE', 'STATUS', 'DATA_ABERTURA', 'USR_ABERTURA'];
    const rows = requests.map(r => [
        r.id, r.loadNumber || '', r.code, `"${r.description.replace(/"/g, '""')}"`, r.quantity, r.totalWeight?.toString().replace('.', ','), r.criticality, r.status, r.timestamps.reported.date, r.timestamps.reported.user
    ]);
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    downloadCSV(csvContent, `magnus_syncflow_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportProducts = () => {
    const headers = ['CODIGO', 'DESCRICAO', 'PESO_UNITARIO_KG'];
    const rows = dbProducts.map(p => [p.code, `"${p.description.replace(/"/g, '""')}"`, p.weightPA.toString().replace('.', ',')]);
    downloadCSV([headers.join(';'), ...rows.map(r => r.join(';'))].join('\n'), `magnus_catalogo.csv`);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name || newUser.roles?.length === 0) return;
    await saveUser(newUser as User);
    setNewUser({ roles: [] });
    setShowUserModal(false);
    loadUsers();
  };

  const handleDeleteUser = async (username: string) => {
    if (username === 'admin') return alert('Não é possível excluir o administrador mestre.');
    if (confirm(`Excluir usuário ${username}?`)) {
      await deleteUser(username);
      loadUsers();
    }
  };

  const toggleRole = (role: UserRole) => {
    const currentRoles = newUser.roles || [];
    setNewUser({ ...newUser, roles: currentRoles.includes(role) ? currentRoles.filter(r => r !== role) : [...currentRoles, role] });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.code || !newProduct.description || !newProduct.weightPA) return;
    await saveProduct(newProduct as Product);
    setNewProduct({});
    setShowProductModal(false);
    loadProducts();
  };

  const handleDeleteProduct = async (code: string) => {
    if (confirm(`Excluir o produto ${code}?`)) {
      await deleteProduct(code);
      loadProducts();
    }
  };

  const handleClearAllProducts = async () => {
    if (confirm('ATENÇÃO: Deseja apagar TODOS os produtos?')) {
      await clearAllProducts();
      loadProducts();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || (i === 0 && line.toLowerCase().includes('código'))) continue;
        const parts = line.split(line.includes(';') ? ';' : ',');
        if (parts.length >= 3) {
           const [code, description, weightStr] = parts;
           const weightPA = parseFloat(weightStr.replace(',', '.'));
           if (code && description && !isNaN(weightPA)) await saveProduct({ code, description: description.toUpperCase(), weightPA });
        }
      }
      loadProducts();
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === '2026Log') {
      setIsAdminMode(true);
      setShowPasswordModal(false);
      setAdminPasswordInput('');
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  // --- RENDER ADMIN ---
  if (isAdminMode) {
    return (
      <div className="space-y-6 pb-10">
        <div className="bg-[#FAA61A] text-black p-4 rounded-lg shadow-md flex justify-between items-center border-b-4 border-black">
          <div className="flex items-center gap-3">
            <div className="bg-black p-2 rounded text-[#FAA61A]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="font-black text-lg leading-tight uppercase">Área Administrativa</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Segurança & Master Data</p>
            </div>
          </div>
          <button onClick={() => { setIsAdminMode(false); setActiveSubTab('METRICS'); }} className="bg-black/10 hover:bg-black/20 text-black px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all">
            <ArrowLeft size={16} /> Voltar ao Dashboard
          </button>
        </div>

        <div className="flex border-b border-gray-200 gap-2">
          {['USERS', 'PRODUCTS', 'DATA'].map((tab) => (
             <button key={tab} onClick={() => setAdminTab(tab as any)} className={`px-4 py-2 text-xs font-bold uppercase transition-colors rounded-t-lg ${adminTab === tab ? 'bg-white border-x border-t border-gray-200 text-[#D71920] border-t-2 border-t-[#D71920]' : 'bg-transparent text-gray-400 hover:bg-gray-100'}`}>
                {tab === 'USERS' ? 'Gestão de Usuários' : tab === 'PRODUCTS' ? 'Catálogo de Produtos' : 'Relatórios'}
             </button>
          ))}
        </div>

        {adminTab === 'USERS' && (
          <div className="bg-white border border-gray-200 rounded-b-lg shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-[#f8f9fa]">
              <div className="flex items-center gap-2"><Users size={18} className="text-[#D71920]" /><h5 className="font-bold text-xs text-black uppercase tracking-widest">Lista de Operadores</h5></div>
              <button onClick={() => setShowUserModal(true)} className="bg-[#D71920] hover:bg-red-700 text-white px-3 py-1.5 rounded text-[10px] font-bold shadow-sm flex items-center gap-2"><UserPlus size={14} /> Novo Usuário</button>
            </div>
            <table className="w-full text-left text-[11px]"><thead className="bg-gray-50 text-gray-400 uppercase font-bold"><tr><th className="px-5 py-3">ID</th><th className="px-5 py-3">Nome</th><th className="px-5 py-3">Roles</th><th className="px-5 py-3 text-right">Ação</th></tr></thead><tbody className="divide-y divide-gray-100">{dbUsers.map(user => (<tr key={user.username}><td className="px-5 py-4 font-bold text-black">{user.username}</td><td className="px-5 py-4">{user.name}</td><td className="px-5 py-4 gap-1 flex">{user.roles.map(r => <span key={r} className="bg-orange-100 text-[#D71920] px-1 rounded text-[9px] font-bold">{r}</span>)}</td><td className="px-5 py-4 text-right"><button onClick={() => handleDeleteUser(user.username)}><Trash2 size={16} className="text-gray-300 hover:text-[#D71920]" /></button></td></tr>))}</tbody></table>
          </div>
        )}

        {adminTab === 'PRODUCTS' && (
          <div className="bg-white border border-gray-200 rounded-b-lg shadow-sm">
             <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-[#f8f9fa]">
               <div className="flex items-center gap-2"><Package size={18} className="text-[#D71920]" /><h5 className="font-bold text-xs text-black uppercase tracking-widest">Produtos</h5></div>
               <div className="flex gap-2">
                 <button onClick={handleClearAllProducts} className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded text-[10px] font-bold border border-red-200 flex items-center gap-1"><AlertOctagon size={14}/> Limpar</button>
                 <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                 <button onClick={() => fileInputRef.current?.click()} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1"><FileSpreadsheet size={14}/> Importar CSV</button>
                 <button onClick={() => setShowProductModal(true)} className="bg-[#D71920] hover:bg-red-700 text-white px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1"><Plus size={14}/> Add Item</button>
               </div>
             </div>
             <table className="w-full text-left text-[11px]"><thead className="bg-gray-50 text-gray-400 uppercase font-bold"><tr><th className="px-5 py-3">Código</th><th className="px-5 py-3">Descrição</th><th className="px-5 py-3">Peso</th><th className="px-5 py-3 text-right">Ação</th></tr></thead><tbody className="divide-y divide-gray-100">{dbProducts.map(p => (<tr key={p.code}><td className="px-5 py-3 font-bold text-black">{p.code}</td><td className="px-5 py-3 uppercase text-gray-600">{p.description}</td><td className="px-5 py-3 font-bold">{p.weightPA.toFixed(3)}</td><td className="px-5 py-3 text-right"><button onClick={() => handleDeleteProduct(p.code)}><Trash2 size={16} className="text-gray-300 hover:text-[#D71920]" /></button></td></tr>))}</tbody></table>
          </div>
        )}

        {adminTab === 'DATA' && (
           <div className="bg-white border border-gray-200 rounded-b-lg shadow-sm p-8 text-center">
             <div className="w-16 h-16 bg-orange-50 text-[#D71920] rounded-full flex items-center justify-center mx-auto mb-4"><Database size={32}/></div>
             <h3 className="text-lg font-bold text-black mb-6">Backup de Dados</h3>
             <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto">
               <button onClick={handleExportRequests} className="border border-gray-200 p-4 rounded hover:bg-orange-50 transition-colors group"><Download className="mx-auto mb-2 text-[#FAA61A] group-hover:text-[#D71920]" size={24}/><span className="text-xs font-bold text-gray-600">Baixar Histórico</span></button>
               <button onClick={handleExportProducts} className="border border-gray-200 p-4 rounded hover:bg-green-50 transition-colors group"><FileText className="mx-auto mb-2 text-green-500" size={24}/><span className="text-xs font-bold text-gray-600">Baixar Catálogo</span></button>
             </div>
           </div>
        )}

        {/* MODAIS (User/Product) Simplificados */}
        {showUserModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-white rounded-lg w-full max-w-md border-t-4 border-[#D71920] p-6 shadow-2xl">
                <h3 className="font-bold text-black uppercase mb-4">Novo Usuário</h3>
                <form onSubmit={handleSaveUser} className="space-y-3">
                   <input placeholder="Username" value={newUser.username || ''} onChange={e => setNewUser({...newUser, username: e.target.value.toLowerCase()})} className="w-full border p-2 rounded text-sm font-bold"/>
                   <input placeholder="Nome" value={newUser.name || ''} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full border p-2 rounded text-sm"/>
                   <input type="password" placeholder="Senha" value={newUser.password || ''} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full border p-2 rounded text-sm"/>
                   <div className="grid grid-cols-2 gap-2">{['LOGISTICS','PCP','CS','PRODUCTION','ADMIN'].map(r => <label key={r} className="text-xs flex gap-2 font-bold text-gray-600 uppercase"><input type="checkbox" onChange={() => toggleRole(r as any)} checked={newUser.roles?.includes(r as any)}/> {r}</label>)}</div>
                   <div className="flex gap-2 pt-2"><button type="button" onClick={() => setShowUserModal(false)} className="flex-1 bg-gray-100 p-2 rounded text-xs font-bold">Cancelar</button><button className="flex-1 bg-[#D71920] text-white p-2 rounded text-xs font-bold">Salvar</button></div>
                </form>
             </div>
          </div>
        )}
        {showProductModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-white rounded-lg w-full max-w-md border-t-4 border-[#D71920] p-6 shadow-2xl">
                <h3 className="font-bold text-black uppercase mb-4">Novo Produto</h3>
                <form onSubmit={handleSaveProduct} className="space-y-3">
                   <input placeholder="Código" value={newProduct.code || ''} onChange={e => setNewProduct({...newProduct, code: e.target.value})} className="w-full border p-2 rounded text-sm font-bold"/>
                   <input placeholder="Descrição" value={newProduct.description || ''} onChange={e => setNewProduct({...newProduct, description: e.target.value.toUpperCase()})} className="w-full border p-2 rounded text-sm"/>
                   <input type="number" step="0.001" placeholder="Peso" value={newProduct.weightPA || ''} onChange={e => setNewProduct({...newProduct, weightPA: parseFloat(e.target.value)})} className="w-full border p-2 rounded text-sm"/>
                   <div className="flex gap-2 pt-2"><button type="button" onClick={() => setShowProductModal(false)} className="flex-1 bg-gray-100 p-2 rounded text-xs font-bold">Cancelar</button><button className="flex-1 bg-[#D71920] text-white p-2 rounded text-xs font-bold">Salvar</button></div>
                </form>
             </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="space-y-6 pb-10 relative">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white pr-4">
        <div className="flex overflow-x-auto text-[10px] font-bold uppercase tracking-widest">
          {['METRICS', 'KANBAN'].map((tab) => (
            <button key={tab} onClick={() => setActiveSubTab(tab as any)} className={`px-6 py-4 transition-all ${activeSubTab === tab ? 'text-[#D71920] border-b-4 border-[#D71920] bg-red-50/50' : 'text-gray-400 hover:bg-gray-50'}`}>
              {tab === 'METRICS' && 'Visão Geral'}
              {tab === 'KANBAN' && 'Rastreabilidade'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowPasswordModal(true)} className="text-gray-400 hover:text-[#D71920] flex items-center gap-2 text-[10px] font-bold uppercase transition-colors px-2 py-1 rounded hover:bg-gray-100">
          <Lock size={14} /> Gestão
        </button>
      </div>

      {activeSubTab === 'METRICS' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Entregues Hoje" value={metrics.deliveredCountToday} icon={<Truck size={20} />} color={COLORS.success} />
            <StatCard title="Peso Entregue" value={`${metrics.deliveredWeightToday.toFixed(1).replace('.', ',')} kg`} icon={<Scale size={20} />} color={COLORS.secondary} />
            <StatCard title="Cortes Hoje" value={metrics.cutsCountToday} icon={<Ban size={20} />} color={COLORS.danger} />
            <StatCard title="Em Produção (Qtd)" value={metrics.producingCount} icon={<Factory size={20} />} color={COLORS.production} />
            <StatCard title="Peso em Produção" value={`${metrics.producingWeight.toFixed(1).replace('.', ',')} kg`} icon={<Package size={20} />} color={COLORS.production} />
            <StatCard title="SLA de Atendimento" value={`${Math.round(metrics.slaPercentage)}%`} icon={<Percent size={20} />} color={metrics.slaPercentage >= 90 ? COLORS.success : COLORS.warning} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm p-5">
              <h3 className="font-bold text-black text-sm flex items-center gap-2 mb-6"><TrendingUp size={16} /> Status do Pipeline</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <RechartsTooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {statusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex-1 min-h-[200px]">
                <h3 className="font-bold text-black text-sm mb-4 flex items-center gap-2"><AlertTriangle size={16} /> Criticidade Atual</h3>
                <div className="h-40 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={criticalityData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">{criticalityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><RechartsTooltip /></PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex-1">
                <h3 className="font-bold text-black text-sm mb-4 flex items-center gap-2"><Lightbulb size={16} /> Inteligência</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">{insights.map((insight, idx) => <div key={idx} className="text-[10px] p-2 bg-gray-50 border-l-2 border-gray-400 text-gray-700">{insight.text}</div>)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'KANBAN' && (
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50"><input placeholder="Filtrar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-4 py-2 border rounded text-xs outline-none focus:border-[#D71920]" /></div>
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-400 font-bold uppercase border-b"><tr><th className="px-5 py-4 w-10"></th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Produto</th><th className="px-5 py-4">PCP</th><th className="px-5 py-4 text-right">ETA</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(req => (
                <React.Fragment key={req.id}>
                  <tr onClick={() => toggleRow(req.id)} className={`cursor-pointer transition-colors ${expandedRequestId === req.id ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-5 py-4 text-center text-gray-400">{expandedRequestId === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
                    <td className="px-5 py-4"><StatusBadge status={req.status} /><div className="text-[8px] font-bold text-gray-400 mt-1 uppercase">{req.criticality}</div></td>
                    <td className="px-5 py-4"><div className="font-bold text-black">{req.code}</div><div className="text-gray-500 italic uppercase text-[10px]">{req.description}</div></td>
                    <td className="px-5 py-4"><p className="text-[10px] text-gray-600 italic">"{req.directive || '-'}"</p></td>
                    <td className="px-5 py-4 text-right font-bold text-[#D71920]">{req.eta ? new Date(req.eta).toLocaleString([], {hour:'2-digit', minute:'2-digit'}) : '-'}</td>
                  </tr>
                  {expandedRequestId === req.id && (
                    <tr className="bg-orange-50/30"><td colSpan={5} className="px-8 py-6 border-b border-orange-100">
                        <div className="relative"><h4 className="text-[10px] font-bold text-[#D71920] uppercase mb-4 flex items-center gap-2"><Clock size={12} /> Rastreabilidade</h4>
                          <div className="flex items-center justify-between relative z-10"><div className="absolute top-3 left-0 w-full h-0.5 bg-gray-200 -z-10" />
                            {getTimelineSteps(req).map((step, idx) => (
                              <div key={idx} className="flex flex-col items-center gap-2 bg-transparent group"><div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${step.active ? 'bg-[#D71920] border-[#D71920] text-white scale-110' : 'bg-white border-gray-300 text-gray-300'}`}>{step.active ? <CheckCircle2 size={14} /> : <Circle size={14} />}</div><div className="text-center bg-white/80 p-1 rounded backdrop-blur-sm"><p className={`text-[9px] font-bold uppercase ${step.active ? 'text-black' : 'text-gray-400'}`}>{step.label}</p><p className="text-[8px] text-gray-500 font-medium">{step.date ? new Date(step.date).toLocaleString([], {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '-'}</p></div></div>
                            ))}
                          </div></div></td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-sm shadow-2xl border-t-4 border-[#D71920] p-6 text-center">
            <h3 className="text-sm font-bold text-[#333] mb-4">Senha Administrativa</h3>
            <form onSubmit={handleAdminLogin}>
                <input autoFocus type="password" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} className={`w-full px-4 py-2 border rounded text-sm text-center outline-none focus:border-[#D71920] ${passwordError ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="•••••••"/>
                <div className="flex gap-2 mt-4"><button type="button" onClick={() => {setShowPasswordModal(false); setAdminPasswordInput('');}} className="flex-1 py-2 text-xs font-bold text-gray-500 bg-gray-100 rounded">Cancelar</button><button type="submit" className="flex-1 py-2 text-xs font-bold text-white bg-[#D71920] hover:bg-red-700 rounded shadow-md">Acessar</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
    <div className="absolute right-0 top-0 w-20 h-20 bg-gray-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
    <div className="relative z-10 flex justify-between items-start"><div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p><p className="text-2xl font-bold" style={{ color }}>{value}</p></div><div style={{ backgroundColor: `${color}20`, color }} className="p-2.5 rounded-lg">{icon}</div></div>
  </div>
);

export default DashboardView;
