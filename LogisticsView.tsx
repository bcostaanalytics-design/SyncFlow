
import React, { useState, useEffect } from 'react';
import { Plus, Package, Check, X, ClipboardList, Info, Scale, AlertCircle, CheckCircle2, Truck, User } from 'lucide-react';
import { ShortageRequest, RequestStatus, Criticality, Product } from '../types';
import StatusBadge from './StatusBadge';
import { getAllProducts } from '../db';

interface Props {
  requests: ShortageRequest[];
  onAdd: (req: any) => void;
  onCollect: (id: string) => void;
}

const LogisticsView: React.FC<Props> = ({ requests, onAdd, onCollect }) => {
  const [showModal, setShowModal] = useState(false);
  const [isItemValid, setIsItemValid] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    quantity: 1,
    totalWeight: 0,
    criticality: Criticality.LOW,
    loadNumber: ''
  });

  useEffect(() => {
    const loadProducts = async () => {
      const prods = await getAllProducts();
      setProducts(prods);
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const trimmedCode = formData.code.trim();
    if (!trimmedCode) {
      setFormData(prev => ({ ...prev, description: '', totalWeight: 0 }));
      setIsItemValid(false);
      return;
    }
    const product = products.find(p => p.code === trimmedCode);
    if (product) {
      const weight = (product.weightPA * formData.quantity).toFixed(3);
      setFormData(prev => ({ ...prev, description: product.description, totalWeight: parseFloat(weight) }));
      setIsItemValid(true);
    } else {
      setFormData(prev => ({ ...prev, description: '', totalWeight: 0 }));
      setIsItemValid(false);
    }
  }, [formData.code, formData.quantity, products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isItemValid) return;
    onAdd({ ...formData, priority: formData.criticality === Criticality.HIGH });
    setFormData({ code: '', description: '', quantity: 1, totalWeight: 0, criticality: Criticality.LOW, loadNumber: '' });
    setIsItemValid(false);
    setShowModal(false);
  };

  const myRequests = requests.filter(r => r.status !== RequestStatus.COLLECTED);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-[#FAA61A] p-2 rounded text-black"><ClipboardList size={18} /></div>
          <div>
            <h3 className="font-bold text-sm text-[#333]">Registro de Faltas</h3>
            <p className="text-[10px] text-gray-400 uppercase font-semibold italic">
              {products.length > 0 ? `Master Data Conectado (${products.length} itens)` : 'Master Data Vazio (Fale c/ Admin)'}
            </p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-[#D71920] hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-bold shadow-sm flex items-center gap-2 uppercase">
          <Plus size={14} /> Nova Solicitação
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8f9fa] border-b border-gray-200 font-bold text-[#4b5c6b]">
              <th className="px-4 py-3">Carga / Criado Por</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3 text-center">Quant.</th>
              <th className="px-4 py-3 text-center">Peso</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e9eff5]">
            {myRequests.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 italic">Nenhum registro encontrado.</td></tr>
            ) : (
              myRequests.map(req => (
                <tr key={req.id} className="hover:bg-orange-50/20">
                  <td className="px-4 py-3"><div className="font-bold text-gray-600">{req.loadNumber || '-'}</div><div className="flex items-center gap-1 text-[9px] text-gray-400 mt-1"><User size={10} /> {req.timestamps.reported.user.split(' ')[0]}</div></td>
                  <td className="px-4 py-3 font-bold text-black">{req.code}</td>
                  <td className="px-4 py-3 text-gray-600 truncate max-w-[250px] uppercase">{req.description}</td>
                  <td className="px-4 py-3 text-center font-bold">{req.quantity}</td>
                  <td className="px-4 py-3 text-center font-medium text-black">{req.totalWeight?.toFixed(3).replace('.', ',')} Kg</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={req.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {req.status === RequestStatus.WAITING_LOGISTICS ? (
                      <button onClick={() => onCollect(req.id)} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-[10px] font-bold shadow-sm transition-colors">Confirmar Coleta</button>
                    ) : (
                      <div className="flex items-center justify-end gap-1 text-gray-400"><span className="text-[9px] italic">Em Processo</span><Info size={14} /></div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl border-t-4 border-[#D71920]">
            <div className="p-4 bg-[#f8f9fa] border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-black text-sm uppercase flex items-center gap-2"><Package size={16} /> Registro de Ruptura</h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400 hover:text-[#D71920]" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2"><Truck size={12} /> Número da Carga / Pedido</label>
                <input autoFocus required placeholder="Ex: 459920" value={formData.loadNumber} onChange={e => setFormData({...formData, loadNumber: e.target.value})} className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm bg-white text-black outline-none font-bold focus:border-[#D71920]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex justify-between">Código TOTVS {formData.code && (isItemValid ? <span className="text-green-600 flex items-center gap-1 font-bold"><CheckCircle2 size={10} /> OK</span> : <span className="text-red-500 flex items-center gap-1 font-bold"><AlertCircle size={10} /> AUSENTE</span>)}</label>
                  <input required placeholder="Digite o código" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className={`w-full px-3 py-2.5 border rounded text-sm bg-white text-black outline-none font-bold ${isItemValid ? 'border-green-500' : 'border-gray-300'} focus:border-[#D71920]`} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Quantidade</label>
                  <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm bg-white text-black outline-none font-bold focus:border-[#D71920]" />
                </div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Descrição</label><input readOnly placeholder="..." value={formData.description} className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm bg-gray-50 text-gray-800 font-bold uppercase italic outline-none cursor-not-allowed" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Scale size={12} /> Peso Total (Kg)</label><input readOnly value={formData.totalWeight.toFixed(3).replace('.', ',')} className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm bg-orange-50 text-black font-black outline-none cursor-not-allowed text-center" /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Criticidade</label><select value={formData.criticality} onChange={e => setFormData({...formData, criticality: e.target.value as Criticality})} className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm bg-white text-black font-bold focus:border-[#D71920]"><option value={Criticality.LOW}>BAIXA</option><option value={Criticality.MEDIUM}>MÉDIA</option><option value={Criticality.HIGH}>ALTA</option></select></div>
              </div>
              <div className="pt-4 flex gap-3"><button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded font-bold text-[11px] uppercase">Cancelar</button><button type="submit" disabled={!isItemValid} className={`flex-1 px-4 py-2.5 rounded font-bold text-[11px] uppercase shadow-md ${isItemValid ? 'bg-[#D71920] text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400'}`}>Enviar p/ PCP</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticsView;
