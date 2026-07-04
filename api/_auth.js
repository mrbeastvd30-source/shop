const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lqzigxdjygbzkylhmrsq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_RLCfftqzPAWUV6oUJeDXkQ_R6DUhVEs';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'sabinastyle77@gmail.com').toLowerCase();

async function verifyAdminRequest(req) {
  const authorization = req.headers?.authorization || '';
  if (!authorization.startsWith('Bearer ')) return false;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: authorization
    }
  });
  if (!response.ok) return false;

  const user = await response.json().catch(() => ({}));
  return String(user.email || '').trim().toLowerCase() === ADMIN_EMAIL;
}

module.exports = { verifyAdminRequest };
