import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../components/Input/Input";
import { Button } from "../../components/Button/Button";
import { ArrowLeft, Users, Hash, Sparkles, CheckCircle, AlertCircle } from "lucide-react";

export default function JoinNote() {
  const [noteId, setNoteId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!noteId.trim()) {
      setError("Please enter a valid Note ID");
      return;
    }

    setIsLoading(true);
    setError("");

    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
      navigate(`/edit-note/${noteId.trim()}`);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleJoin();
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/90 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-40 shadow-sm">
        <div className="px-4 lg:px-8 py-5">
          <div className="flex items-center gap-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-all duration-200 hover:bg-gray-100 px-3 py-2 rounded-lg group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="hidden sm:inline font-medium">Back</span>
            </button>

            <div className="h-8 w-px bg-gradient-to-b from-gray-300 to-gray-200"></div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Users className="text-white" size={20} />
              </div>
              <span className="text-lg font-semibold text-gray-800">Join Collaboration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 relative overflow-hidden group hover:shadow-3xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 group-hover:from-blue-100/50 group-hover:to-indigo-100/50 transition-all duration-300"></div>
            
            <div className="relative">
              {/* Header Section */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                    <Hash className="text-white" size={32} />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Join a Note</h1>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Enter the Note ID to join an existing collaboration session
                </p>
              </div>

              {/* Form Section */}
              <div className="space-y-6">
                {/* Note ID Input */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Note ID
                  </label>
                  <div className="relative">
                    <Input
                      value={noteId}
                      onChange={(e) => {
                        setNoteId(e.target.value);
                        if (error) setError("");
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter the Note ID (e.g., 507f1f77bcf86cd799439011)"
                      className="w-full pl-12 pr-4 py-4 text-lg font-mono border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <Hash className="text-gray-400" size={20} />
                    </div>
                  </div>
                  {noteId && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle className="text-emerald-500" size={16} />
                      <span>Valid format detected</span>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                    <span className="text-sm text-red-700 font-medium">{error}</span>
                  </div>
                )}

                {/* Join Button */}
                <Button
                  onClick={handleJoin}
                  disabled={isLoading || !noteId.trim()}
                  className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
                    isLoading || !noteId.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Joining...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <Users size={20} />
                      <span>Join Note</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Info Section */}
              <div className="mt-8 pt-6 border-t border-gray-200/50">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Sparkles className="text-blue-600" size={16} />
                    </div>
                    <div className="text-sm text-gray-700">
                      <h4 className="font-semibold text-gray-800 mb-1">How it works</h4>
                      <p className="leading-relaxed">
                        Get the Note ID from the note owner or from the room information panel. 
                        Once joined, you'll be able to collaborate in real-time with other users.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="text-emerald-600" size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">Real-time Collaboration</h4>
                  <p className="text-xs text-gray-600">See who's online and edit together</p>
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="text-purple-600" size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">Auto-save</h4>
                  <p className="text-xs text-gray-600">Your changes are saved automatically</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}