import React from "react";
import { FaThumbtack } from "react-icons/fa";

const NoteCard = ({ title, date, content, tags, onEdit, onDelete, onPinNote, isPinned }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button
          onClick={onPinNote}
          className={`text-xl ${isPinned ? "text-yellow-500" : "text-gray-400"}`}
        >
          <FaThumbtack />
        </button>
      </div>
      <p className="text-sm text-gray-500">{date}</p>
      <p className="mt-2 text-gray-700">{content}</p>
      <p className="mt-2 text-sm text-gray-500">{tags}</p>
      <div className="flex justify-between mt-4">
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-700"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default NoteCard;
