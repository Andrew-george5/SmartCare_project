import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  FileText,
  ClipboardList,
  CreditCard,
  Bell,
  BarChart3,
  Shield,
  Users,
  Stethoscope,
  Heart,
  Activity,
  ChevronRight,
} from "lucide-react";

/* ── Scroll-reveal hook ── */
function useReveal() {
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
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ── Animated counter ── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1400;
    const step = (timestamp: number, startTime: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame((t) => step(t, startTime));
    };
    requestAnimationFrame((t) => step(t, t));
  }, [visible, target]);
  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ── Floating particles ── */
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const dots = Array.from({ length: 38 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.2 + 0.6,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      o: Math.random() * 0.4 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((d) => {
        d.x = (d.x + d.dx + canvas.width) % canvas.width;
        d.y = (d.y + d.dy + canvas.height) % canvas.height;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(11,135,193,${d.o})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
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
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [headerSolid, setHeaderSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setHeaderSolid(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Appointment Scheduling",
      description:
        "Easy online booking with automatic reminders. Patients can search doctors by specialty and availability.",
      image:
        "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Medical Records",
      description:
        "Secure electronic health records with full history access. Upload documents and diagnostic reports.",
      image:
        "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&q=80",
    },
    {
      icon: <ClipboardList className="w-6 h-6" />,
      title: "Digital Prescriptions",
      description:
        "Create and manage digital prescriptions with dosage, frequency, and duration. Patients can download anytime.",
      image:
        "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80",
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Billing & Payments",
      description:
        "Automated invoicing, patient bills, doctor profit tracking, and admin revenue oversight.",
      image: null,
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Smart Notifications",
      description:
        "Real-time alerts for appointments, lab results, and critical patient updates across all roles.",
      image: null,
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics Dashboard",
      description:
        "Comprehensive reporting on patient flow, revenue, and operational KPIs to drive better decisions.",
      image: null,
    },
  ];

  const roles = [
    {
      icon: <Users className="w-5 h-5" />,
      title: "For Administrators",
      description:
        "Full system control, user management, analytics, and billing oversight",
    },
    {
      icon: <Stethoscope className="w-5 h-5" />,
      title: "For Doctors",
      description:
        "Schedule management, patient records access, and prescription issuance",
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: "For Patients",
      description:
        "Easy appointment booking, medical history access, and secure payments",
    },
  ];

  const stats = [
    { value: 10, suffix: "K+", label: "Patients Served" },
    { value: 500, suffix: "+", label: "Healthcare Providers" },
    { value: 99, suffix: ".5%", label: "Uptime Guaranteed" },
    { value: 24, suffix: "/7", label: "Support Available" },
  ];

  const security = [
    { title: "HTTPS/TLS", desc: "Encrypted communications" },
    { title: "HIPAA Ready", desc: "Healthcare compliant" },
    { title: "Daily Backups", desc: "Automated data protection" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: headerSolid ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: headerSolid ? "blur(12px)" : "none",
          borderBottom: headerSolid
            ? "1px solid rgba(0,0,0,0.07)"
            : "1px solid transparent",
          boxShadow: headerSolid ? "0 1px 16px rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2"
            style={{ animation: "fadeSlideDown 0.6s ease both" }}
          >
            <div
              className="w-8 h-8 rounded-lg bg-[#0b87c1] flex items-center justify-center"
              style={{ animation: "heartbeat 2.4s ease-in-out 1.2s infinite" }}
            >
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">SmartCare</span>
          </div>
          <div
            className="flex items-center gap-3"
            style={{ animation: "fadeSlideDown 0.6s ease 0.15s both" }}
          >
            <button
              onClick={() => setLocation("/login")}
              className="text-sm text-gray-600 hover:text-[#0b87c1] transition-colors font-medium"
            >
              Login
            </button>
            <button
              onClick={() => setLocation("/signup")}
              className="text-sm bg-[#0b87c1] hover:bg-[#0969e0] text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md hover:-translate-y-px active:translate-y-0"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-gray-50 pt-24 pb-20 px-6 overflow-hidden">
        <Particles />

        {/* Soft radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(11,135,193,0.09) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 mb-8 shadow-sm"
            style={{ animation: "fadeSlideUp 0.7s ease 0.1s both" }}
          >
            <Activity
              className="w-4 h-4 text-[#0b87c1]"
              style={{ animation: "pulse 2s ease-in-out infinite" }}
            />
            Trusted by 500+ Healthcare Providers
          </div>

          <h1
            className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6"
            style={{ animation: "fadeSlideUp 0.7s ease 0.25s both" }}
          >
            Healthcare Management
            <br />
            Made{" "}
            <span
              className="text-[#0b87c1] inline-block"
              style={{ animation: "fadeSlideUp 0.7s ease 0.4s both" }}
            >
              Simple
            </span>
          </h1>

          <p
            className="text-lg text-gray-500 max-w-2xl mx-auto mb-10"
            style={{ animation: "fadeSlideUp 0.7s ease 0.5s both" }}
          >
            SmartCare is a comprehensive web-based platform designed to
            streamline healthcare operations. Manage appointments, medical
            records, prescriptions, and billing all in one place.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ animation: "fadeSlideUp 0.7s ease 0.65s both" }}
          >
            <button
              onClick={() => setLocation("/signup")}
              className="inline-flex items-center gap-2 bg-[#0b87c1] hover:bg-[#0969e0] text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 group"
            >
              Create Account
              <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => setLocation("/login")}
              className="flex items-center gap-2 border border-[#0b87c1]/20 hover:border-[#0b87c1]/50 hover:bg-[#0b87c1]/5 transition-all duration-200 text-[#0b87c1] px-6 py-3 rounded-lg font-semibold hover:-translate-y-0.5 active:translate-y-0"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white py-16 px-6 border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 100}>
              <p className="text-4xl font-extrabold text-[#0b87c1]">
                <Counter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-gray-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900">
              Everything You Need to Manage
              <br />
              Healthcare
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              A complete suite of tools built for modern hospitals and clinics,
              from day-one patient intake to long-term record keeping.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 90}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4 h-full transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-[#0b87c1]/20 group cursor-default">
                  <div className="w-11 h-11 rounded-xl bg-[#ccfbf1] flex items-center justify-center text-[#0b87c1] transition-transform duration-300 group-hover:scale-110">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {f.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {f.description}
                    </p>
                  </div>
                  {f.image && (
                    <img
                      src={f.image}
                      alt={f.title}
                      className="rounded-xl w-full h-44 object-cover mt-2 transition-transform duration-500 group-hover:scale-[1.03]"
                      style={{ overflow: "hidden" }}
                    />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section id="services" className="bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <Reveal>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
                Tailored Solutions for Every Role
              </h2>
              <p className="text-gray-500 mb-8">
                SmartCare provides dedicated dashboards and features for each
                user type, ensuring everyone has the tools they need.
              </p>
            </Reveal>
            <div className="flex flex-col gap-5">
              {roles.map((r, i) => (
                <Reveal key={r.title} delay={i * 120}>
                  <div className="flex items-start gap-4 group cursor-default">
                    <div className="w-10 h-10 rounded-xl bg-[#0b87c1] flex items-center justify-center text-white shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:bg-[#0969e0]">
                      {r.icon}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{r.title}</p>
                      <p className="text-sm text-gray-500">{r.description}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal className="flex-1" delay={100}>
            <div className="relative overflow-hidden rounded-2xl shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80"
                alt="Healthcare team"
                className="w-full h-96 object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b87c1]/20 to-transparent pointer-events-none" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Security ── */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <div
              className="w-16 h-16 rounded-full bg-[#ccfbf1] flex items-center justify-center mx-auto mb-6"
              style={{ animation: "floatY 3s ease-in-out infinite" }}
            >
              <Shield className="w-8 h-8 text-[#0b87c1]" />
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Security &amp; Compliance First
            </h2>
            <p className="text-gray-500 mb-10">
              Your data is protected with enterprise-grade security measures and
              full compliance with healthcare regulations.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {security.map((s, i) => (
              <Reveal key={s.title} delay={i * 110}>
                <div className="bg-white rounded-xl border border-gray-100 p-6 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-[#0b87c1]/20">
                  <p className="font-bold text-gray-900">{s.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Keyframes injected globally ── */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          14%       { transform: scale(1.18); }
          28%       { transform: scale(1); }
          42%       { transform: scale(1.12); }
          56%       { transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
