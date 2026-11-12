// Server-side Gemini message generation. Set GEMINI_API_KEY in Vercel environment variables.
module.exports=async function handler(req,res){
res.setHeader('Cache-Control','no-store');
if(req.method!=='POST')return res.status(405).json({error:'Yalnızca POST desteklenir.'});
if(!process.env.GEMINI_API_KEY)return res.status(503).json({error:'Gemini API anahtarı henüz Vercel ayarlarına eklenmedi.'});
const {business,contact,service,context}=req.body||{};
if(typeof business!=='string'||typeof service!=='string'||business.length>160||service.length>100||String(context||'').length>1200)return res.status(400).json({error:'Geçersiz bilgiler.'});
const prompt='Sen NevaWebDesign ajansının Türkçe satış metni editörüsün. İşletmeye kısa, samimi, profesyonel, kişiselleştirilmiş ve abartısız ilk tanışma mesajı yaz. İşletme hakkında doğrulanmamış bilgi, sahte başarı, garanti, indirim veya fiyat uydurma. İzin alınmamış otomatik gönderim önerme. Tek bir WhatsApp mesajı üret, en fazla 110 kelime. Sadece mesaj metnini döndür. İşletme: '+business+'; Yetkili: '+String(contact||'').slice(0,100)+'; Hizmet: '+service+'; Ek notlar: '+String(context||'').slice(0,1200);
const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
try{
const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.6,maxOutputTokens:400}})});
const data=await response.json();
if(!response.ok)return res.status(response.status===429?429:502).json({error:response.status===429?'Ücretsiz kullanım kotası doldu, daha sonra tekrar dene.':'Gemini API yanıt vermedi. Anahtar ve model erişimini kontrol et.'});
const message=(data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('').trim();
if(!message)return res.status(502).json({error:'Yapay zekâ boş yanıt döndürdü.'});
return res.status(200).json({message:message.slice(0,1800)});
}catch(e){return res.status(502).json({error:'Yapay zekâ bağlantısı kurulamadı.'});}finally{clearTimeout(timer)}
};