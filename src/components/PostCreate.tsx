import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Image as ImageIcon, 
  Video, 
  FileText, 
  BarChart3, 
  X, 
  Upload,
  Plus
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePosts } from '@/hooks/usePosts';
import { useCommunities } from '@/hooks/useCommunities';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface PostAttachment {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export const PostCreate = () => {
  const { user } = useAuth();
  const { createPost } = usePosts();
  const { communities } = useCommunities();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general' as 'general' | 'exam' | 'second_opinion' | 'non_medical',
    community_id: 'general',
    post_type: 'text' as 'text' | 'image' | 'video' | 'blog' | 'poll',
    tags: [] as string[]
  });
  
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [tagInput, setTagInput] = useState('');

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general',
      community_id: 'general',
      post_type: 'text',
      tags: []
    });
    setAttachments([]);
    setTagInput('');
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const newAttachments: PostAttachment[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid image or video file`,
          variant: "destructive"
        });
        continue;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 50MB`,
          variant: "destructive"
        });
        continue;
      }

      const preview = URL.createObjectURL(file);
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      
      newAttachments.push({ file, preview, type });
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Update post type based on attachments
    if (newAttachments.length > 0) {
      const hasVideo = newAttachments.some(att => att.type === 'video');
      setFormData(prev => ({ 
        ...prev, 
        post_type: hasVideo ? 'video' : 'image' 
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Reset post type if no attachments left
      if (updated.length === 0) {
        setFormData(prevForm => ({ ...prevForm, post_type: 'text' }));
      }
      return updated;
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const uploadAttachments = async (): Promise<string[]> => {
    const uploadPromises = attachments.map(async (attachment) => {
      const fileExt = attachment.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('post-attachments')
        .upload(fileName, attachment.file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('post-attachments')
        .getPublicUrl(fileName);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a post",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title and content",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let attachmentUrls: string[] = [];
      
      if (attachments.length > 0) {
        attachmentUrls = await uploadAttachments();
      }

      const success = await createPost({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        community_id: formData.community_id === 'general' ? null : formData.community_id || null,
        post_type: formData.post_type,
        tags: formData.tags,
        attachments: attachmentUrls.map((url, index) => ({
          url,
          type: attachments[index].type,
          fileName: attachments[index].file.name,
          fileSize: attachments[index].file.size,
          mimeType: attachments[index].file.type
        }))
      });

      if (success) {
        resetForm();
        setIsOpen(false);
        toast({
          title: "Post created!",
          description: "Your post has been published"
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Post Type Selection */}
          <div className="flex gap-2">
            {[
              { type: 'text', icon: FileText, label: 'Text' },
              { type: 'image', icon: ImageIcon, label: 'Image' },
              { type: 'video', icon: Video, label: 'Video' },
              { type: 'blog', icon: FileText, label: 'Blog' },
              { type: 'poll', icon: BarChart3, label: 'Poll' }
            ].map(({ type, icon: Icon, label }) => (
              <Button
                key={type}
                type="button"
                variant={formData.post_type === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, post_type: type as any }))}
              >
                <Icon className="h-4 w-4 mr-1" />
                {label}
              </Button>
            ))}
          </div>

          {/* Community Selection */}
          <div className="space-y-2">
            <Label htmlFor="community">Community (Optional)</Label>
            <Select 
              value={formData.community_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, community_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a community" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Feed</SelectItem>
                {communities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter post title..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={6}
              required
            />
          </div>

          {/* File Attachments */}
          {(formData.post_type === 'image' || formData.post_type === 'video') && (
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload images or videos
                  </span>
                </label>
              </div>

              {/* Attachment Previews */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="relative">
                      {attachment.type === 'image' ? (
                        <img
                          src={attachment.preview}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded"
                        />
                      ) : (
                        <video
                          src={attachment.preview}
                          className="w-full h-32 object-cover rounded"
                          controls
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer">
                    #{tag}
                    <X
                      className="h-3 w-3 ml-1"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as 'general' | 'exam' | 'second_opinion' | 'non_medical' }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="second_opinion">Second Opinion</SelectItem>
                <SelectItem value="non_medical">Non Medical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};