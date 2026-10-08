Review only this packet, no tools. User requested Opus5 at xhigh. This is final independent evidence review of the owner-approved section21 disposable Windows/NTFS containment experiment, NOT product acceptance. One candidate, exactly three initial runs, one pre-execution correction consumed. All sources frozen after source-correction PASS. No more source corrections or runtime reruns authorized. Check nine claim/control mappings, full before/after maps and unintended deltas, actual native outcomes, process closure, cleanup, source identity, and overclaims. Return PASS or NOT PASS for bounded fixture evidence only, concrete blockers versus limitations, <=900 words. Root bootstrap above held ancestor, adversarial aliases, portable locking/takeover, durability, crash/quiescence, production packaging and owner approval of rename restrictions remain UNPROVED. Do not broaden the experiment. Reports below are complete raw JSON receipts including maps/events; source files are complete. Source review advisories are nonblocking, not authorization to weaken deadlines. The implementing agent compared all map deltas; only preregistered unsafe changes, positive/guarded owner writes and moved-directory post-exit owner rename occurred. Verify independently.

FILE: probe.rs
//! Disposable section21 probe; never a production installer helper.
use std::{ffi::c_void, io::{self, BufRead, Write}, mem, ptr};
use std::os::windows::ffi::OsStrExt;
type Handle = *mut c_void;
#[repr(C)] struct UnicodeString { length: u16, maximum_length: u16, buffer: *mut u16 }
#[repr(C)] struct ObjectAttributes { length: u32, root: Handle, name: *mut UnicodeString, attributes: u32, security: *mut c_void, qos: *mut c_void }
#[repr(C)] struct IoStatus { status: usize, information: usize }
#[repr(C)] struct FileTime { low: u32, high: u32 }
#[repr(C)] struct FileInfo { attributes: u32, creation: FileTime, access: FileTime, write: FileTime, volume: u32, size_high: u32, size_low: u32, links: u32, index_high: u32, index_low: u32 }
#[link(name="kernel32")]
extern "system" {
    fn CreateFileW(name: *const u16, access: u32, share: u32, security: *mut c_void, disposition: u32, flags: u32, template: Handle) -> Handle;
    fn CloseHandle(handle: Handle) -> i32;
    fn GetLastError() -> u32;
    fn GetFileInformationByHandle(handle: Handle, info: *mut FileInfo) -> i32;
    fn GetVolumeInformationByHandleW(handle: Handle, name: *mut u16, len: u32, serial: *mut u32, max_component: *mut u32, flags: *mut u32, filesystem: *mut u16, fs_len: u32) -> i32;
    fn WriteFile(handle: Handle, data: *const u8, len: u32, written: *mut u32, overlapped: *mut c_void) -> i32;
    fn SetFileInformationByHandle(handle: Handle, class: u32, data: *const c_void, size: u32) -> i32;
}
#[link(name="ntdll")]
extern "system" { fn NtCreateFile(handle: *mut Handle, access: u32, attrs: *mut ObjectAttributes, status: *mut IoStatus, allocation: *mut i64, file_attributes: u32, share: u32, disposition: u32, options: u32, ea: *mut c_void, ea_len: u32) -> i32; }

fn wide(path: &std::path::Path) -> Vec<u16> { path.as_os_str().encode_wide().chain(Some(0)).collect() }
fn event(action: &str, outcome: &str, code: i64, detail: &str) {
    println!("{{\"action\":\"{action}\",\"outcome\":\"{outcome}\",\"osCode\":{code},\"detail\":{detail}}}");
    io::stdout().flush().expect("flush event");
}
struct Owned(Handle);
impl Owned { fn close(self) -> Result<(), u32> { let h=self.0; mem::forget(self); if unsafe { CloseHandle(h) } == 0 {Err(unsafe {GetLastError()})} else {Ok(())} } }
impl Drop for Owned { fn drop(&mut self) { unsafe { CloseHandle(self.0); } } }
fn absolute_dir(path: &std::path::Path) -> Result<Owned,u32> {
    let p=wide(path);
    let h=unsafe {CreateFileW(p.as_ptr(),0x001000a1,3,ptr::null_mut(),3,0x02200000,ptr::null_mut())};
    if h as isize == -1 {Err(unsafe {GetLastError()})} else {Ok(Owned(h))}
}
fn relative(root: Handle, name: &str, directory: bool, create: bool) -> Result<Owned,i32> {
    let mut w:Vec<u16>=name.encode_utf16().collect();
    let mut n=UnicodeString{length:(w.len()*2) as u16,maximum_length:(w.len()*2) as u16,buffer:w.as_mut_ptr()};
    let mut a=ObjectAttributes{length:mem::size_of::<ObjectAttributes>() as u32,root,name:&mut n,attributes:0x40,security:ptr::null_mut(),qos:ptr::null_mut()};
    let mut status=IoStatus{status:0,information:0}; let mut h=ptr::null_mut();
    let access=if directory {0x001000a1} else if create {0x00110102} else {0x00100081};
    let options=0x00200000|0x20|if directory {1} else {0x40};
    let result=unsafe {NtCreateFile(&mut h,access,&mut a,&mut status,ptr::null_mut(),0x80,3,if create {2} else {1},options,ptr::null_mut(),0)};
    if result<0 {Err(result)} else {Ok(Owned(h))}
}
fn info(h:Handle)->Result<FileInfo,u32> { let mut i:FileInfo=unsafe {mem::zeroed()}; if unsafe {GetFileInformationByHandle(h,&mut i)}==0 {Err(unsafe{GetLastError()})} else {Ok(i)} }
fn identity(h:Handle,label:&str)->Result<(),u32>{let i=info(h)?;event("open","success",0,&format!("{{\"label\":\"{label}\",\"volume\":{},\"indexHigh\":{},\"indexLow\":{},\"attributes\":{}}}",i.volume,i.index_high,i.index_low,i.attributes));Ok(())}
fn run()->Result<(),String>{
    let args:Vec<String>=std::env::args().collect();
    if args.len()!=2 {return Err("one private fixture argument required".into())}
    let root=std::path::PathBuf::from(&args[1]);
    let parent=absolute_dir(&root.join("ancestor")).map_err(|e|format!("parent open {e}"))?;
    event("open","success",0,"{\"label\":\"parent\",\"method\":\"CreateFileW\",\"access\":1048737,\"share\":3,\"disposition\":3,\"flags\":35651584}");
    identity(parent.0,"parent-identity").map_err(|e|e.to_string())?;
    if info(parent.0).map_err(|e|e.to_string())?.attributes & 0x400 !=0 {return Err("parent is reparse point".into())}
    let target=relative(parent.0,"target",true,false).map_err(|e|format!("target open {e}"))?;
    if info(target.0).map_err(|e|e.to_string())?.attributes & 0x400 !=0 {return Err("target is reparse point".into())}
    event("open","success",0,"{\"label\":\"guards\",\"method\":\"NtCreateFile\",\"access\":1048737,\"share\":3,\"disposition\":1,\"options\":2097185}");
    let mut fs=[0u16;64]; let mut serial=0;let mut max=0;let mut flags=0;
    let vol=unsafe{GetVolumeInformationByHandleW(target.0,ptr::null_mut(),0,&mut serial,&mut max,&mut flags,fs.as_mut_ptr(),64)};
    if vol==0{return Err(format!("volume query {}",unsafe{GetLastError()}))}
    let end=fs.iter().position(|v|*v==0).unwrap_or(fs.len());
    let filesystem=String::from_utf16_lossy(&fs[..end]);
    if filesystem!="NTFS"{return Err(format!("unqualified filesystem {filesystem}"))}
    event("open","success",0,&format!("{{\"label\":\"volume\",\"method\":\"GetVolumeInformationByHandleW\",\"filesystem\":\"{filesystem}\",\"serial\":{serial},\"flags\":{flags},\"maxComponent\":{max}}}"));
    identity(target.0,"target").map_err(|e|e.to_string())?;
    let mut owned:Option<Owned>=None;
    event("barrier","success",0,"{\"label\":\"ready\"}");
    for line in io::stdin().lock().lines(){match line.map_err(|e|e.to_string())?.as_str(){
        "create"=>{
            if owned.is_some(){return Err("already owns probe file".into())}
            match relative(target.0,"probe.txt",false,true){
                Ok(h)=>{let bytes=b"candidate-owned";let mut count=0;let ok=unsafe{WriteFile(h.0,bytes.as_ptr(),bytes.len() as u32,&mut count,ptr::null_mut())};
                    if ok==0 || count!=bytes.len() as u32{return Err(format!("write failed/short {} {count}",unsafe{GetLastError()}))}
                    owned=Some(h);event("create","success",0,"{\"access\":1114370,\"share\":3,\"disposition\":2,\"options\":2097248}");},
                Err(e)=>event("create","refused",i64::from(e),"{\"access\":1114370,\"share\":3,\"disposition\":2,\"options\":2097248}")
            }
        },
        "cleanup"=>{let h=owned.take().ok_or("no owned file")?;let delete:u8=1;
            let ok=unsafe{SetFileInformationByHandle(h.0,4,&delete as *const u8 as *const c_void,1)};
            if ok==0{return Err(format!("delete disposition {}",unsafe{GetLastError()}))}
            h.close().map_err(|e|format!("owned close {e}"))?;event("remove","success",0,"{\"method\":\"SetFileInformationByHandle\",\"class\":4}");},
        "inspect"=>{match relative(target.0,"probe.txt",false,false){
            Ok(h)=>{let i=info(h.0).map_err(|e|e.to_string())?;let outcome=if i.attributes & (0x400|0x10)!=0 {"refused"} else {"success"};
                event("open",outcome,0,&format!("{{\"label\":\"inspect\",\"attributes\":{},\"access\":1048705,\"share\":3,\"disposition\":1,\"options\":2097248}}",i.attributes));},
            Err(e)=>event("open","refused",i64::from(e),"{\"label\":\"inspect\",\"access\":1048705,\"share\":3,\"disposition\":1,\"options\":2097248}")}},
        "exit"=>break,
        _=>return Err("unknown fixed action".into())
    }event("barrier","success",0,"{\"label\":\"done\"}");}
    if owned.is_some(){return Err("exit with retained owned file".into())}
    target.close().map_err(|e|format!("target close {e}"))?;
    parent.close().map_err(|e|format!("parent close {e}"))?;
    event("close","success",0,"{\"label\":\"guards\"}");Ok(())
}
fn main(){if let Err(error)=run(){eprintln!("{error}");std::process::exit(1)}}


FILE: supervisor.cjs
'use strict';
// Section21 disposable experiment. Not imported or shipped by the installer.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const root = __dirname;
const repo = path.resolve(root, '../..');
const evidence = path.join(repo, '.planning/evidence/p07-containment-spike-2026-09-20');
const compiler = 'C:/Users/Destiny/.rustup/toolchains/1.98.0-x86_64-pc-windows-msvc/bin/rustc.exe';
const sysroot = path.dirname(path.dirname(compiler));
const IDS = Object.freeze({
  'parent-swap': ['parent-outside-preserved', 'alias-same-object', 'owner-file-write-preserved'],
  'leaf-swap': ['leaf-replacement-preserved', 'leaf-type-enforced', 'owner-rename-effect-recorded'],
  'moved-directory': ['moved-object-boundary', 'ancestor-rename-effect-recorded', 'guard-exit-effect-recorded']
});
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const digest = file => sha(fs.readFileSync(file));
const mkdir = dir => fs.mkdirSync(dir, { recursive: true });
const write = (file, value) => fs.writeFileSync(file, value);
const identity = file => { const s = fs.statSync(file, { bigint: true }); return `${s.dev}:${s.ino}`; };
const load = () => ({ cpus: os.cpus().map(c => c.times), freeMemory: os.freemem(), totalMemory: os.totalmem(), loadAverage: os.loadavg() });
function privateEnv(home) {
  const replace = new Set(['HOME','USERPROFILE','APPDATA','LOCALAPPDATA','XDG_CONFIG_HOME','XDG_CACHE_HOME','XDG_DATA_HOME','CARGO_HOME','RUSTUP_HOME','TEMP','TMP','NODE_OPTIONS','NODE_TEST_CONTEXT','PSMODULEANALYSISCACHEPATH','CLAUDE_CONFIG_DIR','CODEX_HOME','GSD_HOME','RUSTUP_AUTO_INSTALL']);
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !replace.has(k.toUpperCase())));
  for (const [key, sub] of Object.entries({HOME:'',USERPROFILE:'',APPDATA:'AppData/Roaming',LOCALAPPDATA:'AppData/Local',XDG_CONFIG_HOME:'.config',XDG_CACHE_HOME:'.cache',XDG_DATA_HOME:'.local/share',CARGO_HOME:'cargo',RUSTUP_HOME:'rustup',TEMP:'temp',TMP:'temp',CLAUDE_CONFIG_DIR:'.claude',CODEX_HOME:'.codex',GSD_HOME:'.gsd'})) {
    env[key] = path.join(home, sub); mkdir(env[key]);
  }
  env.RUSTUP_AUTO_INSTALL = '0'; return env;
}
function mapTree(base) {
  const result = {};
  function visit(dir, prefix) {
    for (const name of fs.readdirSync(dir).sort()) {
      const file = path.join(dir, name), key = prefix ? `${prefix}/${name}` : name;
      const st = fs.lstatSync(file);
      if (st.isSymbolicLink()) result[key] = `link:${fs.readlinkSync(file)}`;
      else if (st.isDirectory()) { result[key] = 'dir'; visit(file, key); }
      else if (st.isFile()) result[key] = `file:${digest(file)}`;
      else throw new Error(`unsupported fixture entry ${key}`);
    }
  }
  visit(base, ''); return result;
}
function safeRemove(base, allowedRoot) {
  const absolute = path.resolve(base), boundary = path.resolve(allowedRoot);
  if (absolute === boundary || !absolute.startsWith(boundary + path.sep)) throw new Error('cleanup boundary');
  const st = fs.lstatSync(absolute);
  if (st.isSymbolicLink() || st.isFile()) fs.unlinkSync(absolute);
  else if (st.isDirectory()) { for (const n of fs.readdirSync(absolute)) safeRemove(path.join(absolute,n),boundary); fs.rmdirSync(absolute); }
  else throw new Error('unsupported cleanup entry');
}
function fixture(base) {
  const p = { base, parent:path.join(base,'ancestor'), target:path.join(base,'ancestor/target'), outside:path.join(base,'outside'), alias:path.join(base,'alias') };
  mkdir(p.target); mkdir(p.outside);
  write(path.join(p.target,'owner.txt'),'owner-original');
  write(path.join(p.outside,'probe.txt'),'outside-sentinel');
  write(path.join(p.outside,'sentinel.txt'),'outside-extra');
  fs.symlinkSync(p.target,p.alias,'junction'); return p;
}
async function main() {
  const input = JSON.parse(process.argv[2] || 'null');
  if (process.argv.length !== 3 || !input || Array.isArray(input) || Object.keys(input).sort().join(',') !== 'caseId,schema' || input.schema !== 1 || !Object.hasOwn(IDS,input.caseId)) throw new Error('invalid closed supervisor input');
  if (process.platform !== 'win32') throw new Error('Windows only');
  mkdir(evidence);
  const indexFile = path.join(evidence,'index.json');
  const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile,'utf8')) : { schema:1, candidate:'windows-relative-handles-v1', correctionCount:0, stopped:false, cases:Object.fromEntries(Object.keys(IDS).map(id=>[id,{status:'unattempted',reason:'serial case not yet reached'}])), runs:[] };
  let supersedes=null;
  if (index.stopped || index.cases[input.caseId].status !== 'unattempted') {
    // A reviewed defect correction is preregistered by the implementing agent in
    // the index. Never infer retry authority from failure or elapsed time.
    const c=index.correction;
    if (!c || c.consumed || index.correctionCount!==1 || c.caseId!==input.caseId || c.kind!=='reviewed-probe-defect' || !c.reviewReceipt || !c.reason || !index.runs.some(r=>r.runId===c.supersededRunId && r.caseId===input.caseId) || ['timeout','refuted','missing-positive','toolchain'].includes(index.stopReason)) throw new Error('study stopped; no eligible reviewed correction');
    supersedes=c.supersededRunId;c.consumed=true;
  }
  const runId = crypto.randomUUID(), startedAt = new Date().toISOString(), start = performance.now();
  const runRoot = path.join(root,'runs',runId), buildDir = path.join(root,'build',runId);
  mkdir(buildDir); const buildEnv = privateEnv(path.join(buildDir,'home'));
  const binary = path.join(buildDir,'probe.exe');
  const sources = ['probe.rs','supervisor.cjs','README.md'].map(name=>({path:name,sha256:digest(path.join(root,name))}));
  const buildCommand = [compiler,'--edition=2021','--crate-name','containment_probe','--sysroot',sysroot,'-D','warnings','-C',`incremental=${path.join(buildDir,'incremental')}`,path.join(root,'probe.rs'),'-o',binary];
  const version = spawnSync(compiler,['--version','--verbose'],{env:buildEnv,encoding:'utf8',timeout:60000,windowsHide:true});
  const build = version.status === 0 ? spawnSync(compiler,buildCommand.slice(1),{env:buildEnv,encoding:'utf8',timeout:60000,windowsHide:true}) : version;
  const buildLog = {version:{status:version.status,error:version.error?.message,stdout:version.stdout,stderr:version.stderr},build:{status:build.status,error:build.error?.message,stdout:build.stdout,stderr:build.stderr},command:buildCommand};
  fs.writeFileSync(path.join(evidence,`${runId}-build.json`),JSON.stringify(buildLog,null,2),{flag:'wx'});
  const report = {schema:1,runId,caseId:input.caseId,candidate:'windows-relative-handles-v1',scope:{platform:'win32',filesystem:'NTFS',aliases:['case','fixture-junction']},nonClaims:['portable-lock-safety','automatic-takeover','child-quiescence','power-loss','owner-impact-acceptance','production-readiness','symbolic-link-traversal','release-latency-bound'],provenance:{sources,compilerExecutable:compiler,compilerVersion:version.stdout?.trim()||null,sysroot,buildCommand,binaryPath:binary,binarySha256:build.status===0?digest(binary):null,sourceStable:false,binaryStable:false},environment:{osRelease:os.release(),arch:os.arch(),node:process.version,bun:spawnSync('bun',['--version'],{env:buildEnv,encoding:'utf8',windowsHide:true,timeout:10000}).stdout?.trim(),filesystemEvidence:null,hostLoadBefore:load(),hostLoadAfter:null},timing:{startedAt,endedAt:null,deadlineMs:180000},verdict:'unverified',claims:IDS[input.caseId].map(id=>({id,status:'unverified',reason:'not reached',events:[],positiveControl:{id:`positive:${id}`,outcome:'not-reached',events:[]},unsafeControl:{id:`unsafe:${id}`,outcome:'not-reached',events:[]}})),events:[],ownerState:{before:{},after:{},expectedOwnerWrites:[]},targetState:{before:{},after:{}},children:[],cleanup:{complete:false,retainedPaths:[],errors:[]}};
  report.environment.bun ??= null;
  const children = new Set(); const closures=new Map(); let deadline; let failed = null; let env; let cancelled=false; let workPromise=null; let measuredStart=null;
  const checkpoint=()=>{if(cancelled)throw new Error('case cancelled');if(measuredStart!==null&&performance.now()-measuredStart>=175000){cancelled=true;throw new Error('case timeout');}};
  const emit = (actor, action, outcome, osCode, detail) => { const e={sequence:report.events.length+1,actor,action,outcome,osCode,elapsedMs:Math.round(performance.now()-start),detail}; report.events.push(e); return e.sequence; };
  const action = (name, fn, detail={}) => { checkpoint();try { const value=fn(); emit('owner',name,'success',0,{...detail,codeDomain:'libuv'}); return {ok:true,value}; } catch(error) { emit('owner',name,'refused',error.errno??null,{...detail,codeDomain:'libuv',symbol:error.code??null,error:error.message}); return {ok:false,error}; } };
  const expect = (condition,message) => { if(!condition) throw new Error(message); };
  const native = async (p, phase) => {
    checkpoint();
    const child = spawn(binary,[p.base],{env,cwd:runRoot,stdio:['pipe','pipe','pipe'],windowsHide:true}); children.add(child);
    const childRow={actor:'candidate',pid:child.pid??null,exitCode:null,signal:null,closeObserved:false};report.children.push(childRow);
    let pending=[],queue=[],buffer='',stderr='',closed=false,protocolError=null;
    let closeResolve; const closePromise=new Promise(resolve=>{closeResolve=resolve;});
    closures.set(child,closePromise);
    const fail = error => { protocolError=error; for(const q of pending.splice(0)) q.reject(error); };
    const timer=setTimeout(()=>{fail(new Error('child timeout'));child.kill();},60000);
    child.on('error',fail);
    child.stderr.on('data',b=>{stderr+=b; if(stderr.length>65536){fail(new Error('stderr bound'));child.kill();}});
    child.stdout.on('data',b=>{
      buffer+=b; if(buffer.length>65536){fail(new Error('event buffer bound'));child.kill();return;}
      while(buffer.includes('\n')) { const at=buffer.indexOf('\n'),line=buffer.slice(0,at).trim();buffer=buffer.slice(at+1);if(!line)continue;
        try { const event=JSON.parse(line); if(!['open','create','close','remove','write','rename','junction','barrier','process-exit'].includes(event.action)||!['success','refused','error','not-reached'].includes(event.outcome)||!Number.isInteger(event.osCode)||!event.detail||report.events.length>10000)throw new Error('malformed native event');
          const sequence=emit('candidate',event.action,event.outcome,event.osCode,{...event.detail,phase,codeDomain:event.osCode<0?'NTSTATUS':'Win32',statusHex:`0x${(event.osCode>>>0).toString(16).padStart(8,'0')}`});
          if(event.detail.label==='volume')report.environment.filesystemEvidence=event.detail;
          if(event.action==='barrier'){const item={label:event.detail.label,sequence};const waiter=pending.shift();if(waiter)waiter.resolve(item);else queue.push(item);}
        } catch(error){fail(error);child.kill();}
      }
    });
    child.on('close',(code,signal)=>{closed=true;clearTimeout(timer);children.delete(child);Object.assign(childRow,{exitCode:code,signal,closeObserved:true});emit('candidate','process-exit',code===0?'success':'error',code,{phase,signal,stderr});fail(new Error(`child closed ${code}: ${stderr}`));closeResolve();});
    const barrier = async label => {checkpoint();if(protocolError)throw protocolError; const next=queue.length?queue.shift():await new Promise((resolve,reject)=>pending.push({resolve,reject}));checkpoint();expect(next.label===label,'barrier mismatch');};
    await barrier('ready');
    return {command:async name=>{checkpoint();if(closed)throw new Error('closed child');child.stdin.write(name+'\n');await barrier('done');},close:async()=>{checkpoint();child.stdin.end('exit\n');await closePromise;expect(childRow.exitCode===0,'native child did not close successfully');},closePromise};
  };
  const rows = () => report.claims;
  const fill = (kind, first, outcome) => {
    const positive=kind==='positiveControl';
    const selectors={
      'parent-outside-preserved':e=>positive?['create','remove'].includes(e.action):e.detail.outsideDamageDetected,
      'alias-same-object':e=>positive?e.detail.aliasIds:e.detail.aliasMismatchDetected,
      'owner-file-write-preserved':e=>positive?e.detail.ownerWritePreserved:e.detail.lostOwnerWriteDetected,
      'leaf-replacement-preserved':e=>positive?['create','remove'].includes(e.action):e.detail.replacementDamageDetected,
      'leaf-type-enforced':e=>positive?e.detail.label==='inspect':e.detail.forbiddenDescentDetected,
      'owner-rename-effect-recorded':e=>positive?e.detail.label==='guards':e.action==='rename',
      'moved-object-boundary':e=>positive?['create','remove'].includes(e.action):e.detail.movedBoundaryViolation,
      'ancestor-rename-effect-recorded':e=>positive?e.detail.label==='parent':e.action==='rename'&&e.detail.kind==='ancestor',
      'guard-exit-effect-recorded':e=>positive?e.action==='process-exit'||e.action==='close':e.action==='rename'&&e.detail.kind==='target'
    };
    for(const c of rows()) { const selected=report.events.filter(e=>e.sequence>=first&&selectors[c.id](e));expect(selected.length>0,`missing ${kind} events for ${c.id}`);c[kind]={id:`${positive?'positive':'unsafe'}:${c.id}`,outcome,events:selected.map(e=>e.sequence)}; }
  };
  try {
    expect(build.status===0 && !build.error,'pre-measurement build unavailable');
    mkdir(runRoot);env=privateEnv(path.join(runRoot,'home'));
    const unsafe = fixture(path.join(runRoot,'unsafe')), positive = fixture(path.join(runRoot,'positive')), guarded=fixture(path.join(runRoot,'guarded'));
    report.ownerState.before=mapTree(runRoot);report.targetState.before={unsafe:mapTree(unsafe.target),positive:mapTree(positive.target),guarded:mapTree(guarded.target)};
    report.ownerState.expectedOwnerWrites=[{phase:'unsafe',rule:'preregistered deliberate violations only',caseId:input.caseId},{phase:'positive',path:'ancestor/target/owner.txt',after:`file:${sha('owner-updated')}`},{phase:'guarded',path:'ancestor/target/owner.txt',after:`file:${sha('owner-updated')}`,conditional:'path remains in place'},{phase:'guarded',operation:'rename target to after-exit',conditional:'moved-directory only, after child close'}];
    measuredStart=performance.now();report.timing.startedAt=new Date().toISOString();
    const work=async()=>{
      checkpoint();
      let first=report.events.length+1;
      emit('supervisor','barrier','success',0,{phase:'unsafe',guardAbsent:true});
      if(input.caseId==='parent-swap'){
        const original=identity(unsafe.alias);fs.unlinkSync(unsafe.alias);fs.symlinkSync(unsafe.outside,unsafe.alias,'junction');expect(identity(unsafe.alias)!==original,'unsafe alias detector did not catch replacement');emit('owner','junction','success',0,{phase:'unsafe',aliasMismatchDetected:true});
        const owner=path.join(unsafe.target,'owner.txt');write(owner,'owner-updated');write(owner,'owner-original');expect(fs.readFileSync(owner,'utf8')!=='owner-updated','unsafe lost write not detected');emit('owner','write','success',0,{phase:'unsafe',lostOwnerWriteDetected:true});
        fs.renameSync(unsafe.target,path.join(unsafe.base,'moved'));fs.symlinkSync(unsafe.outside,unsafe.target,'junction');write(path.join(unsafe.target,'probe.txt'),'unsafe-overwrite');expect(fs.readFileSync(path.join(unsafe.outside,'probe.txt'),'utf8')==='unsafe-overwrite','unsafe outside detector failed');emit('owner','write','success',0,{phase:'unsafe',outsideDamageDetected:true});
      }else if(input.caseId==='leaf-swap'){
        const leaf=path.join(unsafe.target,'probe.txt');write(leaf,'observed-old');fs.unlinkSync(leaf);write(leaf,'owner-new');write(leaf,'unsafe-overwrite');expect(fs.readFileSync(leaf,'utf8')!=='owner-new','unsafe replacement detector failed');emit('owner','write','success',0,{phase:'unsafe',replacementDamageDetected:true});fs.unlinkSync(leaf);fs.symlinkSync(unsafe.outside,leaf,'junction');expect(fs.readFileSync(path.join(leaf,'sentinel.txt'),'utf8')==='outside-extra','unsafe junction descent not observed');emit('owner','open','success',0,{phase:'unsafe',forbiddenDescentDetected:true});expect(action('rename',()=>fs.renameSync(unsafe.target,path.join(unsafe.base,'moved')),{phase:'unsafe'}).ok,'unguarded rename unavailable');
      }else{
        expect(action('rename',()=>fs.renameSync(unsafe.target,path.join(unsafe.base,'moved')),{phase:'unsafe',kind:'target'}).ok,'unguarded target rename unavailable');write(path.join(unsafe.base,'moved/owner.txt'),'unsafe-post-move');expect(fs.readFileSync(path.join(unsafe.base,'moved/owner.txt'),'utf8')==='unsafe-post-move','moved object violation not detected');emit('owner','write','success',0,{phase:'unsafe',movedBoundaryViolation:true});expect(action('rename',()=>fs.renameSync(unsafe.parent,path.join(unsafe.base,'ancestor-moved')),{phase:'unsafe',kind:'ancestor'}).ok,'unguarded ancestor rename unavailable');
      }
      fill('unsafeControl',first,'violation-observed');
      first=report.events.length+1;
      const pos=await native(positive,'positive');await pos.command('create');expect(fs.readFileSync(path.join(positive.target,'probe.txt'),'utf8')==='candidate-owned','positive create/write failed');await pos.command('cleanup');expect(!fs.existsSync(path.join(positive.target,'probe.txt')),'positive handle cleanup failed');
      write(path.join(positive.target,'probe.txt'),'positive-regular');await pos.command('inspect');
      expect(report.events.filter(e=>e.actor==='candidate'&&e.action==='open'&&e.detail.label==='inspect').at(-1)?.outcome==='success','positive native regular open failed');fs.unlinkSync(path.join(positive.target,'probe.txt'));
      const targetId=identity(positive.target);expect(identity(positive.target.toUpperCase())===targetId && identity(positive.alias)===targetId,'positive aliases differ');emit('owner','open','success',0,{phase:'positive',aliasIds:{target:targetId,case:identity(positive.target.toUpperCase()),junction:identity(positive.alias)}});
      write(path.join(positive.target,'owner.txt'),'owner-updated');expect(fs.readFileSync(path.join(positive.target,'owner.txt'),'utf8')==='owner-updated','positive owner write failed');emit('owner','write','success',0,{phase:'positive',ownerWritePreserved:true});await pos.close();fill('positiveControl',first,'api-success-observed');
      checkpoint();first=report.events.length+1;
      const guard=await native(guarded,'guarded'), outsideBefore=mapTree(guarded.outside);
      const setClaim=(id,ok,reason,from)=>{const c=rows().find(c=>c.id===id);c.status=ok===null?'unverified':ok?'mechanism-observed-in-fixture':'refuted';c.reason=reason;c.events=report.events.filter(e=>e.sequence>=from).map(e=>e.sequence);};
      const lastNative=(name)=>report.events.filter(e=>e.actor==='candidate'&&e.action===name&&e.detail.phase==='guarded').at(-1);
      const renameGuarded=(kind)=>action('rename',()=>fs.renameSync(kind==='target'?guarded.target:guarded.parent,path.join(guarded.base,`${kind}-moved`)),{phase:'guarded',kind});
      const ownerWrite=(target)=>{const beforeEvent=report.events.length+1;const owner=path.join(target,'owner.txt');write(owner,'owner-updated');const preserved=fs.readFileSync(owner,'utf8')==='owner-updated';emit('owner','write',preserved?'success':'error',0,{phase:'guarded',ownerWritePreserved:preserved});return {preserved,beforeEvent};};
      let boundaryRefuted=false;
      if(input.caseId==='parent-swap'){
        let parentIntact=true,owned=false;
        for(const point of ['before-create','before-cleanup']){
          checkpoint();emit('supervisor','barrier','success',0,{phase:'guarded',point});
          for(const kind of ['target','ancestor']) {
            const attempt=renameGuarded(kind);
            if(attempt.ok){parentIntact=false;emit('supervisor','barrier','success',0,{phase:'guarded',counterexample:'held directory renamed',kind,point});break;}
          }
          if(!parentIntact){
            // Do not dereference the vanished pathname. Test the held object, record
            // the successful post-move mutation, then remove only our owned file.
            if(!owned){await guard.command('create');owned=lastNative('create')?.outcome==='success';}
            boundaryRefuted=owned;
            if(owned)await guard.command('cleanup');
            break;
          }
          // A junction at an occupied name yields EEXIST independently of sharing;
          // record it as context, never use it as protection evidence.
          action('junction',()=>fs.symlinkSync(guarded.outside,guarded.target,'junction'),{phase:'guarded',point,nonClaim:'occupied name collision, not guard evidence'});
          if(point==='before-create'){await guard.command('create');owned=lastNative('create')?.outcome==='success';expect(owned,'guarded relative create unavailable');}
          else {await guard.command('cleanup');owned=false;}
        }
        const outsideUnchanged=JSON.stringify(mapTree(guarded.outside))===JSON.stringify(outsideBefore);
        setClaim('parent-outside-preserved',!boundaryRefuted&&outsideUnchanged,'At/below held ancestor only; post-move mutation is a counterexample; occupied junction collision proves nothing',first);
        if(parentIntact){
          const from=report.events.length+1,targetId=identity(guarded.target);
          const ids={target:targetId,case:identity(guarded.target.toUpperCase()),junction:identity(guarded.alias)};
          emit('owner','open','success',0,{phase:'guarded',aliasIds:ids,nonAdversarial:true});
          setClaim('alias-same-object',ids.target===ids.case&&ids.target===ids.junction,'Pre-existing aliases only; sibling alias replacement is not protected by the guard',from);
          const ow=ownerWrite(guarded.target);setClaim('owner-file-write-preserved',ow.preserved,'Readback of actual owner write while guard held',ow.beforeEvent);
        }
      }else if(input.caseId==='leaf-swap'){
        let preserved=true,typed=true;const from=report.events.length+1;
        for(const kind of ['file','directory','junction']){
          checkpoint();const leaf=path.join(guarded.target,'probe.txt');write(leaf,'observed-old');const observed=digest(leaf);
          emit('supervisor','barrier','success',0,{phase:'guarded',point:'after-leaf-observation',observed,kind});fs.unlinkSync(leaf);
          if(kind==='file')write(leaf,'owner-replacement');else if(kind==='directory')mkdir(leaf);else fs.symlinkSync(guarded.outside,leaf,'junction');
          const before=mapTree(guarded.target);await guard.command('create');
          const createResult=lastNative('create');expect(createResult,'missing guarded create event');
          const unchanged=JSON.stringify(mapTree(guarded.target))===JSON.stringify(before);
          preserved=preserved&&unchanged&&createResult.outcome==='refused';
          emit('supervisor','barrier',unchanged?'success':'error',0,{phase:'guarded',kind,replacementMapBefore:before,replacementMapAfter:mapTree(guarded.target)});
          if(createResult.outcome==='success'){
            boundaryRefuted=true;await guard.command('cleanup');break;
          }
          await guard.command('inspect');const lastOpen=report.events.filter(e=>e.actor==='candidate'&&e.action==='open'&&e.detail.label==='inspect'&&e.detail.phase==='guarded').at(-1);
          expect(lastOpen,'missing guarded inspect event');typed=typed&&(kind==='file'?lastOpen.outcome==='success':lastOpen.outcome==='refused');
          if(kind==='directory')fs.rmdirSync(leaf);else fs.unlinkSync(leaf);
        }
        setClaim('leaf-replacement-preserved',preserved,'All replacement entry maps remain unchanged and exclusive create refuses collision',from);
        setClaim('leaf-type-enforced',boundaryRefuted?null:typed,'Regular replacement may be inspected; directory/junction inspection refuses without descent',from);
        const renameStart=report.events.length+1;const attempted=renameGuarded('target');
        setClaim('owner-rename-effect-recorded',true,`Observed owner rename ${attempted.ok?'success':'refusal'}; numeric code is libuv, not a Win32 sharing diagnosis`,renameStart);
        if(!attempted.ok)ownerWrite(guarded.target);
      }else{
        const from=report.events.length+1;const targetAttempt=renameGuarded('target');
        const ancestorStart=report.events.length+1;const ancestorAttempt=renameGuarded('ancestor');
        setClaim('ancestor-rename-effect-recorded',true,`Observed ancestor rename ${ancestorAttempt.ok?'success':'refusal'}; libuv status only`,ancestorStart);
        await guard.command('create');expect(lastNative('create'),'missing guarded create event');
        const created=lastNative('create').outcome==='success';
        boundaryRefuted=(targetAttempt.ok||ancestorAttempt.ok)&&created;
        setClaim('moved-object-boundary',boundaryRefuted?false:created||targetAttempt.ok||ancestorAttempt.ok?true:null,'A moved handle may not authorize post-move mutation; candidate refusal is safe; no claim above held ancestor',from);
        if(created)await guard.command('cleanup');
        if(!targetAttempt.ok&&!ancestorAttempt.ok)ownerWrite(guarded.target);
        await guard.close();
        const retryStart=report.events.length+1;
        const currentTarget=targetAttempt.ok?path.join(guarded.base,'target-moved'):ancestorAttempt.ok?path.join(guarded.base,'ancestor-moved/target'):guarded.target;
        const retry=action('rename',()=>fs.renameSync(currentTarget,path.join(guarded.base,'after-exit')),{phase:'guarded',point:'after-child-close'});
        setClaim('guard-exit-effect-recorded',true,`Post-close retry observed ${retry.ok?'success':'refusal'}; one observation supplies no release-latency bound`,retryStart);
      }
      if(input.caseId!=='moved-directory')await guard.close();
      if(JSON.stringify(mapTree(guarded.outside))!==JSON.stringify(outsideBefore)){
        const id=input.caseId==='parent-swap'?'parent-outside-preserved':input.caseId==='leaf-swap'?'leaf-replacement-preserved':'moved-object-boundary';
        setClaim(id,false,'Outside sentinel map changed during guarded phase',first);
      }
      checkpoint();
    };
    workPromise=work();
    await Promise.race([workPromise,new Promise((_,reject)=>{deadline=setTimeout(()=>{cancelled=true;reject(new Error('case timeout'));},175000);})]);
  } catch(error) {failed=error.message;emit('supervisor','barrier','error',null,{failure:failed});}
  finally {
    clearTimeout(deadline);
    cancelled=true;
    const remaining=()=>measuredStart===null?5000:Math.max(0,180000-(performance.now()-measuredStart));
    for(const child of [...children]) child.kill();
    const settled=await Promise.race([Promise.all([...closures.values(),...(workPromise?[workPromise.catch(()=>{})]:[])]).then(()=>true),new Promise(resolve=>{const t=setTimeout(()=>resolve(false),remaining());t.unref();})]);
    const allClosed=report.children.every(c=>c.closeObserved);
    try {if(settled&&remaining()>0&&fs.existsSync(runRoot)){report.ownerState.after=mapTree(runRoot);for(const phase of ['unsafe','positive','guarded']){const p=path.join(runRoot,phase,'ancestor/target');if(!fs.existsSync(p))report.targetState.after[phase]={state:'missing'};else if(fs.lstatSync(p).isSymbolicLink())report.targetState.after[phase]={state:'link',target:fs.readlinkSync(p)};else report.targetState.after[phase]={state:'directory',map:mapTree(p)};}}}catch(e){failed=failed||e.message;}
    report.provenance.sourceStable=sources.every(s=>digest(path.join(root,s.path))===s.sha256);
    report.provenance.binaryStable=report.provenance.binarySha256!==null && fs.existsSync(binary) && digest(binary)===report.provenance.binarySha256;
    if(allClosed&&settled&&remaining()>0){try{if(fs.existsSync(runRoot))safeRemove(runRoot,path.join(root,'runs'));report.cleanup.complete=remaining()>0;if(!report.cleanup.complete)report.cleanup.errors.push('cleanup exceeded case deadline');}catch(e){report.cleanup.errors.push(e.message);}}
    else report.cleanup.errors.push('work/child settlement or cleanup deadline not confirmed');
    if(fs.existsSync(runRoot))report.cleanup.retainedPaths.push(runRoot);
    report.environment.hostLoadAfter=load();report.timing.endedAt=new Date().toISOString();
    if(failed){for(const c of rows()){if(c.status==='unverified')c.reason=failed;}}
    const valid=!failed && report.provenance.sourceStable && report.provenance.binaryStable && allClosed && report.cleanup.complete && report.environment.filesystemEvidence?.filesystem==='NTFS' && rows().every(c=>c.positiveControl.outcome==='api-success-observed'&&c.unsafeControl.outcome==='violation-observed');
    report.verdict=!valid?'unverified':rows().some(c=>c.status==='refuted')?'refuted':rows().some(c=>c.status==='unverified')?'unverified':'mechanism-observed-in-fixture';
    const receipt=`${runId}-${input.caseId}.json`;fs.writeFileSync(path.join(evidence,receipt),JSON.stringify(report,null,2),{flag:'wx'});
    fs.writeFileSync(path.join(evidence,`${runId}-events.jsonl`),report.events.map(e=>JSON.stringify(e)).join('\n')+'\n',{flag:'wx'});
    index.cases[input.caseId]={status:report.verdict,receipt,reason:failed||'see claim/control records'};index.runs.push({runId,caseId:input.caseId,receipt,supersedes});index.stopped=report.verdict!=='mechanism-observed-in-fixture';
    index.stopReason=!index.stopped?null:build.status!==0?'toolchain':failed?.includes('timeout')?'timeout':report.verdict==='refuted'?'refuted':rows().some(c=>c.positiveControl.outcome!=='api-success-observed')?'missing-positive':'unclassified-unverified';
    fs.writeFileSync(indexFile,JSON.stringify(index,null,2));
    console.log(JSON.stringify({runId,caseId:input.caseId,verdict:report.verdict,claims:rows().map(c=>({id:c.id,status:c.status})),childrenClosed:allClosed,cleanup:report.cleanup,reason:failed,receipt}));
    if(index.stopped)process.exitCode=1;
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});


FILE: README.md
# Approved Windows containment experiment

Experimental only; execution-plan section21 owns scope and stop rules. One native
candidate, three cases, one initial run each, at most one defect correction total.
No product lock, recovery, installed-home or portable-safety acceptance.

Run the supervisor with exactly one JSON argument containing schema1 and caseId.
Cases run serially. The supervisor builds the fixed Rust source using the existing
1.98.0 compiler, without Cargo, downloads or rustup auto-install. Build precedes the
observation window; all runtime/build homes stay private. Each case includes unsafe,
positive and guarded phases with separate fixture instances and ordered pipe barriers.
The Node supervisor acts as the independent owner process; Rust is the guard process.

## Preregistered claim and control inventory

Every positive ID is `positive:<claim>`; every unsafe ID is `unsafe:<claim>`.
These nine rows define the eighteen IDs before any case execution.

| Case | Claim | Positive observation | Unsafe control without guard |
|---|---|---|---|
| parent-swap | parent-outside-preserved | Relative create/write and handle cleanup succeed, outside sentinel unchanged | Check parent then replace it with junction; path-based write alters outside sentinel |
| parent-swap | alias-same-object | Case and pre-existing junction aliases identify original directory | Repoint junction after observation; identity comparison detects replacement |
| parent-swap | owner-file-write-preserved | Owner writes existing file while guard holds directories | Simulated stale path writer overwrites the owner's update; digest comparison detects loss |
| leaf-swap | leaf-replacement-preserved | Relative create/handle cleanup succeed on absent leaf | An observed leaf is replaced; unguarded path write overwrites replacement |
| leaf-swap | leaf-type-enforced | Regular leaf is opened successfully by native API | Replace leaf with junction; path read follows it, detector sees forbidden descent |
| leaf-swap | owner-rename-effect-recorded | Native guard ready plus successful ordinary owner write | Owner rename succeeds without guard; guarded rename records refusal, with raw code |
| moved-directory | moved-object-boundary | Relative create/handle cleanup under held directory | Move directory then mutate moved object; outside-target map detects mutation |
| moved-directory | ancestor-rename-effect-recorded | Parent guard native open succeeds | Ancestor rename succeeds without guard; guarded attempt records actual result |
| moved-directory | guard-exit-effect-recorded | Native guard opens and emits close; child closure observed | Rename succeeds without guard, contrasting guarded refusal; retry follows actual child close |

Unsafe controls demonstrate detectors, not claims that a malicious editor is in
scope. Their intentional owner changes are recorded separately. Parent-swap attempts
both target and ancestor replacement before create and cleanup. Leaf case substitutes
regular file, directory and junction independently. Moved-directory checks both
target and ancestor movement. No symlink/UNC/network/8.3 or cross-platform inference.

The guard uses CreateFileW with FILE_FLAG_BACKUP_SEMANTICS and OPEN_REPARSE_POINT
on the private ancestor, then NtCreateFile RootDirectory-relative target/leaf opens.
Handles permit read/write sharing but deny delete sharing. Directory attributes are
checked on handles. New leaf uses FILE_CREATE, regular-file type requirement and
no-follow. Owned cleanup uses FileDispositionInfo on that same retained handle.
No read-then-path-delete is used by the candidate. Bootstrap containment above the
private fixture ancestor is not established by this experiment.

FFI signatures checked against Microsoft NtCreateFile, CreateFileW,
GetFileInformationByHandle, GetVolumeInformationByHandleW, WriteFile,
SetFileInformationByHandle and CloseHandle documentation. The repr(C) IO_STATUS_BLOCK
uses pointer-sized union storage and ULONG_PTR; BOOLEAN deletion data occupies one
byte. Explicit flags/access/share/disposition are included in native events.

Receipts retain full owner/target maps, source/binary hashes, native codes, lifecycle
events, per-claim controls, build output and failure data. Scope volume must actually
report NTFS. A failed positive control or timeout means UNVERIFIED and ends the study.
Refutation requires a valid positive control and a concrete violation. Success in
the fixture is not approval of the measured restrictions on owner renames.

Raw receipts and these sources require independent review. There is no new general
purpose validator. Sources/build outputs are retained under this ignored experimental
directory; receipt copies of source use .txt. All cleanup is bounded to the generated
run directory after child closure; links are unlinked without traversal.

## Review dispositions before execution

The initial packet-only Opus review was NOT PASS. Per-claim predicates/references,
guarded owner-write readback, defensive refutation paths, separate parent/target
native arguments, volume-query outputs and cancellation/settlement before cleanup
have been corrected before run1. Runtime cases remain unrun during this revision.
No warning suppression was added: the reviewed Rust source actually compiled under
rustc1.98.0 with -D warnings (retained probe-compile.json), contrary to the review's
dead-code prediction. The evidence directory already existed, but the supervisor
now creates it explicitly too. There is no extra native smoke run.

Owner-operation errors expose libuv numeric errno and symbolic codes, not raw Win32
sharing status. They prove the recorded operation succeeded/refused, not its precise
kernel cause. Candidate calls retain NTSTATUS/Win32 numeric code plus hex. Aliases
are pre-existing, non-adversarial identity observations; an unheld sibling alias is
not protected. Creating a junction over an occupied directory is recorded only as
context, never attributed to the guard. The unsafe parent replacement and directory
move controls expose real path races. The stale-owner/leaf overwrite controls test
digest/readback detection of intentional data loss, not concurrent scheduling.

Scope remains at/below the held ancestor; no root-bootstrap safety is claimed.
Manual review must compare the complete maps, including unanticipated owner deltas,
before accepting a fixture verdict. This is an additional acceptance requirement,
not permission to accept a false-positive automated result.

No automatic retry follows a timeout, missing positive, refutation or toolchain
failure. The review's suggestion to retry environment failures is rejected because
the approved stop rule requires returning to the owner. A single actual probe defect
may be corrected only with a recorded review and index.correction containing kind
reviewed-probe-defect, caseId, reason, reviewReceipt, supersededRunId and consumed:false,
with correctionCount1. Supervisor consumes it and records the new run's supersedes
link; immutable old receipts remain. This is documented manual preregistration, not
a user input flag. A second correction is forbidden. All such changes are reviewable.

The measured case starts after the private build/fixture setup. Work timeout175s
reserves5s of the180s case limit for child/work settlement and cleanup. Cancellation
is checked at barriers, no snapshot/removal is allowed while work remains unsettled,
and exceeding the cleanup deadline prevents success. Synchronous filesystem calls
cannot be preempted by a JavaScript timer; late completion is explicitly unverified,
not a claim of a kernel-enforced execution deadline.


RAW RECEIPT: 96bd71aa-e788-4600-b1cb-86d12c10c059-parent-swap.json
{
  "schema": 1,
  "runId": "96bd71aa-e788-4600-b1cb-86d12c10c059",
  "caseId": "parent-swap",
  "candidate": "windows-relative-handles-v1",
  "scope": {
    "platform": "win32",
    "filesystem": "NTFS",
    "aliases": [
      "case",
      "fixture-junction"
    ]
  },
  "nonClaims": [
    "portable-lock-safety",
    "automatic-takeover",
    "child-quiescence",
    "power-loss",
    "owner-impact-acceptance",
    "production-readiness",
    "symbolic-link-traversal",
    "release-latency-bound"
  ],
  "provenance": {
    "sources": [
      {
        "path": "probe.rs",
        "sha256": "0fb2a08b1025198f350b3707753ba44fff402010e8c7234d84499a6c64194e5d"
      },
      {
        "path": "supervisor.cjs",
        "sha256": "dd2b5d8d2673a5541a179ccb878772593bb4c554669a48ab8b14df5b1ded74af"
      },
      {
        "path": "README.md",
        "sha256": "236ac767199719a6992a8fd9e3051f212dd4bb39168b178d2a999276201fd0d0"
      }
    ],
    "compilerExecutable": "C:/Users/Destiny/.rustup/toolchains/1.98.0-x86_64-pc-windows-msvc/bin/rustc.exe",
    "compilerVersion": "rustc 1.98.0 (88d9e12ae 2026-08-18)\nbinary: rustc\ncommit-hash: 88d9e12ae178fab0fb5cc050a94da85685d449ea\ncommit-date: 2026-08-18\nhost: x86_64-pc-windows-msvc\nrelease: 1.98.0\nLLVM version: 22.1.8",
    "sysroot": "C:/Users/Destiny/.rustup/toolchains/1.98.0-x86_64-pc-windows-msvc",
    "buildCommand": [
      "C:/Users/Destiny/.rustup/toolchains/1.98.0-x86_64-pc-windows-msvc/bin/rustc.exe",
      "--edition=2021",
      "--crate-name",
      "containment_probe",
      "--sysroot",
      "C:/Users/Destiny/.rustup/toolchains/1.98.0-x86_64-pc-windows-msvc",
      "-D",
      "warnings",
      "-C",
      "incremental=C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\build\\96bd71aa-e788-4600-b1cb-86d12c10c059\\incremental",
      "C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\probe.rs",
      "-o",
      "C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\build\\96bd71aa-e788-4600-b1cb-86d12c10c059\\probe.exe"
    ],
    "binaryPath": "C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\build\\96bd71aa-e788-4600-b1cb-86d12c10c059\\probe.exe",
    "binarySha256": "1b027c539e5eb6605bac5a7559d03f84cda275cc3df55a74c2ff8fd44feeda5e",
    "sourceStable": true,
    "binaryStable": true
  },
  "environment": {
    "osRelease": "10.0.26200",
    "arch": "x64",
    "node": "v24.20.0",
    "bun": "1.3.5",
    "filesystemEvidence": {
      "label": "volume",
      "method": "GetVolumeInformationByHandleW",
      "filesystem": "NTFS",
      "serial": 540572784,
      "flags": 65482495,
      "maxComponent": 255
    },
    "hostLoadBefore": {
      "cpus": [
        {
          "user": 3908421,
          "nice": 0,
          "sys": 4565031,
          "idle": 20122125,
          "irq": 377765
        },
        {
          "user": 2171890,
          "nice": 0,
          "sys": 2472234,
          "idle": 23951375,
          "irq": 155093
        },
        {
          "user": 4577562,
          "nice": 0,
          "sys": 4278640,
          "idle": 19739296,
          "irq": 158921
        },
        {
          "user": 2390531,
          "nice": 0,
          "sys": 2356921,
          "idle": 23848046,
          "irq": 84578
        },
        {
          "user": 5218250,
          "nice": 0,
          "sys": 3615953,
          "idle": 19761296,
          "irq": 214687
        },
        {
          "user": 3728765,
          "nice": 0,
          "sys": 3076140,
          "idle": 21790593,
          "irq": 166828
        },
        {
          "user": 3663078,
          "nice": 0,
          "sys": 3024750,
          "idle": 21907671,
          "irq": 159218
        },
        {
          "user": 3745859,
          "nice": 0,
          "sys": 3049609,
          "idle": 21800031,
          "irq": 149187
        },
        {
          "user": 5777406,
          "nice": 0,
          "sys": 3657546,
          "idle": 19160546,
          "irq": 177828
        },
        {
          "user": 4246312,
          "nice": 0,
          "sys": 3076484,
          "idle": 21272703,
          "irq": 132562
        },
        {
          "user": 4267328,
          "nice": 0,
          "sys": 3070468,
          "idle": 21257703,
          "irq": 136078
        },
        {
          "user": 4350609,
          "nice": 0,
          "sys": 3043656,
          "idle": 21201234,
          "irq": 113734
        }
      ],
      "freeMemory": 2041229312,
      "totalMemory": 16512606208,
      "loadAverage": [
        0,
        0,
        0
      ]
    },
    "hostLoadAfter": {
      "cpus": [
        {
          "user": 3910218,
          "nice": 0,
          "sys": 4566390,
          "idle": 20131812,
          "irq": 377843
        },
        {
          "user": 2175781,
          "nice": 0,
          "sys": 2476500,
          "idle": 23956062,
          "irq": 155296
        },
        {
          "user": 4581343,
          "nice": 0,
          "sys": 4283234,
          "idle": 19743765,
          "irq": 159187
        },
        {
          "user": 2392578,
          "nice": 0,
          "sys": 2358625,
          "idle": 23857140,
          "irq": 84687
        },
        {
          "user": 5219312,
          "nice": 0,
          "sys": 3618171,
          "idle": 19770859,
          "irq": 214828
        },
        {
          "user": 3730312,
          "nice": 0,
          "sys": 3079046,
          "idle": 21798984,
          "irq": 166984
        },
        {
          "user": 3664593,
          "nice": 0,
          "sys": 3027703,
          "idle": 21916046,
          "irq": 159296
        },
        {
          "user": 3747593,
          "nice": 0,
          "sys": 3053015,
          "idle": 21807734,
          "irq": 149343
        },
        {
          "user": 5779109,
          "nice": 0,
          "sys": 3660812,
          "idle": 19168421,
          "irq": 177921
        },
        {
          "user": 4247984,
          "nice": 0,
          "sys": 3079687,
          "idle": 21280671,
          "irq": 132718
        },
        {
          "user": 4269031,
          "nice": 0,
          "sys": 3073546,
          "idle": 21265765,
          "irq": 136218
        },
        {
          "user": 4352671,
          "nice": 0,
          "sys": 3046484,
          "idle": 21209187,
          "irq": 113843
        }
      ],
      "freeMemory": 3406487552,
      "totalMemory": 16512606208,
      "loadAverage": [
        0,
        0,
        0
      ]
    }
  },
  "timing": {
    "startedAt": "2026-09-21T20:52:19.113Z",
    "endedAt": "2026-09-21T20:52:31.894Z",
    "deadlineMs": 180000
  },
  "verdict": "mechanism-observed-in-fixture",
  "claims": [
    {
      "id": "parent-outside-preserved",
      "status": "mechanism-observed-in-fixture",
      "reason": "At/below held ancestor only; post-move mutation is a counterexample; occupied junction collision proves nothing",
      "events": [
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38
      ],
      "positiveControl": {
        "id": "positive:parent-outside-preserved",
        "outcome": "api-success-observed",
        "events": [
          11,
          13
        ]
      },
      "unsafeControl": {
        "id": "unsafe:parent-outside-preserved",
        "outcome": "violation-observed",
        "events": [
          4
        ]
      }
    },
    {
      "id": "alias-same-object",
      "status": "mechanism-observed-in-fixture",
      "reason": "Pre-existing aliases only; sibling alias replacement is not protected by the guard",
      "events": [
        39
      ],
      "positiveControl": {
        "id": "positive:alias-same-object",
        "outcome": "api-success-observed",
        "events": [
          17
        ]
      },
      "unsafeControl": {
        "id": "unsafe:alias-same-object",
        "outcome": "violation-observed",
        "events": [
          2
        ]
      }
    },
    {
      "id": "owner-file-write-preserved",
      "status": "mechanism-observed-in-fixture",
      "reason": "Readback of actual owner write while guard held",
      "events": [
        40
      ],
      "positiveControl": {
        "id": "positive:owner-file-write-preserved",
        "outcome": "api-success-observed",
        "events": [
          18
        ]
      },
      "unsafeControl": {
        "id": "unsafe:owner-file-write-preserved",
        "outcome": "violation-observed",
        "events": [
          3
        ]
      }
    }
  ],
  "events": [
    {
      "sequence": 1,
      "actor": "supervisor",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 1472,
      "detail": {
        "phase": "unsafe",
        "guardAbsent": true
      }
    },
    {
      "sequence": 2,
      "actor": "owner",
      "action": "junction",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 1475,
      "detail": {
        "phase": "unsafe",
        "aliasMismatchDetected": true
      }
    },
    {
      "sequence": 3,
      "actor": "owner",
      "action": "write",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 1477,
      "detail": {
        "phase": "unsafe",
        "lostOwnerWriteDetected": true
      }
    },
    {
      "sequence": 4,
      "actor": "owner",
      "action": "write",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 1481,
      "detail": {
        "phase": "unsafe",
        "outsideDamageDetected": true
      }
    },
    {
      "sequence": 5,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14000,
      "detail": {
        "label": "parent",
        "method": "CreateFileW",
        "access": 1048737,
        "share": 3,
        "disposition": 3,
        "flags": 35651584,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 6,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14000,
      "detail": {
        "label": "parent-identity",
        "volume": 540572784,
        "indexHigh": 8716288,
        "indexLow": 238265,
        "attributes": 2064,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 7,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14000,
      "detail": {
        "label": "guards",
        "method": "NtCreateFile",
        "access": 1048737,
        "share": 3,
        "disposition": 1,
        "options": 2097185,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 8,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14000,
      "detail": {
        "label": "volume",
        "method": "GetVolumeInformationByHandleW",
        "filesystem": "NTFS",
        "serial": 540572784,
        "flags": 65482495,
        "maxComponent": 255,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 9,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14000,
      "detail": {
        "label": "target",
        "volume": 540572784,
        "indexHigh": 9633792,
        "indexLow": 238292,
        "attributes": 2064,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 10,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14000,
      "detail": {
        "label": "ready",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 11,
      "actor": "candidate",
      "action": "create",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14005,
      "detail": {
        "access": 1114370,
        "share": 3,
        "disposition": 2,
        "options": 2097248,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 12,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14005,
      "detail": {
        "label": "done",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 13,
      "actor": "candidate",
      "action": "remove",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14007,
      "detail": {
        "method": "SetFileInformationByHandle",
        "class": 4,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 14,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14007,
      "detail": {
        "label": "done",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 15,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14009,
      "detail": {
        "label": "inspect",
        "attributes": 2080,
        "access": 1048705,
        "share": 3,
        "disposition": 1,
        "options": 2097248,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 16,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14009,
      "detail": {
        "label": "done",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 17,
      "actor": "owner",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14010,
      "detail": {
        "phase": "positive",
        "aliasIds": {
          "target": "540572784:41376821576704724",
          "case": "540572784:41376821576704724",
          "junction": "540572784:41376821576704724"
        }
      }
    },
    {
      "sequence": 18,
      "actor": "owner",
      "action": "write",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14011,
      "detail": {
        "phase": "positive",
        "ownerWritePreserved": true
      }
    },
    {
      "sequence": 19,
      "actor": "candidate",
      "action": "close",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14012,
      "detail": {
        "label": "guards",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 20,
      "actor": "candidate",
      "action": "process-exit",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14026,
      "detail": {
        "phase": "positive",
        "signal": null,
        "stderr": ""
      }
    },
    {
      "sequence": 21,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14128,
      "detail": {
        "label": "parent",
        "method": "CreateFileW",
        "access": 1048737,
        "share": 3,
        "disposition": 3,
        "flags": 35651584,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 22,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14128,
      "detail": {
        "label": "parent-identity",
        "volume": 540572784,
        "indexHigh": 15532032,
        "indexLow": 240147,
        "attributes": 2064,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 23,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14128,
      "detail": {
        "label": "guards",
        "method": "NtCreateFile",
        "access": 1048737,
        "share": 3,
        "disposition": 1,
        "options": 2097185,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 24,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14129,
      "detail": {
        "label": "volume",
        "method": "GetVolumeInformationByHandleW",
        "filesystem": "NTFS",
        "serial": 540572784,
        "flags": 65482495,
        "maxComponent": 255,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 25,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14129,
      "detail": {
        "label": "target",
        "volume": 540572784,
        "indexHigh": 18808832,
        "indexLow": 240233,
        "attributes": 2064,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 26,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14129,
      "detail": {
        "label": "ready",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 27,
      "actor": "supervisor",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14130,
      "detail": {
        "phase": "guarded",
        "point": "before-create"
      }
    },
    {
      "sequence": 28,
      "actor": "owner",
      "action": "rename",
      "outcome": "refused",
      "osCode": -4082,
      "elapsedMs": 14131,
      "detail": {
        "phase": "guarded",
        "kind": "target",
        "codeDomain": "libuv",
        "symbol": "EBUSY",
        "error": "EBUSY: resource busy or locked, rename 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\guarded\\ancestor\\target' -> 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\guarded\\target-moved'"
      }
    },
    {
      "sequence": 29,
      "actor": "owner",
      "action": "rename",
      "outcome": "refused",
      "osCode": -4082,
      "elapsedMs": 14131,
      "detail": {
        "phase": "guarded",
        "kind": "ancestor",
        "codeDomain": "libuv",
        "symbol": "EBUSY",
        "error": "EBUSY: resource busy or locked, rename 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\guarded\\ancestor' -> 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\guarded\\ancestor-moved'"
      }
    },
    {
      "sequence": 30,
      "actor": "owner",
      "action": "junction",
      "outcome": "refused",
      "osCode": -4075,
      "elapsedMs": 14132,
      "detail": {
        "phase": "guarded",
        "point": "before-create",
        "nonClaim": "occupied name collision, not guard evidence",
        "codeDomain": "libuv",
        "symbol": "EEXIST",
        "error": "EEXIST: file already exists, symlink 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\guarded\\outside' -> 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\guarded\\ancestor\\target'"
      }
    },
    {
      "sequence": 31,
      "actor": "candidate",
      "action": "create",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14133,
      "detail": {
        "access": 1114370,
        "share": 3,
        "disposition": 2,
        "options": 2097248,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 32,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14133,
      "detail": {
        "label": "done",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 33,
      "actor": "supervisor",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14134,
      "detail": {
        "phase": "guarded",
        "point": "before-cleanup"
      }
    },
    {
      "sequence": 34,
      "actor": "owner",
      "action": "rename",
      "outcome": "refused",
      "osCode": -4082,
      "elapsedMs": 14134,
      "detail": {
        "phase": "guarded",
        "kind": "target",
        "codeDomain": "libuv",
        "symbol": "EBUSY",
        "error": "EBUSY: resource busy or locked, rename 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\guarded\\ancestor\\target' -> 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\guarded\\target-moved'"
      }
    },
    {
      "sequence": 35,
      "actor": "owner",
      "action": "rename",
      "outcome": "refused",
      "osCode": -4082,
      "elapsedMs": 14134,
      "detail": {
        "phase": "guarded",
        "kind": "ancestor",
        "codeDomain": "libuv",
        "symbol": "EBUSY",
        "error": "EBUSY: resource busy or locked, rename 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\guarded\\ancestor' -> 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\guarded\\ancestor-moved'"
      }
    },
    {
      "sequence": 36,
      "actor": "owner",
      "action": "junction",
      "outcome": "refused",
      "osCode": -4075,
      "elapsedMs": 14135,
      "detail": {
        "phase": "guarded",
        "point": "before-cleanup",
        "nonClaim": "occupied name collision, not guard evidence",
        "codeDomain": "libuv",
        "symbol": "EEXIST",
        "error": "EEXIST: file already exists, symlink 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\guarded\\outside' -> 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\guarded\\ancestor\\target'"
      }
    },
    {
      "sequence": 37,
      "actor": "candidate",
      "action": "remove",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14135,
      "detail": {
        "method": "SetFileInformationByHandle",
        "class": 4,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 38,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14135,
      "detail": {
        "label": "done",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 39,
      "actor": "owner",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14138,
      "detail": {
        "phase": "guarded",
        "aliasIds": {
          "target": "540572784:80783318316198505",
          "case": "540572784:80783318316198505",
          "junction": "540572784:80783318316198505"
        },
        "nonAdversarial": true
      }
    },
    {
      "sequence": 40,
      "actor": "owner",
      "action": "write",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14139,
      "detail": {
        "phase": "guarded",
        "ownerWritePreserved": true
      }
    },
    {
      "sequence": 41,
      "actor": "candidate",
      "action": "close",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14140,
      "detail": {
        "label": "guards",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 42,
      "actor": "candidate",
      "action": "process-exit",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 14161,
      "detail": {
        "phase": "guarded",
        "signal": null,
        "stderr": ""
      }
    }
  ],
  "ownerState": {
    "before": {
      "guarded": "dir",
      "guarded/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\guarded\\ancestor\\target",
      "guarded/ancestor": "dir",
      "guarded/ancestor/target": "dir",
      "guarded/ancestor/target/owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
      "guarded/outside": "dir",
      "guarded/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "guarded/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490",
      "home": "dir",
      "home/.cache": "dir",
      "home/.claude": "dir",
      "home/.codex": "dir",
      "home/.config": "dir",
      "home/.gsd": "dir",
      "home/.local": "dir",
      "home/.local/share": "dir",
      "home/AppData": "dir",
      "home/AppData/Local": "dir",
      "home/AppData/Roaming": "dir",
      "home/cargo": "dir",
      "home/rustup": "dir",
      "home/temp": "dir",
      "positive": "dir",
      "positive/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\positive\\ancestor\\target",
      "positive/ancestor": "dir",
      "positive/ancestor/target": "dir",
      "positive/ancestor/target/owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
      "positive/outside": "dir",
      "positive/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "positive/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490",
      "unsafe": "dir",
      "unsafe/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\unsafe\\ancestor\\target",
      "unsafe/ancestor": "dir",
      "unsafe/ancestor/target": "dir",
      "unsafe/ancestor/target/owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
      "unsafe/outside": "dir",
      "unsafe/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "unsafe/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490"
    },
    "after": {
      "guarded": "dir",
      "guarded/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\guarded\\ancestor\\target",
      "guarded/ancestor": "dir",
      "guarded/ancestor/target": "dir",
      "guarded/ancestor/target/owner.txt": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e",
      "guarded/outside": "dir",
      "guarded/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "guarded/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490",
      "home": "dir",
      "home/.cache": "dir",
      "home/.claude": "dir",
      "home/.codex": "dir",
      "home/.config": "dir",
      "home/.gsd": "dir",
      "home/.local": "dir",
      "home/.local/share": "dir",
      "home/AppData": "dir",
      "home/AppData/Local": "dir",
      "home/AppData/Roaming": "dir",
      "home/cargo": "dir",
      "home/rustup": "dir",
      "home/temp": "dir",
      "positive": "dir",
      "positive/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\positive\\ancestor\\target",
      "positive/ancestor": "dir",
      "positive/ancestor/target": "dir",
      "positive/ancestor/target/owner.txt": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e",
      "positive/outside": "dir",
      "positive/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "positive/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490",
      "unsafe": "dir",
      "unsafe/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\unsafe\\outside",
      "unsafe/ancestor": "dir",
      "unsafe/ancestor/target": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\unsafe\\outside",
      "unsafe/moved": "dir",
      "unsafe/moved/owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
      "unsafe/outside": "dir",
      "unsafe/outside/probe.txt": "file:614c36228f69c2dadcdf999a67990381671d1c287e4905c0eb828d7519dfa39d",
      "unsafe/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490"
    },
    "expectedOwnerWrites": [
      {
        "phase": "unsafe",
        "rule": "preregistered deliberate violations only",
        "caseId": "parent-swap"
      },
      {
        "phase": "positive",
        "path": "ancestor/target/owner.txt",
        "after": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e"
      },
      {
        "phase": "guarded",
        "path": "ancestor/target/owner.txt",
        "after": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e",
        "conditional": "path remains in place"
      },
      {
        "phase": "guarded",
        "operation": "rename target to after-exit",
        "conditional": "moved-directory only, after child close"
      }
    ]
  },
  "targetState": {
    "before": {
      "unsafe": {
        "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db"
      },
      "positive": {
        "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db"
      },
      "guarded": {
        "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db"
      }
    },
    "after": {
      "unsafe": {
        "state": "link",
        "target": "C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\96bd71aa-e788-4600-b1cb-86d12c10c059\\unsafe\\outside"
      },
      "positive": {
        "state": "directory",
        "map": {
          "owner.txt": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e"
        }
      },
      "guarded": {
        "state": "directory",
        "map": {
          "owner.txt": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e"
        }
      }
    }
  },
  "children": [
    {
      "actor": "candidate",
      "pid": 62068,
      "exitCode": 0,
      "signal": null,
      "closeObserved": true
    },
    {
      "actor": "candidate",
      "pid": 47512,
      "exitCode": 0,
      "signal": null,
      "closeObserved": true
    }
  ],
  "cleanup": {
    "complete": true,
    "retainedPaths": [],
    "errors": []
  }
}

RAW RECEIPT: 5bb7f563-fa48-4ad7-8265-b320dee1f70e-leaf-swap.json
{
  "schema": 1,
  "runId": "5bb7f563-fa48-4ad7-8265-b320dee1f70e",
  "caseId": "leaf-swap",
  "candidate": "windows-relative-handles-v1",
  "scope": {
    "platform": "win32",
    "filesystem": "NTFS",
    "aliases": [
      "case",
      "fixture-junction"
    ]
  },
  "nonClaims": [
    "portable-lock-safety",
    "automatic-takeover",
    "child-quiescence",
    "power-loss",
    "owner-impact-acceptance",
    "production-readiness",
    "symbolic-link-traversal",
    "release-latency-bound"
  ],
  "provenance": {
    "sources": [
      {
        "path": "probe.rs",
        "sha256": "0fb2a08b1025198f350b3707753ba44fff402010e8c7234d84499a6c64194e5d"
      },
      {
        "path": "supervisor.cjs",
        "sha256": "dd2b5d8d2673a5541a179ccb878772593bb4c554669a48ab8b14df5b1ded74af"
      },
      {
        "path": "README.md",
        "sha256": "236ac767199719a6992a8fd9e3051f212dd4bb39168b178d2a999276201fd0d0"
      }
    ],
    "compilerExecutable": "C:/Users/Destiny/.rustup/toolchains/1.98.0-x86_64-pc-windows-msvc/bin/rustc.exe",
    "compilerVersion": "rustc 1.98.0 (88d9e12ae 2026-08-18)\nbinary: rustc\ncommit-hash: 88d9e12ae178fab0fb5cc050a94da85685d449ea\ncommit-date: 2026-08-18\nhost: x86_64-pc-windows-msvc\nrelease: 1.98.0\nLLVM version: 22.1.8",
    "sysroot": "C:/Users/Destiny/.rustup/toolchains/1.98.0-x86_64-pc-windows-msvc",
    "buildCommand": [
      "C:/Users/Destiny/.rustup/toolchains/1.98.0-x86_64-pc-windows-msvc/bin/rustc.exe",
      "--edition=2021",
      "--crate-name",
      "containment_probe",
      "--sysroot",
      "C:/Users/Destiny/.rustup/toolchains/1.98.0-x86_64-pc-windows-msvc",
      "-D",
      "warnings",
      "-C",
      "incremental=C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\build\\5bb7f563-fa48-4ad7-8265-b320dee1f70e\\incremental",
      "C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\probe.rs",
      "-o",
      "C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\build\\5bb7f563-fa48-4ad7-8265-b320dee1f70e\\probe.exe"
    ],
    "binaryPath": "C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\build\\5bb7f563-fa48-4ad7-8265-b320dee1f70e\\probe.exe",
    "binarySha256": "d1e256ebfea372a391ca515ef1046e5fe2e532c1f05cdeb4b778e192aa770568",
    "sourceStable": true,
    "binaryStable": true
  },
  "environment": {
    "osRelease": "10.0.26200",
    "arch": "x64",
    "node": "v24.20.0",
    "bun": "1.3.5",
    "filesystemEvidence": {
      "label": "volume",
      "method": "GetVolumeInformationByHandleW",
      "filesystem": "NTFS",
      "serial": 540572784,
      "flags": 65482495,
      "maxComponent": 255
    },
    "hostLoadBefore": {
      "cpus": [
        {
          "user": 3923031,
          "nice": 0,
          "sys": 4581265,
          "idle": 20141390,
          "irq": 378812
        },
        {
          "user": 2187015,
          "nice": 0,
          "sys": 2490343,
          "idle": 23968250,
          "irq": 155687
        },
        {
          "user": 4594937,
          "nice": 0,
          "sys": 4298546,
          "idle": 19752125,
          "irq": 159703
        },
        {
          "user": 2402921,
          "nice": 0,
          "sys": 2371609,
          "idle": 23871062,
          "irq": 85203
        },
        {
          "user": 5228156,
          "nice": 0,
          "sys": 3633906,
          "idle": 19783546,
          "irq": 216078
        },
        {
          "user": 3737781,
          "nice": 0,
          "sys": 3096937,
          "idle": 21810890,
          "irq": 169140
        },
        {
          "user": 3673968,
          "nice": 0,
          "sys": 3044125,
          "idle": 21927515,
          "irq": 160390
        },
        {
          "user": 3757765,
          "nice": 0,
          "sys": 3070187,
          "idle": 21817656,
          "irq": 150921
        },
        {
          "user": 5789593,
          "nice": 0,
          "sys": 3678140,
          "idle": 19177875,
          "irq": 179046
        },
        {
          "user": 4259093,
          "nice": 0,
          "sys": 3096031,
          "idle": 21290484,
          "irq": 133750
        },
        {
          "user": 4280671,
          "nice": 0,
          "sys": 3090234,
          "idle": 21274703,
          "irq": 137187
        },
        {
          "user": 4365390,
          "nice": 0,
          "sys": 3062312,
          "idle": 21217906,
          "irq": 114562
        }
      ],
      "freeMemory": 3868467200,
      "totalMemory": 16512606208,
      "loadAverage": [
        0,
        0,
        0
      ]
    },
    "hostLoadAfter": {
      "cpus": [
        {
          "user": 3928609,
          "nice": 0,
          "sys": 4587796,
          "idle": 20146343,
          "irq": 379125
        },
        {
          "user": 2190171,
          "nice": 0,
          "sys": 2493875,
          "idle": 23978640,
          "irq": 155859
        },
        {
          "user": 4599156,
          "nice": 0,
          "sys": 4302656,
          "idle": 19760875,
          "irq": 159921
        },
        {
          "user": 2408437,
          "nice": 0,
          "sys": 2377109,
          "idle": 23877140,
          "irq": 85468
        },
        {
          "user": 5231265,
          "nice": 0,
          "sys": 3638640,
          "idle": 19792781,
          "irq": 216484
        },
        {
          "user": 3740265,
          "nice": 0,
          "sys": 3102437,
          "idle": 21819984,
          "irq": 169765
        },
        {
          "user": 3676453,
          "nice": 0,
          "sys": 3048937,
          "idle": 21937296,
          "irq": 160718
        },
        {
          "user": 3761218,
          "nice": 0,
          "sys": 3075984,
          "idle": 21825484,
          "irq": 151312
        },
        {
          "user": 5793703,
          "nice": 0,
          "sys": 3683437,
          "idle": 19185531,
          "irq": 179359
        },
        {
          "user": 4262843,
          "nice": 0,
          "sys": 3101421,
          "idle": 21298406,
          "irq": 134250
        },
        {
          "user": 4284796,
          "nice": 0,
          "sys": 3095968,
          "idle": 21281921,
          "irq": 137609
        },
        {
          "user": 4369562,
          "nice": 0,
          "sys": 3067703,
          "idle": 21225421,
          "irq": 114703
        }
      ],
      "freeMemory": 4474695680,
      "totalMemory": 16512606208,
      "loadAverage": [
        0,
        0,
        0
      ]
    }
  },
  "timing": {
    "startedAt": "2026-09-21T20:53:09.222Z",
    "endedAt": "2026-09-21T20:53:26.237Z",
    "deadlineMs": 180000
  },
  "verdict": "mechanism-observed-in-fixture",
  "claims": [
    {
      "id": "leaf-replacement-preserved",
      "status": "mechanism-observed-in-fixture",
      "reason": "All replacement entry maps remain unchanged and exclusive create refuses collision",
      "events": [
        27,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44
      ],
      "positiveControl": {
        "id": "positive:leaf-replacement-preserved",
        "outcome": "api-success-observed",
        "events": [
          11,
          13
        ]
      },
      "unsafeControl": {
        "id": "unsafe:leaf-replacement-preserved",
        "outcome": "violation-observed",
        "events": [
          2
        ]
      }
    },
    {
      "id": "leaf-type-enforced",
      "status": "mechanism-observed-in-fixture",
      "reason": "Regular replacement may be inspected; directory/junction inspection refuses without descent",
      "events": [
        27,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44
      ],
      "positiveControl": {
        "id": "positive:leaf-type-enforced",
        "outcome": "api-success-observed",
        "events": [
          15
        ]
      },
      "unsafeControl": {
        "id": "unsafe:leaf-type-enforced",
        "outcome": "violation-observed",
        "events": [
          3
        ]
      }
    },
    {
      "id": "owner-rename-effect-recorded",
      "status": "mechanism-observed-in-fixture",
      "reason": "Observed owner rename refusal; numeric code is libuv, not a Win32 sharing diagnosis",
      "events": [
        45
      ],
      "positiveControl": {
        "id": "positive:owner-rename-effect-recorded",
        "outcome": "api-success-observed",
        "events": [
          7,
          19
        ]
      },
      "unsafeControl": {
        "id": "unsafe:owner-rename-effect-recorded",
        "outcome": "violation-observed",
        "events": [
          4
        ]
      }
    }
  ],
  "events": [
    {
      "sequence": 1,
      "actor": "supervisor",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 1205,
      "detail": {
        "phase": "unsafe",
        "guardAbsent": true
      }
    },
    {
      "sequence": 2,
      "actor": "owner",
      "action": "write",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 1207,
      "detail": {
        "phase": "unsafe",
        "replacementDamageDetected": true
      }
    },
    {
      "sequence": 3,
      "actor": "owner",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 1209,
      "detail": {
        "phase": "unsafe",
        "forbiddenDescentDetected": true
      }
    },
    {
      "sequence": 4,
      "actor": "owner",
      "action": "rename",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 1211,
      "detail": {
        "phase": "unsafe",
        "codeDomain": "libuv"
      }
    },
    {
      "sequence": 5,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18003,
      "detail": {
        "label": "parent",
        "method": "CreateFileW",
        "access": 1048737,
        "share": 3,
        "disposition": 3,
        "flags": 35651584,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 6,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18003,
      "detail": {
        "label": "parent-identity",
        "volume": 540572784,
        "indexHigh": 3604480,
        "indexLow": 280837,
        "attributes": 2064,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 7,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18004,
      "detail": {
        "label": "guards",
        "method": "NtCreateFile",
        "access": 1048737,
        "share": 3,
        "disposition": 1,
        "options": 2097185,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 8,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18004,
      "detail": {
        "label": "volume",
        "method": "GetVolumeInformationByHandleW",
        "filesystem": "NTFS",
        "serial": 540572784,
        "flags": 65482495,
        "maxComponent": 255,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 9,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18004,
      "detail": {
        "label": "target",
        "volume": 540572784,
        "indexHigh": 9895936,
        "indexLow": 281104,
        "attributes": 2064,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 10,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18004,
      "detail": {
        "label": "ready",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 11,
      "actor": "candidate",
      "action": "create",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18007,
      "detail": {
        "access": 1114370,
        "share": 3,
        "disposition": 2,
        "options": 2097248,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 12,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18007,
      "detail": {
        "label": "done",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 13,
      "actor": "candidate",
      "action": "remove",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18008,
      "detail": {
        "method": "SetFileInformationByHandle",
        "class": 4,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 14,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18008,
      "detail": {
        "label": "done",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 15,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18010,
      "detail": {
        "label": "inspect",
        "attributes": 2080,
        "access": 1048705,
        "share": 3,
        "disposition": 1,
        "options": 2097248,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 16,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18010,
      "detail": {
        "label": "done",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 17,
      "actor": "owner",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18012,
      "detail": {
        "phase": "positive",
        "aliasIds": {
          "target": "540572784:42502721483590160",
          "case": "540572784:42502721483590160",
          "junction": "540572784:42502721483590160"
        }
      }
    },
    {
      "sequence": 18,
      "actor": "owner",
      "action": "write",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18014,
      "detail": {
        "phase": "positive",
        "ownerWritePreserved": true
      }
    },
    {
      "sequence": 19,
      "actor": "candidate",
      "action": "close",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18017,
      "detail": {
        "label": "guards",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 20,
      "actor": "candidate",
      "action": "process-exit",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18032,
      "detail": {
        "phase": "positive",
        "signal": null,
        "stderr": ""
      }
    },
    {
      "sequence": 21,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18109,
      "detail": {
        "label": "parent",
        "method": "CreateFileW",
        "access": 1048737,
        "share": 3,
        "disposition": 3,
        "flags": 35651584,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 22,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18109,
      "detail": {
        "label": "parent-identity",
        "volume": 540572784,
        "indexHigh": 4653056,
        "indexLow": 284986,
        "attributes": 2064,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 23,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18110,
      "detail": {
        "label": "guards",
        "method": "NtCreateFile",
        "access": 1048737,
        "share": 3,
        "disposition": 1,
        "options": 2097185,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 24,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18110,
      "detail": {
        "label": "volume",
        "method": "GetVolumeInformationByHandleW",
        "filesystem": "NTFS",
        "serial": 540572784,
        "flags": 65482495,
        "maxComponent": 255,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 25,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18110,
      "detail": {
        "label": "target",
        "volume": 540572784,
        "indexHigh": 1900544,
        "indexLow": 286232,
        "attributes": 2064,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 26,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18110,
      "detail": {
        "label": "ready",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 27,
      "actor": "supervisor",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18113,
      "detail": {
        "phase": "guarded",
        "point": "after-leaf-observation",
        "observed": "a5c79e40d5460ad31a5d598ab34cf9f190c02e871f94dd71382abe3ff197d954",
        "kind": "file"
      }
    },
    {
      "sequence": 28,
      "actor": "candidate",
      "action": "create",
      "outcome": "refused",
      "osCode": -1073741771,
      "elapsedMs": 18118,
      "detail": {
        "access": 1114370,
        "share": 3,
        "disposition": 2,
        "options": 2097248,
        "phase": "guarded",
        "codeDomain": "NTSTATUS",
        "statusHex": "0xc0000035"
      }
    },
    {
      "sequence": 29,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18118,
      "detail": {
        "label": "done",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 30,
      "actor": "supervisor",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18120,
      "detail": {
        "phase": "guarded",
        "kind": "file",
        "replacementMapBefore": {
          "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
          "probe.txt": "file:ca38017f97a85bbf7172efcfe0e8e1d74ebba8c11341f2bcd33775e755b74006"
        },
        "replacementMapAfter": {
          "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
          "probe.txt": "file:ca38017f97a85bbf7172efcfe0e8e1d74ebba8c11341f2bcd33775e755b74006"
        }
      }
    },
    {
      "sequence": 31,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18121,
      "detail": {
        "label": "inspect",
        "attributes": 2080,
        "access": 1048705,
        "share": 3,
        "disposition": 1,
        "options": 2097248,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 32,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18121,
      "detail": {
        "label": "done",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 33,
      "actor": "supervisor",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18124,
      "detail": {
        "phase": "guarded",
        "point": "after-leaf-observation",
        "observed": "a5c79e40d5460ad31a5d598ab34cf9f190c02e871f94dd71382abe3ff197d954",
        "kind": "directory"
      }
    },
    {
      "sequence": 34,
      "actor": "candidate",
      "action": "create",
      "outcome": "refused",
      "osCode": -1073741638,
      "elapsedMs": 18127,
      "detail": {
        "access": 1114370,
        "share": 3,
        "disposition": 2,
        "options": 2097248,
        "phase": "guarded",
        "codeDomain": "NTSTATUS",
        "statusHex": "0xc00000ba"
      }
    },
    {
      "sequence": 35,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18128,
      "detail": {
        "label": "done",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 36,
      "actor": "supervisor",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18129,
      "detail": {
        "phase": "guarded",
        "kind": "directory",
        "replacementMapBefore": {
          "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
          "probe.txt": "dir"
        },
        "replacementMapAfter": {
          "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
          "probe.txt": "dir"
        }
      }
    },
    {
      "sequence": 37,
      "actor": "candidate",
      "action": "open",
      "outcome": "refused",
      "osCode": -1073741638,
      "elapsedMs": 18130,
      "detail": {
        "label": "inspect",
        "access": 1048705,
        "share": 3,
        "disposition": 1,
        "options": 2097248,
        "phase": "guarded",
        "codeDomain": "NTSTATUS",
        "statusHex": "0xc00000ba"
      }
    },
    {
      "sequence": 38,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18130,
      "detail": {
        "label": "done",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 39,
      "actor": "supervisor",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18132,
      "detail": {
        "phase": "guarded",
        "point": "after-leaf-observation",
        "observed": "a5c79e40d5460ad31a5d598ab34cf9f190c02e871f94dd71382abe3ff197d954",
        "kind": "junction"
      }
    },
    {
      "sequence": 40,
      "actor": "candidate",
      "action": "create",
      "outcome": "refused",
      "osCode": -1073741638,
      "elapsedMs": 18136,
      "detail": {
        "access": 1114370,
        "share": 3,
        "disposition": 2,
        "options": 2097248,
        "phase": "guarded",
        "codeDomain": "NTSTATUS",
        "statusHex": "0xc00000ba"
      }
    },
    {
      "sequence": 41,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18136,
      "detail": {
        "label": "done",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 42,
      "actor": "supervisor",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18140,
      "detail": {
        "phase": "guarded",
        "kind": "junction",
        "replacementMapBefore": {
          "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
          "probe.txt": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\5bb7f563-fa48-4ad7-8265-b320dee1f70e\\guarded\\outside"
        },
        "replacementMapAfter": {
          "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
          "probe.txt": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\5bb7f563-fa48-4ad7-8265-b320dee1f70e\\guarded\\outside"
        }
      }
    },
    {
      "sequence": 43,
      "actor": "candidate",
      "action": "open",
      "outcome": "refused",
      "osCode": -1073741638,
      "elapsedMs": 18141,
      "detail": {
        "label": "inspect",
        "access": 1048705,
        "share": 3,
        "disposition": 1,
        "options": 2097248,
        "phase": "guarded",
        "codeDomain": "NTSTATUS",
        "statusHex": "0xc00000ba"
      }
    },
    {
      "sequence": 44,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18141,
      "detail": {
        "label": "done",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 45,
      "actor": "owner",
      "action": "rename",
      "outcome": "refused",
      "osCode": -4082,
      "elapsedMs": 18143,
      "detail": {
        "phase": "guarded",
        "kind": "target",
        "codeDomain": "libuv",
        "symbol": "EBUSY",
        "error": "EBUSY: resource busy or locked, rename 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\5bb7f563-fa48-4ad7-8265-b320dee1f70e\\guarded\\ancestor\\target' -> 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\5bb7f563-fa48-4ad7-8265-b320dee1f70e\\guarded\\target-moved'"
      }
    },
    {
      "sequence": 46,
      "actor": "owner",
      "action": "write",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18145,
      "detail": {
        "phase": "guarded",
        "ownerWritePreserved": true
      }
    },
    {
      "sequence": 47,
      "actor": "candidate",
      "action": "close",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18145,
      "detail": {
        "label": "guards",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 48,
      "actor": "candidate",
      "action": "process-exit",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 18161,
      "detail": {
        "phase": "guarded",
        "signal": null,
        "stderr": ""
      }
    }
  ],
  "ownerState": {
    "before": {
      "guarded": "dir",
      "guarded/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\5bb7f563-fa48-4ad7-8265-b320dee1f70e\\guarded\\ancestor\\target",
      "guarded/ancestor": "dir",
      "guarded/ancestor/target": "dir",
      "guarded/ancestor/target/owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
      "guarded/outside": "dir",
      "guarded/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "guarded/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490",
      "home": "dir",
      "home/.cache": "dir",
      "home/.claude": "dir",
      "home/.codex": "dir",
      "home/.config": "dir",
      "home/.gsd": "dir",
      "home/.local": "dir",
      "home/.local/share": "dir",
      "home/AppData": "dir",
      "home/AppData/Local": "dir",
      "home/AppData/Roaming": "dir",
      "home/cargo": "dir",
      "home/rustup": "dir",
      "home/temp": "dir",
      "positive": "dir",
      "positive/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\5bb7f563-fa48-4ad7-8265-b320dee1f70e\\positive\\ancestor\\target",
      "positive/ancestor": "dir",
      "positive/ancestor/target": "dir",
      "positive/ancestor/target/owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
      "positive/outside": "dir",
      "positive/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "positive/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490",
      "unsafe": "dir",
      "unsafe/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\5bb7f563-fa48-4ad7-8265-b320dee1f70e\\unsafe\\ancestor\\target",
      "unsafe/ancestor": "dir",
      "unsafe/ancestor/target": "dir",
      "unsafe/ancestor/target/owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
      "unsafe/outside": "dir",
      "unsafe/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "unsafe/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490"
    },
    "after": {
      "guarded": "dir",
      "guarded/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\5bb7f563-fa48-4ad7-8265-b320dee1f70e\\guarded\\ancestor\\target",
      "guarded/ancestor": "dir",
      "guarded/ancestor/target": "dir",
      "guarded/ancestor/target/owner.txt": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e",
      "guarded/outside": "dir",
      "guarded/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "guarded/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490",
      "home": "dir",
      "home/.cache": "dir",
      "home/.claude": "dir",
      "home/.codex": "dir",
      "home/.config": "dir",
      "home/.gsd": "dir",
      "home/.local": "dir",
      "home/.local/share": "dir",
      "home/AppData": "dir",
      "home/AppData/Local": "dir",
      "home/AppData/Roaming": "dir",
      "home/cargo": "dir",
      "home/rustup": "dir",
      "home/temp": "dir",
      "positive": "dir",
      "positive/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\5bb7f563-fa48-4ad7-8265-b320dee1f70e\\positive\\ancestor\\target",
      "positive/ancestor": "dir",
      "positive/ancestor/target": "dir",
      "positive/ancestor/target/owner.txt": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e",
      "positive/outside": "dir",
      "positive/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "positive/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490",
      "unsafe": "dir",
      "unsafe/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\5bb7f563-fa48-4ad7-8265-b320dee1f70e\\unsafe\\ancestor\\target",
      "unsafe/ancestor": "dir",
      "unsafe/moved": "dir",
      "unsafe/moved/owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
      "unsafe/moved/probe.txt": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\5bb7f563-fa48-4ad7-8265-b320dee1f70e\\unsafe\\outside",
      "unsafe/outside": "dir",
      "unsafe/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "unsafe/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490"
    },
    "expectedOwnerWrites": [
      {
        "phase": "unsafe",
        "rule": "preregistered deliberate violations only",
        "caseId": "leaf-swap"
      },
      {
        "phase": "positive",
        "path": "ancestor/target/owner.txt",
        "after": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e"
      },
      {
        "phase": "guarded",
        "path": "ancestor/target/owner.txt",
        "after": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e",
        "conditional": "path remains in place"
      },
      {
        "phase": "guarded",
        "operation": "rename target to after-exit",
        "conditional": "moved-directory only, after child close"
      }
    ]
  },
  "targetState": {
    "before": {
      "unsafe": {
        "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db"
      },
      "positive": {
        "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db"
      },
      "guarded": {
        "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db"
      }
    },
    "after": {
      "unsafe": {
        "state": "missing"
      },
      "positive": {
        "state": "directory",
        "map": {
          "owner.txt": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e"
        }
      },
      "guarded": {
        "state": "directory",
        "map": {
          "owner.txt": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e"
        }
      }
    }
  },
  "children": [
    {
      "actor": "candidate",
      "pid": 14928,
      "exitCode": 0,
      "signal": null,
      "closeObserved": true
    },
    {
      "actor": "candidate",
      "pid": 22088,
      "exitCode": 0,
      "signal": null,
      "closeObserved": true
    }
  ],
  "cleanup": {
    "complete": true,
    "retainedPaths": [],
    "errors": []
  }
}

RAW RECEIPT: dabc7833-5535-40c3-b09d-3a1ccc4fc05b-moved-directory.json
{
  "schema": 1,
  "runId": "dabc7833-5535-40c3-b09d-3a1ccc4fc05b",
  "caseId": "moved-directory",
  "candidate": "windows-relative-handles-v1",
  "scope": {
    "platform": "win32",
    "filesystem": "NTFS",
    "aliases": [
      "case",
      "fixture-junction"
    ]
  },
  "nonClaims": [
    "portable-lock-safety",
    "automatic-takeover",
    "child-quiescence",
    "power-loss",
    "owner-impact-acceptance",
    "production-readiness",
    "symbolic-link-traversal",
    "release-latency-bound"
  ],
  "provenance": {
    "sources": [
      {
        "path": "probe.rs",
        "sha256": "0fb2a08b1025198f350b3707753ba44fff402010e8c7234d84499a6c64194e5d"
      },
      {
        "path": "supervisor.cjs",
        "sha256": "dd2b5d8d2673a5541a179ccb878772593bb4c554669a48ab8b14df5b1ded74af"
      },
      {
        "path": "README.md",
        "sha256": "236ac767199719a6992a8fd9e3051f212dd4bb39168b178d2a999276201fd0d0"
      }
    ],
    "compilerExecutable": "C:/Users/Destiny/.rustup/toolchains/1.98.0-x86_64-pc-windows-msvc/bin/rustc.exe",
    "compilerVersion": "rustc 1.98.0 (88d9e12ae 2026-08-18)\nbinary: rustc\ncommit-hash: 88d9e12ae178fab0fb5cc050a94da85685d449ea\ncommit-date: 2026-08-18\nhost: x86_64-pc-windows-msvc\nrelease: 1.98.0\nLLVM version: 22.1.8",
    "sysroot": "C:/Users/Destiny/.rustup/toolchains/1.98.0-x86_64-pc-windows-msvc",
    "buildCommand": [
      "C:/Users/Destiny/.rustup/toolchains/1.98.0-x86_64-pc-windows-msvc/bin/rustc.exe",
      "--edition=2021",
      "--crate-name",
      "containment_probe",
      "--sysroot",
      "C:/Users/Destiny/.rustup/toolchains/1.98.0-x86_64-pc-windows-msvc",
      "-D",
      "warnings",
      "-C",
      "incremental=C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\build\\dabc7833-5535-40c3-b09d-3a1ccc4fc05b\\incremental",
      "C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\probe.rs",
      "-o",
      "C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\build\\dabc7833-5535-40c3-b09d-3a1ccc4fc05b\\probe.exe"
    ],
    "binaryPath": "C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\build\\dabc7833-5535-40c3-b09d-3a1ccc4fc05b\\probe.exe",
    "binarySha256": "0cb7089709bdeadd05dcb8eebcdc922f3cc687ccc6ec9b82d2296734876864e6",
    "sourceStable": true,
    "binaryStable": true
  },
  "environment": {
    "osRelease": "10.0.26200",
    "arch": "x64",
    "node": "v24.20.0",
    "bun": "1.3.5",
    "filesystemEvidence": {
      "label": "volume",
      "method": "GetVolumeInformationByHandleW",
      "filesystem": "NTFS",
      "serial": 540572784,
      "flags": 65482495,
      "maxComponent": 255
    },
    "hostLoadBefore": {
      "cpus": [
        {
          "user": 3937500,
          "nice": 0,
          "sys": 4598906,
          "idle": 20150578,
          "irq": 379890
        },
        {
          "user": 2198312,
          "nice": 0,
          "sys": 2502296,
          "idle": 23986281,
          "irq": 156140
        },
        {
          "user": 4608781,
          "nice": 0,
          "sys": 4312375,
          "idle": 19765750,
          "irq": 160187
        },
        {
          "user": 2416921,
          "nice": 0,
          "sys": 2386546,
          "idle": 23883437,
          "irq": 85828
        },
        {
          "user": 5237859,
          "nice": 0,
          "sys": 3649906,
          "idle": 19799125,
          "irq": 217171
        },
        {
          "user": 3746078,
          "nice": 0,
          "sys": 3114765,
          "idle": 21826046,
          "irq": 170781
        },
        {
          "user": 3683203,
          "nice": 0,
          "sys": 3060343,
          "idle": 21943359,
          "irq": 161437
        },
        {
          "user": 3768125,
          "nice": 0,
          "sys": 3087593,
          "idle": 21831171,
          "irq": 151984
        },
        {
          "user": 5800640,
          "nice": 0,
          "sys": 3695046,
          "idle": 19191203,
          "irq": 180078
        },
        {
          "user": 4270046,
          "nice": 0,
          "sys": 3113343,
          "idle": 21303500,
          "irq": 134921
        },
        {
          "user": 4292406,
          "nice": 0,
          "sys": 3107218,
          "idle": 21287281,
          "irq": 137968
        },
        {
          "user": 4378062,
          "nice": 0,
          "sys": 3078734,
          "idle": 21230109,
          "irq": 115140
        }
      ],
      "freeMemory": 2574888960,
      "totalMemory": 16512606208,
      "loadAverage": [
        0,
        0,
        0
      ]
    },
    "hostLoadAfter": {
      "cpus": [
        {
          "user": 3942359,
          "nice": 0,
          "sys": 4602765,
          "idle": 20154484,
          "irq": 380093
        },
        {
          "user": 2201265,
          "nice": 0,
          "sys": 2504906,
          "idle": 23993359,
          "irq": 156281
        },
        {
          "user": 4614421,
          "nice": 0,
          "sys": 4316531,
          "idle": 19768578,
          "irq": 160390
        },
        {
          "user": 2419718,
          "nice": 0,
          "sys": 2388421,
          "idle": 23891375,
          "irq": 85937
        },
        {
          "user": 5240187,
          "nice": 0,
          "sys": 3653000,
          "idle": 19806343,
          "irq": 217312
        },
        {
          "user": 3747953,
          "nice": 0,
          "sys": 3118343,
          "idle": 21833234,
          "irq": 171062
        },
        {
          "user": 3685406,
          "nice": 0,
          "sys": 3063250,
          "idle": 21950875,
          "irq": 161687
        },
        {
          "user": 3770312,
          "nice": 0,
          "sys": 3090984,
          "idle": 21838234,
          "irq": 152156
        },
        {
          "user": 5802843,
          "nice": 0,
          "sys": 3698406,
          "idle": 19198281,
          "irq": 180328
        },
        {
          "user": 4272718,
          "nice": 0,
          "sys": 3116281,
          "idle": 21310531,
          "irq": 135109
        },
        {
          "user": 4295562,
          "nice": 0,
          "sys": 3110546,
          "idle": 21293421,
          "irq": 138187
        },
        {
          "user": 4381984,
          "nice": 0,
          "sys": 3081640,
          "idle": 21235906,
          "irq": 115265
        }
      ],
      "freeMemory": 3523235840,
      "totalMemory": 16512606208,
      "loadAverage": [
        0,
        0,
        0
      ]
    }
  },
  "timing": {
    "startedAt": "2026-09-21T20:53:50.544Z",
    "endedAt": "2026-09-21T20:54:03.088Z",
    "deadlineMs": 180000
  },
  "verdict": "mechanism-observed-in-fixture",
  "claims": [
    {
      "id": "moved-object-boundary",
      "status": "mechanism-observed-in-fixture",
      "reason": "A moved handle may not authorize post-move mutation; candidate refusal is safe; no claim above held ancestor",
      "events": [
        27,
        28,
        29,
        30
      ],
      "positiveControl": {
        "id": "positive:moved-object-boundary",
        "outcome": "api-success-observed",
        "events": [
          11,
          13
        ]
      },
      "unsafeControl": {
        "id": "unsafe:moved-object-boundary",
        "outcome": "violation-observed",
        "events": [
          3
        ]
      }
    },
    {
      "id": "ancestor-rename-effect-recorded",
      "status": "mechanism-observed-in-fixture",
      "reason": "Observed ancestor rename refusal; libuv status only",
      "events": [
        28
      ],
      "positiveControl": {
        "id": "positive:ancestor-rename-effect-recorded",
        "outcome": "api-success-observed",
        "events": [
          5
        ]
      },
      "unsafeControl": {
        "id": "unsafe:ancestor-rename-effect-recorded",
        "outcome": "violation-observed",
        "events": [
          4
        ]
      }
    },
    {
      "id": "guard-exit-effect-recorded",
      "status": "mechanism-observed-in-fixture",
      "reason": "Post-close retry observed success; one observation supplies no release-latency bound",
      "events": [
        36
      ],
      "positiveControl": {
        "id": "positive:guard-exit-effect-recorded",
        "outcome": "api-success-observed",
        "events": [
          19,
          20
        ]
      },
      "unsafeControl": {
        "id": "unsafe:guard-exit-effect-recorded",
        "outcome": "violation-observed",
        "events": [
          2
        ]
      }
    }
  ],
  "events": [
    {
      "sequence": 1,
      "actor": "supervisor",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 1083,
      "detail": {
        "phase": "unsafe",
        "guardAbsent": true
      }
    },
    {
      "sequence": 2,
      "actor": "owner",
      "action": "rename",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 1085,
      "detail": {
        "phase": "unsafe",
        "kind": "target",
        "codeDomain": "libuv"
      }
    },
    {
      "sequence": 3,
      "actor": "owner",
      "action": "write",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 1087,
      "detail": {
        "phase": "unsafe",
        "movedBoundaryViolation": true
      }
    },
    {
      "sequence": 4,
      "actor": "owner",
      "action": "rename",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 1090,
      "detail": {
        "phase": "unsafe",
        "kind": "ancestor",
        "codeDomain": "libuv"
      }
    },
    {
      "sequence": 5,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13468,
      "detail": {
        "label": "parent",
        "method": "CreateFileW",
        "access": 1048737,
        "share": 3,
        "disposition": 3,
        "flags": 35651584,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 6,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13468,
      "detail": {
        "label": "parent-identity",
        "volume": 540572784,
        "indexHigh": 6619136,
        "indexLow": 313859,
        "attributes": 2064,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 7,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13469,
      "detail": {
        "label": "guards",
        "method": "NtCreateFile",
        "access": 1048737,
        "share": 3,
        "disposition": 1,
        "options": 2097185,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 8,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13469,
      "detail": {
        "label": "volume",
        "method": "GetVolumeInformationByHandleW",
        "filesystem": "NTFS",
        "serial": 540572784,
        "flags": 65482495,
        "maxComponent": 255,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 9,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13469,
      "detail": {
        "label": "target",
        "volume": 540572784,
        "indexHigh": 15728640,
        "indexLow": 313866,
        "attributes": 2064,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 10,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13469,
      "detail": {
        "label": "ready",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 11,
      "actor": "candidate",
      "action": "create",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13472,
      "detail": {
        "access": 1114370,
        "share": 3,
        "disposition": 2,
        "options": 2097248,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 12,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13472,
      "detail": {
        "label": "done",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 13,
      "actor": "candidate",
      "action": "remove",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13473,
      "detail": {
        "method": "SetFileInformationByHandle",
        "class": 4,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 14,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13473,
      "detail": {
        "label": "done",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 15,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13475,
      "detail": {
        "label": "inspect",
        "attributes": 2080,
        "access": 1048705,
        "share": 3,
        "disposition": 1,
        "options": 2097248,
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 16,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13475,
      "detail": {
        "label": "done",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 17,
      "actor": "owner",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13476,
      "detail": {
        "phase": "positive",
        "aliasIds": {
          "target": "540572784:67553994410871306",
          "case": "540572784:67553994410871306",
          "junction": "540572784:67553994410871306"
        }
      }
    },
    {
      "sequence": 18,
      "actor": "owner",
      "action": "write",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13477,
      "detail": {
        "phase": "positive",
        "ownerWritePreserved": true
      }
    },
    {
      "sequence": 19,
      "actor": "candidate",
      "action": "close",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13479,
      "detail": {
        "label": "guards",
        "phase": "positive",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 20,
      "actor": "candidate",
      "action": "process-exit",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13488,
      "detail": {
        "phase": "positive",
        "signal": null,
        "stderr": ""
      }
    },
    {
      "sequence": 21,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13560,
      "detail": {
        "label": "parent",
        "method": "CreateFileW",
        "access": 1048737,
        "share": 3,
        "disposition": 3,
        "flags": 35651584,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 22,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13560,
      "detail": {
        "label": "parent-identity",
        "volume": 540572784,
        "indexHigh": 3211264,
        "indexLow": 314895,
        "attributes": 2064,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 23,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13560,
      "detail": {
        "label": "guards",
        "method": "NtCreateFile",
        "access": 1048737,
        "share": 3,
        "disposition": 1,
        "options": 2097185,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 24,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13560,
      "detail": {
        "label": "volume",
        "method": "GetVolumeInformationByHandleW",
        "filesystem": "NTFS",
        "serial": 540572784,
        "flags": 65482495,
        "maxComponent": 255,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 25,
      "actor": "candidate",
      "action": "open",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13560,
      "detail": {
        "label": "target",
        "volume": 540572784,
        "indexHigh": 5177344,
        "indexLow": 315295,
        "attributes": 2064,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 26,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13560,
      "detail": {
        "label": "ready",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 27,
      "actor": "owner",
      "action": "rename",
      "outcome": "refused",
      "osCode": -4082,
      "elapsedMs": 13562,
      "detail": {
        "phase": "guarded",
        "kind": "target",
        "codeDomain": "libuv",
        "symbol": "EBUSY",
        "error": "EBUSY: resource busy or locked, rename 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\dabc7833-5535-40c3-b09d-3a1ccc4fc05b\\guarded\\ancestor\\target' -> 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\dabc7833-5535-40c3-b09d-3a1ccc4fc05b\\guarded\\target-moved'"
      }
    },
    {
      "sequence": 28,
      "actor": "owner",
      "action": "rename",
      "outcome": "refused",
      "osCode": -4082,
      "elapsedMs": 13562,
      "detail": {
        "phase": "guarded",
        "kind": "ancestor",
        "codeDomain": "libuv",
        "symbol": "EBUSY",
        "error": "EBUSY: resource busy or locked, rename 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\dabc7833-5535-40c3-b09d-3a1ccc4fc05b\\guarded\\ancestor' -> 'C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\dabc7833-5535-40c3-b09d-3a1ccc4fc05b\\guarded\\ancestor-moved'"
      }
    },
    {
      "sequence": 29,
      "actor": "candidate",
      "action": "create",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13563,
      "detail": {
        "access": 1114370,
        "share": 3,
        "disposition": 2,
        "options": 2097248,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 30,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13563,
      "detail": {
        "label": "done",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 31,
      "actor": "candidate",
      "action": "remove",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13564,
      "detail": {
        "method": "SetFileInformationByHandle",
        "class": 4,
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 32,
      "actor": "candidate",
      "action": "barrier",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13564,
      "detail": {
        "label": "done",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 33,
      "actor": "owner",
      "action": "write",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13565,
      "detail": {
        "phase": "guarded",
        "ownerWritePreserved": true
      }
    },
    {
      "sequence": 34,
      "actor": "candidate",
      "action": "close",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13565,
      "detail": {
        "label": "guards",
        "phase": "guarded",
        "codeDomain": "Win32",
        "statusHex": "0x00000000"
      }
    },
    {
      "sequence": 35,
      "actor": "candidate",
      "action": "process-exit",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13582,
      "detail": {
        "phase": "guarded",
        "signal": null,
        "stderr": ""
      }
    },
    {
      "sequence": 36,
      "actor": "owner",
      "action": "rename",
      "outcome": "success",
      "osCode": 0,
      "elapsedMs": 13585,
      "detail": {
        "phase": "guarded",
        "point": "after-child-close",
        "codeDomain": "libuv"
      }
    }
  ],
  "ownerState": {
    "before": {
      "guarded": "dir",
      "guarded/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\dabc7833-5535-40c3-b09d-3a1ccc4fc05b\\guarded\\ancestor\\target",
      "guarded/ancestor": "dir",
      "guarded/ancestor/target": "dir",
      "guarded/ancestor/target/owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
      "guarded/outside": "dir",
      "guarded/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "guarded/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490",
      "home": "dir",
      "home/.cache": "dir",
      "home/.claude": "dir",
      "home/.codex": "dir",
      "home/.config": "dir",
      "home/.gsd": "dir",
      "home/.local": "dir",
      "home/.local/share": "dir",
      "home/AppData": "dir",
      "home/AppData/Local": "dir",
      "home/AppData/Roaming": "dir",
      "home/cargo": "dir",
      "home/rustup": "dir",
      "home/temp": "dir",
      "positive": "dir",
      "positive/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\dabc7833-5535-40c3-b09d-3a1ccc4fc05b\\positive\\ancestor\\target",
      "positive/ancestor": "dir",
      "positive/ancestor/target": "dir",
      "positive/ancestor/target/owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
      "positive/outside": "dir",
      "positive/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "positive/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490",
      "unsafe": "dir",
      "unsafe/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\dabc7833-5535-40c3-b09d-3a1ccc4fc05b\\unsafe\\ancestor\\target",
      "unsafe/ancestor": "dir",
      "unsafe/ancestor/target": "dir",
      "unsafe/ancestor/target/owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db",
      "unsafe/outside": "dir",
      "unsafe/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "unsafe/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490"
    },
    "after": {
      "guarded": "dir",
      "guarded/after-exit": "dir",
      "guarded/after-exit/owner.txt": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e",
      "guarded/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\dabc7833-5535-40c3-b09d-3a1ccc4fc05b\\guarded\\ancestor\\target",
      "guarded/ancestor": "dir",
      "guarded/outside": "dir",
      "guarded/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "guarded/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490",
      "home": "dir",
      "home/.cache": "dir",
      "home/.claude": "dir",
      "home/.codex": "dir",
      "home/.config": "dir",
      "home/.gsd": "dir",
      "home/.local": "dir",
      "home/.local/share": "dir",
      "home/AppData": "dir",
      "home/AppData/Local": "dir",
      "home/AppData/Roaming": "dir",
      "home/cargo": "dir",
      "home/rustup": "dir",
      "home/temp": "dir",
      "positive": "dir",
      "positive/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\dabc7833-5535-40c3-b09d-3a1ccc4fc05b\\positive\\ancestor\\target",
      "positive/ancestor": "dir",
      "positive/ancestor/target": "dir",
      "positive/ancestor/target/owner.txt": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e",
      "positive/outside": "dir",
      "positive/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "positive/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490",
      "unsafe": "dir",
      "unsafe/alias": "link:C:\\Projects\\get-stuff-done\\.claude\\worktrees\\skin-campaign\\.claude\\p07-containment-spike-2026-09-20\\runs\\dabc7833-5535-40c3-b09d-3a1ccc4fc05b\\unsafe\\ancestor\\target",
      "unsafe/ancestor-moved": "dir",
      "unsafe/moved": "dir",
      "unsafe/moved/owner.txt": "file:720b2e8413b3bb69f952ee53cbd45dabebe7e80d250ae4c7882bb351037786bc",
      "unsafe/outside": "dir",
      "unsafe/outside/probe.txt": "file:f9bf0212b68528206e400f811829dea79e2ccac31d8275aec5f5ce41435dad84",
      "unsafe/outside/sentinel.txt": "file:d3db305ed1795fd00c5b671406cb702c797ebb59feef55af3569fd4fa608b490"
    },
    "expectedOwnerWrites": [
      {
        "phase": "unsafe",
        "rule": "preregistered deliberate violations only",
        "caseId": "moved-directory"
      },
      {
        "phase": "positive",
        "path": "ancestor/target/owner.txt",
        "after": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e"
      },
      {
        "phase": "guarded",
        "path": "ancestor/target/owner.txt",
        "after": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e",
        "conditional": "path remains in place"
      },
      {
        "phase": "guarded",
        "operation": "rename target to after-exit",
        "conditional": "moved-directory only, after child close"
      }
    ]
  },
  "targetState": {
    "before": {
      "unsafe": {
        "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db"
      },
      "positive": {
        "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db"
      },
      "guarded": {
        "owner.txt": "file:00e4856164dc9d3bce953d3df29654c76a6158a3524bae512cc4bc16e3ae31db"
      }
    },
    "after": {
      "unsafe": {
        "state": "missing"
      },
      "positive": {
        "state": "directory",
        "map": {
          "owner.txt": "file:3dd1d2a218deefaca046d30d322ee25ad62685c1a8a914feb938df3f0f89186e"
        }
      },
      "guarded": {
        "state": "missing"
      }
    }
  },
  "children": [
    {
      "actor": "candidate",
      "pid": 12000,
      "exitCode": 0,
      "signal": null,
      "closeObserved": true
    },
    {
      "actor": "candidate",
      "pid": 20784,
      "exitCode": 0,
      "signal": null,
      "closeObserved": true
    }
  ],
  "cleanup": {
    "complete": true,
    "retainedPaths": [],
    "errors": []
  }
}
