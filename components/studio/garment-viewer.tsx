'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { DesignLayer } from '@/lib/types'
import { buildGarmentGeometry } from '@/lib/geometry'

function PuffMesh({
  layer,
  playKey,
}: {
  layer: DesignLayer
  playKey: number
}) {
  const geometry = useMemo(() => buildGarmentGeometry(layer), [layer])
  const group = useRef<THREE.Group>(null)
  const anim = useRef(0)

  // restart the inflate animation whenever playKey changes
  useEffect(() => {
    anim.current = 0
  }, [playKey])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  useFrame((_, delta) => {
    if (!group.current) return
    anim.current = Math.min(1, anim.current + delta * 1.6)
    // springy ease-out-back for a satisfying "puff"
    const t = anim.current
    const eased = easeOutBack(t)
    const flat = 0.04
    const scaleZ = flat + (1 - flat) * eased
    const scaleXY = 0.6 + 0.4 * easeOutCubic(t)
    group.current.scale.set(scaleXY, scaleXY, scaleZ)
    // gentle idle bob + slow spin once inflated
    group.current.rotation.y += delta * 0.3 * t
    group.current.position.y = Math.sin(performance.now() / 700) * 0.04 * t
  })

  return (
    <group ref={group}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          roughness={0.78}
          metalness={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

function easeOutBack(x: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}
function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3)
}

export function GarmentViewer({
  layer,
  playKey,
}: {
  layer: DesignLayer
  playKey: number
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.2, 4.4], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#fff6e0', '#cfe7d6', 0.7]} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <directionalLight position={[-3, 1, -2]} intensity={0.5} />
      <directionalLight position={[0, -3, 2]} intensity={0.25} />
      <PuffMesh layer={layer} playKey={playKey} />
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={7}
        enableDamping
      />
    </Canvas>
  )
}
