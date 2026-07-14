'use client';
import React from 'react';
import { Menu, FilePlus, X, Loader2, Settings2, Paperclip, Check, ArrowBigRight, Users, UserPlus } from 'lucide-react';
import Sidebar from '@/components/tasks/ListSidebar';
import TaskCard from '@/components/tasks/TaskCard';
import AiMenu from '@/components/tasks/AiMenu';
import FriendsPage from '@/components/friends/FriendsPage';
import CollaboratorsModal from '@/components/lists/CollaboratorsModal';
import { useListsState } from './useListsStates';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const normalizeDisplayName = (value: unknown) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const normalized = trimmed.toLowerCase();
  if (normalized === 'undefined' || normalized === 'null') return '';
  return trimmed;
};

const Lists = () => {
  const s = useListsState();
  const router = useRouter();
  
  const totalTasks = s.tasks.length;
  const completedTasks = s.tasks.filter(task => task.completed).length;
  const listProgressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const shouldShowTaskLoadingIndicator = s.isLoadingTasks && Boolean(s.activeListId) && s.activeListId !== 'empty' && s.activeListId !== 'error' && s.sidebarItems.length > 0;
  const [displayedName, setDisplayedName] = useState('User');
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const oauthToken = searchParams.get('token');
    const oauthUsername = searchParams.get('username');

    if (oauthToken) {
      localStorage.setItem('token', oauthToken);
      if (oauthUsername) {
        const normalized = normalizeDisplayName(oauthUsername);
        if (normalized) {
          localStorage.setItem('username', normalized);
          localStorage.setItem('name', normalized);
          setDisplayedName(normalized);
        }
      }
      router.replace('/lists');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/');
      return;
    }

    const storedName = normalizeDisplayName(localStorage.getItem('username') || localStorage.getItem('name'));
    if (storedName && storedName !== 'User') {
      setDisplayedName(storedName);
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1] || '')) as { userId?: string; email?: string };
        if (payload.userId) {
          fetch(`/api/users/${payload.userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.ok ? res.json() : null)
            .then((data) => {
              const fetchedName = normalizeDisplayName(data?.username) || normalizeDisplayName(payload.email?.split('@')[0]) || 'User';
              setDisplayedName(fetchedName);
              localStorage.setItem('username', fetchedName);
              localStorage.setItem('name', fetchedName);
            })
            .catch(() => {
              const fallbackName = normalizeDisplayName(payload.email?.split('@')[0]) || 'User';
              setDisplayedName(fallbackName);
              localStorage.setItem('username', fallbackName);
              localStorage.setItem('name', fallbackName);
            });
        } else {
          const fallbackName = normalizeDisplayName(payload.email?.split('@')[0]) || 'User';
          setDisplayedName(fallbackName);
          localStorage.setItem('username', fallbackName);
          localStorage.setItem('name', fallbackName);
        }
      } catch {
        setDisplayedName('User');
      }
    }

    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only handle single-character printable keys without modifiers
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      const active = document.activeElement as HTMLElement | null;
      if (!active) return;
      const tag = active.tagName;
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || active.isContentEditable;
      if (isEditable) return; // let the focused input handle typing
      // focus the task input and append the character
      const el = inputRef.current;
      if (!el || el.disabled) return;
      e.preventDefault();
      el.focus();
      // append the character at the end
      const prev = s.newTaskTitle || '';
      // For accessibility, update the React state rather than DOM directly
      s.setNewTaskTitle(prev + e.key);
      // place cursor at end
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = el.value.length;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [s]);

  if (!authChecked) return null;

  return (
    <div className="flex min-h-screen w-full bg-[#FDF6EC] font-sans antialiased text-gray-800 relative">
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        <button
          onClick={() => {
            setIsFriendsOpen(false);
            s.setIsAiOpen(true);
          }}
          className="flex items-center gap-1.5 bg-[#F28C38] hover:bg-[#e07b27] text-white px-4 py-2 rounded-xl font-medium shadow-sm text-xs transition whitespace-nowrap"
        >
          Generate Report
        </button>
        <button
          onClick={() => {
            s.setIsAiOpen(false);
            setIsCollaboratorsOpen(true);
          }}
          disabled={!s.activeListId || s.activeListId === 'empty' || s.activeListId === 'error'}
          className="flex items-center gap-1.5 border border-[#F2D9B3] bg-white/90 hover:bg-[#FFF3E6] text-[#8A4B12] px-4 py-2 rounded-xl font-medium shadow-sm text-xs transition whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserPlus size={14} /> Collaborators
        </button>
        <button
          onClick={() => {
            s.setIsAiOpen(false);
            setIsFriendsOpen(true);
          }}
          className="flex items-center gap-1.5 border border-[#F2D9B3] bg-white/90 hover:bg-[#FFF3E6] text-[#8A4B12] px-4 py-2 rounded-xl font-medium shadow-sm text-xs transition whitespace-nowrap"
        >
          <Users size={14} /> Friends
        </button>
      </div>
      <input type="file" ref={s.fileInputRef} className="hidden" onChange={(e) => s.setSelectedFile(e.target.files?.[0] || null)} />

      {/* FIXED LEFT SIDEBAR */}
      <div className={`fixed top-0 left-0 bottom-0 z-30 transition-all duration-300 ease-in-out ${
        s.isLeftSidebarOpen ? 'w-64' : 'w-0'
      }`}>
        <Sidebar 
          isOpen={s.isLeftSidebarOpen} 
          setIsOpen={s.setIsLeftSidebarOpen} 
          sidebarItems={s.sidebarItems} 
          onSwitchList={s.handleSwitchList} 
          onAddList={s.handleAddTaskList} 
          onDeleteList={s.handleDeleteList}
          viewMode={s.viewMode}
          setViewMode={s.setViewMode}
          groupItems={s.groupItems}
          setGroupItems={s.setGroupItems}
          setActiveContext={s.setActiveContext}
          isLoadingGroups={s.isLoadingGroups}
        />
      </div>

      {/* UPDATED MAIN VIEW: Lower left padding + high right padding forces the centered column leftward */}
      <main className={`flex-1 flex flex-col items-center pt-6 pl-8 pr-24 md:pr-40 transition-all duration-300 w-full pb-40 ${
        s.isLeftSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        <div className="absolute right-0 bottom-0 w-80 h-[80%] bg-[#FCECD7] rounded-l-full opacity-40 transform translate-x-10 pointer-events-none z-0" />

        {/* TOP ROW HEADER BLOCK */}
        <div className="w-full max-w-2xl flex items-center justify-between mb-8 z-10 relative">
          {/* Menu Button Side Offset Column */}
          <div className="w-12 shrink-0 flex justify-start">
            {!s.isLeftSidebarOpen && (
              <button onClick={() => s.setIsLeftSidebarOpen(true)} className="p-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl shadow-sm transition">
                <Menu size={20} />
              </button>
            )}
          </div>
          
          {/* Greeting Box */}
          <div className="text-center flex-1 ml-25">
            <h1 className="text-4xl font-semibold text-gray-900 leading-tight tracking-tight capitalize">
              {s.greeting},<br />{displayedName} !
            </h1>
            <p className="text-gray-500 mt-1 text-xs">{s.currentDate}</p>
          </div>

          {/* AI Insights Button (Still mapped to the absolute top-right edge of the row container) */}
          <div className="w-32 shrink-0 flex justify-end ">
            
          </div>
        
        </div>

        {/* List Name Header & Progress Tracker Section */}
        <div className="w-full max-w-2xl mb-6 z-10 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{s.activeListName}</h2>
          
          <div className="w-full bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-left">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-500 mb-2">
              <span>Progress</span>
              <span>{completedTasks} / {totalTasks} Done ({Math.round(listProgressPercentage)}%)</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${listProgressPercentage}%` }} />
            </div>
          </div>
        </div>

        {/* TASK STREAM CARDS */}
        <div className="w-full max-w-2xl space-y-4 z-10 text-left">
          {s.tasks.length === 0 && !s.isLoadingTasks ? (
            <div className="bg-white/50 border border-dashed border-gray-300 rounded-2xl p-12 text-center text-xs text-gray-400 w-full">
              No tasks listed under this filter index.
            </div>
          ) : (
            s.tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onEditTrigger={s.setEditingTask} 
                onDeleteTrigger={s.handleDeleteTask}
                onToggleComplete={s.handleToggleComplete} 
              />
            ))
          )}
        </div>

        {shouldShowTaskLoadingIndicator && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#F2D9B3] bg-white/90 shadow-lg backdrop-blur-sm">
              <Loader2 size={18} className="animate-spin text-[#F28C38]" />
            </div>
          </div>
        )}

        {/* FIXED CHAT-STYLE BOTTOM INPUT PANEL */}
        <div className={`fixed bottom-0 right-0 p-6 bg-linear-to-t from-[#FDF6EC] via-[#FDF6EC] to-transparent pt-10 z-20 transition-all duration-300 ${
          s.isLeftSidebarOpen ? 'left-64' : 'left-0'
        }`}>
          {/* UPDATED: Added a right margin offset (mr-24 md:mr-40) matching the parent layout to keep it aligned with the tasks */}
          <div className="w-full max-w-2xl mx-auto mr-24 md:mr-83 ml-auto bg-white border border-gray-200 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
            <textarea 
              ref={inputRef}
              value={s.newTaskTitle} 
              onChange={(e) => s.setNewTaskTitle(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), s.handleCreateTask(e))} 
              placeholder={`Add a new task to ${s.activeListName}...`} 
              rows={2} 
              disabled={s.isSubmittingTask} 
              className="w-full text-sm resize-none focus:outline-none text-gray-700 bg-transparent" 
            />
            
            {s.selectedFile && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100 mt-1">
                <div className="flex items-center gap-1.5 text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                  <Paperclip size={12} /> <span className="truncate max-w-37.5">{s.selectedFile.name}</span>
                  <button onClick={() => s.setSelectedFile(null)} className="text-gray-400 hover:text-gray-600 ml-1"><X size={12} /></button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center text-gray-400">
              <div className="flex gap-3">
                <button onClick={() => s.fileInputRef.current?.click()} className="hover:text-gray-700 transition"><FilePlus size={18} /></button>
              </div>
              <div className="flex items-center gap-2">
                {s.isSubmittingTask && <Loader2 size={16} className="animate-spin text-gray-400" />}
                <button onClick={(e) => s.handleCreateTask(e)} disabled={!s.newTaskTitle.trim() || s.isSubmittingTask} className="p-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-full text-gray-600">
                  <ArrowBigRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Task Configuration Settings Aside Drawer */}
      {s.editingTask && (
        <aside className="fixed top-0 right-0 h-full w-85 bg-white border-l border-gray-200 flex flex-col p-6 shadow-2xl z-50 animate-slide-in">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <span className="font-bold text-gray-800 text-lg flex items-center gap-2"><Settings2 size={18}/> Configure Task</span>
            <button onClick={() => s.setEditingTask(null)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="flex flex-col gap-5 flex-1 overflow-y-auto pr-1">
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-gray-400 uppercase">Task Heading</label><input type="text" value={s.editingTask.title ?? ''} onChange={(e) => s.setEditingTask({...s.editingTask!, title: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-gray-50" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-gray-400 uppercase">Completion Date</label><input type="date" value={s.editingTask.date ?? ''} onChange={(e) => s.setEditingTask({...s.editingTask!, date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-gray-50" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-gray-400 uppercase">Target Time</label><input type="time" value={s.editingTask.time ?? ''} onChange={(e) => s.setEditingTask({...s.editingTask!, time: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-gray-50" /></div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase">Remind me</label>
              <select value={s.editingTask.reminderOffset || ""} onChange={(e) => s.setEditingTask({...s.editingTask!, reminderOffset: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-gray-50 text-gray-700">
                <option value="">No Reminder</option>
                <option value="5m">5 Minutes Before</option>
                <option value="10m">10 Minutes Before</option>
                <option value="15m">15 Minutes Before</option>
                <option value="30m">30 Minutes Before</option>
                <option value="1h">1 Hour Before</option>
                <option value="1d">1 Day Before</option>
              </select>
            </div>
          </div>
          <button onClick={s.handleSaveTaskEdits} className="w-full flex items-center justify-center gap-2 bg-[#F28C38] hover:bg-[#e07b27] text-white py-3 rounded-xl font-semibold shadow transition mt-auto"><Check size={16} /> Save Changes</button>
        </aside>
      )}

      <AiMenu isOpen={s.isAiOpen && !s.editingTask} setIsOpen={s.setIsAiOpen} activeListId={s.activeListId} activeListName={s.activeListName} />

      {isCollaboratorsOpen && (
        <CollaboratorsModal
          listId={String(s.activeListId)}
          isOpen={isCollaboratorsOpen}
          onClose={() => setIsCollaboratorsOpen(false)}
        />
      )}

      {isFriendsOpen && (
        <aside className="fixed top-0 right-0 h-full w-[28rem] max-w-[92vw] bg-[#FDF6EC] border-l border-[#F2D9B3] shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#F2D9B3] bg-white/70 px-5 py-4">
            <div className="flex items-center gap-2 font-semibold text-[#8A4B12]">
              <Users size={18} className="text-[#F28C38]" />
              <span>Friends</span>
            </div>
            <button
              onClick={() => setIsFriendsOpen(false)}
              className="rounded-full p-1.5 text-gray-500 transition hover:bg-[#FFF3E6] hover:text-[#8A4B12]"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <FriendsPage compact />
          </div>
        </aside>
      )}
    </div>
  );
};

export default Lists;