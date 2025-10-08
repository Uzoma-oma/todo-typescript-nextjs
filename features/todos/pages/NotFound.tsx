import { Link } from "@tanstack/react-router";
import { Button } from "../../../components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 text-center">
      <h1 className="text-5xl sm:text-6xl font-bold text-red-600 mb-4">404</h1>
      <h2 className="text-xl sm:text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button variant="default" size="default" className="text-sm sm:text-base">
          Go back home
        </Button>
      </Link>
    </div>
  );
}