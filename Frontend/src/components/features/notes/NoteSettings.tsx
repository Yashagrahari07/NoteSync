import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Users } from 'lucide-react';
import { useUpdateNoteSettings } from '@/hooks/api/useNotes';
import { toast } from 'sonner';
import type { Note } from '@/types/note.types';

interface NoteSettingsProps {
  note: Note;
  noteId: string;
}

const defaultSettings = {
  notifications: {
    joinLeave: true,
    collaboratorChanges: true,
    liveEdits: true,
    cursorMoves: true,
  },
  realTime: {
    showCursors: true,
    showSelections: true,
    showPresence: true,
  },
};

export function NoteSettings({ note, noteId }: NoteSettingsProps) {
  const updateNoteSettings = useUpdateNoteSettings();
  
  const [notificationSettings, setNotificationSettings] = useState(
    note.settings?.notifications || defaultSettings.notifications
  );
  const [realTimeSettings, setRealTimeSettings] = useState(
    note.settings?.realTime || defaultSettings.realTime
  );

  // Update state when note changes
  useEffect(() => {
    if (note.settings) {
      setNotificationSettings(note.settings.notifications || defaultSettings.notifications);
      setRealTimeSettings(note.settings.realTime || defaultSettings.realTime);
    }
  }, [note.settings]);

  const handleNotificationChange = async (key: keyof typeof notificationSettings, value: boolean) => {
    const updated = { ...notificationSettings, [key]: value };
    setNotificationSettings(updated);
    
    try {
      await updateNoteSettings.mutateAsync({
        noteId,
        settings: {
          notifications: updated,
        },
      });
      toast.success('Notification settings updated');
    } catch (error) {
      toast.error('Failed to update notification settings');
      // Revert on error
      setNotificationSettings(notificationSettings);
    }
  };

  const handleRealTimeChange = async (key: keyof typeof realTimeSettings, value: boolean) => {
    const updated = { ...realTimeSettings, [key]: value };
    setRealTimeSettings(updated);
    
    try {
      await updateNoteSettings.mutateAsync({
        noteId,
        settings: {
          realTime: updated,
        },
      });
      toast.success('Real-time settings updated');
    } catch (error) {
      toast.error('Failed to update real-time settings');
      // Revert on error
      setRealTimeSettings(realTimeSettings);
    }
  };

  return (
    <div className="space-y-4">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notification Settings</CardTitle>
          </div>
          <CardDescription>
            Control what notifications you receive during collaboration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="joinLeave">Join/Leave Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when users join or leave a note
              </p>
            </div>
            <Switch
              id="joinLeave"
              checked={notificationSettings.joinLeave}
              onCheckedChange={(checked) => handleNotificationChange('joinLeave', checked)}
              disabled={updateNoteSettings.isPending}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="collaboratorChanges">Collaborator Changes</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when collaborators are added or removed
              </p>
            </div>
            <Switch
              id="collaboratorChanges"
              checked={notificationSettings.collaboratorChanges}
              onCheckedChange={(checked) => handleNotificationChange('collaboratorChanges', checked)}
              disabled={updateNoteSettings.isPending}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="liveEdits">Live Edits</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone is actively editing
              </p>
            </div>
            <Switch
              id="liveEdits"
              checked={notificationSettings.liveEdits}
              onCheckedChange={(checked) => handleNotificationChange('liveEdits', checked)}
              disabled={updateNoteSettings.isPending}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="cursorMoves">Cursor Moves</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when collaborators move their cursors
              </p>
            </div>
            <Switch
              id="cursorMoves"
              checked={notificationSettings.cursorMoves}
              onCheckedChange={(checked) => handleNotificationChange('cursorMoves', checked)}
              disabled={updateNoteSettings.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Collaboration Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Real-Time Collaboration</CardTitle>
          </div>
          <CardDescription>
            Control what you see during real-time collaboration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showCursors">Show Cursors</Label>
              <p className="text-sm text-muted-foreground">
                Display other users' cursor positions
              </p>
            </div>
            <Switch
              id="showCursors"
              checked={realTimeSettings.showCursors}
              onCheckedChange={(checked) => handleRealTimeChange('showCursors', checked)}
              disabled={updateNoteSettings.isPending}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showSelections">Show Selections</Label>
              <p className="text-sm text-muted-foreground">
                Display other users' text selections
              </p>
            </div>
            <Switch
              id="showSelections"
              checked={realTimeSettings.showSelections}
              onCheckedChange={(checked) => handleRealTimeChange('showSelections', checked)}
              disabled={updateNoteSettings.isPending}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showPresence">Show Presence</Label>
              <p className="text-sm text-muted-foreground">
                Display who is currently viewing the note
              </p>
            </div>
            <Switch
              id="showPresence"
              checked={realTimeSettings.showPresence}
              onCheckedChange={(checked) => handleRealTimeChange('showPresence', checked)}
              disabled={updateNoteSettings.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

