const fs = require('fs');
const path = require('path');

const PRODUCTS_PATH = path.join(process.cwd(), 'products.json');
const REPO = process.env.GITHUB_REPO || 'mrbeastvd30-source/shop';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const FILE_PATH = process.env.GITHUB_PRODUCTS_PATH || 'products.json';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1986';

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function normalizeProducts(payload) {
  const list = Array.isArray(payload?.products) ? payload.products : Array.isArray(payload) ? payload : [];
  return list
    .map((product) => ({
      id: Number(product.id) || Date.now(),
      name: String(product.name || '').trim(),
      category: ['men', 'women', 'kids'].includes(product.category) ? product.category : 'women',
      price: Number(product.price) || 0,
      oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
      discount: product.discount ? Number(product.discount) : 0,
      description: String(product.description || ''),
      sizes: Array.isArray(product.sizes)
        ? product.sizes
        : String(product.sizes || 'S,M,L,XL').split(',').map((size) => size.trim()).filter(Boolean),
      image: String(product.image || '')
    }))
    .filter((product) => product.name && product.price > 0);
}

function readLocalProducts() {
  try {
    return JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
  } catch {
    return { products: [] };
  }
}

async function githubRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `GitHub API ${response.status}`);
  }
  return data;
}

async function readGithubProducts() {
  const data = await githubRequest(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`);
  const content = Buffer.from(data.content || '', 'base64').toString('utf8');
  return { payload: JSON.parse(content || '{"products":[]}'), sha: data.sha };
}

async function writeGithubProducts(products) {
  if (!TOKEN) {
    throw new Error('GITHUB_TOKEN is not configured in Vercel environment variables');
  }
  const current = await readGithubProducts().catch(() => ({ sha: undefined }));
  const content = Buffer.from(JSON.stringify({ products }, null, 2)).toString('base64');
  await githubRequest(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Update shop products from admin panel',
      content,
      sha: current.sha,
      branch: BRANCH
    })
  });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      if (TOKEN) {
        const { payload } = await readGithubProducts();
        return send(res, 200, { products: normalizeProducts(payload), source: 'github' });
      }
      return send(res, 200, { products: normalizeProducts(readLocalProducts()), source: 'local' });
    }

    if (req.method === 'POST') {
      if (req.headers?.['x-admin-password'] !== ADMIN_PASSWORD) {
        return send(res, 401, { error: 'Unauthorized' });
      }
      const products = normalizeProducts(req.body || {});
      await writeGithubProducts(products);
      return send(res, 200, { products, source: 'github' });
    }

    res.setHeader('Allow', 'GET, POST');
    return send(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    return send(res, 500, { error: error.message || 'Products API error' });
  }
};
