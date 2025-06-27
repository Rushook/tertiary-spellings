import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, MapPin, Calendar, DollarSign, GraduationCap, Building2, Star, Sparkles, Crown, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import logo from "/logo.png";

const Index = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState({});
  const [authUser, setAuthUser] = useState<any>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        // Try to get firstName from Firestore
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

  const FloatingElement = ({ children, delay = 0, className = "" }) => (
    <div 
      className={`floating-element ${className}`}
      style={{
        animation: `float 6s ease-in-out infinite ${delay}s, fadeInUp 1s ease-out forwards`,
        transform: `translateY(${Math.sin(Date.now() * 0.001 + delay) * 5}px)`
      }}
    >
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-2 w-40 h-40 md:top-20 md:left-10 md:w-72 md:h-72 bg-gradient-to-r from-green-400/20 to-blue-500/20 rounded-full blur-2xl md:blur-3xl animate-pulse"></div>
        <div className="absolute top-32 right-4 w-48 h-48 md:top-40 md:right-20 md:w-96 md:h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-2xl md:blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-10 left-1/4 w-44 h-44 md:bottom-20 md:left-1/3 md:w-80 md:h-80 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full blur-2xl md:blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        
        {/* Floating Letters */}
        {['A', 'B', 'C', 'D', 'E'].map((letter, i) => (
          <div
            key={letter}
            className="absolute text-3xl md:text-6xl font-bold text-white/5 select-none pointer-events-none"
            style={{
              left: `${10 + i * 15}%`,
              top: `${5 + i * 15}%`,
              transform: `rotate(${-20 + i * 10}deg)`,
              animation: `float 8s ease-in-out infinite ${i * 0.5}s`
            }}
          >
            {letter}
          </div>
        ))}
      </div>

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
                  
              {authUser ? (
                <>
                  <span className="w-32 md:w-40 inline-flex items-center justify-center bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 rounded shadow-lg text-sm md:text-base mr-2">
                    {userFirstName ? `Hi, ${userFirstName}` : "Hi"}
                  </span>
                  <Link to="/dashboard" className="w-32 md:w-40">
                    <Button
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
                    >
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
                    <Button
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
                    >
                      <span className="font-semibold">Login</span>
                    </Button>
                  </Link>
                  <Link to="/register" className="w-32 md:w-40">
                    <Button
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
                    >
                      <span className="font-semibold">Register Now</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-2 md:px-4 text-center">
        <div className="container mx-auto relative z-10">
          <FloatingElement delay={0}>
            <Badge className="mb-4 md:mb-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-300 border-green-400/30 backdrop-blur text-base md:text-lg px-4 md:px-6 py-1.5 md:py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Founded 2025 • Media Partners: SABC/DStv
            </Badge>
          </FloatingElement>
          
          <FloatingElement delay={0.2}>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 md:mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                South Africa's
              </span>
              <br />
              <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                Premier Spelling
              </span>
              <br />
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Competition
              </span>
            </h1>
          </FloatingElement>

          <FloatingElement delay={0.4}>
            <p className="text-lg md:text-2xl text-gray-300 mb-8 md:mb-12 max-w-xl md:max-w-4xl mx-auto leading-relaxed">
              Compete for <span className="text-yellow-400 font-bold text-2xl md:text-3xl">R1 Million</span> in prizes! 
              Open to all registered university and TVET college students across South Africa.
            </p>
          </FloatingElement>

          <FloatingElement delay={0.6}>
            <div className="flex flex-row gap-4 md:gap-6 justify-center w-full">
              {authUser ? (
                <Link to="/dashboard" className="w-48">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-base md:text-lg px-0 py-4 md:py-6 rounded-full shadow-2xl hover:shadow-green-500/25 transform hover:scale-110 transition-all duration-300 group flex items-center justify-center"
                  >
                    <Zap className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 group-hover:animate-bounce" />
                    <span className="font-semibold">Go to Dashboard</span>
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register" className="w-48">
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-base md:text-lg px-0 py-4 md:py-6 rounded-full shadow-2xl hover:shadow-green-500/25 transform hover:scale-110 transition-all duration-300 group flex items-center justify-center"
                    >
                      <Zap className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 group-hover:animate-bounce" />
                      <span className="font-semibold">Register Now</span>
                    </Button>
                  </Link>
                  <Link to="/login" className="w-48">
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-base md:text-lg px-0 py-4 md:py-6 rounded-full shadow-2xl hover:shadow-green-500/25 transform hover:scale-110 transition-all duration-300 flex items-center justify-center"
                    >
                      <span className="font-semibold">Login</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </FloatingElement>
        </div>

        {/* Animated Prize Display */}
        <div className="absolute bottom-4 md:bottom-10 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-full px-4 md:px-8 py-2 md:py-4 border border-yellow-400/30">
            <div className="flex items-center space-x-2 md:space-x-3">
              <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-400 animate-pulse" />
              <span className="text-xl md:text-2xl font-bold text-yellow-400">R1,000,000</span>
              <span className="text-white text-sm md:text-base">Top Prize</span>
            </div>
          </div>
        </div>
      </section>

      {/* Key Stats - Floating Cards */}
      <section className="py-10 md:py-20 relative">
        <div className="container mx-auto px-2 md:px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { icon: Trophy, color: "green", title: "R1 Million", subtitle: "Top Prize", gradient: "from-green-400 to-emerald-500" },
              { icon: Users, color: "blue", title: "76", subtitle: "Finalists (26 Unis + 50 TVETs)", gradient: "from-blue-400 to-cyan-500" },
              { icon: MapPin, color: "purple", title: "Sunbet Arena", subtitle: "Pretoria Finals Venue", gradient: "from-purple-400 to-pink-500" },
              { icon: Calendar, color: "orange", title: "Live TV", subtitle: "SABC/DStv Broadcast", gradient: "from-orange-400 to-red-500" }
            ].map((stat, index) => (
              <FloatingElement key={index} delay={index * 0.1} className="group">
                <Card className="bg-black/40 backdrop-blur-xl border-white/10 hover:border-white/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group-hover:shadow-2xl">
                  <CardContent className="p-8 text-center">
                    <div className={`bg-gradient-to-br ${stat.gradient} rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:animate-pulse`}>
                      <stat.icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">{stat.title}</h3>
                    <p className="text-gray-300">{stat.subtitle}</p>
                  </CardContent>
                </Card>
              </FloatingElement>
            ))}
          </div>
        </div>
      </section>

      {/* Competition Stages - Animated Timeline */}
      <section className="py-10 md:py-20 relative">
        <div className="container mx-auto px-2 md:px-4">
          <FloatingElement>
            <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-8 md:mb-16">
              Competition <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Stages</span>
            </h2>
          </FloatingElement>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-1 bg-gradient-to-r from-green-400 via-blue-400 to-yellow-400 rounded-full"></div>
            
            {[
              { stage: 1, title: "Campus Stage", desc: "Compete within your campus", prize: "R20,000", color: "green", gradient: "from-green-400 to-emerald-500" },
              { stage: 2, title: "Institution Stage", desc: "Campus winners compete", prize: "R50,000", color: "blue", gradient: "from-blue-400 to-cyan-500" },
              { stage: 3, title: "National Finals", desc: "Ultimate showdown", prize: "R1M", color: "yellow", gradient: "from-yellow-400 to-orange-500" }
            ].map((stage, index) => (
              <FloatingElement key={index} delay={index * 0.2} className="relative group">
                <Card className="bg-black/40 backdrop-blur-xl border-white/10 hover:border-white/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-4 group-hover:shadow-2xl">
                  <CardHeader className="text-center pb-4">
                    <div className={`bg-gradient-to-br from-gray-400 to-gray-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10 group-hover:animate-bounce`}>
                      <span className="text-2xl font-bold text-white">{stage.stage}</span>
                    </div>
                    <CardTitle className="text-2xl text-white">{stage.title}</CardTitle>
                    <CardDescription className="text-gray-300 text-lg">{stage.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className={`text-4xl font-bold bg-gradient-to-r ${stage.gradient} bg-clip-text text-transparent`}>
                        {stage.prize}
                      </span>
                      <p className="text-gray-300 text-lg">Winner Prize</p>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"></div>
                  </CardContent>
                </Card>
              </FloatingElement>
            ))}
          </div>
        </div>
      </section>

      {/* Prize Structure - Podium Style */}
      <section className="py-10 md:py-20 relative">
        <div className="container mx-auto px-2 md:px-4">
          <FloatingElement>
            <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-8 md:mb-16">
              <Crown className="inline w-8 h-8 md:w-12 md:h-12 text-yellow-400 mr-2 md:mr-4" />
              Prize <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Structure</span>
            </h2>
          </FloatingElement>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-2xl md:max-w-6xl mx-auto">
            {/* 2nd Place */}
            <FloatingElement delay={0.1} className="md:mt-12">
              <Card className="bg-gradient-to-r from-green-900/80 via-blue-900/80 to-purple-900/80 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
                <CardHeader className="text-center pb-6">
                  <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:animate-pulse">
                    <Trophy className="h-12 w-12 text-white" />
                  </div>
                  <CardTitle className="text-3xl text-gray-300">2nd Place</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-5xl font-bold text-gray-300 mb-4">R500,000</div>
                  <p className="text-gray-400 text-lg">Runner-up prize</p>
                </CardContent>
              </Card>
            </FloatingElement>

            {/* 1st Place - Elevated */}
            <FloatingElement delay={0} className="relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Star className="w-8 h-8 text-yellow-400 animate-spin" />
              </div>
              <Card className="bg-gradient-to-r from-green-900/80 via-blue-900/80 to-purple-900/80 backdrop-blur-xl border border-yellow-400/50 hover:border-yellow-300/70 transition-all duration-500 transform hover:scale-110 hover:-translate-y-4 group shadow-2xl shadow-yellow-500/20">
                <CardHeader className="text-center pb-6">
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:animate-bounce relative">
                    <Crown className="h-14 w-14 text-white" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-ping"></div>
                  </div>
                  <CardTitle className="text-4xl text-yellow-300">CHAMPION</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-6xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent mb-4">
                    R1,000,000
                  </div>
                  <p className="text-yellow-200 text-xl">Plus trophy & glory!</p>
                </CardContent>
              </Card>
            </FloatingElement>

            {/* 3rd Place */}
            <FloatingElement delay={0.2} className="md:mt-8">
              <Card className="bg-gradient-to-r from-green-900/80 via-blue-900/80 to-purple-900/80 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
                <CardHeader className="text-center pb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:animate-pulse">
                    <Trophy className="h-12 w-12 text-white" />
                  </div>
                  <CardTitle className="text-3xl text-orange-300">3rd Place</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-5xl font-bold text-orange-300 mb-4">R200,000</div>
                  <p className="text-orange-200 text-lg">Third place prize</p>
                </CardContent>
              </Card>
            </FloatingElement>
          </div>
          
          <FloatingElement delay={0.4}>
            <div className="text-center mt-8 md:mt-12">
              <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-4 md:p-8 max-w-xl md:max-w-2xl mx-auto">
                <p className="text-lg md:text-2xl text-white">
                  <Star className="inline w-5 h-5 md:w-6 md:h-6 text-yellow-400 mr-1 md:mr-2" />
                  <strong className="text-green-400">Bonus:</strong> All finalists keep their stage prizes (R20k + R50k)
                </p>
              </div>
            </div>
          </FloatingElement>
        </div>
      </section>

      {/* Call to Action - Final Push */}
      <section className="py-16 md:py-32 relative">
        <div className="container mx-auto px-2 md:px-4 text-center">
          <FloatingElement>
            <div className="bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-2xl rounded-3xl p-8 md:p-16 border border-white/20 max-w-xl md:max-w-4xl mx-auto shadow-2xl">
              <h2 className="text-3xl md:text-6xl font-bold text-white mb-6 md:mb-8">
                Ready to Make <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">History?</span>
              </h2>
              <p className="text-lg md:text-2xl text-gray-300 mb-8 md:mb-12">
                Join thousands of South African students competing for the ultimate spelling championship and life-changing prizes.
              </p>
              {authUser ? (
                <Link to="/dashboard">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 text-white text-xl md:text-2xl px-8 md:px-16 py-4 md:py-8 rounded-full shadow-2xl hover:shadow-green-500/25 transform hover:scale-110 transition-all duration-500 group"
                  >
                    <Crown className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-4 group-hover:animate-bounce" />
                    Go to Dashboard
                    <Sparkles className="w-6 h-6 md:w-8 md:h-8 ml-2 md:ml-4 group-hover:animate-spin" />
                  </Button>
                </Link>
              ) : (
                <Link to="/register">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 text-white text-xl md:text-2xl px-8 md:px-16 py-4 md:py-8 rounded-full shadow-2xl hover:shadow-green-500/25 transform hover:scale-110 transition-all duration-500 group"
                  >
                    <Crown className="w-6 h-6 md:w-8 md:h-8 mr-2 md:mr-4 group-hover:animate-bounce" />
                    Register Now
                    <Sparkles className="w-6 h-6 md:w-8 md:h-8 ml-2 md:ml-4 group-hover:animate-spin" />
                  </Button>
                </Link>
              )}
            </div>
          </FloatingElement>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/60 backdrop-blur-xl border-t border-white/10 py-8 md:py-16">
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
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .floating-element {
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default Index;