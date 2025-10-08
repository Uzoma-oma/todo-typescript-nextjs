import { useParams, useNavigate } from "@tanstack/react-router";

// Type definition for Todo
interface Todo {
  id: number;
  todo: string;
  completed: boolean;
  userId: number;
}

export default function TodoDetails() {
  const { todoId } = useParams({ strict: false });
  const navigate = useNavigate();

  const todos: Todo[] = JSON.parse(localStorage.getItem("todos") || "[]");
  const todo = todos.find((t: Todo) => t.id.toString() === todoId);

  if (!todo) return <p className="text-center text-red-500">Todo not found</p>;

  return (
    <div className="w-full max-w-xl mx-auto mt-10 px-4 py-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-2 break-words">{todo.todo}</h2>
      <p className="text-gray-700 mb-1">
        <strong>Status:</strong> {todo.completed ? "✅ Completed" : "❌ Incomplete"}
      </p>
      <p className="text-gray-700">
        <strong>User ID:</strong> {todo.userId}
      </p>

      <button
        onClick={() => navigate({ to: "/todos" })}
        className="mt-4 inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
      >
        ← Back to list
      </button>
    </div>
  );
}