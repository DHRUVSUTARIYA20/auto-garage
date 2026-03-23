import { MessageCircle } from "lucide-react";

export const WhatsAppButton = () => {
    return (
        <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] rounded-full shadow-lg hover:scale-110 transition-transform duration-300 animate-in fade-in zoom-in"
            aria-label="Chat on WhatsApp"
        >
            <MessageCircle className="w-8 h-8 text-white fill-current" />
            <span className="absolute right-full mr-4 bg-white text-black text-xs font-bold px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                Chat with us
            </span>
        </a>
    );
};
