import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, Check, X, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useAcceptInvitation,
  useRejectInvitation,
  type Notification,
} from '@/hooks/api/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function NotificationDropdown() {
  const navigate = useNavigate();
  const { data: notificationsData, isLoading } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();
  const acceptMutation = useAcceptInvitation();
  const rejectMutation = useRejectInvitation();

  const [selectedInvitation, setSelectedInvitation] = useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const notifications = notificationsData?.notifications || [];
  const unreadNotifications = notifications.filter((n) => !n.isRead);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      // For invitations, open the modal
      if (notification.type === 'collaborationInvite' && notification.invitationId) {
        setSelectedInvitation(notification);
        setIsModalOpen(true);
        if (!notification.isRead) {
          markReadMutation.mutate(notification._id);
        }
        return;
      }

      // For other notifications, navigate to note
      if (!notification.isRead) {
        markReadMutation.mutate(notification._id);
      }
      if (notification.noteId) {
        navigate(`/edit-note/${notification.noteId}`);
      }
    },
    [markReadMutation, navigate]
  );

  const handleMarkAllRead = useCallback(() => {
    markAllReadMutation.mutate();
  }, [markAllReadMutation]);

  const handleDelete = useCallback(
    (e: React.MouseEvent, notificationId: string) => {
      e.stopPropagation();
      deleteMutation.mutate(notificationId);
    },
    [deleteMutation]
  );

  const handleAcceptInvitation = useCallback(
    async (invitationId: string, notificationId: string) => {
      try {
        const result = await acceptMutation.mutateAsync(invitationId);
        toast.success(`You joined "${result.noteTitle}"`);
        setIsModalOpen(false);
        setSelectedInvitation(null);
        if (result.noteId) {
          navigate(`/edit-note/${result.noteId}`);
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.error?.message || 'Failed to accept invitation');
      }
    },
    [acceptMutation, navigate]
  );

  const handleRejectInvitation = useCallback(
    async (invitationId: string) => {
      try {
        await rejectMutation.mutateAsync(invitationId);
        toast.info('Invitation declined');
        setIsModalOpen(false);
        setSelectedInvitation(null);
      } catch (error: any) {
        toast.error(error?.response?.data?.error?.message || 'Failed to decline invitation');
      }
    },
    [rejectMutation]
  );

  const handleInlineAccept = useCallback(
    (e: React.MouseEvent, notification: Notification) => {
      e.stopPropagation();
      if (notification.invitationId) {
        handleAcceptInvitation(notification.invitationId, notification._id);
      }
    },
    [handleAcceptInvitation]
  );

  const handleInlineReject = useCallback(
    (e: React.MouseEvent, notification: Notification) => {
      e.stopPropagation();
      if (notification.invitationId) {
        handleRejectInvitation(notification.invitationId);
      }
    },
    [handleRejectInvitation]
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0 hover:border hover:border-border">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            {unreadNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="h-7 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </motion.div>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={cn(
                      'p-4 hover:bg-accent/50 transition-colors duration-200 cursor-pointer relative group',
                      !notification.isRead && 'bg-primary/5'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {notification.type === 'collaborationInvite' && (
                            <Mail className="h-4 w-4 text-primary shrink-0" />
                          )}
                          <p className="text-sm font-semibold line-clamp-1">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                          {notification.message}
                        </p>
                        {notification.noteTitle && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                            Note: {notification.noteTitle}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>

                        {/* Invitation action buttons */}
                        {notification.type === 'collaborationInvite' && notification.invitationId && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => handleInlineAccept(e, notification)}
                              disabled={acceptMutation.isPending || rejectMutation.isPending}
                            >
                              {acceptMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Accept
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={(e) => handleInlineReject(e, notification)}
                              disabled={acceptMutation.isPending || rejectMutation.isPending}
                            >
                              {rejectMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <X className="h-3 w-3 mr-1" />
                                  Decline
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                      {notification.type !== 'collaborationInvite' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => handleDelete(e, notification._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Invitation Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Collaboration Invite
            </DialogTitle>
            <DialogDescription>
              You've been invited to collaborate on a note
            </DialogDescription>
          </DialogHeader>

          {selectedInvitation && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Note</p>
                  <p className="font-medium text-lg">{selectedInvitation.noteTitle}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Invited by</p>
                  <p className="font-medium">{selectedInvitation.noteOwner}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Received</p>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(selectedInvitation.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => selectedInvitation?.invitationId && handleRejectInvitation(selectedInvitation.invitationId)}
              disabled={rejectMutation.isPending || acceptMutation.isPending}
              className="flex-1"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Decline
            </Button>
            <Button
              onClick={() => selectedInvitation?.invitationId && handleAcceptInvitation(selectedInvitation.invitationId, selectedInvitation._id)}
              disabled={acceptMutation.isPending || rejectMutation.isPending}
              className="flex-1"
            >
              {acceptMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Accept & Open
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
