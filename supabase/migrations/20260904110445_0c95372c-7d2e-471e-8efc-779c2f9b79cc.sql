CREATE TABLE public.mail_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  display_name TEXT,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, email_address)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mail_accounts TO authenticated;
GRANT ALL ON public.mail_accounts TO service_role;
ALTER TABLE public.mail_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own mail accounts" ON public.mail_accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.mail_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  account_id UUID REFERENCES public.mail_accounts ON DELETE CASCADE,
  folder TEXT NOT NULL DEFAULT 'inbox',
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX mail_messages_user_folder_idx ON public.mail_messages (user_id, folder, sent_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mail_messages TO authenticated;
GRANT ALL ON public.mail_messages TO service_role;
ALTER TABLE public.mail_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own mail messages" ON public.mail_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);