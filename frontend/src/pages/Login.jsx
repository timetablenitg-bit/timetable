import { useEffect, useState } from "react";
import GoogleLoginButton from "../components/Auth/GoogleLoginButton";
import { Lock, Mail } from "lucide-react";
import CustomLoader from "../ui/CustomLoader";

const Login = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Mouse Movement Logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLoadingStart = () => {
    setIsLoading(true);
  };

  const handleLoadingEnd = () => {
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500 p-4">
      {/* 1. Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-300 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-300 dark:bg-blue-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      {/* 2. Interactive Cursor Glow */}
      <div
        className="hidden lg:block fixed pointer-events-none w-100 h-100 rounded-full transition-transform duration-300 ease-out opacity-20 dark:opacity-10"
        style={{
          background: `radial-gradient(circle, #6366f1 0%, transparent 70%)`,
          transform: `translate(${mousePosition.x - 200}px, ${mousePosition.y - 200}px)`,
        }}
      />

      <div className="relative z-10 w-full max-w-95">
        {isLoading ? (
          /* Loader State */
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8 border border-white dark:border-slate-800 flex flex-col items-center justify-center min-h-87.5 animate-in fade-in zoom-in duration-300">
            <CustomLoader variant="indigo" />
          </div>
        ) : (
          /* Main Login Card */
          <>
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8 border border-white dark:border-slate-800">
              {/* Header/Logo Section */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 mb-4 drop-shadow-md">
                  <img
                    src="/images/logo_nitgoa.png"
                    alt="NIT Goa Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight text-center uppercase">
                  NIT Goa
                </h1>
                <div className="h-1 w-8 bg-indigo-600 rounded-full mt-1"></div>
              </div>

              <div className="space-y-5">
                {/* Google Button */}
                <GoogleLoginButton
                  onLoadingStart={handleLoadingStart}
                  onLoadingEnd={handleLoadingEnd}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 dark:hover:bg-indigo-500 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 cursor-pointer"
                />

                {/* Info Box */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-tight text-slate-600 dark:text-slate-400">
                      Authentication restricted to{" "}
                      <span className="font-bold text-slate-900 dark:text-slate-100 italic">
                        @nitgoa.ac.in
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 opacity-50">
                <Lock className="w-3 h-3 text-slate-400" />
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.15em]">
                  Institutional Access
                </span>
              </div>
            </div>

            {/* Copyright */}
            <p className="text-center mt-6 text-[10px] text-slate-400 dark:text-slate-600 font-medium tracking-wide">
              &copy; {new Date().getFullYear()} National Institute of Technology
              Goa
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
