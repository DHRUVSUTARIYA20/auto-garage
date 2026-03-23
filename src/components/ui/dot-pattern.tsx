import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DotPatternProps {
    className?: string;
    width?: number;
    height?: number;
    cx?: number;
    cy?: number;
    cr?: number;
    [key: string]: any;
}

export function DotPattern({ className, width, height, cx, cy, cr, ...props }: DotPatternProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let particles: { x: number; y: number; speedX: number; speedY: number }[] = [];
        let mouse = { x: -1000, y: -1000 };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        const initParticles = () => {
            const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 8000); // Density
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    speedX: (Math.random() - 0.5) * 0.5, // Slow drift
                    speedY: (Math.random() - 0.5) * 0.5,
                });
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const drawParticles = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "rgba(255, 255, 255, 0.5)";

            particles.forEach((particle) => {
                // Interaction Physics
                const dx = mouse.x - particle.x;
                const dy = mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 150; // Interaction radius

                // Antigravity force
                if (distance < maxDistance) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (maxDistance - distance) / maxDistance;
                    const repulsionStrength = 2;

                    particle.x -= forceDirectionX * force * repulsionStrength;
                    particle.y -= forceDirectionY * force * repulsionStrength;
                }

                ctx.beginPath();
                const radius = cr || 1.5;
                ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
                ctx.fill();

                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Wrap around screen
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;
            });

            animationFrameId = requestAnimationFrame(drawParticles);
        };

        window.addEventListener("resize", resizeCanvas);
        window.addEventListener("mousemove", handleMouseMove);
        resizeCanvas();
        drawParticles();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [cr]);

    return (
        <canvas
            ref={canvasRef}
            className={cn("fixed inset-0 pointer-events-none", className)}
            {...props}
        />
    );
}

export default DotPattern;
