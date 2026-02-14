
import React from 'react';
import { ShieldAlert, Check, X, Clock, User } from 'lucide-react';
import { ShortageRequest, RequestStatus } from '../types';

interface Props {
  requests: ShortageRequest[];
  onDecision: (id: string, decision: 'PRODUCE' | 'CUT') => void;
}

const CSView: React.FC<Props> = ({ requests, onDecision }) => {
  const pending = requests.filter(r => r.status === RequestStatus.PENDING_CS);

  return (
    <div className="space-y-6">
      <div className="bg-[#fffbeb] border border-[#fde68a] p-4 rounded flex items-center gap-4">
        <ShieldAlert size={24} className="text-[#92400e]" />
        <p className="text-xs text-[#92400e] font-medium leading-relaxed">
          <b>Decisão de Customer Service:</b> Avalie se a data de prontidão informada pelo PCP permite que o veículo aguarde ou se devemos realizar o corte do item no faturamento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pending.length === 0 ? (
          <div className="col-span-full py-20 bg-white border border-dashed border-gray-300 text-center rounded">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">Nenhuma decisão pendente para o Customer Service.</p>
          </div>
        ) : (
          pending.map(req => (
            <div key={req.id} className="bg-white border border-[#d1d7dd] rounded overflow-hidden shadow-sm flex flex-col">
              <div className="p-4 bg-[#f8f9fa] border-b border-[#d1d7dd] flex justify-between items-center">
                <span className="font-bold text-black text-sm uppercase">{req.code}</span>
                <span className="text-[9px] font-bold text-gray-400">{req.id}</span>
              </div>
              <div className="p-5 flex-1 space-y-4">
                <div className="bg-red-50 border border-red-100 p-3 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-red-600" />
                      <span className="text-[10px] font-bold text-red-600 uppercase">Previsão PCP</span>
                    </div>
                    {req.timestamps.requestedByPCP?.user && (
                       <span className="text-[8px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                         <User size={8}/> {req.timestamps.requestedByPCP.user.split(' ')[0]}
                       </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-red-700">
                    {req.eta ? new Date(req.eta).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-100 text-[11px] text-gray-600 italic">
                  <span className="font-bold text-gray-400 uppercase text-[9px] block mb-1">Motivo/Obs:</span>
                  "{req.description}"
                </div>
                <div className="pt-4 flex gap-2">
                  <button 
                    onClick={() => onDecision(req.id, 'PRODUCE')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-[11px] font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={14} /> Produzir
                  </button>
                  <button 
                    onClick={() => onDecision(req.id, 'CUT')}
                    className="flex-1 bg-white border border-red-500 text-red-600 hover:bg-red-50 py-2 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <X size={14} /> Cortar Item
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CSView;
