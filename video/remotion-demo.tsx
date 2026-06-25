import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  Sequence,
  Video,
  interpolate,
  registerRoot,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

type Scene = {seconds: number; label: string; title: string; body: string; audio: string; video?: string; points: string[]};
type Project = {
  id: string;
  name: string;
  domain: string;
  logo: string;
  accent: string;
  accent2: string;
  bg: string;
  fg: string;
  audioRate: number;
  scenes: Scene[];
};

const fps = 30;
const totalSeconds = 240;

const projects: Project[] = [
  {
    id: 'ScribeZeroDemo',
    name: 'ScribeZero',
    domain: 'scribezero.pages.dev',
    logo: 'logo.png',
    accent: '#84c4a0',
    accent2: '#f5efe2',
    bg: '#0e0f0d',
    fg: '#f5efe2',
    audioRate: 1.234,
    scenes: [
      {seconds: 29, label: '01 / hook', title: 'A medical record should survive the app that created it.', body: 'ScribeZero turns the clinical conversation into patient-owned medical memory.', audio: 'audio/final/scribezero-01-hook.mp3', points: ['Conversation first', 'Patient-owned', 'Private proof']},
      {seconds: 32, label: '02 / problem', title: 'Care speaks local. Records do not.', body: 'Tamil and Hindi consults get forced into English-first forms, rushed notes, and trapped portals.', audio: 'audio/final/scribezero-02-problem.mp3', points: ['Local language care', 'Lost continuity', 'Manual documentation']},
      {seconds: 31, label: '03 / product loop', title: 'Listen. Structure. Seal. Verify.', body: 'The product is not just transcription. It is the workflow after transcription.', audio: 'audio/final/scribezero-03-product-loop.mp3', points: ['SOAP note', 'Timeline', 'Record handle']},
      {seconds: 35, label: '04 / live demo', title: 'Consult to SOAP note', body: 'Live flow: record or play a consult, structure the encounter, review the generated note.', audio: 'audio/final/scribezero-04-demo-consult.mp3', video: 'video/final/scribezero-01-consult-to-note.mp4', points: ['Record consult', 'Generate note', 'Clinical review']},
      {seconds: 36, label: '05 / records', title: 'A note becomes continuity.', body: 'Dashboard, patients, and records make ScribeZero a medical memory layer, not a one-screen demo.', audio: 'audio/final/scribezero-05-demo-records.mp3', video: 'video/final/scribezero-02-patients-records.mp4', points: ['Dashboard', 'Patients', 'Records']},
      {seconds: 32, label: '06 / proof', title: 'The seal is the product.', body: '0G storage gives the patient a portable ownership handle while private medical content stays protected.', audio: 'audio/final/scribezero-06-proof.mp3', video: 'video/final/scribezero-03-verify-proof.mp4', points: ['0G Storage', 'Integrity proof', 'Privacy boundary']},
      {seconds: 31, label: '07 / judge case', title: 'A real healthcare workflow with a real 0G reason.', body: 'Documentation time, patient continuity, and private verification connect into one sellable clinic product.', audio: 'audio/final/scribezero-07-judge-case.mp3', points: ['Useful now', 'Sellable later', '0G-native proof']},
      {seconds: 14, label: '08 / close', title: 'Spoken care becomes records patients can carry.', body: 'Live demo: scribezero.pages.dev', audio: 'audio/final/scribezero-08-close.mp3', points: ['Consult', 'Note', 'Verify']},
    ],
  },
  {
    id: 'WorldCupDemo',
    name: '0G World Cup',
    domain: '0g-world-cup.pages.dev',
    logo: 'logo.png',
    accent: '#ff3045',
    accent2: '#ffffff',
    bg: '#050507',
    fg: '#ffffff',
    audioRate: 1.096,
    scenes: [
      {seconds: 34, label: '01 / hook', title: 'Every fan has a best-eleven argument.', body: '0G World Cup turns football debate into a playable AI-native arena.', audio: 'audio/final/worldcup-01-hook.mp3', points: ['Draft', 'Simulate', 'Prove']},
      {seconds: 33, label: '02 / problem', title: 'Fantasy games are fun. Their outcomes are not inspectable.', body: 'Historical dream teams, agents, and verifiable artifacts need one shared match loop.', audio: 'audio/final/worldcup-02-problem.mp3', points: ['Fan culture', 'Agent games', 'Black-box results']},
      {seconds: 29, label: '03 / product loop', title: 'Create a room. Draft an eleven. Run the match.', body: 'The game is instantly understandable before the infrastructure is explained.', audio: 'audio/final/worldcup-03-product-loop.mp3', points: ['Room', 'Draft pool', 'Result card']},
      {seconds: 34, label: '04 / live demo', title: 'Room creation and draft flow', body: 'The player creates a room, enters the player pool, and builds a squad for simulation.', audio: 'audio/final/worldcup-04-demo-draft.mp3', video: 'video/final/worldcup-01-create-room-draft.mp4', points: ['Create room', 'Pick mode', 'Select XI']},
      {seconds: 39, label: '05 / match', title: 'Agents, board state, and result surfaces', body: 'The product moves from setup into outcome, share card, and agent-readable match context.', audio: 'audio/final/worldcup-05-demo-match.mp3', video: 'video/final/worldcup-02-agents-board-result.mp4', points: ['Agents', 'Board', 'Share result']},
      {seconds: 32, label: '06 / proof', title: 'The proof trail is the product.', body: 'Draft commitment, match artifact, storage receipt, and agent identity make the score inspectable.', audio: 'audio/final/worldcup-06-proof.mp3', video: 'video/final/worldcup-03-proof-packet.mp4', points: ['Commitment', 'Storage receipt', 'Agent identity']},
      {seconds: 28, label: '07 / judge case', title: 'Playable for fans. Inspectable for judges.', body: 'The concept is viral, the loop is complete, and the 0G layer improves the game itself.', audio: 'audio/final/worldcup-07-judge-case.mp3', points: ['Clear concept', 'Community-ready', 'Proof-native']},
      {seconds: 11, label: '08 / close', title: 'Fantasy football for the agent era.', body: 'Live demo: 0g-world-cup.pages.dev', audio: 'audio/final/worldcup-08-close.mp3', points: ['Playable', 'Social', 'Verifiable']},
    ],
  },
  {
    id: 'ArcadeArenaDemo',
    name: '0G Arcade Arena',
    domain: '0g-arcade-arena.pages.dev',
    logo: 'logo.jpg',
    accent: '#b56cff',
    accent2: '#e7c7ff',
    bg: '#08020d',
    fg: '#ffffff',
    audioRate: 1.047,
    scenes: [
      {seconds: 31, label: '01 / hook', title: 'Agent games should be playable arenas.', body: 'A lobby where humans and AI agents compete under one proof standard.', audio: 'audio/final/arcade-01-hook.mp3', points: ['Game lobby', 'Agents', 'Proof']},
      {seconds: 32, label: '02 / problem', title: 'One-off agent demos do not become places people return to.', body: 'Builders need game packs, rooms, receipts, replay data, and proof explorers.', audio: 'audio/final/arcade-02-problem.mp3', points: ['Fragmented demos', 'No shared format', 'No replay trail']},
      {seconds: 33, label: '03 / product loop', title: 'Browse. Play. Prove. Submit.', body: 'The arcade starts as a game surface and grows into reusable agent-game infrastructure.', audio: 'audio/final/arcade-03-product-loop.mp3', points: ['Browse games', 'Start room', 'Submit packs']},
      {seconds: 32, label: '04 / live demo', title: 'Multi-game discovery and room start', body: 'The user browses game cards, opens a detail page, and starts moving toward a room.', audio: 'audio/final/arcade-04-demo-games.mp3', video: 'video/final/arcade-01-games-start-room.mp4', points: ['Game grid', 'Game detail', 'Start CTA']},
      {seconds: 35, label: '05 / match', title: 'Agents, matches, results, leaderboard', body: 'Humans and agents share the arena, then results become repeatable competition state.', audio: 'audio/final/arcade-05-demo-match.mp3', video: 'video/final/arcade-02-agents-match-result.mp4', points: ['Agent roster', 'Match result', 'Leaderboard']},
      {seconds: 32, label: '06 / proof', title: 'Submission and explorer make it infrastructure.', body: 'Builders can submit game packs; matches can leave replay receipts and evidence.', audio: 'audio/final/arcade-06-proof.mp3', video: 'video/final/arcade-03-submit-explorer-proof.mp4', points: ['Submit game', 'Explorer', 'Receipts']},
      {seconds: 30, label: '07 / judge case', title: 'Fun enough to play. Structured enough to grow.', body: 'Multiple games, agent support, builder submission, and proof receipts give the project a platform path.', audio: 'audio/final/arcade-07-judge-case.mp3', points: ['Multi-game', 'Builder path', '0G evidence']},
      {seconds: 15, label: '08 / close', title: 'The game lobby for ownable agents.', body: 'Live demo: 0g-arcade-arena.pages.dev', audio: 'audio/final/arcade-08-close.mp3', points: ['Multiplayer', 'Extensible', 'Verifiable']},
    ],
  },
  {
    id: 'LedgerZeroDemo',
    name: 'Ledger Zero',
    domain: 'ledgerzero.pages.dev',
    logo: 'logo.jpg',
    accent: '#ff8a24',
    accent2: '#ffcf62',
    bg: '#080b10',
    fg: '#fff4dc',
    audioRate: 1.049,
    scenes: [
      {seconds: 30, label: '01 / hook', title: 'AI workers should be assets, not rented sessions.', body: 'Ledger Zero is a marketplace for AI labor that can be owned, hired, and sold.', audio: 'audio/final/ledgerzero-01-hook.mp3', points: ['Own', 'Hire', 'Sell']},
      {seconds: 31, label: '02 / problem', title: 'Agent value is trapped inside closed platforms.', body: 'Memory, capability history, and revenue potential need an ownership and inspection layer.', audio: 'audio/final/ledgerzero-02-problem.mp3', points: ['Locked memory', 'Opaque capability', 'No resale']},
      {seconds: 30, label: '03 / product loop', title: 'Register a worker. Attach proof. Post jobs.', body: 'Ledger Zero treats an AI worker like an economic asset with artifacts, owner, and history.', audio: 'audio/final/ledgerzero-03-product-loop.mp3', points: ['Manifest', 'Job history', 'Owner state']},
      {seconds: 35, label: '04 / live demo', title: 'Marketplace and worker diligence', body: 'Buyers browse workers, inspect capabilities, and review proof metadata before trusting them.', audio: 'audio/final/ledgerzero-04-demo-marketplace.mp3', video: 'video/final/ledgerzero-01-marketplace-worker.mp4', points: ['Marketplace', 'Worker detail', 'Proof metadata']},
      {seconds: 33, label: '05 / workflow', title: 'Register supply and post demand', body: 'Creators register manifests while teams post jobs against proof-backed workers.', audio: 'audio/final/ledgerzero-05-demo-workflow.mp3', video: 'video/final/ledgerzero-02-register-post-job.mp4', points: ['Register', 'Post job', 'Job board']},
      {seconds: 37, label: '06 / proof', title: 'Proof makes this a market, not a directory.', body: '0G storage keeps artifacts portable, while the Proof Center keeps live and fallback states honest.', audio: 'audio/final/ledgerzero-06-proof.mp3', video: 'video/final/ledgerzero-03-proof-profile.mp4', points: ['Portable artifacts', 'Ownership state', 'Honest proof']},
      {seconds: 30, label: '07 / judge case', title: 'This points past the hackathon.', body: 'Teams already pay for AI labor; Ledger Zero adds ownership, inspection, and resale.', audio: 'audio/final/ledgerzero-07-judge-case.mp3', points: ['Real market', 'Asset layer', '0G leverage']},
      {seconds: 14, label: '08 / close', title: 'The marketplace layer for AI labor.', body: 'Live demo: ledgerzero.pages.dev', audio: 'audio/final/ledgerzero-08-close.mp3', points: ['Owned', 'Hired', 'Sold']},
    ],
  },
];

function Background({project}: {project: Project}) {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, totalSeconds * fps], [-30, 120]);
  return <AbsoluteFill style={{background: project.bg, overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 18% 16%, ${project.accent}2e, transparent 28%), radial-gradient(circle at 78% 18%, ${project.accent2}20, transparent 30%), linear-gradient(125deg, ${project.bg}, #020202 58%, ${project.accent}18)`}} />
    <div style={{position: 'absolute', left: `${x}%`, top: -120, width: 310, height: 980, transform: 'skewX(-13deg)', background: `linear-gradient(180deg, ${project.accent}2d, ${project.accent2}18)`}} />
    <div style={{position: 'absolute', inset: 0, opacity: 0.16, backgroundImage: `linear-gradient(${project.accent2}18 1px, transparent 1px), linear-gradient(90deg, ${project.accent}16 1px, transparent 1px)`, backgroundSize: '58px 58px'}} />
  </AbsoluteFill>;
}

function Header({project, scene}: {project: Project; scene: Scene}) {
  return <div style={{position: 'absolute', top: 34, left: 48, right: 48, display: 'flex', alignItems: 'center'}}>
    <div style={{width: 58, height: 58, borderRadius: 12, overflow: 'hidden', background: '#fff'}}>
      <Img src={staticFile(project.logo)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </div>
    <div style={{marginLeft: 18}}>
      <div style={{fontSize: 24, color: project.fg, fontWeight: 950}}>{project.name}</div>
      <div style={{fontSize: 13, color: project.accent, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3}}>{scene.label}</div>
    </div>
    <div style={{marginLeft: 'auto', color: project.fg, opacity: .72, fontSize: 17}}>{project.domain}</div>
  </div>;
}

function PointGrid({project, points}: {project: Project; points: string[]}) {
  return <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14}}>
    {points.map((point, index) => <div key={point} style={{border: `1px solid ${index === 0 ? project.accent : project.accent2}66`, background: index === 0 ? project.accent : `${project.accent}14`, color: index === 0 ? project.bg : project.fg, minHeight: 88, borderRadius: 10, padding: 18, display: 'flex', alignItems: 'center', boxShadow: index === 0 ? `0 0 42px ${project.accent}25` : 'none', fontSize: 23, lineHeight: 1.08, fontWeight: 950}}>{point}</div>)}
  </div>;
}

function TextScene({project, scene}: {project: Project; scene: Scene}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 18, stiffness: 75}});
  return <AbsoluteFill>
    <Background project={project} />
    <Header project={project} scene={scene} />
    <div style={{position: 'absolute', left: 72, right: 72, top: 150, opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [34, 0])}px)`}}>
      <div style={{fontSize: 70, lineHeight: .94, color: project.fg, fontWeight: 950, maxWidth: 1050}}>{scene.title}</div>
      <div style={{marginTop: 24, fontSize: 28, lineHeight: 1.28, color: `${project.fg}c7`, maxWidth: 860}}>{scene.body}</div>
    </div>
    <div style={{position: 'absolute', left: 72, right: 72, bottom: 56}}><PointGrid project={project} points={scene.points} /></div>
  </AbsoluteFill>;
}

function FootageScene({project, scene}: {project: Project; scene: Scene}) {
  return <AbsoluteFill>
    <Background project={project} />
    <Header project={project} scene={scene} />
    <div style={{position: 'absolute', left: 52, right: 52, top: 100, height: 442, borderRadius: 16, overflow: 'hidden', border: `2px solid ${project.accent}88`, background: '#000', boxShadow: `0 0 70px ${project.accent}24`}}>
      <Video src={staticFile(scene.video ?? 'video/raw/demo-footage.mp4')} muted loop style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      <div style={{position: 'absolute', left: 20, top: 20, padding: '10px 13px', borderRadius: 8, background: 'rgba(0,0,0,.74)', color: project.accent, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 950}}>Live app footage slot</div>
      <div style={{position: 'absolute', left: 20, right: 20, bottom: 18, padding: '14px 16px', borderRadius: 8, background: 'rgba(0,0,0,.76)', color: project.fg}}>
        <span style={{fontSize: 25, fontWeight: 950}}>{scene.title}</span>
        <span style={{marginLeft: 12, fontSize: 17, opacity: .78, fontWeight: 750}}>{scene.body}</span>
      </div>
    </div>
    <div style={{position: 'absolute', left: 52, right: 52, bottom: 46}}><PointGrid project={project} points={scene.points} /></div>
  </AbsoluteFill>;
}

function ScenePlayer({project, scene}: {project: Project; scene: Scene}) {
  return <AbsoluteFill>
    <Audio src={staticFile(scene.audio)} volume={.98} playbackRate={project.audioRate} />
    {scene.video ? <FootageScene project={project} scene={scene} /> : <TextScene project={project} scene={scene} />}
  </AbsoluteFill>;
}

function ProjectVideo({project}: {project: Project}) {
  let cursor = 0;
  return <AbsoluteFill style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
    {project.scenes.map((scene) => {
      const from = cursor;
      cursor += scene.seconds * fps;
      return <Sequence key={scene.audio} from={from} durationInFrames={scene.seconds * fps} premountFor={fps}>
        <ScenePlayer project={project} scene={scene} />
      </Sequence>;
    })}
  </AbsoluteFill>;
}

function Root() {
  return <>
    {projects.map((project) => <Composition key={project.id} id={project.id} component={() => <ProjectVideo project={project} />} durationInFrames={totalSeconds * fps} fps={fps} width={1280} height={720} />)}
  </>;
}

registerRoot(Root);
