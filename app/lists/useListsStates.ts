'use client';
import { useState, useEffect, useRef } from 'react';

export type SidebarItem = {
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
    setGreeting(["Good morning", "Hello", "Welcome back", "Hi there", "Great to see you"][randomIndex % 5]);

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
        const response = await fetch('/api/lists');
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const mappedLists = data.map((list: any, index: number) => ({
            id: list.id,
            label: list.name,
            active: index === 0
          }));
          setSidebarItems(mappedLists);
          
          // Align the dynamic dashboard focus point to match the first folder
          setActiveContext({
            id: data[0].id,
            name: data[0].name,
            type: 'personal'
          });
        } else {
          setSidebarItems([]);
          setActiveContext({ id: 'empty', name: 'No Lists Found', type: 'personal' });
        }
      } catch (error) {
        console.error("Error fetching user lists:", error);
        setSidebarItems([]);
        setActiveContext({ id: 'error', name: 'Personal Task Lists', type: 'personal' });
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

  // API Call: Universal parameterized retrieval router supporting multiple workspace configurations
  const fetchTasks = async (targetId: string | number, type: string) => {
    try {
      setIsLoadingTasks(true);
      console.log(`FETCHING CONTEXT: ID=${targetId}, TYPE=${type}`);
      
      const response = await fetch(`/api/lists/${targetId}?type=${type}`);
      const data = await response.json();
      
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch Tasks Error:", error);
      
      // Smart Fallback Local Simulators for debugging
      if (type === 'personal') {
        setTasks([]);
      } else if (type === 'group') {
        // Injected debug fallback container item so layout isn't blank
        setTasks([{
          id: 5001,
          title: "Sync project deliverables and push design templates to staging branch",
          currentProgress: 0,
          totalProgress: 1,
          unit: "",
          date: "Jun 15, 2026",
          time: "16:00"
        }]);
      } else if (type === 'member') {
        setTasks([{
          id: 6001,
          title: `Review items currently assigned to Team Member #${targetId}`,
          currentProgress: 0.5,
          totalProgress: 1,
          unit: "",
          date: "Today",
          time: "Pending"
        }]);
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

    try {
      setIsSubmittingTask(true);
      
      // Utilizing FormData payload to cleanly transfer strings along with binary file nodes
      const formData = new FormData();
      formData.append('title', newTaskTitle.trim());
      formData.append('contextId', String(activeContext.id));
      formData.append('contextType', activeContext.type);

      if (selectedFile) formData.append('file', selectedFile);
      if (audioBlob) formData.append('voiceNote', audioBlob, 'voice-note.wav');

      const response = await fetch('/api/tasks', {
        method: 'POST',
        body: formData, // Browser manages explicit boundaries automatically
      });

      const task = await response.json();
      if (!response.ok) throw new Error(task.error || 'Failed to create task');

      const newTask: Task = {
        id: task.id || Date.now(),
        title: task.title || newTaskTitle.trim(),
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
      console.error("Creation Error:", error);
      // Local optimistic fallback simulation loop
      const localTask: Task = { id: Date.now(), title: newTaskTitle.trim(), currentProgress: 0, totalProgress: 1, unit: '', date: 'Today', time: 'Just now' };
      setTasks((prevTasks) => [...prevTasks, localTask]);
      setNewTaskTitle('');
      setSelectedFile(null);
      setAudioBlob(null);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // NEW API Call: Task Deletion handler targeting unique identifier route parameter mapping
  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Server rejected deletion request.');
      
      // Safely scrub entry out of frontend layout matrix array instantly
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error("Backend Task Deletion Error:", error);
      // Optimistic local fallback action so your component cleans up while testing without backend routes setup
      setTasks(prev => prev.filter(task => task.id !== taskId));
    }
  };

  const handleAddTaskList = async (listName: string) => {
    if (!listName || !listName.trim()) return;
    
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: listName.trim() })
      });
      const data = await response.json();
      
      const newListId = data.id || Date.now();
      setSidebarItems(prev => {
        const resetItems = prev.map(item => ({ ...item, active: false }));
        return [...resetItems, { id: newListId, label: listName.trim(), active: true }];
      });
      
      setActiveContext({ id: newListId, name: listName.trim(), type: 'personal' });
    } catch (error) {
      console.error("Error recording list creation on server:", error);
      const mockId = Date.now();
      setSidebarItems(prev => {
        const resetItems = prev.map(item => ({ ...item, active: false }));
        return [...resetItems, { id: mockId, label: listName.trim(), active: true }];
      });
      setActiveContext({ id: mockId, name: listName.trim(), type: 'personal' });
    }
  };

  const handleSwitchList = (id: string | number) => {
    setSidebarItems(prevItems => prevItems.map(item => ({ ...item, active: item.id === id })));
    const selectedName = sidebarItems.find(item => item.id === id)?.label || "Task Workspace";
    setActiveContext({ id, name: selectedName, type: 'personal' });
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
    handleAddTaskList, handleSwitchList, toggleRecording, handleCreateTask, handleSaveTaskEdits,
    viewMode, setViewMode, groupItems, setGroupItems, setActiveContext, isLoadingGroups,
    handleDeleteTask // Exposed to parent layout execution chain loop
  };
};