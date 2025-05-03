import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { Textarea } from "../../components/TeaxtArea/Textarea";
import { Tag, Pin } from "lucide-react";

export default function CreateNote() {
  const [title, setTitle] = useState("Sample Title");
  const [content, setContent] = useState("This is the content of the note...");
  const [tags, setTags] = useState("tag1, tag2");
  const [date, setDate] = useState("");
  const [updatedOn, setUpdatedOn] = useState("");
  const [quote, setQuote] = useState({
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  });
  const [activeUsers, setActiveUsers] = useState(["User1", "User2", "User3"]);
  const [collaborators, setCollaborators] = useState([
    { name: "Creator: User1", role: "Creator" },
    { name: "User2", role: "Collaborator" },
    { name: "User3", role: "Collaborator" },
  ]);
  const [roomId, setRoomId] = useState("abc123");
  const [isPinned, setIsPinned] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);
    setUpdatedOn(today);
  }, []);

  const handleLeave = () => {
    console.log("Leaving room");
    navigate("/dashboard");
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      console.log("Room ID copied!");
    });
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 p-6 flex">
      {/* Main Content Area */}
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

        {/* Title */}
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setUpdatedOn(new Date().toISOString().slice(0, 10));
          }}
          placeholder="Note Title"
          className="text-2xl font-semibold border-none focus:ring-2 focus:ring-blue-500 mb-0"
        />

        <div className="flex items-center justify-between mt-2 mb-2">
          <div className="text-sm text-slate-500">Created on: {date}</div>
          <div className="text-sm text-slate-500">Updated on: {updatedOn}</div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2">
          <Tag className="text-slate-500" size={16} />
          <Input
            value={tags}
            onChange={(e) => {
              setTags(e.target.value);
              setUpdatedOn(new Date().toISOString().slice(0, 10));
            }}
            placeholder="Tags (comma separated)"
            className="flex-1 border-slate-300"
          />
        </div>

        {/* Content */}
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setUpdatedOn(new Date().toISOString().slice(0, 10));
          }}
          rows={10}
          placeholder="Write your note here..."
          className="resize-none w-full border-slate-300 focus:ring-2 focus:ring-blue-500"
        />

        {/* Quote Section */}
        <div className="p-4 bg-gray-100 border-l-4 border-blue-500 flex-1">
          <p className="text-lg font-semibold">Quote of the Day:</p>
          <p className="italic">"{quote.text}"</p>
          <p className="text-right text-sm">- {quote.author}</p>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-80 bg-white rounded-2xl shadow-xl p-6 ml-6 flex flex-col justify-between h-full">
        <div>
          <div className="text-lg font-semibold text-slate-700">Active Users</div>
          <div className="space-y-2 mt-2">
            {activeUsers.map((user, index) => (
              <div key={index} className="text-sm text-slate-600">
                {user}
              </div>
            ))}
          </div>

          {/* Collaborators */}
          <div className="mt-6">
            <div className="text-lg font-semibold text-slate-700">Collaborators</div>
            <div className="space-y-2 mt-2">
              {collaborators.map((collaborator, index) => (
                <div key={index} className="text-sm text-slate-600">
                  {collaborator.name} - {collaborator.role}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section: Room Info & Leave */}
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
