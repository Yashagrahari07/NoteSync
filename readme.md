# NoteSync: Real-Time Collaborative Notes App

NoteSync is a real-time collaborative notes application that allows multiple users to create, edit, and view shared notes in real-time. It is built using Node.js, Express.js, WebSockets, MongoDB, and React.

## Features
- **User Management**: Register and log in with JWT-based authentication.
- **Notes Functionality**: Create, update, delete, and search notes.
- **Real-Time Collaboration**: Edit notes collaboratively with instant updates using WebSockets.
- **Third-Party API Integration**: Fetch and attach quotes to notes during creation.
- **Containerization**: Dockerized for easy deployment.
- **Search and Filter**: Search notes by title, content, or tags.

---

## Architecture Overview

The application is divided into two main components:
1. **Backend**:
   - Built with Node.js, Express.js, and MongoDB.
   - Handles user authentication, note management, and WebSocket communication.
   - Third-party API integration for fetching quotes.

2. **Frontend**:
   - Built with React and Vite.
   - Provides a user-friendly interface for managing notes and collaborating in real-time.

---

## Setup Instructions

### Prerequisites
- Docker and Docker Compose installed.
- Node.js and npm installed (for local development).

### Local Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Yashagrahari07/NoteSync.git
   cd NoteSync
   ```

2. Set up environment variables:
   - Create `.env` files in both `Backend` and `Frontend` directories.
   - Backend `.env` example:
     ```
     DB_CONNECT=mongodb://localhost:27017/notesync
     JWT_SECRET=your_jwt_secret
     FRONTEND_URL=http://localhost:5173
     ```
   - Frontend `.env` example:
     ```
     VITE_API_BASE_URL=http://localhost:3000
     ```

3. Start the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3000](http://localhost:3000)

---

## Sample Users

To try the application, you can use the following sample users:

1. **User 1**:
   - Email: `raj@gmail.com`
   - Password: `raj1234`

2. **User 2**:
   - Email: `yash@gmail.com`
   - Password: `yash1234`

---

## API Endpoints

### **User Management**
- **POST** `/users/register`: Register a new user.
- **POST** `/users/login`: Log in and receive a JWT token.
- **GET** `/users/profile`: Get the logged-in user's profile (requires JWT).
- **GET** `/users/logout`: Log out the user.

### **Notes**
- **POST** `/notes`: Create a new note.
- **GET** `/notes`: Get all notes for the logged-in user.
- **GET** `/notes/:id`: Get a specific note by ID.
- **PUT** `/notes/:id`: Update a note by ID.
- **DELETE** `/notes/:id`: Delete a note by ID.
- **POST** `/notes/:id/collaborators`: Add a collaborator to a note.
- **PATCH** `/notes/:id/pin`: Toggle pin status for a note.

---

## Deployment

To deploy the application:
1. Build Docker images:
   ```bash
   docker-compose build
   ```

2. Push the images to a container registry (e.g., Docker Hub).

3. Deploy the containers to a hosting service like Vercel, Render, AWS.

---

## Technologies Used
- **Backend**: Node.js, Express.js, MongoDB, Socket.IO
- **Frontend**: React, Redux, TailwindCSS
- **Containerization**: Docker, Docker Compose
- **Third-Party API**: ZenQuotes API

---

## License
This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.