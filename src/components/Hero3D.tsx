"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const W = 2;
const H = 2.8;
const COVER_T = 0.06;

/**
 * The canvas sits BEHIND the hero text, so it can't receive mouse events itself.
 * Track the mouse on the whole window instead (-1..1 on both axes).
 */
const mouse = { x: 0, y: 0 };

const PANELS = ["/showcase/p13.webp", "/showcase/p16.webp", "/showcase/p2.webp", "/showcase/p9.webp", "/showcase/p5.webp", "/showcase/p14.webp"];

/** The front cover, painted on a canvas: title, the Chog NFT, volume number. */
function useCoverTexture(img: HTMLImageElement) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1434;
    const g = c.getContext("2d")!;
    const bg = g.createLinearGradient(0, 0, 1024, 1434);
    bg.addColorStop(0, "#2e1065");
    bg.addColorStop(0.55, "#6d28d9");
    bg.addColorStop(1, "#db2777");
    g.fillStyle = bg;
    g.fillRect(0, 0, 1024, 1434);
    // speed lines
    g.strokeStyle = "rgba(255,255,255,0.07)";
    g.lineWidth = 6;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      g.beginPath();
      g.moveTo(512, 760);
      g.lineTo(512 + Math.cos(a) * 1400, 760 + Math.sin(a) * 1400);
      g.stroke();
    }
    // the Chog
    g.save();
    g.shadowColor = "rgba(240,171,252,0.8)";
    g.shadowBlur = 60;
    g.beginPath();
    g.roundRect(112, 330, 800, 800, 48);
    g.fillStyle = "#000";
    g.fill();
    g.restore();
    g.save();
    g.beginPath();
    g.roundRect(112, 330, 800, 800, 48);
    g.clip();
    g.drawImage(img, 112, 330, 800, 800);
    g.restore();
    g.lineWidth = 12;
    g.strokeStyle = "#fff";
    g.beginPath();
    g.roundRect(112, 330, 800, 800, 48);
    g.stroke();
    // title
    const t = g.createLinearGradient(100, 0, 924, 0);
    t.addColorStop(0, "#ede9fe");
    t.addColorStop(0.5, "#f5d0fe");
    t.addColorStop(1, "#fde68a");
    g.fillStyle = t;
    g.textAlign = "center";
    g.font = "900 150px Impact, 'Arial Black', sans-serif";
    g.lineWidth = 14;
    g.strokeStyle = "#0b0910";
    g.strokeText("CHOGTALES", 512, 210);
    g.fillText("CHOGTALES", 512, 210);
    g.font = "700 46px 'Arial Black', sans-serif";
    g.fillStyle = "rgba(255,255,255,0.85)";
    g.fillText("THE DAILY MANGA", 512, 280);
    g.font = "900 64px Impact, sans-serif";
    g.fillStyle = "#fde68a";
    g.fillText("VOL. 1  ·  チョグ物語", 512, 1290);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, [img]);
}

function Book() {
  const [chog, inside, page, ...leafArt] = useLoader(THREE.TextureLoader, [
    "/hero/chog-2.webp",
    "/showcase/p0.webp",
    "/showcase/p11.webp",
    "/showcase/p6.webp",
    "/showcase/p10.webp",
    "/showcase/p3.webp",
    "/showcase/p8.webp",
    "/showcase/p12.webp",
  ]);
  [inside, page, ...leafArt].forEach((t) => (t.colorSpace = THREE.SRGBColorSpace));
  const cover = useCoverTexture(chog.image as HTMLImageElement);
  const group = useRef<THREE.Group>(null);
  const front = useRef<THREE.Group>(null);
  const leaves = useRef<(THREE.Group | null)[]>([]);

  const coverMats = useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({ color: "#4c1d95", roughness: 0.6 });
    return [edge, edge, edge, edge, new THREE.MeshStandardMaterial({ map: cover, roughness: 0.45 }), new THREE.MeshStandardMaterial({ map: inside, roughness: 0.8 })];
  }, [cover, inside]);
  const backMats = useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({ color: "#4c1d95", roughness: 0.6 });
    return [edge, edge, edge, edge, new THREE.MeshStandardMaterial({ map: page, roughness: 0.8 }), edge];
  }, [page]);
  const paper = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f6f1e7", roughness: 0.9 }), []);
  // the page block's top face is a drawn page, so the open book shows manga on the right too
  const blockMats = useMemo(() => [paper, paper, paper, paper, new THREE.MeshStandardMaterial({ map: page, roughness: 0.85 }), paper], [paper, page]);
  // each loose leaf: plain paper on the front, a drawn panel on the back (the side you see once it flips open)
  const leafMats = useMemo(() => leafArt.map((t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 })), [leafArt]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = group.current!;
    // follow the mouse a little, float, and breathe the book open and closed
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, -0.45 + mouse.x * 0.45, 0.05);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0.12 - mouse.y * 0.25, 0.05);
    g.position.y = Math.sin(t * 0.9) * 0.12;
    const open = THREE.MathUtils.smoothstep(Math.sin(t * 0.55) * 0.5 + 0.5, 0.15, 0.85);
    front.current!.rotation.y = -open * 2.5;
    leaves.current.forEach((l, i) => l && (l.rotation.y = -open * (2.4 - i * 0.2)));
  });

  return (
    <group ref={group}>
      {/* back cover with a page on its inside */}
      <mesh position={[0, 0, -0.14]} material={backMats}>
        <boxGeometry args={[W, H, COVER_T]} />
      </mesh>
      {/* page block */}
      <mesh position={[0.02, 0, -0.07]} material={blockMats}>
        <boxGeometry args={[W * 0.96, H * 0.96, 0.1]} />
      </mesh>
      {/* loose leaves that fan open with the cover */}
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} ref={(el) => void (leaves.current[i] = el)} position={[-W / 2, 0, -0.012 + i * 0.008]}>
          <mesh position={[W * 0.48, 0, 0.001]} material={paper}>
            <planeGeometry args={[W * 0.95, H * 0.95]} />
          </mesh>
          <mesh position={[W * 0.48, 0, -0.001]} rotation={[0, Math.PI, 0]} material={leafMats[i]}>
            <planeGeometry args={[W * 0.95, H * 0.95]} />
          </mesh>
        </group>
      ))}
      {/* front cover, hinged at the spine */}
      <group ref={front} position={[-W / 2, 0, 0.04]}>
        <mesh position={[W / 2, 0, 0]} material={coverMats}>
          <boxGeometry args={[W, H, COVER_T]} />
        </mesh>
      </group>
    </group>
  );
}

/** Real ChogTales panels circling the book. */
function OrbitingPanels() {
  const textures = useLoader(THREE.TextureLoader, PANELS);
  textures.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace));
  const ring = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    ring.current!.rotation.y += dt * 0.12;
    ring.current!.children.forEach((c, i) => {
      c.lookAt(state.camera.position);
      c.position.y = Math.sin(state.clock.elapsedTime * 0.8 + i) * 0.3 + (i % 2 ? 1 : -1);
    });
  });
  return (
    <group ref={ring}>
      {textures.map((tex, i) => {
        const a = (i / textures.length) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 2.55, 0, Math.sin(a) * 2.55]} scale={0.8}>
            <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[1.5, 1.05]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh>
              <planeGeometry args={[1.4, 0.95]} />
              <meshBasicMaterial map={tex} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Ink() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const n = 900;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const palette = [new THREE.Color("#a78bfa"), new THREE.Color("#f0abfc"), new THREE.Color("#fcd34d"), new THREE.Color("#7dd3fc")];
    for (let i = 0; i < n; i++) {
      const r = 3 + Math.random() * 5;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.7, r * Math.sin(ph) * Math.sin(th)], i * 3);
      const c = palette[i % palette.length];
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    ref.current!.rotation.y -= dt * 0.03;
    ref.current!.rotation.x += dt * 0.008;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.035} vertexColors transparent opacity={0.85} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/** Put the book on the right half on wide screens, behind and below the text on phones. */
function Stage({ children }: { children: React.ReactNode }) {
  const { viewport } = useThree();
  const wide = viewport.aspect > 1.1;
  // keep the open book (about 4.4 units across with its orbit) inside the right half
  const scale = wide ? Math.min(1, (viewport.width * 0.42) / 4.4) : 0.82;
  const homeX = wide ? viewport.width * 0.27 : 0;
  const ref = useRef<THREE.Group>(null);
  const placed = useRef(false);
  useFrame(() => {
    const g = ref.current!;
    if (!placed.current) {
      // start in place, so the book never sweeps across the headline on load
      g.position.set(homeX, 0, 0);
      placed.current = true;
    }
    // a little parallax for the whole scene
    g.position.x = THREE.MathUtils.lerp(g.position.x, homeX + mouse.x * 0.25, 0.05);
    g.position.y = THREE.MathUtils.lerp(g.position.y, -mouse.y * 0.15, 0.05);
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, scale, 0.1));
  });
  return (
    <group ref={ref} position={[homeX, 0, 0]} scale={scale}>
      {children}
    </group>
  );
}

export default function Hero3D() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <Canvas camera={{ position: [0, 0.3, 8], fov: 38 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }} style={{ background: "transparent", pointerEvents: "none" }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 6]} intensity={1.6} />
      <pointLight position={[-4, 2, 3]} intensity={30} color="#a855f7" />
      <pointLight position={[4, -2, 3]} intensity={12} color="#ec4899" />
      <Stage>
        <Suspense fallback={null}>
          <Book />
          <OrbitingPanels />
        </Suspense>
      </Stage>
      <Ink />
    </Canvas>
  );
}
