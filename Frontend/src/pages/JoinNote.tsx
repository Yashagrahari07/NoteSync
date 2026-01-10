import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Hash, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function JoinNote() {
  const navigate = useNavigate();
  const [noteId, setNoteId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!noteId.trim()) {
      toast.error('Please enter a valid Note ID');
      return;
    }

    setIsLoading(true);
    try {
      // Validate note ID format (basic check)
      if (noteId.trim().length < 10) {
        toast.error('Please enter a valid Note ID');
        setIsLoading(false);
        return;
      }
      
      // Navigate to the note
      navigate(`/edit-note/${noteId.trim()}`);
    } catch (error) {
      toast.error('Failed to join note');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Hash className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Join a Note</CardTitle>
            <CardDescription className="text-center">
              Enter the Note ID to start collaborating
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="noteId">Note ID</Label>
                <Input
                  id="noteId"
                  type="text"
                  placeholder="Enter Note ID"
                  value={noteId}
                  onChange={(e) => setNoteId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  You can get the Note ID from the note owner
                </p>
              </div>

              <Button
                onClick={handleJoin}
                className="w-full"
                size="lg"
                disabled={isLoading || !noteId.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Note'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

