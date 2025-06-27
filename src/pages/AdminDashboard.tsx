import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { 
  Trophy, 
  Users, 
  BarChart3, 
  Settings, 
  DollarSign, 
  Calendar,
  Search,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Award,
  Building,
  GraduationCap,
  MessageCircle,
  Mail,
  Plus
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc, orderBy } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
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

type Notification = {
  id: string;
  message: string;
  type: 'success' | 'error';
  timestamp: string;
  userId: string;
  read: boolean;
};

type Competition = {
  id: string;
  stage: number;
  name: string;
  description: string;
  date: string;
  time: string;
  venue?: string;
  participants: string[];  // Changed to string array to store participant IDs
  prize: string;
  status: 'upcoming' | 'locked' | 'completed';
  userId: string; // Add userId to track who created the competition
};

type Message = {
  id: string;
  email: string;
  message: string;
  name: string;
  phone: string;
  status: 'new' | 'read';
  subject: string;
  timestamp: string;
};

type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  institution?: string;
  institutionType?: string;
  campus?: string;
  registrationStatus?: string;
  banned?: boolean;
  [key: string]: any;
};

// Helper function to calculate countdown
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

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInstitution, setFilterInstitution] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminName, setAdminName] = useState(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageSearchTerm, setMessageSearchTerm] = useState("");
  const [messageStatusFilter, setMessageStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("registrations");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [newCompetition, setNewCompetition] = useState<Partial<Competition>>({
    stage: 1,
    name: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    participants: [],  // Initialize as empty array
    prize: '',
    status: 'upcoming'
  });
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [editedCompetition, setEditedCompetition] = useState<Partial<Competition>>({});
  const [isEditCompetitionModalOpen, setIsEditCompetitionModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  // Function to show notification and save to Firestore
  const showNotification = async (message: string, type: 'success' | 'error' = 'success', targetUserId?: string) => {
    // Show temporary notification for admin
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);

    try {
      const db = getFirestore(app);
      const notificationsRef = collection(db, "notifications");
      
      // If targetUserId is provided, create notification for that user
      // Otherwise create notification for current admin
      const userId = targetUserId || authUser?.uid;
      
      if (userId) {
        await addDoc(notificationsRef, {
          message,
          type,
          timestamp: new Date().toISOString(),
          userId: userId,
          read: false
        });
      }
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  };

  // Helper function to create user notifications
  const createUserNotification = async (userId: string, message: string) => {
    await showNotification(message, 'success', userId);
  };

  // Fetch notifications for current user
  useEffect(() => {
    if (!authUser?.uid) return;

    const fetchNotifications = async () => {
      try {
        const db = getFirestore(app);
        const notificationsRef = collection(db, "notifications");
        const snapshot = await getDocs(notificationsRef);
        const notificationsData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Notification[];
        
        // Filter notifications for current user and sort by timestamp
        const userNotifications = notificationsData
          .filter(notif => notif.userId === authUser.uid)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setNotifications(userNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [authUser]);

  // Function to mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const db = getFirestore(app);
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

  // Fetch competitions for current user
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const db = getFirestore(app);
        const competitionsRef = collection(db, "competitions");
        const snapshot = await getDocs(competitionsRef);
        const competitionsData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Competition[];
        // Filter competitions to only show those created by current user
        const userCompetitions = competitionsData.filter(comp => comp.userId === authUser?.uid);
        setCompetitions(userCompetitions.sort((a, b) => a.stage - b.stage));
      } catch (e) {
        console.error('Error fetching competitions:', e);
      }
    };
    fetchCompetitions();
  }, []);

  // Handle competition creation
  const handleCreateCompetition = async () => {
    try {
      const db = getFirestore(app);
      const competitionsRef = collection(db, "competitions");
      // Add userId when creating new competition
      const competitionWithUser = {
        ...newCompetition,
        userId: authUser?.uid
      };
      const docRef = await addDoc(competitionsRef, competitionWithUser);
      
      const createdCompetition = {
        id: docRef.id,
        ...competitionWithUser
      } as Competition;
      
      setCompetitions(prev => [...prev, createdCompetition].sort((a, b) => a.stage - b.stage));
      setIsCreateModalOpen(false);
      setNewCompetition({
        stage: 1,
        name: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        participants: [],
        prize: '',
        status: 'upcoming' as 'upcoming' | 'locked' | 'completed'
      });
    } catch (error) {
      console.error('Error creating competition:', error);
    }
  };

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const db = getFirestore(app);
        const messagesRef = collection(db, "messages");
        const snapshot = await getDocs(messagesRef);
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        setMessages(messagesData.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      } catch (e) {
        console.error('Error fetching messages:', e);
      }
    };
    fetchMessages();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const db = getFirestore(app);
        console.log('Fetching users collection...');
        const usersRef = collection(db, "users");
        console.log('Users collection ref:', usersRef);
        const snapshot = await getDocs(usersRef);
        console.log('Got snapshot, empty?', snapshot.empty);
        console.log('Raw snapshot:', snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as User
        }));
        console.log('Processed users:', usersData);
        setUsers(usersData);
      } catch (e) {
        console.error('Error fetching users:', e);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setAuthUser(user);
      if (user) {
        try {
          const userDocSnap = await getDoc(doc(db, "users", user.uid));
          let role = null;
          let firstName = null;
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            console.log('User doc data:', data);
            role = data.role || null;
            firstName = data.firstName || null;
          }
          console.log('User role:', role, 'Admin name:', firstName);
          setUserRole(role);
          setAdminName(firstName);
          if (role !== "admin") {
            navigate("/login");
          }
        } catch (error) {
          console.error('Error fetching user doc:', error);
          setUserRole(null);
          setAdminName(null);
          navigate("/login");
        }
      } else {
        setUserRole(null);
        setAdminName(null);
        navigate("/login");
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm
      ? (
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      : true;
    const matchesInstitution =
      filterInstitution === "universities"
        ? user.institutionType === "university"
        : filterInstitution === "tvet"
          ? user.institutionType === "tvet"
          : true;
    return matchesSearch && matchesInstitution;
  });

  const totalRegistrations = users.length;
  const paidRegistrations = users.filter(u => u.registrationStatus === "paid").length;
  const totalRevenue = paidRegistrations * 200;
  const universities = new Set(
    users.filter(u => (u.institutionType || "").toLowerCase() === "university").map(u => u.institution)
  ).size;
  const tvetColleges = new Set(
    users.filter(u => (u.institutionType || "").toLowerCase() === "tvet").map(u => u.institution)
  ).size;
  const activeCampuses = new Set(users.map(u => u.campus)).size;

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gradient-to-r from-cyan-400 to-purple-400 border-t-transparent mx-auto mb-4"></div>
          <div className="text-white text-xl font-medium animate-pulse">Checking admin access...</div>
        </div>
      </div>
    );
  }

  if (userRole !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-pink-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-4 max-w-md w-full">
        {/* Temporary notification */}
        {notification && (
          <div
            className={`rounded-lg px-6 py-3 font-semibold text-white shadow-xl backdrop-blur-xl transition-all duration-300 transform animate-in slide-in-from-top-5 ${
              notification.type === 'success' 
                ? 'bg-gradient-to-r from-emerald-500/90 to-teal-500/90 border border-emerald-400/20' 
                : 'bg-gradient-to-r from-rose-500/90 to-pink-500/90 border border-rose-400/20'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Persistent notifications */}
        {notifications.filter(n => !n.read).map((notif) => (
          <div
            key={notif.id}
            className={`rounded-lg px-6 py-3 font-semibold text-white shadow-xl backdrop-blur-xl transition-all duration-300 ${
              notif.type === 'success' 
                ? 'bg-gradient-to-r from-emerald-500/90 to-teal-500/90 border border-emerald-400/20' 
                : 'bg-gradient-to-r from-rose-500/90 to-pink-500/90 border border-rose-400/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {notif.type === 'success' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{notif.message}</span>
              </div>
              <button
                onClick={() => markNotificationAsRead(notif.id)}
                className="ml-4 text-white/80 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="text-xs text-white/60 mt-1">
              {new Date(notif.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ))}
      </div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

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
              <div className="flex space-x-2 md:space-x-4 items-center">
                <Button
                  className="w-32 md:w-40 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base relative"
                  onClick={() => setActiveTab("messages")}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span className="font-semibold">Messages</span>
                  {messages.filter(m => m.status === 'new').length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {messages.filter(m => m.status === 'new').length}
                    </span>
                  )}
                </Button>
              {adminName && (
                <span className="w-32 md:w-40 inline-flex items-center justify-center bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 rounded shadow-lg text-sm md:text-base mr-2">
                  Hi, {adminName}
                </span>
              )}
              <Button
                className="w-32 md:w-40 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
                onClick={() => {
                  const auth = getAuth();
                  signOut(auth);
                }}
              >
                <span className="font-semibold">Logout</span>
              </Button>
              <Link to="/" className="w-32 md:w-40">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-4 md:px-6 py-1.5 md:py-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm md:text-base">
                  <span className="font-semibold">Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="relative overflow-hidden backdrop-blur-xl bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-200">Total Registrations</CardTitle>
              <div className="relative">
                <Users className="h-6 w-6 text-cyan-400 drop-shadow-lg" />
                <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-lg"></div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white mb-1">{totalRegistrations.toLocaleString()}</div>
              <p className="text-xs text-gray-300 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-emerald-400" />
                {paidRegistrations.toLocaleString()} paid registrations
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden backdrop-blur-xl bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-200">Total Revenue</CardTitle>
              <div className="relative">
                <DollarSign className="h-6 w-6 text-emerald-400 drop-shadow-lg" />
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-lg"></div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white mb-1">R{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-300 flex items-center">
                <Award className="h-3 w-3 mr-1 text-emerald-400" />
                From {paidRegistrations.toLocaleString()} payments
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden backdrop-blur-xl bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-200">Institutions</CardTitle>
              <div className="relative">
                <Building className="h-6 w-6 text-purple-400 drop-shadow-lg" />
                <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-lg"></div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white mb-1">{universities + tvetColleges}</div>
              <p className="text-xs text-gray-300">
                {universities} Universities • {tvetColleges} TVET Colleges
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden backdrop-blur-xl bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300 group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-200">Active Campuses</CardTitle>
              <div className="relative">
                <GraduationCap className="h-6 w-6 text-orange-400 drop-shadow-lg" />
                <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-lg"></div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-white mb-1">{activeCampuses}</div>
              <p className="text-xs text-gray-300">
                Participating campuses nationwide
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 backdrop-blur-xl bg-white/10 border border-white/20 p-1 rounded-xl">
            <TabsTrigger 
              value="registrations" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white text-gray-300 transition-all duration-300 rounded-lg font-medium"
            >
              Registrations
            </TabsTrigger>
            <TabsTrigger 
              value="institutions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white text-gray-300 transition-all duration-300 rounded-lg font-medium"
            >
              Institutions
            </TabsTrigger>
            <TabsTrigger 
              value="competitions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white text-gray-300 transition-all duration-300 rounded-lg font-medium"
            >
              Competitions
            </TabsTrigger>
            <TabsTrigger 
              value="finances"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white text-gray-300 transition-all duration-300 rounded-lg font-medium"
            >
              Finances
            </TabsTrigger>
            <TabsTrigger 
              value="messages"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white text-gray-300 transition-all duration-300 rounded-lg font-medium"
            >
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registrations">
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl font-bold text-white mb-2">Student Registrations</CardTitle>
                    <CardDescription className="text-gray-300">Manage student registrations and payments</CardDescription>
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="outline" size="sm" className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search students..."
                      className="pl-10 backdrop-blur-xl bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 transition-all duration-300"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={filterInstitution} onValueChange={setFilterInstitution}>
                    <SelectTrigger className="w-64 backdrop-blur-xl bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Filter by institution" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl bg-slate-800 border-white/20">
                      <SelectItem value="all">All Institutions</SelectItem>
                      <SelectItem value="universities">Universities Only</SelectItem>
                      <SelectItem value="tvet">TVET Colleges Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center text-gray-300 py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent mx-auto mb-4"></div>
                      Loading registrations...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">No registrations found.</div>
                  ) : (
                    filteredUsers.map((registration) => (
                      <div key={registration.id} className="group backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                  {registration.firstName?.charAt(0) || 'U'}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-white text-lg">{registration.firstName} {registration.lastName}</h4>
                                <p className="text-sm text-gray-300">{registration.email}</p>
                              </div>
                              <div className="hidden md:block">
                                <p className="text-sm font-medium text-gray-200">{registration.institution}</p>
                                <p className="text-xs text-gray-400">{registration.campus}</p>
                              </div>
                              <Badge 
                                variant={registration.registrationStatus === 'paid' ? 'default' : 'secondary'}
                                className={
                                  registration.registrationStatus === 'paid'
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                                    : registration.registrationStatus === 'pending'
                                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                                      : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg'
                                }
                              >
                                {registration.registrationStatus === "paid"
                                  ? "Paid"
                                  : registration.registrationStatus === "pending"
                                    ? "Pending"
                                    : "Unpaid"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-300 hover:text-white hover:bg-white/10"
                                  onClick={() => {
                                    setViewUser(registration);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="backdrop-blur-xl bg-slate-900/90 border-white/20 text-white max-w-4xl mx-auto my-4 max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl font-bold text-white">View User Details</DialogTitle>
                                  <DialogDescription className="text-gray-300 mb-4">
                                    User information and registration status
                                  </DialogDescription>
                                </DialogHeader>
                                {viewUser && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-400">First Name</label>
                                      <p className="text-white text-lg">{viewUser.firstName || '-'}</p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-400">Last Name</label>
                                      <p className="text-white text-lg">{viewUser.lastName || '-'}</p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-400">Email</label>
                                      <p className="text-white text-lg">{viewUser.email || '-'}</p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-400">Institution</label>
                                      <p className="text-white text-lg">{viewUser.institution || '-'}</p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-400">Institution Type</label>
                                      <p className="text-white text-lg">{viewUser.institutionType || '-'}</p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-400">Campus</label>
                                      <p className="text-white text-lg">{viewUser.campus || '-'}</p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-400">Registration Status</label>
                                      <p className="text-white text-lg">{viewUser.registrationStatus || '-'}</p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-400">Banned</label>
                                      <p className="text-white text-lg">{viewUser.banned ? 'Yes' : 'No'}</p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-400">ID/Passport Number</label>
                                      <p className="text-white text-lg">{viewUser.idPassportNumber || '-'}</p>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-400">Student Number</label>
                                      <p className="text-white text-lg">{viewUser.studentNumber || '-'}</p>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20">
                                    Close
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-300 hover:text-white hover:bg-white/10"
                                  onClick={() => {
                                    setSelectedUser(registration);
                                    setEditedUser({
                                      firstName: registration.firstName || '',
                                      lastName: registration.lastName || '',
                                      email: registration.email || '',
                                      institution: registration.institution || '',
                                      institutionType: registration.institutionType || '',
                                      campus: registration.campus || '',
                                      registrationStatus: registration.registrationStatus || 'unpaid',
                                      studentNumber: registration.studentNumber || '',
                                      idPassportNumber: registration.idPassportNumber || ''
                                    });
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="backdrop-blur-xl bg-slate-900/90 border-white/20 text-white">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl font-bold text-white">Edit User Details</DialogTitle>
                                  <DialogDescription className="text-gray-300">
                                    Update user information and registration status
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-200">First Name</label>
                                      <Input
                                        value={editedUser.firstName}
                                        onChange={(e) => setEditedUser(prev => ({ ...prev, firstName: e.target.value }))}
                                        className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-200">Last Name</label>
                                      <Input
                                        value={editedUser.lastName}
                                        onChange={(e) => setEditedUser(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-200">Email</label>
                                    <Input
                                      value={editedUser.email}
                                      onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                                      className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-200">Institution</label>
                                      <Input
                                        value={editedUser.institution}
                                        onChange={(e) => setEditedUser(prev => ({ ...prev, institution: e.target.value }))}
                                        className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-200">Institution Type</label>
                                      <Select
                                        value={editedUser.institutionType}
                                        onValueChange={(value) => setEditedUser(prev => ({ ...prev, institutionType: value }))}
                                      >
                                        <SelectTrigger className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent className="backdrop-blur-xl bg-slate-800 border-white/20">
                                          <SelectItem value="university">University</SelectItem>
                                          <SelectItem value="tvet">TVET College</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-200">Campus</label>
                                      <Input
                                        value={editedUser.campus}
                                        onChange={(e) => setEditedUser(prev => ({ ...prev, campus: e.target.value }))}
                                        className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-200">Registration Status</label>
                                      <Select
                                        value={editedUser.registrationStatus}
                                        onValueChange={(value) => setEditedUser(prev => ({ ...prev, registrationStatus: value }))}
                                      >
                                        <SelectTrigger className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent className="backdrop-blur-xl bg-slate-800 border-white/20">
                                          <SelectItem value="paid">Paid</SelectItem>
                                          <SelectItem value="pending">Pending</SelectItem>
                                          <SelectItem value="unpaid">Unpaid</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-200">Student Number</label>
                                      <Input
                                        value={editedUser.studentNumber}
                                        onChange={(e) => setEditedUser(prev => ({ ...prev, studentNumber: e.target.value }))}
                                        className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-200">ID/Passport Number</label>
                                      <Input
                                        value={editedUser.idPassportNumber}
                                        onChange={(e) => setEditedUser(prev => ({ ...prev, idPassportNumber: e.target.value }))}
                                        className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={async () => {
                                      if (!selectedUser?.id) return;
                                      
                                      try {
                                        const db = getFirestore(app);
                                        const userRef = doc(db, "users", selectedUser.id);
                                        await updateDoc(userRef, editedUser);
                                        
                                        // Update local state
                                        setUsers(prevUsers => 
                                          prevUsers.map(user => 
                                            user.id === selectedUser.id 
                                              ? { ...user, ...editedUser }
                                              : user
                                          )
                                        );

                                        // Create notification for user data update with specific changes
                                        const changes = [];
                                        if (editedUser.firstName !== selectedUser.firstName) 
                                          changes.push(`name to ${editedUser.firstName} ${editedUser.lastName}`);
                                        if (editedUser.registrationStatus !== selectedUser.registrationStatus)
                                          changes.push(`registration status to ${editedUser.registrationStatus}`);
                                        if (editedUser.institution !== selectedUser.institution)
                                          changes.push(`institution to ${editedUser.institution}`);
                                        if (editedUser.campus !== selectedUser.campus)
                                          changes.push(`campus to ${editedUser.campus}`);
                                        
                                        const changeMessage = changes.length > 0
                                          ? `Admin updated your ${changes.join(', ')}`
                                          : `Admin reviewed your profile`;
                                          
                                        await createUserNotification(selectedUser.id, changeMessage);
                                        
                                        setIsEditModalOpen(false);
                                      } catch (error) {
                                        console.error('Error updating user:', error);
                                      }
                                    }}
                                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
                                  >
                                    Save changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="institutions">
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white mb-2">Participating Institutions</CardTitle>
                <CardDescription className="text-gray-300">Manage universities and TVET colleges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto text-white">
                  <h3 className="text-lg font-semibold mb-2">Universities ({universities})</h3>
                  {universities > 0 ? (
                    <ul className="list-disc list-inside text-gray-300 mb-6">
                      {[...new Set(users.filter(u => (u.institutionType || "").toLowerCase() === "university").map(u => u.institution))].map((inst, idx) => (
                        <li key={idx}>{inst}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No universities found.</p>
                  )}
                  <h3 className="text-lg font-semibold mb-2">TVET Colleges ({tvetColleges})</h3>
                  {tvetColleges > 0 ? (
                    <ul className="list-disc list-inside text-gray-300">
                      {[...new Set(users.filter(u => (u.institutionType || "").toLowerCase() === "tvet").map(u => u.institution))].map((inst, idx) => (
                        <li key={idx}>{inst}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No TVET colleges found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitions">
            {/* Delete Competition Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
              <DialogContent className="backdrop-blur-xl bg-slate-900/90 border-white/20 text-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white">Delete Competition</DialogTitle>
                  <DialogDescription className="text-gray-300">
                    Are you sure you want to delete this competition? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {selectedCompetition && (
                    <div className="space-y-4">
                      <p className="text-white">You are about to delete:</p>
                      <div className="bg-white/5 p-4 rounded-lg">
                        <p className="font-semibold text-white">Stage {selectedCompetition.stage}: {selectedCompetition.name}</p>
                        <p className="text-gray-300 text-sm mt-1">{selectedCompetition.description}</p>
                        <p className="text-gray-300 text-sm mt-1">Date: {selectedCompetition.date} at {selectedCompetition.time}</p>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600"
                    onClick={async () => {
                      if (!selectedCompetition?.id) return;
                      
                      try {
                        const db = getFirestore(app);
                        const competitionRef = doc(db, "competitions", selectedCompetition.id);
                        
                        await deleteDoc(competitionRef);
                        
                        // Update local state
                        setCompetitions(prev => 
                          prev.filter(comp => comp.id !== selectedCompetition.id)
                        );
                        
                        // Show notification
                        showNotification(`Competition "${selectedCompetition.name}" has been deleted.`);
                        
                        setIsDeleteModalOpen(false);
                      } catch (error) {
                        console.error('Error deleting competition:', error);
                        showNotification('Failed to delete competition.', 'error');
                      }
                    }}
                  >
                    Delete Competition
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white mb-2">Competition Management</CardTitle>
                <CardDescription className="text-gray-300">Manage competition stages and schedules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white">Competition Stages</h3>
                    <Button 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Competition
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Dynamic Competition Cards */}
                    {competitions.map((competition) => (
                      <Card key={competition.id} className="relative overflow-hidden backdrop-blur-xl bg-black/40 border-emerald-400/30 hover:bg-black/50 transition-all duration-300 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-400/10"></div>
                        <CardHeader className="relative z-10">
                          <CardTitle className="text-xl text-white flex items-center font-bold">
                            <Trophy className="h-6 w-6 mr-2 text-emerald-400" />
                            Stage {competition.stage}: {competition.name}
                          </CardTitle>
                          <CardDescription className="text-gray-200 text-base">{competition.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10">
                          <div className="space-y-3">
                            <p className="text-base text-white">
                              <strong className="text-emerald-300">Date & Time:</strong> {competition.date} at {competition.time}
                              {competition.status === 'upcoming' && (
                                <span className="ml-2 text-sm text-emerald-400">
                                  ({getCountdown(competition.date, competition.time)})
                                </span>
                              )}
                            </p>
                            {competition.venue && (
                              <p className="text-base text-white"><strong className="text-emerald-300">Venue:</strong> {competition.venue}</p>
                            )}
                            {competition.participants && competition.participants.length > 0 && (
                              <p className="text-base text-white">
                                <strong className="text-emerald-300">Participants:</strong>{" "}
                                {competition.participants.map(participantId => {
                                  const participant = users.find(user => user.id === participantId);
                                  return participant ? `${participant.firstName} ${participant.lastName}` : 'Unknown User';
                                }).join(', ')}
                              </p>
                            )}
                            <p className="text-base text-white"><strong className="text-emerald-300">Prize:</strong> {competition.prize}</p>
                            <Badge className={
                              competition.status === 'upcoming'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg text-sm'
                                : competition.status === 'completed'
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg text-sm'
                                  : 'bg-black/60 text-gray-300 shadow-lg text-sm'
                            }>
                              {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
                            </Badge>
                            
                            {/* Action Buttons */}
                            <div className="flex space-x-2 mt-4">
                              <Dialog open={isEditCompetitionModalOpen} onOpenChange={setIsEditCompetitionModalOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
                                    onClick={() => {
                                      setSelectedCompetition(competition);
                                      setEditedCompetition({
                                        stage: competition.stage,
                                        name: competition.name,
                                        description: competition.description,
                                        date: competition.date,
                                        time: competition.time,
                                        venue: competition.venue || '',
                                        participants: competition.participants,
                                        prize: competition.prize,
                                        status: competition.status
                                      });
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="backdrop-blur-xl bg-slate-900/90 border-white/20 text-white">
                                  <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-white">Edit Competition</DialogTitle>
                                    <DialogDescription className="text-gray-300">
                                      Update competition details
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-200">Stage Name</label>
                                        <Input
                                          placeholder="Enter stage name"
                                          className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                                          value={editedCompetition.name || ''}
                                          onChange={(e) => setEditedCompetition(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-200">Stage Number</label>
                                        <Input
                                          type="number"
                                          placeholder="Enter stage number"
                                          className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                                          value={editedCompetition.stage || ''}
                                          onChange={(e) => setEditedCompetition(prev => ({ ...prev, stage: Number(e.target.value) }))}
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-200">Description</label>
                                      <Input
                                        placeholder="Enter description"
                                        className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                                        value={editedCompetition.description || ''}
                                        onChange={(e) => setEditedCompetition(prev => ({ ...prev, description: e.target.value }))}
                                      />
                                    </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">Date</label>
                          <Input
                            type="date"
                            className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                            value={editedCompetition.date || ''}
                            onChange={(e) => setEditedCompetition(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">Time</label>
                          <Input
                            type="time"
                            className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                            value={editedCompetition.time || ''}
                            onChange={(e) => setEditedCompetition(prev => ({ ...prev, time: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-200">Venue</label>
                                        <Input
                                          placeholder="Enter venue"
                                          className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                                          value={editedCompetition.venue || ''}
                                          onChange={(e) => setEditedCompetition(prev => ({ ...prev, venue: e.target.value }))}
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-200">Prize Amount</label>
                                        <Input
                                          type="text"
                                          placeholder="Enter prize amount"
                                          className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                                          value={editedCompetition.prize || ''}
                                          onChange={(e) => setEditedCompetition(prev => ({ ...prev, prize: e.target.value }))}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-200">Status</label>
                                        <Select
                                          value={editedCompetition.status || 'upcoming'}
                                          onValueChange={(value) => setEditedCompetition(prev => ({ ...prev, status: value as 'upcoming' | 'locked' | 'completed' }))}
                                        >
                                          <SelectTrigger className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                                            <SelectValue placeholder="Select status" />
                                          </SelectTrigger>
                                          <SelectContent className="backdrop-blur-xl bg-slate-800 border-white/20">
                                            <SelectItem value="upcoming">Upcoming</SelectItem>
                                            <SelectItem value="locked">Locked</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => setIsEditCompetitionModalOpen(false)}
                                      className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                                    onClick={async () => {
                                        if (!selectedCompetition?.id) return;
                                        
                                        try {
                                          const db = getFirestore(app);
                                          const competitionRef = doc(db, "competitions", selectedCompetition.id);
                                          
                                          await updateDoc(competitionRef, editedCompetition);
                                          
                                          // Update local state
                                          setCompetitions(prev => 
                                            prev.map(comp => 
                                              comp.id === selectedCompetition.id
                                                ? { ...comp, ...editedCompetition }
                                                : comp
                                            )
                                          );

                                          // Prepare notification message about changes
                                          const compChanges = [];
                                          if (editedCompetition.date !== selectedCompetition.date || editedCompetition.time !== selectedCompetition.time)
                                            compChanges.push(`scheduled for ${editedCompetition.date} at ${editedCompetition.time}`);
                                          if (editedCompetition.venue !== selectedCompetition.venue)
                                            compChanges.push(`venue changed to ${editedCompetition.venue}`);
                                          if (editedCompetition.prize !== selectedCompetition.prize)
                                            compChanges.push(`prize updated to R${editedCompetition.prize}`);
                                          if (editedCompetition.status !== selectedCompetition.status)
                                            compChanges.push(`status changed to ${editedCompetition.status}`);
                                            
                                          const compChangeMessage = `Competition "${editedCompetition.name || selectedCompetition.name}" ${
                                            compChanges.length > 0 
                                              ? compChanges.join(', ')
                                              : 'details were reviewed'
                                          }`;

                                          // Notify all participants about competition update
                                          if (selectedCompetition.participants && selectedCompetition.participants.length > 0) {
                                            for (const participantId of selectedCompetition.participants) {
                                              await createUserNotification(participantId, compChangeMessage);
                                            }
                                          }
                                          
                                          showNotification(compChangeMessage);

                                          setIsEditCompetitionModalOpen(false);
                                        } catch (error) {
                                          console.error('Error updating competition:', error);
                                        }
                                      }}
                                    >
                                      Save changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Dialog open={isParticipantsModalOpen} onOpenChange={setIsParticipantsModalOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
                                    onClick={() => {
                                      setSelectedCompetition(competition);
                                    }}
                                  >
                                    <Users className="h-4 w-4 mr-1" />
                                    Participants
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="backdrop-blur-xl bg-slate-900/90 border-white/20 text-white max-w-4xl mx-auto my-4">
                                  <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-white">Competition Participants</DialogTitle>
                                    <DialogDescription className="text-gray-300">
                                      Manage participants for {selectedCompetition?.name}
                                    </DialogDescription>
                                  </DialogHeader>
                                      <div className="space-y-6">
                                      <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-white">Paid Registered Users</h3>
                                      </div>
                                      <div className="relative mb-4">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                          placeholder="Search participants..."
                                          className="pl-10 backdrop-blur-xl bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 transition-all duration-300"
                                          onChange={(e) => {
                                            const searchTerm = e.target.value.toLowerCase();
                                            const filteredUsers = users
                                              .filter(user => user.registrationStatus === "paid")
                                              .filter(user => 
                                                user.firstName?.toLowerCase().includes(searchTerm) ||
                                                user.lastName?.toLowerCase().includes(searchTerm) ||
                                                user.email?.toLowerCase().includes(searchTerm) ||
                                                user.institution?.toLowerCase().includes(searchTerm)
                                              );
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                        {users
                                          .filter(user => user.registrationStatus === "paid")
                                          .map((user) => {
                                            const isParticipant = selectedCompetition?.participants?.includes(user.id);
                                            
                                            return (
                                              <div key={user.id} className="group backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all duration-300">
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center space-x-4">
                                                    <div className="relative">
                                                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                        {user.firstName?.charAt(0)}
                                                      </div>
                                                    </div>
                                                    <div>
                                                      <h4 className="font-semibold text-white">{user.firstName} {user.lastName}</h4>
                                                      <p className="text-sm text-gray-300">{user.institution}</p>
                                                    </div>
                                                  </div>
                                                  <div className="flex space-x-2">
                                                    {isParticipant ? (
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                                        onClick={async () => {
                                                          if (!selectedCompetition) return;
                                                          
                                                          try {
                                                            const db = getFirestore(app);
                                                            const competitionRef = doc(db, "competitions", selectedCompetition.id);
                                                            
                                                            const updatedParticipants = selectedCompetition.participants.filter(
                                                              id => id !== user.id
                                                            );
                                                            
                                                            await updateDoc(competitionRef, {
                                                              participants: updatedParticipants
                                                            });
                                                            
                                                            // Update local state
                                                            setCompetitions(prev => 
                                                              prev.map(comp => 
                                                                comp.id === selectedCompetition.id
                                                                  ? { ...comp, participants: updatedParticipants }
                                                                  : comp
                                                              )
                                                            );
                                                            
                                                            setSelectedCompetition(prev => 
                                                              prev ? { ...prev, participants: updatedParticipants } : null
                                                            );

                                            // Show notification on participant removal
                                            const removalMessage = `You have been removed from ${selectedCompetition.name} (Stage ${selectedCompetition.stage}). Please contact admin if you believe this was done in error.`;
                                            await createUserNotification(user.id, removalMessage);

                                                          } catch (error) {
                                                            console.error('Error removing participant:', error);
                                                          }
                                                        }}
                                                      >
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Remove
                                                      </Button>
                                                    ) : (
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                                        onClick={async () => {
                                                          if (!selectedCompetition) return;
                                                          
                                                          try {
                                                            const db = getFirestore(app);
                                                            const competitionRef = doc(db, "competitions", selectedCompetition.id);
                                                            
                                                            const updatedParticipants = [
                                                              ...(selectedCompetition.participants || []),
                                                              user.id
                                                            ];
                                                            
                                                            await updateDoc(competitionRef, {
                                                              participants: updatedParticipants
                                                            });
                                                            
                                                            // Update local state
                                                            setCompetitions(prev => 
                                                              prev.map(comp => 
                                                                comp.id === selectedCompetition.id
                                                                  ? { ...comp, participants: updatedParticipants }
                                                                  : comp
                                                              )
                                                            );
                                                            
                                                            setSelectedCompetition(prev => 
                                                              prev ? { ...prev, participants: updatedParticipants } : null
                                                            );

                                            // Show notification on participant addition
                                            const participantMessage = `You have been added to ${selectedCompetition.name} (Stage ${selectedCompetition.stage}). Competition scheduled for ${selectedCompetition.date} at ${selectedCompetition.time}${selectedCompetition.venue ? ` at ${selectedCompetition.venue}` : ''}.`;
                                            await createUserNotification(user.id, participantMessage);

                                                          } catch (error) {
                                                            console.error('Error adding participant:', error);
                                                          }
                                                        }}
                                                      >
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Add
                                                      </Button>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                        })}
                                      </div>
                                    </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => setIsParticipantsModalOpen(false)}
                                      className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
                                    >
                                      Close
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="outline"
                                size="sm"
                                className="backdrop-blur-xl bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                                onClick={() => {
                                  setSelectedCompetition(competition);
                                  setIsDeleteModalOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                  </div>

                  {/* Create Competition Modal */}
                  <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogContent className="backdrop-blur-xl bg-slate-900/90 border-white/20 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-white">Add New Competition</DialogTitle>
                      <DialogDescription className="text-gray-300">
                        Create a new competition stage or event
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">Stage Name</label>
                          <Input
                            placeholder="Enter stage name"
                            className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                            value={newCompetition.name || ''}
                            onChange={(e) => setNewCompetition(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">Stage Number</label>
                          <Input
                            type="number"
                            placeholder="Enter stage number"
                            className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                            value={newCompetition.stage || ''}
                            onChange={(e) => setNewCompetition(prev => ({ ...prev, stage: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-200">Description</label>
                        <Input
                          placeholder="Enter description"
                          className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                          value={newCompetition.description || ''}
                          onChange={(e) => setNewCompetition(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">Date</label>
                          <Input
                            type="date"
                            className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                            value={newCompetition.date || ''}
                            onChange={(e) => setNewCompetition(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">Time</label>
                          <Input
                            type="time"
                            className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                            value={newCompetition.time || ''}
                            onChange={(e) => setNewCompetition(prev => ({ ...prev, time: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">Venue</label>
                          <Input
                            placeholder="Enter venue"
                            className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                            value={newCompetition.venue || ''}
                            onChange={(e) => setNewCompetition(prev => ({ ...prev, venue: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">Prize Amount</label>
                          <Input
                            type="text"
                            placeholder="Enter prize amount"
                            className="backdrop-blur-xl bg-white/10 border-white/20 text-white"
                            value={newCompetition.prize || ''}
                            onChange={(e) => setNewCompetition(prev => ({ ...prev, prize: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-200">Status</label>
                          <Select
                            value={newCompetition.status || 'upcoming'}
                            onValueChange={(value) => setNewCompetition(prev => ({ ...prev, status: value as 'upcoming' | 'locked' | 'completed' }))}
                          >
                            <SelectTrigger className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="backdrop-blur-xl bg-slate-800 border-white/20">
                              <SelectItem value="upcoming">Upcoming</SelectItem>
                              <SelectItem value="locked">Locked</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                        onClick={handleCreateCompetition}
                      >
                        Create Competition
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                  </Dialog>

                  <div className="flex flex-wrap gap-4">
                    <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                      Manage Stages
                    </Button>
                    <Button variant="outline" className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                      Schedule Competition
                    </Button>
                    <Button variant="outline" className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                      Export Results
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finances">
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white mb-2">Financial Overview</CardTitle>
                <CardDescription className="text-gray-300">Revenue, payments, and prize money tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Revenue Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-green-50/10 rounded-lg">
                        <span className="text-white">Registration Fees</span>
                        <span className="font-bold text-green-400">R{totalRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50/10 rounded-lg">
                        <span className="text-white">Pending Payments</span>
                        <span className="font-bold text-yellow-400">R{((totalRegistrations - paidRegistrations) * 200).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Prize Money Allocation</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-yellow-50/10 rounded-lg">
                        <span className="text-yellow-300">Stage 1 Prizes (324 winners)</span>
                        <span className="font-bold text-yellow-300">R6,480,000</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50/10 rounded-lg">
                        <span className="text-blue-300">Stage 2 Prizes (76 winners)</span>
                        <span className="font-bold text-blue-300">R3,800,000</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50/10 rounded-lg">
                        <span className="text-purple-300">Final Prizes (Top 3 each)</span>
                        <span className="font-bold text-purple-300">R3,400,000</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50/10 rounded-lg border-2 border-green-200/30">
                        <span className="font-semibold text-green-300">Total Prize Money</span>
                        <span className="font-bold text-green-400">R13,680,000</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl font-bold text-white mb-2">Messages</CardTitle>
                    <CardDescription className="text-gray-300">View and manage incoming messages</CardDescription>
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="outline" size="sm" className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search messages..."
                      className="pl-10 backdrop-blur-xl bg-white/10 border-white/20 text-white placeholder-gray-400 focus:bg-white/20 transition-all duration-300"
                      value={messageSearchTerm}
                      onChange={(e) => setMessageSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={messageStatusFilter} onValueChange={setMessageStatusFilter}>
                    <SelectTrigger className="w-48 backdrop-blur-xl bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-xl bg-slate-800 border-white/20">
                      <SelectItem value="all">All Messages</SelectItem>
                      <SelectItem value="new">New Messages</SelectItem>
                      <SelectItem value="read">Read Messages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.filter(message => {
                    const matchesSearch = messageSearchTerm
                      ? (
                        message.subject.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
                        message.name.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
                        message.email.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
                        message.message.toLowerCase().includes(messageSearchTerm.toLowerCase())
                      )
                      : true;
                    const matchesStatus = messageStatusFilter === "all" 
                      ? true 
                      : message.status === messageStatusFilter;
                    return matchesSearch && matchesStatus;
                  }).length === 0 ? (
                    <div className="text-center text-gray-400 py-8">No messages found.</div>
                  ) : (
                    messages
                      .filter(message => {
                        const matchesSearch = messageSearchTerm
                          ? (
                            message.subject.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
                            message.name.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
                            message.email.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
                            message.message.toLowerCase().includes(messageSearchTerm.toLowerCase())
                          )
                          : true;
                        const matchesStatus = messageStatusFilter === "all" 
                          ? true 
                          : message.status === messageStatusFilter;
                        return matchesSearch && matchesStatus;
                      })
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((message) => (
                      <div 
                        key={message.id}
                        onClick={() => {
                          setSelectedMessage(message);
                          setIsMessageModalOpen(true);
                          // Update message status to read
                          if (message.status === 'new') {
                            const db = getFirestore(app);
                            const messageRef = doc(db, "messages", message.id);
                            updateDoc(messageRef, { status: 'read' })
                              .then(() => {
                                setMessages(prev => 
                                  prev.map(m => 
                                    m.id === message.id ? { ...m, status: 'read' } : m
                                  )
                                );
                              })
                              .catch(console.error);
                          }
                        }}
                        className="group backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all duration-300 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                  <Mail className="h-6 w-6" />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-white text-lg">{message.subject}</h4>
                                  {message.status === 'new' && (
                                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
                                      New
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-300">{message.name} • {message.email}</p>
                                <p className="text-sm text-gray-400 mt-1">
                                  {new Date(message.timestamp).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Message View Modal */}
        <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
          <DialogContent className="backdrop-blur-xl bg-slate-900/90 border-white/20 text-white max-w-4xl mx-auto my-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Message Details</DialogTitle>
              <DialogDescription className="text-gray-300">
                View message information and content
              </DialogDescription>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Subject</label>
                    <p className="text-white text-lg font-semibold">{selectedMessage.subject}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400">From</label>
                      <p className="text-white">{selectedMessage.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Email</label>
                      <p className="text-white">{selectedMessage.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Phone</label>
                    <p className="text-white">{selectedMessage.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Date</label>
                    <p className="text-white">
                      {new Date(selectedMessage.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Message</label>
                    <p className="text-white whitespace-pre-wrap rounded-lg bg-white/5 p-4 mt-1">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsMessageModalOpen(false)}
                    className="backdrop-blur-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
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
        .bg-grid-pattern {
          background-image: linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;