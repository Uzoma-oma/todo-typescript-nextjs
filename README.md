# 📝 nextjs Todo App

A feature-rich Todo application built with  **nextjs**  **React 19**, **TanStack Router v7**, **React Query (TanStack Query)**, **Tailwind CSS**, and **ShadCN UI**. This app consumes the [DummyJSON Todo API](https://dummyjson.com/) to demonstrate full CRUD functionality, pagination, filtering, accessibility, and offline caching.

---

## 🚀 Features

- ✅ View paginated todo list (10 per page)
- ➕ Add new todos via modal form
- ✏️ Edit existing todos with in-place modal
- ❌ Delete todos with confirmation dialog
- 🔍 Search todos by title
- 🎯 Filter by completion status (All, Completed, Incomplete)
- 📦 Caching with `localStorage` for performance
- 📡 Offline capability ready via `localforage` or `Dexie.js`
- ♿️ Accessibility: semantic HTML, ARIA, keyboard navigation
- 📱 Fully responsive on mobile and desktop
- 🚨 Error boundary and custom 404 page

---

## 📦 Installation & Setup

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/react-todo-app.git
cd react-todo-app

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# Available Scripts
| Script            | Description                   |
| ----------------- | ----------------------------- |
| `npm run dev`     | Starts Vite dev server        |
| `npm run build`   | Builds app for production     |
| `npm run preview` | Previews the production build |
| `npm run lint`    | Runs ESLint on code           |
| `npm run format`  | Formats code using Prettier   |

#Folder Structure
src/
├── components/         # Reusable UI components
├── features/
│   └── todos/          # Todo feature (pages, hooks, logic)
├── layout/             # App layout wrapper
├── routes/             # Route definitions via TanStack Router
└── main.jsx            # Entry point

# Api Reference
| Method | Endpoint      | Description     |
| ------ | ------------- | --------------- |
| GET    | `/todos`      | Fetch all todos |
| GET    | `/todos/{id}` | Get single todo |
| POST   | `/todos/add`  | Add new todo    |
| PUT    | `/todos/{id}` | Update todo     |
| DELETE | `/todos/{id}` | Delete todo     |

# Known Issues
DummyJSON API may occasionally return stale data
No authentication/authorization (public access)
Caching may cause outdated data if not refreshed manually

# Future Improvement
✅ Implement service worker for full offline support
🔐 Add user authentication (e.g. Supabase/Firebase)
🔄 Add optimistic UI updates for better UX
📈 Analytics + usage tracking
🎨 Add light/dark theme toggle

# Contributing
Feel free to fork the repo and submit pull requests. Issues are welcome too!

# Build & 🚀 Deployment Instructions
🧑‍💻 Local Development
Clone the repository:

git clone https://github.com/YourUsername/Todo-App.git
cd Todo-App

# Install dependencies:

npm install
Run the development server:
npm run dev
The app will be available at http://localhost:3000 by default.

#📦 Build for Production
To generate a production-ready build:

npm run build

#🌐 Deploying to Vercel
Push your code to GitHub.

Go to Vercel and sign in with GitHub.

Create a New Project and import your Todo-App repository.

Set the following Vercel settings (if not detected automatically):

Framework: Vite

Build Command: npm run build

Output Directory: dist

Click "Deploy".

Vercel will handle the rest — build, deploy, and host your app.

