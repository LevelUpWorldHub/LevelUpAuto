import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Star, Shield, Clock, Wrench } from "lucide-react";
import { useListServices, useListTestimonials } from "@workspace/api-client-react";

export default function Home() {
  const { data: services, isLoading: servicesLoading } = useListServices();
  const { data: testimonials, isLoading: testimonialsLoading } = useListTestimonials();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* dark sleek sports car front view */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=2000"
            alt="Sleek sports car"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-background/40" />
        </div>

        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Accepting New Clients</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-black font-display tracking-tight leading-[1.1] mb-6">
              ELEVATE YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500 text-glow">
                DRIVING EXPERIENCE
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
              Precision tuning, expert maintenance, and uncompromised care. LevelUpAuto is where automotive passion meets technical perfection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/book"
                className="inline-flex justify-center items-center gap-2 px-8 py-4 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary/90 transition-all hover:-translate-y-1 box-glow"
              >
                Book Appointment <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/services"
                className="inline-flex justify-center items-center gap-2 px-8 py-4 rounded-xl bg-secondary border border-border text-white font-bold text-lg hover:bg-secondary/80 transition-all hover:-translate-y-1"
              >
                View Services
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b border-border bg-card relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border">
            <div className="text-center px-4">
              <div className="text-4xl font-black font-display text-primary mb-2">15+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Years Experience</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-black font-display text-primary mb-2">10k+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Cars Serviced</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-black font-display text-primary mb-2">5</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Master Techs</div>
            </div>
            <div className="text-center px-4">
              <div className="text-4xl font-black font-display text-primary mb-2">4.9</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-24 bg-carbon">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-black font-display mb-4">PREMIUM <span className="text-primary">SERVICES</span></h2>
              <p className="text-muted-foreground max-w-2xl text-lg">Comprehensive care for every make and model. We use state-of-the-art diagnostic tools and premium parts.</p>
            </div>
            <Link href="/services" className="text-primary font-semibold hover:text-primary/80 flex items-center gap-2 group">
              See All Services <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {servicesLoading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-card rounded-2xl animate-pulse border border-border" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {services?.slice(0, 3).map((service) => (
                <Link key={service.id} href="/services">
                  <motion.div
                    whileHover={{ y: -8 }}
                    className="bg-card border border-border rounded-2xl p-8 h-full flex flex-col relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:bg-primary/10 transition-colors" />
                    <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-6 text-primary border border-border group-hover:border-primary/50 transition-colors">
                      <Wrench className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold font-display mb-3 group-hover:text-primary transition-colors">{service.name}</h3>
                    <p className="text-muted-foreground flex-grow line-clamp-3 mb-6">{service.description}</p>
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-border">
                      <span className="font-bold text-lg">${service.price}</span>
                      <span className="text-sm text-muted-foreground">{service.durationMinutes} mins</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              {/* mechanic working on car engine close up */}
              <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-border">
                <img
                  src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=1000"
                  alt="Mechanic at work"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 bg-card border border-border p-6 rounded-2xl shadow-xl shadow-black/50 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold font-display text-xl">100% Guarantee</div>
                    <div className="text-sm text-muted-foreground">On all labor and parts</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl md:text-5xl font-black font-display mb-6">WHY ENTRUST YOUR VEHICLE TO <span className="text-primary">US?</span></h2>
              <p className="text-muted-foreground text-lg mb-10">
                We don't just fix cars; we optimize them. Our facility is equipped with dealer-level diagnostic equipment and staffed by passionate experts who treat every vehicle with uncompromising respect.
              </p>

              <div className="space-y-6">
                {[
                  { icon: Shield, title: "Certified Master Technicians", desc: "Our team undergoes continuous training to stay ahead of modern automotive tech." },
                  { icon: Star, title: "Premium OEM Parts", desc: "We refuse to compromise on quality, using only original equipment or better." },
                  { icon: Clock, title: "Efficient Turnaround", desc: "We respect your time. Transparent scheduling and prompt service delivery." }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-card border border-transparent hover:border-border transition-all">
                    <div className="w-12 h-12 shrink-0 rounded-lg bg-secondary flex items-center justify-center text-primary">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{feature.title}</h4>
                      <p className="text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10" />
        <div className="absolute right-0 top-0 w-1/2 h-full">
           <img src={`${import.meta.env.BASE_URL}images/tire-marks.png`} alt="" className="w-full h-full object-cover opacity-20 object-right" />
        </div>
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-black font-display mb-6">READY TO LEVEL UP?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Book your appointment today and experience the difference true automotive expertise makes.
          </p>
          <Link
            href="/book"
            className="inline-flex justify-center items-center px-10 py-5 rounded-full bg-primary text-white font-bold text-xl hover:bg-white hover:text-primary transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)]"
          >
            Schedule Service Now
          </Link>
        </div>
      </section>
    </div>
  );
}
