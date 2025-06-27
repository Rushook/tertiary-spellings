import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  User, 
  GraduationCap, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Settings,
  Crown,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
// Firebase imports
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import logo from "/logo.png";

// Firebase config from .env
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

const Dashboard = () => {
  type Notification = {
    id: string;
    message: string;
    type: 'success' | 'error';
    timestamp: string;
    userId: string;
    read: boolean;
  };

  const [user, setUser] = useState<any>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "pending" | "paid" | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    idPassportNumber: "",
    studentNumber: "",
    institution: "",
    campus: "",
    institutionType: "",
  });
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [competitions, setCompetitions] = useState<any[]>([]);

  // Helper function to create countdown string
  const getCountdown = (date: string, time: string) => {
    const eventDate = new Date(`${date}T${time}`);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();

    if (diff <= 0) return 'Event has started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
  };

  // Fetch notifications for current user
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!authUser?.uid) return;

      try {
        const db = getFirestore();
        const notificationsRef = collection(db, "notifications");
        const q = query(
          notificationsRef, 
          where("userId", "==", authUser.uid),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];
        setNotifications(notificationsData);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [authUser]);

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const db = getFirestore();
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, { read: true });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              ...userData,
              email: firebaseUser.email,
              idNumber: userData.idPassportNumber || ""
            });
            setUserFirstName(userData.firstName || firebaseUser.displayName?.split(" ")[0] || "");
            setPaymentStatus(userData.registrationStatus || "unpaid");
          } else {
            setUser(null);
            setUserFirstName(null);
            setPaymentStatus(null);
          }
        } catch {
          setUser(null);
          setUserFirstName(null);
          setPaymentStatus(null);
        }
      } else {
        setUser(null);
        setUserFirstName(null);
        setPaymentStatus(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch competitions the user is a participant in
  useEffect(() => {
    const fetchUserCompetitions = async () => {
      if (!authUser) {
        console.log("No authenticated user");
        return;
      }
      
      // Log user info before attempting query
      console.log("Auth state:", {
        uid: authUser.uid,
        email: authUser.email
      });
      
      try {
        const db = getFirestore();
        console.log("Attempting to fetch competitions for user:", authUser.uid);
        
        const q = query(collection(db, "competitions"), where("participants", "array-contains", authUser.uid));
        const snapshot = await getDocs(q);
        const comps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log("Fetched competitions:", comps);
        setCompetitions(comps);
      } catch (e) {
        console.error("Error fetching competitions:", e);
        if (e instanceof Error) {
          console.error("Error details:", {
            message: e.message,
            name: e.name,
            stack: e.stack
          });
        }
        setCompetitions([]);
      }
    };
    fetchUserCompetitions();
  }, [authUser]);

  const stages = [
    {
      stage: 1,
      title: "Campus Stage",
      description: "Compete within your campus",
      prize: "R20,000",
      status: user?.currentStage === 1 ? user?.stageStatus : user?.currentStage > 1 ? "completed" : "locked",
      date: "2025-03-15"
    },
    {
      stage: 2,
      title: "Institution Stage",
      description: "Campus winners compete",
      prize: "R50,000",
      status: user?.currentStage === 2 ? user?.stageStatus : user?.currentStage > 2 ? "completed" : "locked",
      date: "2025-04-15"
    },
    {
      stage: 3,
      title: "National Finals",
      description: "Ultimate showdown at Sunbet Arena",
      prize: "R1,000,000",
      status: user?.currentStage === 3 ? user?.stageStatus : user?.currentStage > 3 ? "completed" : "locked",
      date: "2025-05-30"
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white">Please sign in to view your dashboard.</CardTitle>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-green-500 to-blue-500 text-white">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  <Button
                    className="w-32 md:w-40 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
                    onClick={() => {
                      const auth = getAuth();
                      signOut(auth);
                    }}
                  >
                    <span className="font-semibold">Logout</span>
                  </Button>
                  <Link to="/" className="w-32 md:w-40">
                    <Button className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base">
                      <span className="font-semibold">Home</span>
                    </Button>
                  </Link>
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
                      <span className="font-semibold">Register</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-4 max-w-md w-full">
        {notifications
          .filter(n => !n.read)
          .map((notification) => (
            <div
              key={notification.id}
              className={`rounded-lg px-6 py-3 font-semibold text-white shadow-xl backdrop-blur-xl transition-all duration-300 transform animate-in slide-in-from-top-5 ${
                notification.type === 'success' 
                  ? 'bg-gradient-to-r from-emerald-500/90 to-teal-500/90 border border-emerald-400/20' 
                  : 'bg-gradient-to-r from-rose-500/90 to-pink-500/90 border border-rose-400/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {notification.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span>{notification.message}</span>
                </div>
                <button
                  onClick={() => markNotificationAsRead(notification.id)}
                  className="ml-4 text-white/80 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="text-xs text-white/60 mt-1">
                {new Date(notification.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))}
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Card */}
            <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <User className="h-5 w-5 mr-2 text-green-400" />
                  Welcome back, <span className="text-green-400">{user.firstName}</span>!
                </CardTitle>
                <CardDescription className="text-gray-300">
                  You're registered for the 2025 Tertiary Spelling Competition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Current Stage:</p>
                    <p className="font-semibold text-green-400">
                      {stages.find(s => s.stage === user.currentStage)?.title || "Unknown"}
                    </p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Clock className="h-3 w-3 mr-1" />
                    {user.stageStatus?.charAt(0).toUpperCase() + user.stageStatus?.slice(1) || "Upcoming"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            {/* Payment Banner for Unpaid Users */}
            {paymentStatus && paymentStatus !== "paid" && (
              <div className="mb-6">
                <div className="bg-gradient-to-r from-yellow-400/20 to-green-400/10 border border-yellow-400/40 rounded-lg p-4 text-left shadow-lg">
                  <h4 className="text-yellow-300 font-bold mb-2">Registration Payment Required</h4>
                  <ul className="text-gray-200 text-sm mb-2">
                    <li><span className="font-semibold">Bank Name:</span> Nedbank Limited</li>
                    <li><span className="font-semibold">Account holder:</span> Yeyeye Group (Pty) Ltd</li>
                    <li><span className="font-semibold">Account No:</span> 1316718565</li>
                    <li><span className="font-semibold">Branch code:</span> 198765</li>
                  </ul>
                  <div className="text-yellow-200 text-sm mb-2">
                    Please pay <span className="font-bold text-yellow-400">R200</span> and send your proof of payment to <a href="mailto:info@yeyeyegroup.co.za" className="underline text-green-300">info@yeyeyegroup.co.za</a>.<br />
                    Use your <span className="font-semibold">ID/Passport number: {user.idNumber}</span> as reference.
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

            {/* Competition Progress */}
            <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Competition Progress</CardTitle>
                <CardDescription className="text-gray-300">Track your journey through the competition stages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {competitions.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                      You are not yet added to any competitions.
                    </div>
                  ) : (
                    competitions
                      .sort((a, b) => (a.stage ?? 0) - (b.stage ?? 0))
                      .map((comp) => (
                        <div key={comp.id} className="flex items-center space-x-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            comp.status === 'completed' ? 'bg-green-100 text-green-600' :
                            comp.status === 'upcoming' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            {comp.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <span className="font-bold">{comp.stage}</span>
                            )}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-white">{comp.name}</h4>
                                <p className="text-sm text-gray-300">{comp.description}</p>
                                <p className="text-xs text-gray-400">
                                  Date: {comp.date}
                                  {comp.time && ` at ${comp.time}`}
                                  {comp.status === 'upcoming' && comp.date && comp.time && (
                                    <span className="ml-2 text-emerald-400 font-semibold">
                                      ({getCountdown(comp.date, comp.time)})
                                    </span>
                                  )}
                                  {comp.venue && <> • Venue: {comp.venue}</>}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-400">R{comp.prize}</div>
                                <Badge variant="outline" className={
                                  comp.status === 'completed' ? 'bg-green-50 text-green-700' :
                                  comp.status === 'upcoming' ? 'bg-yellow-50 text-yellow-700' :
                                  'bg-gray-50 text-gray-500'
                                }>
                                  {comp.status.charAt(0).toUpperCase() + comp.status.slice(1)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Additional Content */}
            <Tabs defaultValue="preparation" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preparation">Preparation</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preparation">
                <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white">Competition Preparation</CardTitle>
                    <CardDescription className="text-gray-300">Resources to help you prepare for the spelling competition</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-900/30 rounded-lg">
                        <h4 className="font-semibold text-blue-200">Study Materials</h4>
                        <p className="text-sm text-blue-100 mt-1">Access official word lists and practice materials</p>
                        <Button variant="outline" size="sm" className="mt-2 border-blue-400 text-blue-200 font-semibold">
                          Download Materials
                        </Button>
                      </div>
                      <div className="p-4 bg-purple-900/30 rounded-lg">
                        <h4 className="font-semibold text-purple-200">Practice Tests</h4>
                        <p className="text-sm text-purple-100 mt-1">Take practice spelling tests to prepare</p>
                        <Button variant="outline" size="sm" className="mt-2 border-purple-400 text-purple-200 font-semibold">
                          Start Practice
                        </Button>
                      </div>
                      <div className="p-4 bg-green-900/30 rounded-lg">
                        <h4 className="font-semibold text-green-200">Competition Rules</h4>
                        <p className="text-sm text-green-100 mt-1">Review the official competition guidelines</p>
                        <Button variant="outline" size="sm" className="mt-2 border-green-400 text-green-200 font-semibold">
                          Read Rules
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="results">
                <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white">Competition Results</CardTitle>
                    <CardDescription className="text-gray-300">View your performance in completed stages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">No results available yet</p>
                      <p className="text-sm text-gray-400">Results will appear here after you complete each stage</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents">
                <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-white">Important Documents</CardTitle>
                    <CardDescription className="text-gray-300">Access your registration documents and certificates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg border-white/10 bg-black/20">
                        <div>
                          <h4 className="font-medium text-white">Registration Certificate</h4>
                          <p className="text-sm text-gray-300">Proof of competition registration</p>
                        </div>
                        <Button variant="outline" size="sm" className="border-green-400 text-green-200 font-semibold">
                          Download Certificate
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg border-white/10 bg-black/20">
                        <div>
                          <h4 className="font-medium text-white">Payment Receipt</h4>
                          <p className="text-sm text-gray-300">R200 registration fee receipt</p>
                        </div>
                        <Button variant="outline" size="sm" className="border-yellow-400 text-yellow-200 font-semibold">
                          Download Receipt
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* User Competitions */}
            <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Your Competitions</CardTitle>
                <CardDescription className="text-gray-300">
                  View competitions you are participating in
                </CardDescription>
              </CardHeader>
              <CardContent>
                {competitions.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    You are not yet added to any competitions.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {competitions.map((comp) => (
                      <div key={comp.id} className="border border-white/10 rounded-lg p-4 bg-black/30 mb-2">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="text-lg font-bold text-white">{comp.name}</div>
                            <div className="text-gray-300">{comp.description}</div>
                            <div className="text-sm text-gray-400 mt-1">
                              <span className="mr-4">
                                <strong>Date:</strong> {comp.date} {comp.time && `at ${comp.time}`}
                              </span>
                              {comp.venue && (
                                <span className="mr-4">
                                  <strong>Venue:</strong> {comp.venue}
                                </span>
                              )}
                              <span>
                                <strong>Prize:</strong> R{comp.prize}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0">
                            <span className={
                              comp.status === "upcoming"
                                ? "bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-semibold"
                                : comp.status === "completed"
                                  ? "bg-green-400 text-black px-3 py-1 rounded-full text-xs font-semibold"
                                  : "bg-gray-400 text-black px-3 py-1 rounded-full text-xs font-semibold"
                            }>
                              {comp.status.charAt(0).toUpperCase() + comp.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Profile Card */}
            <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg text-white">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">Name</Label>
                  <p className="font-medium text-white">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">ID/Passport Number</Label>
                  <p className="font-medium text-white">{user.idNumber || <span className="text-gray-500">Not set</span>}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">Email</Label>
                  <p className="font-medium text-white">{user.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">Student Number</Label>
                  <p className="font-medium text-white">{user.studentNumber || <span className="text-gray-500">Not set</span>}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">Institution</Label>
                  <p className="font-medium text-white">{user.institution || <span className="text-gray-500">Not set</span>}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">Campus</Label>
                  <p className="font-medium text-white">{user.campus || <span className="text-gray-500">Not set</span>}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">Institution Type</Label>
                  <p className="font-medium text-white">{user.institutionType || <span className="text-gray-500">Not set</span>}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">Marketing Consent</Label>
                  <p className="font-medium text-white">{user.agreeMarketing ? "Yes" : "No"}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-400 uppercase tracking-wide">Registered At</Label>
                  <p className="font-medium text-white">{user.createdAt ? new Date(user.createdAt).toLocaleString() : <span className="text-gray-500">Not set</span>}</p>
                </div>
                {!isEditing ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4 border-green-400 text-green-200 font-semibold"
                    onClick={() => {
                      setEditForm({
                        firstName: user.firstName || "",
                        lastName: user.lastName || "",
                        idPassportNumber: user.idPassportNumber || "",
                        studentNumber: user.studentNumber || "",
                        institution: user.institution || "",
                        campus: user.campus || "",
                        institutionType: user.institutionType || "",
                      });
                      setIsEditing(true);
                      setUpdateError(null);
                      setUpdateSuccess(false);
                    }}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setUpdateError(null);
                    setUpdateSuccess(false);
                    
                    try {
                      const auth = getAuth();
                      const db = getFirestore();
                      
                      if (!auth.currentUser) {
                        throw new Error("No authenticated user");
                      }

                      // Update Firestore document
                      await updateDoc(doc(db, "users", auth.currentUser.uid), {
                        firstName: editForm.firstName,
                        lastName: editForm.lastName,
                        idPassportNumber: editForm.idPassportNumber,
                        studentNumber: editForm.studentNumber,
                        institution: editForm.institution,
                        campus: editForm.campus,
                        institutionType: editForm.institutionType,
                      });

                      // Update local state
                      setUser(prev => ({
                        ...prev,
                        ...editForm,
                        idNumber: editForm.idPassportNumber, // Update idNumber for display
                      }));
                      
                      setUpdateSuccess(true);
                      setIsEditing(false);
                    } catch (error) {
                      setUpdateError("Failed to update profile. Please try again.");
                      console.error("Profile update error:", error);
                    }
                  }}>
                    <div className="space-y-4 mb-4">
                      <div>
                        <Label className="text-xs text-gray-400 uppercase tracking-wide">First Name</Label>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400 uppercase tracking-wide">Last Name</Label>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400 uppercase tracking-wide">ID/Passport Number</Label>
                        <input
                          type="text"
                          value={editForm.idPassportNumber}
                          onChange={(e) => setEditForm(prev => ({ ...prev, idPassportNumber: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400 uppercase tracking-wide">Student Number</Label>
                        <input
                          type="text"
                          value={editForm.studentNumber}
                          onChange={(e) => setEditForm(prev => ({ ...prev, studentNumber: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400 uppercase tracking-wide">Institution</Label>
                        <input
                          type="text"
                          value={editForm.institution}
                          onChange={(e) => setEditForm(prev => ({ ...prev, institution: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400 uppercase tracking-wide">Campus</Label>
                        <input
                          type="text"
                          value={editForm.campus}
                          onChange={(e) => setEditForm(prev => ({ ...prev, campus: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-400 uppercase tracking-wide">Institution Type</Label>
                        <select
                          value={editForm.institutionType}
                          onChange={(e) => setEditForm(prev => ({ ...prev, institutionType: e.target.value }))}
                          className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white"
                          required
                        >
                          <option value="">Select Institution Type</option>
                          <option value="University">University</option>
                          <option value="TVET College">TVET College</option>
                          <option value="Private College">Private College</option>
                        </select>
                      </div>
                    </div>
                    
                    {updateError && (
                      <div className="mb-4 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
                        {updateError}
                      </div>
                    )}
                    
                    {updateSuccess && (
                      <div className="mb-4 p-2 bg-green-500/20 border border-green-500/50 rounded text-green-200 text-sm">
                        Profile updated successfully!
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white"
                      >
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-red-400 text-red-200"
                        onClick={() => {
                          setIsEditing(false);
                          setUpdateError(null);
                          setUpdateSuccess(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg text-white">Competition Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Registration Status</span>
                  <Badge className={
                    user?.registrationStatus === "paid"
                      ? "bg-green-100 text-green-800"
                      : user?.registrationStatus === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }>
                    {user?.registrationStatus === "paid"
                      ? "Paid"
                      : user?.registrationStatus === "pending"
                        ? "Pending"
                        : "Unpaid"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Current Stage</span>
                  <span className="font-medium text-white">Stage {user.currentStage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Prize Potential</span>
                  <span className="font-bold text-green-400">R1.07M</span>
                </div>
              </CardContent>
            </Card>

            {/* Important Notices */}
            <Card className="border-yellow-400 bg-yellow-900/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-yellow-300">
                  <AlertCircle className="h-5 w-5 mr-2 text-yellow-400" />
                  Important Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-200">
                  Remember to wear your institutional branded attire during the finals. 
                  No political party regalia is allowed.
                </p>
              </CardContent>
            </Card>
          </div>
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
          to { opacity: 1, transform: translateY(0);}
        }
        .floating-element { opacity: 0; }
      `}</style>
    </div>
  );
};

// Helper component for labels
const Label = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={className}>{children}</div>
);

export default Dashboard;
