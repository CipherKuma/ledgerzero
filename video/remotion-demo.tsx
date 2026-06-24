import React from 'react';
import {AbsoluteFill, Composition, interpolate, registerRoot, spring, useCurrentFrame, useVideoConfig} from 'remotion';

type Scene = {kind: 'title' | 'problem' | 'product' | 'placeholder' | 'proof' | 'close'; eyebrow: string; title: string; body: string; points?: string[]};
type Project = {id: string; name: string; accent: string; accent2: string; bg: string; fg: string; scenes: Scene[]};

const fps = 30;
const sceneSeconds = 11;
const sceneFrames = sceneSeconds * fps;

const projects: Project[] = [
  {id: 'ScribeZeroDemo', name: 'ScribeZero', accent: '#2ddc91', accent2: '#f1fff6', bg: '#07140d', fg: '#f7fff9', scenes: [
    {kind:'title', eyebrow:'Zero Cup judge demo', title:'Spoken care becomes patient-owned proof.', body:'A bilingual AI health scribe for Tamil and Hindi consults, built around private 0G receipts.'},
    {kind:'problem', eyebrow:'Problem', title:'Care speaks local. Records do not.', body:'Clinical notes flatten local-language consults into trapped English summaries.', points:['Tamil / Hindi consults','Structured SOAP note','Portable private receipt']},
    {kind:'product', eyebrow:'Product loop', title:'Listen. Structure. Seal. Verify.', body:'The doctor keeps the conversation natural while the patient receives a verifiable health-memory handle.', points:['Record consult','Generate SOAP','Seal on 0G','Verify privately']},
    {kind:'placeholder', eyebrow:'Insert app footage 01', title:'Replace this window with: /app consult to SOAP note.', body:'Show sample consult playback, generated note, and completion state.', points:['22-27 seconds raw capture','Browser zoom 100 percent','Pause on structured output']},
    {kind:'proof', eyebrow:'Why 0G', title:'Without 0G, this is just another note app.', body:'Compute gives neutral execution. Storage gives the ownership handle. Verification keeps content private.', points:['0G Compute','0G Storage','Private verification']},
    {kind:'close', eyebrow:'Close', title:'ScribeZero turns spoken care into records patients can carry.', body:'Live app: scribezero.pages.dev'}]},
  {id: 'WorldCupDemo', name: '0G World Cup', accent: '#d7ff4f', accent2: '#ecffe2', bg: '#051108', fg: '#ffffff', scenes: [
    {kind:'title', eyebrow:'Zero Cup judge demo', title:'Fantasy football becomes a verifiable AI arena.', body:'Draft the best XI, simulate the match, and inspect proof behind the result.'},
    {kind:'problem', eyebrow:'Problem', title:'Every fan has a best XI. Almost none can prove the game.', body:'0G World Cup turns the debate into a room-based game for humans and agents.', points:['8,379 player pool','Human and agent rooms','Shareable result cards']},
    {kind:'product', eyebrow:'Product loop', title:'Draft. Simulate. Prove. Share.', body:'A full match loop with draft commitments, result pages, and proof artifacts.', points:['Create room','Draft XI','Run match','Inspect proof']},
    {kind:'placeholder', eyebrow:'Insert app footage 01', title:'Replace this window with: draft room plus selected XI.', body:'Then cut to result page and proof packet scroll.', points:['Room creation','Final score','Storage and Agentic ID proof']},
    {kind:'proof', eyebrow:'Why 0G', title:'The proof trail is the product.', body:'0G Storage, Galileo contracts, and Agentic ID make the game inspectable outside the UI.', points:['Draft logs','Escrow receipts','Agent identity']},
    {kind:'close', eyebrow:'Close', title:'Playable for fans. Inspectable for judges. Built for agents.', body:'Live app: 0g-world-cup.pages.dev'}]},
  {id: 'ArcadeArenaDemo', name: '0G Arcade Arena', accent: '#46ff9f', accent2: '#fff0a8', bg: '#030607', fg: '#ffffff', scenes: [
    {kind:'title', eyebrow:'Zero Cup judge demo', title:'The open arcade for humans and ownable agents.', body:'A reusable game platform where matches, agents, replays, and proof receipts share one standard.'},
    {kind:'problem', eyebrow:'Problem', title:'Agent games should not be one-off demos.', body:'They need reusable rooms, game packs, replay standards, and proof trails.', points:['Multiple games','Agent policies','Shared proof layer']},
    {kind:'product', eyebrow:'Product loop', title:'Pick a game. Launch a room. Finish with evidence.', body:'Humans and agents can play under one arcade standard.', points:['Game grid','Agent match','Result proof','Submit game']},
    {kind:'placeholder', eyebrow:'Insert app footage 01', title:'Replace this window with: game grid to live match.', body:'Show at least four games, an agent room, result, and proof explorer.', points:['Browse games','Start match','Open proof explorer']},
    {kind:'proof', eyebrow:'Why 0G', title:'Each match can leave a replay trail outside the UI.', body:'Game packs, receipts, and compute/storage status are exposed for builders and judges.', points:['Game packs','Router Compute','Storage receipts']},
    {kind:'close', eyebrow:'Close', title:'A game lobby that proves agents can play for real.', body:'Live app: 0g-arcade-arena.pages.dev'}]},
  {id: 'LedgerZeroDemo', name: 'Ledger Zero', accent: '#d9b56f', accent2: '#f6f0e8', bg: '#06080b', fg: '#f6f0e8', scenes: [
    {kind:'title', eyebrow:'Zero Cup judge demo', title:'AI workers should be assets, not rented sessions.', body:'A 0G marketplace where specialized AI workers carry memory, capability, ownership, and payout history.'},
    {kind:'problem', eyebrow:'Problem', title:'Teams pay agents but cannot own the worker that learns.', body:'Memory, capabilities, and future revenue usually stay locked inside one platform.', points:['Locked memory','Opaque capability','No resale layer']},
    {kind:'product', eyebrow:'Product loop', title:'Own. Operate. Trade.', body:'Register a worker, attach proof-backed job history, and transfer ownership with payout routing.', points:['Register manifest','Post job','Inspect proof','Transfer owner']},
    {kind:'placeholder', eyebrow:'Insert app footage 01', title:'Replace this window with: marketplace to worker detail.', body:'Then show register flow, job posting, Proof Center, and profile ownership.', points:['Marketplace','Register worker','Proof Center']},
    {kind:'proof', eyebrow:'Why 0G', title:'Proof makes this a market, not a directory.', body:'0G Storage carries worker artifacts while contracts and Proof Center explain ownership and state.', points:['WorkerINFT','0G artifacts','Payout routing']},
    {kind:'close', eyebrow:'Close', title:'The marketplace layer for AI labor that can be owned, hired, and sold.', body:'Live app: ledgerzero.pages.dev'}]},
];

const slash = (color: string) => ({backgroundImage: `linear-gradient(115deg, transparent 0 58%, ${color}22 58% 62%, transparent 62%), radial-gradient(circle at 78% 18%, ${color}44, transparent 26%)`});

function SceneView({project, scene, index}: {project: Project; scene: Scene; index: number}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 18, stiffness: 80}});
  const y = interpolate(enter, [0, 1], [46, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const sweep = interpolate(frame, [0, sceneFrames], [-40, 115], {extrapolateRight: 'clamp'});
  const placeholder = scene.kind === 'placeholder';
  return <AbsoluteFill style={{background: project.bg, color: project.fg, overflow: 'hidden', fontFamily: 'Arial, Helvetica, sans-serif'}}>
    <div style={{position:'absolute', inset:0, ...slash(project.accent)}} />
    <div style={{position:'absolute', left:`${sweep}%`, top:0, width:180, height:'100%', transform:'skewX(-12deg)', background:`${project.accent}18`}} />
    <div style={{position:'absolute', left:52, top:42, fontSize:14, letterSpacing:5, textTransform:'uppercase', color:project.accent, fontWeight:800}}>{String(index + 1).padStart(2, '0')} / {project.name} / {scene.eyebrow}</div>
    <div style={{position:'absolute', left:72, top:118, width:placeholder ? 570 : 760, transform:`translateY(${y}px)`, opacity}}>
      <div style={{fontSize:72, lineHeight:0.9, letterSpacing:-3, fontWeight:950}}>{scene.title}</div>
      <div style={{marginTop:26, fontSize:25, lineHeight:1.35, color:project.fg + 'b8', maxWidth:740}}>{scene.body}</div>
    </div>
    {placeholder ? <div style={{position:'absolute', right:70, top:120, width:560, height:360, border:`3px dashed ${project.accent}`, background:'#0009', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', padding:34, textAlign:'center', boxShadow:`0 0 60px ${project.accent}22`}}>
      <div>
        <div style={{fontSize:18, letterSpacing:4, color:project.accent, textTransform:'uppercase', fontWeight:900}}>App recording placeholder</div>
        <div style={{marginTop:24, fontSize:42, lineHeight:1.05, fontWeight:950}}>Insert real screen capture here</div>
        <div style={{marginTop:20, color:project.fg + 'aa', fontSize:22, lineHeight:1.3}}>The final story is already timed; replace this block with the clip named in docs/demo-video-plan.md.</div>
      </div>
    </div> : null}
    <div style={{position:'absolute', left:72, right:72, bottom:58, display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16}}>
      {(scene.points ?? ['Judge hook','Live product','0G proof']).slice(0,3).map((point, i) => <div key={point} style={{border:`1px solid ${project.accent}55`, background: i === 0 ? project.accent : '#ffffff10', color: i === 0 ? '#050505' : project.fg, minHeight:104, padding:22, borderRadius:14}}>
        <div style={{fontSize:13, letterSpacing:3, textTransform:'uppercase', opacity:0.75, fontWeight:900}}>Beat {i + 1}</div>
        <div style={{marginTop:10, fontSize:24, lineHeight:1.1, fontWeight:900}}>{point}</div>
      </div>)}
    </div>
  </AbsoluteFill>;
}

function DemoVideo({project}: {project: Project}) {
  const frame = useCurrentFrame();
  const sceneIndex = Math.min(project.scenes.length - 1, Math.floor(frame / sceneFrames));
  return <SceneView project={project} scene={project.scenes[sceneIndex]} index={sceneIndex} />;
}

function Root() {
  return <>
    {projects.map((project) => <Composition key={project.id} id={project.id} component={() => <DemoVideo project={project} />} durationInFrames={project.scenes.length * sceneFrames} fps={fps} width={1280} height={720} />)}
  </>;
}

registerRoot(Root);
