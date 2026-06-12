'use client';
import React, { useState } from 'react';
import { Star, Settings2, Trash2, Loader2 } from 'lucide-react';

type Task = {
  id: number;
  title: string;
  currentProgress: number;
  totalProgress: number;
  unit: string;
  date: string;
  time: string;
  reminderOffset?: string;
};

type TaskCardProps = {
  task: Task;
  onEditTrigger: (task: Task) => void;
  onDeleteTrigger: (taskId: number) => Promise<void>; // Added prop to handle backend deletion
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onEditTrigger, onDeleteTrigger }) => {
  const percentage = task.totalProgress > 0 ? (task.currentProgress / task.totalProgress) * 100 : 0;
  const [isDeleting, setIsLoadingDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        setIsLoadingDeleting(true);
        await onDeleteTrigger(task.id);
      } catch (error) {
        console.error("Delete failed in card component context:", error);
      } finally {
        setIsLoadingDeleting(false);
      }
    }
  };

  return (
    <div className={`bg-white border border-gray-300 rounded-2xl p-4 text-left shadow-sm transition-opacity ${
      isDeleting ? 'opacity-50 pointer-events-none' : ''
    }`}>
      <div className="flex justify-between items-start mb-2">
        <span className="font-medium text-gray-800 text-sm">{task.title}</span>
        
        <div className="flex items-center gap-1">
          {/* Settings/Edit Gear Button */}
          <button 
            onClick={() => onEditTrigger(task)}
            className="text-gray-500 hover:text-gray-900 p-1 hover:bg-gray-100 rounded-lg transition"
            title="Edit Task Settings"
            disabled={isDeleting}
          >
            <Settings2 size={16} />
          </button>

          {/* NEW: Delete Trash Button with loading spinner fallback */}
          <button 
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition"
            title="Delete Task"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 size={16} className="animate-spin text-red-500" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
        <div className="flex items-center gap-1">
          <Star size={14} className="text-gray-700" />
          <span>Progress</span>
        </div>
        <span>{task.currentProgress} {task.unit} / {task.totalProgress} {task.unit}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-0.75 rounded-full mb-4 relative">
        <div className="bg-blue-500 h-0.75 rounded-full relative" style={{ width: `${percentage}%` }}>
          <div className="absolute right-0 top-[-2.5px] w-2 h-2 bg-blue-600 rounded-full shadow" />
        </div>
      </div>

      {/* Metadata Badges */}
      <div className="flex gap-2 text-[11px] font-medium text-gray-700">
        <span className="bg-[#EAEAEA] px-2.5 py-1 rounded-md">{task.date || 'No Date'}</span>
        <span className="bg-[#EAEAEA] px-2.5 py-1 rounded-md">{task.time || 'No Time'}</span>
        {task.reminderOffset && (
          <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md">
            Alert: {task.reminderOffset} before
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;