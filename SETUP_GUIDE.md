# Setup & Deployment Guide

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (or yarn/pnpm equivalent)
- **Git**: For version control
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

### Development Tools (Recommended)
- **VS Code**: With TypeScript and Tailwind CSS extensions
- **Supabase CLI**: For database management
- **Postman**: For API testing

## Local Development Setup

### 1. Clone Repository
```bash
git clone <YOUR_GIT_URL>
cd med-thread-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Development settings
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
```

**Getting Supabase Credentials:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Navigate to Settings > API
4. Copy the Project URL and anon/public key

### 4. Database Setup

#### Option A: Using Supabase CLI (Recommended)
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push database schema
supabase db push
```

#### Option B: Manual Migration
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run each migration file in order:
   - `20250904081534_4c28336e-0bf7-44f1-aa00-6dff06826e69.sql`
   - `20250904081554_69eab2d7-e140-404b-ad2c-a2b4c883b4aa.sql`
   - `20250905045634_69158d91-bc97-4e15-9a30-6c8489211a11.sql`
   - `20250905045653_db119e4b-93d8-4678-bbaa-44b518cb5a95.sql`
   - `20250905045714_f1388bdb-7117-41b5-bf69-7bf3d3b5e1f3.sql`
   - `20250905045940_e8804e8b-ef3c-44b3-b328-c75b54ead16f.sql`

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Production Deployment

### Deployment Options

#### Option 1: Lovable Platform (Recommended)
The project is configured for deployment on Lovable:

1. Visit [Lovable Project](https://lovable.dev/projects/a03ccabb-6cec-4b1c-9bd1-83d6285b4222)
2. Click Share → Publish
3. Your app will be deployed automatically

#### Option 2: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
```

#### Option 3: Netlify
```bash
# Build the project
npm run build

# Deploy to Netlify
# Upload the 'dist' folder to Netlify
# Set environment variables in Netlify dashboard
```

#### Option 4: Custom Server
```bash
# Build for production
npm run build

# Serve static files
# Copy 'dist' folder to your web server
# Configure environment variables
```

### Environment Variables for Production

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_APP_ENV=production
```

## Database Configuration

### Supabase Project Setup

#### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and set project details
4. Wait for project initialization

#### 2. Configure Authentication
```sql
-- Enable email authentication
-- Go to Authentication > Settings
-- Enable "Enable email confirmations"
-- Set site URL to your domain
```

#### 3. Set Up Row Level Security
All tables should have RLS enabled (done by migrations):
```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

#### 4. Configure Storage (Optional)
For file uploads (profile pictures, documents):
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Set up storage policies
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');
```

### Database Backup & Recovery

#### Automated Backups
Supabase provides automatic daily backups for paid plans.

#### Manual Backup
```bash
# Using Supabase CLI
supabase db dump --file backup.sql

# Restore from backup
supabase db reset --file backup.sql
```

## Security Configuration

### Authentication Settings

#### Email Templates
Customize in Supabase Dashboard > Authentication > Email Templates:

**Confirm Signup:**
```html
<h2>Welcome to Med-Thread-AI</h2>
<p>Click the link below to confirm your account:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Account</a></p>
```

**Reset Password:**
```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

#### JWT Settings
```json
{
  "JWT_EXPIRY": 3600,
  "JWT_SECRET": "your-jwt-secret",
  "SITE_URL": "https://your-domain.com"
}
```

### Content Security Policy

Add to your hosting platform:
```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://your-project.supabase.co; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  connect-src 'self' https://your-project.supabase.co wss://your-project.supabase.co;
```

## Performance Optimization

### Build Optimization

#### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

#### Bundle Analysis
```bash
# Analyze bundle size
npm run build -- --analyze
```

### Database Performance

#### Indexes
Ensure these indexes exist (created by migrations):
```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_posts_community_created 
ON posts(community_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_messages_conversation_created 
ON messages(conversation_id, created_at);

CREATE INDEX CONCURRENTLY idx_karma_user_created 
ON karma_activities(user_id, created_at DESC);
```

#### Query Optimization
```typescript
// Use select() to limit returned columns
const { data } = await supabase
  .from('posts')
  .select('id, title, created_at, author:profiles(display_name)')
  .limit(20);

// Use filters to reduce data transfer
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'published')
  .gte('created_at', '2024-01-01');
```

### CDN Configuration

#### Static Assets
```typescript
// vite.config.ts - Configure asset handling
export default defineConfig({
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  }
});
```

## Monitoring & Analytics

### Error Tracking

#### Sentry Integration
```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.VITE_APP_ENV,
  tracesSampleRate: 1.0,
});
```

#### Custom Error Boundary
```typescript
// ErrorBoundary.tsx
import { ErrorBoundary } from "@sentry/react";

const MyErrorBoundary = ({ children }) => (
  <ErrorBoundary fallback={ErrorFallback} showDialog>
    {children}
  </ErrorBoundary>
);
```

### Performance Monitoring

#### Web Vitals
```typescript
// utils/analytics.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric) => {
  // Send to your analytics service
  console.log(metric);
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Database Monitoring

#### Supabase Dashboard
Monitor in Supabase Dashboard:
- Database usage and performance
- API request patterns
- Authentication metrics
- Real-time connection counts

#### Custom Metrics
```typescript
// Track custom events
const trackEvent = (eventName: string, properties: object) => {
  // Send to analytics service
  if (import.meta.env.PROD) {
    analytics.track(eventName, properties);
  }
};

// Usage
trackEvent('post_created', { 
  community_id: communityId,
  has_tags: tags.length > 0 
});
```

## Maintenance & Updates

### Regular Maintenance Tasks

#### Weekly
- Review error logs and fix critical issues
- Monitor database performance metrics
- Check for security updates in dependencies

#### Monthly
- Update dependencies: `npm update`
- Review and optimize database queries
- Backup database and test restore procedures
- Review user feedback and plan improvements

#### Quarterly
- Security audit of authentication and authorization
- Performance review and optimization
- Update documentation
- Plan new features based on user needs

### Dependency Updates

#### Safe Update Process
```bash
# Check for outdated packages
npm outdated

# Update non-breaking changes
npm update

# Update major versions carefully
npm install package@latest

# Test thoroughly after updates
npm run build
npm run test
```

#### Security Updates
```bash
# Check for security vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Review and fix manually if needed
npm audit fix --force
```

## Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

#### Database Connection Issues
```typescript
// Check Supabase connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};
```

#### Authentication Problems
```typescript
// Debug auth state
const debugAuth = () => {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    console.log('Session:', session);
  });
};
```

### Performance Issues

#### Slow Queries
```sql
-- Enable query logging in Supabase
-- Check slow query log in Dashboard > Logs

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM posts 
WHERE community_id = 'uuid' 
ORDER BY created_at DESC 
LIMIT 20;
```

#### Memory Leaks
```typescript
// Cleanup subscriptions
useEffect(() => {
  const subscription = supabase
    .channel('posts')
    .on('postgres_changes', { ... }, handler)
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Support & Resources

### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)

### Community
- [Supabase Discord](https://discord.supabase.com)
- [React Community](https://reactjs.org/community/support.html)

### Professional Support
For enterprise deployments or custom modifications, consider:
- Supabase Pro/Enterprise plans
- Professional React consulting services
- Custom development and maintenance contracts

This setup guide provides comprehensive instructions for deploying and maintaining the Med-Thread-AI platform in various environments.