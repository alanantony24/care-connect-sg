
DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;

REVOKE EXECUTE ON FUNCTION public.notify_application_accepted() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_review_created() FROM PUBLIC, anon, authenticated;
