import { useParams, useNavigate } from "@tanstack/react-router";

interface Todo {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
}

export default function TodoDetails() {
  const { todoId } = useParams({ strict: false });
  const navigate = useNavigate();

  // Fetch data using `todoId` (dummy example):
  const todos: Todo[] = JSON.parse(localStorage.getItem("todos") || "[]");
  const todo = todos.find((t: Todo) => t.id.toString() === todoId);

  if (!todo) return <p>Todo not found</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-2">{todo.todo}</h2>
      <p>Status: {todo.completed ? "✅ Completed" : "❌ Incomplete"}</p>
      <p>User ID: {todo.userId}</p>

      <button
        onClick={() => navigate({ to: "/todos" })}
        className="mt-4 text-blue-600 underline"
      >
        ← Back to list
      </button>
    </div>
  );
}