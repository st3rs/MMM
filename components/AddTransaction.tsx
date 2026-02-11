import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Loader2, FileText, Tag } from 'lucide-react';
import { Transaction, Group, Ownership, TransactionType } from '../types';
import { parseSlipWithGemini } from '../services/geminiService';

interface AddTransactionProps {
  groups: Group[];
  onAdd: (transaction: Transaction) => void;
  onCancel: () => void;
  initialData?: Transaction | null;
}

const CATEGORIES = ['Food', 'Transport', 'Office', 'Utilities', 'Entertainment', 'Other'];

const AddTransaction: React.FC<AddTransactionProps> = ({ groups, onAdd, onCancel, initialData }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState<string | null>(initialData?.slipUrl || null);
  
  // Form State
  const [merchant, setMerchant] = useState(initialData?.merchant || '');
  const [amount, setAmount] = useState<string>(initialData?.amount.toString() || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [ownership, setOwnership] = useState<Ownership>(initialData?.ownership || 'personal');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialData?.groupId || groups[0]?.id || '');
  const [category, setCategory] = useState<string>(initialData?.category || 'Other');
  const [items, setItems] = useState<string[]>(initialData?.items || []);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        setScanPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);

      setIsScanning(true);
      try {
        const result = await parseSlipWithGemini(file);
        setMerchant(result.merchant);
        setAmount(result.amount.toString());
        setDate(result.date);
        setItems(result.items || []);
        setType('expense'); // Usually slips are expenses
        if (result.category && CATEGORIES.includes(result.category)) {
          setCategory(result.category);
        }
      } catch (err) {
        alert("ขออภัย อ่านสลิปไม่สำเร็จ กรุณากรอกข้อมูลเอง");
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant || !amount) return;

    const newTransaction: Transaction = {
      id: initialData?.id || Date.now().toString(),
      date,
      merchant,
      amount: parseFloat(amount),
      type,
      ownership,
      groupId: ownership === 'group' ? selectedGroupId : undefined,
      category,
      items,
      slipUrl: scanPreview || undefined,
    };

    onAdd(newTransaction);
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
        <button onClick={onCancel} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <X size={24} />
        </button>
        <h2 className="text-lg font-bold text-gray-800">{initialData ? 'แก้ไขรายการ' : 'บันทึกรายการ'}</h2>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="p-5 flex-1 space-y-6">
        
        {/* Scan Area */}
        <div className="flex flex-col items-center justify-center">
           <input 
             type="file" 
             accept="image/*" 
             className="hidden" 
             ref={fileInputRef}
             onChange={handleFileChange}
           />
           
           {!scanPreview ? (
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="w-full h-32 border-2 border-dashed border-brand-300 rounded-xl bg-brand-50 flex flex-col items-center justify-center text-brand-600 gap-2 hover:bg-brand-100 transition-colors"
             >
               <Camera size={32} />
               <span className="font-medium">สแกนสลิป / อัพโหลดรูป</span>
               <span className="text-xs text-brand-400">AI อ่าน: ร้านค้า, ราคา, หมวดหมู่</span>
             </button>
           ) : (
             <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
               <img src={scanPreview} alt="Slip" className="w-full h-full object-contain" />
               <button 
                onClick={() => { setScanPreview(null); setMerchant(''); setAmount(''); setItems([]); }}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
               >
                 <X size={16} />
               </button>
               {isScanning && (
                 <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                   <Loader2 size={32} className="animate-spin mb-2" />
                   <span>กำลังอ่านข้อมูลสลิป...</span>
                 </div>
               )}
             </div>
           )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Type Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
            >
              รายจ่าย
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
            >
              รายรับ
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">จำนวนเงิน (บาท)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-3xl font-bold text-gray-800 border-b-2 border-gray-200 focus:border-brand-500 outline-none py-2 bg-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">ชื่อรายการ / ร้านค้า</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="เช่น ข้าวกลางวัน, 7-Eleven"
              className="w-full p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-brand-200"
              required
            />
          </div>

          <div>
             <label className="block text-xs font-semibold text-gray-500 mb-1">หมวดหมู่</label>
             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${category === cat ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    {cat}
                  </button>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">วันที่</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-brand-200"
                />
             </div>
             <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ประเภทเจ้าของ</label>
                <select
                  value={ownership}
                  onChange={(e) => setOwnership(e.target.value as Ownership)}
                  className="w-full p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-brand-200"
                >
                  <option value="personal">ส่วนตัว</option>
                  <option value="group">กลุ่มทำงาน</option>
                </select>
             </div>
          </div>

          {ownership === 'group' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
               <label className="block text-xs font-semibold text-gray-500 mb-1">เลือกกลุ่ม</label>
               <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                 {groups.map(g => (
                   <button
                     key={g.id}
                     type="button"
                     onClick={() => setSelectedGroupId(g.id)}
                     className={`flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap ${selectedGroupId === g.id ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-gray-200 text-gray-600'}`}
                   >
                     <span>{g.icon}</span>
                     <span>{g.name}</span>
                   </button>
                 ))}
               </div>
            </div>
          )}

          {items.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <FileText size={12} /> รายการสินค้าจากสลิป
              </p>
              <ul className="text-sm text-gray-700 list-disc list-inside">
                {items.map((item, idx) => (
                  <li key={idx} className="truncate">{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={!amount || !merchant}
              className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-brand-200 hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {initialData ? 'อัพเดทรายการ' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransaction;