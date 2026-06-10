'use client';
import { useState, useEffect, useRef } from 'react';

type SidebarItem = {
  id: string | number;
  label: string;
  active: boolean;
};

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

export const useListsState = () => {
  const [greeting, setGreeting] = useState("Good morning");
  const [currentDate, setCurrentDate] = useState("");

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // View Mode: 'personal' | 'group'
  const [viewMode, setViewMode] = useState<'personal' | 'group'>('personal');

  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([
    { id: 'daily-list', label: 'Daily Task Lists', active: true },
    { id: 2, label: 'Simple Design System', active: false },
    { id: 3, label: 'Figma variable planning', active: false },
    { id: 4, label: 'OKCLH token algorithm', active: false },
    { id: 5, label: 'Component naming advice', active: false },
  ]);

  const activeListId = sidebarItems.find(item => item.active)?.id || 'daily-list';
  const activeListName = sidebarItems.find(item => item.active)?.label || "Task Lists";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Fetch groups dynamically when viewMode switches to group
  useEffect(() => {
    if (viewMode === 'group') {
      fetchGroups();
    }
  }, [viewMode]);

  // Sync tasks automatically when active context parameters shift
  useEffect(() => {
    fetchTasks(activeContext.id, activeContext.type);
  }, [activeContext.id, activeContext.type]);

  useEffect(() => {
    const today = new Date();
    setCurrentDate(today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
  }, []);

  useEffect(() => {
    fetchTasksForList(activeListId);
  }, [activeListId]);

  const fetchTasksForList = async (listId: string | number) => {
    try {
      console.log('FETCHING LIST:', listId);

      setIsLoadingTasks(true);

      const response = await fetch(`/api/lists/${listId}`);

      const data = await response.json();

      console.log('DATA:', data);

      setTasks(data);
    } catch (error) {
      console.error(error);
      if (type === 'personal') {
        setTasks([
          { id: 101, title: 'Drink 2 Litres water', currentProgress: 0.6, totalProgress: 2, unit: 'L', date: '2026-06-08', time: '17:00' },
          { id: 102, title: 'Iron clothes', currentProgress: 1, totalProgress: 5, unit: '', date: '2026-06-08', time: '21:00' }
        ]);
      } else if (type === 'group') {
        setTasks([{ id: 501, title: 'Sync production Figma variables with Tailwind configurations', currentProgress: 0, totalProgress: 1, unit: '', date: '2026-06-10', time: '14:00' }]);
      } else if (type === 'member') {
        setTasks([{ id: 601, title: `Reviewing task items delegated to Member #${targetId}`, currentProgress: 1, totalProgress: 1, unit: '', date: '2026-06-09', time: '11:00' }]);
      }
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleCreateTask = async (e: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent) => {
    if (!newTaskTitle.trim() || isSubmittingTask) return;
    const localFallbackTask: Task = { id: Date.now(), title: newTaskTitle.trim(), currentProgress: 0, totalProgress: 1, unit: '', date: 'Today', time: 'Just now' };
    setTasks((prevTasks) => [...prevTasks, localFallbackTask]);
    setNewTaskTitle(""); setSelectedFile(null); setAudioBlob(null);
  };

  const handleAddTaskList = async (listName: string) => {
    const mockId = Date.now();
    setSidebarItems(prev => {
      const resetItems = prev.map(item => ({ ...item, active: false }));
      return [...resetItems, { id: mockId, label: listName.trim(), active: true }];
    });
    setActiveContext({ id: mockId, name: listName.trim(), type: 'personal' });
  };

  const handleSwitchList = (id: string | number) => {
    setSidebarItems(prevItems => prevItems.map(item => ({ ...item, active: item.id === id })));
    const targetName = sidebarItems.find(item => item.id === id)?.label || "Personal List";
    setActiveContext({ id, name: targetName, type: 'personal' });
  };

  const handleSaveTaskEdits = () => {
    if (!editingTask) return;
    setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
    setEditingTask(null);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      setAudioBlob(new Blob(["mock-audio"], { type: 'audio/wav' }));
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
      } catch (err) {
        alert("Microphone access denied.");
      }
    }
  };

  const handleCreateTask = async (
  e: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent
) => {
  if ('key' in e && e.key === 'Enter' && e.shiftKey) return;
  if ('key' in e && e.key === 'Enter') e.preventDefault();
  if (!newTaskTitle.trim() || isSubmittingTask) return;

  try {
    setIsSubmittingTask(true);

    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: newTaskTitle.trim(),
        listId: activeListId,
      }),
    });

    const task = await response.json();

    if (!response.ok) {
      throw new Error(task.error || 'Failed to create task');
    }

    const newTask: Task = {
      id: Date.now(),
      title: task.title,
      currentProgress: 0,
      totalProgress: 1,
      unit: '',
      date: 'Today',
      time: 'Just now',
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);

    setNewTaskTitle('');
    setSelectedFile(null);
    setAudioBlob(null);
  } catch (error) {
    console.error(error);
    alert('Failed to create task');
  } finally {
    setIsSubmittingTask(false);
  }
};

  const handleSaveTaskEdits = () => {
    if (!editingTask) return;
    setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
    setEditingTask(null);
  };

  return {
    greeting, currentDate, isAiOpen, setIsAiOpen, isLeftSidebarOpen, setIsLeftSidebarOpen,
    editingTask, setEditingTask, sidebarItems, tasks, viewMode, setViewMode, groupItems, setGroupItems,
    activeListId: activeContext.id, activeListName: activeContext.name, isLoadingTasks, isSubmittingTask, 
    fileInputRef, imageInputRef, selectedFile, setSelectedFile, isRecording, audioBlob, setAudioBlob,
    handleAddTaskList, handleSwitchList, handleCreateTask, setActiveContext, isLoadingGroups, handleSaveTaskEdits,setNewTaskTitle,newTaskTitle,toggleRecording
  };
};