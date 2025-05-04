import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { Textarea } from "../../components/TeaxtArea/Textarea";
import { Tag, Pin } from "lucide-react";
import { io } from "socket.io-client";
import { getNoteById, addCollaborator } from "../../services/noteService";

export default function EditNote() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [createdOn, setCreatedOn] = useState("");
  const [updatedOn, setUpdatedOn] = useState("");
  const [quote, setQuote] = useState({ text: "", author: "" });
  const [collaborators, setCollaborators] = useState([]);
  const [owner, setOwner] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);

  const navigate = useNavigate();
  const { noteId } = useParams();
  const socketRef = useRef(null);

  const fetchNoteData = async () => {
    try {
      const note = await getNoteById(noteId);
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags.join(", "));
      setCreatedOn(new Date(note.createdOn).toISOString().slice(0, 10));
      setUpdatedOn(new Date(note.updatedOn).toISOString().slice(0, 10));
      setQuote(note.quote);
      setCollaborators(note.collaborators);
      setOwner(note.owner.fullname);
      setRoomId(noteId);
      setIsPinned(note.isPinned);
    } catch (err) {}
  };

  useEffect(() => {
    if (!noteId) return;

    fetchNoteData();

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];

    if (!token) return;

    socketRef.current = io("http://localhost:3000", {
      auth: { token },
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("joinNote", noteId);
    });

    socketRef.current.on("noteData", (note) => {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags.join(", "));
      setCreatedOn(new Date(note.createdOn).toISOString().slice(0, 10));
      setUpdatedOn(new Date(note.updatedOn).toISOString().slice(0, 10));
      setQuote(note.quote);
      setCollaborators(note.collaborators);
      setOwner(note.owner.fullname);
    });

    socketRef.current.on("noteUpdated", (updatedNote) => {
      setTitle(updatedNote.title);
      setContent(updatedNote.content);
      setTags(updatedNote.tags.join(", "));
      setUpdatedOn(new Date(updatedNote.updatedOn).toISOString().slice(0, 10));
    });

    socketRef.current.on("activeUsers", (users) => {
      setActiveUsers(users.map((user) => user.fullname));
    });

    return () => {
      socketRef.current.emit("leaveNote", noteId);
      socketRef.current.disconnect();
    };
  }, [noteId]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    socketRef.current.emit("editNote", noteId, { content: newContent });
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    socketRef.current.emit("editNote", noteId, { title: newTitle });
  };

  const handleTagsChange = (e) => {
    const newTags = e.target.value;
    setTags(newTags);
    socketRef.current.emit("editNote", noteId, { tags: newTags.split(",") });
  };

  const handleAddCollaborator = async () => {
    try {
      const updatedNote = await addCollaborator(noteId, collaboratorEmail);
      setCollaborators(updatedNote.collaborators);
      setCollaboratorEmail("");
    } catch (err) {}
  };

  const handleLeave = () => {
    socketRef.current.emit("leaveNote", noteId);
    socketRef.current.disconnect();
    navigate("/dashboard");
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      alert("Room ID copied to clipboard!");
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 p-6 flex">
      <div className="flex-1 max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 space-y-6 flex flex-col">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-600 hover:text-black text-sm"
          >
            ← Back
          </button>

          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`flex items-center gap-1 text-sm font-medium rounded-full px-3 py-1 border ${
              isPinned ? "bg-yellow-300 text-black" : "bg-slate-200 text-slate-700"
            } hover:bg-yellow-400 transition`}
          >
            <Pin size={16} /> {isPinned ? "Pinned" : "Pin Note"}
          </button>
        </div>

        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="Note Title"
          className="text-2xl font-semibold border-none focus:ring-2 focus:ring-blue-500 mb-0"
        />

        <div className="flex items-center justify-between mt-2 mb-2">
          <div className="text-sm text-slate-500">Created on: {createdOn}</div>
          <div className="text-sm text-slate-500">Updated on: {updatedOn}</div>
        </div>

        <div className="flex items-center gap-2">
          <Tag className="text-slate-500" size={16} />
          <Input
            value={tags}
            onChange={handleTagsChange}
            placeholder="Tags (comma separated)"
            className="flex-1 border-slate-300"
          />
        </div>

        <Textarea
          value={content}
          onChange={handleContentChange}
          rows={10}
          placeholder="Write your note here..."
          className="resize-none w-full border-slate-300 focus:ring-2 focus:ring-blue-500"
        />

        <div className="p-4 bg-gray-100 border-l-4 border-blue-500 flex-1">
          <p className="text-lg font-semibold">Quote of the Day:</p>
          <p className="italic">"{quote.text}"</p>
          <p className="text-right text-sm">- {quote.author}</p>
        </div>
      </div>

      <div className="w-80 bg-white rounded-2xl shadow-xl p-6 ml-6 flex flex-col justify-between h-full">
        <div>
          <div className="text-lg font-semibold text-slate-700">Active Users</div>
          <div className="flex flex-wrap gap-2 mt-2">
            {activeUsers.map((fullname, index) => (
              <div
                key={index}
                className="h-auto w-fit px-2 flex items-center justify-center rounded-full text-slate-950 text-sm bg-slate-100"
              >
                {fullname}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="text-lg font-semibold text-slate-700">Owner</div>
            <div className="h-auto w-fit px-2 flex items-center justify-center rounded-full text-slate-950 text-sm bg-slate-100">
              {owner}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-lg font-semibold text-slate-700">Collaborators</div>
            <div className="space-y-2 mt-2">
              {collaborators.map((collaborator, index) => (
                <div
                  key={index}
                  className="h-auto w-fit px-2 flex items-center justify-center rounded-full text-slate-950 text-sm bg-slate-100"
                >
                  {collaborator.fullname}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-lg font-semibold text-slate-700">Add Collaborator</div>
            <div className="mt-2">
              <input
                type="email"
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddCollaborator}
                className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Collaborator
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <div className="flex justify-between items-center text-sm text-slate-600">
            <span>Room ID: {roomId}</span>
            <button
              onClick={handleCopyRoomId}
              className="text-blue-600 hover:underline"
            >
              Copy
            </button>
          </div>

          <Button
            onClick={handleLeave}
            className="w-full px-4 py-2 rounded-full text-white bg-red-600 hover:bg-red-700"
          >
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  );
}