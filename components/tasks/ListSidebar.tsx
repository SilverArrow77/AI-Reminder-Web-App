'use client';
import React, { useState } from 'react';
import { Menu, Plus, Search, LogOut, X, FolderPlus, User, Users, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SidebarItem } from '@/app/lists/useListsStates';

type MemberItem = { id: string; name: string; };
type GroupItem = { id: number; name: string; members: MemberItem[]; active: boolean; isExpanded?: boolean; };

type SidebarProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sidebarItems: SidebarItem[];
  onSwitchList: (id: number | string) => void;
  onAddList: (listName: string) => void;
  // Expose additional explicit context parameters to handle non-personal objects
  viewMode: 'personal' | 'group';
  setViewMode: (mode: 'personal' | 'group') => void;
  groupItems: GroupItem[];
  setGroupItems: React.Dispatch<React.SetStateAction<GroupItem[]>>;
  setActiveContext: (ctx: { id: any; name: string; type: string; }) => void;
  isLoadingGroups: boolean;
};

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  sidebarItems,
  onSwitchList,
  onAddList,
  viewMode,
  setViewMode,
  groupItems,
  setGroupItems,
  setActiveContext,
  isLoadingGroups
}) => {
  const router = useRouter();
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');

  const handleListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    onAddList(newListName.trim());
    setNewListName('');
    setIsListModalOpen(false);
  };

  const toggleGroupExpand = (groupId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop parent click event selection chain from breaking open
    setGroupItems(prev => prev.map(group => 
      group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group
    ));
  };

  // Switch to the targeted group row index
  const handleSelectGroup = (group: GroupItem) => {
    setGroupItems(prev => prev.map(g => ({ ...g, active: g.id === group.id })));
    // Switch task viewer context over to group container parameters
    setActiveContext({ id: group.id, name: `${group.name} (Shared Desk)`, type: 'group' });
  };

  // Switch  individual members inside an accordion branch
  const handleSelectMember = (member: MemberItem, groupName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Restrict container bubble interactions
    setActiveContext({ id: member.id, name: `${member.name}'s Tasks — ${groupName}`, type: 'member' });
  };

  return (
    <>
      <aside className={`bg-[#F3F3F4] border-r border-gray-200 flex flex-col justify-between p-4 rounded-r-3xl transition-all duration-300 ease-in-out shrink-0 z-30 ${
        isOpen ? 'w-64 opacity-100' : 'w-0 p-0 opacity-0 border-none overflow-hidden'
      }`}>
        <div className={isOpen ? "block" : "hidden"}>
          
          <div className="flex items-center justify-between mb-5 px-2">
            <div className="flex items-center gap-2 font-semibold text-gray-700">
              <button onClick={() => setIsOpen(false)} className="hover:bg-gray-200 p-1 rounded-lg transition"><Menu size={18} /></button>
              <span>Promptly</span>
            </div>
            {viewMode === 'personal' && (
              <button onClick={() => setIsListModalOpen(true)} className="p-1 hover:bg-gray-200 rounded-full transition" title="Add New List"><Plus size={18} /></button>
            )}
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input type="text" placeholder="Search" className="w-full bg-white pl-9 pr-4 py-1.5 rounded-lg text-sm border border-gray-200 focus:outline-none" />
          </div>

          {/* VIEW SWITCHER SLIDER CONTROLLER */}
          <div className="bg-gray-200/60 p-1 rounded-xl flex items-center gap-1 mb-5">
            <button onClick={() => setViewMode('personal')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === 'personal' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><User size={13} /> Personal</button>
            <button onClick={() => setViewMode('group')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${viewMode === 'group' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Users size={13} /> Group View</button>
          </div>

          {/* NAVIGATION PORT CONTAINER */}
          {/* NAVIGATION PORT CONTAINER */}
<div>
  <h3 className="text-xs font-semibold text-gray-400 px-2 mb-2 uppercase tracking-wider">
    {viewMode === 'personal' ? 'Your Task Lists' : 'Your Groups'}
  </h3>
  
  <nav className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
    {viewMode === 'personal' ? (
      sidebarItems?.map((item) => (
        <button
          key={item.id}
          onClick={() => onSwitchList(item.id)}
          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${item.active ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'}`}
        >
          {item.label}
        </button>
      )) || <div className="text-xs text-gray-400 px-3 py-2">No personal lists found.</div>
    ) : isLoadingGroups ? (
      <div className="flex items-center gap-2 px-3 py-4 text-xs text-gray-400">
        <Loader2 size={14} className="animate-spin text-orange-500" /> Syncing channels...
      </div>
    ) : (
      groupItems?.map((group) => (
        <div key={group.id} className="flex flex-col rounded-lg mb-1">
          <div 
            onClick={() => handleSelectGroup(group)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-lg transition-colors ${group.active ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'}`}
          >
            <span className="truncate pr-2">{group.name}</span>
            <button onClick={(e) => toggleGroupExpand(group.id, e)} className="p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition">
              {group.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>

          {/* Expandable branch representing members */}
          {group.isExpanded && (
            <div className="ml-4 pl-3 border-l border-gray-200 my-1 space-y-1">
              {group.members?.map((member) => (
                <div 
                  key={member.id} 
                  onClick={(e) => handleSelectMember(member, group.name, e)}
                  className="text-xs text-gray-500 hover:text-gray-900 py-1 px-1.5 rounded cursor-pointer hover:bg-gray-200/40 transition flex items-center gap-1.5 font-medium"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <span className="truncate">{member.name}</span>
                </div>
              )) || <div className="text-[10px] text-gray-400 pl-1 py-1">No group members.</div>}
            </div>
          )}
        </div>
      )) || <div className="text-xs text-gray-400 px-3 py-2">No groups found.</div>
    )}
  </nav>
</div>
        </div>

        <div className={`pt-4 border-t border-gray-200 px-2 ${isOpen ? "block" : "hidden"}`}>
          <button onClick={() => router.push('/')} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-50 rounded-xl transition-all shadow-sm"><LogOut size={16} /> <span>Log out</span></button>
        </div>
      </aside>

      {/* POPUP: NEW LIST MODAL */}
      {isListModalOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative mx-4 text-left">
            <button onClick={() => { setIsListModalOpen(false); setNewListName(''); }} className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            <div className="flex items-center gap-2.5 mb-4 text-gray-800">
              <div className="p-2 bg-orange-50 text-[#F28C38] rounded-xl"><FolderPlus size={20} /></div>
              <div><h3 className="font-bold text-lg text-gray-900">Create Task List</h3><p className="text-xs text-gray-400 mt-0.5">Organize your personal workspace</p></div>
            </div>
            <form onSubmit={handleListSubmit} className="space-y-4">
              <input type="text" autoFocus required placeholder="e.g., Personal Errands" value={newListName} onChange={(e) => setNewListName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none text-gray-800" />
              <div className="flex items-center justify-end gap-2.5">
                <button type="button" onClick={() => { setIsListModalOpen(false); setNewListName(''); }} className="px-4 py-2 border text-gray-600 rounded-xl text-xs font-semibold">Cancel</button>
                <button type="submit" disabled={!newListName.trim()} className="px-4 py-2 bg-[#F28C38] hover:bg-[#e07b27] text-white rounded-xl text-xs font-semibold">Create List</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;