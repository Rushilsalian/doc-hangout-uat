import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostCard } from '@/components/enhanced/PostCard';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/use-toast');
jest.mock('@/hooks/useSavedPosts');
jest.mock('@/integrations/supabase/client');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockToast = toast as jest.MockedFunction<typeof toast>;

const mockPost = {
  id: 'test-post-id',
  title: 'Test Post',
  content: 'This is a test post content',
  author_id: 'test-user-id',
  community_id: null,
  category: 'general',
  post_type: 'text',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  is_ai_summary: false,
  upvotes: 5,
  downvotes: 1,
  status: 'published',
  author: {
    id: 'test-user-id',
    display_name: 'Test User',
    avatar_url: null,
    specialization: 'Cardiology',
    is_verified: true
  },
  post_tags: [],
  comments: [],
  user_vote: null
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Post Delete Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows delete button only for post author', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id' },
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    });

    const mockOnDelete = jest.fn();

    render(
      <PostCard 
        post={mockPost} 
        onDelete={mockOnDelete}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('does not show delete button for non-author', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'different-user-id' },
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    });

    const mockOnDelete = jest.fn();

    render(
      <PostCard 
        post={mockPost} 
        onDelete={mockOnDelete}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked and confirmed', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id' },
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    });

    const mockOnDelete = jest.fn();
    
    // Mock window.confirm to return true
    window.confirm = jest.fn(() => true);

    render(
      <PostCard 
        post={mockPost} 
        onDelete={mockOnDelete}
      />,
      { wrapper: createWrapper() }
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this post? This action cannot be undone.'
      );
      expect(mockOnDelete).toHaveBeenCalledWith('test-post-id');
    });
  });

  it('does not call onDelete when delete is cancelled', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id' },
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    });

    const mockOnDelete = jest.fn();
    
    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false);

    render(
      <PostCard 
        post={mockPost} 
        onDelete={mockOnDelete}
      />,
      { wrapper: createWrapper() }
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });
});