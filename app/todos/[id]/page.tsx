'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const BASE = 'https://api.oluwasetemi.dev/todos';
const FALLBACK_BASE = 'https://dummyjson.com/todos';

interface Todo {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
}

function TodoDetailContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const todoId = Number(params.id);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  const {
    data: todo,
    isLoading,
    isError,
    error,
  } = useQuery<Todo>({
    queryKey: ['todo', todoId],
    queryFn: async (): Promise<Todo> => {
      try {
        const res = await fetch(`${BASE}/${todoId}`);
        if (!res.ok) throw new Error('Failed to fetch todo');
        return res.json();
      } catch (error) {
        const res = await fetch(`${FALLBACK_BASE}/${todoId}`);
        if (!res.ok) throw new Error('Failed to fetch todo');
        return res.json();
      }
    },
  });

  const updateTodo = useMutation({
    mutationFn: async (updatedTodo: Partial<Todo>): Promise<Todo> => {
      try {
        const res = await fetch(`${BASE}/${todoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTodo),
        });
        if (!res.ok) throw new Error('Failed to update todo');
        return res.json();
      } catch (error) {
        const res = await fetch(`${FALLBACK_BASE}/${todoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTodo),
        });
        if (!res.ok) throw new Error('Failed to update todo');
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo', todoId] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setIsEditing(false);
    },
  });

  const deleteTodo = useMutation({
    mutationFn: async (): Promise<void> => {
      try {
        const res = await fetch(`${BASE}/${todoId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete todo');
      } catch (error) {
        const res = await fetch(`${FALLBACK_BASE}/${todoId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete todo');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      router.push('/');
    },
  });

  const handleEdit = () => {
    if (todo) {
      setEditTitle(todo.todo);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (editTitle.trim()) {
      updateTodo.mutate({ todo: editTitle });
    }
  };

  const handleToggleComplete = () => {
    if (todo) {
      updateTodo.mutate({ completed: !todo.completed });
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this todo?')) {
      deleteTodo.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pink-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading todo...</p>
        </div>
      </div>
    );
  }

  if (isError || !todo) {
    return (
      <div className="min-h-screen bg-pink-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            Error loading todo: {(error as any)?.message || 'Todo not found'}
          </p>
          <Link href="/">
            <Button variant="outline" size="default" className="bg-white text-pink-950">
              Back to Todos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-pink-300 hover:text-white flex items-center gap-2">
            ← Back to Todos
          </Link>
        </div>

        <div className="bg-white text-gray-900 rounded-2xl shadow-xl p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    todo.completed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {todo.completed ? '✅ Completed' : '⏳ Pending'}
                </span>
                <span className="text-sm text-gray-500">ID: {todo.id}</span>
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Todo Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleSave}
                  disabled={updateTodo.isPending}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  {updateTodo.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="text-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{todo.todo}</h1>
            </div>
          )}

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">
                  {todo.completed ? 'Completed' : 'Incomplete'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="font-medium">{todo.userId}</span>
              </div>
              {todo.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {new Date(todo.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {todo.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">
                    {new Date(todo.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleToggleComplete}
                disabled={updateTodo.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {updateTodo.isPending
                  ? 'Updating...'
                  : todo.completed
                  ? 'Mark as Incomplete'
                  : 'Mark as Complete'}
              </Button>
              <Button
                onClick={handleEdit}
                variant="outline"
                className="border-pink-600 text-pink-600 hover:bg-pink-50"
              >
                Edit Todo
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteTodo.isPending}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteTodo.isPending ? 'Deleting...' : 'Delete Todo'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TodoDetailPage() {
  return (
    <ProtectedRoute>
      <TodoDetailContent />
    </ProtectedRoute>
  );
}