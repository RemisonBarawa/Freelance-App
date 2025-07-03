
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, ClipboardCheck, Clock, FileText, PenTool, SearchCheck, User } from "lucide-react";
import Navbar from "../components/Navbar";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800 -z-10" />
      
      <div className="container mx-auto px-4 md:px-6 py-10 md:py-20">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-12">
            <div className="space-y-6 animate-fade-in">
              <div className="inline-block">
                <span className="bg-purple-900/50 text-purple-300 py-1 px-3 rounded-full text-sm font-medium">
                  Academic Excellence
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
                Excel in Your <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                  Academic Journey
                </span>
                <br />With Experts
              </h1>
              
              <p className="text-lg text-gray-300 max-w-md">
                Connect with qualified academic professionals for expert assistance with your assignments, research papers, and projects.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth?mode=signup&role=student">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white group">
                    Get Started
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </Button>
                </Link>
                <Link to="/auth?mode=signup&role=freelancer">
                  <Button size="lg" variant="outline" className="text-white border-gray-600 hover:bg-gray-700/50">
                    Join as Expert
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2 mt-12 md:mt-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <img 
              src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1170&auto=format&fit=crop" 
              alt="Student working on academic project with research materials" 
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const ServicesSection = () => (
  <section className="py-20 bg-gray-900" id="services">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Academic Services
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Professional academic assistance tailored to your educational needs
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: <FileText className="text-purple-400" size={32} />,
            title: "Assignment Help",
            description: "Expert assistance with course reports and university assignments across all subjects",
            color: "from-purple-900/30 to-purple-800/30",
            borderColor: "border-purple-700/50"
          },
          {
            icon: <SearchCheck className="text-blue-400" size={32} />,
            title: "Research Support",
            description: "Professional guidance for research papers, literature reviews, and methodology",
            color: "from-blue-900/30 to-blue-800/30",
            borderColor: "border-blue-700/50"
          },
          {
            icon: <PenTool className="text-teal-400" size={32} />,
            title: "Thesis Writing",
            description: "Comprehensive support for thesis development, structure, and academic writing",
            color: "from-teal-900/30 to-teal-800/30",
            borderColor: "border-teal-700/50"
          },
          {
            icon: <ClipboardCheck className="text-green-400" size={32} />,
            title: "Project Planning",
            description: "Strategic planning and execution support for academic projects and case studies",
            color: "from-green-900/30 to-green-800/30",
            borderColor: "border-green-700/50"
          },
          {
            icon: <Clock className="text-yellow-400" size={32} />,
            title: "Quick Turnaround",
            description: "Fast and reliable assistance for urgent academic deadlines and requirements",
            color: "from-yellow-900/30 to-yellow-800/30",
            borderColor: "border-yellow-700/50"
          },
          {
            icon: <BookOpen className="text-red-400" size={32} />,
            title: "Quality Assurance",
            description: "Thorough review and feedback to ensure academic excellence and originality",
            color: "from-red-900/30 to-red-800/30",
            borderColor: "border-red-700/50"
          }
        ].map((service, index) => (
          <div 
            key={index} 
            className={`bg-gradient-to-b ${service.color} border ${service.borderColor} rounded-xl p-6 shadow-lg hover:translate-y-[-5px] transition-transform duration-300`}
          >
            <div className="bg-gray-800/50 p-4 rounded-full inline-block mb-4">
              {service.icon}
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">{service.title}</h3>
            <p className="text-gray-400">{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FeaturedWorkSection = () => (
  <section className="py-20 bg-gray-800" id="work">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Featured Work</h2>
        <p className="text-gray-400">Explore our portfolio of successful academic collaborations</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Research Excellence",
            image: "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?q=80&w=1170&auto=format&fit=crop",
            tag: "Research Paper",
            color: "from-purple-500/30 to-purple-900/30"
          },
          {
            title: "Literature Review",
            image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1170&auto=format&fit=crop",
            tag: "Academic Writing",
            color: "from-blue-500/30 to-blue-900/30"
          },
          {
            title: "Thesis Support",
            image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1170&auto=format&fit=crop",
            tag: "Dissertation",
            color: "from-red-500/30 to-red-900/30"
          },
          {
            title: "Data Analysis",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1170&auto=format&fit=crop",
            tag: "Statistical Analysis",
            color: "from-green-500/30 to-green-900/30"
          },
          {
            title: "Case Study",
            image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1172&auto=format&fit=crop",
            tag: "Business Analysis",
            color: "from-yellow-500/30 to-yellow-900/30"
          },
          {
            title: "Project Planning",
            image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1171&auto=format&fit=crop",
            tag: "Academic Project",
            color: "from-pink-500/30 to-pink-900/30"
          }
        ].map((work, index) => (
          <div 
            key={index} 
            className="group relative overflow-hidden rounded-xl h-[300px] transition-transform hover:scale-[1.02] duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black z-10"></div>
            <div className={`absolute inset-0 bg-gradient-to-br ${work.color} mix-blend-soft-light z-20`}></div>
            <img 
              src={work.image} 
              alt={work.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute top-4 left-4 z-30">
              <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                {work.tag}
              </span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 z-30">
              <h3 className="text-xl font-bold text-white">{work.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ContactSection = () => (
  <section className="py-20 bg-gradient-to-b from-gray-900 to-purple-900/70" id="contact">
    <div className="container mx-auto px-4 md:px-6">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Let's Create Together</h2>
        <p className="text-gray-300">Ready to transform your academic journey? Let's start a conversation.</p>
      </div>
      
      <div className="max-w-2xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-purple-500/20 shadow-lg">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-gray-300 mb-2 text-sm">Name</label>
              <input 
                type="text" 
                id="name" 
                className="w-full bg-gray-700/50 border border-gray-600 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-300 mb-2 text-sm">Email</label>
              <input 
                type="email" 
                id="email" 
                className="w-full bg-gray-700/50 border border-gray-600 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="your@example.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="message" className="block text-gray-300 mb-2 text-sm">Message</label>
            <textarea 
              id="message" 
              rows={4} 
              className="w-full bg-gray-700/50 border border-gray-600 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Tell us about your project..."
            ></textarea>
          </div>
          <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3">
            Send Message <ArrowRight size={16} className="ml-2" />
          </Button>
        </form>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-gray-900 py-10 border-t border-gray-800">
    <div className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-6 md:mb-0">
          <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            AcademicPro
          </h2>
          <p className="text-gray-500 text-sm mt-1">Excellence in academic support</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div>
            <h3 className="font-medium text-white mb-2">Quick Links</h3>
            <ul className="space-y-1">
              <li><Link to="/" className="text-sm text-gray-400 hover:text-purple-400">Home</Link></li>
              <li><Link to="/project-search" className="text-sm text-gray-400 hover:text-purple-400">Find Projects</Link></li>
              <li><Link to="/auth?mode=login" className="text-sm text-gray-400 hover:text-purple-400">Sign In</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-white mb-2">For Experts</h3>
            <ul className="space-y-1">
              <li><Link to="/auth?mode=signup&role=freelancer" className="text-sm text-gray-400 hover:text-purple-400">Join as Expert</Link></li>
              <li><Link to="/owner-dashboard" className="text-sm text-gray-400 hover:text-purple-400">Expert Dashboard</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-white mb-2">Contact</h3>
            <ul className="space-y-1">
              <li><a href="mailto:contact@academicpro.com" className="text-sm text-gray-400 hover:text-purple-400">contact@academicpro.com</a></li>
              <li><a href="tel:+254713156080" className="text-sm text-gray-400 hover:text-purple-400">+254713156080</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} AcademicPro. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

const Index = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <main>
        <HeroSection />
        <ServicesSection />
        <FeaturedWorkSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
