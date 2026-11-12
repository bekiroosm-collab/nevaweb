// Vercel serverless API: OpenStreetMap lookup. No API keys required.
const endpoints=['https://overpass.private.coffee/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://overpass-api.de/api/interpreter'];
const categories={
'Berber / Erkek Kuaförü':['["shop"="hairdresser"]'],
'Kadın Kuaförü':['["shop"="hairdresser"]'],
'Güzellik Merkezi':['["shop"="beauty"]','["beauty"]'],
'Restoran / Kafe':['["amenity"="restaurant"]','["amenity"="cafe"]'],
'Diğer İşletme':['["shop"]["name"]']
};
module.exports=async function handler(req,res){
res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=3600');
if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
const city=String(req.query.city||'').trim(),category=String(req.query.category||'');
if(!/^[\p{L}\p{M}\s.'-]{2,70}$/u.test(city)||!categories[category])return res.status(400).json({error:'Geçersiz şehir veya sektör'});
const escaped=city.replace(/["\\]/g,'');
const query='[out:json][timeout:12];area["name"="'+escaped+'"]["boundary"="administrative"]->.a;('+categories[category].map(c=>'nwr'+c+'(area.a);').join('')+');out center 60;';
for(const endpoint of endpoints){
const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14000);
try{
const response=await fetch(endpoint,{method:'POST',body:new URLSearchParams({data:query}),signal:controller.signal,headers:{'User-Agent':'NevaSalesAI/1.0 (public OSM business discovery)'}});
if(!response.ok)continue;
const json=await response.json();
if(!Array.isArray(json.elements))continue;
const businesses=json.elements.filter(x=>x.tags&&x.tags.name).slice(0,30).map(x=>({id:x.id,type:x.type,tags:{name:x.tags.name,phone:x.tags.phone||x.tags['contact:phone']||'',email:x.tags.email||x.tags['contact:email']||'','addr:street':x.tags['addr:street']||'','addr:housenumber':x.tags['addr:housenumber']||''}}));
return res.status(200).json({elements:businesses,source:'OpenStreetMap'});
}catch(_e){}finally{clearTimeout(timer)}
}
return res.status(503).json({error:'Harici açık veri servisleri yanıt vermedi. Lütfen daha sonra tekrar deneyin.'});
};