# TradeTide

**TradeTide** is a modern, full-stack web application for skill trading. It enables users to barter their skills, connect via real-time chat, schedule sessions, and leave reviews—all in a seamless, user-friendly platform.

---

## Features

- Skill Marketplace: Discover and connect with users offering a wide variety of skills.
- Barter Requests: Propose, accept, or decline skill trades with other users.
- Real-Time Chat: Communicate instantly with your barter partners.
- Scheduling: Propose and manage sessions for skill exchanges.
- Reviews & Ratings: Leave and view feedback after completed sessions.
- Notifications: Stay updated with real-time notifications for barter requests, chats, sessions, and reviews.
- User Profiles: Manage your skills, bio, and account details.
- Authentication: Secure registration and login system.
- **Light Animations:** The UI features smooth transitions and micro-interactions powered by [Framer Motion](https://www.framer.com/motion/) and CSS transitions for a delightful user experience.

---

## Tech Stack

### Frontend

<p align="left">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Redux_Toolkit-593D88?style=for-the-badge&logo=redux&logoColor=white" alt="Redux Toolkit" />
  <img src="https://img.shields.io/badge/Framer_Motion-EF008F?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" />
</p>

### Backend

<p align="left">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" alt="JWT" />
</p>

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm (v9+ recommended)
- MongoDB (local or cloud instance)

---

### 1. Clone the Repository

```bash
git clone https://github.com/00Manas-Singh00/TradeTide.git
cd TradeTide
```

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env   # Create your environment file if needed
npm install
npm run seed           # (Optional) Seed the database with sample users
npm run dev            # Start the backend server (default: http://localhost:5000)
```

**Environment Variables:**

- `PORT` (default: 5000)
- `MONGODB_URI` (default: mongodb://localhost:27017/tradetide)
- `JWT_SECRET` (set your own secret)

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev            # Start the frontend (default: http://localhost:5173)
```

The frontend is configured to proxy API requests to the backend at `localhost:5000`.

---

## Project Structure

```
TradeTide/
  backend/
    src/
      controllers/
      middleware/
      models/
      routes/
      services/
      types/
    package.json
  frontend/
    src/
      assets/
      components/
      features/
        auth/
        chat/
        marketplace/
        notifications/
        profile/
        reviews/
        scheduling/
      pages/
      services/
      styles/
    package.json
```

---

## Usage

1. Register a new account and set up your profile with skills you offer and want.
2. Browse the marketplace to find users to trade skills with.
3. Send barter requests and negotiate via real-time chat.
4. Schedule sessions for your skill exchanges.
5. Leave reviews after completed sessions to build your reputation.

---

## Contributing

Contributions are welcome! Please open issues and submit pull requests for new features, bug fixes, or improvements.

---

## License

This project is licensed under the MIT License.

---

## Acknowledgements

- Inspired by the idea of a global skill-sharing economy.
- Built with love using modern web technologies. 
