// src/features/todos/pages/TodoDetail.jsx
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "@tanstack/react-router";
import { Button } from "../../../components/ui/button";

const BASE = "https://dummyjson.com/todos";

export default function TodoDetail() {
  const { id } = useParams({ strict: false });

  const {
    data: todo,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["todo", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch todo");
      return res.json();
    },
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError || !todo)
    return <p className="text-red-500">Error loading todo.</p>;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 border rounded shadow bg-white">
      <h1 className="text-2xl font-bold mb-4 text-pink-900">Todo Detail</h1>

      <div className="space-y-2 text-pink-950 break-words">
        <p>
          <strong>ID:</strong> {todo.id}
        </p>
        <p>
          <strong>Title:</strong> {todo.todo}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          {todo.completed ? "✅ Completed" : "❌ Incomplete"}
        </p>
        <p>
          <strong>User ID:</strong> {todo.userId}
        </p>
      </div>

      <div className="mt-6">
        <Link to="/">
          <Button
            variant="default"
            size="default"
            className="w-full sm:w-auto bg-pink-700 text-white hover:bg-pink-800"
          >
            ⬅ Back to List
          </Button>
        </Link>
      </div>
    </div>
  );
}
