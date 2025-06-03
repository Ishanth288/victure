
import { m } from "framer-motion";

const testimonials = [
  {
    quote: "Victure has transformed how we manage our pharmacy. The efficiency gains have been remarkable.",
    author: "Dr. Sarah Johnson",
    role: "Pharmacy Owner",
    image: "/placeholder.svg"
  },
  {
    quote: "The patient management system has helped us provide better care and improve customer satisfaction.",
    author: "Michael Chen",
    role: "Lead Pharmacist",
    image: "/placeholder.svg"
  },
  {
    quote: "Implementation was smooth and the support team has been exceptional. Highly recommended!",
    author: "Emily Rodriguez",
    role: "Pharmacy Manager",
    image: "/placeholder.svg"
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mt-2">
            Trusted by Pharmacies Nationwide
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <m.div
              key={testimonial.author}
              className="glass-card rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-16 h-16 rounded-full mx-auto"
                  loading="lazy"
                />
              </div>
              <blockquote className="text-neutral-700 text-lg mb-4">
                "{testimonial.quote}"
              </blockquote>
              <div className="text-center">
                <cite className="not-italic font-semibold text-neutral-900">
                  {testimonial.author}
                </cite>
                <p className="text-neutral-600 text-sm">{testimonial.role}</p>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
