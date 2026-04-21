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
  LayoutDashboard, Shield, ArrowRight, X, Loader2, CheckCircle2, XCircle, AlertTriangle
} from "lucide-react";
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
      await updateDoc(ref, {
        claimedBy: isClaimed ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
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
      await updateDoc(ref, {
        claimedBy: isClaimed ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Help claim toggle failed:", error);
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
    <div className="min-h-screen bg-sand flex flex-col p-[32px] md:p-[60px]">
      <GlobalNav />

      <main className="flex-1 max-w-7xl w-full mx-auto p-2 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        
        {/* Left Sidebar - Navigation */}
        <aside className="lg:col-span-3 space-y-6">
          <nav className="space-y-1 bg-paper/50 p-2 rounded-[32px] border-2 border-black/5">
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
              <Link to="/business/manage" className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-forest text-paper rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-opacity-90 transition-all mb-3">
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
            </div>
          )}

          {profile?.role === "neighbor" && (
            <div className="bg-paper p-6 rounded-[32px] border-4 border-ink shadow-xl">
              <div className="text-[10px] uppercase tracking-widest text-sage font-bold mb-4">Neighbor Actions</div>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => setIsHelpModalOpen(true)}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-forest text-paper rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-opacity-90 transition-all"
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
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <section className="lg:col-span-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-forest" size={48} /></div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "feed" && (
                <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <h2 className="text-3xl font-serif text-forest">Neighbor Feed</h2>
                  {resources.length === 0 && events.length === 0 && (
                    <div className="p-12 text-center bg-paper/50 rounded-[40px] border-4 border-dashed border-sage">
                      <p className="font-serif text-xl text-sage">The feed is quiet today. Check back later!</p>
                    </div>
                  )}
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
                      />
                    );
                  })}
                  {helpOffers.slice(0, 5).map(h => {
                    const offerProfile = allUsers.find(u => u.uid === h.userUid);
                    return (
                      <FeedItem 
                        key={h.id} 
                        title={`Community Offer: ${h.capacity}`} 
                        business={h.userName} 
                        description={h.description} 
                        type="service" 
                        contactPreference={h.contactPreference}
                        natureIcon={h.natureIcon}
                        streetName={h.streetName}
                        isClaimed={h.claimedBy?.includes(user?.uid)}
                        onClaim={() => toggleHelpClaim(h.id, h.claimedBy?.includes(user?.uid))}
                        isLoading={processingId === h.id}
                        email={offerProfile?.email}
                        phone={offerProfile?.phone}
                        isOwner={h.userUid === user?.uid}
                      />
                    );
                  })}
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
                      />
                    );
                  })}
                  {assistanceRequests.slice(0, 5).map(req => {
                    const requester = allUsers.find(u => u.uid === req.userUid);
                    return (
                      <FeedItem 
                        key={req.id} 
                        title={req.title} 
                        business={req.isAnonymous ? (req.userName || "Neighbor") : req.userName} 
                        description={req.description} 
                        type="request" 
                        contactPreference={req.contactPreference}
                        streetName={req.streetName}
                        isAnonymous={req.isAnonymous}
                        natureIcon={req.natureIcon}
                        email={req.isAnonymous ? undefined : requester?.email}
                        phone={req.isAnonymous ? undefined : requester?.phone}
                      />
                    );
                  })}
                </motion.div>
              )}

              {activeTab === "events" && (
                <motion.div key="events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <h2 className="text-3xl font-serif text-forest">Community Events</h2>
                  <div className="grid gap-4">
                    {events.map(e => (
                      <EventCard 
                        key={e.id} 
                        event={e} 
                        isOwner={e.creatorUid === user?.uid}
                        onEdit={() => startEditEvent(e)}
                        onDelete={() => deleteEvent(e.id)}
                      />
                    ))}
                    {events.length === 0 && <p className="text-center py-10 text-sage font-bold uppercase tracking-widest">No upcoming events</p>}
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
                      />
                    ))}
                    {helpOffers.length === 0 && <p className="text-center py-10 text-sage font-bold uppercase tracking-widest">No help offers yet</p>}
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
                          claimCount={r.claimedBy?.length || 0}
                          quantity={r.quantity}
                          isLoading={processingId === r.id}
                          isOwner={r.ownerUid === user?.uid}
                        />
                      );
                    })}
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
                  <div className="grid gap-4">
                    {filteredBusinesses.map(b => (
                      <DirectoryItem 
                        key={b.id} 
                        id={b.id}
                        name={b.name} 
                        category={b.category} 
                        phone={b.phone} 
                        logo={b.logo} 
                        photos={b.photos} 
                        isFavorite={profile?.favorites?.includes(b.name)}
                        onToggleFavorite={() => toggleFavorite(b.name)}
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
          <div className="bg-paper p-8 rounded-[32px] border-4 border-ink shadow-xl">
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

            {/* My Claims Section */}
            <div className="mt-10 pt-10 border-t-2 border-sand">
              <h3 className="font-serif text-xl text-forest mb-6">Your Claims</h3>
              <div className="space-y-3">
                {[
                  ...resources.filter(r => r.claimedBy?.includes(user?.uid)).map(r => ({ ...r, category: 'Freebie' })),
                  ...helpOffers.filter(o => o.claimedBy?.includes(user?.uid)).map(o => ({ ...o, category: 'Help Offer', title: o.capacity, businessName: o.userName }))
                ].length > 0 ? (
                  [
                    ...resources.filter(r => r.claimedBy?.includes(user?.uid)).map(r => ({ ...r, category: 'Freebie' })),
                    ...helpOffers.filter(o => o.claimedBy?.includes(user?.uid)).map(o => ({ ...o, category: 'Help Offer', title: o.capacity, businessName: o.userName }))
                  ].map(item => (
                    <div key={item.id} className="p-4 bg-sand/30 rounded-2xl border border-forest/5 flex justify-between items-center group">
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-forest uppercase tracking-widest mb-1 truncate">{item.title}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-[8px] text-sage font-bold uppercase tracking-tighter">{item.businessName}</div>
                          <span className="text-[7px] px-1 bg-forest/10 text-forest rounded uppercase font-black">{item.category}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => processingId === item.id ? null : (item.category === 'Freebie' ? toggleClaim(item.id, true) : toggleHelpClaim(item.id, true))}
                        className={`p-2 text-sage transition-all ${processingId === item.id ? 'animate-spin' : 'opacity-0 group-hover:opacity-100 hover:text-red-400'}`}
                        title="Unclaim"
                        disabled={processingId === item.id}
                      >
                        {processingId === item.id ? <Loader2 size={14} /> : <X size={14} />}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-sage font-bold uppercase tracking-widest">No active claims</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-forest p-8 rounded-[32px] text-paper shadow-xl">
            <h3 className="font-serif text-xl mb-4">Need Help?</h3>
            <p className="text-xs opacity-80 leading-relaxed mb-6">Are you an elderly resident or in a "wild crazy situation"? Our community is here for you.</p>
            <button 
              onClick={() => setIsRequestModalOpen(true)}
              className="w-full py-3 bg-paper text-forest rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-sand transition-all"
            >
              Request Assistance
            </button>
          </div>

          <div className="bg-[#8d967a] p-8 rounded-[32px] text-paper shadow-xl">
            <h3 className="font-serif text-xl mb-4">Report an Issue</h3>
            <p className="text-xs opacity-80 leading-relaxed mb-6">Support our mission of safety and excellence. Report website bugs or questionable behavior.</p>
            <button 
              onClick={() => setIsIssueModalOpen(true)}
              className="w-full py-3 bg-paper text-[#8d967a] rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-sand transition-all"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-sage font-bold mb-2 block">Type</label>
                  <div className="flex gap-2">
                    <TypeButton active={postData.type === "resource"} onClick={() => setPostData({ ...postData, type: "resource" })}>Resource</TypeButton>
                    <TypeButton active={postData.type === "service"} onClick={() => setPostData({ ...postData, type: "service" })}>Service</TypeButton>
                  </div>
                </div>
                <div>
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
                  Always visible: Your street name and category of request.
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
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, key?: any }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all ${active ? 'bg-forest text-paper shadow-lg' : 'text-forest hover:bg-sand'}`}
    >
      {icon} {label}
    </button>
  );
}

function ClaimedOfferCard({ title, neighborName, neighborStreet, neighborEmail, natureIcon }: { title: string, neighborName: string, neighborStreet: string, neighborEmail?: string, natureIcon?: string, key?: any }) {
  const Icon = natureIcon ? NATURE_ICONS[natureIcon] : TreePine;
  return (
    <div className="bg-paper p-6 rounded-3xl border-2 border-forest/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm hover:border-forest/30 transition-all">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-sand rounded-2xl text-forest">
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

function FeedItem({ title, business, businessId, description, type, contactPreference, streetName, isAnonymous, natureIcon, isClaimed, onClaim, isLoading, isOwner, email, phone, quantity }: { title: string, business: string, businessId?: string, description: string, type: 'resource' | 'service' | 'event' | 'request', key?: any, contactPreference?: string, streetName?: string, isAnonymous?: boolean, natureIcon?: string, isClaimed?: boolean, onClaim?: () => void, isLoading?: boolean, isOwner?: boolean, email?: string, phone?: string, quantity?: number }) {
  const colors = {
    resource: 'bg-sage text-paper shadow-sm border border-sage/20',
    service: 'bg-forest text-paper',
    event: 'bg-amber-600 text-paper',
    request: 'bg-sand text-forest border-2 border-forest'
  };

  const Icon = natureIcon ? NATURE_ICONS[natureIcon] : null;

  return (
    <div className={`p-8 rounded-[32px] border-2 shadow-sm relative overflow-hidden group hover:border-forest/20 transition-all ${type === 'resource' ? 'bg-sage/5 border-sage/20 shadow-sage/5' : 'bg-paper border-black/5'}`}>
      {isAnonymous && type === 'request' && (
        <div className="absolute top-0 right-0 px-4 py-1 bg-amber-50 text-[8px] font-bold uppercase tracking-[0.2em] text-amber-700 rounded-bl-xl border-l border-b border-amber-100 flex items-center gap-1">
          <Shield size={8} /> Identity Protected
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${colors[type]}`}>
            {type === 'resource' && <Heart size={8} fill="currentColor" />}
            {type === 'resource' ? 'Official Community Freebie' : type}
          </span>
          {type === 'resource' && (
            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest border border-amber-200/50">
              Gift from {business}
            </span>
          )}
        </div>
        {streetName && (
          <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-sage">
            <MapPin size={8} /> {streetName}
          </span>
        )}
      </div>
      
      {/* Swap long description for title for space saving in business posts */}
      {(type === 'resource' || type === 'service') ? (
        <p className="text-forest text-lg font-serif mb-6 leading-tight italic">"{title}"</p>
      ) : (
        <>
          <h4 className="font-serif text-2xl text-forest mb-1">{title}</h4>
          <div className="flex items-center gap-2 mb-4">
            {Icon && <div className="p-1 bg-sand rounded text-forest"><Icon size={12} /></div>}
            {businessId ? (
              <Link to={`/business/${businessId}`} className="text-xs font-bold text-sage uppercase tracking-wider hover:text-forest transition-all underline decoration-sage/30">{business}</Link>
            ) : (
              <div className="text-xs font-bold text-sage uppercase tracking-wider">{business}</div>
            )}
            <div className="w-1 h-1 bg-sand rounded-full"></div>
            <div className="text-[10px] text-sage/60 font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] sm:max-w-none">Vetted Resident</div>
          </div>
          <p className="text-ink/80 leading-relaxed mb-6 font-medium">{description}</p>
        </>
      )}

      {(type === 'resource' || type === 'service') && (
        <div className="flex items-center gap-2 mb-6">
          {Icon && <div className="p-1 bg-sand rounded text-forest"><Icon size={12} /></div>}
          {businessId ? (
            <Link to={`/business/${businessId}`} className="text-xs font-bold text-sage uppercase tracking-wider hover:text-forest transition-all underline decoration-sage/30">{business}</Link>
          ) : (
            <div className="text-xs font-bold text-sage uppercase tracking-wider">{business}</div>
          )}
          <div className="w-1 h-1 bg-sand rounded-full"></div>
          <div className="text-[10px] text-sage/60 font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] sm:max-w-none">Partner Provider</div>
        </div>
      )}
      
      {type === 'request' && contactPreference && (
        <div className="bg-sand/30 p-5 rounded-2xl mb-6 border-l-4 border-forest shadow-inner">
          <div className="flex items-center gap-2 text-[8px] uppercase tracking-widest text-forest font-black mb-2">
            <Shield size={10} /> Assistance Instructions
          </div>
          <p className="text-sm text-forest/80 italic font-medium leading-relaxed">{contactPreference}</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-sand">
        {(type === 'resource' || type === 'service') ? (
          <div className="flex items-center gap-6">
            {quantity !== undefined && type === 'resource' && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-sage border-r border-sand pr-4">
                <div className="w-1.5 h-1.5 rounded-full bg-forest animate-pulse"></div>
                {quantity} Available
              </div>
            )}
            {isOwner ? (
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 italic">Your Post</div>
            ) : (
              <button 
                disabled={isLoading}
                onClick={onClaim}
                className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${isClaimed ? 'text-forest' : 'text-sage hover:text-forest'}`}
              >
                {isLoading ? <Loader2 className="animate-spin" size={12} /> : (isClaimed ? <><CheckCircle2 size={12} /> Claimed</> : <><Plus size={12} /> {type === 'resource' ? 'Claim Freebie' : 'Interested'}</>)}
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-4">
            {phone && (
              <a href={`tel:${phone}`} className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest hover:text-sage transition-all flex items-center gap-2">
                Call <Phone size={12} />
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest hover:text-sage transition-all flex items-center gap-2">
                Email <Mail size={12} />
              </a>
            )}
            {!phone && !email && (
              <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-forest hover:text-sage transition-all flex items-center gap-2">
                Interact <ArrowRight size={12} />
              </button>
            )}
          </div>
        )}
        <span className="text-[8px] text-sage font-bold uppercase tracking-widest">Neighbor Connection</span>
      </div>
    </div>
  );
}

function ResourceCard({ title, business, businessId, description, isClaimed, onClaim, logo, claimCount = 0, quantity = 1, isLoading, isOwner }: { title: string, business: string, businessId?: string, description: string, isClaimed: boolean, onClaim: () => void, key?: any, logo?: string, claimCount?: number, quantity?: number, isLoading?: boolean, isOwner?: boolean }) {
  const isAvailable = quantity > claimCount;
  
  return (
    <div className="bg-paper p-6 rounded-3xl border-2 border-sage/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="flex-1 flex gap-4 items-start">
        {businessId ? (
          <Link to={`/business/${businessId}`}>
            {logo && (
              <img src={logo} alt={business} className="w-12 h-12 rounded-xl object-cover border border-sage/20 flex-shrink-0 hover:border-forest/50 transition-all" referrerPolicy="no-referrer" />
            )}
          </Link>
        ) : logo && (
          <img src={logo} alt={business} className="w-12 h-12 rounded-xl object-cover border border-sage/20 flex-shrink-0" referrerPolicy="no-referrer" />
        )}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-serif text-xl text-forest">{title}</h4>
            <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full uppercase tracking-widest ${isAvailable ? 'bg-forest/10 text-forest' : (isClaimed ? 'bg-forest/10 text-forest' : 'bg-red-50 text-red-500')}`}>
              {isClaimed ? 'You claimed this' : isAvailable ? `${quantity - claimCount} remaining` : 'Fully Claimed'}
            </span>
          </div>
          {businessId ? (
            <Link to={`/business/${businessId}`} className="text-xs font-bold text-sage uppercase tracking-widest mb-2 hover:text-forest transition-all underline decoration-sage/30">{business}</Link>
          ) : (
            <p className="text-xs font-bold text-sage uppercase tracking-widest mb-2">{business}</p>
          )}
          <p className="text-sm text-ink/70 font-medium">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto">
        {isOwner ? (
          <div className="px-8 py-3 bg-paper border-2 border-amber-200 text-amber-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest italic">
            Your Freebie
          </div>
        ) : (
          <button 
            disabled={isLoading || (!isAvailable && !isClaimed)}
            onClick={onClaim}
            className={`w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all ${isClaimed ? 'bg-forest text-paper shadow-lg shadow-forest/20' : isAvailable ? 'bg-sand text-forest hover:bg-forest hover:text-paper shadow-md' : 'bg-sage/20 text-sage cursor-not-allowed'}`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={14} /> : (isClaimed ? <><CheckCircle2 size={14} /> Claimed</> : isAvailable ? <><Plus size={14} /> Claim</> : 'Fully Claimed')}
          </button>
        )}
      </div>
    </div>
  );
}

function DirectoryItem({ id, name, category, phone, logo, photos, isFavorite, onToggleFavorite }: { id: string, name: string, category: string, phone: string, key?: any, logo?: string, photos?: string[], isFavorite?: boolean, onToggleFavorite?: () => void }) {
  const smsBody = encodeURIComponent(`Hi ${name}! I'm your neighbor from ALT Business Connections. I'm interested in your services...`);
  const [showPhotos, setShowPhotos] = React.useState(false);
  
  return (
    <div className="bg-paper p-6 rounded-3xl border-2 border-black/5 flex flex-col gap-6 group hover:border-forest/20 transition-all shadow-sm hover:shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <Link to={`/business/${id}`} className="flex items-center gap-4 flex-1">
          {logo ? (
            <img src={logo} alt={name} className="w-16 h-16 rounded-2xl object-cover border-2 border-sand shadow-sm group-hover:border-forest/30 transition-all" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-sand flex items-center justify-center text-forest group-hover:bg-forest/5 transition-all">
              <Building2 size={32} />
            </div>
          )}
          <div>
            <h4 className="font-serif text-xl text-forest group-hover:text-forest transition-all flex items-center gap-2">
              {name}
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </h4>
            <p className="text-[10px] font-bold text-sage uppercase tracking-widest">{category}</p>
          </div>
        </Link>
        <div className="flex gap-2 w-full md:w-auto">
          {photos && photos.length > 0 && (
            <button 
              onClick={() => setShowPhotos(!showPhotos)}
              className="p-3 bg-sand text-forest rounded-xl hover:bg-forest hover:text-paper transition-all border-2 border-transparent"
              title="View Photos"
            >
              <Camera size={18} />
            </button>
          )}
          {onToggleFavorite && (
            <button 
              onClick={onToggleFavorite}
              className={`p-3 rounded-xl border-2 transition-all ${isFavorite ? 'bg-amber-400 border-amber-400 text-paper' : 'bg-paper border-sand text-forest hover:bg-sand'}`}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          )}
          <a href={`tel:${phone}`} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-sand text-forest rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-forest hover:text-paper transition-all shadow-sm">
            <Phone size={16} /> Call
          </a>
          <a href={`sms:${phone}?body=${smsBody}`} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-paper border-2 border-sand text-forest rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-sand transition-all">
            <MessageSquare size={16} /> Text
          </a>
        </div>
      </div>

      <AnimatePresence>
        {showPhotos && photos && photos.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-sand">
              {photos.map((p, i) => (
                <div key={i} className="aspect-video rounded-xl overflow-hidden border-2 border-sand">
                  <img src={p} alt={`${name} showcase ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-paper w-full max-w-md rounded-[40px] border-[12px] border-ink p-10 relative z-10 max-h-[90vh] overflow-y-auto">
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
        className="w-full p-4 rounded-2xl border-2 border-sage bg-sand/10 font-medium focus:outline-none focus:border-forest"
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
        className="w-full p-4 rounded-2xl border-2 border-sage bg-sand/10 font-medium focus:outline-none focus:border-forest h-32"
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

function EventCard({ event, isOwner, onEdit, onDelete }: { event: any, key?: any, isOwner?: boolean, onEdit?: () => void, onDelete?: () => void }) {
  return (
    <div className="bg-paper p-6 rounded-3xl border-2 border-sage/20 space-y-4">
      <div className="flex justify-between items-start">
        <h4 className="font-serif text-xl text-forest">{event.title}</h4>
        <div className="flex items-center gap-2 text-sage font-bold text-[10px] uppercase tracking-widest">
          <Calendar size={14} /> {event.date}
        </div>
      </div>
      <p className="text-sm text-ink/70 font-medium">{event.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-sage">
          <div className="flex items-center gap-1"><MapPin size={14} /> {event.location}</div>
          <div className="flex items-center gap-1"><Calendar size={14} /> {event.time}</div>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <button 
              onClick={onEdit}
              className="px-3 py-1 bg-sand text-forest rounded-lg font-bold text-[8px] uppercase tracking-widest hover:bg-forest hover:text-paper transition-all"
            >
              Edit
            </button>
            <button 
              onClick={onDelete}
              className="px-3 py-1 bg-red-50 text-red-500 rounded-lg font-bold text-[8px] uppercase tracking-widest hover:bg-red-500 hover:text-paper transition-all"
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function HelpOfferCard({ offer, isClaimed, onClaim, isLoading, isOwner, onEdit, onDelete }: { offer: any, isClaimed?: boolean, onClaim?: () => void, isLoading?: boolean, key?: any, isOwner?: boolean, onEdit?: () => void, onDelete?: () => void }) {
  return (
    <div className="bg-paper p-6 rounded-3xl border-2 border-forest/20 space-y-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <h4 className="font-serif text-xl text-forest">{offer.capacity}</h4>
          {offer.claimedBy?.length > 0 && (
            <span className="text-[8px] font-bold text-sage uppercase bg-sand p-1 rounded">
              {offer.claimedBy.length} claimed
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-sage">{offer.userName}</span>
          {isOwner && <span className="text-[7px] font-black uppercase text-amber-600 tracking-tighter">Your Post</span>}
        </div>
      </div>
      <p className="text-sm text-ink/70 font-medium leading-relaxed">{offer.description}</p>
      
      {offer.contactPreference && (
        <div className="bg-sand/30 p-4 rounded-2xl border border-forest/10">
          <div className="text-[8px] uppercase tracking-widest text-forest font-bold mb-1">Contact Preference</div>
          <p className="text-xs text-forest/80 italic">{offer.contactPreference}</p>
        </div>
      )}

      {isOwner ? (
        <div className="flex gap-2 pt-2 border-t border-sand">
          <button 
            onClick={onEdit}
            className="flex-1 py-3 bg-paper border-2 border-sand text-forest rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-sand transition-all"
          >
            Edit Post
          </button>
          <button 
            onClick={onDelete}
            className="flex-1 py-3 bg-red-50 text-red-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-paper transition-all"
          >
            Remove
          </button>
        </div>
      ) : (
        <button 
          onClick={onClaim}
          disabled={isLoading}
          className={`w-full py-3 border-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isClaimed ? 'bg-forest text-paper border-forest' : 'border-forest text-forest hover:bg-forest hover:text-paper shadow-md shadow-forest/10'}`}
        >
          {isLoading ? <Loader2 className="animate-spin" size={14} /> : (isClaimed ? <><CheckCircle2 size={14} /> Claimed</> : "I'm Interested / Help Neighbor")}
        </button>
      )}
    </div>
  );
}
