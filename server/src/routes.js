import express from 'express';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { store } from './store.js';
import { createToken, requireAuth } from './auth.js';

const router = express.Router();

async function sendOwnerSms({ name, phone, message }) {
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_FROM_NUMBER;
  const to = process.env.OWNER_PHONE || '917389098246';
  if (!sid || !token || !from || !to) return { sent:false, reason:'Twilio SMS is not configured.' };
  const text = `Hiral Jewels enquiry: ${name} (${phone}). ${message}`.slice(0,1500);
  const params = new URLSearchParams({ To:to.startsWith('+')?to:`+${to}`, From:from, Body:text });
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, { method:'POST', headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'}, body:params });
  if (!response.ok) throw new Error(`Twilio returned ${response.status}`); return {sent:true};
}

let marketCache = { data:null, expiresAt:0 };
const parseMoney = value => { const n=Number(String(value||'').replace(/[^0-9.]/g,'')); return Number.isFinite(n)?n:null; };
const htmlToText = html => String(html||'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&#8377;/g,'₹').replace(/\s+/g,' ').trim();
async function getAIBRates() {
  const response=await fetch('https://allindiabullion.com/benchmark',{headers:{'User-Agent':'Hiral-Jewels/1.1'}});
  if(!response.ok) throw new Error(`All India Bullion returned ${response.status}`);
  const text=htmlToText(await response.text());
  const goldMatch=text.match(/Gold\s*999\s*\(24K\)[\s\S]{0,220}?₹\s*([0-9,]+)[\s\S]{0,80}?per\s*10\s*g/i);
  const silverMatch=text.match(/Silver\s*999[\s\S]{0,220}?₹\s*([0-9,]+)[\s\S]{0,80}?per\s*kg/i);
  const gold=parseMoney(goldMatch?.[1]), silver=parseMoney(silverMatch?.[1]);
  if(!gold || !silver) throw new Error('Could not parse AIB Gold/Silver independently');
  return { gold:{inrPer10g:Math.round(gold)}, silver:{inrPerKg:Math.round(silver)}, rateDate:new Date().toLocaleDateString('en-IN'), source:'All India Bullion · India-wide reference', note:'Gold 999 per 10g and Silver 999 per kg. Reference rates exclude GST, making charges and wastage.' };
}
router.get('/market/prices', async (_req,res)=>{ if(marketCache.data&&Date.now()<marketCache.expiresAt)return res.json(marketCache.data); try{const data=await getAIBRates(); marketCache={data,expiresAt:Date.now()+60000}; res.json(data);}catch(e){console.error(e);res.status(503).json({message:'All India Bullion rates are temporarily unavailable'});} });

router.post('/auth/login', async (req,res)=>{ const {username,password}=req.body||{}; const admin=await store.findAdmin(username); if(!admin||!bcrypt.compareSync(password||'',admin.password_hash))return res.status(401).json({message:'Invalid username or password'}); res.json({token:createToken(admin),admin:{id:admin.id,username:admin.username}}); });
router.get('/auth/me',requireAuth,(req,res)=>res.json({admin:req.admin}));

router.get('/products',async (_req,res)=>res.json(await store.getProducts()));
router.get('/products/:id',async (req,res)=>{const p=await store.getProduct(req.params.id); if(!p)return res.status(404).json({message:'Product not found'}); res.json(p);});
router.post('/products',requireAuth,async (req,res)=>{const p=req.body||{}; if(!p.name||!p.category||Number(p.price)<0)return res.status(400).json({message:'Name, category and valid price are required'}); res.status(201).json(await store.createProduct(p));});
router.put('/products/:id',requireAuth,async (req,res)=>{const p=await store.updateProduct(req.params.id,req.body||{}); if(!p)return res.status(404).json({message:'Product not found'}); res.json(p);});
router.delete('/products/:id',requireAuth,async (req,res)=>{if(!await store.deleteProduct(req.params.id))return res.status(404).json({message:'Product not found'});res.json({success:true});});

router.post('/orders/email',async(req,res)=>{const {customer={},items=[]}=req.body||{}; if(!items.length)return res.status(400).json({message:'Your bag is empty.'}); if(!customer.name||!customer.phone)return res.status(400).json({message:'Name and phone are required.'}); const recipient=process.env.ORDER_EMAIL_TO||'tanishmahajan1997@gmail.com'; const rows=items.map(i=>`• ${i.name} × ${Number(i.quantity||1)} | ${i.category||''} | ${i.material||''} | ${i.stone||''}`).join('\n'); const body=['New Hiral Jewels Bag Enquiry','',`Customer: ${customer.name}`,`Phone: ${customer.phone}`,`Email: ${customer.email||'Not provided'}`,'','Selected Products:',rows,'',`Message: ${customer.message||'No additional message'}`].join('\n'); try{if(!process.env.SMTP_HOST||!process.env.SMTP_USER||!process.env.SMTP_PASS)return res.status(503).json({message:'Email sending is not configured. Add SMTP settings in Netlify Environment variables.'}); const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:String(process.env.SMTP_SECURE||'false')==='true',auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}}); await transporter.sendMail({from:process.env.SMTP_FROM||process.env.SMTP_USER,to:recipient,replyTo:customer.email||undefined,subject:`Hiral Jewels Bag Enquiry — ${customer.name}`,text:body}); res.json({success:true,message:`Bag enquiry sent to ${recipient}.`});}catch(e){console.error(e);res.status(500).json({message:'Could not send the bag email. Please check SMTP settings.'});} });

router.post('/enquiries',async(req,res)=>{const {name,phone,email='',message=''}=req.body||{};if(!name||!phone)return res.status(400).json({message:'Name and phone are required'});const item=await store.createEnquiry({name,phone,email,message});let sms={sent:false};try{sms=await sendOwnerSms({name,phone,message});}catch(e){console.error(e);}res.status(201).json({id:item.id,success:true,smsSent:Boolean(sms.sent)});});
router.get('/enquiries',requireAuth,async(_req,res)=>res.json(await store.getEnquiries()));
router.patch('/enquiries/:id/status',requireAuth,async(req,res)=>{if(!['new','contacted','closed'].includes(req.body?.status))return res.status(400).json({message:'Invalid status'});const item=await store.updateEnquiryStatus(req.params.id,req.body.status);if(!item)return res.status(404).json({message:'Enquiry not found'});res.json(item);});

export default router;
