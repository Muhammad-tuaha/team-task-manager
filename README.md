# Taskly — Full Stack Team Task Manager

A production-ready team task ecosystem built with a completely decoupled architecture, strict validation layers, and secure session management.

## 🚀 Live Links
- **Live Deployed Application:** [https://team-task-manager-five-henna.vercel.app/](https://team-task-manager-five-henna.vercel.app/)
- **GitHub Repository:** [https://github.com/Muhammad-tuaha/team-task-manager](https://github.com/Muhammad-tuaha/team-task-manager)

## 🛠️ Architecture & Security Features
- **Frontend Layer:** Built using **React + Vite + Tailwind CSS**. Features modular design blocks, smooth keyframe transitions, and a central state `AuthContext` utilizing Axios interceptors.
- **Backend API Layer:** Powered by **Node.js + Express** with a fully RESTful routing matrix (`/auth`, `/teams`, `/tasks`).
- **Database & Session Layer:** Uses **PostgreSQL** (hosted via Neon serverless). Implements secure user session persistence using `connect-pg-simple` cookie routing instead of ephemeral tokens.
- **Security Protocols:** 
  - Strict input validation via **Joi** schemas to sanitize user payloads before execution.
  - Passwords fully protected using **bcrypt** with 12 structural hashing rounds.
  - Session security hard-coded via `httpOnly: true`, `secure: true`, and `sameSite: 'none'` configs.
- **Bonus Features Implemented:** 
  - **Role-Based Access Control:** Explicitly restricts membership invitation and team deletion modules strictly to the team owner.
  - **Due Date Notification Widget:** A proactive dashboard component that filters, extracts, and reports assigned tasks expiring within 48 hours.

## 💻 Local Setup Instructions

### 1. Repository Setup
```bash
git clone [https://github.com/Muhammad-tuaha/team-task-manager.git](https://github.com/Muhammad-tuaha/team-task-manager.git)
cd team-task-manager
2. Backend Environment Config
Navigate to the backend/ folder, create a .env file, and populate it:

Code snippet
NODE_ENV=development
PORT=5000
DATABASE_URL=postgres://your_user:your_password@localhost:5432/task_manager_db
SESSION_SECRET=your_development_secret_key
FRONTEND_URL=http://localhost:5173
Then start the server:

Bash
cd backend
npm install
npm run dev
3. Frontend App Launch
Navigate to the frontend/ folder and boot up the Vite asset compiler pipeline:

Bash
cd ../frontend
npm install
npm run dev
