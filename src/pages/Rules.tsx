import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Scroll, BookOpen, CheckCircle, AlertCircle } from "lucide-react";
import logo from "/logo.png";

const Rules = () => {
  const [authUser, setAuthUser] = useState<any>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().firstName) {
            setUserFirstName(userDoc.data().firstName);
          } else if (user.displayName) {
            setUserFirstName(user.displayName.split(" ")[0]);
          } else {
            setUserFirstName(null);
          }
        } catch {
          setUserFirstName(null);
        }
      } else {
        setUserFirstName(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-2 md:px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            <div className="flex items-center space-x-3 md:space-x-4">
              <img
                src={logo}
                alt="Tertiary Spelling Competition Logo"
                className="h-10 md:h-12 w-auto object-contain"
                style={{ borderRadius: 0, background: "none", boxShadow: "none" }}
              />
            </div>
            <div className="flex space-x-2 md:space-x-4">
              {authUser ? (
                <>
                  <span className="w-32 md:w-40 inline-flex items-center justify-center bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 rounded shadow-lg text-sm md:text-base mr-2">
                    {userFirstName ? `Hi, ${userFirstName}` : "Hi"}
                  </span>
                  <Link to="/dashboard" className="w-32 md:w-40">
                    <Button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base">
                      <span className="font-semibold">Dashboard</span>
                    </Button>
                  </Link>
                  <Button
                    className="w-32 md:w-40 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
                    onClick={() => {
                      const auth = getAuth();
                      signOut(auth);
                    }}
                  >
                    <span className="font-semibold">Logout</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="w-32 md:w-40">
                    <Button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base">
                      <span className="font-semibold">Login</span>
                    </Button>
                  </Link>
                  <Link to="/register" className="w-32 md:w-40">
                    <Button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base">
                      <span className="font-semibold">Register Now</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <BookOpen className="inline-block mr-4 mb-1" />
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Competition Rules
              </span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl">
              Official guidelines and regulations for the Tertiary Spelling Competition
            </p>
          </div>

          <Card className="bg-black/40 backdrop-blur-xl border-white/10 mb-8">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Scroll className="mr-3 text-green-400" />
                General Rules
              </h2>
              <div className="space-y-4 text-gray-300">
                <p className="flex items-start">
                  <CheckCircle className="mr-3 mt-1 text-green-400 flex-shrink-0" />
                  <span>Only registered students from recognized South African universities and TVET colleges are eligible to participate.</span>
                </p>
                <p className="flex items-start">
                  <CheckCircle className="mr-3 mt-1 text-green-400 flex-shrink-0" />
                  <span>Participants must be enrolled in the current academic year with valid student credentials.</span>
                </p>
                <p className="flex items-start">
                  <CheckCircle className="mr-3 mt-1 text-green-400 flex-shrink-0" />
                  <span>Each institution is allowed to send one representative to the national finals.</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-white/10 mb-8">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Scroll className="mr-3 text-blue-400" />
                Competition Format
              </h2>
              <div className="space-y-4 text-gray-300">
                <p className="flex items-start">
                  <CheckCircle className="mr-3 mt-1 text-blue-400 flex-shrink-0" />
                  <span>The competition consists of three stages: Campus, Institution, and National Finals.</span>
                </p>
                <p className="flex items-start">
                  <CheckCircle className="mr-3 mt-1 text-blue-400 flex-shrink-0" />
                  <span>Words will be selected from the Oxford English Dictionary and other approved academic sources.</span>
                </p>
                <p className="flex items-start">
                  <CheckCircle className="mr-3 mt-1 text-blue-400 flex-shrink-0" />
                  <span>Participants have 30 seconds to spell each word correctly.</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <AlertCircle className="mr-3 text-yellow-400" />
                Important Notes
              </h2>
              <div className="space-y-4 text-gray-300">
                <p className="flex items-start">
                  <CheckCircle className="mr-3 mt-1 text-yellow-400 flex-shrink-0" />
                  <span>All decisions made by the judges are final and binding.</span>
                </p>
                <p className="flex items-start">
                  <CheckCircle className="mr-3 mt-1 text-yellow-400 flex-shrink-0" />
                  <span>Participants must arrive at least 30 minutes before their scheduled competition time.</span>
                </p>
                <p className="flex items-start">
                  <CheckCircle className="mr-3 mt-1 text-yellow-400 flex-shrink-0" />
                  <span>Any form of cheating or misconduct will result in immediate disqualification.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

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
              <h4 className="font-bold text-white text-xl mb-6">Competition Info</h4>
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
                <li><Link to="/register" className="hover:text-green-400 transition-colors">Register</Link></li>
                <li><Link to="/login" className="hover:text-green-400 transition-colors">Login</Link></li>
                <li><Link to="/rules" className="hover:text-green-400 transition-colors">Rules</Link></li>
                <li><Link to="/contact" className="hover:text-green-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 md:mt-12 pt-4 md:pt-8 text-center">
            <p className="text-gray-400 text-base md:text-lg">
              &copy; 2025 Yeyeye Group. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Powered by <a href="https://thandotechservices.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-400">Thando Tech Services</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Rules;
