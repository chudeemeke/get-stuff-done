# Approved experiment source review, before first case execution
Owner explicitly approved minimal section21 experiment and requested Opus5/xhigh reviews. No tools, no edits. Review source only, against approved contract. Detect false PASS, unsafe cleanup, missing controls/claims, compile/runtime defects and containment assumptions. Return PASS or NOT PASS with prioritized concrete findings. Do not propose a larger framework or production changes. All cases unrun; source preparation stage, correction budget not yet consumed. Node syntax checked. Rust toolchain linked a minimal program successfully; probe not yet compiled/run. Source snapshot includes a Rust FFI probe and Node supervisor. Its Node process is the independent owner, native child is guard; unsafe phase has no guard. Strict stop on timeout/missing positive/refutation. Whole snapshots/raw events manually reviewed, no general validator. Do not treat absence of product coverage as failure: approved experiment is explicitly not product acceptance. Need exact counterexamples for severity. Review as experiment that may correctly refute or remain unverified, not a guaranteed working candidate. No actual home data can be touched; fixed private paths only. Do not imitate prior reviews.

# .claude/p07-containment-spike-2026-09-20/README.md
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


# .claude/p07-containment-spike-2026-09-20/probe.rs
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
    if info(parent.0).map_err(|e|e.to_string())?.attributes & 0x400 !=0 {return Err("parent is reparse point".into())}
    let target=relative(parent.0,"target",true,false).map_err(|e|format!("target open {e}"))?;
    if info(target.0).map_err(|e|e.to_string())?.attributes & 0x400 !=0 {return Err("target is reparse point".into())}
    event("open","success",0,"{\"label\":\"guards\",\"access\":1048737,\"share\":3,\"disposition\":1,\"options\":2097185}");
    let mut fs=[0u16;64]; let mut serial=0;let mut max=0;let mut flags=0;
    let vol=unsafe{GetVolumeInformationByHandleW(target.0,ptr::null_mut(),0,&mut serial,&mut max,&mut flags,fs.as_mut_ptr(),64)};
    if vol==0{return Err(format!("volume query {}",unsafe{GetLastError()}))}
    let end=fs.iter().position(|v|*v==0).unwrap_or(fs.len());
    let filesystem=String::from_utf16_lossy(&fs[..end]);
    if filesystem!="NTFS"{return Err(format!("unqualified filesystem {filesystem}"))}
    event("open","success",0,&format!("{{\"label\":\"volume\",\"method\":\"GetVolumeInformationByHandleW\",\"filesystem\":\"NTFS\",\"serial\":{serial}}}"));
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


# .claude/p07-containment-spike-2026-09-20/supervisor.cjs
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
  const indexFile = path.join(evidence,'index.json');
  const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile,'utf8')) : { schema:1, candidate:'windows-relative-handles-v1', correctionCount:0, stopped:false, cases:Object.fromEntries(Object.keys(IDS).map(id=>[id,{status:'unattempted',reason:'serial case not yet reached'}])), runs:[] };
  if (index.stopped || index.cases[input.caseId].status !== 'unattempted') throw new Error('study stopped or initial case already attempted');
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
  const children = new Set(); let deadline; let failed = null; let env;
  const emit = (actor, action, outcome, osCode, detail) => { const e={sequence:report.events.length+1,actor,action,outcome,osCode,elapsedMs:Math.round(performance.now()-start),detail}; report.events.push(e); return e.sequence; };
  const action = (name, fn, detail={}) => { try { const value=fn(); emit('owner',name,'success',0,detail); return {ok:true,value}; } catch(error) { emit('owner',name,'refused',error.errno??error.code??null,{...detail,error:error.message}); return {ok:false,error}; } };
  const expect = (condition,message) => { if(!condition) throw new Error(message); };
  const native = async (p, phase) => {
    const child = spawn(binary,[p.base],{env,cwd:runRoot,stdio:['pipe','pipe','pipe'],windowsHide:true}); children.add(child);
    const childRow={actor:'candidate',pid:child.pid??null,exitCode:null,signal:null,closeObserved:false};report.children.push(childRow);
    let pending=[],queue=[],buffer='',stderr='',closed=false,protocolError=null;
    let closeResolve; const closePromise=new Promise(resolve=>{closeResolve=resolve;});
    const fail = error => { protocolError=error; for(const q of pending.splice(0)) q.reject(error); };
    const timer=setTimeout(()=>{fail(new Error('child timeout'));child.kill();},60000);
    child.on('error',fail);
    child.stderr.on('data',b=>{stderr+=b; if(stderr.length>65536){fail(new Error('stderr bound'));child.kill();}});
    child.stdout.on('data',b=>{
      buffer+=b; if(buffer.length>65536){fail(new Error('event buffer bound'));child.kill();return;}
      while(buffer.includes('\n')) { const at=buffer.indexOf('\n'),line=buffer.slice(0,at).trim();buffer=buffer.slice(at+1);if(!line)continue;
        try { const event=JSON.parse(line); if(!['open','create','close','remove','write','rename','junction','barrier','process-exit'].includes(event.action)||!['success','refused','error','not-reached'].includes(event.outcome)||!Number.isInteger(event.osCode)||!event.detail||report.events.length>10000)throw new Error('malformed native event');
          const sequence=emit('candidate',event.action,event.outcome,event.osCode,{...event.detail,phase});
          if(event.detail.label==='volume')report.environment.filesystemEvidence=event.detail;
          if(event.action==='barrier'){const item={label:event.detail.label,sequence};const waiter=pending.shift();if(waiter)waiter.resolve(item);else queue.push(item);}
        } catch(error){fail(error);child.kill();}
      }
    });
    child.on('close',(code,signal)=>{closed=true;clearTimeout(timer);children.delete(child);Object.assign(childRow,{exitCode:code,signal,closeObserved:true});emit('candidate','process-exit',code===0?'success':'error',code,{phase,signal,stderr});fail(new Error(`child closed ${code}: ${stderr}`));closeResolve();});
    const barrier = async label => {if(protocolError)throw protocolError; const next=queue.length?queue.shift():await new Promise((resolve,reject)=>pending.push({resolve,reject}));expect(next.label===label,'barrier mismatch');};
    await barrier('ready');
    return {command:async name=>{if(closed)throw new Error('closed child');child.stdin.write(name+'\n');await barrier('done');},close:async()=>{child.stdin.end('exit\n');await closePromise;expect(childRow.exitCode===0,'native child did not close successfully');},closePromise};
  };
  const rows = () => report.claims;
  const fill = (kind, first, outcome) => {for(const c of rows())c[kind]={id:`${kind==='positiveControl'?'positive':'unsafe'}:${c.id}`,outcome,events:report.events.filter(e=>e.sequence>=first).map(e=>e.sequence)};};
  try {
    expect(build.status===0 && !build.error,'pre-measurement build unavailable');
    mkdir(runRoot);env=privateEnv(path.join(runRoot,'home'));
    const unsafe = fixture(path.join(runRoot,'unsafe')), positive = fixture(path.join(runRoot,'positive')), guarded=fixture(path.join(runRoot,'guarded'));
    report.ownerState.before=mapTree(runRoot);report.targetState.before={unsafe:mapTree(unsafe.target),positive:mapTree(positive.target),guarded:mapTree(guarded.target)};
    const work=async()=>{
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
      first=report.events.length+1;const guard=await native(guarded,'guarded');const outsideBefore=mapTree(guarded.outside);
      const renameGuarded=(kind)=>action('rename',()=>fs.renameSync(kind==='target'?guarded.target:guarded.parent,path.join(guarded.base,`${kind}-moved`)),{phase:'guarded',kind});
      let proof=true;
      if(input.caseId==='parent-swap'){
        for(const point of ['before-create','before-cleanup']){
          emit('supervisor','barrier','success',0,{phase:'guarded',point});
          for(const kind of ['target','ancestor']) {const attempt=renameGuarded(kind);if(attempt.ok){proof=false;break;}}
          if(!proof)break;
          const junction=action('junction',()=>fs.symlinkSync(guarded.outside,guarded.target,'junction'),{phase:'guarded',point});expect(!junction.ok,'junction unexpectedly replaced existing target');
          if(point==='before-create')await guard.command('create');else await guard.command('cleanup');
        }
        const targetId=identity(guarded.target);proof=proof && identity(guarded.alias)===targetId && identity(guarded.target.toUpperCase())===targetId;
        emit('owner','open','success',0,{phase:'guarded',aliasIds:{target:targetId,case:identity(guarded.target.toUpperCase()),junction:identity(guarded.alias)}});
      }else if(input.caseId==='leaf-swap'){
        for(const kind of ['file','directory','junction']){
          const leaf=path.join(guarded.target,'probe.txt');write(leaf,'observed-old');const observed=digest(leaf);emit('supervisor','barrier','success',0,{phase:'guarded',point:'after-leaf-observation',observed,kind});fs.unlinkSync(leaf);
          if(kind==='file')write(leaf,'owner-replacement');else if(kind==='directory')mkdir(leaf);else fs.symlinkSync(guarded.outside,leaf,'junction');
          const before=mapTree(guarded.target);await guard.command('create');await guard.command('inspect');proof=proof && JSON.stringify(mapTree(guarded.target))===JSON.stringify(before);
          const lastOpen=report.events.filter(e=>e.actor==='candidate'&&e.action==='open'&&e.detail.label==='inspect').at(-1);proof=proof && (kind==='file'?lastOpen.outcome==='success':lastOpen.outcome==='refused');
          if(kind==='directory')fs.rmdirSync(leaf);else fs.unlinkSync(leaf);
        }
        proof=proof && !renameGuarded('target').ok;
      }else{
        proof=proof && !renameGuarded('target').ok;
        proof=proof && !renameGuarded('ancestor').ok;
        if(proof){await guard.command('create');await guard.command('cleanup');}
      }
      if(proof){write(path.join(guarded.target,'owner.txt'),'owner-updated');emit('owner','write','success',0,{phase:'guarded',ownerWritePreserved:fs.readFileSync(path.join(guarded.target,'owner.txt'),'utf8')==='owner-updated'});}
      proof=proof && JSON.stringify(mapTree(guarded.outside))===JSON.stringify(outsideBefore);
      await guard.close();
      if(input.caseId==='moved-directory')proof=proof && action('rename',()=>fs.renameSync(guarded.target,path.join(guarded.base,'after-exit')),{phase:'guarded',point:'after-child-close'}).ok;
      for(const c of rows()){c.status=proof?'mechanism-observed-in-fixture':'refuted';c.reason=proof?'Recorded candidate observations satisfy this fixed fixture claim; owner impact remains a decision':'A guarded boundary or required operation violated its fixture assertion';c.events=report.events.filter(e=>e.sequence>=first).map(e=>e.sequence);}
      report.ownerState.expectedOwnerWrites=['unsafe phase intentionally performs each preregistered violation','positive/ancestor/target/owner.txt becomes owner-updated','guarded owner.txt becomes owner-updated if guarded operations complete','moved-directory guarded target is renamed only after child closure'];
    };
    await Promise.race([work(),new Promise((_,reject)=>{deadline=setTimeout(()=>reject(new Error('case timeout')),180000);})]);
  } catch(error) {failed=error.message;emit('supervisor','barrier','error',null,{failure:failed});}
  finally {
    clearTimeout(deadline);
    for(const child of [...children]) { child.kill(); await Promise.race([new Promise(resolve=>child.once('close',resolve)),new Promise(resolve=>setTimeout(resolve,3000))]); }
    const allClosed=report.children.every(c=>c.closeObserved);
    try {if(fs.existsSync(runRoot)){report.ownerState.after=mapTree(runRoot);for(const phase of ['unsafe','positive','guarded']){const p=path.join(runRoot,phase,'ancestor/target');report.targetState.after[phase]=fs.existsSync(p)&&!fs.lstatSync(p).isSymbolicLink()?mapTree(p):null;}}}catch(e){failed=failed||e.message;}
    report.provenance.sourceStable=sources.every(s=>digest(path.join(root,s.path))===s.sha256);
    report.provenance.binaryStable=report.provenance.binarySha256!==null && fs.existsSync(binary) && digest(binary)===report.provenance.binarySha256;
    if(allClosed){try{if(fs.existsSync(runRoot))safeRemove(runRoot,path.join(root,'runs'));report.cleanup.complete=true;}catch(e){report.cleanup.errors.push(e.message);}}
    else report.cleanup.errors.push('owned child closure not confirmed');
    if(fs.existsSync(runRoot))report.cleanup.retainedPaths.push(runRoot);
    report.environment.hostLoadAfter=load();report.timing.endedAt=new Date().toISOString();
    if(failed){for(const c of rows()){c.status='unverified';c.reason=failed;}}
    const valid=!failed && report.provenance.sourceStable && report.provenance.binaryStable && allClosed && report.cleanup.complete && report.environment.filesystemEvidence?.filesystem==='NTFS' && rows().every(c=>c.positiveControl.outcome==='api-success-observed'&&c.unsafeControl.outcome==='violation-observed');
    report.verdict=!valid?'unverified':rows().some(c=>c.status==='refuted')?'refuted':rows().some(c=>c.status==='unverified')?'unverified':'mechanism-observed-in-fixture';
    const receipt=`${runId}-${input.caseId}.json`;fs.writeFileSync(path.join(evidence,receipt),JSON.stringify(report,null,2),{flag:'wx'});
    fs.writeFileSync(path.join(evidence,`${runId}-events.jsonl`),report.events.map(e=>JSON.stringify(e)).join('\n')+'\n',{flag:'wx'});
    index.cases[input.caseId]={status:report.verdict,receipt,reason:failed||'see claim/control records'};index.runs.push({runId,caseId:input.caseId,receipt});index.stopped=report.verdict!=='mechanism-observed-in-fixture';
    fs.writeFileSync(indexFile,JSON.stringify(index,null,2));
    console.log(JSON.stringify({runId,caseId:input.caseId,verdict:report.verdict,claims:rows().map(c=>({id:c.id,status:c.status})),childrenClosed:allClosed,cleanup:report.cleanup,reason:failed,receipt}));
    if(index.stopped)process.exitCode=1;
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});


# Approved contract
## 21. P07 prerequisite: proposed Windows containment spike

Status: **OWNER APPROVED 2026-09-21**, explicit approval of the minimal scope.
Execution is authorized only within the boundaries below. Supersedes the eight-scenario study draft
retained in p07-mechanism-opus-2026-09-20.packet.md. That draft received
**PASS WITH CHANGES**, claude-opus-5/xhigh requested, session
9d124829-3290-4276-af0d-3f1fd78209a2, packet-only, zero tools. No experimental
source or product lock tests have been written.

### Decision and why this is the next bounded step

Keep the accepted takeover policy: automatic takeover only with proof; otherwise
truthful refusal. Containment is independent and presently unsolved for both fresh
acquisition and refusal-only implementations. Do not ask the owner to decide this
same policy again. P07 production arguments/returns remain unapproved.

Approve a three-case **Windows containment spike**, testing one candidate: retained
Windows directory handles with delete sharing denied, and single-component relative
opens via NtCreateFile. This is a falsifiable candidate, not an accepted mechanism.
Test whether it prevents path replacement while allowing ordinary owner file writes,
including what it prevents the owner from renaming. It does not implement a lock,
choose a liveness domain, qualify automatic takeover, or implement recovery.

Positive outcome: resolve the Windows containment uncertainty, then prepare the
cross-platform mechanism/cost table and P07 API packet. Windows-only evidence cannot
approve a portable production API. Native Linux and macOS evidence stay open; macOS
is an existing CI requirement, not a newly promised installation platform. Negative
outcome: return the exact refuted guarantee to the owner without changing candidate
or weakening the contract. Unverified outcome: name the missing tool, privilege,
host or observation; do not treat it as mechanism refutation or silently retry.

The owner is considering a native component only if a later design can use a small
first-party helper, without an admin service, install-time compiler or install-time
binary download, and with attributable builds/native gates for supported platforms.
This is a proposed cost envelope for evaluation, not approval to ship a helper.
If even that envelope is unacceptable, do not conduct this spike. A successful spike
removes one feasibility blocker; it does not establish packaging or product readiness.

### Current evidence and exposure

- No LockFileEx, flock, openat2 or Windows handle-relative adapter was found in
  bin/scripts/overlay. The allowed Node fs/PID ports supply no demonstrated operation
  boundary against parent replacement. This is a repository finding, not a proof
  that no possible JavaScript technique exists.
- The rejected installer lock remains in bin/lib/install-transaction.js; the wrapper
  currently does not import it. Deferring its repair does not newly expose that
  implementation, but the existing installer still fails rollback acceptance.
- A separate lock is **included in the assembled distribution** at
  dist/gsd-core/bin/lib/capability-lock.cjs. Its
  capability-consent and capability-lifecycle consumers call acquireLock for consent
  persistence and lifecycle mutations. It uses hostname/start-time heuristics, treats
  a missing hostname as local, permits foreign/unknown takeover after600000ms, and
  rechecks before path-based rename. This source-level suitability finding is not a
  reproduced exploit. It must not be reused as the installer safety mechanism.
  Implementing agent owns a bounded reachability/race assessment before the next
  installed-use qualification/P21; any repair requires its own allowlist. Study
  approval does not accept this shipped risk or claim the installer repair covers it.
- Local command discovery found rustc/cargo launchers, not proof of a working compiler.
  WSL lists Ubuntu; kernel version, filesystem and toolchain remain unverified.
  This packet authorizes Windows/local NTFS only. WSL2/ext4, Windows/WSL shared paths,
  native Linux and macOS have **no execution authorization or proof in this spike**.
  No remote execution or CI workaround is included.

Primary sources checked 2026-09-20:
[Node22 fs](https://nodejs.org/download/release/latest-jod/docs/api/fs.html),
[CreateFile sharing](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilea),
[NtCreateFile relative opens](https://learn.microsoft.com/en-us/windows/win32/api/winternl/nf-winternl-ntcreatefile),
[LockFileEx](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-lockfileex),
[Linux openat2](https://man7.org/linux/man-pages/man2/openat2.2.html),
[Linux flock](https://man7.org/linux/man-pages/man2/flock.2.html).
These documents establish candidate primitives, not this protocol's safety. OS-held
lock release may be delayed and does not prove child quiescence. Those lock-specific
questions remain in P07; this spike makes no claim about them.

### Exact source and execution boundary proposed for approval

New experimental source only in
`.claude/p07-containment-spike-2026-09-20/`: `probe.rs`, `supervisor.cjs`, `README.md`;
compiler outputs and disposable fixtures stay under that directory. Reports and
source/binary hashes go to `.planning/evidence/p07-containment-spike-2026-09-20/`.
The existing eslint configuration already excludes .claude/**. No lint configuration
change or shipping exemption is proposed. Review these two experimental sources
explicitly; run Node syntax check, Rust compiler warnings-as-errors, and explicit
Markdown CLI on README/changed planning files. Record actual output, not merely exit.
The spike is not production Tier S acceptance or an addition to the coverage gate.

Use a resolved, already-installed rustc executable and its existing standard library,
with direct Windows FFI and no Cargo/crates/downloads. Record executable/sysroot and
build command. Rust avoids introducing a PowerShell compile/hosting subprocess into
the measured window, given the retained PowerShell timeout/home-cache observations.
PowerShell/.NET FileShare.None does not alone exercise handle-relative traversal;
flock(1) does not test this Windows containment candidate. This rationale is limited
to the spike, not a product implementation-language decision.

Resolve the installed compiler read-only, then build **before** the measured owner
snapshot in a private build home. Clear case aliases and redirect HOME/USERPROFILE,
APPDATA/LOCALAPPDATA/XDG variables, CARGO_HOME/RUSTUP_HOME, TEMP/TMP and incremental
output privately; invoke the resolved compiler directly, not rustup auto-install.
No real Claude/Codex target, elevated action, persistent system change or real owner
content. Attack links/junctions point only to seeded data in the private fixture.
No caller-supplied target, command, PID, timeout, expected result or skip switch.

Supervisor input is exactly `{schema:1, caseId:"parent-swap"|"leaf-swap"|"moved-directory"}`.
Unknown keys/values reject before creating a fixture. A UUID run directory contains
its own home, target, sibling sentinels and actor logs. Use private inherited pipes
with sequenced barriers; actors are fixed `supervisor`, `candidate`, `owner`.
Each child deadline60s; whole case including cleanup180s. Timeout means UNVERIFIED,
never mechanism refutation or death evidence. Stop/verify only owned children; any
uncertain closure retains the fixture. No sleep/polling race inference.

One candidate, three cases, one platform. One initial run per case. At most **one
supervisor/probe defect correction in the entire spike**, logged and reviewed, may
rerun affected cases once. A candidate-design change, second harness defect, timeout,
missing positive control or genuine refutation stops the spike and returns to the
owner. No second candidate, automatic retries or silent time-budget extension.
Timeout always takes precedence over the correction allowance: stop UNVERIFIED;
a pre-measurement missing/broken compiler or linker also returns UNVERIFIED and
does not consume that allowance. The180s case deadline includes all control phases.

### Fixed claims, controls and expected observations

| Case | Exact claim identities | Observation required |
|---|---|---|
| parent-swap | parent-outside-preserved; alias-same-object; owner-file-write-preserved | Pause before relative create and before owned-file cleanup; owner attempts parent/ancestor rename and junction replacement. Outside sentinels unchanged; ordinary pre-existing owner-file write succeeds and survives. Exercise case-alias and a pre-existing fixture junction alias to the same target, recording file identity. No UNC/network/8.3/bind-mount claim. |
| leaf-swap | leaf-replacement-preserved; leaf-type-enforced; owner-rename-effect-recorded | Pause between leaf observation and relative open/action; substitute a regular file, directory and junction. Replacement bytes preserved or operation refused; no unexpected type followed. Record each owner rename result/error, including sharing violations caused by the candidate. |
| moved-directory | moved-object-boundary; ancestor-rename-effect-recorded; guard-exit-effect-recorded | With child/ancestor handles retained, attempt moving the held directory out of target into the fixture sibling and replacing the old name. Safe result requires move denied or candidate refusal before post-move mutation; continued mutation via a moved handle does not pass the pathname-boundary claim. Record owner restrictions and retry outcome after actual guard-process closure. No bounded kernel-release promise from one measurement. |

The three case rows define exactly nine claim identities; each case must report all
and only its row. Fixed actions are open/create/close/remove/write/rename/junction/
barrier/process-exit; outcomes are success/refused/error/not-reached. Include literal
OS status codes. Intended owner-write changes are logged as expected deltas; all
other owner entries use complete before/after maps and section20 type/runtime rules.
No target-wide exclusion may hide damage to an owner entry used by a claim. Keep a
separate complete target map for those assertions. Private compiler work is outside
the observation window, not a broad cache exclusion.

Each claim carries an unsafe-control record showing its detector catches the named
violation, and a positive-control record showing the intended OS call succeeds on
an unchanged fixture with documented arguments. Inspect FFI definitions against
published signatures and record the exact access/share/create options. A missing or
failed positive control gives UNVERIFIED, not refuted. A negative control that cannot
induce its violation also gives UNVERIFIED. Owner-impact claims are observational:
controls validate that success and sharing-refusal events are distinguished; they
cannot establish that a measured restriction is acceptable to the owner.

### Evidence contract and decision output

One immutable receipt per run, named `<runId>-<caseId>.json`, plus `index.json` listing
all attempted/unattempted cases and reasons. No single report.json overwritten.
Use exactly these receipt fields (no open-ended additional claims):

```text
{schema:1, runId, caseId, candidate:"windows-relative-handles-v1",
 scope:{platform:"win32",filesystem:"NTFS",aliases:["case","fixture-junction"]},
 nonClaims:["portable-lock-safety","automatic-takeover","child-quiescence",
            "power-loss","owner-impact-acceptance","production-readiness",
            "symbolic-link-traversal","release-latency-bound"],
 provenance:{sources,compilerExecutable,compilerVersion,sysroot,buildCommand,
             binaryPath,binarySha256,sourceStable,binaryStable},
 environment:{osRelease,arch,node,bun,filesystemEvidence,hostLoadBefore,hostLoadAfter},
 timing:{startedAt,endedAt,deadlineMs},
 verdict:"mechanism-observed-in-fixture"|"refuted"|"unverified",
 claims:[{id,status,reason,events,positiveControl,unsafeControl}],
 events:[{sequence,actor,action,outcome,osCode,elapsedMs,detail}],
 ownerState:{before,after,expectedOwnerWrites}, targetState:{before,after},
 children:[{actor,pid,exitCode,signal,closeObserved}],
 cleanup:{complete,retainedPaths,errors}}
```

Claims use the same three verdict terms. Control records contain identity, observed
outcome and event sequence references. Source and binary digests bind before/after
execution. Filesystem evidence names the native volume-query method/result, not a
label copied from input. Host load is context only. Missing/unexpected claims,
malformed events, unobserved barriers, source/binary drift, absent child closure or
cleanup failure prohibit mechanism-observed-in-fixture. Refuted requires a concrete
counterexample with valid positive controls; everything else is unverified.
With valid provenance/control evidence, a refuted claim makes the run refuted;
otherwise any unverified claim makes it unverified, and mechanism-observed-in-fixture
requires all three claims observed plus every evidence/closure/cleanup condition.
Each unsafe control runs with the candidate guard absent on its own fixture instance,
as a named phase within the same case run. Register all nine positive-control and
nine unsafe-control identities in README before execution. Sources records contain
path and SHA256; open/create event detail contains access/share/disposition/flags.
A non-NTFS volume result aborts UNVERIFIED. Index records any correction and its
superseded/superseding run IDs; never overwrite the earlier evidence. Case1 parent
rename effects are event observations, not extra claims. Symbolic-link traversal
and a release-latency bound are additional non-claims: junction and one post-exit
observation do not prove them. Any later non-Windows table row stays unverified.

Validation is documented checks plus independent review of raw receipts/source,
**not a new general-purpose validator framework**. Retain raw events, exact commands,
compiler output and failures. Deliver index, findings/cost table and updated
CONTINUE/HANDOFF, naming every remaining gap. Source review and negative controls
are required even though this bounded experiment is not a production coverage gate.

### Opus findings disposition

1/14: fixed Windows-only inventory; distinguish CI macOS and unverified Ubuntu/WSL.
2: fixed total run/correction bound; reject the suggested unlimited harness fixes.
3/4/5/17/18/19/20: explicit fixed claims, controls, provenance, per-run receipts,
non-claims, vocabularies, manual review and non-product verdicts.
6/7/8: timeout UNVERIFIED, private build before measurement, existing ignored study
source directory; no new lint rule or home exclusion.
9/10: takeover policy unchanged; positive/negative/unverified decision branches and
proposed maintenance envelope explicit.
11/12: moved-object case and owner impact explicit; lock release latency deferred
with the removed OS-lock scope, not claimed proved by containment.
13/22: shipped capability-lock consumers/exposure disclosed; installer seam unwired.
15/21: publication, terminal release, liveness and orphan cases removed from spike;
remain requirements of their later approved seams.
16/23: host-language rationale and receipt/continuity deliverables explicit.

Owner approved this bounded source/experiment extension on2026-09-21.
No lock implementation, P08/P09 RED tests, preflight/snapshot, commit or push follows
from approval of this spike alone.

Final approval-readiness review: **PASS**, claude-opus-5/xhigh requested, session
c99b25ee-82ad-4c0d-916c-863b64797b28, zero tools, packet-only. Evidence prefix
p07-containment-opus-2026-09-20. Its three required text-only preregistration
corrections are incorporated above; the reviewer explicitly required no further
review pass for those corrections. No claim of experimental or product execution.

