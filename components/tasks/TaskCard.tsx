'use client';
import React, { useState } from 'react';
import { Star, Settings2, Trash2, Loader2, CheckCircle2, Circle } from 'lucide-react';

type Task = {
  id: number;
  title: string;
  completed: boolean; // Confirmed structural property flag
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
  onDeleteTrigger: (taskId: number) => Promise<void>;
  onToggleComplete: (taskId: number) => Promise<void>; // NEW: Prop callback to update state/backend
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onEditTrigger, onDeleteTrigger, onToggleComplete }) => {
  const percentage = task.totalProgress > 0 ? (task.currentProgress / task.totalProgress) * 100 : 0;
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        setIsDeleting(true);
        await onDeleteTrigger(task.id);
      } catch (error) {
        console.error("Delete failed:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCheckboxClick = async () => {
    if (isToggling) return;
    try {
      setIsToggling(true);
      await onToggleComplete(task.id);
    } catch (error) {
      console.error("Toggle failed:", error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className={`bg-white border border-gray-300 rounded-2xl p-4 text-left shadow-sm transition-all duration-200 ${
      isDeleting ? 'opacity-50 pointer-events-none' : ''
    } ${task.completed ? 'border-emerald-200 bg-emerald-50/10' : ''}`}>
      
      <div className="flex justify-between items-start mb-2 gap-3">
        {/* NEW: Left-side Alignment layout holding your click Checkbox */}
        <div className="flex items-start gap-3 flex-1">
          <button 
            onClick={handleCheckboxClick}
            disabled={isToggling}
            className={`mt-0.5 shrink-0 transition-colors duration-150 focus:outline-none ${
              task.completed ? 'text-emerald-500 hover:text-emerald-600' : 'text-gray-300 hover:text-gray-400'
            }`}
            title={task.completed ? "Mark as Incomplete" : "Mark as Complete"}
          >
            {isToggling ? (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            ) : task.completed ? (
              <CheckCircle2 size={18} fill="currentColor" className="text-white fill-emerald-500" />
            ) : (
              <Circle size={18} />
            )}
          </button>

          {/* Task Heading Text - Dims and strikes through when checked off */}
          <span className={`font-medium text-sm transition-all duration-150 ${
            task.completed ? 'text-gray-400 line-through' : 'text-gray-800'
          }`}>
            {task.title}
          </span>
        </div>
        
        {/* Action button controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={() => onEditTrigger(task)}
            className="text-gray-500 hover:text-gray-900 p-1 hover:bg-gray-100 rounded-lg transition"
            title="Edit Task Settings"
            disabled={isDeleting}
          >
            <Settings2 size={16} />
          </button>

          <button 
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition"
            title="Delete Task"
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin text-red-500" /> : <Trash2 size={16} />}
          </button>
        </div>
      </div>

      {/* Progress sub-metrics container */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-2 pl-7">
        <div className="flex items-center gap-1">
          <Star size={14} className={task.completed ? "text-emerald-500" : "text-gray-700"} />
          <span>Progress</span>
        </div>
        <span>{task.currentProgress} {task.unit} / {task.totalProgress} {task.unit}</span>
      </div>

      {/* Progress Bar lines shifting to soft green when list elements finish */}
      <div className="w-full bg-gray-100 h-0.75 rounded-full mb-4 relative ml-7 max-w-[calc(100%-28px)]">
        <div 
          className={`h-0.75 rounded-full relative transition-all duration-300 ${
            task.completed ? 'bg-emerald-500' : 'bg-blue-500'
          }`} 
          style={{ width: `${percentage}%` }}
        >
          <div className={`absolute right-0 top-[-2.5px] w-2 h-2 rounded-full shadow ${
            task.completed ? 'bg-emerald-600' : 'bg-blue-600'
          }`} />
        </div>
      </div>

      {/* Metadata Badges */}
      <div className="flex gap-2 text-[11px] font-medium text-gray-700 pl-7">
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