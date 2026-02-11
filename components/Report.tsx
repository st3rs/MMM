import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction, Group } from '../types';
import { Filter, Calendar, Users, PieChart as PieIcon, Camera, Edit2, TrendingDown, TrendingUp, Download } from 'lucide-react';

interface ReportProps {
  transactions: Transaction[];
  groups: Group[];
  onScanNewReceipt: () => void;
  onEditTransaction: (t: Transaction) => void;
}

const COLORS = ['#d946ef', '#a855f7', '#6366f1', '#3b82f6', '#06b6d4', '#ec4899'];

const Report: React.FC<ReportProps> = ({ transactions, groups, onScanNewReceipt, onEditTransaction }) => {
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<'all' | 'month'>('month');

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    let data = transactions;

    // Filter by Group
    if (filterGroup !== 'all') {
      if (filterGroup === 'personal') {
        data = data.filter(t => t.ownership === 'personal');
      } else {
        data = data.filter(t => t.groupId === filterGroup);
      }
    }

    // Filter by Time (Simple 'This Month' check)
    if (filterTime === 'month') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      data = data.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    }

    // Sort by date descending
    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterGroup, filterTime]);

  // Aggregate for Category Pie Chart (Expenses only)
  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const agg: Record<string, number> = {};
    
    expenses.forEach(t => {
      const cat = t.category || 'Other';
      agg[cat] = (agg[cat] || 0) + t.amount;
    });

    return Object.entries(agg).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  // Aggregate for Daily Bar Chart (Income vs Expense)
  const dailyData = useMemo(() => {
    const agg: Record<string, { date: string; income: number; expense: number }> = {};
    
    filteredTransactions.forEach(t => {
       if (!agg[t.date]) {
         agg[t.date] = { date: t.date.split('-').slice(1).join('/'), income: 0, expense: 0 };
       }
       if (t.type === 'income') agg[t.date].income += t.amount;
       else agg[t.date].expense += t.amount;
    });

    return Object.values(agg).sort((a, b) => a.date.localeCompare(b.date)).slice(-7); // Last 7 days with activity
  }, [filteredTransactions]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
        alert("ไม่มีข้อมูลสำหรับส่งออก");
        return;
    }

    const headers = ['Date', 'Merchant', 'Amount', 'Type', 'Category', 'Ownership', 'Group Name'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => {
        const groupName = t.groupId ? groups.find(g => g.id === t.groupId)?.name || '' : '-';
        return [
          t.date,
          `"${t.merchant.replace(/"/g, '""')}"`, // Escape quotes
          t.amount,
          t.type,
          t.category || '-',
          t.ownership,
          `"${groupName.replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel compatibility
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mmm_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full bg-gray-50 p-4 pb-24 overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <PieIcon className="text-brand-600" />
          รายงานสรุป
        </h1>
        <div className="flex gap-2">
            <button
                onClick={handleExportCSV}
                className="flex items-center justify-center bg-white text-gray-600 w-10 h-10 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                title="Export CSV"
            >
                <Download size={20} />
            </button>
            <button
                onClick={onScanNewReceipt}
                className="flex items-center gap-2 bg-brand-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-brand-700 transition-colors"
            >
                <Camera size={16} />
                <span className="hidden xs:inline">สแกนสลิป</span>
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-4 space-y-3">
         <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
           <Filter size={16} /> ตัวกรอง
         </div>
         <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <select 
              value={filterGroup} 
              onChange={(e) => setFilterGroup(e.target.value)}
              className="px-3 py-2 bg-gray-50 rounded-lg text-sm border-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">ทั้งหมด (รวมกลุ่ม)</option>
              <option value="personal">ส่วนตัวเท่านั้น</option>
              {groups.map(g => <option key={g.id} value={g.id}>กลุ่ม: {g.name}</option>)}
            </select>
            <select 
              value={filterTime} 
              onChange={(e) => setFilterTime(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 rounded-lg text-sm border-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">ทุกช่วงเวลา</option>
              <option value="month">เดือนนี้</option>
            </select>
         </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
           <p className="text-xs text-gray-500">รายรับรวม</p>
           <p className="text-xl font-bold text-green-600">฿{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500">
           <p className="text-xs text-gray-500">รายจ่ายรวม</p>
           <p className="text-xl font-bold text-red-600">฿{totalExpense.toLocaleString()}</p>
        </div>
      </div>

      {/* Pie Chart - Categories */}
      {categoryData.length > 0 ? (
        <div className="bg-white p-5 rounded-xl shadow-sm mb-6">
           <h3 className="font-bold text-gray-800 mb-4 text-sm">สัดส่วนค่าใช้จ่าย (ตามหมวดหมู่)</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={categoryData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {categoryData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <RechartsTooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                   <span className="truncate flex-1">{entry.name}</span>
                   <span className="font-mono">฿{entry.value.toLocaleString()}</span>
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400">ไม่มีข้อมูลค่าใช้จ่ายในช่วงนี้</div>
      )}

      {/* Bar Chart - Trends */}
      {dailyData.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow-sm mb-6">
           <h3 className="font-bold text-gray-800 mb-4 text-sm">แนวโน้ม (7 วันล่าสุดที่มีรายการ)</h3>
           <div className="h-56 w-full -ml-4">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={dailyData}>
                 <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                 <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `฿${val}`} />
                 <RechartsTooltip cursor={{fill: '#f3f4f6'}} />
                 <Bar dataKey="income" fill="#4ade80" radius={[4, 4, 0, 0]} name="รายรับ" />
                 <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} name="รายจ่าย" />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      )}

      {/* Filtered Transaction List */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-800 text-sm">รายการ ({filteredTransactions.length})</h3>
        {filteredTransactions.map(t => (
            <div key={t.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-2 rounded-lg shrink-0 ${t.type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                  {t.type === 'expense' ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium text-gray-800 line-clamp-1">{t.merchant}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {t.category ? <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 mr-1 text-[10px]">{t.category}</span> : null}
                    {t.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`font-bold text-sm ${t.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                    {t.type === 'expense' ? '-' : '+'}฿{t.amount.toLocaleString()}
                </span>
                <button onClick={() => onEditTransaction(t)} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit2 size={16} />
                </button>
              </div>
            </div>
        ))}
        {filteredTransactions.length === 0 && (
           <p className="text-center text-gray-400 py-4 text-sm">ไม่พบรายการตามเงื่อนไข</p>
        )}
      </div>
    </div>
  );
};

export default Report;