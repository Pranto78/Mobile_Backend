<div align="center">

# 🗂️ Team Report Manager — Backend API

> **Node.js · Express · TypeScript · MongoDB · JWT · Groq AI · SMTP**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)

</div>

---

Backend Live_Link: https://teambackend-two.vercel.app/

---

## 📋 Overview

A robust backend API for managing team reports, tasks, projects, and users — with built-in AI assistance and automated email reporting.

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| AI | Groq API |
| Email | Nodemailer (SMTP) |

---

## ✨ Features

- 🔐 **Email/password authentication** with JWT-protected routes
- 👥 **Role-based access control** — Admin, Leader, Member
- 📁 **Project & Task management** with full lifecycle tracking
- 📊 **Task status flow** — `TODO` → `IN_PROGRESS` → `PAUSE` → `DONE`
- ⏱️ **Time tracking** and carry-over task support
- 📈 **Dashboard stats** and grouped daily reports
- 🤖 **AI task generation** and writing improvement via Groq
- 📧 **Automated email report sending** via SMTP

---

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts
│   │   └── env.ts
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── app.ts
│   └── server.ts
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Environment Setup

Copy `.env.example` and create your `.env` file inside the `backend/` folder:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/team_report_manager
JWT_SECRET=replace_with_a_long_secure_secret
JWT_EXPIRES_IN=7d
NODE_ENV=development

GROQ_API_KEY=your_groq_api_key_optional

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM="Team Report Manager <your_email@gmail.com>"
```

> ⚠️ **Never commit your real `.env` file.**

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Run in Development

```bash
npm run dev
```

Server runs at: **`http://localhost:5000`**

### 4. Health Check

```
GET /
```

```json
{ "message": "Team Report Manager API is running" }
```

---

## 🌐 API Reference

### 🔑 Auth
| Method | Endpoint |
|---|---|
| `POST` | `/api/auth/login` |

### 👤 Users
| Method | Endpoint |
|---|---|
| `GET` | `/api/users` |
| `POST` | `/api/users` |
| `GET` | `/api/users/leaders` |

### 📁 Projects
| Method | Endpoint |
|---|---|
| `GET` | `/api/projects` |
| `POST` | `/api/projects` |

### ✅ Tasks
| Method | Endpoint |
|---|---|
| `GET` | `/api/tasks` |
| `POST` | `/api/tasks` |
| `PATCH` | `/api/tasks/:id/status` |
| `POST` | `/api/tasks/:id/carry-over` |

### 📊 Dashboard
| Method | Endpoint |
|---|---|
| `GET` | `/api/dashboard/stats` |

### 📝 Reports
| Method | Endpoint | Example |
|---|---|---|
| `GET` | `/api/reports/daily` | `?groupBy=project` or `?groupBy=user` |

### 🤖 AI
| Method | Endpoint |
|---|---|
| `POST` | `/api/ai/generate-tasks` |
| `POST` | `/api/ai/improve-writing` |

### 📧 Email
| Method | Endpoint |
|---|---|
| `POST` | `/api/email/send-daily-report` |

---

## 🛡️ Role Permissions

| Feature | 👑 Admin | 🏆 Leader | 👤 Member |
|---|:---:|:---:|:---:|
| Login | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ❌ | ❌ |
| View Assigned Members | ✅ | ✅ | ❌ |
| Create Projects | ✅ | ✅ | ❌ |
| View Projects | ✅ | ✅ | Assigned only |
| Create Tasks | ✅ | ✅ | Self only |
| Update Tasks | ✅ | ✅ | Own tasks |
| AI Task Generator | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | Own report |
| Send Email Report | ✅ | ✅ | ❌ |

---

## 🔒 Security

- Passwords hashed with **bcryptjs**
- JWT secret loaded from environment variables
- All protected routes require a valid JWT token
- Role middleware restricts access per user role
- User responses never expose password hashes
- Groq API keys and SMTP credentials must remain private

---


## ✅ Pre-launch Checklist

- [ ] MongoDB is running
- [ ] `.env` file exists and is configured
- [ ] `npm install` completed
- [ ] `npm run dev` starts without errors
- [ ] `POST /api/auth/login` returns a JWT token
- [ ] Protected routes reject requests without JWT
- [ ] Admin-only routes enforce role restriction
- [ ] Leader routes are correctly scoped
- [ ] Member routes are correctly scoped
- [ ] AI routes respond (Groq API key set)
- [ ] SMTP email route sends successfully

---

<div align="center">

Made with ❤️ for productive teams.

</div>
