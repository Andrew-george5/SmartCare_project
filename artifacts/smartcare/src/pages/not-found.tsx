import { Card, CardContent } from "@/components/ui/card";
import { HeartPulse, Mail, BookOpen, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";

/* ── Heartbeat SVG animated ── */
function HeartbeatLine() {
  const pathRef = useRef<SVGPathElement>(null);
  const [length, setLength] = useState(0);
  useEffect(() => {
    if (pathRef.current) setLength(pathRef.current.getTotalLength());
  }, []);
  return (
    <svg
      width="120"
      height="32"
      viewBox="0 0 120 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        ref={pathRef}
        d="M1 16H28L35 4L44 28L54 10L62 16H119"
        stroke="#0b87c1"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          length
            ? {
                strokeDasharray: length,
                strokeDashoffset: length,
                animation:
                  "drawLine 1.4s cubic-bezier(0.4,0,0.2,1) 0.6s forwards",
              }
            : undefined
        }
      />
    </svg>
  );
}

/* ── Floating dots background ── */
function FloatingDots() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#0b87c1]"
          style={{
            width: `${4 + (i % 3) * 3}px`,
            height: `${4 + (i % 3) * 3}px`,
            left: `${8 + i * 8}%`,
            top: `${10 + ((i * 37) % 75)}%`,
            opacity: 0.06 + (i % 4) * 0.03,
            animation: `floatDot ${3.5 + (i % 3)}s ease-in-out ${i * 0.4}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Reveal wrapper ── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* ── Background decorations ── */}
      <FloatingDots />
      <div
        className="absolute top-20 left-10 w-32 h-32 border border-[#0b87c1]/10 rounded-full"
        style={{ animation: "spinSlow 18s linear infinite" }}
      />
      <div
        className="absolute top-20 left-10 w-20 h-20 border border-[#0b87c1]/06 rounded-full"
        style={{
          animation: "spinSlow 12s linear reverse infinite",
          marginLeft: "24px",
          marginTop: "24px",
        }}
      />
      <div className="absolute bottom-20 right-10 w-52 h-52 bg-[#0b87c1]/5 rounded-full blur-3xl" />
      <div
        className="absolute top-1/3 right-20 grid grid-cols-4 gap-2 opacity-20"
        style={{ animation: "fadeSlideUp 1s ease 0.3s both" }}
      >
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#0b87c1]"
            style={{
              animation: `pulse ${1.5 + (i % 3) * 0.4}s ease-in-out ${i * 0.08}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Logo */}
        <div
          className="flex items-center gap-3 mb-10"
          style={{ animation: "fadeSlideDown 0.7s ease both" }}
        >
          <div
            className="p-3 rounded-2xl bg-[#0b87c1]/10"
            style={{ animation: "heartbeat 2.4s ease-in-out 1.5s infinite" }}
          >
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

        {/* 404 block */}
        <div className="text-center max-w-3xl">
          <p
            className="uppercase tracking-[0.4em] text-sm text-[#0b87c1] font-semibold mb-6"
            style={{ animation: "fadeSlideUp 0.6s ease 0.2s both" }}
          >
            Oops! Page not found
          </p>

          {/* Giant 404 with per-digit stagger */}
          <div
            className="flex items-center justify-center leading-none font-black text-[#0b87c1] drop-shadow-sm select-none"
            style={{ fontSize: "clamp(100px, 20vw, 220px)" }}
          >
            {"404".split("").map((ch, i) => (
              <span
                key={i}
                className="inline-block"
                style={{
                  animation: `bounceIn 0.7s cubic-bezier(0.34,1.56,0.64,1) ${0.3 + i * 0.12}s both`,
                }}
              >
                {ch}
              </span>
            ))}
          </div>

          {/* Animated heartbeat line */}
          <div
            className="flex items-center justify-center gap-4 mb-10"
            style={{ animation: "fadeSlideUp 0.6s ease 0.55s both" }}
          >
            <div
              className="h-px bg-[#0b87c1]/30"
              style={{
                width: "80px",
                animation: "expandWidth 0.8s ease 0.9s both",
              }}
            />
            <HeartbeatLine />
            <div
              className="h-px bg-[#0b87c1]/30"
              style={{
                width: "80px",
                animation: "expandWidth 0.8s ease 0.9s both",
              }}
            />
          </div>

          <h2
            className="text-3xl font-bold text-gray-900 mb-4"
            style={{ animation: "fadeSlideUp 0.6s ease 0.65s both" }}
          >
            Looks like this page took a wrong turn.
          </h2>

          <p
            className="text-lg text-gray-500 leading-relaxed max-w-xl mx-auto mb-10"
            style={{ animation: "fadeSlideUp 0.6s ease 0.75s both" }}
          >
            The page you are looking for doesn&apos;t exist, may have been
            moved, or is temporarily unavailable.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            style={{ animation: "fadeSlideUp 0.6s ease 0.85s both" }}
          >
            <button
              className="group flex items-center gap-2 border border-[#0b87c1]/20 hover:border-[#0b87c1]/50 hover:bg-[#0b87c1]/5 transition-all duration-300 text-[#0b87c1] px-8 py-4 rounded-2xl font-semibold hover:-translate-y-0.5 active:translate-y-0"
              onClick={() => setLocation("/")}
            >
              Explore Smart Care
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* Bottom cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {[
            {
              icon: <BookOpen className="w-6 h-6 text-[#0b87c1]" />,
              title: "Learn More",
              desc: "Discover resources and information about Smart Care services and healthcare solutions.",
              cta: "Explore",
            },
            {
              icon: <HeartPulse className="w-6 h-6 text-[#0b87c1]" />,
              title: "Our Services",
              desc: "Explore healthcare management tools, appointments, and patient support services.",
              cta: "View Services",
            },
            {
              icon: <Mail className="w-6 h-6 text-[#0b87c1]" />,
              title: "Contact Us",
              desc: "Need help? Our support team is ready to assist you anytime.",
              cta: "Contact Support",
            },
          ].map((card, i) => (
            <Reveal key={card.title} delay={i * 120}>
              <Card className="border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 rounded-3xl hover:-translate-y-1.5 group cursor-default h-full">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#0b87c1]/10 flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110">
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    {card.title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed mb-5">
                    {card.desc}
                  </p>
                  <button className="flex items-center gap-2 text-[#0b87c1] font-semibold group/btn">
                    {card.cta}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                  </button>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>

        {/* Footer */}
        <Reveal delay={200} className="mt-16 text-center">
          <p className="text-sm text-gray-400">
            © 2026 Smart Care. All rights reserved.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Building a smarter, healthier tomorrow.
          </p>
        </Reveal>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceIn {
          from { opacity: 0; transform: scale(0.4) translateY(40px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        @keyframes expandWidth {
          from { width: 0; opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          14%       { transform: scale(1.18); }
          28%       { transform: scale(1); }
          42%       { transform: scale(1.12); }
          56%       { transform: scale(1); }
        }
        @keyframes spinSlow {
          to { transform: rotate(360deg); }
        }
        @keyframes floatDot {
          from { transform: translateY(0px); }
          to   { transform: translateY(-14px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
