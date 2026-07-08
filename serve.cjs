const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, 'dist');
const PORT = process.env.PORT || 5000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

function serve(res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      const fallback = path.join(DIST, 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(fallback).pipe(res);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0].split('#')[0];
  const filePath = path.join(DIST, urlPath);
  if (!filePath.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
  if (urlPath.endsWith('/')) {
    serve(res, path.join(filePath, 'index.html'));
  } else {
    serve(res, filePath);
  }
}).listen(PORT, '0.0.0.0', () => console.log(`Cretivo serving on :${PORT}`));
