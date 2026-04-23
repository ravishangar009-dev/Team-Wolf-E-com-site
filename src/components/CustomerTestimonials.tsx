import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Alex M.",
    role: "Powerlifter",
    content: "The creatine monohydrate is top notch. Mixes perfectly and I've seen noticeable strength gains in just 3 weeks.",
    rating: 5,
  },
  {
    name: "Sarah T.",
    role: "CrossFit Athlete",
    content: "Fastest delivery I've ever experienced for supplements. The pre-workout formula is absolutely insane—no crash, just pure energy.",
    rating: 5,
  },
  {
    name: "David K.",
    role: "Personal Trainer",
    content: "I recommend Team Wolf to all my clients. Authentic products, great pricing, and their customer service is unmatched.",
    rating: 5,
  }
];

const CustomerTestimonials = () => {
  return (
    <section className="container mx-auto px-4 py-16 bg-secondary/30 rounded-3xl my-12 border border-border/50">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-outfit font-bold mb-4">
          What the Pack Says
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Don't just take our word for it. Here is what our athletes have to say.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, i) => (
          <Card key={i} className="bg-card border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            <CardContent className="p-8 relative">
              <Quote className="absolute top-6 right-6 w-12 h-12 text-primary/10 group-hover:text-primary/20 transition-colors" />
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, j) => (
                  <Star key={j} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground/90 mb-6 italic relative z-10 leading-relaxed font-medium">"{testimonial.content}"</p>
              <div>
                <h4 className="font-bold font-outfit text-lg">{testimonial.name}</h4>
                <p className="text-sm text-primary font-medium">{testimonial.role}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default CustomerTestimonials;
