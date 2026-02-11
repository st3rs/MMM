import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, Users, PieChart } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import GroupManager from './components/GroupManager';
import Report from './components/Report';
import { Transaction, Group, View } from './types';

// Initial Mock Data
const INITIAL_GROUPS: Group[] = [
  { id: '1', name: 'ทีมการตลาด', budget: 15000, members: 5, icon: '📢' },
  { id: '2', name: 'อาหารกลางวัน', budget: 5000, members: 8, icon: '🍕' },
  { id: '3', name: 'สวัสดิการ', budget: 8000, members: 12, icon: '🏥' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: new Date().toISOString().split('T')[0], merchant: 'Starbucks', amount: 320, type: 'expense', ownership: 'personal', category: 'Food' },
  { id: '2', date: new Date().toISOString().split('T')[0], merchant: 'Grab Food', amount: 850, type: 'expense', ownership: 'group', groupId: '2', category: 'Food' },
  { id: '3', date: new Date().toISOString().split('T')[0], merchant: 'ค่าโปรเจค', amount: 15000, type: 'income', ownership: 'group', groupId: '1', category: 'Other' },
  { id: '4', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], merchant: 'Officemate', amount: 1200, type: 'expense', ownership: 'group', groupId: '1', category: 'Office' },
  { id: '5', date: new Date(Date.now() - 172800000).toISOString().split('T')[0], merchant: 'BTS Skytrain', amount: 45, type: 'expense', ownership: 'personal', category: 'Transport' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Load from local storage on mount (simulated persistence)
  useEffect(() => {
    const savedTx = localStorage.getItem('mmm_transactions');
    const savedGroups = localStorage.getItem('mmm_groups');
    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedGroups) setGroups(JSON.parse(savedGroups));
  }, []);

  // Save on change
  useEffect(() => {
    localStorage.setItem('mmm_transactions', JSON.stringify(transactions));
    localStorage.setItem('mmm_groups', JSON.stringify(groups));
  }, [transactions, groups]);

  const handleSaveTransaction = (transaction: Transaction) => {
    setTransactions(prev => {
        const exists = prev.some(t => t.id === transaction.id);
        if (exists) {
            return prev.map(t => t.id === transaction.id ? transaction : t);
        }
        return [transaction, ...prev];
    });
    setEditingTransaction(null);
    setCurrentView('dashboard');
  };

  const handleAddGroup = (newGroup: Group) => {
    setGroups(prev => [...prev, newGroup]);
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  };
  
  const handleEditRequest = (t: Transaction) => {
      setEditingTransaction(t);
      setCurrentView('add');
  };

  // Render view
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard transactions={transactions} groups={groups} />;
      case 'add':
        return (
          <AddTransaction 
            groups={groups} 
            onAdd={handleSaveTransaction} 
            onCancel={() => {
                setEditingTransaction(null);
                setCurrentView('dashboard');
            }} 
            initialData={editingTransaction}
          />
        );
      case 'groups':
        return (
          <GroupManager 
            groups={groups} 
            transactions={transactions} 
            onAddGroup={handleAddGroup}
            onUpdateGroup={handleUpdateGroup}
          />
        );
      case 'report':
        return (
          <Report 
            transactions={transactions} 
            groups={groups} 
            onScanNewReceipt={() => {
                setEditingTransaction(null);
                setCurrentView('add');
            }}
            onEditTransaction={handleEditRequest}
          />
        );
      default:
        return <Dashboard transactions={transactions} groups={groups} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      {currentView !== 'add' && (
        <nav className="h-[80px] bg-white border-t border-gray-100 flex justify-around items-center px-2 pb-2 z-20 absolute bottom-0 w-full rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentView === 'dashboard' ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutDashboard size={24} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">ภาพรวม</span>
          </button>

          {/* Center FAB for Add */}
          <button 
            onClick={() => {
                setEditingTransaction(null);
                setCurrentView('add');
            }}
            className="flex flex-col items-center justify-center -mt-8"
          >
            <div className="w-14 h-14 bg-brand-600 rounded-full shadow-lg shadow-brand-300 flex items-center justify-center text-white hover:scale-105 transition-transform active:scale-95">
              <PlusCircle size={32} />
            </div>
            <span className="text-[10px] font-medium mt-1 text-gray-500">จดบันทึก</span>
          </button>

          <button 
            onClick={() => setCurrentView('groups')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentView === 'groups' ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Users size={24} strokeWidth={currentView === 'groups' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">กลุ่ม</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('report')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentView === 'report' ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <PieChart size={24} strokeWidth={currentView === 'report' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">รายงาน</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;