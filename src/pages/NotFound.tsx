import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Crown, AlertCircle } from "lucide-react";
import logo from "/logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex flex-col">
      {/* Header */}
      <header className="relative z-50 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-2 md:px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            <div className="flex items-center space-x-3 md:space-x-4">
              {/* Logo image here, not rounded, no bg, no shadow */}
              <img
                src={logo}
                alt="Tertiary Spelling Competition Logo"
                className="h-10 md:h-12 w-auto object-contain"
                style={{ borderRadius: 0, background: "none", boxShadow: "none" }}
              />
            </div>
            <div className="flex space-x-2 md:space-x-4">
              <Link to="/" className="w-32 md:w-40">
                <button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 rounded shadow-lg text-sm md:text-base">
                  Home
                </button>
              </Link>
              <Link to="/login" className="w-32 md:w-40">
                <button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 rounded shadow-lg text-sm md:text-base">
                  Login
                </button>
              </Link>
              <Link to="/register" className="w-32 md:w-40">
                <button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 rounded shadow-lg text-sm md:text-base">
                  Register
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 404 Content */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <AlertCircle className="h-16 w-16 text-yellow-400 animate-pulse" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <p className="text-2xl text-white mb-4 font-semibold">
            Oops! Page not found
          </p>
          <p className="text-lg text-gray-300 mb-8">
            The page{" "}
            <span className="text-yellow-400">{location.pathname}</span> does not
            exist.
          </p>
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-300 text-lg"
          >
            ← Return to Home
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/60 backdrop-blur-xl border-t border-white/10 py-8 md:py-16 mt-12">
        <div className="container mx-auto px-2 md:px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div>
              <img
                src={logo}
                alt="Tertiary Spelling Competition Logo"
                className="h-10 md:h-12 w-auto object-contain mb-4"
                style={{ borderRadius: 0, background: "none", boxShadow: "none" }}
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent block mb-2">
                Tertiary Spelling Competition
              </span>
              <p className="text-gray-400 text-lg leading-relaxed">
                South Africa's premier spelling competition for tertiary students, owned by{" "}
                <a
                  href="https://yeyeyegroup.co.za/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-green-300 hover:text-green-400 transition-colors duration-200"
                  style={{
                    textShadow: "0 1px 8px rgba(34,197,94,0.15), 0 0px 1px #fff"
                  }}
                >
                  Yeyeye Group
                </a>.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white text-xl mb-6">
                Competition Info
              </h4>
              <ul className="space-y-3 text-gray-400 text-lg">
                <li>Founded: 2025</li>
                <li>Founder: Sifiso Khuzwayo</li>
                <li>Media Partners: SABC/DStv</li>
                <li>Venue: Sunbet Arena, Pretoria</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white text-xl mb-6">Quick Links</h4>
              <ul className="space-y-3 text-gray-400 text-lg">
                <li>
                  <Link
                    to="/register"
                    className="hover:text-green-400 transition-colors"
                  >
                    Register
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-green-400 transition-colors"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/rules"
                    className="hover:text-green-400 transition-colors"
                  >
                    Rules
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-green-400 transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 md:mt-12 pt-4 md:pt-8 text-center">
            <p className="text-gray-400 text-base md:text-lg">
              &copy; 2025 Yeyeye Group. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Powered by{" "}
              <a
                href="https://thandotechservices.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-green-400"
              >
                Thando Tech Services
              </a>
            </p>
          </div>
        </div>
      </footer>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .floating-element { opacity: 0; }
      `}</style>
    </div>
  );
};

export default NotFound;
