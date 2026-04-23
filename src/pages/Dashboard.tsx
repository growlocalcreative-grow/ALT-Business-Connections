/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "../contexts/UserContext";
import { siteConfig } from "../config/site-config";
import { 
  LogOut, Plus, Search, MapPin, Calendar, MessageSquare, 
  Building2, Users, Info, Heart, Star, Phone, Mail, Camera, Globe,
  TreePine, Leaf, Flower2, Bird, Mountain, Waves, 
  LayoutDashboard, Shield, ArrowRight, X, Loader2, CheckCircle2, XCircle, AlertTriangle,
  BadgeCheck, HeartHandshake, HouseHeart, MessageSquareHeart, Sparkles, Clock, MessageCircle, ChevronDown, ChevronUp, Coffee,
  Zap, LifeBuoy, Palette, Utensils, Hammer, Briefcase, GraduationCap
} from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = {
  'Technology': Zap,
  'Digital Consulting': Zap,
  'Website Rescue': LifeBuoy,
  'Google Set-up': Search,
  'Art': Palette,
  'Creative': Palette,
  'Food': Utensils,
  'Health': Heart,
  'Wellness': Heart,
  'Services': Hammer,
  'Garden': Leaf,
  'Education': GraduationCap,
  'Business': Briefcase,
  'Professional': Briefcase
};

function CategoryTag({ label, small = false }: { label: string, small?: boolean }) {
  const Icon = CATEGORY_ICONS[label] || CATEGORY_ICONS[Object.keys(CATEGORY_ICONS).find(k => label.includes(k)) || ""] || Sparkles;
  
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 bg-sand/30 text-forest rounded-full border border-sand/50 shadow-sm hover:-translate-y-0.5 transition-transform truncate max-w-full ${small ? 'text-[6px] font-black tracking-widest' : 'text-[7px] font-black tracking-widest'}`}>
      <Icon size={small ? 8 : 10} className="text-forest/70 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

import GlobalNav from "../components/GlobalNav";
import { auth, db } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { Link } from "react-router-dom";
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  updateDoc, doc, arrayUnion, arrayRemove, where, deleteDoc
} from "firebase/firestore";

const NATURE_ICONS: Record<string, any> = {
  TreePine, Leaf, Flower2, Bird, Mountain, Waves
};

export default function Dashboard() {
  const { profile, user } = useUser();
  const [activeTab, setActiveTab] = useState<"feed" | "resources" | "events" | "club" | "offers" | "directory" | "manage">("feed");
  
  // Data State
  const [resources, setResources] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [helpOffers, setHelpOffers] = useState<any[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubInfo, setClubInfo] = useState({ 
    title: "About A.B.C", 
    description: "ALT Business Connections is a community-driven initiative dedicated to supporting the residents and business owners of Auburn Lake Trails.",
    mission: "To strengthen community bonds and facilitate local mutual aid.",
    email: "auburnlaketrails@gmail.com",
    phone: "",
    website: "" 
  });
  const [isEditingClub, setIsEditingClub] = useState(false);
  const [editClubData, setEditClubData] = useState({ title: "", description: "", mission: "", email: "", phone: "", website: "" });
  
  // UI State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isDeedsModalOpen, setIsDeedsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [editingHelpOffer, setEditingHelpOffer] = useState<any | null>(null);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  
  const [postData, setPostData] = useState({ title: "", description: "", type: "resource" as "resource" | "service", quantity: 1 });
  const [helpData, setHelpData] = useState({ capacity: "", description: "", contactPreference: "" });
  const [eventData, setEventData] = useState({ title: "", description: "", date: "", time: "", location: "", email: "", phone: "" });
  const [requestData, setRequestData] = useState({ title: "", description: "", contactPreference: "", isAnonymous: false });
  const [issueData, setIssueData] = useState({ type: "bug" as "bug" | "behavior", description: "" });
  
  const [isPosting, setIsPosting] = useState(false);
  const [isOwnerWarningOpen, setIsOwnerWarningOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [eventViewMode, setEventViewMode] = useState<"list" | "calendar">("list");
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);
  const [isConnectionsExpanded, setIsConnectionsExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isMobileConnectionsOpen, setIsMobileConnectionsOpen] = useState(false);
  const [claimsModalData, setClaimsModalData] = useState<{ title: string, claimants: any[] } | null>(null);

  const myClaims = [
    ...resources.filter(r => r.claimedBy?.includes(user?.uid)).map(r => ({ ...r, category: 'Freebie', natureIcon: r.natureIcon || 'Sparkles' })),
    ...helpOffers.filter(o => o.claimedBy?.includes(user?.uid)).map(o => ({ ...o, category: 'Help Offer', title: o.capacity, businessName: o.userName, natureIcon: 'Heart' })),
    ...assistanceRequests.filter(req => req.connectedHelperUid === user?.uid && req.status !== 'resolved').map(req => {
      const reqProfile = allUsers.find(u => u.uid === req.userUid);
      return {
        ...req,
        category: 'Help Request',
        title: req.title,
        businessName: reqProfile?.displayName || req.userName,
        isAnonymous: req.isAnonymous,
        realName: reqProfile?.displayName,
        realPhone: reqProfile?.phone,
        realEmail: reqProfile?.email,
        natureIcon: req.natureIcon || 'Shield'
      };
    })
  ].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const myActiveRequests = assistanceRequests
    .filter(req => req.userUid === user?.uid && req.connectedHelperUid && req.status !== 'resolved')
    .map(req => {
      const helperProfile = allUsers.find(u => u.uid === req.connectedHelperUid);
      return {
        ...req,
        category: 'Getting Help',
        title: req.title,
        helperName: helperProfile?.displayName || "A Neighbor",
        helperPhone: helperProfile?.phone,
        helperEmail: helperProfile?.email,
        natureIcon: helperProfile?.natureIcon || 'Sparkles',
        isNew: req.ownerViewed === false
      };
    })
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const viewHelpOfferClaims = (offer: any) => {
    const claimants = (offer.claimedBy || []).map((uid: string) => 
      allUsers.find(u => u.uid === uid)
    ).filter(Boolean);
    setClaimsModalData({ title: offer.capacity || offer.title, claimants });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const scrollToSection = (tabId: any, sectionId?: string) => {
    setActiveTab(tabId);
    if (sectionId) {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const UserIcon = profile?.natureIcon ? NATURE_ICONS[profile.natureIcon] : TreePine;

  useEffect(() => {
    const qResources = query(collection(db, "resources"), orderBy("createdAt", "desc"));
    const unsubscribeResources = onSnapshot(qResources, (snapshot) => {
      setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qEvents = query(collection(db, "events"), orderBy("date", "asc"));
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qBusinesses = query(collection(db, "businesses"), where("verified", "==", true));
    const unsubscribeBusinesses = onSnapshot(qBusinesses, (snapshot) => {
      setBusinesses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qOffers = query(collection(db, "helpOffers"), orderBy("createdAt", "desc"));
    const unsubscribeOffers = onSnapshot(qOffers, (snapshot) => {
      setHelpOffers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qRequests = query(collection(db, "assistanceRequests"), orderBy("createdAt", "desc"));
    const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
      setAssistanceRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qUsers = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const unsubscribeClub = onSnapshot(doc(db, "site", "club"), (docSnap) => {
      if (docSnap.exists()) {
        setClubInfo(docSnap.data() as any);
      }
    });

    return () => {
      unsubscribeResources();
      unsubscribeEvents();
      unsubscribeBusinesses();
      unsubscribeOffers();
      unsubscribeRequests();
      unsubscribeUsers();
      unsubscribeClub();
    };
  }, []);

  // Cleanup expired events
  useEffect(() => {
    if (events.length === 0) return;

    const cleanupExpiredEvents = async () => {
      const today = new Date().toLocaleDateString('en-CA'); // 'yyyy-mm-dd' format
      const expiredEvents = events.filter(e => e.date && e.date < today);
      
      if (expiredEvents.length === 0) return;

      console.log(`Found ${expiredEvents.length} expired events. Cleaning up...`);
      
      for (const event of expiredEvents) {
        try {
          await deleteDoc(doc(db, "events", event.id));
        } catch (error) {
          console.error(`Failed to delete expired event ${event.id}:`, error);
        }
      }
    };

    cleanupExpiredEvents();
  }, [events]);

  const handlePostResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || profile.role !== "business") return;
    setIsPosting(true);
    try {
      // Find business ID for this user
      const biz = businesses.find(b => b.ownerUid === user?.uid);
      
      if (editingResource) {
        await updateDoc(doc(db, "resources", editingResource.id), {
          ...postData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, "resources"), {
          ...postData,
          businessId: biz?.id || user?.uid,
          ownerUid: user?.uid,
          businessName: biz?.name || profile.displayName,
          claimedBy: [],
          createdAt: new Date().toISOString(),
        });
      }
      setIsPostModalOpen(false);
      setEditingResource(null);
      setPostData({ title: "", description: "", type: "resource", quantity: 1 });
    } catch (error) {
      console.error("Post failed:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleSaveClubInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "site", "club"), editClubData);
      setIsEditingClub(false);
    } catch (error) {
      console.error("Save club info failed:", error);
      // Fallback: create if it doesn't exist
      try {
        const { setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "site", "club"), editClubData);
        setIsEditingClub(false);
      } catch (innerError) {
        console.error("Set doc failed:", innerError);
      }
    }
  };

  const startEditClub = () => {
    setEditClubData(clubInfo);
    setIsEditingClub(true);
  };

  const isMasterAdmin = profile?.role === "master-admin";

  const resolveRequest = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await updateDoc(doc(db, "assistanceRequests", requestId), {
        status: "resolved",
        updatedAt: new Date().toISOString()
      });
      setToast("Request resolved! Thank you for the community love.");
    } catch (error) {
      console.error("Resolve failed:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const markAllDeedsAsViewed = async () => {
    const unviewed = myActiveRequests.filter(req => req.ownerViewed === false);
    if (unviewed.length === 0) return;
    
    try {
      for (const req of unviewed) {
        await updateDoc(doc(db, "assistanceRequests", req.id), {
          ownerViewed: true
        });
      }
    } catch (error) {
      console.error("Mark viewed failed:", error);
    }
  };

  const handleDeedToggle = () => {
    if (!isDeedsModalOpen) {
      markAllDeedsAsViewed();
    }
    setIsDeedsModalOpen(!isDeedsModalOpen);
  };

  const toggleClaim = async (resourceId: string, isClaimed: boolean) => {
    if (!user) return;
    
    // Block owners from claiming their own freebie
    const res = resources.find(r => r.id === resourceId);
    if (res && res.ownerUid === user.uid) {
      setIsOwnerWarningOpen(true);
      return;
    }

    setProcessingId(resourceId);
    try {
      const ref = doc(db, "resources", resourceId);
      if (isClaimed) {
        await updateDoc(ref, {
          claimedBy: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(ref, {
          claimedBy: arrayUnion(user.uid)
        });
        setToast("Success! Neighborly vibes sent.");
      }
    } catch (error) {
      console.error("Claim toggle failed:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleHelpClaim = async (offerId: string, isClaimed: boolean) => {
    if (!user) return;
    setProcessingId(offerId);
    try {
      const ref = doc(db, "helpOffers", offerId);
      if (isClaimed) {
        await updateDoc(ref, {
          claimedBy: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(ref, {
          claimedBy: arrayUnion(user.uid)
        });
        setToast("Success! Neighborly vibes sent.");
      }
    } catch (error) {
      console.error("Help claim toggle failed:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleRequestConnection = async (requestId: string, isConnected: boolean) => {
    if (!user) return;
    setProcessingId(requestId);
    try {
      const ref = doc(db, "assistanceRequests", requestId);
      if (isConnected) {
        await updateDoc(ref, {
          connectedHelperUid: null,
          ownerViewed: true
        });
      } else {
        await updateDoc(ref, {
          connectedHelperUid: user.uid,
          ownerViewed: false
        });
        setToast("Connection Made! Neighbor notified.");
      }
    } catch (error) {
      console.error("Connection toggle failed:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleFavorite = async (businessName: string) => {
    if (!user || !profile) return;
    try {
      const isFavorite = profile.favorites?.includes(businessName);
      await updateDoc(doc(db, "users", user.uid), {
        favorites: isFavorite ? arrayRemove(businessName) : arrayUnion(businessName)
      });
    } catch (error) {
      console.error("Favorite toggle failed:", error);
    }
  };

  const deleteResource = async (id: string) => {
    if (!confirm("Are you sure you want to remove this offer?")) return;
    try {
      await deleteDoc(doc(db, "resources", id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const startEditResource = (r: any) => {
    setEditingResource(r);
    setPostData({ title: r.title, description: r.description, type: r.type, quantity: r.quantity || 1 });
    setIsPostModalOpen(true);
  };

  const handlePostHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsPosting(true);
    try {
      if (editingHelpOffer) {
        await updateDoc(doc(db, "helpOffers", editingHelpOffer.id), {
          ...helpData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, "helpOffers"), {
          ...helpData,
          userUid: user?.uid,
          userName: profile.anonymousName || profile.displayName,
          natureIcon: profile.natureIcon,
          streetName: profile.streetName,
          createdAt: new Date().toISOString(),
          claimedBy: []
        });
      }
      setIsHelpModalOpen(false);
      setEditingHelpOffer(null);
      setHelpData({ capacity: "", description: "", contactPreference: "" });
    } catch (error) {
      console.error("Post help failed:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const deleteHelpOffer = async (id: string) => {
    if (!confirm("Remove this help offer?")) return;
    try {
      await deleteDoc(doc(db, "helpOffers", id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const startEditHelpOffer = (h: any) => {
    setEditingHelpOffer(h);
    setHelpData({ capacity: h.capacity, description: h.description, contactPreference: h.contactPreference });
    setIsHelpModalOpen(true);
  };

  const handlePostEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsPosting(true);
    try {
      if (editingEvent) {
        await updateDoc(doc(db, "events", editingEvent.id), {
          ...eventData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, "events"), {
          ...eventData,
          creatorUid: user?.uid,
          createdAt: new Date().toISOString(),
        });
      }
      setIsEventModalOpen(false);
      setEditingEvent(null);
      setEventData({ title: "", description: "", date: "", time: "", location: "", email: "", phone: "" });
    } catch (error) {
      console.error("Post event failed:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, "issues"), {
        ...issueData,
        userUid: user?.uid,
        userName: profile.displayName || "Neighbor",
        userEmail: user?.email,
        status: "open",
        createdAt: new Date().toISOString(),
      });
      setIsIssueModalOpen(false);
      setIssueData({ type: "bug", description: "" });
      alert("Thank you for your report. Our team will look into it promptly.");
    } catch (error) {
      console.error("Report issue failed:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to remove this event?")) return;
    try {
      await deleteDoc(doc(db, "events", id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const startEditEvent = (ev: any) => {
    setEditingEvent(ev);
    setEventData({ 
      title: ev.title, 
      description: ev.description, 
      date: ev.date || "", 
      time: ev.time || "", 
      location: ev.location || "",
      email: ev.email || "",
      phone: ev.phone || ""
    });
    setIsEventModalOpen(true);
  };

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, "assistanceRequests"), {
        ...requestData,
        userUid: user?.uid,
        userName: requestData.isAnonymous 
          ? (profile.anonymousName || `Neighbor on ${profile.streetName}`) 
          : (profile.displayName || "Neighbor"),
        streetName: profile.streetName,
        natureIcon: profile.natureIcon,
        status: "open",
        connectedHelperUid: null,
        createdAt: new Date().toISOString(),
      });
      setIsRequestModalOpen(false);
      setRequestData({ title: "", description: "", contactPreference: "", isAnonymous: false });
    } catch (error) {
      console.error("Post request failed:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-sand flex flex-col p-4 md:p-[60px]">
      <GlobalNav />
      {/* Deeds Modal */}
      <AnimatePresence>
        {isDeedsModalOpen && (
          <DeedsModal 
            onClose={() => setIsDeedsModalOpen(false)}
            myClaims={myClaims}
            myActiveRequests={myActiveRequests}
            processingId={processingId}
            onClaim={toggleClaim}
            onHelpClaim={toggleHelpClaim}
            onReqClaim={toggleRequestConnection}
            onResolve={resolveRequest}
          />
        )}
      </AnimatePresence>

      {/* Main Main Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mt-4">
        
        {/* Left Sidebar - Navigation */}
        <aside className="lg:col-span-3 space-y-8">
          <nav className="hidden lg:block space-y-1 bg-paper/50 p-2 rounded-[32px] border-2 border-black/5">
            <NavItem icon={<LogOut size={18} />} label="Feed" active={activeTab === "feed"} onClick={() => setActiveTab("feed")} />
            <NavItem icon={<MapPin size={18} />} label="Freebies" active={activeTab === "resources"} onClick={() => setActiveTab("resources")} />
            <NavItem icon={<Calendar size={18} />} label="Events" active={activeTab === "events"} onClick={() => setActiveTab("events")} />
            <NavItem icon={<Building2 size={18} />} label="Directory" active={activeTab === "directory"} onClick={() => setActiveTab("directory")} />
            <NavItem icon={<Heart size={18} />} label="Help Offers" active={activeTab === "offers"} onClick={() => setActiveTab("offers")} />
            <NavItem icon={<Info size={18} />} label="A.B.C Club" active={activeTab === "club"} onClick={() => setActiveTab("club")} />
            {profile?.role === "business" && (
              <NavItem icon={<Shield size={18} />} label="Manage Freebies" active={activeTab === "manage"} onClick={() => setActiveTab("manage")} />
            )}
          </nav>
          
          {profile?.role === "business" && (
            <div className="bg-paper p-6 rounded-[32px] border-4 border-ink shadow-xl">
              <div className="text-[10px] uppercase tracking-widest text-sage font-bold mb-4">Business Dashboard</div>
              <Link to="/business/manage" className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-forest text-paper rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-opacity-90 transition-all mb-3 text-center">
                Manage Listing
              </Link>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => setIsPostModalOpen(true)}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-forest text-forest rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-forest hover:text-paper transition-all"
                >
                  <Plus size={18} /> Post Freebie
                </button>
                <button 
                  onClick={() => { setEditingEvent(null); setEventData({ title: "", description: "", date: "", time: "", location: "", email: "", phone: "" }); setIsEventModalOpen(true); }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-sage text-sage rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-sage hover:text-paper transition-all"
                >
                  <Calendar size={18} /> Post Event
                </button>
              </div>

              {/* Business Active Deeds */}
              {(myClaims.length > 0 || myActiveRequests.length > 0) && (
                <div className="mt-6 pt-6 border-t border-sage/10">
                  <button 
                    onClick={handleDeedToggle}
                    className="w-full flex items-center justify-between group px-2 py-3 hover:bg-sand rounded-2xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {myClaims.length > 0 && (
                          <div className="w-6 h-6 rounded-full bg-sage/20 flex items-center justify-center text-[10px] font-black text-forest border border-forest/10 shadow-sm">
                            {myClaims.length}
                          </div>
                        )}
                        {myActiveRequests.length > 0 && (
                          <motion.div 
                            animate={myActiveRequests.some(r => r.isNew) ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
                            transition={myActiveRequests.some(r => r.isNew) ? { repeat: Infinity, duration: 2 } : {}}
                            className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-black text-white shadow-md border border-white"
                          >
                            {myActiveRequests.length}
                          </motion.div>
                        )}
                      </div>
                      <span className="font-serif text-xl text-forest">Active Deeds</span>
                    </div>
                    <ArrowRight size={18} className="text-sage opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              )}
            </div>
          )}

          {profile?.role === "neighbor" && (
            <div className="bg-paper p-6 rounded-[32px] border-4 border-ink shadow-xl">
              <div className="text-[10px] uppercase tracking-widest text-sage font-bold mb-4">Neighbor Actions</div>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => setIsHelpModalOpen(true)}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-forest text-paper rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-opacity-90 transition-all font-sans"
                >
                  <Heart size={18} /> Offer Help
                </button>
                <button 
                  onClick={() => { setEditingEvent(null); setEventData({ title: "", description: "", date: "", time: "", location: "", email: "", phone: "" }); setIsEventModalOpen(true); }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-sage text-sage rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-sage hover:text-paper transition-all"
                >
                  <Calendar size={18} /> Post Event
                </button>
              </div>

              {/* Neighbor Active Deeds */}
              {(myClaims.length > 0 || myActiveRequests.length > 0) && (
                <div className="mt-6 pt-6 border-t border-sage/10">
                  <button 
                    onClick={handleDeedToggle}
                    className="w-full flex items-center justify-between group px-2 py-3 hover:bg-sand rounded-2xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {myClaims.length > 0 && (
                          <div className="w-6 h-6 rounded-full bg-sage/20 flex items-center justify-center text-[10px] font-black text-forest border border-forest/10 shadow-sm">
                            {myClaims.length}
                          </div>
                        )}
                        {myActiveRequests.length > 0 && (
                          <motion.div 
                            animate={myActiveRequests.some(r => r.isNew) ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
                            transition={myActiveRequests.some(r => r.isNew) ? { repeat: Infinity, duration: 2 } : {}}
                            className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-black text-white shadow-md border border-white"
                          >
                            {myActiveRequests.length}
                          </motion.div>
                        )}
                      </div>
                      <span className="font-serif text-xl text-forest">Active Deeds</span>
                    </div>
                    <ArrowRight size={18} className="text-sage opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <section className="lg:col-span-6 space-y-8">
          {/* Mobile Category Chips */}
          <div className="lg:hidden flex flex-col gap-2">
            <div className="flex overflow-x-auto pb-2 -mx-2 md:mx-0 gap-2 scrollbar-hide no-scrollbar items-center">
              {[
                { id: "feed", label: "Feed" },
                { id: "resources", label: "Freebies" },
                { id: "events", label: "Events" },
                { id: "directory", label: "Directory" },
                { id: "offers", label: "Help" },
                { id: "club", label: "Club" },
                ...(profile?.role === "business" ? [{ id: "manage", label: "Manage" }] : [])
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setActiveTab(chip.id as any)}
                  className={`flex-shrink-0 px-6 py-2.5 rounded-full border-2 font-bold text-[10px] uppercase tracking-widest transition-all ${
                    activeTab === chip.id 
                      ? "bg-forest border-forest text-paper shadow-md shadow-forest/20" 
                      : "border-sage/20 text-sage hover:border-forest/40"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            
            {/* Quick Jump Bar */}
            <div className="flex overflow-x-auto gap-6 py-3 border-b border-sage/10 scrollbar-hide no-scrollbar -mx-2 md:mx-0 px-2">
              <button onClick={() => scrollToSection('feed', 'feed-events')} className="whitespace-nowrap text-[9px] font-semibold text-sage hover:text-forest uppercase tracking-widest transition-colors flex items-center gap-1.5 active:scale-95 shadow-text-pop">
                <div className="w-1 h-1 bg-forest rounded-full" /> Jump to Events
              </button>
              <button onClick={() => scrollToSection('feed', 'feed-resources')} className="whitespace-nowrap text-[9px] font-semibold text-sage hover:text-forest uppercase tracking-widest transition-colors flex items-center gap-1.5 active:scale-95 shadow-text-pop">
                <div className="w-1 h-1 bg-forest rounded-full" /> Newest Freebies
              </button>
              <button onClick={() => scrollToSection('directory')} className="whitespace-nowrap text-[9px] font-semibold text-sage hover:text-forest uppercase tracking-widest transition-colors flex items-center gap-1.5 active:scale-95 shadow-text-pop">
                <div className="w-1 h-1 bg-forest rounded-full" /> Business Directory
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-forest" size={48} /></div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "feed" && (
                <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="mb-10 pt-8">
                    <h1 className="text-4xl md:text-5xl font-serif text-forest leading-[1.1] mb-2">
                      {getGreeting()}, <span className="text-forest/80">{profile?.displayName?.split(' ')[0] || 'Neighbor'}!</span>
                    </h1>
                    <div className="w-full pt-3 mt-4 border-t border-sage/20 flex items-center justify-between">
                      <p className="text-sage font-sans font-semibold tracking-wide text-sm shadow-text-pop">
                        {events.length} New Events <span className="text-forest mx-1">•</span> {resources.length} Freebies <span className="text-forest mx-1">•</span> {assistanceRequests.length} Help Requests
                      </p>
                    </div>
                  </div>
                  
                  {resources.length === 0 && events.length === 0 && helpOffers.length === 0 && assistanceRequests.length === 0 && (
                    <EmptyState message="It's a quiet day in the ALT! Why not post a help offer or start a conversation?" />
                  )}

                  {resources.length > 0 && (
                    <div id="feed-resources" className="scroll-mt-32">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-px bg-sage/20 flex-1" />
                        <span className="text-[10px] font-black text-sage uppercase tracking-[0.2em]">Newest Freebies</span>
                        <div className="h-px bg-sage/20 flex-1" />
                      </div>
                      <div className="space-y-6">
                        {resources.slice(0, 5).map(r => {
                          const biz = businesses.find(b => b.id === r.businessId || b.ownerUid === r.businessId || b.id === r.id);
                          return (
                            <FeedItem 
                              key={r.id} 
                              title={r.title} 
                              business={r.businessName} 
                              businessId={biz?.id}
                              description={r.description} 
                              type={r.type} 
                              isClaimed={r.claimedBy?.includes(user?.uid)}
                              onClaim={() => toggleClaim(r.id, r.claimedBy?.includes(user?.uid))}
                              isLoading={processingId === r.id}
                              isOwner={r.ownerUid === user?.uid}
                              phone={biz?.phone}
                              quantity={r.quantity}
                              isVerified={biz?.verified}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {helpOffers.length > 0 && (
                    <div className="space-y-6">
                      {helpOffers.slice(0, 5).map(h => {
                        const offerProfile = allUsers.find(u => u.uid === h.userUid);
                        return (
                          <FeedItem 
                            key={h.id} 
                            title={`Community Offer: ${h.capacity}`} 
                            business={h.userName} 
                            description={h.description} 
                            type="help" 
                            contactPreference={h.contactPreference}
                            natureIcon={h.natureIcon}
                            streetName={h.streetName}
                            isClaimed={h.claimedBy?.includes(user?.uid)}
                            onClaim={() => toggleHelpClaim(h.id, h.claimedBy?.includes(user?.uid))}
                            isLoading={processingId === h.id}
                            email={offerProfile?.email}
                            phone={offerProfile?.phone}
                            isOwner={h.userUid === user?.uid}
                            isVerified={offerProfile?.verified || offerProfile?.role === 'master-admin' || offerProfile?.role === 'business'}
                            claimedBy={h.claimedBy}
                            onEdit={() => startEditHelpOffer(h)}
                            onDelete={() => deleteHelpOffer(h.id)}
                            onViewClaims={() => viewHelpOfferClaims(h)}
                          />
                        );
                      })}
                    </div>
                  )}

                  {events.length > 0 && (
                    <div id="feed-events" className="scroll-mt-32">
                      <div className="flex items-center gap-3 mb-4 pt-10">
                        <div className="h-px bg-sage/20 flex-1" />
                        <span className="text-[10px] font-black text-sage uppercase tracking-[0.2em]">Upcoming Events</span>
                        <div className="h-px bg-sage/20 flex-1" />
                      </div>
                      <div className="space-y-6">
                        {events.slice(0, 5).map(e => {
                          const creator = allUsers.find(u => u.uid === e.creatorUid);
                          return (
                            <FeedItem 
                              key={e.id} 
                              title={e.title} 
                              business="Community Event" 
                              description={e.description} 
                              type="event" 
                              email={e.email || creator?.email}
                              phone={e.phone || creator?.phone}
                              date={e.date}
                              time={e.time}
                              location={e.location}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {assistanceRequests.slice(0, 5).map(req => {
                    const requester = allUsers.find(u => u.uid === req.userUid);
                    const isConnected = req.connectedHelperUid === user?.uid;
                    return (
                      <FeedItem 
                        key={req.id} 
                        title={req.title} 
                        business={req.userName} 
                        description={req.description} 
                        type="request" 
                        contactPreference={req.contactPreference}
                        streetName={req.streetName}
                        isAnonymous={req.isAnonymous}
                        natureIcon={req.natureIcon}
                        email={requester?.email}
                        phone={requester?.phone}
                        isVerified={requester?.verified || requester?.role === 'master-admin' || requester?.role === 'business'}
                        helperUid={req.connectedHelperUid}
                        onConnect={() => toggleRequestConnection(req.id, isConnected)}
                        isLoading={processingId === req.id}
                        isOwner={req.userUid === user?.uid}
                      />
                    );
                  })}
                </motion.div>
              )}

              {activeTab === "events" && (
                <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="flex flex-col gap-6 mb-2">
                    <h2 className="text-3xl font-serif text-forest text-center md:text-left">Community Events</h2>
                    <div className="flex justify-center w-full">
                      <div className="flex bg-sand/50 p-1 rounded-full border border-sage/10 shadow-inner">
                        <button 
                          onClick={() => { setEventViewMode("list"); setCalendarSelectedDate(null); }}
                          className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${eventViewMode === "list" ? "bg-forest text-paper shadow-lg" : "text-sage hover:text-forest"}`}
                        >
                          List
                        </button>
                        <button 
                          onClick={() => setEventViewMode("calendar")}
                          className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${eventViewMode === "calendar" ? "bg-forest text-paper shadow-lg" : "text-sage hover:text-forest"}`}
                        >
                          Calendar
                        </button>
                      </div>
                    </div>
                  </div>

                  {eventViewMode === "calendar" && (
                    <CalendarGrid 
                      events={events} 
                      selectedDate={calendarSelectedDate} 
                      onSelectDate={setCalendarSelectedDate} 
                    />
                  )}
                  
                  <div className="grid gap-6">
                    {(calendarSelectedDate ? events.filter(e => e.date === calendarSelectedDate) : events).length > 0 ? (
                      (calendarSelectedDate ? events.filter(e => e.date === calendarSelectedDate) : events).map(e => (
                        <EventCard 
                          key={e.id} 
                          event={e} 
                          isOwner={e.creatorUid === user?.uid}
                          onEdit={() => startEditEvent(e)}
                          onDelete={() => deleteEvent(e.id)}
                        />
                      ))
                    ) : (
                      <EmptyState message="It's a quiet day in the ALT! Why not post a help offer or start a conversation?" />
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "offers" && (
                <motion.div key="offers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <h2 className="text-3xl font-serif text-forest">Help Offers</h2>
                  <div className="grid gap-4">
                    {helpOffers.map(o => (
                      <HelpOfferCard 
                        key={o.id} 
                        offer={o} 
                        isClaimed={o.claimedBy?.includes(user?.uid)}
                        onClaim={() => toggleHelpClaim(o.id, o.claimedBy?.includes(user?.uid))}
                        isLoading={processingId === o.id}
                        isOwner={o.userUid === user?.uid}
                        onEdit={() => startEditHelpOffer(o)}
                        onDelete={() => deleteHelpOffer(o.id)}
                        onViewClaims={() => viewHelpOfferClaims(o)}
                      />
                    ))}
                    {helpOffers.length === 0 && <EmptyState message="It's a quiet day in the ALT! Why not post a help offer or start a conversation?" />}
                  </div>
                </motion.div>
              )}

              {activeTab === "resources" && (
                <motion.div key="resources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <h2 className="text-3xl font-serif text-forest">Community Freebies</h2>
                  <p className="text-sm text-ink/60 font-medium">Available support items from verified ALT businesses.</p>
                  <div className="grid gap-4">
                    {resources.map(r => {
                      const biz = businesses.find(b => b.id === r.businessId || b.ownerUid === r.businessId || b.id === r.id);
                      const ownerProfile = biz ? allUsers.find(u => u.uid === biz.ownerUid) : null;
                      return (
                        <ResourceCard 
                          key={r.id} 
                          title={r.title} 
                          business={r.businessName} 
                          businessId={biz?.id}
                          description={r.description} 
                          isClaimed={r.claimedBy?.includes(user?.uid)}
                          onClaim={() => toggleClaim(r.id, r.claimedBy?.includes(user?.uid))}
                          logo={biz?.logo}
                          natureIcon={ownerProfile?.natureIcon}
                          claimCount={r.claimedBy?.length || 0}
                          quantity={r.quantity}
                          isLoading={processingId === r.id}
                          isOwner={r.ownerUid === user?.uid}
                        />
                      );
                    })}
                    {resources.length === 0 && <EmptyState message="It's a quiet day in the ALT! Why not post a help offer or start a conversation?" />}
                  </div>
                </motion.div>
              )}

              {activeTab === "directory" && (
                <motion.div key="directory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <h2 className="text-3xl font-serif text-forest">Business Directory</h2>
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sage" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search businesses..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-sage bg-paper focus:outline-none focus:border-forest" 
                    />
                  </div>
                  <div className="flex flex-col gap-3 w-full">
                    {filteredBusinesses.map(b => (
                      <DirectoryItem 
                        key={b.id} 
                        id={b.id}
                        name={b.name} 
                        category={b.category} 
                        phone={b.phone} 
                        logo={b.logo} 
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "club" && (
                <motion.div key="club" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-paper p-10 rounded-[40px] border-4 border-ink shadow-xl relative">
                  {isMasterAdmin && (
                    <button 
                      onClick={startEditClub}
                      className="absolute top-6 right-6 p-2 bg-sand text-forest rounded-xl hover:bg-forest hover:text-paper transition-all"
                    >
                      <Plus size={18} />
                    </button>
                  )}
                  <h2 className="text-4xl font-serif text-forest mb-6">{clubInfo.title || "About A.B.C"}</h2>
                  <p className="text-lg leading-relaxed text-ink/80 mb-6 font-medium">
                    {clubInfo.description}
                  </p>
                  
                  {clubInfo.mission && (
                    <div className="bg-sand/30 p-6 rounded-3xl border-l-8 border-forest mb-10 shadow-sm">
                      <div className="text-[10px] font-black uppercase tracking-widest text-forest/40 mb-2">Our Mission</div>
                      <p className="text-2xl font-serif text-forest leading-tight">"{clubInfo.mission}"</p>
                    </div>
                  )}

                  <div className="space-y-6 mt-10 border-t border-forest/10 pt-10">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-sand rounded-lg text-forest"><Shield size={20} /></div>
                      <div>
                        <h4 className="font-bold text-forest uppercase tracking-widest text-xs mb-1">Verified Residency</h4>
                        <p className="text-sm text-ink/70">Every member is a vetted ALT resident, ensuring a safe and trusted network.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 mt-8">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-sage">Contact Club:</div>
                      <div className="flex items-center gap-4">
                        {clubInfo.email && (
                          <a 
                            href={`mailto:${clubInfo.email}`} 
                            title={`Email: ${clubInfo.email}`}
                            className="w-12 h-12 flex items-center justify-center bg-sand/40 text-forest rounded-2xl hover:bg-forest hover:text-paper transition-all border border-forest/5 group relative"
                          >
                            <Mail size={20} />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-forest text-paper text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold uppercase tracking-widest z-10">Email</span>
                          </a>
                        )}
                        
                        {clubInfo.phone && (
                          <a 
                            href={`tel:${clubInfo.phone}`} 
                            title={`Phone: ${clubInfo.phone}`}
                            className="w-12 h-12 flex items-center justify-center bg-sand/40 text-forest rounded-2xl hover:bg-forest hover:text-paper transition-all border border-forest/5 group relative"
                          >
                            <Phone size={20} />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-forest text-paper text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold uppercase tracking-widest z-10">Call</span>
                          </a>
                        )}

                        {clubInfo.website && (
                          <a 
                            href={clubInfo.website.startsWith('http') ? clubInfo.website : `https://${clubInfo.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            title={`Website: ${clubInfo.website}`}
                            className="w-12 h-12 flex items-center justify-center bg-sand/40 text-forest rounded-2xl hover:bg-forest hover:text-paper transition-all border border-forest/5 group relative"
                          >
                            <Globe size={20} />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-forest text-paper text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold uppercase tracking-widest z-10">Visit</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "manage" && profile?.role === "business" && (
                <motion.div key="manage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                  <section>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-3xl font-serif text-forest">Manage Your Freebies</h2>
                      <button 
                        onClick={() => { setEditingResource(null); setPostData({ title: "", description: "", type: "resource", quantity: 1 }); setIsPostModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-forest text-paper rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-opacity-90 transition-all"
                      >
                        <Plus size={16} /> New Freebie
                      </button>
                    </div>
                    <div className="grid gap-4">
                      {resources.filter(r => r.ownerUid === user?.uid || r.businessId === user?.uid).map(r => (
                        <div key={r.id} className="bg-paper p-6 rounded-[32px] border-2 border-sage/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-serif text-xl text-forest">{r.title}</h4>
                              <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${r.type === 'resource' ? 'bg-sage text-paper' : 'bg-forest text-paper'}`}>
                                {r.type}
                              </span>
                            </div>
                            <p className="text-sm text-ink/70 font-medium leading-relaxed">{r.description}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="text-[8px] font-bold text-sage uppercase tracking-widest bg-sand px-2 py-1 rounded-lg">
                                {r.claimedBy?.length || 0} / {r.quantity || 1} claimed
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full md:w-auto">
                            <button onClick={() => startEditResource(r)} className="flex-1 md:flex-none px-6 py-3 bg-sand text-forest rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-forest hover:text-paper transition-all">Edit</button>
                            <button onClick={() => deleteResource(r.id)} className="flex-1 md:flex-none px-6 py-3 bg-red-50 text-red-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-paper transition-all">Delete</button>
                          </div>
                        </div>
                      ))}
                      {resources.filter(r => r.ownerUid === user?.uid || r.businessId === user?.uid).length === 0 && (
                        <div className="p-12 text-center bg-paper/50 rounded-[40px] border-4 border-dashed border-sage">
                          <p className="font-serif text-xl text-sage">You haven't posted any resources yet.</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <h2 className="text-3xl font-serif text-forest mb-8">Neighbors Interested in Your Freebies</h2>
                    <div className="grid gap-4">
                      {resources
                        .filter(r => (r.ownerUid === user?.uid || r.businessId === user?.uid) && r.claimedBy?.length > 0)
                        .flatMap(r => r.claimedBy.map((uid: string) => ({ resourceTitle: r.title, neighborUid: uid, resourceId: r.id })))
                        .map((claim: any) => {
                          const neighbor = allUsers.find(u => u.uid === claim.neighborUid);
                          return (
                            <ClaimedOfferCard 
                              key={`${claim.resourceId}-${claim.neighborUid}`}
                              title={claim.resourceTitle}
                              neighborName={neighbor?.displayName || neighbor?.anonymousName || "Neighbor"}
                              neighborStreet={neighbor?.streetName || "Auburn Lake Trails"}
                              neighborEmail={neighbor?.email}
                              natureIcon={neighbor?.natureIcon}
                            />
                          );
                        })}
                      {resources.filter(r => (r.ownerUid === user?.uid || r.businessId === user?.uid) && r.claimedBy?.length > 0).length === 0 && (
                        <div className="p-12 text-center bg-sand/20 rounded-[40px] border-2 border-sage/10">
                          <p className="text-sm text-sage font-bold uppercase tracking-widest">No claims yet. Your freebies will appear here once neighbors express interest.</p>
                        </div>
                      )}
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </section>

        {/* Right Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-paper p-8 rounded-[32px] border border-ink shadow-soft-glow">
            <h3 className="font-serif text-xl text-forest mb-6">Favorites</h3>
            <div className="space-y-4">
              {profile?.favorites?.length ? profile.favorites.map((f: string) => {
                const biz = businesses.find(b => b.name === f);
                return (
                  <FavoriteItem 
                    key={f} 
                    name={f} 
                    phone={biz?.phone} 
                    onRemove={async () => { await toggleFavorite(f); }}
                  />
                );
              }) : (
                <p className="text-[10px] text-sage font-bold uppercase tracking-widest">No favorites yet</p>
              )}
            </div>
          </div>

          <div className="bg-forest p-8 rounded-[32px] text-paper shadow-soft-glow border border-white/10">
            <h3 className="font-serif text-xl mb-4">Need Help?</h3>
            <p className="text-xs opacity-80 leading-relaxed mb-6">Are you an elderly resident or in a "wild crazy situation"? Our community is here for you.</p>
            <button 
              onClick={() => setIsRequestModalOpen(true)}
              className="w-full py-3 bg-paper text-forest rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-sand transition-all shadow-soft-glow"
            >
              Request Assistance
            </button>
          </div>

          <div className="bg-[#8d967a] p-8 rounded-[32px] text-paper shadow-soft-glow border border-white/10">
            <h3 className="font-serif text-xl mb-4">Report an Issue</h3>
            <p className="text-xs opacity-80 leading-relaxed mb-6">Support our mission of safety and excellence. Report website bugs or questionable behavior.</p>
            <button 
              onClick={() => setIsIssueModalOpen(true)}
              className="w-full py-3 bg-paper text-[#8d967a] rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-sand transition-all shadow-soft-glow"
            >
              Report Issue
            </button>
          </div>
        </aside>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isPostModalOpen && (
          <Modal title="Post Community Freebie" onClose={() => setIsPostModalOpen(false)}>
            <form onSubmit={handlePostResource} className="space-y-4">
              <Input label="Freebie Title" placeholder="e.g. Free Plumbing Advice" value={postData.title} onChange={(v) => setPostData({ ...postData, title: v })} />
              <TextArea label="Short Description" placeholder="Keep it brief (e.g. 2 sentences)..." value={postData.description} onChange={(v) => setPostData({ ...postData, description: v })} />
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-widest text-sage font-bold mb-2 block">Type</label>
                  <div className="flex gap-2">
                    <TypeButton active={postData.type === "resource"} onClick={() => setPostData({ ...postData, type: "resource" })}>Resource</TypeButton>
                    <TypeButton active={postData.type === "service"} onClick={() => setPostData({ ...postData, type: "service" })}>Service</TypeButton>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-widest text-sage font-bold mb-2 block">Quantity Available</label>
                  <input 
                    type="number" 
                    min="1"
                    value={postData.quantity}
                    onChange={(e) => setPostData({ ...postData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-sage bg-paper font-bold text-forest focus:outline-none focus:border-forest"
                  />
                </div>
              </div>
              <SubmitButton loading={isPosting}>Post to Community</SubmitButton>
            </form>
          </Modal>
        )}

        {isHelpModalOpen && (
          <Modal title={editingHelpOffer ? "Edit Help Offer" : "Offer Your Help"} onClose={() => { setIsHelpModalOpen(false); setEditingHelpOffer(null); }}>
            <form onSubmit={handlePostHelp} className="space-y-4">
              <Input label="What can you help with?" placeholder="e.g. Grocery runs, yard work..." value={helpData.capacity} onChange={(v) => setHelpData({ ...helpData, capacity: v })} />
              <TextArea label="Details" placeholder="Tell neighbors more about your availability..." value={helpData.description} onChange={(v) => setHelpData({ ...helpData, description: v })} />
              <Input label="How should neighbors contact you?" placeholder="e.g. Text me at 555-0123 or knock on door" value={helpData.contactPreference} onChange={(v) => setHelpData({ ...helpData, contactPreference: v })} />
              <SubmitButton loading={isPosting}>{editingHelpOffer ? "Save Changes" : "Post Help Offer"}</SubmitButton>
            </form>
          </Modal>
        )}

        {isEventModalOpen && (
          <Modal title={editingEvent ? "Edit Community Event" : "Post Community Event"} onClose={() => { setIsEventModalOpen(false); setEditingEvent(null); }}>
            <form onSubmit={handlePostEvent} className="space-y-4">
              <Input label="Event Title" placeholder="e.g. Neighborhood BBQ" value={eventData.title} onChange={(v) => setEventData({ ...eventData, title: v })} />
              <TextArea label="Description" placeholder="What's happening?" value={eventData.description} onChange={(v) => setEventData({ ...eventData, description: v })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Date" type="date" value={eventData.date} onChange={(v) => setEventData({ ...eventData, date: v })} />
                <Input label="Time" placeholder="e.g. 2:00 PM" value={eventData.time} onChange={(v) => setEventData({ ...eventData, time: v })} />
              </div>
              <Input label="Location" placeholder="e.g. Community Center" value={eventData.location} onChange={(v) => setEventData({ ...eventData, location: v })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Contact Email (Optional)" placeholder="e.g. hello@event.com" value={eventData.email} onChange={(v) => setEventData({ ...eventData, email: v })} />
                <Input label="Contact Phone (Optional)" placeholder="e.g. 555-0123" value={eventData.phone} onChange={(v) => setEventData({ ...eventData, phone: v })} />
              </div>
              <SubmitButton loading={isPosting}>{editingEvent ? "Save Changes" : "Post Event"}</SubmitButton>
            </form>
          </Modal>
        )}

        {isRequestModalOpen && (
          <Modal title="Request Assistance" onClose={() => setIsRequestModalOpen(false)}>
            <form onSubmit={handlePostRequest} className="space-y-4">
              <Input label="What do you need help with?" placeholder="e.g. Emergency plumbing, elderly care..." value={requestData.title} onChange={(v) => setRequestData({ ...requestData, title: v })} />
              <TextArea label="Details" placeholder="Describe your situation so neighbors can help..." value={requestData.description} onChange={(v) => setRequestData({ ...requestData, description: v })} />
              <Input label="Instructions for help" placeholder="e.g. Please drop off at porch, no contact needed" value={requestData.contactPreference} onChange={(v) => setRequestData({ ...requestData, contactPreference: v })} />
              
              <div className="p-4 bg-sand/50 rounded-2xl flex items-center justify-between border-2 border-sage/20">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-forest">Post Anonymously</div>
                  <p className="text-[8px] text-sage font-medium mt-1">Hide your name from the community feed</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setRequestData({ ...requestData, isAnonymous: !requestData.isAnonymous })}
                  className={`w-12 h-6 rounded-full relative transition-all ${requestData.isAnonymous ? 'bg-forest' : 'bg-sage/30'}`}
                >
                  <motion.div 
                    animate={{ x: requestData.isAnonymous ? 24 : 4 }}
                    className="absolute top-1 left-0 w-4 h-4 bg-paper rounded-full shadow-sm"
                  />
                </button>
              </div>

              <div className="flex items-center gap-2 px-2 py-4">
                <Shield className="text-forest" size={14} />
                <p className="text-[9px] text-sage font-bold leading-tight uppercase tracking-wider">
                  Posted Anonymously. Note: Your identity and contact info will only be shared with the neighbor who offers to help.
                </p>
              </div>

              <SubmitButton loading={isPosting}>Submit Request</SubmitButton>
            </form>
          </Modal>
        )}

        {isIssueModalOpen && (
          <Modal title="Report an Issue" onClose={() => setIsIssueModalOpen(false)}>
            <form onSubmit={handlePostIssue} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-sage font-bold block mb-2">Issue Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setIssueData({ ...issueData, type: 'bug' })}
                    className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border-2 ${issueData.type === 'bug' ? 'bg-forest text-paper border-forest' : 'border-sand text-sage'}`}
                  >
                    Website Bug
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIssueData({ ...issueData, type: 'behavior' })}
                    className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border-2 ${issueData.type === 'behavior' ? 'bg-forest text-paper border-forest' : 'border-sand text-sage'}`}
                  >
                    Questionable Behavior
                  </button>
                </div>
              </div>
              <TextArea 
                label="Description" 
                placeholder={issueData.type === 'bug' ? "What's not working correctly?" : "Describe the behavior or situation..."} 
                value={issueData.description} 
                onChange={(v) => setIssueData({ ...issueData, description: v })} 
              />
              <div className="bg-sand/30 p-4 rounded-2xl flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-forest/70 leading-relaxed font-medium">
                  Reports are handled by the A.B.C Club admin team. Thank you for contributing to our community's safety and digital integrity.
                </p>
              </div>
              <SubmitButton loading={isPosting}>Submit Report</SubmitButton>
            </form>
          </Modal>
        )}

        {isEditingClub && isMasterAdmin && (
          <Modal title="Edit Club Info" onClose={() => setIsEditingClub(false)}>
            <form onSubmit={handleSaveClubInfo} className="space-y-4">
              <Input label="Title" value={editClubData.title} onChange={(v) => setEditClubData({ ...editClubData, title: v })} />
              <TextArea label="Club Description" value={editClubData.description} onChange={(v) => setEditClubData({ ...editClubData, description: v })} />
              <Input label="Mission Statement" value={editClubData.mission} onChange={(v) => setEditClubData({ ...editClubData, mission: v })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Club Email" value={editClubData.email || ""} onChange={(v) => setEditClubData({ ...editClubData, email: v })} />
                <Input label="Club Phone" value={editClubData.phone || ""} onChange={(v) => setEditClubData({ ...editClubData, phone: v })} />
              </div>
              <Input label="Club Website" value={editClubData.website || ""} onChange={(v) => setEditClubData({ ...editClubData, website: v })} />
              <SubmitButton loading={false}>Save Changes</SubmitButton>
            </form>
          </Modal>
        )}

        {isOwnerWarningOpen && (
          <Modal title="Wait a second!" onClose={() => setIsOwnerWarningOpen(false)}>
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield size={32} />
              </div>
              <p className="text-forest font-serif text-xl mb-4">You can't claim your own freebie!</p>
              <p className="text-ink/60 text-sm leading-relaxed mb-8">
                As a business owner, these resources are intended for your neighbors. 
                You already manage this post from your dashboard.
              </p>
              <button 
                onClick={() => setIsOwnerWarningOpen(false)}
                className="w-full py-4 bg-forest text-paper rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-forest/20 transition-all"
              >
                Got it, thanks!
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none border-[20px] md:border-[30px] border-sand z-50 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)]"></div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-24 right-6 z-[200] flex flex-col items-end gap-3 pointer-events-none">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="flex flex-col gap-3 pointer-events-auto"
            >
              <button 
                onClick={() => { setIsFabOpen(false); setEditingEvent(null); setEventData({ title: "", description: "", date: "", time: "", location: "", email: "", phone: "" }); setIsEventModalOpen(true); }}
                className="flex items-center gap-3 px-6 py-3 bg-white/70 backdrop-blur-md rounded-2xl border border-forest/10 shadow-soft-glow group"
              >
                <span className="text-[10px] font-black text-forest uppercase tracking-widest">Post Event</span>
                <div className="p-2 bg-sand rounded-xl text-forest group-hover:bg-forest group-hover:text-paper transition-all">
                  <Calendar size={18} />
                </div>
              </button>
              <button 
                onClick={() => { setIsFabOpen(false); setIsHelpModalOpen(true); }}
                className="flex items-center gap-3 px-6 py-3 bg-white/70 backdrop-blur-md rounded-2xl border border-forest/10 shadow-soft-glow group"
              >
                <span className="text-[10px] font-black text-forest uppercase tracking-widest">Offer Help</span>
                <div className="p-2 bg-sand rounded-xl text-forest group-hover:bg-forest group-hover:text-paper transition-all">
                  <Heart size={18} />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`w-16 h-16 rounded-full bg-forest text-paper flex items-center justify-center shadow-xl pointer-events-auto transition-all ${isFabOpen ? 'rotate-45' : ''}`}
        >
          <Plus size={32} />
        </motion.button>
      </div>

      <AnimatePresence>
        {toast && <SuccessToast message={toast} />}
      </AnimatePresence>

      <AnimatePresence>
        {claimsModalData && (
          <Modal title="Interested Neighbors" onClose={() => setClaimsModalData(null)}>
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-widest text-sage font-bold mb-2">Potential help for:</div>
              <div className="p-4 bg-forest/5 rounded-2xl border border-forest/10 mb-6 font-serif text-lg text-forest italic leading-tight">
                "{claimsModalData.title}"
              </div>
              <div className="space-y-3">
                {claimsModalData.claimants.map(neighbor => (
                  <div key={neighbor.uid} className="p-4 bg-sand/30 rounded-2xl border border-sage/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-paper rounded-xl text-forest shadow-sm border border-sage/5">
                        {neighbor.natureIcon && NATURE_ICONS[neighbor.natureIcon] ? React.createElement(NATURE_ICONS[neighbor.natureIcon], { size: 16 }) : <Users size={16} />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-forest truncate">{neighbor.displayName || "Neighbor"}</div>
                        <div className="text-[8px] font-semibold text-sage uppercase tracking-widest truncate">{neighbor.streetName}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                      {neighbor.email && (
                        <a href={`mailto:${neighbor.email}`} className="text-forest hover:text-sage transition-all flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest bg-paper px-2 py-1 rounded-lg border border-sage/10">
                          <Mail size={10} /> Email
                        </a>
                      )}
                      {neighbor.phone && (
                        <a href={`tel:${neighbor.phone}`} className="text-forest hover:text-sage transition-all flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest bg-paper px-2 py-1 rounded-lg border border-sage/10">
                          <Phone size={10} /> Call
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {claimsModalData.claimants.length === 0 && (
                  <div className="text-center py-12 bg-sand/10 rounded-3xl border-2 border-dashed border-sage/20">
                    <p className="text-sage font-serif italic text-lg mb-2">No one has reached out yet</p>
                    <p className="text-[9px] uppercase tracking-widest font-bold text-sage/60">Community vibes are still warming up!</p>
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, key?: any }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all ${active ? 'bg-forest text-paper shadow-soft-glow' : 'text-forest hover:bg-sand'}`}
    >
      {icon} {label}
    </button>
  );
}

function ClaimedOfferCard({ title, neighborName, neighborStreet, neighborEmail, natureIcon }: { title: string, neighborName: string, neighborStreet: string, neighborEmail?: string, natureIcon?: string, key?: any }) {
  const Icon = natureIcon ? NATURE_ICONS[natureIcon] : TreePine;
  return (
    <div className="bg-paper p-6 rounded-3xl border border-forest/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-soft-glow hover:border-forest/30 transition-all">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-sand rounded-[30%_70%_70%_30%/50%_40%_60%_40%] text-forest border border-sage/10">
          <Icon size={24} />
        </div>
        <div>
          <div className="text-[8px] font-bold text-sage uppercase tracking-widest mb-1">Neighbor Claimed: {title}</div>
          <h4 className="font-serif text-xl text-forest">{neighborName}</h4>
          <p className="text-xs text-sage font-medium">{neighborStreet}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 items-end w-full md:w-auto">
        {neighborEmail && (
          <a href={`mailto:${neighborEmail}`} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-forest text-paper rounded-xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-md">
            <Mail size={14} /> Email Neighbor
          </a>
        )}
        <div className="text-[7px] text-sage font-black uppercase tracking-tighter italic">Process outreach to complete freebie</div>
      </div>
    </div>
  );
}

function FeedItem({ title, business, businessId, description, type, contactPreference, streetName, isAnonymous, natureIcon, isClaimed, onClaim, isLoading, isOwner, email, phone, quantity, date, time, location, isVerified, claimedBy, onEdit, onDelete, onViewClaims, helperUid, onConnect }: { title: string, business: string, businessId?: string, description: string, type: 'resource' | 'service' | 'event' | 'request' | 'help', key?: any, contactPreference?: string, streetName?: string, isAnonymous?: boolean, natureIcon?: string, isClaimed?: boolean, onClaim?: () => void, isLoading?: boolean, isOwner?: boolean, email?: string, phone?: string, quantity?: number, date?: string, time?: string, location?: string, isVerified?: boolean, claimedBy?: string[], onEdit?: () => void, onDelete?: () => void, onViewClaims?: () => void, helperUid?: string | null, onConnect?: () => void }) {
  const { user } = useUser();
  const smsBody = encodeURIComponent(`Hi ${business}! I'm your neighbor from ALT Business Connections. I'm interested in: ${title}`);
  
  // We'll use local variables for connection state if passed via props
  const isConnected = type === 'request' && !!helperUid;
  const isUserConnected = type === 'request' && helperUid === user?.uid;
  const isHelper = user?.uid === helperUid;
  const showIdentity = !isAnonymous || isOwner || isHelper;
  const displayBusiness = showIdentity ? business : "Neighbor in Need";
  const displayStreet = showIdentity ? streetName : "The Divide";
  const displayEmail = (type === 'request') ? ((isOwner || isHelper) ? email : undefined) : email;
  const displayPhone = (type === 'request') ? ((isOwner || isHelper) ? phone : undefined) : phone;
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) return `${month}/${day}/${year}`;
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  const Icon = natureIcon ? NATURE_ICONS[natureIcon] : (type === 'event' ? Calendar : Building2);

  const displayType = type === 'help' ? 'HELP OFFER' : (type === 'request' ? 'NEED HELP' : (type === 'resource' || type === 'service' ? 'FREEBIE' : type.toUpperCase()));

  return (
    <div className={`p-6 rounded-[32px] border relative overflow-hidden group hover:border-forest/20 transition-all shadow-soft-glow ${type === 'resource' ? 'bg-sage/5 border-sage/20' : 'bg-white/85 border-black/5'}`}>
      {/* Category Tag - Top Left */}
      <div className="flex justify-start mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand/30 text-forest rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-forest/5 shadow-sm">
          {displayType}
        </span>
      </div>

      {/* Branding Anchor Blob - Top Right */}
      <div className="absolute top-4 right-4">
        <div className="w-12 h-12 bg-sand rounded-[30%_70%_70%_30%/50%_40%_60%_40%] text-forest flex items-center justify-center border border-sage/10 shadow-soft-glow">
          {Icon && <Icon size={20} />}
        </div>
      </div>

      {/* Left-Aligned Typography */}
      <div className="pr-12 text-left space-y-3">
        {isAnonymous && type === 'request' && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-[7px] font-bold uppercase tracking-widest text-amber-700 rounded-lg mb-2">
            <Shield size={8} /> Identity Protected
          </div>
        )}

        {(type === 'resource' || type === 'service') ? (
          <h4 className="font-serif text-2xl font-semibold text-forest leading-tight mb-1">{title}</h4>
        ) : (
          <h4 className="font-serif text-2xl font-semibold text-forest leading-tight mb-1">{title}</h4>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            {type === 'event' ? (
              <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                <Calendar size={12} /> {formatDate(date)} {time && `@ ${time}`}
              </div>
            ) : (
              <div className="flex flex-col gap-1 items-start text-left">
                {businessId ? (
                  <div className="flex items-center gap-1.5">
                    <Link to={`/business/${businessId}`} className="text-[10px] font-semibold text-sage uppercase tracking-widest hover:text-forest transition-all underline decoration-sage/30 shadow-text-pop">{displayBusiness}</Link>
                    {isVerified && (
                      <div className="group/trust relative inline-flex items-center cursor-help">
                        <Leaf size={10} className="text-forest fill-forest/10" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-forest text-paper text-[8px] font-bold rounded opacity-0 group-hover/trust:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none uppercase tracking-widest">
                          Verified
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-sage uppercase tracking-widest shadow-text-pop">{displayBusiness}</span>
                    {isVerified && showIdentity && (
                      <div className="group/trust relative inline-flex items-center cursor-help">
                        <Leaf size={10} className="text-forest fill-forest/10" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-forest text-paper text-[8px] font-bold rounded opacity-0 group-hover/trust:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none uppercase tracking-widest">
                          Verified
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {displayStreet && (
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-sage/60 shadow-text-pop">{displayStreet}</span>
                )}
              </div>
            )}
          </div>
          
          {type === 'event' && location && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-sage uppercase tracking-widest">
              <MapPin size={12} className="text-forest" /> {location}
            </div>
          )}
        </div>

        <p className="text-ink/80 leading-relaxed font-medium text-sm line-clamp-3">
          {description}
        </p>

        {type === 'request' && contactPreference && (
          <div className="bg-sand/20 p-4 rounded-2xl border-l-4 border-forest">
            <div className="text-[8px] uppercase tracking-widest text-forest font-black mb-1">Assistance Instructions</div>
            <p className="text-xs text-forest/80 italic font-medium leading-relaxed">{contactPreference}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-sand/50">
        <div className="flex items-center gap-4 w-full">
          {(type === 'resource' || type === 'service' || type === 'help') ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                {quantity !== undefined && type === 'resource' && (
                  <div className="text-[10px] font-black uppercase tracking-widest text-sage">
                    {quantity} Available
                  </div>
                )}
                {isOwner ? (
                  <div className="flex flex-wrap gap-2">
                    {type === 'help' && (claimedBy?.length || 0) > 0 && (
                      <button 
                        onClick={onViewClaims}
                        className="px-4 py-2 bg-sand text-forest rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-forest hover:text-paper transition-all border border-forest/10 flex items-center gap-1.5"
                      >
                        <Users size={12} /> View Claims ({(claimedBy?.length || 0)})
                      </button>
                    )}
                    {onEdit && (
                      <button onClick={onEdit} className="px-4 py-2 bg-sand text-forest rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-forest hover:text-paper transition-all border border-forest/10">
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={onDelete} className="px-4 py-2 bg-red-50 text-red-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-paper transition-all border border-red-100">
                        Remove
                      </button>
                    )}
                    {!onEdit && !onDelete && !onViewClaims && <div className="text-[9px] font-black uppercase tracking-widest text-amber-600 italic">Your Post</div>}
                  </div>
                ) : (
                  <button 
                    disabled={isLoading}
                    onClick={onClaim}
                    className={`text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isClaimed ? 'text-forest' : 'text-sage hover:text-forest'}`}
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={12} /> : (isClaimed ? <><CheckCircle2 size={12} /> Claimed</> : <><Plus size={12} /> {type === 'help' ? 'Interested' : 'Claim'}</>)}
                  </button>
                )}
              </div>
              <div className="text-sage/20"><Heart size={12} fill="currentColor" /></div>
            </div>
          ) : (
            <div className="flex gap-4">
              {isConnected ? (
                <div className="flex items-center gap-4">
                  {isUserConnected ? (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-forest">
                      <CheckCircle2 size={14} className="text-forest" /> Connection Made!
                    </div>
                  ) : (
                    <div className="text-[9px] font-black uppercase tracking-widest text-sage italic">Neighbor Connected</div>
                  )}
                  {isHelper && (
                    <div className="flex gap-4">
                      {displayPhone && (
                        <a href={`sms:${displayPhone}?body=Hi Neighbor! I'm connecting to your assistance request on ALT: ${title}`} className="text-forest hover:text-sage transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                          <MessageSquare size={14} /> Text
                        </a>
                      )}
                      {displayEmail && (
                        <a href={`mailto:${displayEmail}`} className="text-forest hover:text-sage transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                          <Mail size={14} /> Email
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                isOwner ? (
                  <div className="text-[9px] font-black uppercase tracking-widest text-amber-600 italic">Waiting for connection...</div>
                ) : (
                  <button 
                    onClick={onConnect}
                    disabled={isLoading}
                    className="text-[10px] font-black uppercase tracking-widest text-forest hover:text-sage flex items-center gap-1.5"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={12} /> : <>Connect <ArrowRight size={12} /></>}
                  </button>
                )
              )}
            </div>
          )}
        </div>
        <div className="text-sage/20"><Heart size={12} fill="currentColor" /></div>
      </div>
    </div>
  );
}

function ResourceCard({ title, business, businessId, description, isClaimed, onClaim, logo, natureIcon, claimCount = 0, quantity = 1, isLoading, isOwner }: { title: string, business: string, businessId?: string, description: string, isClaimed: boolean, onClaim: () => void, key?: any, logo?: string, natureIcon?: string, claimCount?: number, quantity?: number, isLoading?: boolean, isOwner?: boolean }) {
  const isAvailable = quantity > claimCount;
  const Icon = natureIcon ? NATURE_ICONS[natureIcon] : Building2;
  
  return (
    <div className="bg-paper p-6 rounded-[32px] border border-forest/10 flex flex-col gap-4 hover:border-forest/30 transition-all shadow-soft-glow relative overflow-hidden group">
      {/* FREEBIE Badge - Top Left */}
      <div className="flex justify-start">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-amber-200/50 shadow-sm">
          <Sparkles size={8} /> FREEBIE
        </span>
      </div>

      {/* Business Logo Blob - Absolute Top Right */}
      <div className="absolute top-4 right-4">
        {businessId ? (
          <Link to={`/business/${businessId}`} className="block w-12 h-12 bg-sand rounded-[30%_70%_70%_30%/50%_40%_60%_40%] text-forest hover:bg-forest hover:text-paper transition-all shadow-soft-glow flex items-center justify-center border border-sage/10 group-alt">
            <Icon size={20} className="group-alt-hover:scale-110 transition-transform" />
          </Link>
        ) : (
          <div className="w-12 h-12 bg-sand rounded-[30%_70%_70%_30%/50%_40%_60%_40%] text-forest flex items-center justify-center border border-sage/10 shadow-soft-glow">
            <Icon size={20} />
          </div>
        )}
      </div>

      {/* Left-Aligned Content Area */}
      <div className="flex-1 flex flex-col items-start text-left pr-12">
        <div className="flex flex-col gap-1 w-full">
          <h4 className="font-serif text-2xl font-semibold text-forest leading-tight group-hover:text-forest/80 transition-colors">{title}</h4>
          
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 text-[8px] font-semibold rounded-full uppercase tracking-widest border ${isAvailable ? 'bg-forest/5 text-forest border-forest/20' : (isClaimed ? 'bg-forest/5 text-forest border-forest/20' : 'bg-red-50 text-red-500 border-red-200')}`}>
              {isClaimed ? 'You claimed this' : isAvailable ? `${quantity - claimCount} remaining` : 'Fully Claimed'}
            </span>
            {businessId ? (
              <Link to={`/business/${businessId}`} className="text-[10px] font-semibold text-sage hover:text-forest transition-all uppercase tracking-widest truncate max-w-[150px] shadow-text-pop">{business}</Link>
            ) : (
              <p className="text-[10px] font-semibold text-sage uppercase tracking-widest truncate max-w-[150px] shadow-text-pop">{business}</p>
            )}
          </div>
        </div>

        <div className="w-full mt-2">
          {businessId ? (
            <Link to={`/business/${businessId}`} className="group/link block">
              <p className="text-sm text-ink/70 font-medium line-clamp-2 leading-relaxed">
                {description}
              </p>
              <div className="mt-2 text-forest group-hover/link:translate-x-1 transition-transform text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 group-hover/link:underline decoration-2">
                Read more <ArrowRight size={12} />
              </div>
            </Link>
          ) : (
            <p className="text-sm text-ink/70 font-medium leading-relaxed">{description}</p>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-forest/5 mt-2">
        {isOwner ? (
          <div className="w-full text-center px-6 py-3 bg-paper border-2 border-amber-200 text-amber-600 rounded-2xl font-bold text-[9px] uppercase tracking-widest italic shadow-sm">
            Your Local Post
          </div>
        ) : (
          <button 
            disabled={isLoading || (!isAvailable && !isClaimed)}
            onClick={onClaim}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all ${isClaimed ? 'bg-forest text-paper shadow-lg shadow-forest/20' : isAvailable ? 'bg-forest text-paper hover:bg-forest/90 shadow-soft-glow' : 'bg-sage/20 text-sage cursor-not-allowed'}`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={14} /> : (isClaimed ? <><CheckCircle2 size={14} /> Claimed</> : isAvailable ? <><Plus size={14} /> Claim Freebie</> : 'Fully Claimed')}
          </button>
        )}
      </div>
    </div>
  );
}

function DirectoryItem({ id, name, category, phone, logo }: { id: string, name: string, category: string, phone: string, key?: any, logo?: string }) {
  const smsBody = encodeURIComponent(`Hi ${name}! I'm your neighbor from ALT Business Connections. I'm interested in your services...`);
  
  return (
    <div className="bg-white/85 p-2 rounded-xl border border-sage/10 group hover:border-forest/20 transition-all shadow-soft-glow w-full overflow-hidden flex flex-col gap-2">
      <div className="flex items-center gap-3 w-full">
        {/* Logo Anchor */}
        <motion.div 
          whileHover={{ scale: 1.15, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0"
        >
          <Link to={`/business/${id}`}>
            {logo ? (
              <img src={logo} alt={name} className="w-10 h-10 rounded-[30%_70%_70%_30%/50%_40%_60%_40%] object-cover border border-sage/20" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-[30%_70%_70%_30%/50%_40%_60%_40%] bg-sand/30 flex items-center justify-center text-forest border border-sage/20">
                <Building2 size={18} />
              </div>
            )}
          </Link>
        </motion.div>

        {/* Flexible Center */}
        <div className="flex-1 min-w-0">
          <Link to={`/business/${id}`} className="block min-w-0">
            <h4 className="font-serif text-sm font-bold text-forest truncate block leading-tight">
              {name}
            </h4>
            <CategoryTag label={category} small />
          </Link>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <a href={`tel:${phone}`} title="Call" className="p-1.5 bg-forest text-paper rounded-lg hover:opacity-90 transition-all shadow-soft-glow">
            <Phone size={14} />
          </a>
          <a href={`sms:${phone}?body=${smsBody}`} title="Text" className="p-1.5 bg-paper border border-forest/20 text-forest rounded-lg hover:bg-sand transition-all">
            <MessageSquare size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}

function FavoriteItem({ name, phone, onRemove }: { name: string, phone?: string, onRemove?: () => void | Promise<void>, key?: any }) {
  const smsBody = encodeURIComponent(`Hi ${name}! I'm your neighbor from ALT Business Connections...`);
  
  return (
    <div className="flex flex-col gap-2 p-3 bg-paper rounded-2xl border-2 border-sage/10 group hover:border-forest/20 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-forest">{name}</span>
        <button 
          onClick={onRemove}
          className="text-red-400 opacity-60 hover:opacity-100 transition-all"
        >
          <XCircle size={14} />
        </button>
      </div>
      
      {phone && (
        <div className="flex gap-2">
          <a 
            href={`tel:${phone}`} 
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-sand text-forest rounded-lg font-bold text-[8px] uppercase tracking-widest hover:bg-forest hover:text-paper transition-all"
          >
            <Phone size={10} /> Call
          </a>
          <a 
            href={`sms:${phone}?body=${smsBody}`} 
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-paper border border-sand text-forest rounded-lg font-bold text-[8px] uppercase tracking-widest hover:bg-sand transition-all"
          >
            <MessageSquare size={10} /> Text
          </a>
        </div>
      )}
    </div>
  );
}

// Helper Components
function DeedsModal({ 
  onClose, 
  myClaims, 
  myActiveRequests, 
  processingId, 
  onClaim, 
  onHelpClaim, 
  onReqClaim, 
  onResolve 
}: any) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-ink/60 backdrop-blur-md" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }} 
        className="bg-white/95 w-full max-w-2xl rounded-[32px] border border-ink/10 p-6 md:p-10 relative z-10 max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-sage hover:text-forest transition-colors"><X size={28} /></button>
        
        <div className="mb-8 pr-12 text-left">
          <h2 className="text-3xl md:text-4xl font-serif text-forest">Your Active Connections</h2>
          <p className="text-sage text-[10px] uppercase tracking-[0.3em] font-black mt-2">ALT Community Pulse</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-12 pb-8">
          {myClaims.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sage/60 shrink-0">Neighborhood Support</span>
                <div className="h-px bg-sage/10 flex-1" />
              </div>
              <div className="space-y-4">
                {myClaims.map((item: any) => (
                  <DeedModalCard 
                    key={item.id} 
                    item={item} 
                    processingId={processingId} 
                    onClaim={onClaim} 
                    onHelpClaim={onHelpClaim} 
                    onReqClaim={onReqClaim} 
                    onResolve={onResolve} 
                  />
                ))}
              </div>
            </div>
          )}

          {myActiveRequests.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600/60 shrink-0">Help For You</span>
                <div className="h-px bg-amber-200/30 flex-1" />
              </div>
              <div className="space-y-4">
                {myActiveRequests.map((item: any) => (
                  <DeedModalCard 
                    key={item.id} 
                    item={item} 
                    processingId={processingId} 
                    onClaim={onClaim} 
                    onHelpClaim={onHelpClaim} 
                    onReqClaim={onReqClaim} 
                    onResolve={onResolve} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DeedModalCard({ item, processingId, onClaim, onHelpClaim, onReqClaim, onResolve }: any) {
  const isGettingHelp = item.category === 'Getting Help';
  
  const handleComplete = () => {
    if (processingId === item.id) return;
    if (item.category === 'Freebie') onClaim(item.id, true);
    else if (item.category === 'Help Offer') onHelpClaim(item.id, true);
    else if (item.category === 'Help Request') onReqClaim(item.id, true);
    else if (item.category === 'Getting Help') onResolve(item.id);
  };

  const contactLink = item.realPhone ? `tel:${item.realPhone}` : 
                     (item.realEmail ? `mailto:${item.realEmail}` : 
                     (item.phone ? `tel:${item.phone}` : 
                     (item.email ? `mailto:${item.email}` : 
                     (item.helperPhone ? `tel:${item.helperPhone}` : 
                     (item.helperEmail ? `mailto:${item.helperEmail}` : null)))));

  return (
    <div className={`w-full relative bg-paper rounded-[32px] border transition-all p-8 shadow-sm flex flex-col gap-8 ${isGettingHelp ? 'border-amber-200/50 hover:shadow-md' : 'border-sage/20 hover:shadow-md'}`}>
      {/* X Button for canceling/closing */}
      <button 
        className="absolute top-4 right-4 text-sage/30 hover:text-red-400 transition-colors p-2"
        aria-label="Cancel Connection"
      >
        <X size={20} />
      </button>

      <div className="flex flex-col items-start gap-4 pr-10">
        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${isGettingHelp ? 'bg-amber-500 text-white' : 'bg-forest text-paper'}`}>
          {item.category}
        </span>
        
        <div className="text-left w-full">
          <h4 className="font-serif text-2xl font-bold text-forest leading-tight mb-2">
            {item.title}
          </h4>
          <div className="flex flex-col text-sage font-bold text-[11px] uppercase tracking-[0.2em] leading-relaxed">
            <span className="text-forest/90">{item.helperName || item.businessName || item.userName}</span>
            {item.streetName && <p className="italic opacity-70 mt-0.5">ALT Resident • {item.streetName}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-sand">
        {contactLink && (
          <a 
            href={contactLink}
            className={`w-full py-5 rounded-2xl font-bold text-[12px] uppercase tracking-widest text-center border transition-all flex items-center justify-center gap-3 ${isGettingHelp ? 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100 shadow-sm' : 'bg-paper text-forest border-forest hover:bg-sand/30 shadow-sm'}`}
          >
            <MessageSquare size={18} /> Send Message
          </a>
        )}
        <button 
          onClick={handleComplete}
          disabled={processingId === item.id}
          className={`w-full py-5 rounded-2xl font-bold text-[12px] uppercase tracking-widest text-center shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${isGettingHelp ? 'bg-amber-500 text-white shadow-amber-200/50 hover:bg-amber-600' : 'bg-forest text-paper shadow-forest/10 hover:opacity-90'}`}
        >
          {processingId === item.id ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <CheckCircle2 size={18} />
          )} 
          {isGettingHelp ? 'Mark as Resolved' : 'Mark as Done'}
        </button>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-paper w-full max-w-md rounded-[40px] border border-ink p-8 relative z-10 max-h-[90vh] overflow-y-auto shadow-soft-glow">
        <button onClick={onClose} className="absolute top-6 right-6 text-sage hover:text-forest"><X size={24} /></button>
        <h2 className="text-3xl font-serif text-forest mb-6">{title}</h2>
        {children}
      </motion.div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-sage font-bold mb-2 block">{label}</label>
      <input 
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-3 px-4 rounded-2xl border-2 border-sage bg-sand/10 font-medium focus:outline-none focus:border-forest"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-sage font-bold mb-2 block">{label}</label>
      <textarea 
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-3 px-4 rounded-2xl border-2 border-sage bg-sand/10 font-medium focus:outline-none focus:border-forest h-32"
      />
    </div>
  );
}

function TypeButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button 
      type="button" 
      onClick={onClick}
      className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border-2 transition-all ${active ? "bg-forest text-paper border-forest" : "border-sage text-sage"}`}
    >
      {children}
    </button>
  );
}

function SubmitButton({ loading, children }: { loading: boolean, children: React.ReactNode }) {
  return (
    <button 
      type="submit" 
      disabled={loading}
      className="w-full py-4 bg-forest text-paper rounded-full font-bold uppercase text-xs tracking-widest shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-3"
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-20 flex flex-col items-center justify-center text-center px-6"
    >
      <div className="w-16 h-16 bg-sand rounded-[30%_70%_70%_30%/50%_40%_60%_40%] flex items-center justify-center text-sage mb-6 shadow-soft-glow">
        <Coffee size={32} />
      </div>
      <p className="font-serif text-2xl text-forest max-w-sm leading-tight italic">
        {message}
      </p>
    </motion.div>
  );
}

function SuccessToast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 bg-paper border border-forest/20 rounded-full shadow-soft-glow flex items-center gap-3"
    >
      <span className="w-2 h-2 bg-sage rounded-full animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-forest">{message}</span>
    </motion.div>
  );
}

function CalendarGrid({ events, selectedDate, onSelectDate }: { events: any[], selectedDate: string | null, onSelectDate: (date: string | null) => void }) {
  const [currentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-sand/40 p-6 md:p-8 rounded-[40px] border-2 border-sage/10 shadow-inner mb-8 w-full max-w-2xl mx-auto"
    >
      <div className="flex justify-center items-center py-4 mb-2">
        <h3 className="text-2xl md:text-3xl font-serif text-forest tracking-tight">{monthName} {year}</h3>
      </div>
      
      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4 max-w-lg mx-auto">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[8px] md:text-[10px] font-black uppercase tracking-widest text-sage/40">{d}</div>
        ))}
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;
          
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = selectedDate === dateStr;
          const dayEvents = events.filter(e => e.date === dateStr);
          const hasEvents = dayEvents.length > 0;
          
          return (
            <button
              key={idx}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl md:rounded-2xl transition-all relative group shadow-sm ${
                isSelected 
                  ? "bg-forest text-paper shadow-xl scale-110 z-10" 
                  : "bg-paper text-forest hover:bg-white hover:shadow-md border border-sage/5"
              }`}
            >
              <span className={`text-xs md:text-sm font-bold ${isSelected ? "font-black" : ""}`}>{day}</span>
              {hasEvents && (
                <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? "bg-paper" : "bg-forest animate-pulse"}`} />
              )}
              {isSelected && (
                <motion.div layoutId="calendar-ring" className="absolute inset-0 border-2 border-forest rounded-xl md:rounded-2xl -m-1 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
      
      {selectedDate && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 px-2 gap-3">
          <p className="text-[10px] font-black text-forest uppercase tracking-widest text-center sm:text-left">
            Filtering for {selectedDate.split('-')[1]}/{selectedDate.split('-')[2]}
          </p>
          <button 
            onClick={() => onSelectDate(null)}
            className="flex items-center gap-2 px-4 py-1.5 bg-sand/20 text-forest/60 border border-forest/10 rounded-full hover:bg-forest hover:text-paper hover:opacity-100 transition-all text-[8px] font-black uppercase tracking-widest group/reset"
          >
            <X size={10} className="group-hover/reset:rotate-90 transition-transform" />
            Reset Filter
          </button>
        </div>
      )}
    </motion.div>
  );
}

function EventCard({ event, isOwner, onEdit, onDelete }: { event: any, isOwner?: boolean, onEdit?: () => void, onDelete?: () => void, key?: any }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const parseDate = (dateStr: string) => {
    if (!dateStr) return { month: '??', day: '??' };
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return { month: '??', day: '??' };
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const day = date.getDate().toString();
      return { month, day };
    } catch (e) {
      return { month: '??', day: '??' };
    }
  };

  const { month, day } = parseDate(event.date);

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`bg-white/85 p-6 rounded-[32px] border relative overflow-hidden group hover:border-forest/20 transition-all shadow-soft-glow cursor-pointer ${isExpanded ? 'border-forest/30' : 'border-black/5'}`}
    >
      {/* Category Tag - Top Left */}
      <div className="flex justify-start mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand/30 text-forest rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-forest/5 shadow-sm">
          EVENT
        </span>
      </div>

      {/* Branding Anchor Blob - Top Right */}
      <div className="absolute top-4 right-4">
        <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 bg-sand rounded-[30%_70%_70%_30%/50%_40%_60%_40%] border border-sage/10 overflow-hidden text-center shadow-soft-glow">
          <div className="bg-forest w-full py-0.5 text-[8px] font-black text-paper uppercase tracking-widest">{month}</div>
          <div className="flex-1 flex items-center justify-center text-xl font-serif text-forest lining-nums">{day}</div>
        </div>
      </div>

      {/* Left-Aligned Typography */}
      <div className="pr-16 text-left space-y-3">
        <h4 className="font-serif text-2xl font-semibold text-forest leading-tight group-hover:text-forest/80 transition-colors">
          {event.title}
        </h4>
        
        <div className="flex flex-col gap-1.5">
          {event.location && (
            <div className="flex items-center gap-1.5 text-[10px] font-black text-sage uppercase tracking-widest">
              <MapPin size={12} className="text-forest" /> 
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-sage uppercase tracking-widest shadow-text-pop">
            <Clock size={12} className="text-forest" /> 
            <span>{event.time}</span>
          </div>
        </div>

        <motion.div 
          animate={{ height: isExpanded ? "auto" : "3rem" }}
          className="overflow-hidden"
        >
          <p className="text-sm text-ink/80 font-medium leading-relaxed">
            {event.description}
          </p>
        </motion.div>
      </div>
      
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-sand/50">
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {!isOwner && event.email && (
            <a 
              href={`mailto:${event.email}`}
              className="px-4 py-2 bg-forest text-paper rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-forest/90 transition-all shadow-md"
            >
              Contact Organizer
            </a>
          )}
          
          {isOwner && (
            <div className="flex gap-2">
              <button 
                onClick={onEdit}
                className="px-4 py-2 bg-sand text-forest rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-forest hover:text-paper transition-all border border-forest/10"
              >
                Edit
              </button>
              <button 
                onClick={onDelete}
                className="px-4 py-2 bg-red-50 text-red-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-paper transition-all border border-red-100"
              >
                Remove
              </button>
            </div>
          )}
        </div>
        <div className="text-sage/30">
          <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
    </div>
  );
}

function HelpOfferCard({ offer, isClaimed, onClaim, isLoading, isOwner, onEdit, onDelete, onViewClaims }: { offer: any, isClaimed?: boolean, onClaim?: () => void, isLoading?: boolean, key?: any, isOwner?: boolean, onEdit?: () => void, onDelete?: () => void, onViewClaims?: () => void }) {
  const Icon = offer.natureIcon ? NATURE_ICONS[offer.natureIcon] : HeartHandshake;

  return (
    <div className="bg-white/85 p-6 rounded-[32px] border border-black/5 relative overflow-hidden group hover:border-forest/20 transition-all shadow-soft-glow">
      {/* Category Tag - Top Left */}
      <div className="flex justify-start mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand/30 text-forest rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-forest/5 shadow-sm">
          HELP OFFER
        </span>
      </div>

      {/* Branding Anchor Blob - Top Right */}
      <div className="absolute top-4 right-4">
        <div className="w-12 h-12 bg-sand rounded-[30%_70%_70%_30%/50%_40%_60%_40%] text-forest flex items-center justify-center border border-sage/10 shadow-soft-glow">
          <Icon size={20} />
        </div>
      </div>

      {/* Left-Aligned Typography */}
      <div className="pr-12 text-left space-y-3">
        <div className="flex flex-col gap-1">
          <h4 className="font-serif text-2xl font-semibold text-forest leading-tight truncate">{offer.capacity}</h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-sage uppercase tracking-widest shadow-text-pop">{offer.userName}</span>
            {offer.claimedBy?.length > 0 && (
              <span className="text-[8px] font-bold text-forest uppercase bg-forest/5 px-1.5 py-0.5 rounded-full border border-forest/10">
                {offer.claimedBy.length} claimed
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-ink/80 font-medium leading-relaxed italic line-clamp-3">
          {offer.description}
        </p>
        
        {offer.contactPreference && (
          <div className="bg-sand/20 p-4 rounded-2xl border-l-4 border-forest">
            <div className="text-[8px] uppercase tracking-widest text-forest font-black mb-1">Contact Preference</div>
            <p className="text-xs text-forest/80 italic font-medium leading-relaxed">{offer.contactPreference}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-sand/50">
        <div className="flex-1">
          {isOwner ? (
            <div className="flex flex-wrap gap-2">
              {offer.claimedBy?.length > 0 && (
                <button 
                  onClick={onViewClaims}
                  className="px-4 py-3 bg-sand text-forest rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-forest hover:text-paper transition-all border border-forest/10 flex items-center justify-center gap-2"
                >
                  <Users size={14} /> View Claims ({offer.claimedBy.length})
                </button>
              )}
              <button 
                onClick={onEdit}
                className="flex-1 py-3 bg-sand text-forest rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-forest hover:text-paper transition-all border border-forest/10"
              >
                Edit Post
              </button>
              <button 
                onClick={onDelete}
                className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-paper transition-all border border-red-100"
              >
                Remove
              </button>
            </div>
          ) : (
            <button 
              onClick={onClaim}
              disabled={isLoading}
              className={`w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isClaimed ? 'bg-forest text-paper shadow-lg shadow-forest/20' : 'bg-forest text-paper hover:bg-forest/90 shadow-soft-glow'}`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={14} /> : (isClaimed ? <><CheckCircle2 size={14} /> Claimed</> : <><Plus size={14} /> Interested</>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
