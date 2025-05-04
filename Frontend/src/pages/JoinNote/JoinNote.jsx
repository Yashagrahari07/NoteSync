import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";

export default function JoinNote() {
  const [noteId, setNoteId] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (noteId.trim()) {
      navigate(`/edit-note/${noteId}`);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
        <h1 className="text-xl font-semibold text-slate-700">Join a Note</h1>
        <Input
          value={noteId}
          onChange={(e) => setNoteId(e.target.value)}
          placeholder="Enter Note ID"
          className="w-full border-slate-300"
        />
        <Button
          onClick={handleJoin}
          className="w-full px-4 py-2 rounded-full text-white bg-blue-600 hover:bg-blue-700"
        >
          Join Note
        </Button>
      </div>
    </div>
  );
}