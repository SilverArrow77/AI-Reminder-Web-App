'use client';
import { useState, useEffect, useRef } from 'react';

type SidebarItem = { id: number; label: string; active: boolean; };
type Task = { id: number; title: string; currentProgress: number; totalProgress: number; unit: string; date: string; time: string; reminderOffset?: string; };

export const useListsState = () => {
  const [greeting, setGreeting] = useState("Good morning");
  const [currentDate, setCurrentDate] = useState("");
  
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([
    { id: 1, label: 'Daily Task Lists', active: true },
    { id: 2, label: 'Simple Design System', active: false },
    { id: 3, label: 'Figma variable planning', active: false },
    { id: 4, label: 'OKCLH token algorithm', active: false },
    { id: 5, label: 'Component naming advice', active: false },
  ]);

  const activeListId = sidebarItems.find(item => item.active)?.id || 1;
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

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * 10); // Randomised Greeting
    setGreeting(["Good morning", "Hello", "Welcome back", "Hi there", "Great to see you"][randomIndex % 5]);

    const today = new Date();
    setCurrentDate(today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
  }, []);

  useEffect(() => {
    fetchTasksForList(activeListId);
  }, [activeListId]);

  const fetchTasksForList = async (listId: number) => {
    try {
      setIsLoadingTasks(true);
      const response = await fetch(`/api/lists/${listId}`);
      if (!response.ok) throw new Error('Failed to fetch tasks.');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
      // Fallback
      setTasks(listId === 1 ? [
        { id: 101, title: 'Drink 2 Litres water', currentProgress: 0.6, totalProgress: 2, unit: 'L', date: '2026-06-03', time: '17:00', reminderOffset: '15m' },
        { id: 102, title: 'Iron clothes', currentProgress: 1, totalProgress: 5, unit: '', date: '2026-06-03', time: '21:00' }
      ] : []);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleAddTaskList = async () => {
    const listName = prompt("Enter the name for your new task list:");
    if (!listName || !listName.trim()) return;
    const mockId = Date.now();
    setSidebarItems(prev => {
      const resetItems = prev.map(item => ({ ...item, active: false }));
      return [...resetItems, { id: mockId, label: listName.trim(), active: true }];
    });
  };

  const handleSwitchList = (id: number) => {
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

    // Local execution / API multipart transmission structure simulation
    const localFallbackTask: Task = { id: Date.now(), title: newTaskTitle.trim(), currentProgress: 0, totalProgress: 1, unit: '', date: 'Today', time: 'Just now' };
    setTasks((prevTasks) => [...prevTasks, localFallbackTask]);
    setNewTaskTitle(""); setSelectedFile(null); setAudioBlob(null);
  };

  const handleSaveTaskEdits = () => {
    if (!editingTask) return;
    setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
    setEditingTask(null);
  };

  return {
    greeting, currentDate, isAiOpen, setIsAiOpen, isLeftSidebarOpen, setIsLeftSidebarOpen,
    editingTask, setEditingTask, sidebarItems, activeListId, activeListName, tasks,
    newTaskTitle, setNewTaskTitle, isLoadingTasks, isSubmittingTask, fileInputRef,
    imageInputRef, selectedFile, setSelectedFile, isRecording, audioBlob, setAudioBlob,
    handleAddTaskList, handleSwitchList, toggleRecording, handleCreateTask, handleSaveTaskEdits
  };
};