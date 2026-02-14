
import React from 'react';
import { RequestStatus } from '../types';

interface StatusBadgeProps {
  status: RequestStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = {
    [RequestStatus.PENDING_PCP]: { label: 'Pendente PCP', bg: 'bg-[#fffbeb]', text: 'text-[#92400e]', border: 'border-[#fde68a]' },
    [RequestStatus.PENDING_CS]: { label: 'Análise CS', bg: 'bg-[#eff6ff]', text: 'text-[#1e40af]', border: 'border-[#bfdbfe]' },
    [RequestStatus.WAITING_PRODUCTION]: { label: 'Fila Produção', bg: 'bg-[#f3f4f6]', text: 'text-[#374151]', border: 'border-[#d1d5db]' },
    [RequestStatus.PRODUCING]: { label: 'Produzindo', bg: 'bg-[#ecfdf5]', text: 'text-[#065f46]', border: 'border-[#a7f3d0]' },
    [RequestStatus.WAITING_LOGISTICS]: { label: 'Aguardando Logística', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    [RequestStatus.COLLECTED]: { label: 'Expedido', bg: 'bg-white', text: 'text-gray-400', border: 'border-gray-200' },
    [RequestStatus.CANCELLED_CS]: { label: 'Item Cortado', bg: 'bg-[#fef2f2]', text: 'text-[#991b1b]', border: 'border-[#fecaca]' },
  };

  const { label, bg, text, border } = config[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' };

  return (
    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${bg} ${text} ${border}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
