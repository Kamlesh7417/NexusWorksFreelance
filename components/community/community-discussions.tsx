'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Heart, Plus, Send, Pin, ThumbsUp, Reply } from 'lucide-react';
import { communityService, CommunityPost, CommunityComment } from '@/lib/services/community-service';
import { useAuth } from '@/components/auth/auth-provider';

export function CommunityDiscussions() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    post_type: 'discussion',
    tags: [] as string[]
  });
  const [commentForm, setCommentForm] = useState({
    content: '',
    parent_comment: ''
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({
    post_type: '',
    tags: '',
    author: ''
  });

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await communityService.getCommunityPosts(filter);
      if (response.success) {
        setPosts(response.data.results || []);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const response = await communityService.getPostComments(postId);
      if (response.success) {
        setComments(response.data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!createForm.title || !createForm.content) return;

    try {
      setLoading(true);
      const response = await communityService.createCommunityPost(createForm);
      if (response.success) {
        setShowCreateForm(false);
        setCreateForm({
          title: '',
          content: '',
          post_type: 'discussion',
          tags: []
        });
        loadPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (postId: string) => {
    if (!commentForm.content) return;

    try {
      const response = await communityService.createComment(postId, commentForm);
      if (response.success) {
        setCommentForm({ content: '', parent_comment: '' });
        loadComments(postId);
        // Update post comment count
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const response = await communityService.likePost(postId);
      if (response.success) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: post.likes_count + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await communityService.likeComment(commentId);
      if (response.success) {
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, likes_count: comment.likes_count + 1 }
            : comment
        ));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !createForm.tags.includes(newTag.trim())) {
      setCreateForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setCreateForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'discussion': return <MessageSquare className="h-4 w-4" />;
      case 'question': return <MessageSquare className="h-4 w-4" />;
      case 'announcement': return <Pin className="h-4 w-4" />;
      case 'showcase': return <ThumbsUp className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'discussion': return 'bg-blue-100 text-blue-800';
      case 'question': return 'bg-green-100 text-green-800';
      case 'announcement': return 'bg-purple-100 text-purple-800';
      case 'showcase': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const organizeComments = (comments: CommunityComment[]) => {
    const commentMap = new Map();
    const rootComments: CommunityComment[] = [];

    // First pass: create map and identify root comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
      if (!comment.parent_comment) {
        rootComments.push(comment);
      }
    });

    // Second pass: organize replies
    comments.forEach(comment => {
      if (comment.parent_comment && commentMap.has(comment.parent_comment)) {
        commentMap.get(comment.parent_comment).replies.push(comment);
      }
    });

    return rootComments.map(comment => commentMap.get(comment.id));
  };

  const organizedComments = organizeComments(comments);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Community Discussions</h2>
          <p className="text-gray-600">Share knowledge and connect with fellow developers</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Post Type</Label>
              <Select value={filter.post_type} onValueChange={(value) => setFilter(prev => ({ ...prev, post_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="discussion">Discussion</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="showcase">Showcase</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tags</Label>
              <Input
                placeholder="Filter by tag..."
                value={filter.tags}
                onChange={(e) => setFilter(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
            <div>
              <Label>Author</Label>
              <Input
                placeholder="Filter by author..."
                value={filter.author}
                onChange={(e) => setFilter(prev => ({ ...prev, author: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Posts Found</h3>
            <p className="text-gray-600 mb-4">Start the conversation by creating the first post</p>
            <Button onClick={() => setShowCreateForm(true)}>
              Create First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6" onClick={() => {
                setSelectedPost(post);
                loadComments(post.id);
              }}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {post.is_pinned && <Pin className="h-4 w-4 text-purple-500" />}
                      <Badge className={getPostTypeColor(post.post_type)}>
                        <div className="flex items-center space-x-1">
                          {getPostTypeIcon(post.post_type)}
                          <span className="capitalize">{post.post_type}</span>
                        </div>
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                    <p className="text-gray-600 line-clamp-2">{post.content}</p>
                  </div>
                </div>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>By User #{post.author}</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      className="flex items-center space-x-1 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikePost(post.id);
                      }}
                    >
                      <Heart className="h-4 w-4" />
                      <span>{post.likes_count}</span>
                    </button>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.comments_count}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Post Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
              <CardDescription>Share your thoughts with the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="post-title">Title</Label>
                <Input
                  id="post-title"
                  placeholder="Enter post title..."
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="post-type">Post Type</Label>
                <Select value={createForm.post_type} onValueChange={(value) => setCreateForm(prev => ({ ...prev, post_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discussion">Discussion</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="showcase">Showcase</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="post-content">Content</Label>
                <textarea
                  id="post-content"
                  className="w-full p-3 border rounded-md"
                  rows={6}
                  placeholder="Write your post content..."
                  value={createForm.content}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    placeholder="Add a tag (e.g., javascript, react)"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" onClick={addTag}>Add</Button>
                </div>
                {createForm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {createForm.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        #{tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4">
                <Button onClick={handleCreatePost} disabled={loading || !createForm.title || !createForm.content}>
                  {loading ? 'Creating...' : 'Create Post'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Post Details Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {selectedPost.is_pinned && <Pin className="h-4 w-4 text-purple-500" />}
                    <Badge className={getPostTypeColor(selectedPost.post_type)}>
                      <div className="flex items-center space-x-1">
                        {getPostTypeIcon(selectedPost.post_type)}
                        <span className="capitalize">{selectedPost.post_type}</span>
                      </div>
                    </Badge>
                  </div>
                  <CardTitle>{selectedPost.title}</CardTitle>
                  <CardDescription>
                    By User #{selectedPost.author} • {formatDate(selectedPost.created_at)}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedPost(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="whitespace-pre-wrap">{selectedPost.content}</p>
              </div>

              {selectedPost.tags.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-4 py-2 border-y">
                <button
                  className="flex items-center space-x-2 hover:text-red-500"
                  onClick={() => handleLikePost(selectedPost.id)}
                >
                  <Heart className="h-5 w-5" />
                  <span>{selectedPost.likes_count} likes</span>
                </button>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>{selectedPost.comments_count} comments</span>
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <h4 className="font-medium mb-4">Comments</h4>
                
                {/* Add Comment Form */}
                <div className="mb-6">
                  <textarea
                    className="w-full p-3 border rounded-md"
                    rows={3}
                    placeholder="Write a comment..."
                    value={commentForm.content}
                    onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      onClick={() => handleCreateComment(selectedPost.id)}
                      disabled={!commentForm.content}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Comment
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                {organizedComments.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {organizedComments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">User #{comment.author}</p>
                            <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                          </div>
                          <button
                            className="flex items-center space-x-1 text-sm hover:text-red-500"
                            onClick={() => handleLikeComment(comment.id)}
                          >
                            <Heart className="h-3 w-3" />
                            <span>{comment.likes_count}</span>
                          </button>
                        </div>
                        <p className="text-gray-700 mb-2">{comment.content}</p>
                        
                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-4 mt-3 space-y-3 border-l-2 border-gray-200 pl-4">
                            {comment.replies.map((reply: CommunityComment) => (
                              <div key={reply.id} className="bg-gray-50 rounded p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium text-sm">User #{reply.author}</p>
                                    <p className="text-xs text-gray-500">{formatDate(reply.created_at)}</p>
                                  </div>
                                  <button
                                    className="flex items-center space-x-1 text-sm hover:text-red-500"
                                    onClick={() => handleLikeComment(reply.id)}
                                  >
                                    <Heart className="h-3 w-3" />
                                    <span>{reply.likes_count}</span>
                                  </button>
                                </div>
                                <p className="text-gray-700">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <button className="text-sm text-blue-600 hover:underline mt-2">
                          <Reply className="h-3 w-3 inline mr-1" />
                          Reply
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}