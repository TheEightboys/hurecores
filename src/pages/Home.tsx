import React from 'react';
import Navbar from '../components/home/Navbar';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';
import Pricing from '../components/home/Pricing';
import FAQ from '../components/home/FAQ';
import Footer from '../components/home/Footer';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-inter">
      <Navbar />
      <Hero />
      <Features />
      {/* Short Testimonial / Social Proof Section */}
      <section id="solutions" className="bg-slate-900 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-white font-bold text-2xl mb-12 opacity-60">TRUSTED BY INNOVATIVE CLINICS ACROSS THE REGION</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-900 to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-900 to-transparent z-10"></div>
            <div className="flex justify-center space-x-12 opacity-40 grayscale">
              {/* Mock logos */}
              <div className="text-2xl text-white font-display font-bold">MEDICARE+</div>
              <div className="text-2xl text-white font-display font-bold">Clinix</div>
              <div className="text-2xl text-white font-display font-bold">HealthFirst</div>
              <div className="text-2xl text-white font-display font-bold">DOC.AI</div>
              <div className="text-2xl text-white font-display font-bold">PharmaLink</div>
            </div>
          </div>

          <div className="mt-20 max-w-4xl mx-auto bg-white/10 backdrop-blur-sm border border-white/10 p-10 rounded-3xl">
            <div className="text-2xl md:text-3xl font-medium text-white mb-6 leading-relaxed">"HURE Core has completely transformed how we manage our shifts. We've cut scheduling time by 80% and our staff love the transparency."</div>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full"></div>
              <div className="text-left">
                <div className="text-white font-bold">Dr. Sarah Johnson</div>
                <div className="text-blue-200 text-sm">Medical Director, Nairobi West Clinic</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Pricing />
      <FAQ />

      {/* Safe CTA Section */}
      <section className="py-24 bg-blue-600 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-900 opacity-20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-display">Ready to modernize your clinic?</h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">Join thousands of healthcare professionals who trust HURE Core for their staff management. Start your 14-day free trial today.</p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 text-xl font-bold rounded-2xl shadow-xl hover:bg-blue-50 transition-all transform hover:-translate-y-1">Get Started Now</button>
            <button className="w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-white/30 text-white text-xl font-bold rounded-2xl hover:bg-white/10 transition-all">Contact Sales</button>
          </div>
          <p className="mt-6 text-sm text-blue-200 opacity-80">No credit card required for trial. Cancel anytime.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
