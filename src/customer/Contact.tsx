import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone").optional(),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message should be at least 10 characters"),
});

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GlitchText } from "@/components/ui/glitch-text";
import { TiltCard } from "@/components/ui/tilt-card";
import { api } from "@/lib/api-client";

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit Us",
    details: ["Ohm Hostel", "Changa, Anand, Gujarat"],
  },
  {
    icon: Phone,
    title: "Call Us",
    details: ["+91 8200023557"],
  },
  {
    icon: Mail,
    title: "Email Us",
    details: ["sutariyadhruv20@gmail.com"],
  },
  {
    icon: Clock,
    title: "Working Hours",
    details: ["Mon-Sat: 8AM - 6PM", "Sunday: Closed"],
  },
];

const Contact = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  type ContactFormValues = z.infer<typeof contactSchema>;
  const { register, handleSubmit, formState: { errors, isValid, isSubmitting } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
    defaultValues: { name: '', email: '', phone: '', subject: '', message: '' }
  });

  const onSubmit = async (data: ContactFormValues) => {
    const result = await api.sendContactMessageApi(data);

    if (result.error) {
      toast({
        title: "Failed to send message",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitted(true);
    toast({
      title: "Message Sent!",
      description: "Your message has been sent successfully.",
    });
  };

  return (
    <div className="min-h-screen">
      <main className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4">

          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">Get In Touch</span>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mt-3 mb-4">
              <GlitchText text="CONTACT US" className="text-foreground" speed={40} />
            </h1>
            <p className="text-muted-foreground">
              Have questions or need assistance? We're here to help. Reach out to us
              through any of the channels below.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* Contact Info Column */}
            <div className="space-y-8">
              <TiltCard className="h-full">
                <Card className="h-full bg-gradient-to-br from-card to-card/50 border-primary/20">
                  <CardHeader>
                    <CardTitle className="className='text-2xl'">Contact Information</CardTitle>
                    <CardDescription>Find us using the details below</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {contactInfo.map((item, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <item.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg mb-1">{item.title}</h3>
                          {item.details.map((detail, i) => (
                            <p key={i} className="text-muted-foreground">{detail}</p>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Decorative Element */}
                    <div className="pt-8 mt-8 border-t border-border/50">
                      <div className="flex items-center gap-2 text-primary/80">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-sm font-mono tracking-widest uppercase">System Online • 24/7 Support</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            </div>

            {/* Contact Form Column */}
            <Card className="lg:col-span-1 border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Send Us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-garage-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-garage-success" />
                    </div>
                    <h3 className="font-display text-2xl text-foreground mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground mb-6">
                      Thank you for reaching out. We'll respond within 24 hours.
                    </p>
                    <Button onClick={() => setIsSubmitted(false)} variant="outline">
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" {...register('name')} />
                          {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone (Optional)</Label>
                          <Input id="phone" type="tel" {...register('phone')} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" {...register('email')} />
                        {errors.email && <p className="text-sm text-destructive">{errors.email.message as string}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" {...register('subject')} />
                        {errors.subject && <p className="text-sm text-destructive">{errors.subject.message as string}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          rows={6}
                          {...register('message')}
                        />
                        {errors.message && <p className="text-sm text-destructive">{errors.message.message as string}</p>}
                      </div>
                    </div>

                    <Button type="submit" size="lg" className="w-full justify-center" disabled={!isValid || isSubmitting}>
                      <span className="inline-flex items-center justify-center gap-2 w-full">
                        <Send className={`w-4 h-4 transition-opacity ${isSubmitting ? "opacity-0" : "opacity-100"}`} />
                        <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
                      </span>
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>


          <div className="mt-16">
            <Card>
              <CardContent className="p-0 overflow-hidden rounded-2xl">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215!2d-73.9878!3d40.7484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ0JzU0LjIiTiA3M8KwNTknMTYuMSJX!5e0!3m2!1sen!2sus!4v1234567890"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Auto Garage Location"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
