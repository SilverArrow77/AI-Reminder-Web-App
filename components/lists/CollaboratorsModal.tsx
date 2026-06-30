'use client';

import { useState, useEffect } from 'react';
import { Users, X } from 'lucide-react';

interface Friend {
  id: string;
  email: string;
  username?: string;
}

interface Collaborator {
  id: string;
  email: string;
  username?: string;
}

interface CollaboratorsModalProps {
  listId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CollaboratorsModal({
  listId,
  isOpen,
  onClose,
}: CollaboratorsModalProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setSuccess('');
      setSelectedFriendId('');
      setEmail('');
      return;
    }

    const fetchData = async () => {
      if (!token) return;

      try {
        const [friendsRes, collaboratorsRes] = await Promise.all([
          fetch('/api/friends', { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/lists/${listId}/permissions`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (friendsRes.ok) {
          setFriends(await friendsRes.json());
        }

        if (collaboratorsRes.ok) {
          const data = await collaboratorsRes.json();
          const collaboratorUsers = data
            .filter((item: any) => item.friend?.id)
            .map((item: any) => item.friend);
          setCollaborators(collaboratorUsers);
        }
      } catch (err) {
        console.error('Error loading collaborators modal data:', err);
      }
    };

    fetchData();
  }, [isOpen, listId, token]);

  if (!isOpen) return null;

  async function handleAddCollaborator(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Authentication required');
      return;
    }

    if (!selectedFriendId && !email.trim()) {
      setError('Choose a friend or enter their email.');
      return;
    }

    const payload: Record<string, string> = {};
    if (selectedFriendId) {
      payload.friendId = selectedFriendId;
    } else {
      payload.friendEmail = email.trim();
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/lists/${listId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to add collaborator');
        return;
      }

      const added = await res.json();
      const friend = added.friend || { id: added.friendId, email: added.email, username: added.username };
      setCollaborators((current) => [...current.filter((c) => c.id !== friend.id), friend]);
      setSelectedFriendId('');
      setEmail('');
      setSuccess('Collaborator added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error adding collaborator');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveCollaborator(collaboratorId: string) {
    if (!token) return;
    try {
      const res = await fetch(`/api/lists/${listId}/permissions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId: collaboratorId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to remove collaborator');
        return;
      }

      setCollaborators((current) => current.filter((c) => c.id !== collaboratorId));
      setSuccess('Collaborator removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error removing collaborator');
      console.error(err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-[#8A4B12]">
            <Users className="h-5 w-5 text-[#F28C38]" />
            Collaborators
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add a collaborator</label>
            <select
              value={selectedFriendId}
              onChange={(e) => setSelectedFriendId(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 bg-[#FFF8F0] px-4 py-3 text-sm text-gray-700 outline-none"
            >
              <option value="">Choose a friend...</option>
              {friends.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.username ? `${friend.username} (${friend.email})` : friend.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Or enter friend email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@gmail.com"
              className="w-full rounded-2xl border border-gray-300 bg-[#FFF8F0] px-4 py-3 text-sm text-gray-700 outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleAddCollaborator}
          disabled={loading}
          className="mt-4 inline-flex items-center justify-center rounded-2xl bg-[#F28C38] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e07b27] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Adding...' : 'Add Collaborator'}
        </button>

        {(error || success) && (
          <p className={`mt-3 text-sm ${error ? 'text-red-600' : 'text-emerald-600'}`}>
            {error || success}
          </p>
        )}

        <div className="mt-6 rounded-3xl border border-[#F2D9B3] bg-[#FFF8F0] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#8A4B12]">Current collaborators</p>
            <span className="text-xs text-gray-500">Only friends can be added here.</span>
          </div>
          {collaborators.length === 0 ? (
            <p className="text-sm text-gray-600">No collaborators added yet.</p>
          ) : (
            <div className="space-y-3">
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{collaborator.username || collaborator.email}</p>
                    <p className="text-xs text-gray-500">{collaborator.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveCollaborator(collaborator.id)}
                    className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
