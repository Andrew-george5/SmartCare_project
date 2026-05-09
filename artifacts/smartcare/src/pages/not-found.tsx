import { Card, CardContent } from "@/components/ui/card";
import { Home, HeartPulse, Mail, BookOpen, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-20 left-10 w-32 h-32 border border-[#0b87c1]/10 rounded-full" />
      <div className="absolute bottom-20 right-10 w-52 h-52 bg-[#0b87c1]/5 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-20 grid grid-cols-4 gap-2 opacity-20">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#0b87c1]" />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 rounded-2xl bg-[#0b87c1]/10">
            <HeartPulse className="w-8 h-8 text-[#0b87c1]" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0b87c1]">
              SMART CARE
            </h1>
            <p className="text-sm text-gray-500">
              Intelligent. Caring. Connected.
            </p>
          </div>
        </div>

        {/* 404 */}
        <div className="text-center max-w-3xl">
          <p className="uppercase tracking-[0.4em] text-sm text-[#0b87c1] font-semibold mb-6">
            Oops! Page not found
          </p>

          <h1 className="text-[140px] md:text-[220px] leading-none font-black text-[#0b87c1] drop-shadow-sm">
            404
          </h1>

          {/* Heartbeat Line */}
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="w-24 h-px bg-[#0b87c1]/30" />

            <svg
              width="40"
              height="20"
              viewBox="0 0 40 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 10H10L14 3L19 17L24 7L28 10H39"
                stroke="#0b87c1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div className="w-24 h-px bg-[#0b87c1]/30" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Looks like this page took a wrong turn.
          </h2>

          <p className="text-lg text-gray-500 leading-relaxed max-w-xl mx-auto mb-10">
            The page you are looking for doesn&apos;t exist, may have been
            moved, or is temporarily unavailable.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              className="group flex items-center gap-2 border border-[#0b87c1]/20 hover:border-[#0b87c1]/40 hover:bg-[#0b87c1]/5 transition-all duration-300 text-[#0b87c1] px-8 py-4 rounded-2xl font-semibold"
              onClick={() => setLocation("/")}
            >
              Explore Smart Care
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-[#0b87c1]/10 flex items-center justify-center mb-5">
                <BookOpen className="w-6 h-6 text-[#0b87c1]" />
              </div>

              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Learn More
              </h3>

              <p className="text-gray-500 leading-relaxed mb-5">
                Discover resources and information about Smart Care services and
                healthcare solutions.
              </p>

              <button className="flex items-center gap-2 text-[#0b87c1] font-semibold group">
                Explore
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </CardContent>
          </Card>

          <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-[#0b87c1]/10 flex items-center justify-center mb-5">
                <HeartPulse className="w-6 h-6 text-[#0b87c1]" />
              </div>

              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Our Services
              </h3>

              <p className="text-gray-500 leading-relaxed mb-5">
                Explore healthcare management tools, appointments, and patient
                support services.
              </p>

              <button className="flex items-center gap-2 text-[#0b87c1] font-semibold group">
                View Services
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </CardContent>
          </Card>

          <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-[#0b87c1]/10 flex items-center justify-center mb-5">
                <Mail className="w-6 h-6 text-[#0b87c1]" />
              </div>

              <h3 className="text-xl font-bold mb-3 text-gray-900">
                Contact Us
              </h3>

              <p className="text-gray-500 leading-relaxed mb-5">
                Need help? Our support team is ready to assist you anytime.
              </p>

              <button className="flex items-center gap-2 text-[#0b87c1] font-semibold group">
                Contact Support
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-400">
            © 2026 Smart Care. All rights reserved.
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Building a smarter, healthier tomorrow.
          </p>
        </div>
      </div>
    </div>
  );
}
