import { Canvas } from "@react-three/fiber";
import { useGLTF, Stage, PresentationControls, Html } from "@react-three/drei";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface CarModelProps {
    modelPath: string;
    scale?: number;
}

function CarModel({ modelPath, scale = 1 }: CarModelProps) {
    try {
        const { scene } = useGLTF(modelPath);
        return <primitive object={scene} scale={scale} />;
    } catch (error) {
        // Fallback to a simple box if model fails to load
        return (
            <mesh>
                <boxGeometry args={[2, 1, 4]} />
                <meshStandardMaterial color="#ff0000" />
            </mesh>
        );
    }
}

interface ThreeDCarBoxProps {
    modelPath?: string;
    carName: string;
    carModel: string;
    color?: string;
    scale?: number;
}

export default function ThreeDCarBox({
    modelPath = "/models/ferrari.glb",
    carName,
    carModel,
    color = "#ff0000",
    scale = 1
}: ThreeDCarBoxProps) {
    return (
        <div className="w-full h-full min-h-[300px] relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden border border-slate-700">
            <ErrorBoundary>
                <Canvas dpr={[1, 2]} shadows camera={{ fov: 45 }} style={{ position: "absolute" }}>
                    <Suspense fallback={
                        <Html center>
                            <div className="flex flex-col items-center gap-2 text-white backdrop-blur-md bg-black/30 p-4 rounded-xl border border-white/20">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-xs font-medium">Loading {carName}...</span>
                            </div>
                        </Html>
                    }>
                        <PresentationControls speed={1.5} global zoom={0.7} polar={[-0.1, Math.PI / 4]}>
                            <Stage environment="city" intensity={0.6} shadows={false}>
                                <CarModel modelPath={modelPath} scale={scale} />
                            </Stage>
                        </PresentationControls>
                    </Suspense>
                </Canvas>
            </ErrorBoundary>

            {/* Car Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <h3 className="text-white font-bold text-lg">{carName}</h3>
                <p className="text-white/70 text-sm">{carModel}</p>
            </div>
        </div>
    );
}
