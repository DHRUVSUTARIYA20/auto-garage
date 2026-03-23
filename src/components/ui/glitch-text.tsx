import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
    text: string;
    className?: string;
    speed?: number;
}

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

export function GlitchText({ text, className, speed = 50 }: GlitchTextProps) {
    const [displayText, setDisplayText] = useState("");
    const iterations = useRef(0);
    const timer = useRef<NodeJS.Timeout>();

    useEffect(() => {
        const startGlitch = () => {
            clearInterval(timer.current);
            iterations.current = 0;

            timer.current = setInterval(() => {
                setDisplayText((prev) =>
                    text
                        .split("")
                        .map((char, index) => {
                            if (index < iterations.current) {
                                return text[index];
                            }
                            return characters[Math.floor(Math.random() * characters.length)];
                        })
                        .join("")
                );

                if (iterations.current >= text.length) {
                    clearInterval(timer.current);
                }

                iterations.current += 1 / 3;
            }, speed);
        };

        const initialDelay = setTimeout(startGlitch, 500); // Start after mount

        return () => {
            clearTimeout(initialDelay);
            clearInterval(timer.current);
        };
    }, [text, speed]);

    return <span className={cn("font-mono", className)}>{displayText}</span>;
}
