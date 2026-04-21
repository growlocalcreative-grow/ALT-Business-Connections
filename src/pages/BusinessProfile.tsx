/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, Phone, Mail, Globe, MapPin, 
  ArrowLeft, Star, Clock, CheckCircle2, 
  Plus, Loader2, Camera, ShieldCheck, MessageSquare, X,
  Zap, LifeBuoy, Search, Palette, Utensils, Heart, Hammer, Briefcase, GraduationCap, Leaf, Sparkles
} from "lucide-react";

const SERVICE_ICONS: Record<string, any> = {
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

function ServiceTag({ label, key }: { label: string, key?: any }) {
  const Icon = SERVICE_ICONS[label] || SERVICE_ICONS[Object.keys(SERVICE_ICONS).find(k => label.includes(k)) || ""] || Sparkles;
  
  return (
    <span key={key} className="inline-flex items-center gap-1.5 px-4 py-2 bg-sand/30 text-forest rounded-full text-xs font-bold border border-sand/50 shadow-sm hover:-translate-y-0.5 transition-transform cursor-default">
      <Icon size={14} className="text-forest/70" />
      {label}
    </span>
  );
}
import GlobalNav from "../components/GlobalNav";
import { useUser } from "../contexts/UserContext";

export default function BusinessProfile() {
  const { businessId } = useParams<{ businessId: string }>();
  const { user, profile } = useUser();
  const [business, setBusiness] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnerWarningOpen, setIsOwnerWarningOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;

    // Fetch business
    const fetchBusiness = async () => {
      try {
        const docSnap = await getDoc(doc(db, "businesses", businessId));
        if (docSnap.exists()) {
          const bizData: any = { id: docSnap.id, ...docSnap.data() };
          setBusiness(bizData);

          // Fetch events for this business owner
          const eventsQ = query(collection(db, "events"), where("creatorUid", "==", bizData.ownerUid));
          const unsubEvents = onSnapshot(eventsQ, (snapshot) => {
            setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          });
          return unsubEvents;
        }
      } catch (error) {
        console.error("Error fetching business:", error);
      }
    };

    let unsubEvents: (() => void) | undefined;
    fetchBusiness().then(unsub => {
      if (unsub) unsubEvents = unsub;
    });

    // Fetch resources for this business
    const resourcesQ = query(collection(db, "resources"), where("businessId", "==", businessId));
    const unsubResources = onSnapshot(resourcesQ, (snapshot) => {
      setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubResources();
      if (unsubEvents) unsubEvents();
    };
  }, [businessId]);

  const toggleClaim = async (resourceId: string, isCurrentlyClaimed: boolean) => {
    if (!user) return;

    // Block owners from claiming their own freebie
    const res = resources.find(r => r.id === resourceId);
    if (res && res.ownerUid === user.uid) {
      setIsOwnerWarningOpen(true);
      return;
    }

    setProcessingId(resourceId);
    try {
      const resourceRef = doc(db, "resources", resourceId);
      if (isCurrentlyClaimed) {
        await updateDoc(resourceRef, {
          claimedBy: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(resourceRef, {
          claimedBy: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error("Claim toggle failed:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !profile || !business) return;
    const userRef = doc(db, "users", user.uid);
    const isFavorite = profile.favorites?.includes(business.name);
    
    try {
      await updateDoc(userRef, {
        favorites: isFavorite ? arrayRemove(business.name) : arrayUnion(business.name)
      });
    } catch (error) {
      console.error("Favorite toggle failed:", error);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-sand">
      <Loader2 className="animate-spin text-forest" size={48} />
    </div>
  );

  if (!business) return (
    <div className="min-h-screen flex items-center justify-center bg-sand flex-col gap-6">
      <p className="text-forest font-serif text-2xl">Business not found</p>
      <Link to="/dashboard" className="px-8 py-3 bg-forest text-paper rounded-2xl font-bold text-xs uppercase tracking-widest">
        Back to Dashboard
      </Link>
    </div>
  );

  const isFavorite = profile?.favorites?.includes(business.name);

  return (
    <div className="min-h-screen bg-sand flex flex-col p-[32px] md:p-[60px]">
      <GlobalNav />
      
      <main className="flex-1 p-2 md:p-12 w-full max-w-[calc(100vw-2rem)] mx-auto md:max-w-none">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10 pb-12 border-b-2 border-forest/10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 w-full min-w-0">
              <Link to="/dashboard" className="p-3 md:p-4 bg-paper border-2 border-forest/10 rounded-2xl text-forest hover:bg-forest hover:text-paper transition-all shadow-sm flex-shrink-0 self-start md:self-auto">
                <ArrowLeft size={20} className="md:w-6 md:h-6" />
              </Link>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8 min-w-0 flex-1">
                {business.logo ? (
                  <img src={business.logo} alt={business.name} className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] object-cover border-4 border-paper shadow-xl ring-2 ring-forest/5 flex-shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] bg-paper border-4 border-paper shadow-xl ring-2 ring-forest/5 flex items-center justify-center text-forest flex-shrink-0">
                    <Building2 size={40} className="md:w-16 md:h-16" />
                  </div>
                )}
                <div className="min-w-0 flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-3 min-w-0 w-full">
                    <h1 className="text-3xl md:text-5xl font-serif text-forest truncate max-w-[80vw] md:max-w-none">{business.name}</h1>
                    {business.verified && (
                      <ShieldCheck className="text-forest flex-shrink-0 md:w-8 md:h-8" size={24} />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 w-full">
                    <ServiceTag label={business.category} />
                    {business.verified && (
                      <span className="px-4 py-2 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-200 shadow-sm hover:-translate-y-0.5 transition-transform cursor-default">
                        Verified Partner
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <button 
                onClick={toggleFavorite}
                className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-md ${isFavorite ? 'bg-amber-400 text-paper' : 'bg-paper text-forest hover:bg-sand'}`}
              >
                <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
                {isFavorite ? "Favorited" : "Add to Favorites"}
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-12 min-w-0 w-full overflow-hidden">
              <section className="bg-paper p-6 md:p-10 rounded-[40px] border-2 border-black/5 shadow-sm overflow-hidden">
                <h2 className="text-2xl font-serif text-forest mb-6 truncate">About {business.name}</h2>
                <p className="text-ink/80 text-base md:text-lg leading-relaxed font-medium whitespace-normal break-words">
                  {business.description || "No description provided."}
                </p>
                
                {business.services && business.services.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-forest/5">
                    <h3 className="text-[10px] font-bold text-sage uppercase tracking-widest mb-4">Core Services</h3>
                    <div className="flex flex-wrap gap-2">
                      {business.services.map((s: string, i: number) => (
                        <ServiceTag key={i} label={s} />
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Showcase Photos */}
              {business.photos && business.photos.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <Camera className="text-sage" size={24} />
                    <h2 className="text-2xl font-serif text-forest">Showcase</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {business.photos.map((url: string, i: number) => (
                      <motion.div 
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className="aspect-[4/3] rounded-[32px] overflow-hidden border-2 border-paper shadow-lg shadow-forest/5 ring-1 ring-forest/5"
                      >
                        <img src={url} alt={`Showcase ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Upcoming Events */}
              {events.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <Clock className="text-sage" size={24} />
                    <h2 className="text-2xl font-serif text-forest">Upcoming Events</h2>
                  </div>
                  <div className="grid gap-4">
                    {events.map(e => (
                      <div key={e.id} className="bg-paper p-6 rounded-3xl border-2 border-amber-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                        <div className="flex-1">
                          <h4 className="font-serif text-xl text-forest mb-2">{e.title}</h4>
                          <p className="text-sm text-ink/70 font-medium line-clamp-2">{e.description}</p>
                          <div className="flex flex-wrap gap-4 mt-4 text-[10px] font-bold text-sage uppercase tracking-widest">
                            <span className="flex items-center gap-1"><MapPin size={12} /> {e.location}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {e.date} • {e.time}</span>
                          </div>
                        </div>
                        <Link 
                          to="/dashboard" // Events currently only managed on dashboard feed
                          className="px-6 py-3 bg-amber-50 text-amber-700 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all border border-amber-200"
                        >
                          Details In Feed
                        </Link>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Community Freebies */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="text-sage" size={24} />
                  <h2 className="text-2xl font-serif text-forest">Community Freebies</h2>
                </div>
                <div className="grid gap-4">
                  {resources.length > 0 ? resources.map(r => (
                    <ResourceItem 
                      key={r.id} 
                      resource={r} 
                      isClaimed={r.claimedBy?.includes(user?.uid)}
                      onClaim={() => toggleClaim(r.id, r.claimedBy?.includes(user?.uid))}
                      isLoading={processingId === r.id}
                      isOwner={r.ownerUid === user?.uid}
                    />
                  )) : (
                    <div className="text-center py-12 bg-paper/50 rounded-[40px] border-4 border-dashed border-sage/20 text-sage font-medium italic">
                      No active freebies currently available.
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right Column: Contact Sidebar */}
            <div className="space-y-6">
              <div className="bg-paper p-8 rounded-[40px] border-2 border-black/5 shadow-xl sticky top-32">
                <h3 className="text-xl font-serif text-forest mb-8">Connect Directly</h3>
                
                <div className="grid grid-cols-4 gap-3">
                  {business.phone && (
                    <>
                      <a 
                        href={`tel:${business.phone}`} 
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-sand/30 border border-sand hover:bg-sand/50 transition-all text-forest"
                        title="Call Business"
                      >
                        <Phone size={20} />
                        <span className="text-[8px] font-bold uppercase tracking-tighter">Call</span>
                      </a>
                      <a 
                        href={`sms:${business.phone}?body=${encodeURIComponent("Hi! I saw your business on ALT Connections...")}`} 
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-sand/30 border border-sand hover:bg-sand/50 transition-all text-forest"
                        title="Text Business"
                      >
                        <MessageSquare size={20} />
                        <span className="text-[8px] font-bold uppercase tracking-tighter">Text</span>
                      </a>
                    </>
                  )}

                  {business.email && (
                    <a 
                      href={`mailto:${business.email}`} 
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-sand/30 border border-sand hover:bg-sand/50 transition-all text-forest"
                      title="Email Business"
                    >
                      <Mail size={20} />
                      <span className="text-[8px] font-bold uppercase tracking-tighter">Email</span>
                    </a>
                  )}

                  {business.website && (
                    <a 
                      href={business.website.startsWith('http') ? business.website : `https://${business.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-sand/30 border border-sand hover:bg-sand/50 transition-all text-forest"
                      title="Visit Website"
                    >
                      <Globe size={20} />
                      <span className="text-[8px] font-bold uppercase tracking-tighter">Web</span>
                    </a>
                  )}
                </div>

                <div className="mt-8 pt-8 border-t border-forest/5 flex flex-col gap-4">
                  <p className="text-xs text-ink/60 font-medium italic text-center px-4 leading-relaxed">
                    Always tell them you're from ALT Business Connections for neighborly perks!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative Border */}
      <div className="fixed inset-0 pointer-events-none border-[20px] md:border-[30px] border-sand z-50 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)]"></div>

      <AnimatePresence>
        {isOwnerWarningOpen && (
          <Modal title="Wait a second!" onClose={() => setIsOwnerWarningOpen(false)}>
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={32} />
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
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-forest/20 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-paper w-full max-w-lg rounded-[40px] shadow-2xl border-4 border-sand relative z-10 overflow-hidden"
      >
        <div className="p-6 border-b-2 border-sand flex justify-between items-center bg-sand/10">
          <h3 className="font-serif text-2xl text-forest">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-sand rounded-full transition-all text-sage hover:text-forest">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function ResourceItem({ resource, isClaimed, onClaim, isLoading, isOwner }: { resource: any, isClaimed: any, onClaim: any, isLoading: boolean, isOwner: boolean, key?: any }) {
  const claimCount = resource.claimedBy?.length || 0;
  const isAvailable = (resource.quantity || 1) > claimCount;

  return (
    <div className="bg-paper p-6 rounded-3xl border-2 border-sage/10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="flex-1 min-w-0 w-full">
        <div className="flex items-center flex-wrap gap-3 mb-2 min-w-0">
          <h4 className="font-serif text-xl text-forest truncate">{resource.title}</h4>
          <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full uppercase tracking-widest flex-shrink-0 ${isAvailable ? 'bg-forest/10 text-forest border border-forest/20' : (isClaimed ? 'bg-forest/10 text-forest border border-forest/20' : 'bg-red-50 text-red-500 border border-red-100')}`}>
            {isClaimed ? 'You claimed this' : isAvailable ? `${(resource.quantity || 1) - claimCount} remaining` : 'Fully Claimed'}
          </span>
        </div>
        <p className="text-sm text-ink/70 font-medium leading-relaxed whitespace-normal break-words">{resource.description}</p>
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
            className={`w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-md ${isClaimed ? 'bg-forest text-paper ring-4 ring-forest/10' : isAvailable ? 'bg-sand text-forest hover:bg-forest hover:text-paper shadow-forest/5' : 'bg-sage/20 text-sage cursor-not-allowed'}`}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              isClaimed ? (
                <><CheckCircle2 size={16} /> Claimed</>
              ) : isAvailable ? (
                <><Clock size={16} /> Claim Freebie</>
              ) : 'Sold Out'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
