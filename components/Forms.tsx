import React, { useState, useEffect, useMemo } from 'react';
import { FormDatePicker, RatingInput } from './ui/UI';
import { Icons } from './Icons';
import { CategoryConfig, AppRecord, DailyRecord, TeaRecord, MahjongRecord, Template } from '../types';

const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface FormProps {
    onAdd?: (record: any) => void;
    onSubmit?: (record: any) => void;
    initialData?: any;
    isEditing?: boolean;
    showNotification: (msg: string, type?: 'success' | 'error') => void;
    categories?: CategoryConfig;
    records?: AppRecord[];
    players?: string[];
}

export const DailyForm: React.FC<FormProps> = ({ onAdd, onSubmit, categories, initialData, isEditing, showNotification }) => {
    const [data, setData] = useState<Partial<DailyRecord> & { sub: string, amt: string }>(() => {
        if (initialData) return { date: initialData.date, type: initialData.type, sub: initialData.subCategory, amt: String(initialData.amount), note: initialData.note || '' };
        return { date: getTodayString(), type: 'expense', sub: '餐飲', amt: '', note: '' };
    });
    
    // Templates State
    const [templates, setTemplates] = useState<Template[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('tina_journal_templates');
        if (saved) try { setTemplates(JSON.parse(saved)); } catch {}
    }, []);

    // Default to first category if current doesn't exist in new type
    const cats = data.type === 'expense' ? categories?.expense : categories?.income;
    useEffect(() => { 
        if (!isEditing && cats && !cats.includes(data.sub)) {
            setData(prev => ({...prev, sub: cats[0] || ''})); 
        }
    }, [data.type, cats, isEditing]);

    const handleSubmit = () => {
        if(!data.amt || Number(data.amt) <= 0) return showNotification("請輸入有效金額", "error");
        const payload = { category: 'daily', date: data.date, type: data.type, subCategory: data.sub, amount: Number(data.amt), note: data.note };
        if (isEditing && onSubmit) onSubmit(payload); 
        else if (onAdd) { onAdd(payload); setData({...data, amt: '', note: ''}); }
    };

    const handleSaveTemplate = () => {
        if(!data.amt || Number(data.amt) <= 0) return showNotification("請先輸入金額與項目", "error");
        const newTemplate: Template = {
            id: Date.now().toString(),
            name: data.note || data.sub,
            type: data.type as 'income'|'expense',
            subCategory: data.sub,
            amount: Number(data.amt),
            note: data.note || ''
        };
        const updated = [...templates, newTemplate];
        setTemplates(updated);
        localStorage.setItem('tina_journal_templates', JSON.stringify(updated));
        showNotification("已儲存為快速樣板", "success");
    };

    const handleApplyTemplate = (t: Template) => {
        setData(prev => ({
            ...prev,
            type: t.type,
            sub: t.subCategory,
            amt: String(t.amount),
            note: t.note
        }));
        setShowTemplateModal(false);
    };

    const handleDeleteTemplate = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(window.confirm('確定刪除此樣板？')) {
            const updated = templates.filter(t => t.id !== id);
            setTemplates(updated);
            localStorage.setItem('tina_journal_templates', JSON.stringify(updated));
        }
    };
    
    return (
        <div className="space-y-5">
            {/* Type Selection: Big Buttons */}
            <div className="flex gap-3">
                <button onClick={()=>setData({...data, type:'expense'})} className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-widest transition-all shadow-sm ${data.type==='expense' ? 'bg-muji-green text-white transform scale-[1.02]' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>支出</button>
                <button onClick={()=>setData({...data, type:'income'})} className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-widest transition-all shadow-sm ${data.type==='income' ? 'bg-muji-red text-white transform scale-[1.02]' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>收入</button>
            </div>

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={()=>setShowTemplateModal(false)}></div>
                    <div className="bg-muji-paper w-full max-w-[300px] rounded-3xl shadow-2xl flex flex-col animate-pop relative z-10 max-h-[60vh]">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-3xl sticky top-0 z-10">
                            <h3 className="font-bold text-muji-text text-sm tracking-wide">選擇快速樣板</h3>
                            <button onClick={()=>setShowTemplateModal(false)}><Icons.X size={18} className="text-gray-400"/></button>
                        </div>
                        <div className="overflow-y-auto p-3 space-y-2 hide-scrollbar">
                            {templates.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-300"><Icons.Bookmark size={18}/></div>
                                    <p className="text-xs text-gray-400">尚無樣板</p>
                                    <p className="text-[10px] text-gray-300 mt-1">輸入金額與備註後<br/>點擊書籤按鈕即可新增</p>
                                </div>
                            ) : (
                                templates.map(t => (
                                    <div key={t.id} onClick={() => handleApplyTemplate(t)} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center hover:border-muji-ink transition cursor-pointer active:scale-95 duration-200">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-sm font-bold ${t.type==='expense'?'text-muji-green':'text-muji-red'}`}>${t.amount}</span>
                                                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{t.subCategory}</span>
                                            </div>
                                            <span className="text-xs text-gray-400 block truncate">{t.name}</span>
                                        </div>
                                        <button onClick={(e) => handleDeleteTemplate(e, t.id)} className="p-2 text-gray-200 hover:text-red-400 hover:bg-red-50 rounded-full transition"><Icons.Trash size={16}/></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Date + Template Button Row */}
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <FormDatePicker value={data.date || ''} onChange={e=>setData({...data, date:e.target.value})} />
                </div>
                <button onClick={() => setShowTemplateModal(true)} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 text-gray-400 hover:text-muji-ink hover:bg-gray-100 transition border border-transparent hover:border-gray-200">
                    <Icons.List size={16} />
                    <span className="text-xs">樣板 ({templates.length})</span>
                </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
                {cats && cats.length > 0 ? cats.map(c => (
                    <button key={c} onClick={()=>setData({...data, sub:c})} className={`py-2 text-xs rounded-lg transition-all w-full truncate ${data.sub===c ? 'bg-muji-ink text-white' : 'bg-gray-100 text-gray-500'}`} title={c}>{c}</button>
                )) : <span className="text-xs text-gray-400 col-span-5 text-center">請至設定新增類別</span>}
            </div>
            
            <div className="relative border-b border-gray-200 group">
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-xl font-sans ${data.type === 'expense' ? 'text-muji-green' : 'text-muji-red'}`}>$</span>
                <input type="number" inputMode="numeric" min="0" placeholder="0" value={data.amt} onChange={e => {const val = e.target.value; if (val === '' || (Number(val) >= 0 && !val.includes('-'))) setData({...data, amt: val});}} onKeyDown={e => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()} className={`w-full pl-6 py-2 text-4xl font-sans font-bold text-right outline-none bg-transparent ${data.type === 'expense' ? 'text-muji-green' : 'text-muji-red'}`}/>
            </div>
            
            <div className="flex gap-2 w-full">
                <input placeholder="備註..." value={data.note} onChange={e=>setData({...data, note:e.target.value})} className="flex-1 min-w-0 bg-gray-50 p-3 rounded-lg text-sm outline-none text-muji-text placeholder-gray-400"/>
                <button onClick={handleSaveTemplate} className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:text-muji-ink hover:bg-gray-200 transition" title="存為樣板">
                    <Icons.Bookmark size={20} />
                </button>
            </div>
            
            <button onClick={handleSubmit} className="w-full py-4 bg-muji-ink text-white rounded-xl shadow-lg hover:opacity-90 transition tracking-widest uppercase text-xs">{isEditing ? "確認修改" : "儲存紀錄"}</button>
        </div>
    );
};

export const TeaForm: React.FC<FormProps> = ({ onAdd, onSubmit, records, initialData, isEditing, showNotification }) => {
    const [data, setData] = useState<Partial<TeaRecord> & { amt: string }>(() => {
        if (initialData) return { date: initialData.date, shop: initialData.shop, item: initialData.item, sugar: initialData.sugar, ice: initialData.ice, amt: String(initialData.amount), rating: initialData.rating || 0 };
        return { date: getTodayString(), shop: '', item: '', sugar: '半糖', ice: '少冰', amt: '', rating: 0 };
    });
    useEffect(() => { if (initialData) setData({ ...initialData, amt: String(initialData.amount), rating: initialData.rating || 0 }); }, [initialData]);
    
    const shops = useMemo(() => [...new Set(records?.filter(r=>r.category==='tea').map(r=>(r as TeaRecord).shop))], [records]);
    const items = useMemo(() => [...new Set(records?.filter(r=>r.category==='tea' && (r as TeaRecord).shop===data.shop).map(r=>(r as TeaRecord).item))], [records, data.shop]);
    
    const handleSubmit = () => {
        if(!data.shop) return showNotification("請輸入店家名稱", "error");
        if(!data.item) return showNotification("請輸入品項名稱", "error");
        if(!data.rating || data.rating === 0) return showNotification("請給予評分", "error");
        if(!data.amt || Number(data.amt) <= 0) return showNotification("請輸入有效金額", "error");
        const payload = { category: 'tea', ...data, amount: Number(data.amt) };
        if (isEditing && onSubmit) onSubmit(payload);
        else if (onAdd) { onAdd(payload); setData({...data, amt: '', shop: '', item: '', rating: 0}); }
    };
    return (
        <div className="space-y-5">
            <div className="flex gap-4 items-center"><div className="flex-1"><FormDatePicker value={data.date || ''} onChange={e=>setData({...data, date:e.target.value})} /></div><div className="flex-shrink-0"><RatingInput value={data.rating || 0} onChange={v => setData({...data, rating: v})} /></div></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] text-gray-400 uppercase">店家</label><input list="shops" value={data.shop} onChange={e=>setData({...data, shop:e.target.value})} className="w-full border-b border-gray-200 py-2 outline-none text-sm text-muji-text bg-transparent" placeholder="店家"/><datalist id="shops">{shops.map(s=><option key={s} value={s}/>)}</datalist></div>
                <div className="space-y-1"><label className="text-[10px] text-gray-400 uppercase">品項</label><input list="items" value={data.item} onChange={e=>setData({...data, item:e.target.value})} className="w-full border-b border-gray-200 py-2 outline-none text-sm text-muji-text bg-transparent" placeholder="品項"/><datalist id="items">{items.map(i=><option key={i} value={i}/>)}</datalist></div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">{['無糖','微糖','半糖','少糖','全糖'].map(s=><button key={s} onClick={()=>setData({...data, sugar:s})} className={`px-3 py-1 text-xs rounded-full border ${data.sugar===s?'border-muji-ink text-muji-ink bg-gray-100':'border-gray-200 text-gray-400'}`}>{s}</button>)}</div>
            <div className="flex gap-2 overflow-x-auto pb-2">{['熱','去冰','微冰','少冰','正常'].map(i=><button key={i} onClick={()=>setData({...data, ice:i})} className={`px-3 py-1 text-xs rounded-full border ${data.ice===i?'border-muji-ink text-muji-ink bg-gray-100':'border-gray-200 text-gray-400'}`}>{i}</button>)}</div>
            <div className="relative border-b border-gray-200"><span className="absolute left-0 top-1/2 -translate-y-1/2 text-xl font-sans text-gray-300">$</span><input type="number" inputMode="numeric" min="0" placeholder="0" value={data.amt} onChange={e => {const val = e.target.value; if (val === '' || (Number(val) >= 0 && !val.includes('-'))) setData({...data, amt: val});}} onKeyDown={e => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()} className="w-full pl-6 py-2 text-4xl font-sans font-bold text-right outline-none bg-transparent text-muji-text"/></div>
            <button onClick={handleSubmit} className="w-full py-4 bg-muji-ink text-white rounded-xl shadow-lg hover:opacity-90 transition tracking-widest uppercase text-xs">{isEditing ? "確認修改" : "儲存飲料"}</button>
        </div>
    );
};

export const MahjongForm: React.FC<FormProps> = ({ onAdd, onSubmit, records, initialData, isEditing, showNotification, players }) => {
    const [data, setData] = useState<Partial<MahjongRecord> & { win: boolean, amt: string }>(() => {
        if (initialData) return { date: initialData.date, players: initialData.players || [], win: initialData.isWin, amt: String(initialData.amount) };
        return { date: getTodayString(), players: [], win: true, amt: '' };
    });
    useEffect(() => { if (initialData) setData({ date: initialData.date, players: initialData.players, win: initialData.isWin, amt: String(initialData.amount) }); }, [initialData]);
    
    const toggle = (p: string) => { 
        if (data.players?.includes(p)) setData({...data, players: data.players.filter(x=>x!==p)}); 
        else if ((data.players?.length || 0) < 3) setData({...data, players: [...(data.players || []), p]}); 
    };
    const submit = () => { 
        if((data.players?.length || 0) !== 3) return showNotification("麻友請選擇 3 位", "error");
        if(!data.amt || Number(data.amt) <= 0) return showNotification("請輸入有效金額", "error");
        const payload = { category: 'mahjong', date: data.date, players: data.players, isWin: data.win, amount: Number(data.amt) }; 
        if (isEditing && onSubmit) onSubmit(payload); else if (onAdd) { onAdd(payload); setData({...data, amt: '', players: []}); } 
    };
    return (
        <div className="space-y-6">
            <FormDatePicker value={data.date || ''} onChange={e=>setData({...data, date:e.target.value})} />
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={()=>setData({...data, win:true})} className={`flex-1 py-2 text-xs rounded-md transition ${data.win?'bg-white shadow text-muji-red font-bold':'text-gray-400'}`}>贏</button>
                <button onClick={()=>setData({...data, win:false})} className={`flex-1 py-2 text-xs rounded-md transition ${!data.win?'bg-white shadow text-muji-green font-bold':'text-gray-400'}`}>輸</button>
            </div>
            <div>
                <div className="flex justify-between items-center mb-2"><span className="text-xs uppercase text-gray-400">選擇麻友 ({data.players?.length || 0}/3)</span></div>
                <div className="flex flex-wrap gap-2">
                    {players?.map(p => ( <button key={p} onClick={()=>toggle(p)} className={`px-3 py-1 text-xs rounded-full border transition ${data.players?.includes(p)?'bg-muji-ink text-white border-muji-ink':'bg-white text-gray-500 border-gray-200'}`}>{p}</button> ))}
                    {players?.length === 0 && <span className="text-xs text-gray-400">請至設定新增麻友</span>}
                </div>
            </div>
            <div className="relative border-b border-gray-200"><span className={`absolute left-0 top-1/2 -translate-y-1/2 text-xl font-sans ${data.win?'text-muji-red':'text-muji-green'}`}>$</span><input type="number" inputMode="numeric" min="0" placeholder="0" value={data.amt} onChange={e => {const val = e.target.value; if (val === '' || (Number(val) >= 0 && !val.includes('-'))) setData({...data, amt: val});}} onKeyDown={e => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()} className={`w-full pl-6 py-2 text-4xl font-sans font-bold text-right outline-none bg-transparent ${data.win?'text-muji-red':'text-muji-green'}`}/></div>
            <button onClick={submit} className="w-full py-4 bg-muji-ink text-white rounded-xl shadow-lg hover:opacity-90 transition tracking-widest uppercase text-xs">{isEditing ? "確認修改" : "儲存戰績"}</button>
        </div>
    );
};