import { memo, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Code,
  Link as LinkIcon,
  Image,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Zap,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
}

function EditorToolbarComponent({ editor }: EditorToolbarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  if (!editor) return null;

  // Validate URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      // Also accept relative URLs and protocol-less URLs
      return /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}/i.test(url) || url.startsWith('/');
    }
  };

  // Handle link insertion/editing
  const handleLinkClick = useCallback(() => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    const linkAttributes = editor.getAttributes('link');

    if (linkAttributes.href) {
      // Editing existing link
      setLinkUrl(linkAttributes.href);
      setLinkText(selectedText || '');
    } else {
      // Creating new link
      setLinkUrl('');
      setLinkText(selectedText || '');
    }
    setLinkDialogOpen(true);
  }, [editor]);

  const handleLinkSubmit = useCallback(() => {
    if (!linkUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Add protocol if missing
    let finalUrl = linkUrl.trim();
    if (!finalUrl.match(/^https?:\/\//i) && !finalUrl.startsWith('/') && !finalUrl.startsWith('#')) {
      finalUrl = `https://${finalUrl}`;
    }

    if (!isValidUrl(finalUrl)) {
      toast.error('Please enter a valid URL');
      return;
    }

    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (hasSelection && linkText.trim()) {
      // Replace selected text with link
      editor
        .chain()
        .focus()
        .insertContentAt(
          { from, to },
          `<a href="${finalUrl}">${linkText.trim()}</a>`
        )
        .run();
    } else if (linkText.trim()) {
      // Insert link with custom text
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${finalUrl}">${linkText.trim()}</a>`)
        .run();
    } else {
      // Insert link with URL as text
      editor.chain().focus().setLink({ href: finalUrl }).run();
    }

    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
    toast.success('Link added successfully');
  }, [editor, linkUrl, linkText]);

  const handleRemoveLink = useCallback(() => {
    editor.chain().focus().unsetLink().run();
    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
    toast.success('Link removed');
  }, [editor]);

  // Handle image insertion
  const handleImageClick = useCallback(() => {
    setImageUrl('');
    setImageDialogOpen(true);
  }, []);

  const handleImageSubmit = useCallback(() => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    let finalUrl = imageUrl.trim();
    if (!finalUrl.match(/^https?:\/\//i) && !finalUrl.startsWith('/') && !finalUrl.startsWith('data:')) {
      finalUrl = `https://${finalUrl}`;
    }

    if (!isValidUrl(finalUrl)) {
      toast.error('Please enter a valid image URL');
      return;
    }

    editor.chain().focus().setImage({ src: finalUrl }).run();
    setImageDialogOpen(false);
    setImageUrl('');
    toast.success('Image added successfully');
  }, [editor, imageUrl]);

  return (
    <>
      <div className="flex items-center gap-1 p-2 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex-wrap">
      <div className="flex items-center gap-1 flex-wrap">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(editor.isActive('bold') ? 'bg-primary/10 text-primary' : '', 'transition-colors')}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(editor.isActive('italic') ? 'bg-primary/10 text-primary' : '', 'transition-colors')}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(editor.isActive('underline') ? 'bg-primary/10 text-primary' : '', 'transition-colors')}
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(editor.isActive('heading', { level: 1 }) ? 'bg-primary/10 text-primary' : '', 'transition-colors')}
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(editor.isActive('heading', { level: 2 }) ? 'bg-primary/10 text-primary' : '', 'transition-colors')}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={cn(editor.isActive('heading', { level: 3 }) ? 'bg-primary/10 text-primary' : '', 'transition-colors')}
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(editor.isActive('bulletList') ? 'bg-primary/10 text-primary' : '', 'transition-colors')}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(editor.isActive('orderedList') ? 'bg-primary/10 text-primary' : '', 'transition-colors')}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(editor.isActive('blockquote') ? 'bg-primary/10 text-primary' : '', 'transition-colors')}
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={cn(editor.isActive('codeBlock') ? 'bg-primary/10 text-primary' : '', 'transition-colors')}
      >
        <Code className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLinkClick}
        className={cn(editor.isActive('link') ? 'bg-primary/10 text-primary' : '', 'transition-colors')}
        title="Insert link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleImageClick}
        className="transition-colors"
        title="Insert image"
      >
        <Image className="h-4 w-4" />
      </Button>
      </div>
      <div className="flex items-center gap-1.5 ml-auto px-2 py-1 text-xs text-muted-foreground">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span>autosave</span>
      </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editor.getAttributes('link').href ? 'Edit Link' : 'Insert Link'}</DialogTitle>
            <DialogDescription>
              Enter the URL and optional link text. If no text is provided, the URL will be used as the link text.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLinkSubmit();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-text">Link Text (Optional)</Label>
              <Input
                id="link-text"
                type="text"
                placeholder="Link text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLinkSubmit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            {editor.getAttributes('link').href && (
              <Button variant="destructive" onClick={handleRemoveLink}>
                Remove Link
              </Button>
            )}
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkSubmit}>
              {editor.getAttributes('link').href ? 'Update' : 'Insert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription>
              Enter the URL of the image you want to insert. The image will be displayed in the editor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleImageSubmit();
                  }
                }}
                autoFocus
              />
            </div>
            {imageUrl && isValidUrl(imageUrl) && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg p-2 bg-muted/50">
                  <img
                    src={imageUrl.startsWith('http') || imageUrl.startsWith('/') || imageUrl.startsWith('data:') 
                      ? imageUrl 
                      : `https://${imageUrl}`}
                    alt="Preview"
                    className="max-w-full h-auto rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImageSubmit}>
              Insert Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const EditorToolbar = memo(EditorToolbarComponent);