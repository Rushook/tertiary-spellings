import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, addDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Building, Send, MessageSquare, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import logo from "/logo.png";

const Contact = () => {
  const [authUser, setAuthUser] = useState<any>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();


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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const db = getFirestore();
    try {
      await addDoc(collection(db, "messages"), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
        status: "new",
        timestamp: new Date().toISOString(),
      });
      toast({
        title: "Message sent",
        description: "Thank you for contacting us. We will get back to you soon.",
      });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <MessageSquare className="inline-block mr-4 mb-1" />
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Contact Us
              </span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl">
              Get in touch with the Tertiary Spelling Competition team
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <Mail className="w-6 h-6 text-green-400 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">Email</h3>
                        <p className="text-gray-300">info@tertiaryspelling.co.za</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Phone className="w-6 h-6 text-blue-400 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">Phone</h3>
                        <p className="text-gray-300">+27 (0) 676588166</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <MapPin className="w-6 h-6 text-purple-400 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">Address</h3>
                        <p className="text-gray-300">
                          Sunbet Arena<br />
                          Time Square<br />
                          Pretoria, South Africa
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Building className="w-6 h-6 text-yellow-400 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">Office Hours</h3>
                        <p className="text-gray-300">
                          Monday - Friday: 9:00 AM - 5:00 PM<br />
                          Saturday: 9:00 AM - 1:00 PM<br />
                          Sunday: Closed
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardContent className="p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        Your Name
                      </label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your name"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter your email"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter your phone number"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                        Subject
                      </label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Enter subject"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                        Message
                      </label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Enter your message"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                        rows={6}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
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

export default Contact;
