-- Allow creators to see their groups so INSERT ... RETURNING works
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'group_conversations' AND policyname = 'Creators can view their groups'
  ) THEN
    CREATE POLICY "Creators can view their groups"
    ON public.group_conversations
    FOR SELECT
    USING (auth.uid() = created_by);
  END IF;
END $$;

-- Allow group creators to add members to their group (in addition to users adding themselves)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'group_members' AND policyname = 'Group creators can add members'
  ) THEN
    CREATE POLICY "Group creators can add members"
    ON public.group_members
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.group_conversations gc
        WHERE gc.id = group_members.group_id AND gc.created_by = auth.uid()
      )
    );
  END IF;
END $$;