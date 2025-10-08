import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "../../../components/ui/Dialog";
import { useOffline } from "../../../contexts/OfflineContext";
import { useRealtime } from "../../../contexts/RealtimeContext";
import { useAI, useAISuggestions } from "../../../contexts/AIContext";
import { useAuth } from "../../../contexts/AuthContext";

// Enhanced API Configuration
const BASE = "https://api.oluwasetemi.dev/todos";
const FALLBACK_BASE = "https://dummyjson.com/todos";

// Enhanced Type definitions
interface Todo {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
  createdAt?: string;
  updatedAt?: string;
  lastModified?: number;
  syncStatus?: 'synced' | 'pending' | 'conflict';
}

interface NewTodo {
  todo: string;
  completed: boolean;
  userId: number;
}

interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export default function TodoList() {
  // Router search params - only use what's actually available
  const search = useSearch({ from: '/' });
  const [page, setPage] = useState<number>(search.page || 1);
  
  // FIX 1 & 2: Initialize from local state instead of non-existent search params
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>(search.filter || "all");
  const [sortBy, setSortBy] = useState<string>("created_desc");

  // Component state
  const [newTitle, setNewTitle] = useState<string>("");
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [deleteTodoId, setDeleteTodoId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);

  // Context hooks
  const { user } = useAuth();
  const { isOffline, addToSyncQueue } = useOffline();
  const { 
    emitTodoChange, 
    todoUpdates, 
    isConnected: realtimeConnected,
    onlineCount 
  } = useRealtime();
  const { isAIEnabled, analyzeProductivity } = useAI();
  
  // AI Suggestions hook
  const { suggestions: aiSuggestions, isLoading: aiLoading } = useAISuggestions(newTitle);

  const todosPerPage = 10;
  const queryClient = useQueryClient();

  // Listen for real-time updates and refresh todos
  useEffect(() => {
    if (todoUpdates.length > 0) {
      const latestUpdate = todoUpdates[todoUpdates.length - 1];
      
      // Don't process updates from current user
      if (latestUpdate.userId === user?.id?.toString()) {
        return;
      }

      // Invalidate and refetch todos when changes come from other users
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    }
  }, [todoUpdates, queryClient, user]);

  // Enhanced API with fallback and caching
  const {
    data: todosData = [],
    isLoading,
    isError,
    error,
  } = useQuery<Todo[]>({
    queryKey: ["todos", isOffline ? 'offline' : 'online'],
    queryFn: async (): Promise<Todo[]> => {
      const cached = localStorage.getItem("todos");
      if (isOffline && cached) {
        return JSON.parse(cached);
      }

      try {
        const res = await fetch(`${BASE}?limit=150`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const data = await res.json();
        const todos = Array.isArray(data) ? data : data.todos || [];
        localStorage.setItem("todos", JSON.stringify(todos));
        return todos;
      } catch (error) {
        console.log("Primary API failed, trying fallback:", error);
        const res = await fetch(`${FALLBACK_BASE}/?limit=150`);
        const data = await res.json();
        const todos = data.todos.map((todo: any) => ({
          ...todo,
          syncStatus: 'synced' as const
        }));
        localStorage.setItem("todos", JSON.stringify(todos));
        return todos;
      }
    },
    staleTime: isOffline ? Infinity : 1000 * 60 * 5,
    refetchOnWindowFocus: !isOffline,
  });

  // Enhanced mutations with real-time integration
  const createTodo = useMutation({
    mutationFn: async (newTodo: NewTodo): Promise<Todo> => {
      const todoWithMeta = {
        ...newTodo,
        id: Date.now(),
        lastModified: Date.now(),
        syncStatus: isOffline ? 'pending' as const : 'synced' as const,
      };

      if (isOffline) {
        addToSyncQueue({ action: 'create', data: todoWithMeta });
        return todoWithMeta as Todo;
      }

      try {
        const res = await fetch(`${BASE}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTodo),
        });
        if (!res.ok) throw new Error("Failed to add todo");
        return res.json();
      } catch (error) {
        const res = await fetch(`${FALLBACK_BASE}/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTodo),
        });
        if (!res.ok) throw new Error("Failed to add todo");
        return res.json();
      }
    },
    onSuccess: (added: Todo) => {
      queryClient.setQueryData(["todos", isOffline ? 'offline' : 'online'], (old: Todo[] = []) => [added, ...old]);
      setNewTitle("");
      
      // Emit real-time update
      if (realtimeConnected && !isOffline) {
        emitTodoChange('create', added);
      }
      
      const updated = [added, ...todosData];
      localStorage.setItem("todos", JSON.stringify(updated));
    },
  });

  const updateTodo = useMutation({
    mutationFn: async (todo: Todo): Promise<Todo> => {
      const updatedTodo = {
        ...todo,
        lastModified: Date.now(),
        syncStatus: isOffline ? 'pending' as const : 'synced' as const,
      };

      if (isOffline) {
        addToSyncQueue({ action: 'update', data: updatedTodo });
        return updatedTodo;
      }

      try {
        const res = await fetch(`${BASE}/${todo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(todo),
        });
        if (!res.ok) throw new Error("Failed to update todo");
        return res.json();
      } catch (error) {
        const res = await fetch(`${FALLBACK_BASE}/${todo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(todo),
        });
        if (!res.ok) throw new Error("Failed to update todo");
        return res.json();
      }
    },
    onSuccess: (updated: Todo) => {
      queryClient.setQueryData(["todos", isOffline ? 'offline' : 'online'], (old: Todo[] = []) =>
        old.map((t) => (t.id === updated.id ? updated : t))
      );
      setIsEditOpen(false);
      setEditingTodo(null);
      
      // Emit real-time update
      if (realtimeConnected && !isOffline) {
        emitTodoChange('update', updated);
      }
      
      const updatedData = todosData.map(t => t.id === updated.id ? updated : t);
      localStorage.setItem("todos", JSON.stringify(updatedData));
    },
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: number): Promise<number> => {
      if (isOffline) {
        addToSyncQueue({ action: 'delete', data: { id } });
        return id;
      }

      try {
        const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete");
        return id;
      } catch (error) {
        const res = await fetch(`${FALLBACK_BASE}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete");
        return id;
      }
    },
    onSuccess: (id: number) => {
      queryClient.setQueryData(["todos", isOffline ? 'offline' : 'online'], (old: Todo[] = []) =>
        old.filter((t) => t.id !== id)
      );
      setIsDeleteOpen(false);
      setDeleteTodoId(null);
      
      // Emit real-time update
      if (realtimeConnected && !isOffline) {
        emitTodoChange('delete', { id });
      }
      
      const filtered = todosData.filter(t => t.id !== id);
      localStorage.setItem("todos", JSON.stringify(filtered));
    },
  });

  const toggleCompleted = useMutation({
    mutationFn: async (todo: Todo): Promise<Todo> => {
      const updatedTodo = {
        ...todo,
        completed: !todo.completed,
        lastModified: Date.now(),
        syncStatus: isOffline ? 'pending' as const : 'synced' as const,
      };

      if (isOffline) {
        addToSyncQueue({ action: 'update', data: updatedTodo });
        return updatedTodo;
      }

      try {
        const res = await fetch(`${BASE}/${todo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !todo.completed }),
        });
        if (!res.ok) throw new Error("Failed to toggle completion");
        return res.json();
      } catch (error) {
        const res = await fetch(`${FALLBACK_BASE}/${todo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !todo.completed }),
        });
        if (!res.ok) throw new Error("Failed to toggle completion");
        return res.json();
      }
    },
    onSuccess: (updated: Todo) => {
      queryClient.setQueryData(["todos", isOffline ? 'offline' : 'online'], (old: Todo[] = []) =>
        old.map((t) => (t.id === updated.id ? updated : t))
      );
      
      // Emit real-time update
      if (realtimeConnected && !isOffline) {
        emitTodoChange('toggle', updated);
      }
      
      const updatedData = todosData.map(t => t.id === updated.id ? updated : t);
      localStorage.setItem("todos", JSON.stringify(updatedData));
    },
  });

  // Event handlers
  const handleEdit = (todo: Todo): void => {
    setEditingTodo(todo);
    setEditTitle(todo.todo);
    setIsEditOpen(true);
  };

  const handleDelete = (todo: Todo): void => {
    setDeleteTodoId(todo.id);
    setIsDeleteOpen(true);
  };

  const handleAISuggestionClick = (suggestion: string): void => {
    setNewTitle(suggestion);
  };

  // AI Productivity Analysis
  const [productivityAnalysis, setProductivityAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleProductivityAnalysis = async () => {
    if (!isAIEnabled) return;
    
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeProductivity(todosData);
      setProductivityAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing productivity:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Enhanced filtering and sorting
  const filtered = todosData.filter((todo: Todo) => {
    const matchesSearch = todo.todo
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "completed" && todo.completed) ||
      (filterStatus === "incomplete" && !todo.completed) ||
      (filterStatus === "pending" && todo.syncStatus === 'pending');
    return matchesSearch && matchesStatus;
  });

  // Enhanced sorting
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'created_desc':
        return (b.createdAt || b.id) > (a.createdAt || a.id) ? 1 : -1;
      case 'created_asc':
        return (a.createdAt || a.id) > (b.createdAt || b.id) ? 1 : -1;
      case 'title_asc':
        return a.todo.localeCompare(b.todo);
      case 'title_desc':
        return b.todo.localeCompare(a.todo);
      case 'status':
        return a.completed === b.completed ? 0 : a.completed ? 1 : -1;
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sorted.length / todosPerPage);
  const start = (page - 1) * todosPerPage;
  const paginated = sorted.slice(start, start + todosPerPage);

  // Calculate statistics
  const stats: TodoStats = {
    total: todosData.length,
    completed: todosData.filter(t => t.completed).length,
    pending: todosData.filter(t => !t.completed).length,
    completionRate: todosData.length > 0 ? Math.round((todosData.filter(t => t.completed).length / todosData.length) * 100) : 0,
  };

  return (
    <main
      role="main"
      className="relative z-10 p-4 min-h-screen pb-32 bg-pink-950 text-white"
      aria-label="Advanced Todo App Main Area"
    >
      <section className="mb-6 max-w-6xl mx-auto">
        {/* Real-time Status Banner */}
        {realtimeConnected && onlineCount > 1 && (
          <div className="mb-4 bg-green-500/20 backdrop-blur rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-200 text-sm">
                Live collaboration active • {onlineCount} users online
              </span>
            </div>
            <Link
              to="/collaborate"
              className="text-green-300 hover:text-green-200 text-sm underline"
            >
              View collaboration room
            </Link>
          </div>
        )}

        {/* Enhanced Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-pink-200 text-sm">Total Todos</div>
          </div>
          <div className="bg-green-500/20 backdrop-blur rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-green-200 text-sm">Completed</div>
          </div>
          <div className="bg-amber-500/20 backdrop-blur rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-amber-200 text-sm">Pending</div>
          </div>
          <div className="bg-purple-500/20 backdrop-blur rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <div className="text-purple-200 text-sm">Success Rate</div>
          </div>
        </div>

        {/* AI Productivity Analysis Panel */}
        {isAIEnabled && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                AI Productivity Insights
              </h3>
              <Button
                onClick={handleProductivityAnalysis}
                disabled={isAnalyzing || todosData.length === 0}
                variant="outline"
                size="sm"
                className="border-purple-400 text-purple-200 hover:bg-purple-800/30"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
            {productivityAnalysis ? (
              <div className="text-sm text-purple-100 whitespace-pre-line bg-black/20 rounded p-3">
                {productivityAnalysis}
              </div>
            ) : (
              <p className="text-purple-200 text-sm">
                Get AI-powered insights about your productivity patterns and suggestions for improvement.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="mb-6 max-w-6xl mx-auto flex flex-col lg:flex-row justify-between gap-6">
        {/* Enhanced Search & Filter */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl shadow-md w-full max-w-full lg:w-1/2">
          <input
            aria-label="Search Todos"
            placeholder="Search todos..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="flex-1 min-w-0 px-4 py-2 border border-pink-400 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 w-full sm:w-auto"
          />
          <select
            aria-label="Filter by status"
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-pink-400 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 w-full sm:w-auto"
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="incomplete">Incomplete</option>
            <option value="pending">Pending Sync</option>
          </select>
          <select
            aria-label="Sort by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-pink-400 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800 w-full sm:w-auto"
          >
            <option value="created_desc">Newest First</option>
            <option value="created_asc">Oldest First</option>
            <option value="title_asc">A-Z</option>
            <option value="title_desc">Z-A</option>
            <option value="status">By Status</option>
          </select>
        </div>

        {/* Enhanced Add Todo with Real AI Integration */}
        <div className="relative w-full max-w-full lg:w-1/2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTitle.trim()) return;
              createTodo.mutate({ todo: newTitle, completed: false, userId: 1 });
            }}
            className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl shadow-md"
          >
            <div className="relative flex-1">
              <input
                type="text"
                aria-label="Todo input"
                placeholder={isAIEnabled ? "Enter a todo... (AI suggestions enabled)" : "Enter a todo..."}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2 border border-pink-400 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-800"
              />
              {isAIEnabled && (
                <div className="absolute right-2 top-2 text-purple-500 flex items-center gap-1">
                  {aiLoading && <div className="animate-spin w-3 h-3 border border-purple-400 border-t-transparent rounded-full"></div>}
                  <span className="text-sm">🤖</span>
                </div>
              )}
            </div>
            <Button
              type="submit"
              variant="default"
              size="default"
              disabled={createTodo.isPending}
              className="bg-pink-800 text-white px-4 py-2 rounded-md hover:bg-pink-900 focus:outline-none focus:ring-2 focus:ring-pink-500 w-full sm:w-auto"
            >
              {createTodo.isPending ? "Adding..." : "Add Todo"}
            </Button>
          </form>

          {/* Enhanced AI Suggestions Dropdown */}
          {aiSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-pink-200 z-50">
              <div className="p-2">
                <div className="text-xs text-purple-600 font-medium mb-2 flex items-center gap-1">
                  <span>🤖</span> AI Suggestions
                  {aiLoading && <div className="animate-spin w-3 h-3 border border-purple-400 border-t-transparent rounded-full ml-1"></div>}
                </div>
                {aiSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleAISuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-pink-50 rounded transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{suggestion}</div>
                    <div className="text-xs text-gray-500 mt-1">AI-generated suggestion</div>
                  </button>
                ))}
                <div className="pt-2 mt-2 border-t border-gray-100">
                  {/* FIX 4: Removed todoId from search params */}
                  <Link
                    to="/ai-chat"
                    search={{ context: 'todo-suggestions' }}
                    className="block w-full text-center px-3 py-2 text-xs text-purple-600 hover:bg-purple-50 rounded transition-colors"
                  >
                    Need more help? Chat with AI →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Todo List */}
      <section aria-live="polite" className="overflow-x-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading your todos...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">Error loading todos: {error?.message}</p>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["todos"] })}
              variant="outline"
              size="default"
              className="bg-white text-pink-950"
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            <ul className="space-y-3 max-w-4xl mx-auto px-2">
              {paginated.map((todo: Todo) => (
                <li
                  key={todo.id}
                  className={`bg-pink-100 border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                    todo.syncStatus === 'pending' 
                      ? 'border-amber-400 bg-amber-50' 
                      : todo.syncStatus === 'conflict'
                      ? 'border-red-400 bg-red-50'
                      : 'border-pink-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleCompleted.mutate(todo)}
                        disabled={toggleCompleted.isPending}
                        className="h-4 w-4 accent-pink-800 focus:outline focus:ring shrink-0"
                        aria-label={`Mark ${todo.todo} as ${
                          todo.completed ? "incomplete" : "completed"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        {/* FIX 3: Changed from template literal to proper route */}
                        <Link
                          to="/todos/$id"
                          params={{ id: todo.id.toString() }}
                          className="text-pink-800 underline hover:text-pink-900 focus:outline focus:ring break-words font-medium"
                        >
                          {todo.todo}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            todo.completed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {todo.completed ? "✅ Completed" : "⏳ Pending"}
                          </span>
                          {todo.syncStatus === 'pending' && (
                            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                              🔄 Syncing
                            </span>
                          )}
                          {todo.syncStatus === 'conflict' && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                              ⚠️ Conflict
                            </span>
                          )}
                          {!realtimeConnected && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              📱 Offline
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap justify-end">
                      {isAIEnabled && (
                        <Link
                          to="/ai-chat"
                          search={{ context: 'todo' }}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                          title="AI Chat about this todo"
                        >
                          🤖
                        </Link>
                      )}
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleEdit(todo)}
                        disabled={updateTodo.isPending}
                        className="text-pink-800 border border-pink-700 hover:bg-pink-200"
                      >
                        ✏️
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(todo)}
                        disabled={deleteTodo.isPending}
                        className="bg-pink-800 text-white hover:bg-pink-900"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <nav
                aria-label="Pagination"
                className="relative z-20 flex justify-center items-center gap-2 mt-8 flex-wrap px-2"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white text-pink-950 border border-pink-500 hover:bg-pink-100"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Prev
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        aria-current={page === pageNum ? "page" : undefined}
                        size="sm"
                        variant={page === pageNum ? "default" : "outline"}
                        className={`min-w-[40px] ${
                          page === pageNum
                            ? "bg-pink-800 text-white"
                            : "bg-white text-pink-950 border border-pink-500 hover:bg-pink-100"
                        }`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white text-pink-950 border border-pink-500 hover:bg-pink-100"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next →
                </Button>
              </nav>
            )}
          </>
        )}
      </section>

      {/* Enhanced Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="z-50 bg-white rounded-lg p-6 shadow-lg max-h-[90vh] overflow-y-auto max-w-[95vw] sm:max-w-md">
          <DialogTitle className="text-lg font-semibold mb-4">
            Edit Todo
          </DialogTitle>
          <form
            className="space-y-4 mt-4 w-full max-w-full"
            onSubmit={(e) => {
              e.preventDefault();
              if (editingTodo) {
                updateTodo.mutate({ ...editingTodo, todo: editTitle });
              }
            }}
          >
            <input
              className="border border-pink-500 rounded px-3 py-2 w-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />

            <div className="flex flex-col sm:flex-row justify-end gap-2 w-full">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  size="default"
                  className="text-pink-950 w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant="default"
                size="default"
                disabled={updateTodo.isPending}
                className="bg-pink-600 text-white hover:bg-pink-700 w-full sm:w-auto"
              >
                {updateTodo.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enhanced Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="z-50 bg-white rounded-lg p-6 shadow-lg max-h-[90vh] overflow-y-auto w-full max-w-[95vw] sm:max-w-md">
          <DialogTitle className="text-lg font-semibold">
            Delete Todo?
          </DialogTitle>
          <p className="text-gray-700 my-3">
            Are you sure you want to delete this todo? This action cannot be undone.
            {isOffline && (
              <span className="block mt-2 text-amber-600 text-sm">
                You're offline. This will be deleted when you reconnect.
              </span>
            )}
          </p>
          <div className="flex justify-end gap-2 mt-4 flex-wrap">
            <DialogClose asChild>
              <Button
                variant="outline"
                size="default"
                className="text-pink-950 w-full sm:w-auto"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (deleteTodoId) {
                  deleteTodo.mutate(deleteTodoId);
                }
              }}
              variant="default"
              size="default"
              disabled={deleteTodo.isPending}
              className="bg-pink-800 text-white hover:bg-pink-900 w-full sm:w-auto"
            >
              {deleteTodo.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}