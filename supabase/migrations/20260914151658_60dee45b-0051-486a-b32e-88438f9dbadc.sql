REVOKE EXECUTE ON FUNCTION public.user_has_paid_access_env(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_has_paid_access(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_plan_tier(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_plan_tier_owner(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_can_upload_document(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_shared_brief(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.revoke_media_share(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enforce_document_quota() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.user_has_paid_access_env(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_has_paid_access(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_plan_tier(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_plan_tier_owner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_can_upload_document(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_shared_brief(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_media_share(text) TO authenticated;