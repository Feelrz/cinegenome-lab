// CineGenome public link routing controlled from KAMISAMA.
// Uses the same Upstash credentials + CG_NOTES_ADMIN_TOKEN as Lab Notes.
const { timingSafeEqual } = require('node:crypto');
const CONFIG_KEY='cinegenome:site-config:v1';
const DEFAULTS={
  operatorArchiveUrl:'https://boxd.it/a35Ed',
  chiefResearcherUrl:'https://letterboxd.com/feelrz/'
};
function storageConfig(){
  const url=process.env.CG_NOTES_REDIS_REST_URL||process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL;
  const token=process.env.CG_NOTES_REDIS_REST_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN;
  return {url,token};
}
async function redis(url,token,command){
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),5000);
  try{
    const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(command),signal:controller.signal});
    const payload=await response.json().catch(()=>null);
    if(!response.ok||!payload||payload.error) throw new Error(payload?.error||`upstash_http_${response.status}`);
    return payload.result;
  }finally{clearTimeout(timer)}
}
function requestHost(req){const f=String(req.headers['x-forwarded-host']||'').split(',')[0].trim();return f||String(req.headers.host||'').trim()}
function validSameOriginWrite(req){
  if(req.headers['sec-fetch-site']==='cross-site') return false;
  const origin=req.headers.origin; if(!origin) return true;
  try{const parsed=new URL(origin);return ['http:','https:'].includes(parsed.protocol)&&parsed.host===requestHost(req)}catch{return false}
}
function isAdmin(req){
  const secret=String(process.env.CG_NOTES_ADMIN_TOKEN||''); if(!secret) return false;
  const a=Buffer.from(String(req.headers.authorization||'')); const b=Buffer.from(`Bearer ${secret}`);
  return a.length===b.length&&timingSafeEqual(a,b);
}
function readBody(req){if(req.body&&typeof req.body==='object')return req.body;if(typeof req.body==='string'){try{return JSON.parse(req.body)}catch{}}return null}
function cleanUrl(value){
  try{const u=new URL(String(value||'').trim());if(!['http:','https:'].includes(u.protocol))return null;if(u.href.length>500)return null;return u.href}catch{return null}
}
function publicConfig(raw){
  const source=raw&&typeof raw==='object'?raw:{};
  return {
    operatorArchiveUrl:cleanUrl(source.operatorArchiveUrl)||DEFAULTS.operatorArchiveUrl,
    chiefResearcherUrl:cleanUrl(source.chiefResearcherUrl)||DEFAULTS.chiefResearcherUrl
  };
}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(!['GET','PUT'].includes(req.method)){res.setHeader('Allow','GET, PUT');return res.status(405).json({error:'method_not_allowed'})}
  const {url,token}=storageConfig();
  if(req.method==='GET'){
    if(!url||!token) return res.status(200).json({config:DEFAULTS,live:false});
    try{
      const raw=await redis(url,token,['GET',CONFIG_KEY]);
      let parsed={}; if(raw){try{parsed=JSON.parse(raw)}catch{}}
      return res.status(200).json({config:publicConfig(parsed),live:true});
    }catch(error){return res.status(200).json({config:DEFAULTS,live:false,error:'config_store_unavailable'})}
  }
  if(!validSameOriginWrite(req)) return res.status(403).json({error:'invalid_origin'});
  if(!isAdmin(req)) return res.status(401).json({error:'admin_required'});
  if(!url||!token) return res.status(503).json({error:'config_store_not_configured'});
  const body=readBody(req)||{};
  const operatorArchiveUrl=cleanUrl(body.operatorArchiveUrl);
  const chiefResearcherUrl=cleanUrl(body.chiefResearcherUrl);
  if(!operatorArchiveUrl||!chiefResearcherUrl) return res.status(400).json({error:'invalid_url'});
  const config={operatorArchiveUrl,chiefResearcherUrl,updatedAt:Date.now()};
  try{await redis(url,token,['SET',CONFIG_KEY,JSON.stringify(config)]);return res.status(200).json({ok:true,config:publicConfig(config)})}
  catch(error){return res.status(502).json({error:'config_store_unavailable',detail:String(error?.message||error)})}
};
