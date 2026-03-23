import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Car, Wrench, Shield, Zap } from "lucide-react";

const CarBrandCarousel = () => {
    const [currentCarIndex, setCurrentCarIndex] = useState(0);

    // Car brands carousel data
    const carBrands = [
        {
            name: "Ferrari",
            model: "458 Italia",
            description: "Italian luxury sports car",
            color: "#DC0000",
            gradient: "from-red-600 to-red-800",
            features: ["V12 Engine", "720 HP", "Sports Performance"],
            image: "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=600&h=400&fit=crop"
        },
        {
            name: "Audi",
            model: "R8 V10",
            description: "German engineering excellence",
            color: "#BB0A30",
            gradient: "from-gray-700 to-gray-900",
            features: ["V10 Engine", "612 HP", "Precision Engineering"],
            image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600&h=400&fit=crop"
        },
        {
            name: "Mercedes-Benz",
            model: "AMG GT",
            description: "Luxury performance vehicle",
            color: "#00ADEF",
            gradient: "from-blue-600 to-blue-800",
            features: ["Twin Turbo", "585 HP", "Luxury Interior"],
            image: "https://images.unsplash.com/photo-1606611013016-969c19d4a42f?w=600&h=400&fit=crop"
        }
    ];

    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
                        Premium Brands
                    </Badge>
                    <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                        Specialized Service for Luxury Brands
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Expert care for the world's most prestigious automotive brands
                    </p>
                </div>

                {/* Car Brands Carousel */}
                <Card className="overflow-hidden max-w-6xl mx-auto">
                    <CardContent className="p-0">
                        <div className="relative">
                            {/* Carousel Content */}
                            <div className={`bg-gradient-to-r ${carBrands[currentCarIndex].gradient} p-12 md:p-16 transition-all duration-500`}>
                                <div className="flex items-center justify-between gap-8">
                                    {/* Car Info */}
                                    <div className="text-white space-y-4 flex-1">
                                        <Badge className="bg-white/20 text-white border-white/30 mb-2">
                                            Premium Brand
                                        </Badge>
                                        <h3 className="font-display text-4xl md:text-6xl font-bold">
                                            {carBrands[currentCarIndex].name}
                                        </h3>
                                        <p className="text-xl md:text-3xl font-semibold opacity-90">
                                            {carBrands[currentCarIndex].model}
                                        </p>
                                        <p className="text-base md:text-lg opacity-75">
                                            {carBrands[currentCarIndex].description}
                                        </p>
                                        
                                        {/* Features */}
                                        <div className="space-y-2 pt-4">
                                            {carBrands[currentCarIndex].features.map((feature, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <Zap className="w-4 h-4" />
                                                    <span className="text-sm">{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <Button variant="secondary" className="gap-2" size="lg">
                                                <Wrench className="w-4 h-4" />
                                                Service This Brand
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Car Image */}
                                    <div className="hidden md:block flex-1">
                                        <img 
                                            src={carBrands[currentCarIndex].image} 
                                            alt={`${carBrands[currentCarIndex].name} ${carBrands[currentCarIndex].model}`}
                                            className="w-full h-auto rounded-lg shadow-2xl object-cover"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/40 text-white pointer-events-auto"
                                    onClick={() => setCurrentCarIndex((prev) => (prev - 1 + carBrands.length) % carBrands.length)}
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/40 text-white pointer-events-auto"
                                    onClick={() => setCurrentCarIndex((prev) => (prev + 1) % carBrands.length)}
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </Button>
                            </div>

                            {/* Dots Indicator */}
                            <div className="flex justify-center gap-3 py-6 bg-card/50">
                                {carBrands.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentCarIndex(idx)}
                                        className={`w-2 h-2 rounded-full transition-all ${idx === currentCarIndex ? "w-8 bg-primary" : "bg-border hover:bg-muted-foreground"}`}
                                        aria-label={`Go to slide ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Service Info */}
                <div className="grid md:grid-cols-3 gap-6 mt-16">
                    <div className="text-center p-6 rounded-xl bg-card/50 border border-border">
                        <Shield className="w-8 h-8 text-primary mx-auto mb-4" />
                        <h3 className="font-semibold text-foreground mb-2">Certified Service</h3>
                        <p className="text-sm text-muted-foreground">All services meet industry standards</p>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-card/50 border border-border">
                        <Wrench className="w-8 h-8 text-primary mx-auto mb-4" />
                        <h3 className="font-semibold text-foreground mb-2">Expert Technicians</h3>
                        <p className="text-sm text-muted-foreground">Specialized training for luxury brands</p>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-card/50 border border-border">
                        <Car className="w-8 h-8 text-primary mx-auto mb-4" />
                        <h3 className="font-semibold text-foreground mb-2">Premium Parts</h3>
                        <p className="text-sm text-muted-foreground">Original and certified components only</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CarBrandCarousel;
