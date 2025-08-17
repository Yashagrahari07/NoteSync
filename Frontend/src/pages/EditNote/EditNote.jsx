import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { Textarea } from "../../components/TeaxtArea/Textarea";
import { Tag, Pin, Eye, EyeOff, ArrowLeft, Users, Copy, LogOut } from "lucide-react";
import { io } from "socket.io-client";
import { getNoteById, addCollaborator } from "../../services/noteService";
import { useToastContext } from "../../components/Toast";

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
  const [isLivePreview, setIsLivePreview] = useState(false);
  const [currentEditor, setCurrentEditor] = useState(null);
  const [liveEditStatus, setLiveEditStatus] = useState("");

  const navigate = useNavigate();
  const { noteId } = useParams();
  const socketRef = useRef(null);
  const { showInfo, showSuccess } = useToastContext();

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

    socketRef.current = io(import.meta.env.VITE_API_BASE_URL, {
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

    // Enhanced real-time events
    socketRef.current.on("userJoined", (data) => {
      setActiveUsers(data.activeUsers.map((user) => user.fullname));
      if (data.user.userId !== socketRef.current.userId) {
        showInfo(`${data.user.fullname} joined the note`);
      }
    });

    socketRef.current.on("userLeft", (data) => {
      setActiveUsers(data.activeUsers.map((user) => user.fullname));
      if (data.user.userId !== socketRef.current.userId) {
        showInfo(`${data.user.fullname} left the note`);
      }
    });

    socketRef.current.on("liveEdit", (data) => {
      if (data.editor.userId !== socketRef.current.userId) {
        setCurrentEditor(data.editor.fullname);
        setLiveEditStatus(`${data.editor.fullname} is editing...`);
        
        // Update note content from other user's edits
        setTitle(data.note.title);
        setContent(data.note.content);
        setTags(data.note.tags.join(", "));
        setUpdatedOn(new Date(data.note.updatedOn).toISOString().slice(0, 10));
        
        // Clear the status after 3 seconds
        setTimeout(() => {
          setCurrentEditor(null);
          setLiveEditStatus("");
        }, 3000);
      }
    });

    socketRef.current.on("collaboratorAdded", (data) => {
      setCollaborators(data.note.collaborators);
      // No toast - only persistent notification will be shown
    });

    socketRef.current.on("collaboratorRemoved", (data) => {
      setCollaborators(data.note.collaborators);
      // No toast - only persistent notification will be shown
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-40 shadow-sm">
        <div className="px-4 lg:px-8 py-5">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
                className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-all duration-200 hover:bg-gray-100 px-3 py-2 rounded-lg group"
          >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="hidden sm:inline font-medium">Back to Dashboard</span>
          </button>

              <div className="h-8 w-px bg-gradient-to-b from-gray-300 to-gray-200"></div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
                </div>
                <span className="text-sm font-medium text-gray-700">Live Collaboration</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Live Preview Toggle */}
              <button
                onClick={() => setIsLivePreview(!isLivePreview)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  isLivePreview
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {isLivePreview ? <EyeOff size={18} /> : <Eye size={18} />}
                <span className="hidden sm:inline">
                  {isLivePreview ? 'Hide Preview' : 'Live Preview'}
                </span>
              </button>

              {/* Pin Button */}
          <button
            onClick={() => setIsPinned(!isPinned)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                  isPinned
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                <Pin size={18} />
                <span className="hidden sm:inline">
                  {isPinned ? 'Pinned' : 'Pin'}
                </span>
          </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content and Sidebar Container */}
      <div className="flex">
        {/* Main Content Area */}
        <div className="flex-1 px-4 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Live Preview Section (Left) */}
            {isLivePreview && (
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        Live Preview
                      </h3>
                      <div className="flex items-center gap-2">
                        {currentEditor && (
                          <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold animate-pulse">
                            {currentEditor} editing...
                          </div>
                        )}
                        <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                          Active
                        </div>
                      </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <h1 className="text-2xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        {title || 'Untitled Note'}
                      </h1>
                      
                      {tags && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {tags.split(',').map((tag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-semibold shadow-sm"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm bg-white/60 p-4 rounded-xl border border-white/30">
                        {content || 'Start writing your note to see the preview...'}
                      </div>

                      <div className="mt-8 p-6 bg-gradient-to-br from-blue-100/80 to-indigo-100/80 rounded-2xl border border-blue-200/50 backdrop-blur-sm">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          Quote of the Day
                        </h4>
                        <blockquote className="text-gray-700 italic text-sm mb-2 leading-relaxed">
                          "{quote.text}"
                        </blockquote>
                        <cite className="text-xs text-gray-500 font-medium">— {quote.author}</cite>
                      </div>

                      {/* Real-time Collaboration Status */}
                      <div className="mt-6 p-4 bg-gradient-to-br from-emerald-50/80 to-green-50/80 rounded-xl border border-emerald-200/50 backdrop-blur-sm">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          Live Collaboration
                        </h4>
                        
                        {liveEditStatus && (
                          <div className="mb-3 p-2 bg-purple-100/80 rounded-lg border border-purple-200/50">
                            <p className="text-xs text-purple-700 font-medium animate-pulse">
                              {liveEditStatus}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-gray-600 font-medium">
                            {activeUsers.length} active user{activeUsers.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {activeUsers.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {activeUsers.map((user, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
                              >
                                {user}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Editor Section */}
            <div className={`${isLivePreview ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-6`}>
              {/* Title */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-8 relative overflow-hidden group hover:shadow-3xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/60 to-gray-50/60 group-hover:from-slate-100/60 group-hover:to-gray-100/60 transition-all duration-300"></div>
                <div className="relative">
                                    <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                      <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Note Title</span>
                  </div>
                  <div className="w-full">
                    <Input
                      value={title}
                      onChange={handleTitleChange}
                      placeholder="Enter a compelling title for your note..."
                      className="w-full text-3xl font-bold border-none bg-transparent focus:ring-0 p-0 placeholder-gray-400 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200/50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-600">Created: {createdOn}</span>
                      </div>
                      <div className="w-px h-4 bg-gray-300"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-600">Updated: {updatedOn}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        Auto-save enabled
                      </div>
                    </div>
                  </div>
                </div>
        </div>

              {/* Tags */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-8 relative overflow-hidden group hover:shadow-3xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 group-hover:from-blue-100/60 group-hover:to-indigo-100/60 transition-all duration-300"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                      <Tag className="text-white" size={20} />
                    </div>
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Tags & Categories</span>
                  </div>
                  <div className="flex items-center gap-4">
          <Input
            value={tags}
            onChange={handleTagsChange}
                      placeholder="Add tags separated by commas (e.g., work, ideas, important)..."
                      className="flex-1 border-none bg-transparent focus:ring-0 p-0 placeholder-gray-400 text-lg font-medium"
                    />
                    <div className="flex-shrink-0">
                      <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                        {tags.split(',').filter(tag => tag.trim()).length} tags
                      </div>
                    </div>
                  </div>
                  {tags && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium border border-purple-200"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Content Editor */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-8 relative overflow-hidden group hover:shadow-3xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/60 to-gray-50/60 group-hover:from-slate-100/60 group-hover:to-gray-100/60 transition-all duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                        <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center">
                          <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Note Content</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {currentEditor && (
                        <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold animate-pulse">
                          {currentEditor} editing
                        </div>
                      )}
                      <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                        {content.length} characters
                      </div>
                      <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {content.split('\n').length} lines
                      </div>
                    </div>
        </div>

                  <div className="relative">
        <Textarea
          value={content}
          onChange={handleContentChange}
                      rows={28}
                      placeholder="Start writing your note here... 

💡 Tips:
• Use clear, concise language
• Break content into paragraphs
• Add bullet points for lists
• Include relevant details"
                      className="resize-none w-full border-none bg-transparent focus:ring-0 p-0 placeholder-gray-400 text-gray-800 leading-relaxed text-lg font-medium"
                    />
                    
                    {/* Editor Footer */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200/50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span>Real-time collaboration</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span>Auto-save active</span>
                        </div>
                        {activeUsers.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                            <span>{activeUsers.length} active user{activeUsers.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {liveEditStatus && (
                          <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold animate-pulse">
                            {liveEditStatus}
                          </div>
                        )}
                        <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                          {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
        </div>
      </div>
              </div>

              {/* Quote Section */}
              <div className="bg-gradient-to-br from-blue-100/90 to-indigo-100/90 rounded-2xl border border-blue-200/60 p-8 backdrop-blur-xl relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-indigo-50/40 group-hover:from-blue-100/40 group-hover:to-indigo-100/40 transition-all duration-300"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                      <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Daily Inspiration</span>
          </div>

                  <div className="bg-white/60 rounded-2xl p-6 border border-white/50 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      Quote of the Day
                    </h3>
                    <blockquote className="text-gray-700 italic text-lg mb-4 leading-relaxed font-medium">
                      "{quote.text}"
                    </blockquote>
                    <cite className="text-sm text-gray-500 font-semibold flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      — {quote.author}
                    </cite>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>

        {/* Right Sidebar - Collaboration Features */}
        <div className="w-80 bg-white/90 backdrop-blur-xl border-l border-white/30 flex flex-col shadow-2xl">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/20 bg-gradient-to-r from-slate-50 to-gray-50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={20} />
              </div>
              Collaboration
            </h2>
            <p className="text-sm text-gray-600 mt-2 font-medium">Manage team and access</p>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Active Users */}
            <div className="bg-gradient-to-br from-emerald-50/80 to-green-50/80 rounded-2xl p-6 border border-emerald-200/50 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="text-emerald-600" size={18} />
                </div>
                <h3 className="font-bold text-gray-800 text-sm">Active Users</h3>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                    {activeUsers.length}
                  </span>
                  <div className="relative">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
                  </div>
            </div>
          </div>

              <div className="space-y-3">
                {activeUsers.length > 0 ? (
                  activeUsers.map((fullname, index) => (
                <div
                  key={index}
                      className="flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {fullname.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-700 truncate block">{fullname}</span>
                        <span className="text-xs text-emerald-600 font-medium">Online</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="text-emerald-400" size={20} />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">No active users</p>
                  </div>
                )}
              </div>
            </div>

            {/* Owner */}
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-2xl p-6 border border-blue-200/50 backdrop-blur-sm">
              <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                Owner
              </h3>
              <div className="flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {owner.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-700 truncate block">{owner}</span>
                  <span className="text-xs text-blue-600 font-medium">Owner</span>
                </div>
              </div>
            </div>

            {/* Collaborators */}
            <div className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 rounded-2xl p-6 border border-purple-200/50 backdrop-blur-sm">
              <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                </div>
                Collaborators
                <span className="ml-auto text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  {collaborators.length}
                </span>
              </h3>
              <div className="space-y-3">
                {collaborators.length > 0 ? (
                  collaborators.map((collaborator, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-white/80 rounded-xl border border-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {collaborator.fullname.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-purple-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-700 truncate block">{collaborator.fullname}</span>
                        <span className="text-xs text-purple-600 font-medium">Collaborator</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="text-purple-400" size={20} />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">No collaborators yet</p>
                  </div>
                )}
            </div>
          </div>

            {/* Add Collaborator */}
            <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 rounded-2xl p-6 border border-amber-200/50 backdrop-blur-sm">
              <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                </div>
                Add Collaborator
              </h3>
              <div className="space-y-4">
              <input
                type="email"
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 border-2 border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-white/80 backdrop-blur-sm"
              />
              <button
                onClick={handleAddCollaborator}
                  className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 font-semibold text-sm transform hover:scale-105 shadow-lg"
              >
                Add Collaborator
              </button>
            </div>
            </div>

                        {/* Room Info */}
            <div className="bg-gradient-to-br from-red-50/80 to-pink-50/80 rounded-2xl p-6 border border-red-200/50 backdrop-blur-sm">
              <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                Room Info
              </h3>
              <div className="space-y-4">
                <div className="bg-white/80 rounded-xl border border-white/50 backdrop-blur-sm shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                        <span className="text-xs font-mono font-semibold text-gray-800 break-all">{roomId}</span>
          </div>
        </div>
            <button
              onClick={handleCopyRoomId}
                      className="flex-shrink-0 p-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 transform hover:scale-105 shadow-md"
                      title="Copy Room ID"
            >
                      <Copy size={14} />
            </button>
                  </div>
          </div>

                <button
            onClick={handleLeave}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-semibold text-sm transform hover:scale-105 shadow-lg"
          >
                  <LogOut size={16} />
            Leave Room
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}