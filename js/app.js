/* Cotizador de impresión 3D - lógica principal (cuentas con Supabase o modo demostración) */
var BASE={
pedro:{nombre:"Pedro",nota:"Más económico en tiempo",hora:2500,margen:15,tel:"11111111111",mat:{PLA:65000,PETG:78000,ABS:82000,TPU:115000}},
enrique:{nombre:"Enrique",nota:"Mejor precio en material",hora:4000,margen:20,tel:"22222222222",mat:{PLA:55000,PETG:65000,ABS:70000,TPU:95000}}
};
var SELLERS={},remote={},cur="pedro",api=crearApi(),myId=null,myEmail="",prof=null,tmat=null,authMode="in";
var $=function(i){return document.getElementById(i)||document.createElement("div")};
var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return "&#"+c.charCodeAt(0)+";"})};
function cop(n){return "$"+Math.round(n).toLocaleString("es-CO")}
function n(i){return Math.max(0,parseFloat($(i).value)||0)}
function num(v){v=Number(v);return isFinite(v)&&v>=0?v:0}
function clean(d){d=d||{};var m=d.mat||{},mm={};
Object.keys(m).slice(0,20).forEach(function(k){var kk=String(k).replace(/[.\/\[\]*~`]/g,"").trim().slice(0,20);if(kk)mm[kk]=num(m[k])});
return{nombre:String(d.nombre||"Vendedor").slice(0,40),nota:String(d.nota||"").slice(0,60),hora:num(d.hora),margen:Math.min(200,num(d.margen)),tel:String(d.tel||"").replace(/\D/g,"").slice(0,15),mat:mm}}

/* Navegación */
function show(v){location.href=v==="inicio"?"index.html":v+".html"}
var ready=false,wanted=new URLSearchParams(location.search).get("v");

/* Cotizador */
function allMats(){var s={};Object.keys(SELLERS).forEach(function(k){Object.keys(SELLERS[k].mat).forEach(function(m){s[m]=1})});return Object.keys(s)}
function price(s){
var hrs=n("h")+n("m")/60,q=Math.max(1,n("q")||1);
if(s.mat[$("mat").value]===undefined)return null;
var t=hrs*s.hora*q,m=n("g")*s.mat[$("mat").value]/1000*q,g=(t+m)*s.margen/100;
return{t:t,m:m,g:g,tot:t+m+g,q:q}
}
function render(){
var s=SELLERS[cur],p0=price(s),p=p0||{t:0,m:0,g:0,tot:0,q:Math.max(1,n("q")||1)};
$("sel").value=cur;$("nm").textContent=s.nombre;
$("rt").textContent=cop(p.t);$("rm").textContent=cop(p.m);$("rg").textContent=cop(p.g);$("tot").textContent=p0?cop(p.tot):"—";$("waMsg").style.color="var(--er)";$("waMsg").textContent=p0?"":s.nombre+" no ofrece "+$("mat").value+".";
var txt="Hola "+s.nombre+", quiero cotizar una impresión 3D: material "+$("mat").value+", tiempo "+Math.floor(n("h"))+" h "+Math.round(n("m"))+" min, "+n("g")+" g, cantidad "+p.q+". Estimado: "+cop(p.tot)+" COP.";
$("wa").href="https://wa.me/"+s.tel+"?text="+encodeURIComponent(txt);
var all=Object.keys(SELLERS).map(function(k){var q=price(SELLERS[k]);return q?{k:k,tot:q.tot}:null}).filter(Boolean);
var best=Math.min.apply(null,all.map(function(a){return a.tot}));
$("cmp").innerHTML=all.map(function(a){return '<div class="cmp'+(a.tot===best?' best':'')+'"><span>'+esc(SELLERS[a.k].nombre)+(a.tot===best?' más barato':'')+'</span><b>'+cop(a.tot)+'</b></div>'}).join("");
}
function refresh(){
SELLERS={};Object.keys(BASE).forEach(function(k){SELLERS[k]=BASE[k]});
Object.keys(remote).forEach(function(k){SELLERS["u_"+k]=remote[k]});
if(wanted&&SELLERS[wanted]){cur=wanted;wanted=null}
if(!SELLERS[cur])cur="pedro";
var pm=$("mat").value,am=allMats();$("mat").innerHTML=am.map(function(m){return '<option value="'+esc(m)+'">'+esc(m)+'</option>'}).join("");$("mat").value=am.indexOf(pm)>=0?pm:am[0];
$("sel").innerHTML=Object.keys(SELLERS).map(function(k){return '<option value="'+esc(k)+'">'+esc(SELLERS[k].nombre)+'</option>'}).join("");
$("vcards").innerHTML=Object.keys(SELLERS).map(function(k){var s=SELLERS[k],mine=myId&&k==="u_"+myId;
var rows=Object.keys(s.mat).map(function(m){return "<tr><td>"+esc(m)+" por kg</td><td>"+cop(s.mat[m])+"</td></tr>"}).join("");
return '<div class="card"><h2>'+esc(s.nombre)+(k.indexOf("u_")===0?'<span class="badge">'+(mine?'Tú':'Registrado')+'</span>':'')+'</h2><p class="mut" style="margin:0">'+esc(s.nota)+'</p><div class="tab"><table><tr><td>Precio por hora</td><td>'+cop(s.hora)+'</td></tr><tr><td>Margen</td><td>'+s.margen+'%</td></tr>'+rows+'</table></div><button class="btn" data-pick="'+esc(k)+'">Cotizar con '+esc(s.nombre)+'</button></div>'}).join("");
document.querySelectorAll("[data-pick]").forEach(function(b){b.addEventListener("click",function(){location.href="cotizador.html?v="+encodeURIComponent(b.dataset.pick)})});
render();drawAccount();drawTaller();
}
$("sel").addEventListener("change",function(){cur=$("sel").value;render()});
document.querySelectorAll("#cotizador input,#mat").forEach(function(e){e.addEventListener("input",render)});
$("wa").addEventListener("click",function(e){
var s=SELLERS[cur];
if(!price(s)){e.preventDefault();return}
$("waMsg").style.color="var(--tx)";
$("waMsg").textContent="WhatsApp de "+s.nombre+": "+s.tel;
if(BASE[cur])e.preventDefault(); /* vendedores de ejemplo: solo muestra el número */
});

/* Cuenta: inicio de sesión y registro */
function amsg(t,ok){var e=$("authMsg");e.textContent=t;e.style.color=ok?"var(--ok)":"var(--er)"}
function say(t,ok){var e=$("formMsg");e.textContent=t;e.style.color=ok?"var(--ok)":"var(--er)"}
function tsay(t,ok){var e=$("tmsg");e.textContent=t;e.style.color=ok?"var(--ok)":"var(--er)"}
function traducir(e){var m=String(e&&e.message||e);
if(/invalid login/i.test(m))return "Correo o contraseña incorrectos.";
if(/already registered/i.test(m))return "Ese correo ya está registrado.";
if(/password/i.test(m)&&/6/.test(m))return "La contraseña debe tener mínimo 6 caracteres.";
if(/email.*invalid|invalid.*email/i.test(m))return "El correo no es válido.";
return m}
function setMode(m){authMode=m;$("tabIn").classList.toggle("on",m==="in");$("tabUp").classList.toggle("on",m==="up");
$("authGo").textContent=m==="in"?"Iniciar sesión":"Crear cuenta";$("ap").autocomplete=m==="in"?"current-password":"new-password";amsg("",true)}
$("tabIn").addEventListener("click",function(){setMode("in")});
$("tabUp").addEventListener("click",function(){setMode("up")});
$("authGo").addEventListener("click",async function(){
var email=$("ae").value.trim(),pw=$("ap").value;
if(!email||pw.length<6)return amsg("Escribe tu correo y una contraseña de mínimo 6 caracteres.",false);
try{
if(authMode==="in"){await api.signIn(email,pw)}
else{var ses=await api.signUp(email,pw);
if(!ses){amsg("Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.",true);return}}
amsg("",true);$("ap").value="";
}catch(e){amsg(traducir(e),false)}
});
$("logout").addEventListener("click",async function(){try{await api.signOut()}catch(e){}});

function drawAccount(){
var st=$("accStatus"),f=$("accForm"),a=$("authBox"),lo=$("logout");
f.style.display=a.style.display=lo.style.display="none";
var demo=api.local?'<p class="note">Modo demostración: la cuenta y los vendedores se guardan solo en este navegador.</p>':"";
if(!myId){st.innerHTML='<h2>Tu cuenta</h2><p class="mut" style="margin:0">Inicia sesión o crea una cuenta para registrarte como cliente o vendedor.</p>'+demo;a.style.display="block";return}
var mine=remote[myId];
st.innerHTML='<h2>Tu cuenta</h2><p class="mut" style="margin:0">'+esc(myEmail)+' — '+(mine?'registrado como vendedor: <b>'+esc(mine.nombre)+'</b>.':prof?'registrado como cliente: <b>'+esc(prof.nombre)+'</b>.':'aún no te has registrado. Completa el formulario de abajo.')+'</p>'+demo;
f.style.display="block";lo.style.display="block";
$("formTitle").textContent=(mine||prof)?"Editar mi registro":"Registro";
$("delSeller").style.display=(mine||prof)?"block":"none";
var key=myId+(mine?"m":prof?"p":"e");
if(f.dataset.filled!==key){
var s=mine||{nombre:prof?prof.nombre:"",nota:"",hora:3000,margen:20,tel:prof?prof.tel:"",mat:{PLA:70000,PETG:80000,ABS:85000,TPU:110000}};
$("rn").value=s.nombre;$("rno").value=s.nota;$("rh").value=s.hora;$("rg2").value=s.margen;$("rtel").value=s.tel;
$("rpla").value=s.mat.PLA||"";$("rpetg").value=s.mat.PETG||"";$("rabs").value=s.mat.ABS||"";$("rtpu").value=s.mat.TPU||"";
$("rrol").value=mine?"vendedor":"cliente";
f.dataset.filled=key}
toggleRole();
}
function toggleRole(){$("sellerFields").style.display=$("rrol").value==="vendedor"?"block":"none";$("priceFields").style.display=remote[myId]?"none":"block"}
$("rrol").addEventListener("change",toggleRole);

$("saveSeller").addEventListener("click",async function(){
if(!myId)return;
var seller=$("rrol").value==="vendedor";
var d=clean({nombre:$("rn").value.trim(),nota:$("rno").value.trim(),hora:$("rh").value,margen:$("rg2").value,tel:$("rtel").value,mat:{PLA:$("rpla").value,PETG:$("rpetg").value,ABS:$("rabs").value,TPU:$("rtpu").value}});
if(!$("rn").value.trim())return say("Escribe un nombre.",false);
if(d.tel.length<10)return say("Escribe un WhatsApp válido con indicativo.",false);
if(seller&&!d.hora)return say("Indica el precio por hora.",false);
try{
await api.saveProfile({id:myId,nombre:d.nombre,tel:d.tel,rol:seller?"vendedor":"cliente"});
if(seller){
var ex=remote[myId];if(ex){d.hora=ex.hora;d.margen=ex.margen;d.mat=ex.mat}
await api.saveSeller({id:myId,nombre:d.nombre,nota:d.nota,hora:d.hora,margen:d.margen,tel:d.tel,mat:d.mat});
say("Registro guardado. Ya apareces en la lista de vendedores.",true);tmat=null;await loadAll();show("taller")
}else{
if(remote[myId])await api.deleteSeller(myId);
say("Registro guardado. Ya puedes cotizar.",true);await loadAll()
}
}catch(e){say("No se pudo guardar: "+(e.message||"error"),false)}
});

var delArmed=false,delT=null;
$("delSeller").addEventListener("click",async function(){
var b=$("delSeller");
if(!delArmed){delArmed=true;b.textContent="Toca otra vez para confirmar el borrado";clearTimeout(delT);delT=setTimeout(function(){delArmed=false;b.textContent="Borrar mi cuenta"},5000);return}
clearTimeout(delT);delArmed=false;b.textContent="Borrar mi cuenta";
try{
await api.deleteAccount();
myId=null;prof=null;tmat=null;remote={};
refresh();amsg("Tu cuenta fue borrada.",true)
}catch(e){say("No se pudo borrar la cuenta: "+(e.message||"error"),false)}
});

/* Mi taller (solo vendedores) */
function drawTaller(){
var mine=remote[myId];
$("navTaller").style.display=mine?"":"none";
if(!mine){tmat=null;if(document.body.dataset.page==="taller"&&ready)show("cuenta");return}
if(!tmat){tmat=JSON.parse(JSON.stringify(mine.mat));$("th").value=mine.hora;$("tg").value=mine.margen}
$("tmats").innerHTML=Object.keys(tmat).map(function(k){return '<div class="row" style="grid-template-columns:1fr 90px;align-items:end"><div><label>'+esc(k)+' (COP/kg)</label><input data-m="'+esc(k)+'" type="number" min="0" step="1000" value="'+num(tmat[k])+'"></div><button class="btn del" style="margin:0;padding:10px" data-x="'+esc(k)+'" type="button">Quitar</button></div>'}).join("")||'<p class="mut">Aún no tienes materiales.</p>';
}
$("tmats").addEventListener("input",function(e){var k=e.target.dataset.m;if(k!==undefined&&tmat)tmat[k]=num(e.target.value)});
$("tmats").addEventListener("click",function(e){var k=e.target.dataset.x;if(k!==undefined&&tmat){delete tmat[k];drawTaller()}});
$("tadd").addEventListener("click",function(){
if(!tmat)return;
var k=$("tnn").value.trim().replace(/[.\/\[\]*~`]/g,"").slice(0,20);
if(!k)return tsay("Escribe el nombre del material.",false);
if(tmat[k]!==undefined)return tsay("Ese material ya existe.",false);
tmat[k]=num($("tnp").value);$("tnn").value="";$("tnp").value="";tsay("Material agregado. Recuerda guardar los cambios.",true);drawTaller()
});
$("tsave").addEventListener("click",async function(){
var mine=remote[myId];if(!mine||!tmat)return;
var d=clean({hora:$("th").value,margen:$("tg").value,mat:tmat});
if(!d.hora)return tsay("Indica el precio por hora.",false);
if(!Object.keys(d.mat).length)return tsay("Agrega al menos un material.",false);
try{
await api.updateSeller(myId,{hora:d.hora,margen:d.margen,mat:d.mat});
tsay("Cambios guardados. Los clientes ya ven tus nuevos precios.",true);await loadAll()
}catch(e){tsay("No se pudo guardar: "+(e.message||"error"),false)}
});

/* Carga de datos y sesión */
async function loadAll(){
try{
var rows=await api.loadSellers();
remote={};rows.forEach(function(x){remote[x.id]=clean(x)});
if(myId)prof=await api.loadProfile(myId);
}catch(e){}
ready=true;refresh();
}
refresh();
api.init(function(ev,sess){
var nid=sess?sess.user.id:null;
if(ev!=="INITIAL_SESSION"&&nid===myId)return;
myId=nid;myEmail=sess?sess.user.email:"";prof=null;tmat=null;
$("navAcc").textContent=sess?"Mi cuenta":"Cuenta";
setTimeout(loadAll,0);
});
