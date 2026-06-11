'use client';
import { useState, useEffect, useRef } from 'react';

type SidebarItem = {
  id: string | number;
  label: string;
  active: boolean;
};

type MemberItem = { id: string; name: string; };
type GroupItem = { id: number; name: string; members: MemberItem[]; active: boolean; isExpanded?: boolean; };

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

  // Missing States Needed by Sidebar Component
  const [viewMode, setViewMode] = useState<'personal' | 'group'>('personal');
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupItems, setGroupItems] = useState<GroupItem[]>([
    {
      id: 1001,
      name: "Intern Project Sync",
      active: false,
      isExpanded: false,
      members: [
        { id: "m1", name: "Anshul" },
        { id: "m2", name: "Advitiya" }
      ]
    }
  ]);
  const [activeContext, setActiveContext] = useState<{ id: any; name: string; type: string; }>({
    id: 'daily-list',
    name: 'Daily Task Lists',
    type: 'personal'
  });

  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);

const activeListId = sidebarItems.find(item => item.active)?.id || '';
const activeListName = sidebarItems.find(item => item.active)?.label || "Loading Lists...";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * 10);
    setGreeting(["Good morning", "Hello", "Welcome back", "Hi there", "Great to see you"][randomIndex % 5]);

    const today = new Date();
    setCurrentDate(today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
  }, []);

  useEffect(() => {
  if (activeListId) {
    fetchTasksForList(activeListId);
  }
}, [activeListId]);

// Fetch all available lists for the sidebar when the component mounts
useEffect(() => {
  const fetchAllLists = async () => {
    try {
      const response = await fetch('/api/lists');
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // Map over the database lists and set the first one as active
        const mappedLists = data.map((list: any, index: number) => ({
          id: list.id,
          label: list.name,
          active: index === 0 // Make the first list active by default
        }));
        setSidebarItems(mappedLists);
      } else {
        setSidebarItems([]);
      }
    } catch (error) {
      console.error("Error fetching user lists:", error);
      setSidebarItems([]);
    }
  };

  fetchAllLists();
}, []);

  const fetchTasksForList = async (listId: string | number) => {
    try {
      console.log('FETCHING LIST:', listId);
      setIsLoadingTasks(true);
      const response = await fetch(`/api/lists/${listId}`);
      const data = await response.json();
      console.log('DATA:', data);
      
      // Safety check: ensure array before setting state
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleAddTaskList = async (listName: string) => {
    if (!listName || !listName.trim()) return;
    const mockId = Date.now();
    setSidebarItems(prev => {
      const resetItems = prev.map(item => ({ ...item, active: false }));
      return [...resetItems, { id: mockId, label: listName.trim(), active: true }];
    });
  };

  const handleSwitchList = (id: string | number) => {
    setSidebarItems(prevItems => prevItems.map(item => ({ ...item, active: item.id === id })));
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

  const handleCreateTask = async (e: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent) => {
    if ('key' in e && e.key === 'Enter' && e.shiftKey) return;
    if ('key' in e && e.key === 'Enter') e.preventDefault();
    if (!newTaskTitle.trim() || isSubmittingTask) return;

    try {
      setIsSubmittingTask(true);
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle.trim(), listId: activeListId }),
      });

      const task = await response.json();
      if (!response.ok) throw new Error(task.error || 'Failed to create task');

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

  // Return everything required by Lists.tsx and Sidebar props mapping
  return {
    greeting, currentDate, isAiOpen, setIsAiOpen, isLeftSidebarOpen, setIsLeftSidebarOpen,
    editingTask, setEditingTask, sidebarItems, activeListId, activeListName, tasks,
    newTaskTitle, setNewTaskTitle, isLoadingTasks, isSubmittingTask, fileInputRef,
    imageInputRef, selectedFile, setSelectedFile, isRecording, audioBlob, setAudioBlob,
    handleAddTaskList, handleSwitchList, toggleRecording, handleCreateTask, handleSaveTaskEdits,
    viewMode, setViewMode, groupItems, setGroupItems, setActiveContext, isLoadingGroups
  };
};