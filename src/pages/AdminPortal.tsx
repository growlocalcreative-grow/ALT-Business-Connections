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
  Filter, Heart, Calendar, MapPin, MessageSquare, AlertCircle, ArrowLeft, Info, Edit2, Save, X, AlertTriangle, CheckCircle2,
  Phone, Mail, ChevronDown
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
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
      
      <div className="flex-1 p-2 md:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col gap-6 mb-8">
            <div className="flex justify-between items-center pr-4">
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="p-2.5 bg-white/50 border border-forest/10 rounded-xl text-forest hover:bg-forest hover:text-paper transition-all shadow-sm">
                  <ArrowLeft size={18} />
                </Link>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-serif text-forest tracking-tight font-bold">Admin Overseer</h1>
                    {auth.currentUser?.email === "growlocalcreative@gmail.com" && (
                      <span className="px-2 py-0.5 bg-ink text-paper text-[7px] font-black uppercase tracking-[0.2em] rounded-full shadow-md">Master Admin</span>
                    )}
                  </div>
                  <p className="text-sage font-semibold uppercase tracking-[0.3em] text-[8px] shadow-text-pop mt-0.5">Community Control Center</p>
                </div>
              </div>
            </div>

            {/* Impact Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {[
                { label: "Active Neighbors", count: users.length, icon: Users, color: "text-forest" },
                { label: "Live Freebies", count: resources.length, icon: Heart, color: "text-forest" },
                { label: "Community Events", count: events.length, icon: Calendar, color: "text-forest" }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white/60 backdrop-blur-sm p-6 rounded-[24px] border border-sage/10 shadow-soft-glow flex items-center justify-between group hover:border-forest/30 transition-all">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-sage mb-1">{stat.label}</p>
                    <p className="text-3xl font-serif text-ink tracking-tight">{stat.count}</p>
                  </div>
                  <div className="w-12 h-12 bg-sand rounded-2xl flex items-center justify-center text-forest shadow-sm group-hover:scale-110 transition-transform">
                    <stat.icon size={20} />
                  </div>
                </div>
              ))}
            </div>
          
          <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide no-scrollbar -mx-2 px-2 items-center">
            {(["users", "businesses", "requests", "events", "offers", "resources", "issues", "club"] as AdminTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-6 py-2.5 rounded-full border-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all whitespace-nowrap shadow-text-pop ${
                  activeTab === tab 
                    ? "bg-forest border-forest text-paper shadow-md shadow-forest/20" 
                    : "border-sage/20 text-sage hover:border-forest/40 bg-white/20"
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <div className="sticky top-[72px] z-40 bg-sand/80 backdrop-blur-md -mx-4 px-4 py-4 mb-4 border-b border-sage/10">
          <div className="max-w-7xl mx-auto flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sage" size={20} />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-sage bg-white/90 font-medium focus:outline-none focus:border-forest shadow-sm hover:border-forest/30 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {activeTab === "club" ? (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full bg-white/85 p-8 md:p-12 rounded-[32px] border border-sage/10 shadow-soft-glow"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                  <div>
                    <h2 className="text-4xl font-serif text-forest mb-2">A.B.C Club Information</h2>
                    <p className="text-sage font-semibold uppercase tracking-widest text-[10px] shadow-text-pop">Manage the community's public-facing information</p>
                  </div>
                  {!isEditingClub ? (
                    <button 
                      onClick={() => setIsEditingClub(true)}
                      className="px-6 py-4 bg-forest text-paper rounded-[20px] flex items-center gap-3 hover:scale-105 transition-all shadow-lg font-black text-[10px] uppercase tracking-widest"
                    >
                      <Edit2 size={18} /> Edit Page Info
                    </button>
                  ) : (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIsEditingClub(false)}
                        className="px-6 py-4 bg-sand/30 text-forest rounded-[20px] flex items-center gap-3 hover:bg-sand/50 transition-all font-black text-[10px] uppercase tracking-widest border border-sand"
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
                            const { setDoc } = await import("firebase/firestore");
                            await setDoc(doc(db, "site", "club"), editClubData);
                            setIsEditingClub(false);
                          }
                        }}
                        className="px-6 py-4 bg-forest text-paper rounded-[20px] flex items-center gap-3 hover:scale-105 transition-all shadow-lg font-black text-[10px] uppercase tracking-widest"
                      >
                        <Save size={18} /> Save Changes
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-forest uppercase tracking-widest opacity-60">Page Title</label>
                      {isEditingClub ? (
                        <input 
                          type="text"
                          value={editClubData.title || ""}
                          onChange={(e) => setEditClubData({ ...editClubData, title: e.target.value })}
                          className="w-full p-4 rounded-2xl border border-sage bg-sand/20 focus:outline-none focus:border-forest font-semibold"
                        />
                      ) : (
                        <p className="text-forest font-serif text-3xl font-semibold leading-tight">{clubInfo.title || "About A.B.C"}</p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-forest uppercase tracking-widest opacity-60">Public Website</label>
                      {isEditingClub ? (
                        <input 
                          type="text"
                          value={editClubData.website || ""}
                          onChange={(e) => setEditClubData({ ...editClubData, website: e.target.value })}
                          className="w-full p-4 rounded-2xl border border-sage bg-sand/20 focus:outline-none focus:border-forest font-semibold"
                        />
                      ) : (
                        <p className="text-forest font-black tracking-tight text-lg underline decoration-sage/30">{clubInfo.website || "No website set"}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-forest uppercase tracking-widest opacity-60">Neighborhood Description</label>
                    {isEditingClub ? (
                      <textarea 
                        value={editClubData.description}
                        onChange={(e) => setEditClubData({ ...editClubData, description: e.target.value })}
                        className="w-full p-4 rounded-2xl border border-sage bg-sand/20 focus:outline-none focus:border-forest min-h-[120px] font-semibold leading-relaxed"
                      />
                    ) : (
                      <p className="text-forest font-medium leading-relaxed p-8 bg-paper/50 rounded-[32px] border border-sage/10 italic text-lg shadow-inner">
                        "{clubInfo.description}"
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-forest uppercase tracking-widest opacity-60">Our Mission</label>
                      {isEditingClub ? (
                        <input 
                          type="text"
                          value={editClubData.mission}
                          onChange={(e) => setEditClubData({ ...editClubData, mission: e.target.value })}
                          className="w-full p-4 rounded-2xl border border-sage bg-sand/20 focus:outline-none focus:border-forest font-bold"
                        />
                      ) : (
                        <p className="text-forest font-serif text-2xl border-l-[6px] border-forest pl-8 py-3 italic">
                          {clubInfo.mission}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-forest uppercase tracking-widest opacity-60">Public Email</label>
                        {isEditingClub ? (
                          <input 
                            type="text"
                            value={editClubData.email}
                            onChange={(e) => setEditClubData({ ...editClubData, email: e.target.value })}
                            className="w-full p-4 rounded-2xl border border-sage bg-sand/20 focus:outline-none focus:border-forest font-semibold"
                          />
                        ) : (
                          <p className="text-forest font-black tracking-tight flex items-center gap-2"><Mail size={16} /> {clubInfo.email}</p>
                        )}
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-forest uppercase tracking-widest opacity-60">Public Phone</label>
                        {isEditingClub ? (
                          <input 
                            type="text"
                            value={editClubData.phone}
                            onChange={(e) => setEditClubData({ ...editClubData, phone: e.target.value })}
                            className="w-full p-4 rounded-2xl border border-sage bg-sand/20 focus:outline-none focus:border-forest font-semibold"
                          />
                        ) : (
                          <p className="text-forest font-black tracking-tight flex items-center gap-2"><Phone size={16} /> {clubInfo.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : filteredData.map((item) => {
              const isExpanded = expandedId === item.id;
              const isVerified = item.verified || item.status === 'resolved' || item.role === 'admin';
              
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className={`bg-white/85 rounded-[20px] border border-sage/10 shadow-soft-glow flex flex-col group hover:border-forest/20 transition-all relative overflow-hidden cursor-pointer ${isExpanded ? 'p-6 gap-6 ring-2 ring-forest/5 scale-[1.01] z-10' : 'p-3 gap-1 hover:bg-white'}`}
                >
                  {/* Status Indicator Dot */}
                  <div className={`absolute top-3 right-3 w-2 h-2 rounded-full shadow-sm z-10 ${isVerified ? 'bg-forest' : 'bg-amber-500 animate-pulse'}`} />

                  {/* Header Area */}
                  <div className="flex gap-3 items-center">
                    <div className={`${isExpanded ? 'w-14 h-14' : 'w-10 h-10'} rounded-[30%_70%_70%_30%/50%_40%_60%_40%] bg-sand/30 flex items-center justify-center text-forest overflow-hidden flex-shrink-0 border border-sage/10 transition-all shadow-sm`}>
                      {item.photoURL || item.logo ? (
                        <img src={item.photoURL || item.logo} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <IconForTab tab={activeTab} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={`font-serif leading-tight truncate shadow-text-pop font-semibold text-forest ${isExpanded ? 'text-xl' : 'text-sm'}`}>
                          {activeTab === 'issues' ? `${item.type.toUpperCase()}: ${item.userName}` : (item.displayName || item.name || item.title || item.capacity)}
                        </h3>
                        {!isExpanded && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sand/50 text-forest text-[6px] font-black uppercase tracking-widest whitespace-nowrap">
                            {(item.role || 'MEMBER').toUpperCase()}
                          </span>
                        )}
                      </div>
                      {isExpanded && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${
                          isVerified ? 'bg-forest text-paper' : 'bg-sand/80 text-forest'
                        }`}>
                          {activeTab === 'issues' ? (item.status === 'open' ? 'URGENT' : 'RESOLVED') : (item.role || 'MEMBER').toUpperCase()}
                        </span>
                      )}
                    </div>
                    {!isExpanded && <ChevronDown size={14} className="text-sage pointer-events-none opacity-40" />}
                  </div>

                  {/* Expandable Body */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="flex flex-col gap-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-sage shadow-text-pop opacity-80 pt-2 border-t border-sand/30">
                          {(item.email || item.userEmail) && (
                            <div className="flex items-center gap-2">
                              <Mail size={12} className="text-forest opacity-40" />
                              <span className="truncate">{item.email || item.userEmail}</span>
                            </div>
                          )}
                          {item.streetName && (
                            <div className="flex items-center gap-2">
                              <MapPin size={12} className="text-forest opacity-40" />
                              <span>{item.streetName}</span>
                            </div>
                          )}
                          {item.category && (
                            <div className="flex items-center gap-2 text-forest/60">
                              <Building2 size={12} className="text-forest opacity-40" />
                              <span>{item.category}</span>
                            </div>
                          )}
                        </div>

                        {item.description && (
                          <div className="p-4 bg-sand/20 rounded-2xl border-l-4 border-forest shadow-inner">
                            <p className="text-xs text-forest/80 italic font-medium leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5">
                          {item.date && <Tag label={item.date} outline />}
                          {item.time && <Tag label={item.time} outline />}
                          {item.status && <Tag label={item.status} color={item.status === 'open' ? 'amber' : 'forest'} />}
                          {item.verified && <Tag label="VERIFIED BUSINESS" color="forest" />}
                        </div>

                        {/* Footer: Admin Toggles & Actions */}
                        <div className="flex items-center justify-between gap-3 pt-4 border-t border-sand/50 mt-2" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-2 flex-1">
                            {activeTab === "issues" && (
                              <button
                                onClick={() => toggleIssueStatus(item.id, item.status)}
                                className={`flex-1 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm ${item.status === 'resolved' ? 'bg-forest text-paper hover:bg-forest/90' : 'bg-sand text-forest hover:bg-forest hover:text-paper shadow-soft-glow'}`}
                              >
                                <CheckCircle2 size={14} /> {item.status === 'resolved' ? 'Resolved' : 'Close Issue'}
                              </button>
                            )}
                            {activeTab === "businesses" && (
                              <button
                                onClick={() => toggleVerification(item.id, item.verified)}
                                className={`flex-1 py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm ${item.verified ? 'bg-forest text-paper hover:bg-forest/90' : 'bg-white border border-forest/20 text-forest hover:bg-forest hover:text-paper'}`}
                              >
                                <ShieldCheck size={14} /> {item.verified ? 'Verified' : 'Verify Biz'}
                              </button>
                            )}
                          </div>
                          
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
                            className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-paper transition-all border border-red-100 shadow-sm"
                            title="Delete"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {filteredData.length === 0 && (
            <div className="col-span-full text-center py-24 bg-white/40 rounded-[40px] border-4 border-dashed border-sage/20 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-sand/30 rounded-full flex items-center justify-center text-sage">
                <Search size={32} />
              </div>
              <p className="font-serif text-2xl text-sage font-medium italic">No matches found in {activeTab}.</p>
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
