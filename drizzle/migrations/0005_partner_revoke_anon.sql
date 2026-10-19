REVOKE ALL ON public.partner_orgs FROM anon;
REVOKE ALL ON public.partner_members FROM anon;
REVOKE ALL ON public.partner_patient_links FROM anon;
REVOKE ALL ON FUNCTION public.get_partner_patients(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_partner_sponsorship() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_partner_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_partner_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_partner_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_partner_admin(uuid, uuid) TO authenticated, service_role;