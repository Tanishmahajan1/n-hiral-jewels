import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStore } from '@netlify/blobs';
import bcrypt from 'bcryptjs';
import { ADMIN_PASSWORD, ADMIN_USERNAME } from './config.js';

const localPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/store.json');
const seedProducts = [
  { name: 'Aurora Chandelier', category: 'Earrings', material: '18K Gold', stone: 'Natural Diamonds', price: 185000, image: 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=1000&q=85', description: 'A refined chandelier silhouette for evening occasions.', stock: 8, featured: 1 },
  { name: 'Meher Polki Jhumka', category: 'Jhumkas', material: '22K Gold', stone: 'Polki & Pearls', price: 240000, image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1000&q=85', description: 'Heritage-inspired polki craftsmanship with a contemporary finish.', stock: 5, featured: 1 },
  { name: 'Vanya Leaf Drops', category: 'Earrings', material: '18K Gold', stone: 'Cubic Zirconia', price: 78000, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85', description: 'A sculptural everyday drop with a delicate leaf profile.', stock: 12, featured: 0 }
];

function initialData() {
  return {
    nextProductId: 4,
    nextEnquiryId: 1,
    admins: [{ id: 1, username: ADMIN_USERNAME, password_hash: bcrypt.hashSync(ADMIN_PASSWORD, 12) }],
    products: seedProducts.map((p, i) => ({ ...p, id: i + 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })),
    enquiries: []
  };
}

const isNetlify = Boolean(process.env.NETLIFY || process.env.NETLIFY_DEV);
let memoryData;

async function localRead() {
  try { return JSON.parse(await fs.readFile(localPath, 'utf8')); } catch { return initialData(); }
}
async function localWrite(data) {
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, JSON.stringify(data, null, 2));
}

async function readData() {
  if (!isNetlify) {
    if (!memoryData) memoryData = await localRead();
    return memoryData;
  }
  const store = getStore('hiral-jewels-data');
  const data = await store.get('database', { type: 'json' });
  if (data) return data;
  const fresh = initialData();
  await store.setJSON('database', fresh);
  return fresh;
}

async function writeData(data) {
  if (!isNetlify) { memoryData = data; await localWrite(data); return; }
  await getStore('hiral-jewels-data').setJSON('database', data);
}

export const store = {
  async findAdmin(username) { return (await readData()).admins.find(a => a.username === username) || null; },
  async getProducts() { return [...(await readData()).products].sort((a,b) => Number(b.featured)-Number(a.featured) || b.id-a.id); },
  async getProduct(id) { return (await readData()).products.find(p => String(p.id) === String(id)) || null; },
  async createProduct(p) {
    const data = await readData(); const now = new Date().toISOString();
    const item = { id: data.nextProductId++, name:p.name, category:p.category, material:p.material||'', stone:p.stone||'', price:Number(p.price), image:p.image||'', description:p.description||'', stock:Number(p.stock||0), featured:p.featured?1:0, created_at:now, updated_at:now };
    data.products.push(item); await writeData(data); return item;
  },
  async updateProduct(id, p) {
    const data = await readData(); const item = data.products.find(x => String(x.id) === String(id));
    if (!item) return null;
    Object.assign(item, { name:p.name, category:p.category, material:p.material||'', stone:p.stone||'', price:Number(p.price), image:p.image||'', description:p.description||'', stock:Number(p.stock||0), featured:p.featured?1:0, updated_at:new Date().toISOString() });
    await writeData(data); return item;
  },
  async deleteProduct(id) {
    const data = await readData(); const before = data.products.length; data.products = data.products.filter(x => String(x.id) !== String(id));
    if (data.products.length === before) return false; await writeData(data); return true;
  },
  async createEnquiry({name,phone,email,message}) {
    const data = await readData(); const item = { id:data.nextEnquiryId++, name, phone, email, message, status:'new', created_at:new Date().toISOString() };
    data.enquiries.unshift(item); await writeData(data); return item;
  },
  async getEnquiries() { return (await readData()).enquiries; },
  async updateEnquiryStatus(id,status) {
    const data = await readData(); const item = data.enquiries.find(x => String(x.id) === String(id));
    if (!item) return null; item.status=status; await writeData(data); return item;
  }
};
