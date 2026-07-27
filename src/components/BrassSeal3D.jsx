import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function Seal() {
  const group = useRef();
  useFrame((_state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.4;
  });
  return (
    <group ref={group}>
      {/* Base disc — the "wax seal" body */}
      <mesh>
        <cylinderGeometry args={[1.5, 1.5, 0.26, 48]} />
        <meshStandardMaterial color="#A8752E" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Raised outer ring */}
      <mesh position={[0, 0, 0.15]}>
        <torusGeometry args={[1.15, 0.08, 20, 48]} />
        <meshStandardMaterial color="#8A6A3A" metalness={0.65} roughness={0.3} />
      </mesh>
      {/* Central emblem, echoes the earring silhouette from the hero diagram */}
      <mesh position={[0, 0, 0.2]}>
        <coneGeometry args={[0.4, 0.45, 3]} />
        <meshStandardMaterial color="#F3E8D2" metalness={0.35} roughness={0.5} />
      </mesh>
    </group>
  );
}

export default function BrassSeal3D({ size = 130 }) {
  return (
    <div style={{ width: size, height: size, margin: '0 auto' }} aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 4], fov: 38 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 3, 4]} intensity={1.1} />
        <directionalLight position={[-2, -1, 2]} intensity={0.3} />
        <Seal />
      </Canvas>
    </div>
  );
}
