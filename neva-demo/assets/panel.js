/* NevaOS — interactive, original sector-oriented demonstration panels.
   DEMO ONLY: browser-local sample data. No real payments, authentication, SMS, or cloud sync.
*/
(function(){
'use strict';
var all=window.NEVA_SECTORS||[],cfg=all.find(function(s){return s.id===window.NEVA_SECTOR_ID;})||all[0];
if(!cfg){document.body.textContent='Demo yapılandırması bulunamadı.';return;}
document.documentElement.style.setProperty('--accent',cfg.color);
document.documentElement.style.setProperty('--accent-faint','color-mix(in srgb,'+cfg.color+' 11%,white)');
document.title=cfg.brand+' | NevaOS Demo Paneli';
var names=['Deniz Yılmaz','Elif Acar','Burak Demir','Merve Öztürk','Ayşe Kaya','Ömer Polat','Selin Kurt','Ece Arslan','Can Erdem','İrem Şen','Ceren Aydın','Kaan Koç','Nehir Öz','Arda Ekin','Seda Ak','Berke Tan','Nil Yıldız','Lara Demir','Umut Kaya','Ekin Aydın'];
var navItems=[
['overview','◫','Genel Bakış'],['calendar','▦','Takvim'],['bookings','◷',cfg.group==='class'?'Ders Kayıtları':cfg.group==='space'?'Rezervasyonlar':'Randevular'],
['customers','♙',cfg.group==='class'?'Öğrenciler':cfg.group==='space'?'Misafirler / Müşteriler':'Müşteriler'],
['catalog','◈',cfg.group==='class'?'Ders Programı':cfg.group==='space'?'Alanlar & Hizmetler':'Hizmetler & Fiyatlar'],
['team','♧','Ekip & İzinler'],
['cash','▤','Kasa & Adisyon'],
['inventory','◧','Stok Yönetimi'],
['reports','▥','Raporlar'],
['messages','✉','Mesaj Şablonları'],
['settings','⚙','İşletme Ayarları'],
['public','↗','Online Müşteri Sayfası']
];
if(cfg.group==='appointment')navItems.splice(5,0,['packages','▣','Paketler & Seanslar']);
if(cfg.group==='space')navItems.splice(3,0,['floor','▦','Alan / Yerleşim']);
if(cfg.group==='class')navItems.splice(3,0,['attendance','✓','Yoklama']);
var $=function(id){return document.getElementById(id);};
var enc=function(x){return String(x==null?'':x).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});};
var num=function(v){return Number(v)||0;};
var money=function(v){return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(num(v));};
var pad=function(x){return String(x).padStart(2,'0');};
var asDay=function(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());};
var dateAt=function(offset){var d=new Date();d.setDate(d.getDate()+offset);return asDay(d);};
var localDate=function(s){if(!s)return '—';var d=new Date(s+'T12:00:00');return d.toLocaleDateString('tr-TR',{day:'numeric',month:'short',weekday:'short'});};
var localDateLong=function(s){if(!s)return '';return new Date(s+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});};
var clock=function(t){var parts=String(t||'00:00').split(':');return num(parts[0])*60+num(parts[1]);};
var uid=function(){return 'd-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);};
var activeStatuses=['confirmed','pending','completed'];
var prettyStatus={confirmed:'Onaylandı',pending:'Onay Bekliyor',completed:'Tamamlandı',cancelled:'İptal',no_show:'Gelmedi'};
var methodNames={cash:'Nakit',card:'Kart',transfer:'Havale'};
var tab='overview',calendarOffset=0,search='',filter='all',period='month',stockSearch='',modalMode='',currentClient=null;
var key='nevaos-rich-demo-v5-'+cfg.id;
var STORAGE_LIMIT=300;
function seed(){
var customers=names.slice(0,16).map(function(name,i){return {id:'u'+i,name:name,phone:'05•• ••• '+pad(i+11)+' '+pad(i+30),note:'',created:dateAt(-35+i),pet:cfg.id==='veteriner'?['Loki','Pamuk','Mia'][i%3]:''};});
var services=cfg.services.map(function(x,i){return {id:'s'+i,name:x[0],duration:x[1],price:x[2],active:true};});
var staff=cfg.staff.map(function(name,i){return {id:'t'+i,name:name,role:i===0?'Yönetici':cfg.staffTitle,commission:i===0?0:45,active:true,leave:false};});
var resources=cfg.resources.map(function(x,i){return {id:'r'+i,name:x[0],capacity:x[1],zone:x[2],active:true};});
var inventory=cfg.inventory.map(function(x,i){return {id:'i'+i,name:x,quantity:[24,9,17,3][i%4],minimum:5,price:[120,240,180,90][i%4]};});
var bookings=[],payments=[],expenses=[{id:'e1',name:'Kira gideri',amount:2800,date:dateAt(-7),category:'Kira'},{id:'e2',name:'Malzeme alımı',amount:830,date:dateAt(-3),category:'Malzeme'}];
for(var i=0;i<43;i++){
var d=-11+i%25,h=[9,10,11,12,14,15,16,17,18][(i*3)%9],ser=services[(i*7)%services.length],staffItem=staff[(i*5)%staff.length],resource=resources[(i*5+Math.floor(i/9))%resources.length];
var day=dateAt(d),time=pad(h)+':'+((i%2)?'30':'00');
var status=d<0?'completed':i%9===0?'pending':'confirmed';
var booking={id:'b'+i,clientId:customers[(i*3)%customers.length].id,client:customers[(i*3)%customers.length].name,phone:customers[(i*3)%customers.length].phone,
 date:day,time:time,serviceId:ser.id,staffId:staffItem.id,resourceId:resource.id,party:cfg.group==='space'?Math.min(resource.capacity,Math.max(1,(i%4)+1)):1,status:status,paid:0,source:i%3===0?'Online':'Panel',note:'',attended:null,created:day};
if(cfg.group==='class'){booking.date=dateAt((i%11)+1);booking.time=['10:00','13:30','17:00'][i%3];booking.resourceId=resources[i%resources.length].id;booking.serviceId=services[i%services.length].id;booking.party=1;booking.status='confirmed';}
var sDuration=cfg.group==='space'&&ser.duration>240?ser.duration:ser.duration;
// Seed may intentionally include busy example slots; new reservations must still respect overlapping times.
if(cfg.group!=='class'&&bookings.some(function(x){return x.date===booking.date&&x.resourceId===booking.resourceId&&clock(x.time)<clock(booking.time)+sDuration&&clock(booking.time)<clock(x.time)+serviceDuration(x,services)&&x.status!=='cancelled';})){continue;}
if(cfg.group==='class'&&bookings.filter(function(x){return x.date===booking.date&&x.serviceId===booking.serviceId&&x.resourceId===booking.resourceId;}).length>=resource.capacity)continue;
bookings.push(booking);
if(status==='completed'&&i%4!==0){payments.push({id:'p'+i,bookingId:booking.id,date:day,amount:ser.price,method:i%2?'card':'cash',staffId:staffItem.id,description:ser.name,kind:'service'});}
}
return {businessName:cfg.brand,services:services,staff:staff,resources:resources,customers:customers,bookings:bookings,payments:payments,expenses:expenses,inventory:inventory,
 packages:cfg.group==='appointment'?[{id:'pk1',clientId:customers[0].id,name:'5 Seans Hizmet Paketi',total:5,used:2,price:services[0].price*4,created:dateAt(-15)},{id:'pk2',clientId:customers[1].id,name:'10 Seans Bakım Paketi',total:10,used:4,price:services[1].price*8,created:dateAt(-10)}]:[],
 settings:{open:'09:00',close:'21:00',approval:false,breakMinutes:0,branch:'Merkez Şube',publicEnabled:true,reminder:'Randevunuz için sizi bekliyoruz.',holiday:false},
 activity:[{id:'a0',date:dateAt(0),text:'Demo verileri yüklendi',kind:'system'}],version:5};
}
function serviceDuration(b,list){var service=(list||db.services).find(function(s){return s.id===b.serviceId;});return service?num(service.duration):60;}
function getData(){try{var old=JSON.parse(localStorage.getItem(key)||'null');if(old&&old.version===5&&Array.isArray(old.bookings)&&Array.isArray(old.services)&&old.settings)return old;}catch(e){}return seed();}
var db=getData();
function save(){try{localStorage.setItem(key,JSON.stringify(db));}catch(e){notify('Tarayıcı depolama alanı dolu. Veriler kaydedilemedi.');}}
function track(message){db.activity.unshift({id:uid(),date:dateAt(0),text:message,kind:'change'});db.activity=db.activity.slice(0,35);}
function notify(message){var to=$('toast');if(!to)return;to.textContent=message;to.classList.remove('hidden');clearTimeout(window.__nevaToast);window.__nevaToast=setTimeout(function(){to.classList.add('hidden');},3800);}
function item(list,id){return list.find(function(x){return x.id===id;})||null;}
function fullname(b){return b.client||item(db.customers,b.clientId)?.name||'Misafir';}
function resourceName(b){return item(db.resources,b.resourceId)?.name||'—';}
function serviceName(b){return item(db.services,b.serviceId)?.name||'—';}
function staffName(b){return item(db.staff,b.staffId)?.name||'—';}
function balance(b){var total=serviceDuration(b);return total;}
function activeBookings(){return db.bookings.filter(function(b){return b.status!=='cancelled'&&b.status!=='no_show';});}
function completedPayments(){return db.payments.reduce(function(sum,p){return sum+num(p.amount);},0);}
function allExpenses(){return db.expenses.reduce(function(sum,e){return sum+num(e.amount);},0);}
function todayBooked(){return activeBookings().filter(function(b){return b.date===dateAt(0);});}
function occupied(r,date,time,duration,excludeId){
return db.bookings.some(function(b){
 if(b.id===excludeId||b.resourceId!==r||b.date!==date||b.status==='cancelled'||b.status==='no_show')return false;
 if(cfg.group==='class')return b.time===time;
 var oldStart=clock(b.time),oldEnd=oldStart+serviceDuration(b)+num(db.settings.breakMinutes||0);
 var begin=clock(time),end=begin+duration+num(db.settings.breakMinutes||0);return begin<oldEnd&&oldStart<end;
});
}
function staffConflict(staffId,date,time,duration,excludeId){
return cfg.group==='appointment'&&db.bookings.some(function(b){
 if(b.id===excludeId||b.staffId!==staffId||b.date!==date||!activeStatuses.includes(b.status))return false;
 var a=clock(time),v=clock(b.time);return a<v+serviceDuration(b)&&v<a+duration;
});
}
function availableCapacity(resourceId,date,time,serviceId,excludeId){
if(cfg.group!=='class')return 1;
var resource=item(db.resources,resourceId);if(!resource)return 0;
return resource.capacity-db.bookings.filter(function(b){return b.id!==excludeId&&b.status!=='cancelled'&&b.resourceId===resourceId&&b.date===date&&b.time===time&&b.serviceId===serviceId;}).reduce(function(a,b){return a+num(b.party||1);},0);
}
function dateParts(b){return b.date+'T'+b.time;}
function getWeekStart(){var d=new Date();d.setDate(d.getDate()+calendarOffset*7);var dow=(d.getDay()+6)%7;d.setDate(d.getDate()-dow);return asDay(d);}
function dayPlus(start,offset){var d=new Date(start+'T12:00:00');d.setDate(d.getDate()+offset);return asDay(d);}
function getWeekDays(){var start=getWeekStart();return [0,1,2,3,4,5,6].map(function(i){return dayPlus(start,i);});}
function makeOptions(arr,selected){return arr.map(function(p){var v=typeof p==='string'?p:p.value,l=typeof p==='string'?p:p.label;return '<option value="'+enc(v)+'" '+(String(v)===String(selected)?'selected':'')+'>'+enc(l)+'</option>';}).join('');}
function field(label,name,type,value,options,attr){var id='f_'+name,s='<div class="field"><label for="'+id+'">'+enc(label)+'</label>';
if(options)s+='<select name="'+name+'" id="'+id+'" '+(attr||'')+'>'+makeOptions(options,value)+'</select>';
else if(type==='textarea')s+='<textarea id="'+id+'" name="'+name+'" '+(attr||'')+'>'+enc(value||'')+'</textarea>';
else s+='<input id="'+id+'" name="'+name+'" type="'+(type||'text')+'" value="'+enc(value||'')+'" '+(attr||'')+'>';
return s+'</div>';
}
function statusChip(status){return '<span class="chip '+enc(status)+'">'+enc(prettyStatus[status]||status)+'</span>';}
function card(label,value,icon,sub){return '<div class="kpi"><small>'+enc(label)+'</small><strong>'+enc(value)+'</strong><span class="trend">'+enc(sub||'Demo verisi')+'</span><span class="bubble">'+icon+'</span></div>';}
function panelHeader(title,subtitle,button){return '<div class="panel-header"><div><h2>'+enc(title)+'</h2>'+(subtitle?'<p>'+enc(subtitle)+'</p>':'')+'</div>'+(button||'')+'</div>';}
function serviceLabel(){return cfg.group==='class'?'Ders':cfg.group==='space'?'Rezervasyon tipi':'Hizmet';}
function bookingLabel(){return cfg.group==='class'?'Ders Kaydı':cfg.group==='space'?'Rezervasyon':'Randevu';}
function bookingTag(b){return '<div><b>'+enc(fullname(b))+'</b><small>'+enc(b.date+' '+b.time)+'</small></div>';}
function button(label,action,val,kind){return '<button type="button" class="btn '+(kind||'')+'" data-action="'+enc(action)+'" '+(val!=null?'data-id="'+enc(val)+'"':'')+'>'+label+'</button>';}
function intro(head,lead){return '<div class="page-head"><div><div class="eyebrow">'+enc(cfg.category)+' / '+enc(db.settings.branch)+'</div><h1>'+enc(head)+'</h1><p>'+enc(lead)+'</p></div><div class="head-actions">'+button('↗ Müşteri Sayfası','nav','public','soft')+button('＋ Yeni '+bookingLabel(),'new-booking',null,'primary')+'</div></div>';}
function summaryBars(rows){var max=Math.max(1,...rows.map(function(x){return num(x.value);}));return '<div class="bar-chart">'+rows.map(function(r){return '<div class="chart-col"><b>'+enc(r.value)+'</b><span class="bar" style="height:'+Math.max(5,Math.round(num(r.value)/max*140))+'px"></span><small>'+enc(r.label)+'</small></div>';}).join('')+'</div>';}
function miniTable(bookings,max){var rows=bookings.slice(0,max||6);if(!rows.length)return '<div class="placeholder">Bu tarihte henüz kayıt bulunmuyor.</div>';
return '<div class="table-wrap"><table><thead><tr><th>Saat</th><th>'+enc(cfg.client)+'</th><th>'+enc(serviceLabel())+'</th><th>'+enc(cfg.group==='appointment'?cfg.staffTitle:cfg.resourceTitle)+'</th><th>Durum</th></tr></thead><tbody>'+
rows.map(function(b){return '<tr><td><b>'+enc(b.time)+'</b><small>'+enc(localDate(b.date))+'</small></td><td>'+bookingTag(b)+'</td><td>'+enc(serviceName(b))+'</td><td>'+enc(cfg.group==='appointment'?staffName(b):resourceName(b))+'</td><td>'+statusChip(b.status)+'</td></tr>';}).join('')+'</tbody></table></div>';
}
function bookingTable(rows){if(!rows.length)return '<div class="placeholder">Bu filtreyle eşleşen kayıt yok. Yeni kayıt oluşturabilirsin.</div>';
return '<div class="table-wrap"><table><thead><tr><th>Tarih / Saat</th><th>'+enc(cfg.client)+'</th><th>'+enc(serviceLabel())+'</th><th>'+enc(cfg.group==='appointment'?cfg.staffTitle:cfg.resourceTitle)+'</th><th>Durum</th><th>Tutar</th><th>İşlem</th></tr></thead><tbody>'+
rows.map(function(b){var sv=item(db.services,b.serviceId);return '<tr><td><b>'+enc(localDate(b.date))+'</b><small>'+enc(b.time)+'</small></td><td><b>'+enc(fullname(b))+'</b><small>'+enc(b.source)+'</small></td><td>'+enc(serviceName(b))+'</td><td>'+enc(cfg.group==='appointment'?staffName(b):resourceName(b))+'</td><td>'+statusChip(b.status)+'</td><td>'+money(sv?.price||0)+'</td><td><div class="row-actions"><button data-action="edit-booking" data-id="'+enc(b.id)+'">Düzenle</button><button data-action="change-status" data-id="'+enc(b.id)+'">Durum</button></div></td></tr>';}).join('')+'</tbody></table></div>';
}
function tableCard(title,sub,body){return '<section class="panel">'+panelHeader(title,sub)+body+'</section>';}
function specialCards(){return '<div class="module-cards">'+cfg.special.map(function(x,i){return '<article class="module-card"><span class="symbol">'+['◉','◷','▧'][i%3]+'</span><b>'+enc(x)+'</b><p>Bu sektöre uygun işletme akışına özel demo özelliği.</p></article>';}).join('')+'</div>';}
function summaryResource(){var result=db.resources.slice(0,6).map(function(r){var count=todayBooked().filter(function(b){return b.resourceId===r.id;}).length;return '<article class="resource-card"><span class="resource-icon">▦</span><span class="corner '+(count?'busy':'')+'">'+(count?count+' kayıt':'Uygun')+'</span><b>'+enc(r.name)+'</b><p>'+enc(r.zone)+' · Kapasite '+r.capacity+'</p></article>';}).join('');return '<div class="resource-grid">'+result+'</div>';}
function weekPerformance(){var days=getWeekDays();return days.map(function(d){return {label:localDate(d).split(' ')[1]||d.slice(-2),value:activeBookings().filter(function(b){return b.date===d;}).length};});}
function screenOverview(){
var today=todayBooked(),pending=db.bookings.filter(function(b){return b.status==='pending';}),future=activeBookings().filter(function(b){return b.date>=dateAt(0);}).sort(function(a,b){return dateParts(a).localeCompare(dateParts(b));});
var sales=completedPayments(),exp=allExpenses();
return intro('Genel Bakış','İşletmenizdeki randevuları, rezervasyonları, ekip işlerini ve güncel durumu tek merkezden takip edin.')+
'<div class="kpis">'+card('Bugünkü '+bookingLabel().toLocaleLowerCase('tr-TR'),today.length,'◷','Bugün aktif kayıt')+card('Onay bekleyen',pending.length,'✦','İncelenmesi gereken')+card('Kayıtlı tahsilat',money(sales),'₺','Örnek toplam')+card('Net nakit farkı',money(sales-exp),'↗','Tahsilat – gider')+'</div>'+
'<div class="split"><section class="panel">'+panelHeader('Haftalık doluluk','Rezervasyon adedi · örnek takvim',button('Takvime Git →','nav','calendar','small'))+summaryBars(weekPerformance())+'</section><section class="panel">'+panelHeader('Yaklaşan kayıtlar',future.length+' aktif rezervasyon')+miniTable(future,6)+'</section></div>'+
'<div class="split"><section class="panel">'+panelHeader('Alan & ekip özeti','Kullanım ve kaynak durumları')+summaryResource()+'</section><section class="panel">'+panelHeader('Son hareketler','Yerel demo etkinlikleri')+'<div class="activity">'+db.activity.slice(0,5).map(function(a){return '<div class="activity-item"><span class="activity-symbol">↗</span><div><b>'+enc(a.text)+'</b><p>Örnek panel işlemi</p><small>'+enc(localDate(a.date))+'</small></div></div>';}).join('')+'</div></section></div>'+
'<div class="panel" style="margin-top:20px">'+panelHeader(cfg.name+' için özel araçlar','Sektör ihtiyaçlarına göre tasarlanmış modüller')+specialCards()+'</div>';
}
function screenBookings(){
var rows=db.bookings.slice().sort(function(a,b){return dateParts(b).localeCompare(dateParts(a));});
if(filter!=='all')rows=rows.filter(function(b){return b.status===filter;});
if(search.trim()){var q=search.trim().toLocaleLowerCase('tr-TR');rows=rows.filter(function(b){return [fullname(b),serviceName(b),staffName(b),resourceName(b),b.date].join(' ').toLocaleLowerCase('tr-TR').includes(q);});}
var opts=[{value:'all',label:'Tüm durumlar'},{value:'confirmed',label:'Onaylandı'},{value:'pending',label:'Onay Bekliyor'},{value:'completed',label:'Tamamlandı'},{value:'cancelled',label:'İptal'},{value:'no_show',label:'Gelmedi'}];
return intro(bookingLabel()+' Yönetimi',cfg.client+' kayıtlarını arayın, filtreleyin, düzenleyin ve durumlarını değiştirin.')+
'<section class="panel">'+panelHeader('Kayıt listesi',rows.length+' kayıt gösteriliyor',button('＋ '+bookingLabel()+' Ekle','new-booking',null,'primary'))+
'<div class="toolbar"><input id="searchInput" class="filter-input" placeholder="İsim, hizmet veya tarih ara..." aria-label="Kayıt ara" value="'+enc(search)+'"><select id="filterStatus" class="filter-select" aria-label="Durum filtresi">'+makeOptions(opts,filter)+'</select>'+button('Filtreyi Temizle','clear-filter',null,'small')+'</div>'+bookingTable(rows)+'</section>';
}
function screenCalendar(){
var days=getWeekDays(),hours=[9,10,11,12,13,14,15,16,17,18,19,20];
var grid='<div class="calendar"><div class="cal-head">SAAT</div>'+days.map(function(d){return '<div class="cal-head">'+enc(localDate(d))+'</div>';}).join('');
hours.forEach(function(hour){grid+='<div class="cal-time">'+pad(hour)+':00</div>';days.forEach(function(d){
var matching=activeBookings().filter(function(b){return b.date===d&&num(b.time.slice(0,2))===hour;});
grid+='<div class="cal-cell" data-day="'+enc(d)+'" data-hour="'+pad(hour)+':00">'+matching.map(function(b){
return '<button type="button" class="cal-pill" data-action="edit-booking" data-id="'+enc(b.id)+'">'+enc(b.time)+' '+enc(fullname(b).split(' ')[0])+'<br>'+enc(serviceName(b))+'</button>';
}).join('')+'<button type="button" class="cal-plus" data-action="quick-booking" data-day="'+enc(d)+'" data-hour="'+pad(hour)+':00">＋ Ekle</button></div>';
});});
grid+='</div>';
return intro('Takvim','Tüm '+(cfg.group==='class'?'ders kayıtlarını':cfg.group==='space'?'rezervasyonları':'çalışan randevularını')+' haftalık plan üzerinde görün.')+
'<section class="panel"><div class="week-top"><div><b class="week-title">'+enc(localDateLong(days[0]))+' – '+enc(localDateLong(days[6]))+'</b><p class="muted" style="font-size:11px">Haftalık görünüm · örnek demo</p></div><div class="week-actions">'+button('‹','week-prev',null,'small')+button('Bugün','week-now',null,'small')+button('›','week-next',null,'small')+'</div></div><div class="calendar-wrap">'+grid+'</div></section>';
}
function screenCustomers(){
var rows=db.customers.slice();
if(search.trim()){var q=search.toLocaleLowerCase('tr-TR');rows=rows.filter(function(c){return c.name.toLocaleLowerCase('tr-TR').includes(q)||c.phone.includes(q);});}
return intro(cfg.group==='class'?'Öğrenci Yönetimi':cfg.client+' Yönetimi',cfg.client+' kayıtları, geçmişleri ve rezervasyon bilgileri. Örnek veriler gerçek kişi bilgisi içermez.')+
'<section class="panel">'+panelHeader('Kişi kartları',rows.length+' kişi',button('＋ Yeni '+cfg.client,'new-customer',null,'primary'))+
'<div class="toolbar"><input class="filter-input" id="searchInput" value="'+enc(search)+'" placeholder="İsim veya telefon ara..."></div>'+
'<div class="table-wrap"><table><thead><tr><th>Ad Soyad</th><th>Telefon</th><th>Toplam Rezervasyon</th><th>Son Ziyaret</th><th>İşlem</th></tr></thead><tbody>'+
rows.map(function(c){var history=db.bookings.filter(function(b){return b.clientId===c.id;}).sort(function(a,b){return dateParts(b).localeCompare(dateParts(a));});return '<tr><td><b>'+enc(c.name)+'</b><small>'+enc(cfg.id==='veteriner'?'Evcil hayvan: '+(c.pet||'Belirtilmedi'):'Demo müşteri kartı')+'</small></td><td>'+enc(c.phone)+'</td><td>'+history.length+'</td><td>'+enc(history[0]?localDate(history[0].date):'—')+'</td><td><div class="row-actions"><button data-action="client-detail" data-id="'+enc(c.id)+'">Kartı Aç</button><button data-action="edit-customer" data-id="'+enc(c.id)+'">Düzenle</button></div></td></tr>';}).join('')+'</tbody></table></div></section>';
}
function screenCatalog(){
var srows=db.services.map(function(s){return '<tr><td><b>'+enc(s.name)+'</b><small>'+enc(serviceLabel())+'</small></td><td>'+s.duration+' dk</td><td>'+money(s.price)+'</td><td><span class="chip '+(s.active?'confirmed':'cancelled')+'">'+(s.active?'Aktif':'Pasif')+'</span></td><td><div class="row-actions"><button data-action="edit-service" data-id="'+enc(s.id)+'">Düzenle</button><button data-action="toggle-service" data-id="'+enc(s.id)+'">'+(s.active?'Kapat':'Aç')+'</button></div></td></tr>';}).join('');
var rrows=db.resources.map(function(r){return '<tr><td><b>'+enc(r.name)+'</b><small>'+enc(r.zone)+'</small></td><td>'+r.capacity+' kişi</td><td>'+statusChip(r.active?'confirmed':'cancelled')+'</td><td><div class="row-actions"><button data-action="edit-resource" data-id="'+enc(r.id)+'">Düzenle</button><button data-action="toggle-resource" data-id="'+enc(r.id)+'">'+(r.active?'Kapat':'Aç')+'</button></div></td></tr>';}).join('');
return intro(cfg.group==='class'?'Ders Programı':cfg.group==='space'?'Alanlar & Fiyat Listesi':'Hizmetler & Fiyat Listesi','Fiyat, süre ve kaynak kapasitesini güncelleyin. Tüm değişiklikler bu tarayıcıya kaydedilir.')+
'<div class="split equal"><section class="panel">'+panelHeader(serviceLabel()+' Listesi',db.services.length+' hizmet',button('＋ Ekle','new-service',null,'primary'))+
'<div class="table-wrap"><table><thead><tr><th>Adı</th><th>Süre</th><th>Fiyat</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>'+srows+'</tbody></table></div></section>'+
'<section class="panel">'+panelHeader(cfg.resourceTitle+' Yönetimi',db.resources.length+' kaynak',button('＋ Yeni '+cfg.resourceTitle,'new-resource',null,'primary'))+
'<div class="table-wrap"><table><thead><tr><th>Ad / Bölüm</th><th>Kapasite</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>'+rrows+'</tbody></table></div></section></div>'+
'<div class="panel" style="margin-top:20px">'+panelHeader('Sektörel rezervasyon kuralları','Kaynak ve süre bazlı uygunluk kontrolü')+
'<div class="notice">Bu demo, aynı saat aralığında bir kaynak veya çalışan için çakışan rezervasyon oluşturmayı engeller. Bu kontrol yalnızca bulunduğunuz tarayıcı içindir; üretimde veritabanı düzeyinde eşzamanlılık kontrolü gereklidir.</div></div>';
}
function screenPackages(){
var packs=db.packages||[],remaining=packs.reduce(function(s,p){return s+Math.max(0,p.total-p.used);},0);
return intro('Seans Paketleri','Birden fazla seans içeren bakım, antrenman veya danışmanlık paketlerini yönet.')+
'<div class="kpis">'+card('Aktif paketler',packs.filter(function(x){return x.used<x.total;}).length,'▣','Seans hakları')+
card('Kalan seans',remaining,'◷','Örnek paket bakiyesi')+
card('Toplam paket',packs.length,'◈','Demo müşteri paketleri')+
card('Paket tutarı',money(packs.reduce(function(s,p){return s+p.price;},0)),'₺','Tanımlanan satış tutarı')+'</div>'+
'<section class="panel">'+panelHeader('Müşteri paketleri','Kalan seansları takip et',button('＋ Paket Oluştur','new-package',null,'primary'))+
'<div class="table-wrap"><table><thead><tr><th>Müşteri</th><th>Paket</th><th>Kullanılan</th><th>Kalan</th><th>Tutar</th><th>İşlem</th></tr></thead><tbody>'+
packs.map(function(p){var c=item(db.customers,p.clientId);return '<tr><td><b>'+enc(c?.name||'Demo müşteri')+'</b></td><td>'+enc(p.name)+'</td><td>'+p.used+'/'+p.total+'</td><td>'+Math.max(0,p.total-p.used)+' seans</td><td>'+money(p.price)+'</td><td><div class="row-actions"><button data-action="use-package" data-id="'+enc(p.id)+'" '+(p.used>=p.total?'disabled':'')+'>Seans Kullan</button><button data-action="edit-package" data-id="'+enc(p.id)+'">Düzenle</button></div></td></tr>';}).join('')+'</tbody></table></div>'+
'<p class="muted" style="font-size:11px;margin-top:17px">Paket kullanımları yalnızca örnek hak takibidir; gerçek ödeme veya tedavi kaydı oluşturmaz.</p></section>';
}
function screenTeam(){
return intro('Ekip & İzin Yönetimi','Çalışanlar, prim oranları ve geçici izin durumlarını yönet.')+
'<section class="panel">'+panelHeader(cfg.staffTitle+' Kadrosu',db.staff.length+' çalışan',button('＋ Çalışan Ekle','new-staff',null,'primary'))+
'<div class="table-wrap"><table><thead><tr><th>İsim</th><th>Görev</th><th>Prim Payı</th><th>Rezervasyon</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>'+
db.staff.map(function(s){var count=db.bookings.filter(function(b){return b.staffId===s.id;}).length;return '<tr><td><b>'+enc(s.name)+'</b><small>'+enc(s.id)+'</small></td><td>'+enc(s.role)+'</td><td>%'+s.commission+'</td><td>'+count+'</td><td>'+statusChip(s.leave?'pending':s.active?'confirmed':'cancelled')+'</td><td><div class="row-actions"><button data-action="edit-staff" data-id="'+enc(s.id)+'">Düzenle</button><button data-action="toggle-leave" data-id="'+enc(s.id)+'">'+(s.leave?'İzni Bitir':'İzin Ver')+'</button></div></td></tr>';}).join('')+'</tbody></table></div></section>'+
'<div class="panel" style="margin-top:18px">'+panelHeader('Yetkilendirme yaklaşımı','Üretim sistemi için plan')+
'<div class="module-cards"><div class="module-card"><span class="symbol">♙</span><b>İşletme Sahibi</b><p>Personel, kasa, ayarlar ve tüm raporları yönetebilir.</p></div><div class="module-card"><span class="symbol">♧</span><b>Personel</b><p>Yalnızca yetkili olduğu takvim ve işlemleri görüntüler.</p></div><div class="module-card"><span class="symbol">◈</span><b>Veri Ayrımı</b><p>Gerçek üyelik / RLS yetkileri üretim veritabanında doğrulanmalıdır.</p></div></div></div>';
}
function screenFloor(){
var r=db.resources;
return intro('Alan / Yerleşim Planı','Bölümlere göre yerleşimi ve seçilen günün masa, saha veya oda doluluğunu gör.')+
'<div class="split equal"><section class="panel">'+panelHeader(cfg.resourceTitle+' Yerleşimi','Kaynağa tıklayarak rezervasyon oluşturabilirsin')+
'<div class="floor"><div class="floor-label">'+enc(db.settings.branch)+' · '+enc(cfg.name)+'</div><div class="floor-grid">'+r.map(function(resource){var busy=todayBooked().some(function(b){return b.resourceId===resource.id;});return '<button type="button" class="floor-spot '+(busy?'taken':'')+'" data-action="quick-resource" data-id="'+enc(resource.id)+'"><span class="spot-icon">▦</span><b>'+enc(resource.name)+'</b><small>'+enc(resource.zone)+' · '+resource.capacity+' kişi</small><small>'+(busy?'Bugün rezervasyon var':'Boş saat seçilebilir')+'</small></button>';}).join('')+'</div><p class="floor-help">Turuncu alan bugün en az bir rezervasyon bulunduğunu gösterir; günün tüm saatlerinin dolu olduğu anlamına gelmez.</p></div></section>'+
'<section class="panel">'+panelHeader('Kaynak durumu','Bugünkü rezervasyon sayısı')+r.map(function(x){var c=todayBooked().filter(function(b){return b.resourceId===x.id;}).length;return '<div class="summary-row"><div><b>'+enc(x.name)+'</b><small class="muted"> '+enc(x.zone)+' · '+x.capacity+' kişi</small></div><strong>'+c+' kayıt</strong></div>';}).join('')+
'<div class="notice" style="margin-top:20px">Restoranlarda bu ekran masa/bölüm, halı sahalarda saha, stüdyolarda oda veya set olarak çalışır. Gelişmiş sürükle-bırak yerleşim planı üretim geliştirmesine dahildir.</div></section></div>';
}
function screenAttendance(){
var list=db.bookings.filter(function(b){return b.date>=dateAt(0)&&b.status!=='cancelled';}).sort(function(a,b){return dateParts(a).localeCompare(dateParts(b));});
var present=list.filter(function(b){return b.attended===true;}).length;
return intro('Yoklama & Ders Katılımı','Katılımcıları ders bazında görüntüleyin ve geldi/gelmedi olarak işaretleyin.')+
'<div class="kpis">'+card('Planlanan katılımcı',list.length,'♧','Gelecek dersler')+card('Geldi işaretlenen',present,'✓','Yerel kayıt')+card('Katılım oranı',list.length?Math.round(present/list.length*100)+'%':'%0','◉','İşaretlenen kayıtlar')+card('Sınıf',db.resources.length,'▦','Aktif sınıf')+'</div>'+
'<section class="panel">'+panelHeader('Katılımcı listesi','QR tarama simülasyonu değil; manuel örnek yoklama')+
'<div class="table-wrap"><table><thead><tr><th>Öğrenci</th><th>Ders / Tarih</th><th>Sınıf</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>'+list.slice(0,75).map(function(b){return '<tr><td><b>'+enc(fullname(b))+'</b></td><td>'+enc(serviceName(b))+'<small>'+enc(localDate(b.date))+' '+enc(b.time)+'</small></td><td>'+enc(resourceName(b))+'</td><td>'+statusChip(b.attended===true?'attended':b.attended===false?'no_show':'pending')+'</td><td><div class="row-actions"><button data-action="attendance-yes" data-id="'+enc(b.id)+'">Geldi</button><button data-action="attendance-no" data-id="'+enc(b.id)+'">Gelmedi</button></div></td></tr>';}).join('')+'</tbody></table></div></section>';
}
function screenCash(){
var total=completedPayments(),out=allExpenses(),payments=db.payments.slice().sort(function(a,b){return b.date.localeCompare(a.date);});
return intro('Kasa & Adisyon','Örnek ödemeleri, gelirleri, giderleri ve ekip hakedişlerini inceleyin.')+
'<div class="kpis">'+card('Tahsilat',money(total),'₺','Kayıtlı işlemler')+card('Giderler',money(out),'↘','Örnek işletme gideri')+card('Net nakit farkı',money(total-out),'↗','Kâr hesabı değildir')+card('Açık işlemler',db.bookings.filter(function(b){return b.status==='completed'&&!db.payments.some(function(p){return p.bookingId===b.id;});}).length,'◷','Tahsilatı girilmemiş')+'</div>'+
'<div class="split"><section class="panel">'+panelHeader('Tahsilat hareketleri','Nakit, kart ve havale kayıtları',button('＋ Tahsilat Ekle','new-payment',null,'primary'))+
'<div class="table-wrap"><table><thead><tr><th>Tarih</th><th>İşlem</th><th>Yöntem</th><th>Gelir</th></tr></thead><tbody>'+payments.slice(0,50).map(function(p){return '<tr><td>'+enc(localDate(p.date))+'</td><td><b>'+enc(p.description)+'</b></td><td>'+enc(methodNames[p.method]||p.method)+'</td><td>'+money(p.amount)+'</td></tr>';}).join('')+'</tbody></table></div></section>'+
'<section class="panel">'+panelHeader('Gider & Hakedişler','Kasa hareketleri',button('＋ Gider Ekle','new-expense',null,'small'))+
'<div class="finance-total"><small>Kasa net nakit farkı</small><strong>'+money(total-out)+'</strong><p>Net fark = tahsilat - kayıtlı giderler. Gerçek muhasebesel kâr değildir.</p></div>'+
'<div style="margin-top:18px">'+db.expenses.slice().reverse().map(function(e){return '<div class="summary-row"><div>'+enc(e.name)+'<small class="muted"> · '+enc(localDate(e.date))+'</small></div><strong>-'+money(e.amount)+'</strong></div>';}).join('')+'</div>'+
'<h3 style="margin:20px 0 11px">Ekip pay tahmini</h3>'+
db.staff.map(function(st){var own=db.payments.filter(function(p){return p.staffId===st.id;}).reduce(function(sum,p){return sum+p.amount;},0);return '<div class="summary-row"><span>'+enc(st.name)+'</span><strong>'+money(own*st.commission/100)+'</strong></div>';}).join('')+
'<p class="muted" style="font-size:11px;line-height:1.6">Örnek komisyon hesabı; vergi ve diğer giderler dahil değildir.</p></section></div>';
}
function screenInventory(){
var rows=db.inventory.filter(function(x){return x.name.toLocaleLowerCase('tr-TR').includes(stockSearch.toLocaleLowerCase('tr-TR'));});
return intro('Stok & Ürün Yönetimi','Ürünleri, kalan adetleri ve kritik stok uyarılarını takip et.')+
'<div class="kpis">'+card('Ürün çeşidi',db.inventory.length,'▧','Tanımlı ürün')+card('Kritik stok',db.inventory.filter(function(x){return x.quantity<=x.minimum;}).length,'!','Minimum seviyede')+card('Tahmini stok değeri',money(db.inventory.reduce(function(sum,x){return sum+x.price*x.quantity;},0)),'₺','Satış fiyatı üzerinden')+card('Ürün satışları',db.payments.filter(function(p){return p.kind==='product';}).length,'▤','Demo işlemleri')+'</div>'+
'<section class="panel">'+panelHeader('Stok listesi','Miktarları düzenleyin, ürün satışını simüle edin',button('＋ Yeni Ürün','new-stock',null,'primary'))+
'<div class="toolbar"><input id="stockSearch" class="filter-input" placeholder="Ürün ara..." value="'+enc(stockSearch)+'"></div>'+
'<div class="table-wrap"><table><thead><tr><th>Ürün</th><th>Miktar</th><th>Minimum</th><th>Satış Fiyatı</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>'+
rows.map(function(x){return '<tr><td><b>'+enc(x.name)+'</b></td><td><b>'+num(x.quantity)+'</b></td><td>'+num(x.minimum)+'</td><td>'+money(x.price)+'</td><td>'+statusChip(x.quantity<=x.minimum?'pending':'confirmed')+'</td><td><div class="row-actions"><button data-action="edit-stock" data-id="'+enc(x.id)+'">Düzenle</button><button data-action="sell-stock" data-id="'+enc(x.id)+'">Satış</button></div></td></tr>';}).join('')+'</tbody></table></div></section>';
}
function screenReports(){
var bookings=activeBookings(),pays=db.payments,serviceTotals=db.services.map(function(s){return {label:s.name,value:bookings.filter(function(b){return b.serviceId===s.id;}).length};}).sort(function(a,b){return b.value-a.value;});
var reportDays=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
var chartRows=reportDays.map(function(label,i){return {label:label,value:bookings.filter(function(b){var d=new Date(b.date+'T12:00:00');return (d.getDay()+6)%7===i;}).length};});
var topStaff=db.staff.map(function(st){return {label:st.name,value:pays.filter(function(p){return p.staffId===st.id;}).reduce(function(s,p){return s+p.amount;},0)};}).sort(function(a,b){return b.value-a.value;});
return intro('Raporlar & Analiz','Kayıtlı örnek veriler üzerinden doluluk, hizmet ve gelir performansını görüntüle.')+
'<div class="kpis">'+card('Toplam rezervasyon',bookings.length,'◷','Aktif kayıt')+card('Tamamlanan',db.bookings.filter(function(b){return b.status==='completed';}).length,'✓','Gerçekleşmiş')+card('Tahsilat',money(completedPayments()),'₺','Demo toplamı')+card('Ortalama hizmet',money(db.services.reduce(function(s,x){return s+x.price;},0)/(db.services.length||1)),'◈','Tanımlı fiyatlar')+'</div>'+
'<div class="split equal"><section class="panel">'+panelHeader('Haftalık rezervasyon dağılımı','Günlere göre örnek adetler')+summaryBars(chartRows)+'</section><section class="panel">'+panelHeader('Hizmet performansı','En çok seçilen hizmetler')+
serviceTotals.slice(0,6).map(function(s){var max=serviceTotals[0]?.value||1;return '<div style="margin-bottom:16px"><div class="summary-row" style="padding-bottom:3px"><span>'+enc(s.label)+'</span><strong>'+s.value+'</strong></div><div class="progress"><i style="width:'+(s.value/max*100)+'%"></i></div></div>';}).join('')+'</section></div>'+
'<div class="split equal"><section class="panel">'+panelHeader(cfg.staffTitle+' bazlı tahsilat','Örnek işlemler üzerinden')+
topStaff.map(function(s){return '<div class="summary-row"><span>'+enc(s.label)+'</span><strong>'+money(s.value)+'</strong></div>';}).join('')+'</section>'+
'<section class="panel">'+panelHeader('Özet metrikler','Kayıt türlerine göre durum')+
Object.keys(prettyStatus).map(function(k){return '<div class="summary-row"><span>'+enc(prettyStatus[k])+'</span><strong>'+db.bookings.filter(function(b){return b.status===k;}).length+'</strong></div>';}).join('')+'</section></div>';
}
function screenMessages(){
var template=db.settings.reminder||'Randevunuzu hatırlatırız.';
return intro('Mesaj & Hatırlatma Şablonları','SMS ve WhatsApp metinlerinin örnek önizlemelerini düzenleyin. Gerçek mesaj gönderilmez.')+
'<div class="split equal"><section class="panel">'+panelHeader('Hatırlatma şablonu','Metni düzenleyip örnek mesajı görüntüle')+
'<form id="reminderForm"><div class="field"><label for="reminderText">Mesaj metni</label><textarea id="reminderText" maxlength="240" name="reminder" required>'+enc(template)+'</textarea></div><p class="muted" style="font-size:11px">Gerçek SMS entegrasyonu yoktur. Bu ekran sadece kayıtlı metin önizlemesidir.</p><button class="btn primary" type="submit">Şablonu Kaydet</button></form></section>'+
'<section class="panel">'+panelHeader('Müşteriye giden mesaj örneği','Simülasyon · gönderilmez')+
'<div class="notice"><b>'+enc(db.businessName)+'</b><br>'+enc(template)+'<br><br>Örnek tarih: '+enc(localDate(dateAt(1)))+' 14:30</div>'+
'<div class="module-cards" style="margin-top:20px"><div class="module-card"><span class="symbol">✉</span><b>Randevu onayı</b><p>Üretim aşamasında SMS servisine bağlanacak.</p></div><div class="module-card"><span class="symbol">◷</span><b>Hatırlatma</b><p>İleri tarihli randevular için otomatik planlama.</p></div></div></section></div>';
}
function screenSettings(){
return intro('İşletme Ayarları','İşletme adı, çalışma saatleri, onay kuralları ve demo verilerini yönet.')+
'<div class="split equal"><section class="panel">'+panelHeader('Genel ayarlar','Değişiklikler yalnızca bu tarayıcıdaki demoya uygulanır')+
'<form id="settingsForm"><div class="field-grid">'+field('İşletme adı','businessName','text',db.businessName,null,'required minlength="2" maxlength="90"')+
field('Şube','branch','text',db.settings.branch,null,'required maxlength="80"')+
field('Açılış saati','open','time',db.settings.open,null,'required')+
field('Kapanış saati','close','time',db.settings.close,null,'required')+
field('Rezervasyonlar arası hazırlık (dk)','breakMinutes','number',db.settings.breakMinutes,null,'min="0" max="90" required')+
field('Online onay şekli','approval','select',db.settings.approval?'pending':'confirmed',[{value:'confirmed',label:'Otomatik onay'},{value:'pending',label:'Yönetici onayı'}])+
'</div><div class="modal-actions" style="justify-content:flex-start"><button class="btn primary" type="submit">Ayarları Kaydet</button></div></form></section>'+
'<section class="panel">'+panelHeader('Demo işlemleri','Örnek verileri yönetin')+
'<div class="module-cards"><div class="module-card"><span class="symbol">▣</span><b>JSON veri indir</b><p>Tarayıcıdaki örnek kayıtları JSON olarak dışa aktar.</p>'+button('Demo Verisini İndir','export-demo',null,'small')+'</div><div class="module-card"><span class="symbol">↻</span><b>Demoyu Sıfırla</b><p>Bu sektörün tüm örnek verilerini ilk hâline döndür.</p>'+button('Örnekleri Sıfırla','reset-demo',null,'small danger')+'</div></div>'+
'<div class="notice warn" style="margin-top:20px">Gerçek kullanıcı hesapları, müşteri kayıtları, SMS, gerçek ödemeler ve veritabanı yönetimi bu tarayıcı demosunda çalışmaz. Üretimde Supabase Auth, RLS, yedekleme ve KVKK süreçleri uygulanmalıdır.</div></section></div>';
}
function screenPublic(){
var d=dateAt(1),service=db.services.find(function(s){return s.active;})||db.services[0],resource=db.resources.find(function(r){return r.active;})||db.resources[0];
var publicIntro=cfg.group==='class'?'Ders Seç → Saat ve Sınıf → Katılımcı':cfg.group==='space'?'Yer Seç → Tarih ve Saat → Misafir':'Hizmet Seç → Personel ve Saat → Müşteri';
return '<div class="page-head"><div><div class="eyebrow">Müşteri perspektifi / örnek booking</div><h1>Online Rezervasyon Sayfası</h1><p>Şu an işletme müşterisinin göreceği ekranı deniyorsunuz. Rezervasyonlar sadece bu tarayıcıda görünür.</p></div><div class="head-actions">'+button('← Panele Dön','nav','overview','soft')+'</div></div>'+
'<div class="public-wrap"><div class="public-hero"><small>'+enc(cfg.category.toLocaleUpperCase('tr-TR'))+'</small><h1>'+enc(db.businessName)+'</h1><p>'+enc(cfg.subtitle)+' · '+enc(db.settings.branch)+'</p></div>'+
'<div class="public-container"><h2>Yerini ayırt</h2><p class="muted" style="font-size:12px">'+enc(publicIntro)+'</p><form id="publicBookingForm">'+
'<div class="field-grid" style="margin-top:23px">'+field(serviceLabel(),'serviceId','select',service.id,db.services.filter(function(x){return x.active;}).map(function(x){return {value:x.id,label:x.name+(x.price?' · '+money(x.price):'')};}),'required')+
field(cfg.resourceTitle,'resourceId','select',resource.id,db.resources.filter(function(x){return x.active;}).map(function(x){return {value:x.id,label:x.name+' · '+x.capacity+' kişi'};}),'required')+
(cfg.group==='appointment'?field(cfg.staffTitle,'staffId','select',db.staff[0]?.id,db.staff.filter(function(s){return s.active&&!s.leave;}).map(function(x){return {value:x.id,label:x.name};}),'required'):'')+
field('Tarih','date','date',d,null,'required min="'+dateAt(0)+'"')+
'</div><div class="field" style="margin:20px 0 8px"><label>Uygun Saat Seçin</label></div><div id="publicSlots" class="public-slots"></div><input type="hidden" name="time" id="publicTime" required>'+
'<hr class="separator"><div class="field-grid">'+field('Ad Soyad (örnek)','client','text','Demo Müşteri',null,'required minlength="2" maxlength="80"')+
(cfg.group==='space'?field('Kişi sayısı','party','number',2,null,'required min="1" max="100"'):field('Telefon (gerçek bilgi yazmayın)','phone','text','05•• ••• 10 10',null,'maxlength="30"'))+
'</div><div class="notice warn" style="margin:20px 0">Bu adım gerçek randevu oluşturmaz. Girilen veriler sadece bu tarayıcıdaki ilgili panelin örnek kayıt listesine eklenir.</div><button type="submit" class="btn primary full">Örnek '+bookingLabel()+' Oluştur →</button></form><p class="footer-copy">NevaWebDesign NevaOS demo · Kamuya açık müşteri sayfası prototipi</p></div></div>';
}
function showSlots(){
var form=$('publicBookingForm');if(!form)return;
var service=item(db.services,form.elements.serviceId.value),res=item(db.resources,form.elements.resourceId.value);
if(!service||!res)return;
var date=form.elements.date.value,staffId=form.elements.staffId?form.elements.staffId.value:null;
var opts=[];for(var t=clock(db.settings.open);t<clock(db.settings.close);t+=30){
var tm=pad(Math.floor(t/60))+':'+pad(t%60),duration=num(service.duration),full=false;
if(t+duration>clock(db.settings.close))continue;
if(cfg.group==='class')full=availableCapacity(res.id,date,tm,service.id,null)<1;
else full=occupied(res.id,date,tm,duration,null)||staffConflict(staffId,date,tm,duration,null);
opts.push({time:tm,disabled:full});
}
var slots=$('publicSlots');slots.innerHTML=opts.length?opts.map(function(o){return '<button type="button" data-action="slot" data-id="'+o.time+'" '+(o.disabled?'disabled':'')+'>'+o.time+'</button>';}).join(''):'<p class="muted">Seçilen gün için uygun saat bulunmuyor.</p>';
$('publicTime').value='';
}
function render(){
if(!document.body)return;
$('topTitle').textContent=cfg.name+' / '+db.settings.branch;
$('sidebarLinks').innerHTML=navItems.map(function(n){return '<button type="button" class="side-link '+(tab===n[0]?'active':'')+'" data-action="nav" data-id="'+n[0]+'"><span class="mini-icon">'+n[1]+'</span><span>'+enc(n[2])+'</span></button>';}).join('');
$('profileName').textContent=db.businessName;$('profileSubtitle').textContent=cfg.subtitle;$('companySymbol').textContent=cfg.group==='appointment'?'✦':cfg.group==='space'?'▦':'♧';
$('sectorCategory').textContent=cfg.category;$('topSectorSelect').value=cfg.id;
var pages={overview:screenOverview,calendar:screenCalendar,bookings:screenBookings,customers:screenCustomers,catalog:screenCatalog,packages:screenPackages,team:screenTeam,cash:screenCash,inventory:screenInventory,reports:screenReports,messages:screenMessages,settings:screenSettings,public:screenPublic,floor:screenFloor,attendance:screenAttendance};
$('screen').innerHTML=(pages[tab]||screenOverview)();
if(tab==='public')showSlots();
}
function nav(to){tab=to;search='';filter='all';stockSearch='';render();window.scrollTo({top:0,behavior:'auto'});}
function modal(title,description,html,mode,id){
modalMode=mode;$('modalTitle').textContent=title;$('modalDescription').textContent=description||'';$('modalContent').innerHTML=html;
$('modalForm').dataset.mode=mode;$('modalForm').dataset.id=id||'';
$('editDialog').showModal();
}
function modalBooking(id,defaults){
var b=id?item(db.bookings,id):null,seedVals=defaults||{},date=b?.date||seedVals.date||dateAt(1),time=b?.time||seedVals.time||'10:00';
var activeServices=db.services.filter(function(s){return s.active;});
var activeResources=db.resources.filter(function(r){return r.active;});
var activeStaff=db.staff.filter(function(s){return s.active&&!s.leave;});
if(!activeServices.length||!activeResources.length||!activeStaff.length){notify('Önce aktif hizmet, kaynak ve çalışan tanımla.');nav('catalog');return;}
var customerChoices=[{value:'',label:'Yeni müşteri / isim gir'}].concat(db.customers.map(function(c){return {value:c.id,label:c.name};}));
var selectedService=b?.serviceId||activeServices[0].id,selectedResource=b?.resourceId||seedVals.resourceId||activeResources[0].id;
var html='<div class="field-grid">'+
field('Kayıtlı kişi','clientId','select',b?.clientId||'',customerChoices)+field(cfg.client+' adı','client','text',b?.client||'',null,'required minlength="2" maxlength="80"')+
field(serviceLabel(),'serviceId','select',selectedService,activeServices.map(function(s){return {value:s.id,label:s.name+' ('+s.duration+' dk)'};}),'required')+
field(cfg.resourceTitle,'resourceId','select',selectedResource,activeResources.map(function(r){return {value:r.id,label:r.name+' (kap. '+r.capacity+')'};}),'required')+
field(cfg.staffTitle,'staffId','select',b?.staffId||activeStaff[0].id,activeStaff.map(function(s){return {value:s.id,label:s.name};}),'required')+
field('Tarih','date','date',date,null,'required min="'+dateAt(-30)+'"')+
field('Saat','time','time',time,null,'required')+
(cfg.group!=='appointment'?field('Katılımcı / Kişi','party','number',b?.party||1,null,'required min="1" max="100"'):'')+
field('Durum','status','select',b?.status||'confirmed',Object.keys(prettyStatus).map(function(s){return {value:s,label:prettyStatus[s]};}))+
field('Not (hassas kişisel veri yazmayın)','note','textarea',b?.note||'',null,'maxlength="200"')+
'</div><div class="notice warn" style="margin-top:18px">Seçilen saat, personel ve kaynak için çakışma kontrolü yapılır. Bu yalnızca tarayıcı içi demo kontrolüdür.</div>';
modal((b?'Rezervasyonu Düzenle':'Yeni '+bookingLabel()),'Kayıt oluştur veya güncelle.',''+html,b?'edit-booking':'create-booking',b?.id);
}
function modalCustomer(id){
var c=id?item(db.customers,id):null;
var h='<div class="field-grid">'+field('Ad Soyad','name','text',c?.name||'',null,'required minlength="2" maxlength="80"')+field('Telefon (örnek)','phone','text',c?.phone||'05•• ••• 00 00',null,'maxlength="30"')+
(cfg.id==='veteriner'?field('Evcil hayvan adı','pet','text',c?.pet||'',null,'maxlength="70"'):'')+field('İşletme notu (hassas veri girmeyin)','note','textarea',c?.note||'',null,'maxlength="200"')+'</div>';
modal(c?'Kişiyi Düzenle':'Yeni '+cfg.client,'Müşteri kartı ve iletişim bilgileri.',h,c?'edit-customer':'create-customer',c?.id);
}
function modalService(id){
var s=id?item(db.services,id):null;
var h='<div class="field-grid">'+field(serviceLabel()+' Adı','name','text',s?.name||'',null,'required minlength="2" maxlength="100"')+field('Süre (dakika)','duration','number',s?.duration||60,null,'required min="15" max="480"')+field('Fiyat (TL)','price','number',s?.price??0,null,'required min="0" max="1000000" step="1"')+'</div>';
modal(s?'Hizmeti Düzenle':'Yeni '+serviceLabel(),'Süre ve fiyat değişiklikleri yeni rezervasyonlara uygulanır.',h,s?'edit-service':'create-service',s?.id);
}
function modalResource(id){
var r=id?item(db.resources,id):null,h='<div class="field-grid">'+field(cfg.resourceTitle+' Adı','name','text',r?.name||'',null,'required minlength="2" maxlength="100"')+field('Bölüm / Kat','zone','text',r?.zone||'Merkez',null,'required maxlength="90"')+field('Kapasite (kişi)','capacity','number',r?.capacity||1,null,'required min="1" max="1000"')+'</div>';
modal(r?'Kaynağı Düzenle':'Yeni '+cfg.resourceTitle,'Masa, oda, kort, koltuk veya sınıf tanımlayın.',h,r?'edit-resource':'create-resource',r?.id);
}
function modalStaff(id){
var st=id?item(db.staff,id):null;
var h='<div class="field-grid">'+field('Ad Soyad','name','text',st?.name||'',null,'required minlength="2" maxlength="80"')+
field('Görev','role','text',st?.role||cfg.staffTitle,null,'required maxlength="80"')+field('Komisyon (%)','commission','number',st?.commission??40,null,'required min="0" max="100"')+'</div>';
modal(st?'Çalışanı Düzenle':'Yeni Çalışan','Gerçek hesap oluşturmaz; yerel çalışan kartı ekler.',h,st?'edit-staff':'create-staff',st?.id);
}
function modalStock(id){
var x=id?item(db.inventory,id):null;
var h='<div class="field-grid">'+field('Ürün adı','name','text',x?.name||'',null,'required minlength="2" maxlength="100"')+field('Stok miktarı','quantity','number',x?.quantity??0,null,'required min="0" max="100000"')+
field('Minimum stok','minimum','number',x?.minimum??5,null,'required min="0" max="100000"')+field('Birim satış fiyatı','price','number',x?.price??100,null,'required min="0" max="1000000"')+'</div>';
modal(x?'Stok Ürününü Düzenle':'Yeni Stok Ürünü','Miktar ve fiyat değerlerini güncelleyin.',h,x?'edit-stock':'create-stock',x?.id);
}
function modalPackage(id){
var p=id?item(db.packages,id):null;
var h='<div class="field-grid">'+field('Müşteri','clientId','select',p?.clientId||db.customers[0]?.id,db.customers.map(function(c){return {value:c.id,label:c.name};}),'required')+
field('Paket adı','name','text',p?.name||'5 Seans Paketi',null,'required minlength="2" maxlength="90"')+
field('Toplam seans','total','number',p?.total??5,null,'required min="1" max="200"')+
field('Kullanılmış seans','used','number',p?.used??0,null,'required min="0" max="200"')+
field('Paket tutarı','price','number',p?.price??1000,null,'required min="0" max="1000000"')+'</div>';
modal(p?'Paketi Düzenle':'Seans Paketi Oluştur','Kurgusal paket ve seans hakkı kaydı.',h,p?'edit-package':'create-package',p?.id);
}
function modalPayment(){
var h='<div class="field-grid">'+field('İşlem açıklaması','description','text','Hizmet tahsilatı',null,'required maxlength="90"')+field('Tutar (TL)','amount','number','500',null,'required min="1" max="1000000"')+
field('Yöntem','method','select','card',Object.entries(methodNames).map(function(x){return {value:x[0],label:x[1]};}))+
field('Tarih','date','date',dateAt(0),null,'required')+field('Çalışan','staffId','select',db.staff[0]?.id,db.staff.map(function(x){return {value:x.id,label:x.name};}))+'</div>';
modal('Yeni Tahsilat','Örnek bir kasa hareketi oluştur.',h,'create-payment');
}
function modalExpense(){
var h='<div class="field-grid">'+field('Gider adı','name','text','İşletme gideri',null,'required maxlength="90"')+field('Tutar (TL)','amount','number','250',null,'required min="1" max="1000000"')+
field('Kategori','category','select','Malzeme',['Kira','Malzeme','Personel','Elektrik','Diğer'])+field('Tarih','date','date',dateAt(0),null,'required')+'</div>';
modal('Gider Ekle','Kasa raporunda gider olarak görünür.',h,'create-expense');
}
function modalClientDetail(id){
var c=item(db.customers,id);if(!c)return;currentClient=c.id;
var history=db.bookings.filter(function(b){return b.clientId===id;}).sort(function(a,b){return dateParts(b).localeCompare(dateParts(a));});
var h='<div class="notice"><b>'+enc(c.name)+'</b> · '+enc(c.phone)+'</div><h3 style="margin:18px 0 11px">Rezervasyon geçmişi</h3>'+
(history.length?history.map(function(b){return '<div class="summary-row"><span>'+enc(serviceName(b))+' · '+enc(localDate(b.date))+'</span>'+statusChip(b.status)+'</div>';}).join(''):'<div class="placeholder">Bu müşterinin rezervasyon geçmişi yok.</div>')+
'<div style="margin-top:20px">'+button('Kişiyi Düzenle','edit-customer',c.id,'soft')+'</div>';
modal('Müşteri Kartı','Randevular ve geçmiş hizmetler.',''+h,'view-client',id);
}
function modalStatus(id){
var b=item(db.bookings,id);if(!b)return;var h='<div class="field-grid">'+field('Durum','status','select',b.status,Object.keys(prettyStatus).map(function(s){return {value:s,label:prettyStatus[s]};}))+'</div>'+
'<div class="notice" style="margin-top:17px">'+enc(fullname(b))+' · '+enc(serviceName(b))+' · '+enc(localDate(b.date))+' '+enc(b.time)+'</div>';
modal('Rezervasyon Durumu','Durum değişikliklerini kaydedebilirsin.',h,'change-status',id);
}
function showModalByAction(action,id,extra){
if(action==='new-booking')return modalBooking(null);
if(action==='quick-booking')return modalBooking(null,{date:extra?.date,time:extra?.time});
if(action==='quick-resource')return modalBooking(null,{resourceId:id});
if(action==='edit-booking')return modalBooking(id);
if(action==='new-customer')return modalCustomer();
if(action==='edit-customer')return modalCustomer(id);
if(action==='client-detail')return modalClientDetail(id);
if(action==='new-service')return modalService();
if(action==='edit-service')return modalService(id);
if(action==='new-resource')return modalResource();
if(action==='edit-resource')return modalResource(id);
if(action==='new-staff')return modalStaff();
if(action==='edit-staff')return modalStaff(id);
if(action==='new-stock')return modalStock();
if(action==='edit-stock')return modalStock(id);
if(action==='new-package')return modalPackage();
if(action==='edit-package')return modalPackage(id);
if(action==='new-payment')return modalPayment();
if(action==='new-expense')return modalExpense();
if(action==='change-status')return modalStatus(id);
}
function validateBooking(b,editingId){
var serv=item(db.services,b.serviceId),res=item(db.resources,b.resourceId),staff=item(db.staff,b.staffId);
if(!serv||!res||!staff||!res.active||!staff.active)return 'Hizmet, alan veya personel geçersiz.';
if(!b.client||b.client.length<2)return 'Müşteri adı en az iki karakter olmalı.';
if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||!/^\d{2}:\d{2}$/.test(b.time))return 'Geçerli tarih ve saat gir.';
if(b.party<1||!Number.isInteger(b.party)||b.party>res.capacity)return 'Bu alan '+res.capacity+' kişi kapasitelidir.';
if(cfg.group==='class'){
if(availableCapacity(res.id,b.date,b.time,serv.id,editingId)<b.party)return 'Bu dersin kontenjanı dolu veya yetersiz.';
return null;
}
if(clock(b.time)+serv.duration>clock(db.settings.close)||clock(b.time)<clock(db.settings.open))return 'Rezervasyon işletme çalışma saatleri dışında.';
if(b.status!=='cancelled'&&b.status!=='no_show'&&occupied(res.id,b.date,b.time,serv.duration,editingId))return 'Bu alan için aynı saatte başka rezervasyon var.';
if(b.status!=='cancelled'&&b.status!=='no_show'&&staffConflict(staff.id,b.date,b.time,serv.duration,editingId))return 'Bu çalışanın aynı saatte başka randevusu var.';
return null;
}
function handleModal(form){
var data=Object.fromEntries(new FormData(form).entries()),m=form.dataset.mode,id=form.dataset.id,existing=!!id;
if(m==='view-client'){ $('editDialog').close();return;}
if(['create-booking','edit-booking'].includes(m)){
var client=item(db.customers,data.clientId),title=String(data.client||client?.name||'').trim();
var b={id:existing?id:uid(),clientId:client?.id||null,client:title,phone:client?.phone||'',
 date:data.date,time:data.time,serviceId:data.serviceId,resourceId:data.resourceId,staffId:data.staffId,party:cfg.group==='appointment'?1:num(data.party),status:data.status,note:String(data.note||'').slice(0,200),source:'Panel',attended:null,created:dateAt(0)};
var warning=validateBooking(b,id);if(warning){notify(warning);return;}
if(!client){var found=db.customers.find(function(x){return x.name.toLocaleLowerCase('tr-TR')===title.toLocaleLowerCase('tr-TR');});if(found)b.clientId=found.id;else{var n={id:uid(),name:title,phone:'',note:'',created:dateAt(0)};db.customers.push(n);b.clientId=n.id;}}
if(existing){var old=item(db.bookings,id);Object.assign(old,b);}else{if(db.bookings.length>=STORAGE_LIMIT){notify('Demo için kayıt sınırına ulaştın.');return;}db.bookings.push(b);}
track(title+' için '+bookingLabel().toLocaleLowerCase('tr-TR')+' '+(existing?'güncellendi':'oluşturuldu'));
}else if(['create-customer','edit-customer'].includes(m)){
var n={name:String(data.name).trim(),phone:String(data.phone||''),note:String(data.note||''),pet:String(data.pet||''),created:dateAt(0)};
if(existing)Object.assign(item(db.customers,id),n);else db.customers.push(Object.assign({id:uid()},n));
track('Kişi kartı '+(existing?'güncellendi':'eklendi')+': '+n.name);
}else if(['create-service','edit-service'].includes(m)){
var n={name:String(data.name).trim(),duration:num(data.duration),price:num(data.price),active:true};
if(existing)Object.assign(item(db.services,id),{name:n.name,duration:n.duration,price:n.price});else db.services.push(Object.assign({id:uid()},n));
track(serviceLabel()+' güncellendi: '+n.name);
}else if(['create-resource','edit-resource'].includes(m)){
var n={name:String(data.name).trim(),zone:String(data.zone||'Merkez'),capacity:num(data.capacity),active:true};
if(existing)Object.assign(item(db.resources,id),{name:n.name,zone:n.zone,capacity:n.capacity});else db.resources.push(Object.assign({id:uid()},n));
track(cfg.resourceTitle+' güncellendi: '+n.name);
}else if(['create-staff','edit-staff'].includes(m)){
var n={name:String(data.name).trim(),role:String(data.role||cfg.staffTitle),commission:num(data.commission),active:true,leave:false};
if(existing)Object.assign(item(db.staff,id),{name:n.name,role:n.role,commission:n.commission});else db.staff.push(Object.assign({id:uid()},n));
track('Çalışan güncellendi: '+n.name);
}else if(['create-stock','edit-stock'].includes(m)){
var n={name:String(data.name).trim(),quantity:num(data.quantity),minimum:num(data.minimum),price:num(data.price)};
if(existing)Object.assign(item(db.inventory,id),n);else db.inventory.push(Object.assign({id:uid()},n));
track('Stok güncellendi: '+n.name);
}else if(['create-package','edit-package'].includes(m)){
var total=num(data.total),used=num(data.used);
if(used>total){notify('Kullanılan seans sayısı toplamı aşamaz.');return;}
var n={clientId:data.clientId,name:String(data.name).trim(),total:total,used:used,price:num(data.price),created:dateAt(0)};
if(existing)Object.assign(item(db.packages,id),n);else db.packages.push(Object.assign({id:uid()},n));
track('Seans paketi güncellendi: '+n.name);
}else if(m==='create-payment'){
db.payments.push({id:uid(),amount:num(data.amount),date:data.date,method:data.method,staffId:data.staffId,description:String(data.description).slice(0,90),kind:'manual'});
track('Tahsilat kaydedildi: '+money(data.amount));
}else if(m==='create-expense'){
db.expenses.push({id:uid(),name:String(data.name),amount:num(data.amount),date:data.date,category:String(data.category)});
track('Gider eklendi: '+money(data.amount));
}else if(m==='change-status'){
var old=item(db.bookings,id);if(!old)return;old.status=data.status;track('Rezervasyon durumu '+(prettyStatus[data.status]||'')+' yapıldı');
}
save();$('editDialog').close();render();notify('Demo değişikliği kaydedildi.');
}
function handleActions(e){
var el=e.target.closest('[data-action]');if(!el)return;var act=el.dataset.action,id=el.dataset.id;
if(act==='nav'){nav(id);return;}
if(act==='slot'){$('publicTime').value=id;document.querySelectorAll('[data-action="slot"]').forEach(function(b){b.classList.toggle('selected',b.dataset.id===id);});return;}
if(act==='week-prev'){calendarOffset--;render();return;}
if(act==='week-next'){calendarOffset++;render();return;}
if(act==='week-now'){calendarOffset=0;render();return;}
if(act==='clear-filter'){search='';filter='all';render();return;}
if(act==='toggle-service'){var s=item(db.services,id);if(s){s.active=!s.active;track('Hizmet durumu değişti');save();render();}return;}
if(act==='toggle-resource'){var r=item(db.resources,id);if(r){r.active=!r.active;track('Kaynak durumu değişti');save();render();}return;}
if(act==='toggle-leave'){var t=item(db.staff,id);if(t){t.leave=!t.leave;track('Personel izin durumu değişti');save();render();}return;}
if(act==='attendance-yes'||act==='attendance-no'){var b=item(db.bookings,id);if(b){b.attended=act==='attendance-yes';track('Yoklama işaretlendi');save();render();}return;}
if(act==='export-demo'){
var blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='nevaos-demo-'+cfg.id+'.json';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1500);return;}
if(act==='reset-demo'){if(confirm('Bu sektördeki tüm örnek verileri sıfırlamak istiyor musun?')){db=seed();save();nav('overview');notify('Örnek kayıtlar yenilendi.');}return;}
if(act==='use-package'){var p=item(db.packages,id);if(!p)return;if(p.used>=p.total){notify('Bu pakette kalan seans yok.');return;}p.used++;track('Paket seansı kullanıldı: '+p.name);save();render();notify('Seans hakkı güncellendi.');return;}
if(act==='sell-stock'){
var product=item(db.inventory,id);if(!product)return;if(product.quantity<1){notify('Ürün stokta yok.');return;}
product.quantity--;db.payments.push({id:uid(),amount:product.price,date:dateAt(0),method:'cash',staffId:db.staff[0]?.id,description:'Ürün: '+product.name,kind:'product'});track(product.name+' stoktan satıldı');save();render();notify('Ürün satışı ve stok düşümü kaydedildi.');return;}
if(act==='quick-booking')return showModalByAction(act,null,{date:el.dataset.day,time:el.dataset.hour});
showModalByAction(act,id);
}
function handleChange(e){
if(e.target.id==='filterStatus'){filter=e.target.value;render();return;}
if(e.target.id==='topSectorSelect'){window.location.href='/neva-demo/'+encodeURIComponent(e.target.value)+'/';return;}
if(e.target.closest('#publicBookingForm')&&['serviceId','resourceId','staffId','date'].includes(e.target.name)){showSlots();return;}
}
function handleInput(e){
if(e.target.id==='searchInput'){search=e.target.value;var start=e.target.selectionStart;render();var again=$('searchInput');if(again){again.focus();try{again.setSelectionRange(start,start);}catch(e){}}return;}
if(e.target.id==='stockSearch'){stockSearch=e.target.value;var i=e.target.selectionStart;render();var t=$('stockSearch');if(t){t.focus();try{t.setSelectionRange(i,i);}catch(e){}}}
}
function handlePublicSubmit(form){
var v=Object.fromEntries(new FormData(form).entries()),serv=item(db.services,v.serviceId),res=item(db.resources,v.resourceId),staff=cfg.group==='appointment'?item(db.staff,v.staffId):db.staff[0];
if(!serv||!res||!staff){notify('Hizmet, alan veya personel seçimini kontrol et.');return;}
if(!v.time){notify('Önce uygun bir saat seçmelisin.');return;}
var client=String(v.client||'').trim();
if(client.length<2){notify('Örnek isim gir.');return;}
var b={id:uid(),clientId:null,client:client,phone:String(v.phone||''),date:v.date,time:v.time,serviceId:serv.id,resourceId:res.id,staffId:staff.id,
party:cfg.group==='space'?num(v.party):1,status:db.settings.approval?'pending':'confirmed',note:'',source:'Online Demo',attended:null,created:dateAt(0)};
var warning=validateBooking(b);if(warning){notify(warning);showSlots();return;}
var existing=db.customers.find(function(c){return c.name.toLocaleLowerCase('tr-TR')===client.toLocaleLowerCase('tr-TR');});
if(!existing){existing={id:uid(),name:client,phone:b.phone,note:'',created:dateAt(0)};db.customers.push(existing);}b.clientId=existing.id;
db.bookings.push(b);track('Online demo rezervasyonu oluşturuldu: '+client);save();notify('Örnek rezervasyon oluşturuldu. İşletme panelinde görünecek.');nav('bookings');
}
function handleSubmit(e){
if(e.target.id==='modalForm'){e.preventDefault();handleModal(e.target);return;}
if(e.target.id==='publicBookingForm'){e.preventDefault();handlePublicSubmit(e.target);return;}
if(e.target.id==='reminderForm'){e.preventDefault();db.settings.reminder=String(new FormData(e.target).get('reminder')||'').trim();track('Hatırlatma şablonu güncellendi');save();render();notify('Mesaj şablonu kaydedildi (gönderilmedi).');return;}
if(e.target.id==='settingsForm'){e.preventDefault();var f=Object.fromEntries(new FormData(e.target).entries());
if(clock(f.open)>=clock(f.close)){notify('Kapanış saati açılıştan sonra olmalı.');return;}
db.businessName=f.businessName;db.settings.branch=f.branch;db.settings.open=f.open;db.settings.close=f.close;db.settings.breakMinutes=num(f.breakMinutes);db.settings.approval=f.approval==='pending';
track('İşletme ayarları güncellendi');save();render();notify('Ayarlar kaydedildi.');return;}
}
var app='<div class="app"><aside class="sidebar"><div class="logo"><div class="logo-mark">✦</div><div><h3>NevaOS</h3><span>BUSINESS SUITE</span></div></div><div class="sidebar-profile"><div class="company-icon" id="companySymbol">✦</div><span class="subheading">DEMO İŞLETME</span><strong id="profileName"></strong><small id="profileSubtitle"></small></div><span class="side-label">YÖNETİM</span><nav class="side-links" id="sidebarLinks"></nav><div class="sidebar-bottom"><a href="/berberos/">← Tüm İşletme Sistemleri</a><div class="sidebar-note">Bu panel kurgusal veriler içeren etkileşimli bir demodur. Kişisel veri veya ödeme bilgisi girmeyin.</div></div></aside>'+
'<main class="main"><header class="topbar"><div class="top-left"><div class="crumb">NevaOS <span style="padding:0 7px;color:#bec4d2">/</span> <b id="topTitle"></b></div></div><div class="top-right"><select aria-label="Başka demo paneline geç" id="topSectorSelect" class="top-select">'+all.map(function(x){return '<option value="'+enc(x.id)+'">'+enc(x.name)+'</option>';}).join('')+'</select><span class="avatar" aria-label="Demo yönetici">N</span></div></header>'+
'<div class="demo-band"><span><b>ETKİLEŞİMLİ DEMO:</b> Kurgusal örnek kayıtlar sadece bu tarayıcıda saklanır. SMS, gerçek tahsilat, canlı veritabanı ve çok kullanıcılı yetkilendirme yoktur.</span><a id="demoRequest" href="/berberos/">Demo talep et ↗</a></div>'+
'<div class="workspace" id="screen"></div></main></div>'+
'<dialog id="editDialog" aria-labelledby="modalTitle"><div class="modal-head"><div><h2 id="modalTitle"></h2><p id="modalDescription"></p></div><button type="button" class="modal-close" id="closeModal" aria-label="Pencereyi kapat">×</button></div><div class="modal-body"><form id="modalForm"><div id="modalContent"></div><div class="modal-actions"><button type="button" id="cancelModal" class="btn">İptal</button><button type="submit" class="btn primary">Kaydet</button></div></form></div></dialog><div id="toast" role="status" class="toast hidden"></div>';
document.body.innerHTML=app;
// Live page body is assembled above; all demo data is isolated to this sector.
$('demoRequest').href='/berberos/?demo='+encodeURIComponent(cfg.name);
$('closeModal').addEventListener('click',function(){$('editDialog').close();});
$('cancelModal').addEventListener('click',function(){$('editDialog').close();});
$('editDialog').addEventListener('click',function(e){if(e.target===$('editDialog'))$('editDialog').close();});
document.addEventListener('click',handleActions);
document.addEventListener('change',handleChange);
document.addEventListener('input',handleInput);
document.addEventListener('submit',handleSubmit);
render();
})();
