import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trophy, Eye, EyeOff, Sparkles, Crown, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
// Add Firebase imports
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import logo from "/logo.png";

// Initialize Firebase using .env variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentNumber: "",
    idPassportNumber: "",
    institutionType: "",
    institution: "",
    campus: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    agreeMarketing: false
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "pending" | "paid" | null>(null);
  const navigate = useNavigate();

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
            setIsRegistered(true);
            setPaymentStatus(userDoc.data().registrationStatus || "unpaid");
          } else {
            setUserFirstName(user.displayName ? user.displayName.split(" ")[0] : null);
            setIsRegistered(false);
            setPaymentStatus(null);
          }
        } catch {
          setUserFirstName(null);
          setIsRegistered(false);
          setPaymentStatus(null);
        }
      } else {
        setUserFirstName(null);
        setIsRegistered(false);
        setPaymentStatus(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      await updateProfile(userCredential.user, {
        displayName: `${formData.firstName} ${formData.lastName}`,
      });

      // Initialize user doc in Firestore with all fields needed for Dashboard
      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        studentNumber: formData.studentNumber,
        idPassportNumber: formData.idPassportNumber,
        institutionType: formData.institutionType,
        institution: formData.institution,
        campus: formData.campus,
        registrationStatus: "unpaid", // Default: not paid yet
        currentStage: 1,
        stageStatus: "upcoming",
        agreeMarketing: formData.agreeMarketing,
        createdAt: new Date().toISOString(),
        // Add a default role for normal users (not admin)
        role: "user"
      });

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
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

      {/* Registration Form */}
      <div className="flex items-center justify-center py-12 px-2 md:px-0">
        <div className="w-full max-w-2xl">
            <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white font-bold">Register for Competition</CardTitle>
              <CardDescription>
                <span className="flex items-center justify-center gap-2 text-green-300 mb-1">
                  <Sparkles className="w-4 h-4" />
                  Registration is <span className="font-bold text-green-400">FREE</span>
                </span>
                <span className="text-sm text-gray-300">
                  You will pay <span className="text-yellow-400 font-bold">R200</span> later to enter the competition
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Show registration status if logged in */}
              {authUser && (
                <div className="mb-4 text-center">
                  {isRegistered ? (
                    <span className="inline-block bg-gradient-to-r from-yellow-400 to-green-400 text-black font-semibold px-4 py-2 rounded shadow text-sm">
                      You are already registered for the competition.
                    </span>
                  ) : (
                    <span className="inline-block bg-gradient-to-r from-red-400 to-orange-400 text-white font-semibold px-4 py-2 rounded shadow text-sm">
                      You are signed in but not registered yet.
                    </span>
                  )}
                </div>
              )}

              {/* Payment instructions if registered but not paid */}
              {authUser && isRegistered && paymentStatus && paymentStatus !== "paid" && (
                <div className="mb-6">
                  <div className="bg-black/40 border border-yellow-400/40 rounded-lg p-4 mb-3 text-left">
                    <h4 className="text-yellow-300 font-bold mb-2">Registration Payment Details</h4>
                    <ul className="text-gray-200 text-sm mb-2">
                      <li><span className="font-semibold">Bank Name:</span> Nedbank Limited</li>
                      <li><span className="font-semibold">Account holder:</span> Yeyeye Group (Pty) Ltd</li>
                      <li><span className="font-semibold">Account No:</span> 1316718565</li>
                      <li><span className="font-semibold">Branch code:</span> 198765</li>
                    </ul>
                    <div className="text-yellow-200 text-sm mb-2">
                      Please pay <span className="font-bold text-yellow-400">R200</span> and send your proof of payment to <a href="mailto:info@yeyeyegroup.co.za" className="underline text-green-300">info@yeyeyegroup.co.za</a>.<br />
                      Use your <span className="font-semibold">full name</span> as reference.
                    </div>
                    {paymentStatus === "pending" && (
                      <div className="mt-2">
                        <span className="inline-block bg-yellow-200 text-yellow-900 font-semibold px-3 py-1 rounded">
                          Proof of payment submitted. Awaiting verification.
                        </span>
                      </div>
                    )}
                    {paymentStatus === "unpaid" && (
                      <div className="mt-2">
                        <span className="inline-block bg-red-200 text-red-900 font-semibold px-3 py-1 rounded">
                          Payment not received yet.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="backdrop-blur-lg bg-black/30 rounded-xl p-4 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-gray-200">First Name *</Label>
                        <Input
                          id="firstName"
                          placeholder="Enter your first name"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          required
                          className="bg-black/30 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-gray-200">Last Name *</Label>
                        <Input
                          id="lastName"
                          placeholder="Enter your last name"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          required
                          className="bg-black/30 border-white/10 text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-200">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="student@university.ac.za"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="bg-black/30 border-white/10 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentNumber" className="text-gray-200">Student Number *</Label>
                      <Input
                        id="studentNumber"
                        placeholder="Enter your student number"
                        value={formData.studentNumber}
                        onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
                        required
                        className="bg-black/30 border-white/10 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idPassportNumber" className="text-gray-200">ID/Passport Number *</Label>
                      <Input
                        id="idPassportNumber"
                        placeholder="Enter your ID or Passport number"
                        value={formData.idPassportNumber}
                        onChange={(e) => setFormData({ ...formData, idPassportNumber: e.target.value })}
                        required
                        className="bg-black/30 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  {/* Institution Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Institution Information</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="institutionType" className="text-gray-200">Institution Type *</Label>
                      <Select value={formData.institutionType} onValueChange={(value) => setFormData({ ...formData, institutionType: value })}>
                        <SelectTrigger className="bg-black/30 border-white/10 text-white">
                          <SelectValue placeholder="Select institution type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="university">University</SelectItem>
                          <SelectItem value="tvet">TVET College</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="institution" className="text-gray-200">Institution Name *</Label>
                      <Input
                        id="institution"
                        placeholder="e.g., University of Cape Town, Boston City Campus"
                        value={formData.institution}
                        onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                        required
                        className="bg-black/30 border-white/10 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="campus" className="text-gray-200">Campus *</Label>
                      <Input
                        id="campus"
                        placeholder="e.g., Main Campus, Johannesburg Campus"
                        value={formData.campus}
                        onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                        required
                        className="bg-black/30 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  {/* Account Security */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Account Security</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-200">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          className="bg-black/30 border-white/10 text-white"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-200">Confirm Password *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          required
                          className="bg-black/30 border-white/10 text-white"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="agreeTerms"
                        checked={formData.agreeTerms}
                        onCheckedChange={(checked) => setFormData({ ...formData, agreeTerms: checked as boolean })}
                        required
                      />
                      <Label htmlFor="agreeTerms" className="text-sm leading-5 text-gray-200">
                        I agree to the <Link to="/terms" className="text-green-400 hover:underline">Terms and Conditions</Link>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="agreeMarketing"
                        checked={formData.agreeMarketing}
                        onCheckedChange={(checked) => setFormData({ ...formData, agreeMarketing: checked as boolean })}
                      />
                      <Label htmlFor="agreeMarketing" className="text-sm leading-5 text-gray-200">
                        I would like to receive updates about the competition and other opportunities from Yeyeye Group.
                      </Label>
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-400 text-sm text-center">{error}</div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-lg py-3 font-semibold rounded-full shadow-lg hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                    disabled={!formData.agreeTerms || loading}
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    <span className="font-semibold">{loading ? "Creating Account..." : "Create Account"}</span>
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <div className="text-sm text-gray-300">
                    Already have an account?{" "}
                    <Link to="/login" className="text-green-400 hover:underline font-medium">
                      Sign in here
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .floating-element { opacity: 0; }
      `}</style>
    </div>
  );
};

export default Register;
