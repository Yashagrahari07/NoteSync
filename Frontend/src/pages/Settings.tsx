import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Bell, Users, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserPreferences, useUpdateNotificationSettings, useUpdateRealTimeSettings } from '@/hooks/api/useUserPreferences';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function Settings() {
  const navigate = useNavigate();
  const { data: preferences, isLoading } = useUserPreferences();
  const updateNotificationSettings = useUpdateNotificationSettings();
  const updateRealTimeSettings = useUpdateRealTimeSettings();

  const [notificationSettings, setNotificationSettings] = useState({
    joinLeave: true,
    collaboratorChanges: true,
    liveEdits: false,
    cursorMoves: false,
  });

  const [realTimeSettings, setRealTimeSettings] = useState({
    showCursors: true,
    showSelections: true,
    showPresence: true,
  });

  // Initialize state from preferences
  useEffect(() => {
    if (preferences) {
      setNotificationSettings(preferences.notifications);
      setRealTimeSettings(preferences.realTime);
    }
  }, [preferences]);

  const handleNotificationChange = async (key: keyof typeof notificationSettings, value: boolean) => {
    const updated = { ...notificationSettings, [key]: value };
    setNotificationSettings(updated);
    
    try {
      await updateNotificationSettings.mutateAsync(updated);
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
      await updateRealTimeSettings.mutateAsync(updated);
      toast.success('Real-time settings updated');
    } catch (error) {
      toast.error('Failed to update real-time settings');
      // Revert on error
      setRealTimeSettings(realTimeSettings);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your preferences and collaboration settings</p>
        </div>

        <div className="space-y-6">
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
                  disabled={updateNotificationSettings.isPending}
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
                  disabled={updateNotificationSettings.isPending}
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
                  disabled={updateNotificationSettings.isPending}
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
                  disabled={updateNotificationSettings.isPending}
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
                  disabled={updateRealTimeSettings.isPending}
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
                  disabled={updateRealTimeSettings.isPending}
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
                  disabled={updateRealTimeSettings.isPending}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

