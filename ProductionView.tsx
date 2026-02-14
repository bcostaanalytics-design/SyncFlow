
import React from 'react';
import { Play, Check, Factory, Clock, Info, FileText, User } from 'lucide-react';
import { ShortageRequest, RequestStatus, Criticality } from '../types';

interface Props {
  requests: ShortageRequest[];
  onStart: (id: string) => void;
  onFinish: (id: string) => void;
}

const ProductionView: React.FC<Props> = ({ requests, onStart, onFinish }) => {
  const queue = requests.filter(r => r.status === RequestStatus.WAITING_PRODUCTION);
  const active = requests.filter(r => r.status === RequestStatus.PRODUCING);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fila Produção */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-300 pb-2"><Clock size={16} className="text-black" /><h4 className="font-bold text-sm text-black uppercase tracking-tighter">Fila de Trabalho</h4></div>
          <div className="space-y-3">
            {queue.length === 0 && <p className="text-xs text-gray-400 italic text-center py-10">Nenhuma ordem liberada para produção.</p>}
            {queue.map(req => (
              <div key={req.id} className="bg-white border border-gray-200 p-4 rounded flex flex-col gap-3 shadow-sm hover:border-black transition-all">
                <div className="flex justify-between items-start">
                  <div><h5 className="font-bold text-sm text-[#333]">{req.code}</h5><div className="flex items-center gap-2 mt-1"><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">QTD: {req.quantity}</p>{req.timestamps.csDecision?.user && (<span className="text-[9px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100 flex items-center gap-1 font-bold"><User size={8} /> Auth: {req.timestamps.csDecision.user.split(' ')[0]}</span>)}</div></div>
                  <button onClick={() => onStart(req.id)} className="bg-[#D71920] hover:bg-red-700 text-white p-2.5 rounded transition-all shadow-sm" title="Iniciar Processo"><Play size={16} fill="white" /></button>
                </div>
                <div className="bg-orange-50 border border-orange-100 p-2.5 rounded flex flex-col gap-1"><div className="flex items-center gap-2"><FileText size={14} className="text-black shrink-0" /><p className="text-[9px] font-bold text-black uppercase">Diretriz Técnica (PCP):</p></div><p className="text-[11px] text-gray-600 italic font-medium pl-6">"{req.directive || 'Sem instruções específicas.'}"</p>{req.timestamps.requestedByPCP?.user && (<div className="pl-6 text-[8px] text-gray-400 font-bold flex items-center gap-1"><User size={8}/> Definido por: {req.timestamps.requestedByPCP.user}</div>)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Produzindo */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-300 pb-2"><Factory size={16} className="text-green-600" /><h4 className="font-bold text-sm text-green-600 uppercase tracking-tighter">Em Fabricação</h4></div>
          <div className="space-y-3">
            {active.length === 0 && <p className="text-xs text-gray-400 italic text-center py-10">Nenhum item em linha de produção.</p>}
            {active.map(req => (
              <div key={req.id} className="bg-[#f0fdf4] border border-[#bbf7d0] p-4 rounded flex flex-col gap-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div><h5 className="font-bold text-sm text-[#166534]">{req.code}</h5><p className="text-[10px] text-[#15803d] uppercase tracking-widest font-bold">Processo Ativo • QTD {req.quantity}</p></div>
                  <button onClick={() => onFinish(req.id)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-all flex items-center gap-2"><Check size={16} /> Liberar p/ Logística</button>
                </div>
                <div className="bg-white/50 border border-green-100 p-2.5 rounded space-y-1"><p className="text-[9px] font-bold text-green-700 uppercase">Executando conforme:</p><p className="text-[11px] text-green-800 italic font-medium">"{req.directive}"</p></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductionView;
