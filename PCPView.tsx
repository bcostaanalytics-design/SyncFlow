
import React, { useState } from 'react';
import { Calendar, Send, Info, MessageSquareCode, User } from 'lucide-react';
import { ShortageRequest, RequestStatus, Criticality } from '../types';

interface Props {
  requests: ShortageRequest[];
  onApprove: (id: string, eta: string, directive: string) => void;
}

const PCPView: React.FC<Props> = ({ requests, onApprove }) => {
  const [selectedEta, setSelectedEta] = useState<Record<string, string>>({});
  const [directives, setDirectives] = useState<Record<string, string>>({});

  const pending = requests
    .filter(r => r.status === RequestStatus.PENDING_PCP)
    .sort((a, b) => {
      const order = { [Criticality.HIGH]: 0, [Criticality.MEDIUM]: 1, [Criticality.LOW]: 2 };
      return order[a.criticality] - order[b.criticality];
    });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded flex items-center gap-4">
        <Info className="text-blue-700" size={24} />
        <p className="text-xs text-blue-700 font-medium leading-relaxed">
          <b>Analise Técnica do PCP:</b> Defina a <b>data e hora</b> exata da previsão de disponibilidade e insira as <b>diretrizes técnicas</b> para a produção.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {pending.length === 0 ? (
          <div className="py-20 bg-white border border-dashed border-gray-300 text-center rounded shadow-sm">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">Nenhuma pendência para o PCP no momento.</p>
          </div>
        ) : (
          pending.map(req => (
            <div key={req.id} className="bg-white border border-gray-200 rounded p-6 flex flex-col md:flex-row gap-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div><h4 className="font-bold text-black text-lg leading-none">{req.code}</h4><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{req.id}</span></div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold ${req.criticality === Criticality.HIGH ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>{req.criticality}</div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">"{req.description}"</p>
                <div className="flex items-center gap-4 text-xs bg-gray-50 p-3 rounded border border-gray-100 flex-wrap">
                  <span className="font-bold text-gray-400">QTD: <span className="text-black">{req.quantity}</span></span><span className="text-gray-200">|</span>
                  <div className="flex items-center gap-1.5"><span className="font-bold text-gray-400">REPORTADO POR:</span><span className="bg-white border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold text-black flex items-center gap-1"><User size={10} /> {req.timestamps.reported.user}</span></div>
                </div>
              </div>
              <div className="md:w-80 space-y-4">
                <div className="space-y-1"><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Previsão Prontidão (Data/Hora)</label><input type="datetime-local" min={new Date().toISOString().slice(0, 16)} value={selectedEta[req.id] || ''} onChange={e => setSelectedEta({...selectedEta, [req.id]: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-xs bg-white text-black outline-none focus:border-[#D71920]"/></div>
                <div className="space-y-1"><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><MessageSquareCode size={12} /> Diretriz de Produção</label><textarea rows={3} placeholder="Instruções para fábrica..." value={directives[req.id] || ''} onChange={e => setDirectives({...directives, [req.id]: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-xs bg-white text-black outline-none focus:border-[#D71920] resize-none"/></div>
                <button disabled={!selectedEta[req.id] || !directives[req.id]} onClick={() => onApprove(req.id, selectedEta[req.id], directives[req.id])} className={`w-full py-2.5 rounded text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${!selectedEta[req.id] || !directives[req.id] ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#D71920] hover:bg-red-700 text-white'}`}><Send size={14} /> Liberar p/ Aprovação CS</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PCPView;
