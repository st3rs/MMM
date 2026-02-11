import React, { useState } from 'react';
import { Group, Transaction } from '../types';
import { Users, Plus, Edit2, ChevronRight } from 'lucide-react';

interface GroupManagerProps {
  groups: Group[];
  transactions: Transaction[];
  onAddGroup: (group: Group) => void;
  onUpdateGroup: (group: Group) => void;
}

const GroupManager: React.FC<GroupManagerProps> = ({ groups, transactions, onAddGroup, onUpdateGroup }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupBudget, setNewGroupBudget] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('🏢');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName || !newGroupBudget) return;

    onAddGroup({
      id: Date.now().toString(),
      name: newGroupName,
      budget: parseFloat(newGroupBudget),
      members: 1,
      icon: newGroupIcon
    });

    setIsAdding(false);
    setNewGroupName('');
    setNewGroupBudget('');
  };

  const calculateSpent = (groupId: string) => {
    return transactions
      .filter(t => t.groupId === groupId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="h-full bg-gray-50 p-4 pb-24 overflow-y-auto no-scrollbar">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Users className="text-brand-600" />
        จัดการกลุ่ม
      </h1>

      {/* Add New Group Button/Form */}
      {!isAdding ? (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full bg-white p-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 font-medium flex items-center justify-center gap-2 hover:border-brand-400 hover:text-brand-600 transition-colors mb-6"
        >
          <Plus size={20} /> สร้างกลุ่มใหม่
        </button>
      ) : (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 animate-in fade-in zoom-in-95">
          <h3 className="font-bold text-gray-800 mb-4">สร้างกลุ่มใหม่</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
               <label className="text-xs text-gray-500">ชื่อกลุ่ม</label>
               <input 
                 className="w-full p-2 border rounded-lg mt-1" 
                 value={newGroupName} 
                 onChange={e => setNewGroupName(e.target.value)} 
                 placeholder="เช่น ทีมมาร์เก็ตติ้ง"
                 required
               />
             </div>
             <div>
               <label className="text-xs text-gray-500">งบประมาณ (บาท)</label>
               <input 
                 type="number"
                 className="w-full p-2 border rounded-lg mt-1" 
                 value={newGroupBudget} 
                 onChange={e => setNewGroupBudget(e.target.value)} 
                 placeholder="10000"
                 required
               />
             </div>
             <div>
               <label className="text-xs text-gray-500">ไอคอน</label>
               <div className="flex gap-2 mt-1">
                 {['🏢', '🍕', '🍻', '☕', '🎉', '✈️'].map(emoji => (
                   <button 
                     type="button"
                     key={emoji}
                     onClick={() => setNewGroupIcon(emoji)}
                     className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border ${newGroupIcon === emoji ? 'bg-brand-100 border-brand-500' : 'bg-gray-50 border-gray-200'}`}
                   >
                     {emoji}
                   </button>
                 ))}
               </div>
             </div>
             <div className="flex gap-2 pt-2">
               <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg">ยกเลิก</button>
               <button type="submit" className="flex-1 py-2 text-white bg-brand-600 rounded-lg font-medium">สร้างกลุ่ม</button>
             </div>
          </form>
        </div>
      )}

      {/* Group List */}
      <div className="space-y-4">
        {groups.map(group => {
          const spent = calculateSpent(group.id);
          const remaining = group.budget - spent;
          const percent = Math.min((spent / group.budget) * 100, 100);

          return (
            <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-4">
                 <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center text-2xl">
                         {group.icon}
                       </div>
                       <div>
                         <h3 className="font-bold text-gray-800">{group.name}</h3>
                         <p className="text-xs text-gray-500">{group.members} สมาชิก</p>
                       </div>
                    </div>
                    {/* Simplified Edit logic - usually would open modal */}
                    <button className="text-gray-400 hover:text-brand-600"><Edit2 size={16} /></button>
                 </div>
                 
                 <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">ใช้ไปแล้ว</span>
                      <span className="font-bold text-gray-800">฿{spent.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${percent > 90 ? 'bg-red-500' : 'bg-brand-500'}`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-gray-400">
                      <span>0%</span>
                      <span>เหลือ ฿{remaining.toLocaleString()}</span>
                    </div>
                 </div>
               </div>
               <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-between items-center text-sm text-brand-700 font-medium">
                  <span>ประวัติค่าใช้จ่าย</span>
                  <ChevronRight size={16} />
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupManager;