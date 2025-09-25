# API Reference Guide

## Overview

Med-Thread-AI uses Supabase as the backend service, providing a PostgreSQL database with real-time capabilities, authentication, and row-level security. The frontend interacts with the database through custom React hooks that encapsulate business logic and data management.

## Authentication API

### useAuth Hook

The authentication system manages user sessions and profile creation.

#### Interface
```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}
```

#### Methods

##### signUp
Creates a new user account with optional display name.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password (min 6 characters)
- `displayName` (string, optional): Public display name

**Returns:**
```typescript
Promise<{ error: AuthError | null }>
```

**Example:**
```typescript
const { signUp } = useAuth();
const result = await signUp('doctor@hospital.com', 'securePassword', 'Dr. Smith');
if (result.error) {
  console.error('Signup failed:', result.error.message);
}
```

##### signIn
Authenticates existing user with email and password.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password

**Returns:**
```typescript
Promise<{ error: AuthError | null }>
```

##### signOut
Logs out the current user and clears session.

**Returns:**
```typescript
Promise<void>
```

---

## Posts API

### usePosts Hook

Manages post creation, retrieval, and voting functionality.

#### Interface
```typescript
interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  community_id: string | null;
  created_at: string;
  updated_at: string;
  is_ai_summary: boolean;
  upvotes: number;
  downvotes: number;
  status: string;
  author: PostAuthor;
  community?: Community;
  post_tags: PostTag[];
  comments: { count: number }[];
  user_vote?: { vote_type: string } | null;
}
```

#### Methods

##### fetchPosts
Retrieves posts with optional community filtering.

**Parameters:**
- `communityId` (string, optional): Filter posts by community

**Returns:**
```typescript
{
  posts: Post[];
  loading: boolean;
  createPost: Function;
  voteOnPost: Function;
  refetch: Function;
}
```

**Example:**
```typescript
const { posts, loading } = usePosts('cardiology-community-id');
```

##### createPost
Creates a new discussion post.

**Parameters:**
```typescript
{
  title: string;
  content: string;
  community_id?: string;
  tags?: string[];
}
```

**Returns:**
```typescript
Promise<boolean> // Success status
```

**Example:**
```typescript
const { createPost } = usePosts();
const success = await createPost({
  title: 'New Treatment Protocol',
  content: 'Discussion about recent advances...',
  community_id: 'cardiology-id',
  tags: ['treatment', 'protocol', 'research']
});
```

##### voteOnPost
Casts or updates a vote on a post.

**Parameters:**
- `postId` (string): Target post ID
- `voteType` ('upvote' | 'downvote'): Vote direction

**Returns:**
```typescript
Promise<boolean> // Success status
```

**Behavior:**
- First vote: Creates new vote
- Same vote type: Removes existing vote
- Different vote type: Updates existing vote

---

## Communities API

### useCommunities Hook

Manages community operations including joining, leaving, and creation.

#### Interface
```typescript
interface Community {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  color: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  member_count?: number;
  post_count?: number;
  is_member?: boolean;
}
```

#### Methods

##### fetchCommunities
Retrieves all active communities with membership status.

**Returns:**
```typescript
{
  communities: Community[];
  loading: boolean;
  joinCommunity: Function;
  leaveCommunity: Function;
  createCommunity: Function;
  refetch: Function;
}
```

##### joinCommunity
Adds current user to a community.

**Parameters:**
- `communityId` (string): Target community ID

**Returns:**
```typescript
Promise<boolean> // Success status
```

**Example:**
```typescript
const { joinCommunity } = useCommunities();
const success = await joinCommunity('cardiology-community-id');
```

##### leaveCommunity
Removes current user from a community.

**Parameters:**
- `communityId` (string): Target community ID

**Returns:**
```typescript
Promise<boolean> // Success status
```

##### createCommunity
Creates a new medical specialty community.

**Parameters:**
```typescript
{
  name: string;
  description: string;
}
```

**Returns:**
```typescript
Promise<boolean> // Success status
```

**Example:**
```typescript
const { createCommunity } = useCommunities();
const success = await createCommunity({
  name: 'Emergency Medicine',
  description: 'Discussion for emergency medicine professionals'
});
```

---

## Messaging API

### useMessages Hook

Handles private messaging between healthcare professionals.

#### Interface
```typescript
interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  created_at: string;
  updated_at: string;
  other_participant: {
    id: string;
    display_name: string | null;
    specialization: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  is_moderated: boolean;
}
```

#### Methods

##### fetchConversations
Retrieves user's conversations with unread counts.

**Returns:**
```typescript
{
  conversations: Conversation[];
  messages: Message[];
  selectedConversationId: string | null;
  loading: boolean;
  messagesLoading: boolean;
  createOrGetConversation: Function;
  sendMessage: Function;
  selectConversation: Function;
  refetch: Function;
}
```

##### createOrGetConversation
Creates new conversation or returns existing one.

**Parameters:**
- `otherUserId` (string): Other participant's profile ID

**Returns:**
```typescript
Promise<string | null> // Conversation ID or null if failed
```

##### sendMessage
Sends a message in a conversation.

**Parameters:**
- `conversationId` (string): Target conversation ID
- `content` (string): Message text

**Returns:**
```typescript
Promise<boolean> // Success status
```

**Example:**
```typescript
const { sendMessage } = useMessages();
const success = await sendMessage('conversation-id', 'Hello, colleague!');
```

##### selectConversation
Loads messages for a specific conversation and marks them as read.

**Parameters:**
- `conversationId` (string): Target conversation ID

**Side Effects:**
- Loads messages into state
- Marks unread messages as read
- Updates conversation selection

---

## Comments API

### useComments Hook

Manages threaded comments on posts.

#### Interface
```typescript
interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  author: {
    display_name: string | null;
    specialization: string | null;
    is_verified: boolean | null;
  };
  replies?: Comment[];
}
```

#### Methods

##### fetchComments
Retrieves comments for a specific post with threading.

**Parameters:**
- `postId` (string): Target post ID

**Returns:**
```typescript
{
  comments: Comment[];
  loading: boolean;
  createComment: Function;
  refetch: Function;
}
```

##### createComment
Adds a new comment or reply to a post.

**Parameters:**
```typescript
{
  postId: string;
  content: string;
  parentCommentId?: string; // For replies
}
```

**Returns:**
```typescript
Promise<boolean> // Success status
```

**Example:**
```typescript
const { createComment } = useComments(postId);

// Top-level comment
await createComment({
  postId: 'post-id',
  content: 'Great insights on this topic!'
});

// Reply to comment
await createComment({
  postId: 'post-id',
  content: 'I agree with your assessment.',
  parentCommentId: 'parent-comment-id'
});
```

---

## Karma System API

### useKarma Hook

Manages user reputation and activity tracking.

#### Interface
```typescript
interface KarmaActivity {
  id: string;
  user_id: string;
  activity_type: string;
  points: number;
  description: string | null;
  created_at: string;
}
```

#### Methods

##### getUserKarma
Retrieves user's total karma points and recent activities.

**Parameters:**
- `userId` (string, optional): Target user ID (defaults to current user)

**Returns:**
```typescript
{
  totalKarma: number;
  recentActivities: KarmaActivity[];
  loading: boolean;
}
```

##### addKarmaActivity
Records a karma-earning activity.

**Parameters:**
```typescript
{
  userId: string;
  activityType: string;
  points: number;
  description?: string;
}
```

**Activity Types:**
- `GIVE_UPVOTE`: +1 point
- `RECEIVE_UPVOTE`: +5 points
- `CREATE_POST`: +2 points
- `CREATE_COMMENT`: +1 point
- `DAILY_LOGIN`: +1 point

---

## Verification API

### verificationService

Handles medical license and credential verification.

#### Methods

##### verifyDoctor
Comprehensive verification of healthcare professional credentials.

**Parameters:**
```typescript
{
  licenseNumber: string;
  npi?: string;
  state: string;
  institution: string;
  document: File;
}
```

**Returns:**
```typescript
Promise<VerificationResult>

interface VerificationResult {
  isValid: boolean;
  confidence: number;
  details: {
    licenseValid?: boolean;
    npiValid?: boolean;
    documentValid?: boolean;
    institutionValid?: boolean;
  };
  errors?: string[];
}
```

##### verifyNPI
Validates National Provider Identifier against CMS registry.

**Parameters:**
- `npi` (string): 10-digit NPI number

**Returns:**
```typescript
Promise<boolean>
```

##### verifyMedicalLicense
Checks medical license with state medical boards.

**Parameters:**
- `licenseNumber` (string): State medical license number
- `state` (string): State abbreviation (e.g., 'CA', 'NY', 'TX')

**Returns:**
```typescript
Promise<boolean>
```

**Supported States:**
- California (CA)
- New York (NY)
- Texas (TX)

---

## Real-time Subscriptions

### Supabase Real-time Features

The platform uses Supabase real-time subscriptions for live updates.

#### Post Updates
```typescript
// Subscribe to new posts in a community
const subscription = supabase
  .channel('posts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'posts',
    filter: `community_id=eq.${communityId}`
  }, (payload) => {
    // Handle new post
    console.log('New post:', payload.new);
  })
  .subscribe();
```

#### Message Updates
```typescript
// Subscribe to new messages in conversations
const subscription = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    // Handle new message
    console.log('New message:', payload.new);
  })
  .subscribe();
```

#### Vote Updates
```typescript
// Subscribe to vote changes on posts
const subscription = supabase
  .channel('votes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'post_votes'
  }, (payload) => {
    // Handle vote changes
    console.log('Vote update:', payload);
  })
  .subscribe();
```

---

## Error Handling

### Common Error Patterns

#### Authentication Errors
```typescript
// Handle auth errors
const { signIn } = useAuth();
try {
  const result = await signIn(email, password);
  if (result.error) {
    switch (result.error.message) {
      case 'Invalid login credentials':
        setError('Incorrect email or password');
        break;
      case 'Email not confirmed':
        setError('Please check your email and confirm your account');
        break;
      default:
        setError('Login failed. Please try again.');
    }
  }
} catch (error) {
  setError('Network error. Please check your connection.');
}
```

#### Database Errors
```typescript
// Handle database constraint violations
try {
  await createPost(postData);
} catch (error) {
  if (error.code === '23505') {
    // Unique constraint violation
    toast({ title: 'Duplicate entry', variant: 'destructive' });
  } else if (error.code === '23503') {
    // Foreign key constraint violation
    toast({ title: 'Invalid reference', variant: 'destructive' });
  } else {
    toast({ title: 'Database error', variant: 'destructive' });
  }
}
```

#### Network Errors
```typescript
// Handle network connectivity issues
const handleNetworkError = (error: Error) => {
  if (error.message.includes('fetch')) {
    toast({
      title: 'Connection Error',
      description: 'Please check your internet connection',
      variant: 'destructive'
    });
  }
};
```

---

## Rate Limiting & Quotas

### Supabase Limits

#### Database Operations
- **Queries per minute**: 1000 (free tier)
- **Concurrent connections**: 60 (free tier)
- **Database size**: 500MB (free tier)

#### Authentication
- **Users**: 50,000 (free tier)
- **Login attempts**: Rate limited per IP

#### Real-time
- **Concurrent connections**: 200 (free tier)
- **Messages per second**: 100 (free tier)

### Client-side Rate Limiting

```typescript
// Implement debouncing for search
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (searchTerm: string) => {
    // Perform search
    searchPosts(searchTerm);
  },
  300 // 300ms delay
);
```

---

## Security Considerations

### Row Level Security (RLS)

All database operations are protected by RLS policies:

```sql
-- Example: Users can only update their own profiles
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);
```

### Input Validation

```typescript
// Validate post content
const validatePost = (title: string, content: string) => {
  if (title.length < 5 || title.length > 200) {
    throw new Error('Title must be 5-200 characters');
  }
  if (content.length < 10 || content.length > 10000) {
    throw new Error('Content must be 10-10000 characters');
  }
  // Additional validation...
};
```

### Content Moderation

```typescript
// Check content before posting
const moderateContent = async (content: string) => {
  const analysis = await analyzeContent(content);
  if (analysis.toxicity > 0.8) {
    throw new Error('Content violates community guidelines');
  }
  return analysis;
};
```

---

## Performance Optimization

### Caching Strategy

```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

### Pagination

```typescript
// Implement cursor-based pagination
const usePaginatedPosts = (communityId?: string) => {
  const [cursor, setCursor] = useState<string | null>(null);
  
  const fetchPosts = async () => {
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (cursor) {
      query = query.lt('created_at', cursor);
    }
    
    const { data } = await query;
    return data;
  };
};
```

### Optimistic Updates

```typescript
// Update UI immediately, rollback on error
const optimisticVote = async (postId: string, voteType: 'upvote' | 'downvote') => {
  // Update UI immediately
  updatePostVoteOptimistically(postId, voteType);
  
  try {
    await voteOnPost(postId, voteType);
  } catch (error) {
    // Rollback on error
    revertOptimisticUpdate(postId);
    throw error;
  }
};
```

This API reference provides comprehensive documentation for all the major functionality in the Med-Thread-AI platform, including authentication, content management, messaging, and verification systems.