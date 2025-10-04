import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { z } from "zod";

import RootLayout from "../layout/AppLayout";
import TodoList from "../features/todos/pages/TodoList";
import TodoDetail from "../features/todos/pages/TodoDetails";
import NotFound from "../features/todos/pages/NotFound";
import TestError from "../features/errors/TestError";
import AIChat from "../features/ai/pages/AIChat";
import AuthPage from "../features/auth/pages/AuthPage";
import Collaboration from "../features/collaboration/pages/Collaboration";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { authService } from "../services/authService";
import  { AISettingsPanel } from "../features/settings/components/AISettingsPanel";

// ----------------------
// Zod schemas for search
// ----------------------
const aiChatSearchSchema = z.object({
  tab: z.string().optional(),
  context: z.string().optional(),
});

const todoListSearchSchema = z.object({
  page: z.coerce.number().optional(),
  filter: z.string().optional(),
});

const settingsSearchSchema = z.object({
  tab: z.string().optional(),
});

// ✅ Added auth + collaboration schemas
const authSearchSchema = z.object({
  mode: z.enum(["login", "signup", "forgot-password"]).optional(),
});

const collaborationSearchSchema = z.object({
  room: z.string().optional(),
});

// ----------------------
// Root + routes
// ----------------------
const rootRoute = createRootRoute({
  component: RootLayout,
});

// auth route
const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: AuthPage,
  validateSearch: (search) => authSearchSchema.parse(search),
});

// todo list (home)
const todoListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <ProtectedRoute>
      <TodoList />
    </ProtectedRoute>
  ),
  validateSearch: (search) => todoListSearchSchema.parse(search),
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/auth" });
    }
  },
});

// todo detail
const todoDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/todos/$id",
  component: () => (
    <ProtectedRoute>
      <TodoDetail />
    </ProtectedRoute>
  ),
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/auth" });
    }
  },
});

// AI chat route
export const aiChatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ai-chat",
  component: () => (
    <ProtectedRoute>
      <AIChat />
    </ProtectedRoute>
  ),
  validateSearch: (search) => aiChatSearchSchema.parse(search),
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/auth" });
    }
  },
});

// collaboration route
const collaborationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/collaborate",
  component: () => (
    <ProtectedRoute>
      <Collaboration />
    </ProtectedRoute>
  ),
  validateSearch: (search) => collaborationSearchSchema.parse(search),
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/auth" });
    }
  },
});

// features route
const featuresRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/features",
  component: () => (
    <ProtectedRoute>
      <div className="min-h-screen bg-pink-950 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            Advanced Features
          </h1>
          {/* ...rest of feature tiles... */}
        </div>
      </div>
    </ProtectedRoute>
  ),
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/auth" });
    }
  },
});

// settings route
export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => (
    <ProtectedRoute>
      <AISettingsPanel />
    </ProtectedRoute>
  ),
  validateSearch: (search) => settingsSearchSchema.parse(search),
  beforeLoad: () => {
    if (!authService.isAuthenticated()) {
      throw redirect({ to: "/auth" });
    }
  },
});

// error / not found
const errorTestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/error",
  component: TestError,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: NotFound,
});

// assemble tree
const routeTree = rootRoute.addChildren([
  authRoute,
  todoListRoute,
  todoDetailRoute,
  aiChatRoute,
  collaborationRoute,
  featuresRoute,
  settingsRoute,
  errorTestRoute,
  notFoundRoute,
]);

// router instance
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

// Module augmentation
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default router;
