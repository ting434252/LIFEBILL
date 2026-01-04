import React, { useState, useMemo } from 'react';
import { AppRecord, CategoryType, TeaRecord, MahjongRecord, DailyRecord } from '../../types';
import { Icons } from '../Icons';
import { SummaryCard } from '../ui/UI';

const formatMoney = (amount: number) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(amount);
const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface CalendarViewProps {
    records: AppRecord[];
    onDelete: (id: string) => void;
    onEdit: (record: AppRecord) => void;
    onDuplicate: (id: string) => void;
    category: CategoryType;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ records, onDelete, onEdit, onDuplicate, category }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [selDate, setSelDate] = useState(getTodayString());
    const [showPicker, setShowPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchMode, setIsSearchMode] = useState(false);
    
    // First filter by category
    const categoryRecords = useMemo(() => records.filter(r => r.category === category), [records, category]);

    // Then filter by search query (if exists) OR date selection
    const displayRecords = useMemo(() => {
        if (isSearchMode) {
            if (!searchQuery.trim()) return []; // Return empty if searching but no input
            
            const lowerQ = searchQuery.toLowerCase();
            return categoryRecords.filter(r => {
                const amountMatch = r.amount.toString().includes(lowerQ);
                const noteMatch = r.note?.toLowerCase().includes(lowerQ);
                
                if (r.category === 'daily') {
                    const dr = r as DailyRecord;
                    return amountMatch || noteMatch || dr.subCategory.includes(lowerQ);
                }
                if (r.category === 'tea') {
                    const tr = r as TeaRecord;
                    return amountMatch || noteMatch || tr.shop.includes(lowerQ) || tr.item.includes(lowerQ);
                }
                if (r.category === 'mahjong') {
                    const mr = r as MahjongRecord;
                    return amountMatch || noteMatch || mr.players.some(p => p.includes(lowerQ));
                }
                return false;
            }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } else {
            return categoryRecords.filter(r => r.date === selDate);
        }
    }, [categoryRecords, searchQuery, isSearchMode, selDate]);
    
    // Calendar grid calculations
    const getDayInfo = (d: number) => {
        const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const rs = categoryRecords.filter(r => r.date === dateStr);
        const hasData = rs.length > 0;
        
        let incCount = 0;
        let expCount = 0;
        let count = 0;
        let total = 0;

        rs.forEach(c => {
            let val = Number(c.amount);
            if (c.category === 'daily') {
                if ((c as DailyRecord).type === 'income') { incCount++; total += val; } 
                else { expCount++; total -= val; }
            } else if (c.category === 'mahjong') {
                count++;
                if ((c as MahjongRecord).isWin) total += val; else total -= val;
            } else if (c.category === 'tea') {
                count++; total -= val;
            }
        });
        return { dateStr, hasData, total, incCount, expCount, count };
    };

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const startDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const offset = startDay === 0 ? 6 : startDay - 1;
    
    const jumpToToday = () => { const now = new Date(); setViewDate(now); setSelDate(getTodayString()); setShowPicker(false); setSearchQuery(''); };
    const changeMonth = (m: number) => { const newDate = new Date(viewDate.getFullYear(), m, 1); setViewDate(newDate); setShowPicker(false); };
    const changeYear = (y: number) => { const newDate = new Date(y, viewDate.getMonth(), 1); setViewDate(newDate); setShowPicker(false); };

    return (
        <div className="px-6 animate-fade-in mb-6 relative">
            
            {/* Header: Summary Card + Search Button (Flex Layout) */}
            <div className="mb-4">
                {isSearchMode ? (
                    <div className="bg-white p-4 rounded-2xl shadow-float border border-gray-100 flex items-center gap-3 animate-fade-in">
                        <Icons.Search size={20} className="text-muji-ink ml-1" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜尋關鍵字..." 
                            className="flex-1 min-w-0 bg-transparent py-2 text-base text-muji-text outline-none placeholder-gray-300 font-sans"
                            autoFocus
                        />
                        <button 
                            onClick={() => { setIsSearchMode(false); setSearchQuery(''); }} 
                            className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition"
                        >
                            <Icons.X size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 animate-fade-in">
                        <div className="flex-1 min-w-0">
                             <SummaryCard category={category} records={records} />
                        </div>
                        <button 
                            onClick={() => setIsSearchMode(true)} 
                            className="flex-shrink-0 w-12 h-12 bg-white rounded-2xl shadow-float flex items-center justify-center text-muji-ink hover:scale-105 transition border border-white/50"
                            title="搜尋"
                        >
                            <Icons.Search size={22} />
                        </button>
                    </div>
                )}
            </div>

            {/* Conditionally Render Calendar & Details only when NOT searching */}
            {!isSearchMode && (
                <>
                    {showPicker && (
                        <div className="absolute top-44 left-6 right-6 bg-white p-4 shadow-xl rounded-2xl z-20 border border-gray-100 animate-fade-in">
                            <div className="flex justify-between items-center mb-4 px-2">
                                <button onClick={() => changeYear(viewDate.getFullYear() - 1)} className="p-2 hover:bg-gray-100 rounded-full text-muji-ink"><Icons.ChevronLeft size={20}/></button>
                                <span className="font-bold text-xl text-muji-ink font-sans">{viewDate.getFullYear()}</span>
                                <button onClick={() => changeYear(viewDate.getFullYear() + 1)} className="p-2 hover:bg-gray-100 rounded-full text-muji-ink"><Icons.ChevronRight size={20}/></button>
                            </div>
                            <div className="grid grid-cols-4 gap-2">{Array.from({length: 12}).map((_, i) => (<button key={i} onClick={() => changeMonth(i)} className={`p-2 rounded-lg text-sm font-sans font-medium transition-colors ${viewDate.getMonth() === i ? 'bg-muji-ink text-white' : 'hover:bg-gray-50 text-gray-600'}`}>{i + 1}月</button>))}</div>
                        </div>
                    )}
                    <div className="bg-muji-white p-4 rounded-3xl shadow-card border border-muji-border relative z-10 animate-slide-up">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <div className="w-8"></div>
                            <button onClick={() => setShowPicker(!showPicker)} className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                                <h2 className="text-xl font-bold font-sans text-muji-ink tracking-widest">{viewDate.getFullYear()} . {String(viewDate.getMonth()+1).padStart(2,'0')}</h2>
                                <Icons.ChevronDown size={16} className={`text-muji-ink transition-transform duration-300 ${showPicker ? 'rotate-180' : ''}`} />
                            </button>
                            <button onClick={jumpToToday} className="w-8 h-8 flex items-center justify-center rounded-full bg-muji-paper text-muji-ink hover:bg-muji-ink hover:text-white transition-colors" title="回到今天"><Icons.Target size={18} /></button>
                        </div>
                        <div className="grid grid-cols-7 text-center mb-2">{['一','二','三','四','五','六','日'].map((d,i)=><div key={d} className={`text-[10px] uppercase tracking-wider ${i>=5?'text-muji-red opacity-60':'text-gray-300'}`}>{d}</div>)}</div>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({length: offset}).map((_,i)=><div key={`empty-${i}`}/>)}
                            {Array.from({length: daysInMonth}).map((_,i)=> {
                                const day = i+1; const info = getDayInfo(day); const isSel = info.dateStr === selDate;
                                return ( 
                                    <div key={day} onClick={()=>setSelDate(info.dateStr)} className={`flex flex-col items-center justify-start py-0.5 cursor-pointer h-auto min-h-[56px] w-full mx-auto rounded-lg relative border transition-all duration-200 ${isSel ? 'border-muji-ink bg-muji-ink/5' : 'border-transparent hover:border-gray-100'}`}>
                                        <span className={`relative z-10 text-[10px] font-medium leading-none ${isSel?'text-muji-ink font-bold':'text-gray-400'}`}>{day}</span>
                                        {info.hasData && (
                                            <div className="flex flex-col items-center gap-0.5 mt-0.5 w-full px-0.5">
                                                {/* Unified Count Indicators Style - Using Dot+Number for all categories for consistency */}
                                                <div className="flex items-center justify-center gap-1 h-3">
                                                    {category === 'daily' && (
                                                        <>
                                                            {info.incCount > 0 && <span className="flex items-center text-[8px] text-muji-red font-bold"><span className="w-1 h-1 rounded-full bg-muji-red mr-0.5"></span>{info.incCount}</span>}
                                                            {info.expCount > 0 && <span className="flex items-center text-[8px] text-muji-green font-bold"><span className="w-1 h-1 rounded-full bg-muji-green mr-0.5"></span>{info.expCount}</span>}
                                                        </>
                                                    )}
                                                    {/* For Tea and Mahjong, use the same "green dot style" (dot + number) */}
                                                    {category === 'tea' && info.count > 0 && (
                                                        <span className="flex items-center text-[8px] text-muji-text font-bold"><span className="w-1 h-1 rounded-full bg-muji-kraft mr-0.5"></span>{info.count}</span>
                                                    )}
                                                    {category === 'mahjong' && info.count > 0 && (
                                                        <span className="flex items-center text-[8px] text-muji-text font-bold"><span className="w-1 h-1 rounded-full bg-muji-ink mr-0.5"></span>{info.count}</span>
                                                    )}
                                                </div>
                                                <span className={`text-[9px] font-bold tracking-tight leading-none ${info.total >= 0 ? 'text-muji-red' : 'text-muji-green'}`}>{Math.abs(info.total)}</span>
                                            </div>
                                        )}
                                    </div> 
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* List Header */}
            <div className="mt-6 space-y-3">
                <h3 className="text-xs text-gray-400 uppercase tracking-widest pl-2 mb-2 font-sans">
                    {isSearchMode ? `搜尋結果: ${displayRecords.length} 筆` : `${selDate} • ${category==='daily'?'日常':category==='tea'?'手搖':'麻將'}`}
                </h3>
                
                {displayRecords.length === 0 && (
                    <div className="text-center py-8 text-gray-300 text-sm italic">
                        {isSearchMode && !searchQuery ? "請輸入關鍵字開始搜尋" : isSearchMode ? "沒有符合的搜尋結果" : "本日無紀錄"}
                    </div>
                )}

                {displayRecords.map(r => (
                    <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between animate-slide-up border border-transparent hover:border-gray-200 group relative">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`w-1 h-10 rounded-full flex-shrink-0 ${r.category==='tea'?'bg-muji-kraft':((r as DailyRecord).type==='income'||(r as MahjongRecord).isWin)?'bg-muji-red':'bg-muji-green'}`}></div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-muji-text text-sm truncate">{r.category==='daily'?(r as DailyRecord).subCategory:r.category==='tea'?(r as TeaRecord).shop:'麻將'}</p>
                                    {(isSearchMode) && <span className="text-[10px] text-gray-400 bg-gray-50 px-1 rounded flex-shrink-0">{r.date}</span>}
                                </div>
                                <p className="text-xs text-gray-400 truncate">
                                    {r.category==='tea' ? 
                                        <span className="flex items-center gap-1">{(r as TeaRecord).item} <span className="flex">{[...Array(5)].map((_,i) => <Icons.Star key={i} size={8} fill={(r as TeaRecord).rating >= i+1} half={(r as TeaRecord).rating === i+0.5} />)}</span></span> 
                                        : r.category==='mahjong' ? ((r as MahjongRecord).players ? (r as MahjongRecord).players.join(' / ') : r.note) 
                                        : r.note
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="text-right flex items-center gap-3 pl-2 flex-shrink-0">
                            <p className={`font-sans font-medium ${(r.category==='daily'&&(r as DailyRecord).type==='income')||(r.category==='mahjong'&&(r as MahjongRecord).isWin)?'text-muji-red':'text-muji-green'}`}>{formatMoney(r.amount)}</p>
                            <div className="flex gap-1">
                                <button onClick={()=>onDuplicate(r.id)} className="text-gray-300 hover:text-muji-ink p-1.5 rounded hover:bg-gray-50 transition" title="複製"><Icons.Copy size={14}/></button>
                                <button onClick={()=>onEdit(r)} className="text-gray-300 hover:text-muji-ink p-1.5 rounded hover:bg-gray-50 transition" title="編輯"><Icons.Edit size={14}/></button>
                                <button onClick={()=>onDelete(r.id)} className="text-gray-300 hover:text-red-400 p-1.5 rounded hover:bg-gray-50 transition" title="刪除"><Icons.Trash size={14}/></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};