// Servidor de TESTE da sincronização — emula o subconjunto do Supabase que o
// Planner Jurídico usa (Auth por e-mail/senha + tabela planner_state).
//
// NÃO é o servidor de produção: em produção o app fala com o Supabase real
// (ver docs/sincronizacao.md). Este processo existe só para validar a
// sincronização entre dois "aparelhos" sem depender de conta externa.
//
// Endpoints:
//   POST /auth/v1/signup                     {email,password}
//   POST /auth/v1/token?grant_type=password  {email,password}
//   POST /auth/v1/token?grant_type=refresh_token {refresh_token}
//   GET  /rest/v1/planner_state?select=doc,rev,updated_at&user_id=eq.<uuid>
//   POST /rest/v1/planner_state              [{user_id,doc,rev}]
//   PATCH /rest/v1/planner_state?user_id=eq.<uuid>&rev=eq.<n>  {doc,rev,updated_at}
//   DELETE /rest/v1/planner_state?user_id=eq.<uuid>
//   GET  /health
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const PORT = Number(process.env.PORT || 8787);
const DB_FILE = process.env.DB_FILE || '/data/db.json';

let db = { users: [], rows: [], tokens: {} };
try { db = JSON.parse(readFileSync(DB_FILE, 'utf8')); } catch (e) { /* primeiro boot */ }
function persistDb() {
  try { mkdirSync('/data', { recursive: true }); writeFileSync(DB_FILE, JSON.stringify(db)); } catch (e) { console.error('db write', e.message); }
}
const hash = (s) => createHash('sha256').update(String(s)).digest('hex');
const uuid = () => randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

function send(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS' });
  res.end(body === undefined ? '' : JSON.stringify(body));
}
function session(user) {
  const access = randomBytes(24).toString('hex');
  const refresh = randomBytes(24).toString('hex');
  const exp = Date.now() + 3600 * 1000;
  db.tokens[access] = { userId: user.id, exp };
  db.tokens[refresh] = { userId: user.id, exp: Date.now() + 30 * 86400000, refresh: true };
  persistDb();
  return { access_token: access, token_type: 'bearer', expires_in: 3600, refresh_token: refresh, user: { id: user.id, email: user.email } };
}
function bearer(req) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  const rec = db.tokens[t];
  if (!rec || rec.exp < Date.now()) return null;
  return rec.userId;
}
function q(url) {
  const out = {};
  new URLSearchParams(url.split('?')[1] || '').forEach((v, k) => { out[k] = v; });
  return out;
}
const eqVal = (v) => (v && v.startsWith('eq.') ? v.slice(3) : null);

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  const url = req.url || '/';
  const path = url.split('?')[0];
  let body = '';
  req.on('data', (c) => { body += c; });
  await new Promise((r) => req.on('end', r));
  let json = null;
  try { json = body ? JSON.parse(body) : null; } catch (e) { return send(res, 400, { message: 'JSON inválido' }); }

  try {
    if (path === '/health') return send(res, 200, { ok: true, users: db.users.length, rows: db.rows.length });

    if (path === '/auth/v1/signup' && req.method === 'POST') {
      const email = String(json?.email || '').toLowerCase();
      const password = String(json?.password || '');
      if (!email || password.length < 6) return send(res, 422, { message: 'E-mail e senha (mínimo 6 caracteres) são obrigatórios' });
      if (db.users.some((u) => u.email === email)) return send(res, 422, { message: 'E-mail já cadastrado' });
      const user = { id: uuid(), email, pass: hash(password), created: new Date().toISOString() };
      db.users.push(user); persistDb();
      return send(res, 200, { id: user.id, email });
    }

    if (path === '/auth/v1/token' && req.method === 'POST') {
      const p = q(url);
      if (p.grant_type === 'refresh_token') {
        const rec = db.tokens[String(json?.refresh_token || '')];
        const user = rec && db.users.find((u) => u.id === rec.userId);
        if (!user) return send(res, 400, { error: 'invalid_grant', error_description: 'Refresh token inválido' });
        return send(res, 200, session(user));
      }
      const user = db.users.find((u) => u.email === String(json?.email || '').toLowerCase());
      if (!user || user.pass !== hash(json?.password)) return send(res, 400, { error: 'invalid_grant', error_description: 'E-mail ou senha inválidos' });
      return send(res, 200, session(user));
    }

    if (path === '/rest/v1/planner_state') {
      const uid = bearer(req);
      if (!uid) return send(res, 401, { message: 'Não autenticado' });
      const p = q(url);
      const filterUser = eqVal(p.user_id);
      if (filterUser && filterUser !== uid) return send(res, 403, { message: 'Acesso negado a dados de outro usuário' });

      if (req.method === 'GET') {
        const row = db.rows.find((r) => r.user_id === uid);
        return send(res, 200, row ? [row] : []);
      }
      if (req.method === 'POST') {
        const item = Array.isArray(json) ? json[0] : json;
        if (!item || item.user_id !== uid) return send(res, 403, { message: 'user_id deve ser o usuário autenticado' });
        if (db.rows.some((r) => r.user_id === uid)) return send(res, 409, { message: 'Registro já existe' });
        const row = { user_id: uid, doc: item.doc || {}, rev: item.rev || 1, updated_at: new Date().toISOString() };
        db.rows.push(row); persistDb();
        return send(res, 201, [row]);
      }
      if (req.method === 'PATCH') {
        const row = db.rows.find((r) => r.user_id === uid);
        if (!row) return send(res, 200, []);
        const wantRev = eqVal(p.rev);
        if (wantRev !== null && Number(wantRev) !== row.rev) return send(res, 200, []);
        row.doc = json?.doc !== undefined ? json.doc : row.doc;
        row.rev = json?.rev !== undefined ? json.rev : row.rev + 1;
        row.updated_at = new Date().toISOString();
        persistDb();
        return send(res, 200, [row]);
      }
      if (req.method === 'DELETE') {
        db.rows = db.rows.filter((r) => r.user_id !== uid);
        persistDb();
        return send(res, 200, []);
      }
    }
    return send(res, 404, { message: 'rota não encontrada: ' + path });
  } catch (e) {
    console.error(e);
    return send(res, 500, { message: String(e.message || e) });
  }
});
server.listen(PORT, '0.0.0.0', () => console.log('sync-server (teste) em :' + PORT));
