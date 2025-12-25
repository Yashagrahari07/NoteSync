import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { History, RotateCcw, X, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useVersionHistory, useRestoreVersion, useVersion } from '@/hooks/api/useConflictResolution';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface VersionHistoryProps {
  noteId: string;
}

function VersionHistoryComponent({ noteId }: VersionHistoryProps) {
  const [open, setOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<number | null>(null);
  const { data: versions, isLoading } = useVersionHistory(noteId);
  const { data: previewData } = useVersion(noteId, previewVersion || 0);
  const restoreVersionMutation = useRestoreVersion();

  const handleRestore = async (version: number) => {
    if (!confirm(`Are you sure you want to restore this note to version ${version}? This action cannot be undone.`)) {
      return;
    }

    try {
      await restoreVersionMutation.mutateAsync({ noteId, version });
      toast.success(`Note restored to version ${version}`);
      setOpen(false);
    } catch (error) {
      toast.error('Failed to restore version');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Version History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            View and restore previous versions of this note
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 h-[60vh]">
          <ScrollArea className="pr-4">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : versions && versions.length > 0 ? (
              <div className="space-y-2">
                {versions.map((version) => (
                  <motion.div
                    key={version._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      previewVersion === version.version
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setPreviewVersion(version.version)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Version {version.version}</span>
                        {version.conflictResolved && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded">
                            Conflict Resolved
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(version.version);
                        }}
                        disabled={restoreVersionMutation.isPending}
                        className="h-7"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {version.createdByFullname}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No version history available</p>
              </div>
            )}
          </ScrollArea>
          <div className="border rounded-lg p-4">
            {previewVersion ? (
              previewData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Version {previewData.version} Preview</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(previewData.version)}
                      disabled={restoreVersionMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium mb-1">Title:</p>
                      <p className="text-sm">{previewData.title}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Content:</p>
                      <ScrollArea className="h-[400px] border rounded p-4">
                        <div
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: previewData.content }}
                        />
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-64 w-full" />
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a version to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const VersionHistory = memo(VersionHistoryComponent);

