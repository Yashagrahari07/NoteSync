import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../../components/Button/Button";
import { Input } from "../../components/Input/Input";
import { Textarea } from "../../components/TeaxtArea/Textarea";
import { Tag, Pin, Eye, EyeOff, ArrowLeft, Users, Copy, LogOut, Settings, History } from "lucide-react";
import { io } from "socket.io-client";
import { getNoteById, addCollaborator } from "../../services/noteService";
import { useToastContext } from "../../components/Toast";
import { fetchUserPreferences } from "../../redux/slices/userPreferencesSlice";

import TypingIndicator from "../../components/TypingIndicator";
import NotificationSettings from "../../components/NotificationSettings";

import { useOperationalTransformation } from "../../hooks/useOperationalTransformation";
import ConflictResolution from "../../components/ConflictResolution";
import VersionHistory from "../../components/VersionHistory";
import ConflictIndicator from "../../components/ConflictIndicator";

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
  
  // Phase 1: Enhanced real-time collaboration state

  const [typingUsers, setTypingUsers] = useState([]);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Phase 2: Conflict resolution state
  const [showConflictResolution, setShowConflictResolution] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [currentConflicts, setCurrentConflicts] = useState([]);
  const [isResolvingConflicts, setIsResolvingConflicts] = useState(false);

  const navigate = useNavigate();
  const { noteId } = useParams();
  const socketRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const { showInfo, showSuccess } = useToastContext();
  const dispatch = useDispatch();
  const realTime = useSelector(state => state.userPreferences?.realTime);

  // Create refs for text areas
  const textareaRef = useRef(null);
  const livePreviewTextareaRef = useRef(null);

  // Phase 2: Operational Transformation hook
  const {
    conflicts,
    isResolving,
    getLastContent,
    initializeContent,
    handleContentChange: handleOTContentChange,
    handleRemoteOperation,
    handleConflictResolution,
    resolveConflictManually,
    clearConflicts
  } = useOperationalTransformation(noteId, socketRef);

  // Use refs for handlers to avoid stale closures in socket listeners
  const initializeContentRef = useRef(initializeContent);
  const handleRemoteOperationRef = useRef(handleRemoteOperation);
  const handleConflictResolutionRef = useRef(handleConflictResolution);
  const showInfoRef = useRef(showInfo);
  const showSuccessRef = useRef(showSuccess);

  // Update refs when handlers change
  useEffect(() => {
    initializeContentRef.current = initializeContent;
    handleRemoteOperationRef.current = handleRemoteOperation;
    handleConflictResolutionRef.current = handleConflictResolution;
    showInfoRef.current = showInfo;
    showSuccessRef.current = showSuccess;
  }, [initializeContent, handleRemoteOperation, handleConflictResolution, showInfo, showSuccess]);

  // Socket event handlers - defined at top level to follow Rules of Hooks
  const handleUserJoined = useCallback((data) => {
    setActiveUsers(data.activeUsers.map((user) => user.fullname));
    // Only show toast for other users joining, not for the current user
    if (data.user.userId !== currentUserIdRef.current) {
      showInfo(`${data.user.fullname} joined the note`);
    }
  }, [showInfo]);

  const handleUserLeft = useCallback((data) => {
    setActiveUsers(data.activeUsers.map((user) => user.fullname));
    // Only show toast for other users leaving, not for the current user
    if (data.user.userId !== currentUserIdRef.current) {
      showInfo(`${data.user.fullname} left the note`);
    }
    

  }, [showInfo]);

  const fetchNoteData = async () => {
    try {
      const note = await getNoteById(noteId);
      setTitle(note.title);
      setContent(note.content);
      // Initialize OT hook with initial content
      initializeContent(note.content);
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
    dispatch(fetchUserPreferences());
  }, [noteId, dispatch]);

  useEffect(() => {
    if (!noteId) return;

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];

    if (!token) return;

    // Decode the JWT token to get the current user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentUserId = payload._id || payload.id;
    currentUserIdRef.current = currentUserId;

    // Clean up existing socket and listeners if noteId changed
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    socketRef.current = io(apiUrl, {
      auth: { token },
      reconnection: false,
      timeout: 5000,
    });

    let hasJoined = false; // Prevent multiple joinNote calls

    socketRef.current.on("connect", () => {
      if (!hasJoined) {
        socketRef.current.emit("joinNote", noteId);
        hasJoined = true;
      }
    });

    socketRef.current.on("disconnect", () => {
      // Socket disconnected
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socketRef.current.on("error", (error) => {
      console.error("Socket error:", error);
    });

    socketRef.current.on("noteData", (note) => {
      setTitle(note.title);
      setContent(note.content);
      initializeContentRef.current(note.content);
      setTags(note.tags.join(", "));
      setCreatedOn(new Date(note.createdOn).toISOString().slice(0, 10));
      setUpdatedOn(new Date(note.updatedOn).toISOString().slice(0, 10));
      setQuote(note.quote);
      setCollaborators(note.collaborators);
      setOwner(note.owner.fullname);
    });

    socketRef.current.on("noteUpdated", (updatedNote) => {
      // Update non-content fields
      // Content updates should come through operationApplied event for OT support
      setTitle(updatedNote.title);
      // Only update content if we're not using OT (fallback for non-OT updates)
      // setContent(updatedNote.content);
      setTags(updatedNote.tags.join(", "));
      setUpdatedOn(new Date(updatedNote.updatedOn).toISOString().slice(0, 10));
    });

    // Enhanced real-time events
    socketRef.current.on("userJoined", handleUserJoined);
    socketRef.current.on("userLeft", handleUserLeft);

    socketRef.current.on("liveEdit", (data) => {
      if (data.editor.userId !== currentUserIdRef.current) {
        setCurrentEditor(data.editor.fullname);
        setLiveEditStatus(`${data.editor.fullname} is editing...`);
        
        // Update note fields from other user's edits
        // Only update content if it's not being handled by OT (i.e., title/tags changed)
        // Content changes should come through operationApplied event
        setTitle(data.note.title);
        // Don't update content here - let operationApplied handle it
        // setContent(data.note.content);
        setTags(data.note.tags.join(", "));
        setUpdatedOn(new Date(data.note.updatedOn).toISOString().slice(0, 10));
        
        // Clear the status after 3 seconds
        setTimeout(() => {
          setCurrentEditor(null);
          setLiveEditStatus("");
        }, 3000);
      }
    });



    socketRef.current.on("userTyping", (data) => {
      setTypingUsers(prev => {
        const existing = prev.find(user => user.userId === data.userId);
        if (!existing) {
          return [...prev, { userId: data.userId, userFullname: data.userFullname }];
        }
        return prev;
      });
    });

    socketRef.current.on("userStoppedTyping", (data) => {
      setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
    });

    socketRef.current.on("notification", (data) => {
      showInfoRef.current(data.message);
    });

    socketRef.current.on("collaboratorAdded", (data) => {
      setCollaborators(data.note.collaborators);
      // No toast - only persistent notification will be shown
    });

    socketRef.current.on("collaboratorRemoved", (data) => {
      setCollaborators(data.note.collaborators);
      // No toast - only persistent notification will be shown
    });

    // Phase 2: Conflict resolution events
    socketRef.current.on("operationApplied", (data) => {
      // Update content if provided from server
      if (data.updatedContent !== undefined) {
        setContent(data.updatedContent);
        initializeContentRef.current(data.updatedContent);
        return;
      }
      
      // Handle remote operation if no server content provided
      if (data.operation && data.operation.userId !== currentUserIdRef.current) {
        const result = handleRemoteOperationRef.current(data.operation);
        if (result.success) {
          setContent(result.newContent);
          initializeContentRef.current(result.newContent);
        }
      }
    });

    socketRef.current.on("conflictResolved", (data) => {
      handleConflictResolutionRef.current(data.conflicts, data.resolution);
      setCurrentConflicts(data.conflicts);
      setIsResolvingConflicts(true);
      showInfoRef.current("Conflicts detected and resolved automatically");
    });

    socketRef.current.on("versionRestored", (data) => {
      setContent(data.note.content);
      initializeContentRef.current(data.note.content);
      setTitle(data.note.title);
      showSuccessRef.current(`Note restored to version ${data.version}`);
    });

    socketRef.current.on("manualResolutionApplied", (data) => {
      showInfoRef.current(`Manual conflict resolution applied by ${data.resolvedBy.fullname}`);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leaveNote", noteId);
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [noteId]); // Only depend on noteId to prevent unnecessary re-registrations





  const handleContentChange = (e) => {
    const newContent = e.target.value;
    // Use lastContentRef as the source of truth, not React state
    // This ensures operations are created based on the actual synchronized content
    const oldContent = getLastContent() || content;
    setContent(newContent);

    // Phase 2: Use Operational Transformation for conflict resolution
    if (currentUserIdRef.current) {
      handleOTContentChange(oldContent, newContent, currentUserIdRef.current);
    }

    // Phase 1: Typing indicator
    if (socketRef.current) {
      socketRef.current.emit("typingStart", noteId);
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      const timeout = setTimeout(() => {
        socketRef.current.emit("typingStop", noteId);
      }, 1000);
      
      setTypingTimeout(timeout);
    }
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
    if (socketRef.current) {
      socketRef.current.emit("leaveNote", noteId);
      socketRef.current.disconnect();
    }
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
              {/* Phase 1: Notification Settings Button */}
              <button
                onClick={() => setShowNotificationSettings(true)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Settings</span>
              </button>

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

                      <div className="relative">
                        <textarea
                          ref={livePreviewTextareaRef}
                          value={content || 'Start writing your note to see the preview...'}
                          readOnly
                          className="w-full text-gray-700 leading-relaxed whitespace-pre-wrap text-sm bg-white/60 p-4 rounded-xl border border-white/30 resize-none border-none focus:ring-0 bg-transparent"
                          rows={Math.max(10, content.split('\n').length)}
                        />
                        

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

                        {/* Phase 1: Typing Indicator */}
                        <TypingIndicator typingUsers={typingUsers} />
                        
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
          ref={textareaRef}
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
                    
                    {/* Phase 1: Collaborative Cursors and Selections - REMOVED FROM MAIN CONTENT */}
                    {/* Cursors and selections will only appear in Live Preview section */}
                    
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
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                      <div className="w-5 h-5 bg-white rounded-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Daily Inspiration</span>
                  </div>
                  
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                    <blockquote className="text-gray-700 italic text-lg mb-4 leading-relaxed">
                      "{quote.text || 'Loading inspiration...'}"
                    </blockquote>
                    <cite className="text-sm text-gray-500 font-medium">— {quote.author || 'Unknown'}</cite>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white/90 backdrop-blur-xl border-l border-gray-200/60 p-6 space-y-6">
          {/* Collaboration Section */}
          <div className="bg-gradient-to-br from-emerald-50/80 to-green-50/80 rounded-2xl border border-emerald-200/50 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
              <Users size={20} className="text-emerald-600" />
              Collaboration
            </h3>
            
            <div className="space-y-4">
              {/* Active Users */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Active Users</h4>
                <div className="space-y-2">
                  {activeUsers.length > 0 ? (
                    activeUsers.map((user, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-white/60 rounded-lg border border-white/30">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-700">{user}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic">No active users</div>
                  )}
                </div>
              </div>

              {/* Room ID */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Room ID</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-white/60 rounded-lg border border-white/30 text-sm font-mono text-gray-700 truncate">
                    {roomId}
                  </div>
                  <button
                    onClick={handleCopyRoomId}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {/* Add Collaborator */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Add Collaborator</h4>
                <div className="flex items-center gap-2">
                  <Input
                    value={collaboratorEmail}
                    onChange={(e) => setCollaboratorEmail(e.target.value)}
                    placeholder="Enter email..."
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={handleAddCollaborator}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Collaborators List */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Collaborators</h4>
                <div className="space-y-2">
                  {collaborators.length > 0 ? (
                    collaborators.map((collaborator, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white/60 rounded-lg border border-white/30">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">{collaborator.fullname}</span>
                        </div>
                        <span className="text-xs text-gray-500">{collaborator.email}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic">No collaborators</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Note Info Section */}
          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200/50 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Note Info</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Owner:</span>
                <span className="text-sm text-gray-700">{owner}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Created:</span>
                <span className="text-sm text-gray-700">{createdOn}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Updated:</span>
                <span className="text-sm text-gray-700">{updatedOn}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <span className="text-sm text-emerald-600 font-semibold">Active</span>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="bg-gradient-to-br from-gray-50/80 to-slate-50/80 rounded-2xl border border-gray-200/50 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Actions</h3>
            
            <div className="space-y-3">
              {/* Phase 2: Conflict Indicator */}
              <ConflictIndicator
                hasConflicts={conflicts.length > 0}
                isResolving={isResolving}
                conflictCount={conflicts.length}
                onResolve={() => setShowConflictResolution(true)}
                className="w-full"
              />

              {/* Phase 2: Version History Button */}
              <Button
                onClick={() => setShowVersionHistory(true)}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <History size={16} />
                Version History
              </Button>





              <Button
                onClick={handleLeave}
                className="w-full flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <LogOut size={16} />
                Leave Note
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 1: Notification Settings Modal */}
      <NotificationSettings 
        isOpen={showNotificationSettings} 
        onClose={() => setShowNotificationSettings(false)} 
      />

      {/* Phase 2: Conflict Resolution Modal */}
      <ConflictResolution
        conflicts={currentConflicts}
        onResolve={resolveConflictManually}
        onDismiss={() => {
          setShowConflictResolution(false);
          setCurrentConflicts([]);
          setIsResolvingConflicts(false);
        }}
        isVisible={showConflictResolution}
      />

      {/* Phase 2: Version History Modal */}
      <VersionHistory
        noteId={noteId}
        isVisible={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onRestore={(version) => {
          setShowVersionHistory(false);
        }}
        socketRef={socketRef}
      />
    </div>
  );
}