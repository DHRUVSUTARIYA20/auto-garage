
import { Canvas } from "@react-three/fiber";
import { useGLTF, Stage, PresentationControls, Html } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import * as THREE from "three";

interface ModelProps {
  modelPath: string;
  color?: string;
}

function Model({ modelPath, color }: ModelProps) {
  const { scene } = useGLTF(modelPath);
  const preparedScene = useMemo(() => {
    const cloned = scene.clone(true);
    if (!color || typeof color !== 'string') return cloned;

    try {
      cloned.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.color = new THREE.Color(color);
          child.material.needsUpdate = true;
        }
      });
    } catch (err) {
      console.warn('Failed to apply color to 3D model:', err);
    }

    return cloned;
  }, [scene, color]);

  return <primitive object={preparedScene} />;
}

interface ThreeDCarProps {
  modelPath?: string;
  color?: string;
  quality?: "high" | "low";
  interactive?: boolean;
}

export default function ThreeDCar({
  modelPath = "/models/ferrari.glb",
  color,
  quality = "high",
  interactive = true,
}: ThreeDCarProps) {
  const isLowQuality = quality === "low";
  const [showTimeoutFallback, setShowTimeoutFallback] = useState(false);

  useEffect(() => {
    setShowTimeoutFallback(false);
    const timeout = window.setTimeout(() => {
      setShowTimeoutFallback(true);
    }, 9000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [modelPath, quality, interactive]);

  const modelNode = <Model modelPath={modelPath} color={color} />;

  if (showTimeoutFallback) {
    return (
      <div className="w-full h-full min-h-[400px] relative flex items-center justify-center rounded-xl border border-border bg-muted/40">
        <div className="text-center px-6">
          <p className="text-sm font-medium text-foreground">3D preview is taking longer than expected</p>
          <p className="text-xs text-muted-foreground mt-1">Your page is still working. Please continue below.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] relative">
      <ErrorBoundary>
        <Canvas
          dpr={isLowQuality ? [1, 1.1] : [1, 1.5]}
          shadows={!isLowQuality}
          camera={{ fov: 45 }}
          frameloop={isLowQuality ? "demand" : "always"}
          gl={{ antialias: !isLowQuality, powerPreference: isLowQuality ? "low-power" : "high-performance" }}
          style={{ position: "absolute" }}
        >
          <Suspense fallback={
            <Html center>
              <div className="flex flex-col items-center gap-2 text-primary backdrop-blur-md bg-background/30 p-4 rounded-xl border border-primary/20">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm font-medium">Loading 3D Experience...</span>
              </div>
            </Html>
          }>
            {isLowQuality ? (
              <>
                <ambientLight intensity={0.9} />
                <directionalLight position={[5, 8, 5]} intensity={0.8} />
                {modelNode}
              </>
            ) : interactive ? (
              <PresentationControls speed={1.5} global zoom={0.5} polar={[-0.1, Math.PI / 4]}>
                <Stage environment="city" intensity={0.6} shadows={false}>
                  {modelNode}
                </Stage>
              </PresentationControls>
            ) : (
              <Stage environment="city" intensity={0.6} shadows={false}>
                {modelNode}
              </Stage>
            )}
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}

useGLTF.preload("/models/ferrari.glb");
