/* Capa de datos.
   - Si js/config.js tiene los datos de Supabase: cuentas y vendedores en la base de datos.
   - Si está vacío: MODO DEMOSTRACIÓN, todo se guarda en el navegador (localStorage). */
function crearApi(){
  var w=typeof window!=="undefined"?window:{};
  var c=w.CONFIG||{};
  if(c.SUPABASE_URL&&c.SUPABASE_ANON_KEY&&w.supabase){
    try{return supaApi(w.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_ANON_KEY))}catch(e){}
  }
  return localApi();
}

function supaApi(sb){return{
  local:false,
  init:function(f){sb.auth.onAuthStateChange(f)},
  signIn:async function(e,p){var r=await sb.auth.signInWithPassword({email:e,password:p});if(r.error)throw r.error},
  signUp:async function(e,p){var r=await sb.auth.signUp({email:e,password:p});if(r.error)throw r.error;return !!r.data.session},
  signOut:async function(){try{await sb.auth.signOut()}catch(x){}},
  loadSellers:async function(){var r=await sb.from("vendedores").select("*");return r.data||[]},
  loadProfile:async function(id){var r=await sb.from("perfiles").select("*").eq("id",id).maybeSingle();return r.data||null},
  saveProfile:async function(row){var r=await sb.from("perfiles").upsert(row);if(r.error)throw r.error},
  saveSeller:async function(row){var r=await sb.from("vendedores").upsert(row);if(r.error)throw r.error},
  updateSeller:async function(id,patch){var r=await sb.from("vendedores").update(patch).eq("id",id);if(r.error)throw r.error},
  deleteSeller:async function(id){var r=await sb.from("vendedores").delete().eq("id",id);if(r.error)throw r.error},
  deleteAccount:async function(){var r=await sb.rpc("borrar_mi_cuenta");if(r.error)throw r.error;try{await sb.auth.signOut({scope:"local"})}catch(x){}}
}}

function localApi(){
  var K="cotizador3d_demo",cb=null;
  function rd(){var o={};try{o=JSON.parse(localStorage.getItem(K))||{}}catch(e){}
    o.users=o.users||{};o.perfiles=o.perfiles||{};o.vend=o.vend||{};return o}
  function wr(o){try{localStorage.setItem(K,JSON.stringify(o))}catch(e){throw new Error("No se pudo guardar en este navegador.")}}
  async function hash(s){
    if(typeof crypto!=="undefined"&&crypto.subtle){
      var b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
      return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,"0")}).join("")}
    return "p"+s.split("").reduce(function(h,ch){return (h*31+ch.charCodeAt(0))|0},7)}
  function emit(ev,id,email){if(cb)cb(ev,id?{user:{id:id,email:email}}:null)}
  function findId(o,email){return Object.keys(o.users).filter(function(k){return o.users[k].email===email})[0]}
  return{
    local:true,
    init:function(f){cb=f;var o=rd(),id=o.session,u=id&&o.users[id];
      setTimeout(function(){emit("INITIAL_SESSION",u?id:null,u?u.email:"")},0)},
    signIn:async function(email,pw){email=email.toLowerCase();var o=rd(),id=findId(o,email);
      if(!id||o.users[id].h!==await hash(pw))throw new Error("Invalid login");
      o.session=id;wr(o);emit("SIGNED_IN",id,email)},
    signUp:async function(email,pw){email=email.toLowerCase();var o=rd();
      if(findId(o,email))throw new Error("User already registered");
      var id="l"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
      o.users[id]={email:email,h:await hash(pw)};o.session=id;wr(o);emit("SIGNED_IN",id,email);return true},
    signOut:async function(){var o=rd();delete o.session;wr(o);emit("SIGNED_OUT",null,"")},
    loadSellers:async function(){var o=rd();return Object.keys(o.vend).map(function(k){return o.vend[k]})},
    loadProfile:async function(id){return rd().perfiles[id]||null},
    saveProfile:async function(row){var o=rd();o.perfiles[row.id]=row;wr(o)},
    saveSeller:async function(row){var o=rd();o.vend[row.id]=row;wr(o)},
    updateSeller:async function(id,patch){var o=rd();if(o.vend[id]){Object.keys(patch).forEach(function(k){o.vend[id][k]=patch[k]});wr(o)}},
    deleteSeller:async function(id){var o=rd();delete o.vend[id];wr(o)},
    deleteAccount:async function(){var o=rd(),id=o.session;
      if(id){delete o.users[id];delete o.perfiles[id];delete o.vend[id]}
      delete o.session;wr(o);emit("SIGNED_OUT",null,"")}
  }
}
