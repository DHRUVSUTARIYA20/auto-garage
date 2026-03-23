import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

interface ModelProps {
  modelPath: string;
}

function RotatingModel({ modelPath }: ModelProps) {
  const { scene } = useGLTF(modelPath);
  const meshRef = useRef<THREE.Group>(null);

  // Auto-rotate the model continuously on all axes
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3; // Rotate on Y-axis (horizontal spin)
      meshRef.current.rotation.x += delta * 0.1; // Slight rotation on X-axis
      meshRef.current.rotation.z += delta * 0.05; // Slight rotation on Z-axis
    }
  });

  return <primitive ref={meshRef} object={scene.clone()} scale={2.5} />;
}

const FloatingDestroyedCar = () => {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Floating 3D Car - Minimal Design */}
        <div className="max-w-6xl mx-auto">
          <div className="relative h-[600px] md:h-[700px] lg:h-[800px]">
            {/* Gravity/Floating Effect Container */}
            <div className="animate-float">
              <div className="relative h-full">
                {/* Subtle shadow underneath for gravity effect */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/20 blur-3xl rounded-full" />

                {/* 3D Car with Auto-Rotation */}
                <div className="relative h-full">
                  <Canvas
                    camera={{ position: [0, 0, 8], fov: 50 }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />
                    <Environment preset="sunset" />

                    <RotatingModel modelPath="/models/destroyed_car_1_raw_scan.glb" />

                    {/* OrbitControls for manual interaction - no restrictions */}
                    <OrbitControls
                      enableZoom={true}
                      enablePan={true}
                      enableRotate={true}
                      autoRotate={false}
                      minDistance={3}
                      maxDistance={15}
                    />
                  </Canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default FloatingDestroyedCar;
