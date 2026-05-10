-- Public storage bucket for voice messages
insert into storage.buckets (id, name, public)
values ('voice-messages', 'voice-messages', true)
on conflict (id) do nothing;

-- Anyone authenticated can upload to their own folder; reads are public
create policy "Voice messages are publicly readable"
on storage.objects for select
using (bucket_id = 'voice-messages');

create policy "Users can upload their own voice messages"
on storage.objects for insert
with check (
  bucket_id = 'voice-messages'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own voice messages"
on storage.objects for delete
using (
  bucket_id = 'voice-messages'
  and auth.uid()::text = (storage.foldername(name))[1]
);
