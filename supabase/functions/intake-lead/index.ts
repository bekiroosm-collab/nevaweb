// Supabase Edge Function: intake-lead
// Deploy with JWT verification disabled (public website form).
// Set SUPABASE_SERVICE_ROLE_KEY as an Edge Function secret; never put it in frontend files.
import { createClient } from 'npm:@supabase/supabase-js@2';
const allowedOrigins = new Set(['https://nevawebdesign.com.tr','https://www.nevawebdesign.com.tr']);
const cors = (origin: string) => ({'Access-Control-Allow-Origin':allowedOrigins.has(origin)?origin:'https://nevawebdesign.com.tr','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type, apikey, authorization','Vary':'Origin'});
function response(status:number,body:unknown,origin:string){return new Response(JSON.stringify(body),{status,headers:{...cors(origin),'content-type':'application/json;charset=utf-8'}})}
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
 if(req.method!=='POST')return response(405,{error:'Method not allowed'},origin);
 if(!allowedOrigins.has(origin))return response(403,{error:'Origin not allowed'},origin);
 const length=Number(req.headers.get('content-length')||0);
 if(length>12000)return response(413,{error:'Too large'},origin);
 let input:Record<string,unknown>;
 try{input=await req.json();}catch{return response(400,{error:'Invalid JSON'},origin)}
 const str=(key:string,max:number)=>typeof input[key]==='string'?String(input[key]).trim().slice(0,max):'';
 const name=str('name',100),business_name=str('business_name',120),phone=str('phone',30),service=str('service',120),budget=str('budget',80),details=str('details',2500);
 if(input.website)return response(200,{ok:true},origin); // honeypot
 if(name.length<2||details.length<10||!/^[+0-9()\s-]{10,30}$/.test(phone)||!service)return response(400,{error:'Lütfen form bilgilerini kontrol edin.'},origin);
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!key)return response(503,{error:'Service not configured'},origin);
 const db=createClient(url,key,{auth:{persistSession:false}});
 const {error}=await db.from('nwd_leads').insert({name,business_name:business_name||null,phone,service,budget:budget||null,details});
 if(error){console.error('Lead insert failed',error.code);return response(500,{error:'Kayıt oluşturulamadı.'},origin)}
 return response(200,{ok:true},origin);
});
