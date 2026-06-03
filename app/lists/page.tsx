'use client';
import React from 'react';
import { Menu, ImageIcon, Mic, FilePlus, X, Loader2, Settings2, Paperclip, Check, Plus, ArrowBigRight} from 'lucide-react';
import Sidebar from '@/components/tasks/ListSidebar';
import TaskCard from '@/components/tasks/TaskCard';
import AiMenu from '@/components/tasks/AiMenu';
import { useListsState } from './useListsStates'; // Import custom logic state hook

const Lists = () => {
  // This puts all useState login in one single constant
  const s = useListsState();

  return (
    <div className="flex min-h-screen bg-[#FDF6EC] font-sans antialiased text-gray-800 overflow-x-hidden">
      <input type="file" ref={s.fileInputRef} className="hidden" onChange={(e) => s.setSelectedFile(e.target.files?.[0] || null)} />
      <input type="file" accept="image/*" ref={s.imageInputRef} className="hidden" onChange={(e) => s.setSelectedFile(e.target.files?.[0] || null)} />

      <Sidebar isOpen={s.isLeftSidebarOpen} setIsOpen={s.setIsLeftSidebarOpen} sidebarItems={s.sidebarItems} onSwitchList={s.handleSwitchList} onAddList={s.handleAddTaskList} />

      <main className="flex-1 relative flex flex-col items-center px-8 pt-4 pb-12 overflow-hidden transition-all duration-300">
        <div className="absolute right-0 bottom-0 w-80 h-[80%] bg-[#FCECD7] rounded-l-full opacity-70 transform translate-x-10 pointer-events-none z-0" />

        <div className="w-full self-stretch relative flex items-start justify-center mb-10 z-10">
          {!s.isLeftSidebarOpen && (
            <button onClick={() => s.setIsLeftSidebarOpen(true)} className="absolute left-0 top-0 -ml-8 p-2 bg-[#F3F3F4] border border-gray-200 text-gray-700 hover:bg-gray-200 rounded-xl shadow-sm flex items-center justify-center z-20">
              <Menu size={20} />
            </button>
          )}
          <div className="text-center">
            <h1 className="text-5xl font-semibold text-gray-900 leading-tight tracking-tight">{s.greeting},<br />Anshul !</h1>
            <p className="text-gray-500 mt-2 text-sm">{s.currentDate}</p>
          </div>
          <div className="absolute right-0 top-0">
            <button onClick={() => s.setIsAiOpen(true)} className="flex items-center gap-1.5 bg-[#F28C38] hover:bg-[#e07b27] text-white px-5 py-2.5 rounded-xl font-medium shadow-sm text-sm whitespace-nowrap">Get AI Insights</button>
          </div>
        </div>

        <div className="w-full max-w-2xl flex flex-col items-center text-center z-10 flex-1">
          <h2 className="text-xl font-bold text-gray-900 mt-4 mb-6">{s.activeListName}</h2>

          <div className="w-full space-y-4 mb-12">
            {s.isLoadingTasks ? (
              <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
                <Loader2 size={20} className="animate-spin text-[#F28C38]" />
                <span className="text-sm font-medium">Loading tasks...</span>
              </div>
            ) : s.tasks.length === 0 ? (
              <p className="text-sm text-gray-400 py-12">No tasks in this list yet.</p>
            ) : (
              s.tasks.map((task) => <TaskCard key={task.id} task={task} onEditTrigger={s.setEditingTask} />)
            )}
          </div>

          <div className="w-full mt-auto bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <textarea value={s.newTaskTitle} onChange={(e) => s.setNewTaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), s.handleCreateTask(e))} placeholder={`Add a new task to ${s.activeListName}...`} rows={2} disabled={s.isSubmittingTask} className="w-full text-sm resize-none focus:outline-none text-gray-700 bg-transparent" />
            
            {s.selectedFile && (
              <div className="flex items-center gap-1.5 text-xs bg-gray-100 self-start px-2 py-1 rounded-md text-gray-600">
                <Paperclip size={12} /> <span className="truncate max-w-45">{s.selectedFile.name}</span>
                <button onClick={() => s.setSelectedFile(null)} className="text-gray-400 hover:text-gray-600 ml-1"><X size={12} /></button>
              </div>
            )}
            {s.audioBlob && (
              <div className="flex items-center gap-1.5 text-xs bg-orange-50 self-start px-2 py-1 rounded-md text-orange-700 border border-orange-200">
                <Mic size={12} /> <span>Voice Note Ready</span>
                <button onClick={() => s.setAudioBlob(null)} className="text-gray-400 hover:text-orange-700 ml-1"><X size={12} /></button>
              </div>
            )}

            <div className="flex justify-between items-center text-gray-500">
              <div className="flex gap-3">
                <button onClick={() => s.fileInputRef.current?.click()} className="hover:text-gray-800 transition"><FilePlus size={18} /></button>
                <button onClick={() => s.imageInputRef.current?.click()} className="hover:text-gray-800 transition"><ImageIcon size={18} /></button>
                <button onClick={s.toggleRecording} className={`transition ${s.isRecording ? 'text-red-500 animate-pulse' : 'hover:text-gray-800'}`}><Mic size={18} /></button>
              </div>
              <div className="flex items-center gap-2">
                {s.isSubmittingTask && <Loader2 size={16} className="animate-spin text-gray-400" />}
                <button onClick={(e) => s.handleCreateTask(e)} disabled={!s.newTaskTitle.trim() || s.isSubmittingTask} className="p-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-full text-gray-600"><ArrowBigRight size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* This part is for the task editing part */}
      {s.editingTask && (
        <aside className="fixed top-0 right-0 h-full w-85 bg-white border-l border-gray-200 flex flex-col p-6 shadow-2xl z-50">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <span className="font-bold text-gray-800 text-lg flex items-center gap-2"><Settings2 size={18}/> Configure Task</span>
            <button onClick={() => s.setEditingTask(null)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="flex flex-col gap-5 flex-1 overflow-y-auto pr-1">
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-gray-400 uppercase">Task Heading</label><input type="text" value={s.editingTask.title} onChange={(e) => s.setEditingTask({...s.editingTask!, title: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-gray-50" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-gray-400 uppercase">Completion Date</label><input type="date" value={s.editingTask.date} onChange={(e) => s.setEditingTask({...s.editingTask!, date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-gray-50" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-gray-400 uppercase">Target Time</label><input type="time" value={s.editingTask.time} onChange={(e) => s.setEditingTask({...s.editingTask!, time: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-gray-50" /></div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase">Alert Buffer</label>
              <select value={s.editingTask.reminderOffset || ""} onChange={(e) => s.setEditingTask({...s.editingTask!, reminderOffset: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-gray-50 text-gray-700">
                <option value="">No Reminder</option>
                <option value="5m">5 Minutes Before</option>
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
    </div>
  );
};

export default Lists;