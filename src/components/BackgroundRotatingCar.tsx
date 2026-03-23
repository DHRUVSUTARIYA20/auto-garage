import { useEffect, useRef, Suspense, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float } from "@react-three/drei";
import * as THREE from "three";

interface ModelProps {
    modelPath: string;
}

function RotatingModel({ modelPath }: ModelProps) {
    const { scene } = useGLTF(modelPath);
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.y += delta * 0.1;
    });

    return (
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <primitive
                ref={meshRef}
                object={scene.clone()}
                scale={1.2}
                position={[0, -0.5, 0]}
            />
        </Float>
    );
}

const BackgroundRotatingCar = () => {
    const [shouldRender3D, setShouldRender3D] = useState(true);

    useEffect(() => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const isNarrowScreen = window.innerWidth < 1024;
        setShouldRender3D(!reducedMotion && !isNarrowScreen);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-30" />

            {shouldRender3D ? (
                <div className="absolute inset-0 opacity-20">
                    <Canvas
                        dpr={[1, 1.1]}
                        frameloop="always"
                        performance={{ min: 0.5 }}
                        camera={{ position: [0, 0, 15], fov: 40 }}
                        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
                        onCreated={({ gl }) => {
                            const canvas = gl.domElement;
                            const onLost = (event: Event) => {
                                event.preventDefault();
                                setShouldRender3D(false);
                            };
                            canvas.addEventListener("webglcontextlost", onLost, { once: true });
                        }}
                    >
                        <Suspense fallback={null}>
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1} />
                            <RotatingModel modelPath="/models/ferrari.glb" />
                        </Suspense>
                    </Canvas>
                </div>
            ) : null}
        </div>
    );
};

export default BackgroundRotatingCar;
