import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export const FAQ = () => {
    const faqs = [
        {
            question: "How long does a general service take?",
            answer: "A standard tune-up typically takes 3-4 hours. Premium services may take up to 6-8 hours depending on the vehicle condition. We provide live tracking so you know exactly when it's ready."
        },
        {
            question: "Do you offer a warranty on repairs?",
            answer: "Yes! We offer a 6-month/5000km warranty on all labor and parts replaced by us. Your peace of mind is our priority."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept all major credit/debit cards, UPI (GPay, PhonePe, Paytm), Net Banking, and Cash. EMI options are also available for major repairs."
        },
        {
            question: "Is pickup and drop facility available?",
            answer: "Absolutely. We offer free pickup and drop within a 10km radius. You can schedule this while booking your appointment."
        }
    ];

    return (
        <section className="py-20 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
                        <HelpCircle className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-medium">Common Questions</span>
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
                        Frequently Asked <span className="text-primary">Questions</span>
                    </h2>
                    <p className="text-muted-foreground">
                        Everything you need to know about our services and policies.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto">
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`} className="border border-border/50 bg-card/50 px-6 rounded-lg data-[state=open]:border-primary/50 data-[state=open]:ring-1 data-[state=open]:ring-primary/20 transition-all">
                                <AccordionTrigger className="text-left hover:no-underline py-4 text-lg font-medium text-foreground">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none" />
        </section>
    );
};

export default FAQ;
