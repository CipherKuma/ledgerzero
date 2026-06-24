import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Composition,
  Img,
  Sequence,
  interpolate,
  registerRoot,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from 'remotion';

type Project = {
  id: string;
  name: string;
  domain: string;
  logo: string;
  accent: string;
  accent2: string;
  bg: string;
  fg: string;
  durationSeconds: number;
  hook: string;
  subhook: string;
  problemTitle: string;
  problem: string;
  demoTitle: string;
  demoCaption: string;
  proofTitle: string;
  proof: string;
  close: string;
  beats: string[];
  proofPoints: string[];
};

const fps = 30;
const footagePath = 'video/raw/demo-footage.mp4';
const narrationPath = 'audio/demo-narration.mp3';

const projects: Project[] = [
  {
    id: 'ScribeZeroDemo',
    name: 'ScribeZero',
    domain: 'scribezero.pages.dev',
    logo: 'logo.png',
    accent: '#2ddc91',
    accent2: '#fff4b8',
    bg: '#06110c',
    fg: '#f7fff9',
    durationSeconds: 47,
    hook: 'Spoken care becomes patient-owned proof.',
    subhook: 'Tamil and Hindi consults turn into structured private health records.',
    problemTitle: 'Care speaks local. Records do not.',
    problem:
      'Doctors need natural conversations. Patients need records that survive apps, hospitals, and broken portals.',
    demoTitle: 'Live flow: consult, dashboard, patients, records, verify.',
    demoCaption: 'Screen-recorded from the deployed pages.dev app.',
    proofTitle: 'The seal is the product.',
    proof:
      '0G storage gives the patient a portable ownership handle while the UI keeps private medical content out of the public proof.',
    close: 'ScribeZero is a medical memory loop: consult, note, seal, verify.',
    beats: ['Bilingual consult', 'SOAP note', 'Patient timeline'],
    proofPoints: ['0G Storage receipt', 'Private verification', 'Portable patient handle'],
  },
  {
    id: 'WorldCupDemo',
    name: '0G World Cup',
    domain: '0g-world-cup.pages.dev',
    logo: 'logo.png',
    accent: '#d7ff4f',
    accent2: '#6fffd2',
    bg: '#051108',
    fg: '#ffffff',
    durationSeconds: 41,
    hook: 'Football arguments become an AI-native game.',
    subhook: 'Draft a World Cup eleven, invite humans or agents, then inspect the result trail.',
    problemTitle: 'Every fan has a best XI. Almost none can prove the match.',
    problem:
      '0G World Cup turns the debate into a room-based draft game with inspectable artifacts behind the score.',
    demoTitle: 'Live flow: pitch, room creation, rooms, agents, board.',
    demoCaption: 'Screen-recorded from the deployed pages.dev app.',
    proofTitle: 'The proof trail is the product.',
    proof:
      'Draft commitments, match artifacts, agent identity, and result cards are exposed so judges can inspect more than a score.',
    close: '0G World Cup is playable for fans and inspectable for judges.',
    beats: ['Create room', 'Draft eleven', 'Inspect board'],
    proofPoints: ['Draft commitment', 'Agent identity', 'Result artifact'],
  },
  {
    id: 'ArcadeArenaDemo',
    name: '0G Arcade Arena',
    domain: '0g-arcade-arena.pages.dev',
    logo: 'logo.jpg',
    accent: '#46ff9f',
    accent2: '#fff0a8',
    bg: '#030607',
    fg: '#ffffff',
    durationSeconds: 44,
    hook: 'Agent games need a real arena.',
    subhook: 'Humans and AI agents play multiple games under one proof standard.',
    problemTitle: 'Agent games should not be one-off demos.',
    problem:
      'Builders need reusable rooms, game packs, submission flow, agent identity, and replay receipts.',
    demoTitle: 'Live flow: games, agents, submit, leaderboard, explorer.',
    demoCaption: 'Screen-recorded from the deployed pages.dev app.',
    proofTitle: 'Reuse is the advantage.',
    proof:
      'New games and agents can enter the same arena format, then leave receipts that remain inspectable outside the UI.',
    close: 'Arcade Arena is a lobby for ownable agents: multiplayer, extensible, verifiable.',
    beats: ['Game grid', 'Agent surfaces', 'Proof explorer'],
    proofPoints: ['Game packs', 'Replay receipts', '0G proof layer'],
  },
  {
    id: 'LedgerZeroDemo',
    name: 'Ledger Zero',
    domain: 'ledgerzero.pages.dev',
    logo: 'logo.jpg',
    accent: '#d9b56f',
    accent2: '#7dd7ff',
    bg: '#06080b',
    fg: '#f6f0e8',
    durationSeconds: 45,
    hook: 'AI workers should be assets, not rented sessions.',
    subhook: 'A 0G marketplace for worker memory, capability, ownership, and payout history.',
    problemTitle: 'Teams pay agents but cannot own the worker that learns.',
    problem:
      'Memory, capability, and future revenue usually stay trapped inside one platform instead of becoming transferable labor.',
    demoTitle: 'Live flow: marketplace, workers, register, jobs, proof.',
    demoCaption: 'Screen-recorded from the deployed pages.dev app.',
    proofTitle: 'Proof makes it a market.',
    proof:
      '0G storage keeps worker artifacts portable while ownership and payout state make the worker tradable.',
    close: 'Ledger Zero is the marketplace layer for AI labor that can be owned, hired, and sold.',
    beats: ['Worker marketplace', 'Register manifest', 'Proof center'],
    proofPoints: ['Portable artifacts', 'Ownership state', 'Payout history'],
  },
];

function fade(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

function useEntrance(offset = 0) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const value = spring({
    frame: frame - offset,
    fps,
    config: {damping: 18, stiffness: 70, mass: 0.85},
  });
  return {
    opacity: interpolate(value, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(value, [0, 1], [34, 0])}px)`,
  };
}

function Background({project}: {project: Project}) {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [0, project.durationSeconds * fps], [-20, 120]);

  return (
    <AbsoluteFill style={{background: project.bg, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(120deg, ${project.bg} 0%, #050505 58%, ${project.accent}20 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: `${sweep}%`,
          top: -80,
          width: 260,
          height: 900,
          transform: 'skewX(-13deg)',
          background: `${project.accent}20`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.22,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)',
          backgroundSize: '58px 58px',
        }}
      />
    </AbsoluteFill>
  );
}

function Header({project}: {project: Project}) {
  return (
    <div style={{position: 'absolute', top: 34, left: 50, right: 50, display: 'flex', alignItems: 'center'}}>
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: 14,
          overflow: 'hidden',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Img src={staticFile(project.logo)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      <div style={{marginLeft: 18}}>
        <div style={{fontSize: 24, color: project.fg, fontWeight: 900}}>{project.name}</div>
        <div style={{fontSize: 13, color: project.accent, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 3}}>
          Zero Cup judge demo
        </div>
      </div>
      <div style={{marginLeft: 'auto', fontSize: 17, color: project.fg, opacity: 0.7}}>{project.domain}</div>
    </div>
  );
}

function Pill({children, project, inverted = false}: {children: React.ReactNode; project: Project; inverted?: boolean}) {
  return (
    <div
      style={{
        minHeight: 78,
        borderRadius: 10,
        padding: '16px 18px',
        border: `1px solid ${project.accent}66`,
        color: inverted ? '#050505' : project.fg,
        background: inverted ? project.accent : '#ffffff12',
        display: 'flex',
        alignItems: 'center',
        fontSize: 24,
        lineHeight: 1.08,
        fontWeight: 900,
      }}
    >
      {children}
    </div>
  );
}

function Intro({project}: {project: Project}) {
  const enter = useEntrance();

  return (
    <AbsoluteFill>
      <Background project={project} />
      <Header project={project} />
      <div style={{position: 'absolute', left: 70, right: 70, top: 160, ...enter}}>
        <div style={{fontSize: 82, lineHeight: 0.93, color: project.fg, fontWeight: 950, maxWidth: 960}}>{project.hook}</div>
        <div style={{marginTop: 26, fontSize: 28, lineHeight: 1.28, color: `${project.fg}c7`, maxWidth: 780}}>
          {project.subhook}
        </div>
      </div>
      <div style={{position: 'absolute', left: 70, right: 70, bottom: 58, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16}}>
        {project.beats.map((beat, index) => (
          <Pill key={beat} project={project} inverted={index === 0}>
            {beat}
          </Pill>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function Problem({project}: {project: Project}) {
  const enter = useEntrance();

  return (
    <AbsoluteFill>
      <Background project={project} />
      <Header project={project} />
      <div style={{position: 'absolute', left: 72, top: 150, width: 790, ...enter}}>
        <div style={{fontSize: 18, color: project.accent, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 4}}>Problem</div>
        <div style={{marginTop: 20, fontSize: 62, lineHeight: 0.98, color: project.fg, fontWeight: 950}}>
          {project.problemTitle}
        </div>
        <div style={{marginTop: 28, fontSize: 29, lineHeight: 1.28, color: `${project.fg}c5`}}>{project.problem}</div>
      </div>
      <div style={{position: 'absolute', right: 70, top: 178, width: 260, height: 320}}>
        <div style={{position: 'absolute', inset: 0, border: `1px solid ${project.accent}55`, borderRadius: 12, background: '#ffffff0f'}} />
        <div style={{position: 'absolute', left: 28, right: 28, top: 34, fontSize: 24, lineHeight: 1.1, color: project.fg, fontWeight: 900}}>
          Judge lens
        </div>
        {['Need', 'Product', 'Proof'].map((item, index) => (
          <div
            key={item}
            style={{
              position: 'absolute',
              left: 28,
              right: 28,
              top: 92 + index * 64,
              borderTop: `1px solid ${project.accent}33`,
              paddingTop: 14,
              color: index === 2 ? project.accent : project.fg,
              fontSize: 22,
              fontWeight: 850,
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function Demo({project}: {project: Project}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const videoOpacity = fade(frame, 8, 22);
  const labelOpacity = fade(frame, fps * 2, fps * 3);

  return (
    <AbsoluteFill>
      <Background project={project} />
      <Header project={project} />
      <div style={{position: 'absolute', left: 54, right: 54, top: 100, bottom: 76}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 438,
            borderRadius: 18,
            background: '#050505',
            border: `2px solid ${project.accent}80`,
            boxShadow: `0 0 70px ${project.accent}24`,
            overflow: 'hidden',
            opacity: videoOpacity,
          }}
        >
          <Video src={staticFile(footagePath)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          <div
            style={{
              position: 'absolute',
              left: 22,
              top: 22,
              padding: '11px 14px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.72)',
              color: project.accent,
              fontSize: 16,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontWeight: 950,
            }}
          >
            Live deployed app footage
          </div>
          <div
            style={{
              position: 'absolute',
              left: 22,
              right: 22,
              bottom: 18,
              padding: '13px 16px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.74)',
              color: project.fg,
              fontSize: 22,
              lineHeight: 1.1,
              fontWeight: 900,
            }}
          >
            {project.demoTitle}
            <span style={{marginLeft: 12, color: `${project.fg}b8`, fontSize: 17, fontWeight: 750}}>
              {project.demoCaption}
            </span>
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, opacity: labelOpacity}}>
          {project.beats.map((beat, index) => (
            <Pill key={beat} project={project} inverted={index === 1}>
              {beat}
            </Pill>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Proof({project}: {project: Project}) {
  const enter = useEntrance();

  return (
    <AbsoluteFill>
      <Background project={project} />
      <Header project={project} />
      <div style={{position: 'absolute', left: 72, top: 132, width: 720, ...enter}}>
        <div style={{fontSize: 18, color: project.accent, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 4}}>Why 0G</div>
        <div style={{marginTop: 18, fontSize: 68, lineHeight: 0.96, color: project.fg, fontWeight: 950}}>{project.proofTitle}</div>
        <div style={{marginTop: 26, fontSize: 28, lineHeight: 1.28, color: `${project.fg}c4`}}>{project.proof}</div>
      </div>
      <div style={{position: 'absolute', right: 70, top: 160, width: 360, display: 'grid', gap: 16}}>
        {project.proofPoints.map((point, index) => (
          <Pill key={point} project={project} inverted={index === 0}>
            {point}
          </Pill>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function Close({project}: {project: Project}) {
  const enter = useEntrance();

  return (
    <AbsoluteFill>
      <Background project={project} />
      <Header project={project} />
      <div style={{position: 'absolute', left: 74, right: 74, top: 182, textAlign: 'center', ...enter}}>
        <div style={{fontSize: 70, lineHeight: 0.98, color: project.fg, fontWeight: 950}}>{project.close}</div>
        <div
          style={{
            display: 'inline-flex',
            marginTop: 34,
            minHeight: 76,
            alignItems: 'center',
            padding: '0 30px',
            borderRadius: 10,
            background: project.accent,
            color: '#050505',
            fontSize: 26,
            fontWeight: 950,
          }}
        >
          {project.domain}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function DemoVideo({project}: {project: Project}) {
  const intro = 6 * fps;
  const problem = 8 * fps;
  const proof = 7 * fps;
  const close = 5 * fps;
  const total = project.durationSeconds * fps;
  const demo = total - intro - problem - proof - close;

  return (
    <AbsoluteFill style={{fontFamily: 'Arial, Helvetica, sans-serif'}}>
      <Audio src={staticFile(narrationPath)} volume={0.98} />
      <Sequence from={0} durationInFrames={intro}>
        <Intro project={project} />
      </Sequence>
      <Sequence from={intro} durationInFrames={problem}>
        <Problem project={project} />
      </Sequence>
      <Sequence from={intro + problem} durationInFrames={demo}>
        <Demo project={project} />
      </Sequence>
      <Sequence from={intro + problem + demo} durationInFrames={proof}>
        <Proof project={project} />
      </Sequence>
      <Sequence from={intro + problem + demo + proof} durationInFrames={close}>
        <Close project={project} />
      </Sequence>
    </AbsoluteFill>
  );
}

function Root() {
  return (
    <>
      {projects.map((project) => (
        <Composition
          key={project.id}
          id={project.id}
          component={() => <DemoVideo project={project} />}
          durationInFrames={project.durationSeconds * fps}
          fps={fps}
          width={1280}
          height={720}
        />
      ))}
    </>
  );
}

registerRoot(Root);
