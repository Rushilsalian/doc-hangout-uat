-- Check all current RLS policies for posts table
SELECT 
    schemaname,
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'posts'
ORDER BY cmd, policyname;

-- Check if RLS is enabled on posts table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'posts' AND schemaname = 'public';