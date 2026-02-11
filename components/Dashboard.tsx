import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Transaction, Group } from '../types';
import { Wallet, TrendingUp, TrendingDown, Users, AlertTriangle, AlertCircle } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  groups: Group[];
}

const COLORS = ['#d946ef', '#a855f7', '#6366f1', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ transactions, groups }) => {
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Budget Alert Logic
  const alerts = groups.map(g => {
    const expense = transactions
      .filter(t => t.groupId === g.id && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const ratio = expense / g.budget;
    return { ...g, ratio, expense };
  }).filter(g => g.ratio >= 0.8);

  const groupExpenses = groups.map(g => {
    const expense = transactions
      .filter(t => t.groupId === g.id && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: g.name, value: expense, budget: g.budget };
  }).filter(g => g.value > 0);

  const recentTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="p-4 pb-24 space-y-6 overflow-y-auto h-full no-scrollbar">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">MMM</h1>
          <p className="text-sm text-gray-500">Mook Money Management</p>
        </div>
        <div className="h-10 w-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold border-2 border-brand-200">
          M
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white shadow-lg shadow-brand-200">
        <p className="text-brand-100 text-sm font-medium">ยอดคงเหลือสุทธิ</p>
        <h2 className="text-4xl font-bold mt-1">฿{balance.toLocaleString()}</h2>
        <div className="mt-6 flex justify-between">
          <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
            <div className="p-1 bg-green-400/20 rounded-full">
              <TrendingUp size={16} className="text-green-300" />
            </div>
            <div>
              <p className="text-xs text-brand-100">รายรับ</p>
              <p className="font-semibold text-sm">฿{totalIncome.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
            <div className="p-1 bg-red-400/20 rounded-full">
              <TrendingDown size={16} className="text-red-300" />
            </div>
            <div>
              <p className="text-xs text-brand-100">รายจ่าย</p>
              <p className="font-semibold text-sm">฿{totalExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(g => (
            <div key={g.id} className={`p-3 rounded-xl flex items-start gap-3 border ${g.ratio >= 1 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
               <div className={`mt-0.5 p-1 rounded-full ${g.ratio >= 1 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                 {g.ratio >= 1 ? <AlertCircle size={16} /> : <AlertTriangle size={16} />}
               </div>
               <div>
                 <p className="font-bold text-sm">
                   {g.ratio >= 1 ? `งบประมาณหมด! ${g.name}` : `ใกล้เต็มวงเงิน ${g.name}`}
                 </p>
                 <p className="text-xs opacity-90">
                   ใช้ไป ฿{g.expense.toLocaleString()} จาก ฿{g.budget.toLocaleString()} ({Math.round(g.ratio * 100)}%)
                 </p>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Group Budgets Overview */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <Users size={20} className="text-brand-600" />
          งบประมาณกลุ่ม
        </h3>
        
        {groups.map(group => {
           const spent = transactions
           .filter(t => t.groupId === group.id && t.type === 'expense')
           .reduce((sum, t) => sum + t.amount, 0);
           const percent = Math.min((spent / group.budget) * 100, 100);

           return (
            <div key={group.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{group.icon}</span>
                  <span className="font-medium text-gray-700">{group.name}</span>
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-600">
                   {spent.toLocaleString()} / {group.budget.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${percent >= 100 ? 'bg-red-500' : percent >= 80 ? 'bg-yellow-400' : 'bg-brand-500'}`} 
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            </div>
           )
        })}
      </div>

      {/* Chart */}
      {groupExpenses.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-800 mb-4">สัดส่วนค่าใช้จ่ายกลุ่ม</h3>
           <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={groupExpenses}
                   cx="50%"
                   cy="50%"
                   innerRadius={40}
                   outerRadius={70}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {groupExpenses.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="flex flex-wrap gap-2 justify-center mt-2">
              {groupExpenses.map((g, i) => (
                <div key={i} className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  {g.name}
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <h3 className="font-bold text-gray-800 text-lg mb-3">ล่าสุด</h3>
        <div className="space-y-3">
          {recentTransactions.map(t => (
            <div key={t.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${t.type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                  {t.type === 'expense' ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                </div>
                <div>
                  <p className="font-medium text-gray-800 line-clamp-1">{t.merchant}</p>
                  <p className="text-xs text-gray-400">
                    {t.category ? <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 mr-1 text-[10px]">{t.category}</span> : null}
                    {t.ownership === 'group' ? 'กลุ่ม' : 'ส่วนตัว'} • {t.date}
                  </p>
                </div>
              </div>
              <span className={`font-bold ${t.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                {t.type === 'expense' ? '-' : '+'}฿{t.amount.toLocaleString()}
              </span>
            </div>
          ))}
          {recentTransactions.length === 0 && (
            <p className="text-center text-gray-400 py-4 text-sm">ยังไม่มีรายการ</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;