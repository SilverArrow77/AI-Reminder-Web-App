"use client";
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { inferTaskCategory } from '@/lib/taskCategory';

export type SidebarItem = {
  id: string | number;
  label: string;
  active: boolean;
};

type MemberItem = { id: string; name: string; };
type GroupItem = { id: number; name: string; members: MemberItem[]; active: boolean; isExpanded?: boolean; };

// Inside your type definitions (useListsStates.ts / TaskCard.tsx)
type Task = {
  id: string;
  title: string;
  completed: boolean;
  category?: string;
  currentProgress: number;
  totalProgress: number;
  unit: string;
  date: string;
  time: string;
  reminderOffset?: string;
};

export const useListsState = () => {
  const toast = useToast();
  const [greeting, setGreeting] = useState("Good morning");
  const [currentDate, setCurrentDate] = useState("");

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Layout View Modes & Backend Sync Flags
  const [viewMode, setViewMode] = useState<'personal' | 'group'>('personal');
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupItems, setGroupItems] = useState<GroupItem[]>([
    {
      id: 1001,
      name: "Intern Project Sync",
      active: false,
      isExpanded: true,
      members: [
        { id: "m1", name: "Anshul (You)" },
        { id: "m2", name: "Advitiya" }
      ]
    }
  ]);

  // Consolidated tracking context representing the exact viewport dashboard focus anchor
  const [activeContext, setActiveContext] = useState<{ id: any; name: string; type: string; }>({
    id: '',
    name: 'Loading workspace...',
    type: 'personal'
  });

  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);

  // Expose consistent dynamic strings back to Lists.tsx mapping
  const activeListId = activeContext.id;
  const activeListName = activeContext.name;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Set greeting and client clock metadata on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * 10);
    setGreeting(["Hello", "Hola", "Bonjour", "Hallo", "Ciao", "Olá", "Привет", "你好", "こんにちは", "안녕하세요", "नमस्ते", "مرحبا", "Merhaba", "Γεια σας", "שלום", "Cześć", "Hej", "Hei", "Xin chào", "สวัสดี", "Kamusta", "Jambo", "G'day", "Ahoj", "Selamat"][randomIndex % 25]);

    const today = new Date();
    setCurrentDate(today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
  }, []);

  // Fetch all group channels from server if user switches over to Group View Tab
  useEffect(() => {
    if (viewMode === 'group') {
      const fetchGroups = async () => {
        try {
          setIsLoadingGroups(true);
          const response = await fetch('/api/groups');
          if (!response.ok) throw new Error('Failed to download group index');
          const data = await response.json();
          setGroupItems(data);
        } catch (error) {
          console.error("Error pulling groups payload, using fallbacks:", error);
        } finally {
          setIsLoadingGroups(false);
        }
      };
      fetchGroups();
    }
  }, [viewMode]);

  // Fetch all personal folders for the sidebar when the component mounts
  useEffect(() => {
    const fetchAllLists = async () => {
      try {
        const token = localStorage.getItem('token');

if (!token) {
        setSidebarItems([]);
        setActiveContext({ id: 'error', name: 'Please sign in', type: 'personal' });
        return;
      }

      const response = await fetch('/api/lists', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
          throw new Error('Failed to fetch lists');
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const mappedLists = data.map((list: any, index: number) => ({
            id: list.id,
            // show a "(Shared)" suffix for collaborator lists so users notice
            label: `${list.name}${!list.isOwner && list.isCollaborator ? ' (Shared)' : ''}`,
            active: index === 0,
            isOwner: list.isOwner,
            isCollaborator: list.isCollaborator,
          }));

          setSidebarItems(mappedLists);

          setActiveContext({
            id: data[0].id,
            name: `${data[0].name}${!data[0].isOwner && data[0].isCollaborator ? ' (Shared)' : ''}`,
            type: 'personal'
          });
          // cache for offline/refresh resilience
          try { localStorage.setItem('lists', JSON.stringify(data)); } catch {}
        } else {
          setSidebarItems([]);
          setActiveContext({
            id: 'empty',
            name: 'No Lists Found',
            type: 'personal'
          });
        }
      } catch (error) {
        console.error("Error fetching user lists:", error);

        // try loading from cache on failure
        const cached = localStorage.getItem('lists');
        if (cached) {
          try {
            const data = JSON.parse(cached);
            const mappedLists = data.map((list: any, index: number) => ({
              id: list.id,
              label: list.name,
              active: index === 0
            }));
            setSidebarItems(mappedLists);
            setActiveContext({ id: data[0]?.id ?? 'empty', name: data[0]?.name ?? 'Personal Task Lists', type: 'personal' });
            return;
          } catch {}
        }

        setSidebarItems([]);

        setActiveContext({
          id: 'error',
          name: 'Personal Task Lists',
          type: 'personal'
        });
      }
    };

    fetchAllLists();
  }, []);

  // Monitor the combined target focus context to download new lists automatically
  useEffect(() => {
    if (activeContext.id && activeContext.id !== 'empty' && activeContext.id !== 'error') {
      fetchTasks(activeContext.id, activeContext.type);
    }
  }, [activeContext.id, activeContext.type]);

  const handleToggleComplete = async (taskId: string) => {
  // Find the current task to invert its completion state
  const targetTask = tasks.find(t => t.id === taskId);
  if (!targetTask) return;

  const updatedCompletedState = !targetTask.completed;

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      // Offline or not signed in: update locally and cache
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: updatedCompletedState } : t));
      toast.push({ title: 'Offline', description: 'Task updated locally. Sign in to sync.', type: 'info' });
      return;
    }

    // Send partial update to the backend targeting this specific task
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed: updatedCompletedState })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      toast.push({ title: 'Update failed', description: err?.error || 'Failed to update completion status', type: 'error' });
      throw new Error(err?.error || 'Failed to update completion status');
    }

    // Update frontend state instantly
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: updatedCompletedState } : t));
  } catch (error) {
    console.error("Error updating task status:", error);
    // Fallback optimization for local testing
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: updatedCompletedState } : t));
  }
};
  // API Call: Universal parameterized retrieval router supporting multiple workspace configurations
  const fetchTasks = async (
    targetId: string | number,
    type: string
  ) => {
    try {
      setIsLoadingTasks(true);

      const token = localStorage.getItem('token');

      const response = await fetch(
        `/api/lists/${targetId}?type=${type}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!token) {
        setTasks([]);
        throw new Error('No auth token');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();

      if (typeof window !== 'undefined') {
        await fetch('/api/tasks/reset', { headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
      }

      setTasks(Array.isArray(data) ? data : []);
      // cache fetched tasks for offline resilience
      try { localStorage.setItem(`tasks:${targetId}`, JSON.stringify(Array.isArray(data) ? data : [])); } catch {}
    } catch (error) {
      console.error("Fetch Tasks Error:", error);

      if (type === 'personal') {
        setTasks([]);
      }
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // API Call: Create task entry bound to multipart pipeline rules
  const handleCreateTask = async (e: React.KeyboardEvent<HTMLTextAreaElement> | React.MouseEvent) => {
    if ('key' in e && e.key === 'Enter' && e.shiftKey) return;
    if ('key' in e && e.key === 'Enter') e.preventDefault();
    if (!newTaskTitle.trim() || isSubmittingTask) return;
    if (!activeContext || !activeContext.id || activeContext.id === 'empty' || activeContext.id === 'error') {
      toast.push({ title: 'No list selected', description: 'Please select a list before creating a task.', type: 'error' });
      return;
    }

    try {
      setIsSubmittingTask(true);

      const formData = new FormData();
      formData.append('title', newTaskTitle.trim());
      formData.append('contextId', String(activeContext.id));
      formData.append('contextType', activeContext.type);
      formData.append('category', inferTaskCategory(newTaskTitle.trim()));

      if (selectedFile) formData.append('file', selectedFile);
      if (audioBlob) formData.append('voiceNote', audioBlob, 'voice-note.wav');

      const token = localStorage.getItem('token');

      if (!token) {
        toast.push({ title: 'Not signed in', description: 'You must sign in to create tasks.', type: 'error' });
        return;
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseText = await response.text();
      let task: any = {}
      try {
        task = JSON.parse(responseText);
      } catch {
        task = { error: responseText };
      }

      if (!response.ok) {
        toast.push({
          title: 'Create failed',
          description: task?.error || `Failed to create task (${response.status})`,
          type: 'error',
        });
        return;
      }

      const newTask: Task = {
        id: task.id || Date.now().toString(),
        title: task.title || newTaskTitle.trim(),
        category: task.category || 'productivity',
        currentProgress: 0,
        totalProgress: 1,
        completed: false,
        unit: '',
        date: 'Today',
        time: 'Just now',
      };

      setTasks((prevTasks) => [...prevTasks, newTask]);
      setNewTaskTitle('');
      setSelectedFile(null);
      setAudioBlob(null);
    } catch (error) {
      console.error("Creation Error:", error);
      toast.push({ title: 'Create failed', description: 'Unable to create task. Please try again.', type: 'error' });
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // NEW API Call: Task Deletion handler targeting unique identifier route parameter mapping
  const handleDeleteTask = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server rejected deletion request.');
      }

      setTasks(prev =>
        prev.filter(task => task.id !== taskId)
      );
    } catch (error) {
      console.error("Backend Task Deletion Error:", error);
    }
  };

  const handleAddTaskList = async (listName: string) => {
    if (!listName || !listName.trim()) return;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: listName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setSidebarItems(prev => {
        const resetItems = prev.map(item => ({
          ...item,
          active: false,
        }));

        return [
          ...resetItems,
          {
            id: data.id,
            label: data.name,
            active: true,
          },
        ];
      });

      setActiveContext({
        id: data.id,
        name: data.name,
        type: 'personal',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSwitchList = (id: string | number) => {
    setSidebarItems(prevItems => prevItems.map(item => ({ ...item, active: item.id === id })));
    const selectedName = sidebarItems.find(item => item.id === id)?.label || "Task Workspace";
    setActiveContext({ id, name: selectedName, type: 'personal' });
  };

  // Persist sidebar items to localStorage so lists survive refresh when unauthenticated
  useEffect(() => {
    try { localStorage.setItem('lists', JSON.stringify(sidebarItems.map(i => ({ id: i.id, name: i.label })))); } catch {}
  }, [sidebarItems]);

  // Persist tasks for the currently active list to localStorage
  useEffect(() => {
    if (!activeListId) return;
    try { localStorage.setItem(`tasks:${activeListId}`, JSON.stringify(tasks)); } catch {}
  }, [tasks, activeListId]);

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      setAudioBlob(new Blob(["mock-audio"], { type: 'audio/wav' }));
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
      } catch (err) {
        toast.push({ title: 'Microphone denied', description: 'Microphone access denied.', type: 'error' });
      }
    }
  };

  const handleSaveTaskEdits = async () => {
    if (!editingTask) return;

    try {
      // Fire a PATCH request to the unique identifier endpoint for this specific task
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // If your backend relies on the token we discussed earlier, include this header:
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: editingTask.title.trim(),
          date: editingTask.date,
          time: editingTask.time,
          reminderOffset: editingTask.reminderOffset // Passes string values like "5m", "1h", or ""
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Backend failed to persist task modifications.');
      }

      
      const updatedTaskFromServer = await response.json();

      setTasks(prev => 
        prev.map(t => t.id === editingTask.id ? { ...t, ...updatedTaskFromServer } : t)
      );

      setEditingTask(null);
      toast.push({ title: 'Saved', description: 'Task configuration updated successfully!', type: 'success' });

    } catch (error) {
      console.error("Error updating task settings on backend:", error);
      toast.push({ title: 'Save failed', description: 'Failed to save task to server; using offline fallback.', type: 'error' });

      // Optimistic fallback so your app stays functional while testing on local environments:
      setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
      setEditingTask(null);
    }
  };

  return {
    greeting, currentDate, isAiOpen, setIsAiOpen, isLeftSidebarOpen, setIsLeftSidebarOpen,
    editingTask, setEditingTask, sidebarItems, activeListId, activeListName, tasks,
    newTaskTitle, setNewTaskTitle, isLoadingTasks, isSubmittingTask, fileInputRef,
    imageInputRef, selectedFile, setSelectedFile, isRecording, audioBlob, setAudioBlob,
    handleAddTaskList, handleSwitchList, toggleRecording, handleCreateTask, handleSaveTaskEdits,
    viewMode, setViewMode, groupItems, setGroupItems, setActiveContext, isLoadingGroups,
    handleDeleteTask, handleToggleComplete
  };
};