// Vercel serverless function wrapper for Express API.
// We rewrite /api/* -> /api?path=* in vercel.json, then restore req.url here
// so Express can match its normal /api/... routes.
import app from '../server/index.js';

export default function handler(req, res) {
  const rawPath = req.query?.path;
  const path = Array.isArray(rawPath) ? rawPath.join('/') : rawPath;

  if (path) {
    const params = new URLSearchParams(req.query);
    params.delete('path');
    const qs = params.toString();
    req.url = `/api/${path}${qs ? `?${qs}` : ''}`;
  }

  return app(req, res);
}
