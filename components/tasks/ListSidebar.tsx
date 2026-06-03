'use client';
import React from 'react';
import { Menu, Plus, Search, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import the client-side router

type SidebarItem = {
  id: number;
  label: string;
  active: boolean;
};

type SidebarProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sidebarItems: SidebarItem[];
  onSwitchList: (id: number) => void;
  onAddList: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  sidebarItems,
  onSwitchList,
  onAddList
}) => {
  const router = useRouter(); // Initialize the router instance

  const handleLogout = async () => {
    // Optional: If your backend has a logout endpoint to clear cookies/sessions,
    // your backend person can uncomment the line below:
    // await fetch('/api/auth/logout', { method: 'POST' });

    // Route the user directly back to the login page
    router.push('/login'); 
  };

  return (
    <aside className={`bg-[#F3F3F4] border-r border-gray-200 flex flex-col justify-between p-4 rounded-r-3xl transition-all duration-300 ease-in-out shrink-0 z-30 ${
      isOpen ? 'w-64 opacity-100' : 'w-0 p-0 opacity-0 border-none overflow-hidden'
    }`}>
      <div className={isOpen ? "block" : "hidden"}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2 font-semibold text-gray-700">
            <button onClick={() => setIsOpen(false)} className="hover:bg-gray-200 p-1 rounded-lg transition">
              <Menu size={18} />
            </button>
            <span>Promptly</span>
          </div>
          <button onClick={onAddList} className="p-1 hover:bg-gray-200 rounded-full transition" title="Add New Task List">
            <Plus size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input type="text" placeholder="Search" className="w-full bg-white pl-9 pr-4 py-1.5 rounded-lg text-sm border border-gray-200 focus:outline-none" />
        </div>

        {/* Task Lists Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 px-2 mb-2 uppercase tracking-wider">Your Task Lists</h3>
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSwitchList(item.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  item.active ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* REPLACED: User Profile Footer changed to a styled Logout Button */}
      <div className={`pt-4 border-t border-gray-200 px-2 ${isOpen ? "block" : "hidden"}`}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl transition-all shadow-sm"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;