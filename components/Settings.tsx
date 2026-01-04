import React, { useState } from 'react';
import { Icons } from './Icons';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  TouchSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Template } from '../types';

const formatMoney = (amount: number) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(amount);

const SettingsItem = ({ icon, label, subLabel, onClick, isDestructive }: any) => (
    <button onClick={onClick} className={`w-full py-4 flex items-center justify-between group transition-colors ${isDestructive ? 'text-muji-red hover:bg-red-50/50 rounded-lg px-2 -mx-2' : 'hover:bg-white/60 rounded-lg px-2 -mx-2'}`}>
        <div className="flex items-center gap-4"><div className={`${isDestructive ? 'text-muji-red' : 'text-gray-400 group-hover:text-muji-ink'} transition-colors`}>{icon}</div><div className="text-left"><span className={`block text-sm font-bold ${isDestructive ? 'text-muji-red' : 'text-muji-text'}`}>{label}</span>{subLabel && <span className="text-[10px] text-gray-400 block mt-0.5">{subLabel}</span>}</div></div>
        {!isDestructive && <Icons.ChevronRight size={16} className="text-gray-300"/>}
    </button>
);

// --- DND Components ---

const SortableItem = ({ id, children, onRemove }: { id: string, children: React.ReactNode, onRemove?: () => void }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-manipulation relative">
             <div className="group flex items-center justify-between bg-white border border-gray-100 px-4 py-3 rounded-xl shadow-sm">
                {children}
             </div>
        </div>
    );
};

const CategorySettings = ({ categories, onAdd, onRemove, setCategories, showNotification }: any) => {
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
    const [newCat, setNewCat] = useState('');
    
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleAdd = () => { 
        if (!newCat.trim()) {
            showNotification("請輸入類別名稱", "error");
            return;
        }
        onAdd(activeTab, newCat.trim()); 
        setNewCat(''); 
    };
    
    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setCategories((prev: any) => {
                const oldIndex = prev[activeTab].indexOf(active.id);
                const newIndex = prev[activeTab].indexOf(over.id);
                return {
                    ...prev,
                    [activeTab]: arrayMove(prev[activeTab], oldIndex, newIndex)
                };
            });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <div className="bg-white p-1 rounded-xl flex shadow-inner border border-gray-100">
                <button onClick={()=>setActiveTab('expense')} className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-all duration-300 ${activeTab==='expense' ? 'bg-muji-ink text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>支出</button>
                <button onClick={()=>setActiveTab('income')} className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-all duration-300 ${activeTab==='income' ? 'bg-muji-ink text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}>收入</button>
            </div>
            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                <input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=> e.key === 'Enter' && handleAdd()} placeholder="輸入新類別..." className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-muji-text outline-none placeholder-gray-300"/>
                <button onClick={handleAdd} className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-muji-paper text-muji-ink rounded-lg hover:bg-muji-ink hover:text-white transition-all"><Icons.Plus size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={categories[activeTab]} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-2 content-start">
                            {categories[activeTab].map((cat: string) => (
                                <SortableItem key={cat} id={cat}>
                                    <span className="text-sm text-gray-600 font-medium">{cat}</span>
                                    <div className="flex items-center gap-1">
                                        <div className="p-2 cursor-move text-gray-300"><Icons.List size={14} className="opacity-50"/></div>
                                        <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                                        <button 
                                            onPointerDown={(e) => e.stopPropagation()} 
                                            onClick={(e)=> {e.stopPropagation(); onRemove(activeTab, cat);}} 
                                            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                                        >
                                            <Icons.X size={14}/>
                                        </button>
                                    </div>
                                </SortableItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                {categories[activeTab].length === 0 && <div className="w-full text-center py-10 text-gray-300 space-y-2"><div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border border-gray-100 mx-auto"><Icons.List size={20} className="opacity-20"/></div><span className="text-xs tracking-widest">暫無類別</span></div>}
            </div>
        </div>
    );
};

const PlayerSettings = ({ players, onAdd, onRemove, setPlayers, showNotification }: any) => {
    const [newPlayer, setNewPlayer] = useState('');
    
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleAdd = () => { 
        if (!newPlayer.trim()) {
            showNotification("請輸入麻友名字", "error");
            return;
        }
        onAdd(newPlayer.trim()); 
        setNewPlayer(''); 
    };
    
    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setPlayers((items: string[]) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                <input value={newPlayer} onChange={e=>setNewPlayer(e.target.value)} onKeyDown={e=> e.key === 'Enter' && handleAdd()} placeholder="輸入麻友名字..." className="flex-1 min-w-0 bg-transparent px-3 py-2 text-sm text-muji-text outline-none placeholder-gray-300"/>
                <button onClick={handleAdd} className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-muji-paper text-muji-ink rounded-lg hover:bg-muji-ink hover:text-white transition-all"><Icons.Plus size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
                 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={players} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-2 content-start">
                            {players.map((p: string) => (
                                <SortableItem key={p} id={p}>
                                    <span className="text-sm text-gray-600 font-medium">{p}</span>
                                    <div className="flex items-center gap-1">
                                        <div className="p-2 cursor-move text-gray-300"><Icons.List size={14} className="opacity-50"/></div>
                                        <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                                        <button 
                                            onPointerDown={(e) => e.stopPropagation()} 
                                            onClick={(e)=>{e.stopPropagation(); onRemove(p);}} 
                                            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                                        >
                                            <Icons.X size={14}/>
                                        </button>
                                    </div>
                                </SortableItem>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                {players.length === 0 && <div className="col-span-3 w-full text-center py-10 text-gray-300 text-xs tracking-widest">暫無麻友</div>}
            </div>
        </div>
    );
};

interface TemplateSettingsProps { 
    templates: Template[]; 
    onDelete: (id: string) => void;
    onRename: (id: string, name: string) => void;
    showNotification: (m: string, t?: string) => void;
}

const TemplateSettings = ({ templates, onDelete, onRename, showNotification }: TemplateSettingsProps) => {
    const [editId, setEditId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const startEdit = (t: Template) => {
        setEditId(t.id);
        setEditName(t.name);
    };

    const saveEdit = () => {
        if (editId && editName.trim()) {
            onRename(editId, editName.trim());
        }
        setEditId(null);
        setEditName('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') setEditId(null);
    };

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <div className="px-1 text-xs text-gray-400 text-center">
                點擊名稱可重新命名
            </div>
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {templates.map(t => (
                    <div key={t.id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between group shadow-sm transition-all hover:border-muji-ink">
                        {/* Left Side: Category + Name/Edit */}
                        <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                            {/* Category Tag */}
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded flex-shrink-0 tracking-wide">{t.subCategory}</span>
                            
                            {/* Name or Edit Input */}
                            {editId === t.id ? (
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <input 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={saveEdit}
                                        onKeyDown={handleKeyDown}
                                        maxLength={10}
                                        className="w-full text-sm border-b border-muji-ink outline-none py-0.5 text-muji-ink bg-transparent"
                                        autoFocus
                                    />
                                    <button onMouseDown={saveEdit} className="text-muji-ink flex-shrink-0"><Icons.Check size={16}/></button>
                                </div>
                            ) : (
                                <span 
                                    onClick={() => startEdit(t)} 
                                    className="text-sm text-muji-text truncate font-medium group-hover:text-muji-ink transition-colors cursor-pointer py-0.5 flex-1"
                                >
                                    {t.name}
                                </span>
                            )}
                        </div>

                        {/* Right Side: Amount + Delete */}
                        <div className="flex items-center gap-3 flex-shrink-0 pl-2">
                            <span className={`text-sm font-bold ${t.type==='expense'?'text-muji-green':'text-muji-red'}`}>{formatMoney(t.amount)}</span>
                            <button onClick={() => onDelete(t.id)} className="p-1.5 text-gray-200 hover:text-red-400 hover:bg-red-50 rounded-full transition"><Icons.Trash size={16}/></button>
                        </div>
                    </div>
                ))}
                {templates.length === 0 && (
                    <div className="text-center py-10 text-gray-300 text-xs tracking-widest">
                        暫無樣板<br/>請於記帳頁面新增
                    </div>
                )}
            </div>
        </div>
    );
};

export { SettingsItem, CategorySettings, PlayerSettings, TemplateSettings };