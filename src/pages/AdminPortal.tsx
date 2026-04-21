/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, where } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Building2, ShieldCheck, Trash2, Loader2, Search, 
  Filter, Heart, Calendar, MapPin, MessageSquare, AlertCircle, ArrowLeft, Info, Edit2, Save, X, AlertTriangle, CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import GlobalNav from "../components/GlobalNav";

type AdminTab = "users" | "businesses" | "requests" | "events" | "offers" | "resources" | "club" | "issues";

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ col: string, id: string, name: string } | null>(null);
  
  const [clubInfo, setClubInfo] = useState({ 
    title: "About A.B.C",
    description: "The A.B.C Club is a dedicated community space designed to foster local connection, support neighborly assistance, and empower small businesses.", 
    mission: "To strengthen community bonds and facilitate local mutual aid.",
    email: "contact@abcclub.community",
    phone: "(555) 123-4567",
    website: ""
  });
  const [isEditingClub, setIsEditingClub] = useState(false);
  const [editClubData, setEditClubData] = useState({ ...clubInfo });

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    const setupListener = (colName: string, setter: (data: any[]) => void, orderField: string = "createdAt") => {
      const q = query(collection(db, colName), orderBy(orderField, "desc"));
      const unsub = onSnapshot(q, (snapshot) => {
        setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      unsubscribes.push(unsub);
    };

    setupListener("users", setUsers);
    setupListener("businesses", setBusinesses);
    setupListener("assistanceRequests", setRequests);
    setupListener("events", setEvents);
    setupListener("helpOffers", setOffers);
    setupListener("resources", setResources);
    setupListener("issues", setIssues);

    const unsubClub = onSnapshot(doc(db, "site", "club"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as any;
        setClubInfo(data);
        setEditClubData(data);
      }
    });

    setLoading(false);

    return () => {
      unsubscribes.forEach(unsub => unsub());
      unsubClub();
    };
  }, []);

  const toggleVerification = async (bizId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "businesses", bizId), { verified: !currentStatus });
    } catch (error) {
      console.error("Verification toggle failed:", error);
    }
  };

  const toggleIssueStatus = async (issueId: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, "issues", issueId), { 
        status: currentStatus === "open" ? "resolved" : "open",
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Issue status toggle failed:", error);
    }
  };

  const deleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, itemToDelete.col, itemToDelete.id));
      setItemToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Delete failed. Please check your permissions.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getFilteredData = () => {
    let data = [];
    switch (activeTab) {
      case "users": data = users; break;
      case "businesses": data = businesses; break;
      case "requests": data = requests; break;
      case "events": data = events; break;
      case "offers": data = offers; break;
      case "resources": data = resources; break;
      case "issues": data = issues; break;
      default: data = []; break;
    }

    return data.filter(item => {
      const searchStr = (
        item.displayName || 
        item.name || 
        item.title || 
        item.userName || 
        item.email || 
        item.category || 
        ""
      ).toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  };

  const filteredData = getFilteredData();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-sand"><Loader2 className="animate-spin text-forest" size={48} /></div>;

  return (
    <div className="min-h-screen bg-sand flex flex-col p-[32px] md:p-[60px]">
      <GlobalNav />
      
      <div className="flex-1 p-2 md:p-12">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col gap-8 mb-12">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="p-3 bg-paper border-2 border-forest/10 rounded-2xl text-forest hover:bg-forest hover:text-paper transition-all">
                  <ArrowLeft size={20} />
                </Link>
                <div>
                  <h1 className="text-4xl font-serif text-forest">Admin Overseer</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-sage font-medium uppercase tracking-widest text-xs">Manage ALT Community Data & Safety</p>
                    {auth.currentUser?.email === "growlocalcreative@gmail.com" && (
                      <span className="px-2 py-0.5 bg-forest text-paper text-[8px] font-bold uppercase tracking-[0.2em] rounded-full shadow-sm">Master Admin</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          
          <div className="flex flex-wrap gap-2 bg-paper p-2 rounded-[32px] border-2 border-ink shadow-lg overflow-x-auto no-scrollbar">
            <TabButton active={activeTab === "users"} onClick={() => setActiveTab("users")} icon={<Users size={16} />} label="Users" />
            <TabButton active={activeTab === "businesses"} onClick={() => setActiveTab("businesses")} icon={<Building2 size={16} />} label="Businesses" />
            <TabButton active={activeTab === "requests"} onClick={() => setActiveTab("requests")} icon={<AlertCircle size={16} />} label="Requests" />
            <TabButton active={activeTab === "events"} onClick={() => setActiveTab("events")} icon={<Calendar size={16} />} label="Events" />
            <TabButton active={activeTab === "offers"} onClick={() => setActiveTab("offers")} icon={<Heart size={16} />} label="Offers" />
            <TabButton active={activeTab === "resources"} onClick={() => setActiveTab("resources")} icon={<MapPin size={16} />} label="Freebies" />
            <TabButton active={activeTab === "issues"} onClick={() => setActiveTab("issues")} icon={<AlertTriangle size={16} />} label="Issues" />
            <TabButton active={activeTab === "club"} onClick={() => setActiveTab("club")} icon={<Info size={16} />} label="Club Info" />
          </div>
        </header>

        <div className="mb-8 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sage" size={20} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-sage bg-paper font-medium focus:outline-none focus:border-forest shadow-sm"
            />
          </div>
        </div>

        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {activeTab === "club" ? (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-paper p-10 rounded-[40px] border-2 border-ink shadow-xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-serif text-forest">A.B.C Club Information</h2>
                    <p className="text-sage font-medium uppercase tracking-widest text-[10px] mt-1">Manage the community's public-facing information</p>
                  </div>
                  {!isEditingClub ? (
                    <button 
                      onClick={() => setIsEditingClub(true)}
                      className="p-4 bg-forest text-paper rounded-2xl flex items-center gap-3 hover:scale-105 transition-all shadow-lg font-bold text-xs uppercase tracking-widest"
                    >
                      <Edit2 size={18} /> Edit Page Info
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setIsEditingClub(false)}
                        className="p-4 bg-sand text-forest rounded-2xl flex items-center gap-3 hover:bg-forest/5 transition-all font-bold text-xs uppercase tracking-widest"
                      >
                        <X size={18} /> Cancel
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, "site", "club"), editClubData);
                            setIsEditingClub(false);
                          } catch (err) {
                            console.error("Save failed:", err);
                            // Try setDoc if update fails
                            const { setDoc } = await import("firebase/firestore");
                            await setDoc(doc(db, "site", "club"), editClubData);
                            setIsEditingClub(false);
                          }
                        }}
                        className="p-4 bg-forest text-paper rounded-2xl flex items-center gap-3 hover:scale-105 transition-all shadow-lg font-bold text-xs uppercase tracking-widest"
                      >
                        <Save size={18} /> Save Changes
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-sage uppercase tracking-widest">Page Title</label>
                      {isEditingClub ? (
                        <input 
                          type="text"
                          value={editClubData.title || ""}
                          onChange={(e) => setEditClubData({ ...editClubData, title: e.target.value })}
                          className="w-full p-4 rounded-2xl border-2 border-sage bg-sand/30 focus:outline-none focus:border-forest font-medium"
                        />
                      ) : (
                        <p className="text-forest font-serif text-2xl">{clubInfo.title || "About A.B.C"}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-sage uppercase tracking-widest">Public Website</label>
                      {isEditingClub ? (
                        <input 
                          type="text"
                          value={editClubData.website || ""}
                          onChange={(e) => setEditClubData({ ...editClubData, website: e.target.value })}
                          className="w-full p-4 rounded-2xl border-2 border-sage bg-sand/30 focus:outline-none focus:border-forest font-medium"
                        />
                      ) : (
                        <p className="text-forest font-bold tracking-tight">{clubInfo.website || "No website set"}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-sage uppercase tracking-widest">Neighborhood Description</label>
                    {isEditingClub ? (
                      <textarea 
                        value={editClubData.description}
                        onChange={(e) => setEditClubData({ ...editClubData, description: e.target.value })}
                        className="w-full p-4 rounded-2xl border-2 border-sage bg-sand/30 focus:outline-none focus:border-forest min-h-[120px] font-medium leading-relaxed"
                      />
                    ) : (
                      <p className="text-ink font-medium leading-relaxed p-6 bg-sand/30 rounded-3xl border-2 border-sage/10 italic">"{clubInfo.description}"</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-sage uppercase tracking-widest">Our Mission</label>
                      {isEditingClub ? (
                        <input 
                          type="text"
                          value={editClubData.mission}
                          onChange={(e) => setEditClubData({ ...editClubData, mission: e.target.value })}
                          className="w-full p-4 rounded-2xl border-2 border-sage bg-sand/30 focus:outline-none focus:border-forest font-medium"
                        />
                      ) : (
                        <p className="text-ink font-serif text-xl border-l-4 border-forest pl-6 py-2">{clubInfo.mission}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-sage uppercase tracking-widest">Public Email</label>
                        {isEditingClub ? (
                          <input 
                            type="text"
                            value={editClubData.email}
                            onChange={(e) => setEditClubData({ ...editClubData, email: e.target.value })}
                            className="w-full p-4 rounded-2xl border-2 border-sage bg-sand/30 focus:outline-none focus:border-forest font-medium"
                          />
                        ) : (
                          <p className="text-forest font-bold tracking-tight">{clubInfo.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-sage uppercase tracking-widest">Public Phone</label>
                        {isEditingClub ? (
                          <input 
                            type="text"
                            value={editClubData.phone}
                            onChange={(e) => setEditClubData({ ...editClubData, phone: e.target.value })}
                            className="w-full p-4 rounded-2xl border-2 border-sage bg-sand/30 focus:outline-none focus:border-forest font-medium"
                          />
                        ) : (
                          <p className="text-forest font-bold tracking-tight">{clubInfo.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : filteredData.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-paper p-6 rounded-3xl border-2 border-black/5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6"
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-sand flex items-center justify-center text-forest overflow-hidden flex-shrink-0">
                    {item.photoURL || item.logo ? (
                      <img src={item.photoURL || item.logo} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <IconForTab tab={activeTab} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-xl text-forest truncate">
                      {activeTab === 'issues' ? `Issue: ${item.type === 'bug' ? 'Website Bug' : 'Questionable Behavior'}` : (item.displayName || item.name || item.title || item.capacity)}
                    </h3>
                    <p className="text-xs font-bold text-sage uppercase tracking-wider truncate">
                      {activeTab === 'issues' ? `From: ${item.userName} (${item.userEmail})` : (item.email || item.category || item.userName || item.businessName || "No details")}
                    </p>
                    {activeTab === 'issues' && (
                      <p className="mt-4 p-4 bg-sand/30 rounded-2xl text-sm text-forest font-medium leading-relaxed border border-forest/10 italic">
                        "{item.description}"
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.role && <Tag label={item.role} />}
                      {item.streetName && <Tag label={item.streetName} outline />}
                      {item.status && <Tag label={item.status} color={item.status === 'open' || item.status === 'bug' ? 'amber' : 'forest'} />}
                      {item.date && <Tag label={item.date} outline />}
                      {item.contactPreference && <Tag label={`Contact: ${item.contactPreference}`} outline />}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {activeTab === "issues" && (
                    <button
                      onClick={() => toggleIssueStatus(item.id, item.status)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${item.status === 'resolved' ? 'bg-forest text-paper' : 'border-2 border-forest text-forest hover:bg-forest hover:text-paper shadow-sm'}`}
                    >
                      <CheckCircle2 size={14} /> {item.status === 'resolved' ? 'Resolved' : 'Close Issue'}
                    </button>
                  )}
                  {activeTab === "businesses" && (
                    <button
                      onClick={() => toggleVerification(item.id, item.verified)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${item.verified ? 'bg-sage text-paper' : 'bg-paper border-2 border-sage text-sage hover:bg-sage hover:text-paper'}`}
                    >
                      <ShieldCheck size={14} /> {item.verified ? 'Verified' : 'Verify'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const colMap: Record<AdminTab, string> = {
                        users: "users",
                        businesses: "businesses",
                        requests: "assistanceRequests",
                        events: "events",
                        offers: "helpOffers",
                        resources: "resources",
                        issues: "issues",
                        club: "site"
                      };
                      setItemToDelete({
                        col: colMap[activeTab],
                        id: item.id,
                        name: item.displayName || item.name || item.title || item.capacity || "this item"
                      });
                    }}
                    className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                    title={`Delete ${activeTab === "resources" ? "Freebie" : "Item"}`}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredData.length === 0 && (
            <div className="text-center py-20 bg-paper/50 rounded-[40px] border-4 border-dashed border-sage">
              <p className="font-serif text-2xl text-sage">No records found in {activeTab}.</p>
            </div>
          )}
        </div>
      </div>
    </div>

      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setItemToDelete(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-paper w-full max-w-sm rounded-[40px] border-[12px] border-ink p-10 relative z-10">
              <h2 className="text-2xl font-serif text-forest mb-4">Confirm Deletion</h2>
              <p className="text-ink/70 mb-8 font-medium leading-relaxed">
                Are you sure you want to delete <span className="text-forest font-bold font-sans">"{itemToDelete.name}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-4 bg-sand text-forest rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-sage/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={deleteItem}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-red-500 text-paper rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="animate-spin text-paper" size={14} /> : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none border-[20px] md:border-[30px] border-sand z-50 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)]"></div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${active ? 'bg-forest text-paper shadow-lg' : 'text-forest hover:bg-sand'}`}
    >
      {icon} {label}
    </button>
  );
}

function Tag({ label, outline, color = 'sand' }: { label: string, outline?: boolean, color?: 'sand' | 'forest' | 'amber' }) {
  const colors = {
    sand: 'bg-sand text-forest',
    forest: 'bg-forest text-paper',
    amber: 'bg-amber-100 text-amber-800 border-amber-200'
  };
  
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${outline ? 'bg-paper border border-sage text-sage' : colors[color]}`}>
      {label}
    </span>
  );
}

function IconForTab({ tab }: { tab: AdminTab }) {
  switch (tab) {
    case "users": return <Users size={24} />;
    case "businesses": return <Building2 size={24} />;
    case "requests": return <AlertCircle size={24} />;
    case "events": return <Calendar size={24} />;
    case "offers": return <Heart size={24} />;
    case "resources": return <MapPin size={24} />;
    case "issues": return <AlertTriangle size={24} />;
    case "club": return <Info size={24} />;
  }
}
