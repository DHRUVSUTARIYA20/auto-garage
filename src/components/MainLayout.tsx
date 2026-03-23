import { Outlet } from "react-router-dom";
import { PageTransition } from "@/components/ui/page-transition";

export const MainLayout = () => {
    return (
        <div className="min-h-screen flex flex-col relative">
            {/* Main content - Medium z-index, transparent background */}
            <div className="flex-1 relative z-10">
                <PageTransition>
                    <Outlet />
                </PageTransition>
            </div>
        </div>
    );
};
