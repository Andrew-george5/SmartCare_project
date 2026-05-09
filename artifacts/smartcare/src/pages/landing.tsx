import { useLocation } from "wouter";
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

export default function LandingPage() {
  const [, setLocation] = useLocation();

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
    { value: "10K+", label: "Patients Served" },
    { value: "500+", label: "Healthcare Providers" },
    { value: "99.5%", label: "Uptime Guaranteed" },
    { value: "24/7", label: "Support Available" },
  ];

  const security = [
    { title: "HTTPS/TLS", desc: "Encrypted communications" },
    { title: "HIPAA Ready", desc: "Healthcare compliant" },
    { title: "Daily Backups", desc: "Automated data protection" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0b87c1] flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">SmartCare</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/login")}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Login
            </button>
            <button
              onClick={() => setLocation("/signup")}
              className="text-sm bg-[#0b87c1] hover:bg-[#0969e0] text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <section className="bg-gray-50 pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600 mb-8 shadow-sm">
            <Activity className="w-4 h-4 text-[#0b87c1]" />
            Trusted by 500+ Healthcare Providers
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Healthcare Management
            <br />
            Made <span className="text-[#0b87c1]">Simple</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
            SmartCare is a comprehensive web-based platform designed to
            streamline healthcare operations. Manage appointments, medical
            records, prescriptions, and billing all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setLocation("/signup")}
              className="inline-flex items-center gap-2 bg-[#0b87c1] hover:bg-[#0969e0] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Create Account <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLocation("/login")}
              className="group flex items-center gap-2 border border-[#0b87c1]/20 hover:border-[#0b87c1]/40 hover:bg-[#0b87c1]/5 transition-all duration-300 text-[#0b87c1] px-8 py-4 rounded-2xl font-semibold"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 px-6 border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold text-[#0b87c1]">
                {s.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-gray-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900">
              Everything You Need to Manage
              <br />
              Healthcare
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              A complete suite of tools built for modern hospitals and clinics,
              from day-one patient intake to long-term record keeping.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-[#ccfbf1] flex items-center justify-center text-[#0b87c1]">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{f.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{f.description}</p>
                </div>
                {f.image && (
                  <img
                    src={f.image}
                    alt={f.title}
                    className="rounded-xl w-full h-44 object-cover mt-2"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Tailored Solutions for Every Role
            </h2>
            <p className="text-gray-500 mb-8">
              SmartCare provides dedicated dashboards and features for each user
              type, ensuring everyone has the tools they need.
            </p>
            <div className="flex flex-col gap-5">
              {roles.map((r) => (
                <div key={r.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0b87c1] flex items-center justify-center text-white shrink-0">
                    {r.icon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{r.title}</p>
                    <p className="text-sm text-gray-500">{r.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80"
              alt="Healthcare team"
              className="rounded-2xl w-full h-96 object-cover shadow-lg"
            />
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[#ccfbf1] flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-[#0b87c1]" />
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Security &amp; Compliance First
          </h2>
          <p className="text-gray-500 mb-10">
            Your data is protected with enterprise-grade security measures and
            full compliance with healthcare regulations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {security.map((s) => (
              <div
                key={s.title}
                className="bg-white rounded-xl border border-gray-100 p-6 text-center shadow-sm"
              >
                <p className="font-bold text-gray-900">{s.title}</p>
                <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
