/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { useUser } from "../../contexts/UserContext";
import { motion, AnimatePresence } from "motion/react";
import { siteConfig } from "../../config/site-config";
import { useNavigate } from "react-router-dom";
import { User, Building2, Loader2, ArrowRight, TreePine, Leaf, Flower2, Bird, Mountain, Waves, UserPlus, Handshake, Store, MessageCircle } from "lucide-react";
import { isValidStreet } from "../../config/streets";

const NATURE_ICONS = [
  { name: "TreePine", icon: TreePine },
  { name: "Leaf", icon: Leaf },
  { name: "Flower2", icon: Flower2 },
  { name: "Bird", icon: Bird },
  { name: "Mountain", icon: Mountain },
  { name: "Waves", icon: Waves },
];

export default function Onboarding() {
  const { user, profile, loading } = useUser();
  const [step, setStep] = useState<"login" | "vetting" | "role" | "profile">("login");
  const [isProcessing, setIsProcessing] = useState(false);
  const [street, setStreet] = useState("");
  const [streetError, setStreetError] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"neighbor" | "business" | null>(null);
  const [profileData, setProfileData] = useState({
    anonymousName: "",
    natureIcon: "TreePine",
  });
  const navigate = useNavigate();

  // Auto-progress if already logged in but missing profile
  React.useEffect(() => {
    if (user && !loading) {
      if (profile) {
        navigate("/dashboard");
      } else if (step === "login") {
        setStep("vetting");
      }
    }
  }, [user, profile, loading, step, navigate]);

  const handleLogin = async () => {
    setIsProcessing(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      
      const docRef = doc(db, "users", result.user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        navigate("/dashboard");
      } else {
        setStep("vetting");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVetting = () => {
    if (isValidStreet(street)) {
      setStep("role");
    } else {
      setStreetError(true);
    }
  };

  const handleRoleSelection = (role: "neighbor" | "business") => {
    setSelectedRole(role);
    setStep("profile");
  };

  const completeOnboarding = async () => {
    if (!user || !selectedRole) return;
    setIsProcessing(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        anonymousName: profileData.anonymousName || user.displayName,
        natureIcon: profileData.natureIcon,
        role: selectedRole,
        streetName: street,
        favorites: [],
        createdAt: new Date().toISOString(),
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Onboarding completion failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-sand"><Loader2 className="animate-spin text-forest" size={48} /></div>;

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center py-[60px] px-[24px] md:px-[60px] overflow-y-auto">
      <div className="max-w-md w-full bg-paper rounded-[40px] shadow-2xl p-8 md:p-10 border-[8px] md:border-[12px] border-ink relative overflow-hidden mb-4">
        <div className="text-center mb-6 md:mb-10">
          <div className="font-serif text-3xl font-bold text-forest mb-2">{siteConfig.shortName}</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-sage font-bold">Community Portal</div>
        </div>

        <AnimatePresence mode="wait">
          {step === "login" && (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl md:text-3xl font-serif text-forest mb-4 md:mb-6 text-center">Welcome Home.</h2>
              <p className="text-sm md:text-base text-ink/70 text-center mb-8 md:mb-10 font-medium">
                Join the A.B.C community to connect with neighbors and local businesses in Auburn Lake Trails.
              </p>
              <button
                onClick={handleLogin}
                disabled={isProcessing}
                className="w-full py-4 bg-forest text-paper rounded-full font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-lg"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : "Sign in with Google"}
              </button>
              <div className="mt-6 flex flex-col gap-4 text-center">
                {/* Sign In helper moved outside for better alignment */}
              </div>
            </motion.div>
          )}

          {step === "vetting" && (
            <motion.div key="vetting" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-serif text-forest mb-6 text-center">Resident Vetting</h2>
              <p className="text-ink/70 text-center mb-8 font-medium">
                To ensure community safety, please enter your Auburn Lake Trails street name.
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter Street Name"
                  value={street}
                  onChange={(e) => { setStreet(e.target.value); setStreetError(false); }}
                  className={`w-full p-4 rounded-2xl border-2 bg-sand/20 font-medium focus:outline-none transition-all ${streetError ? 'border-red-400' : 'border-sage focus:border-forest'}`}
                />
                {streetError && <p className="text-red-500 text-xs font-bold uppercase tracking-widest text-center">Street not recognized in ALT.</p>}
                <button
                  onClick={handleVetting}
                  className="w-full py-4 bg-forest text-paper rounded-full font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-lg"
                >
                  Verify Residency <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === "role" && (
            <motion.div key="role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-serif text-forest mb-6 text-center">Who are you?</h2>
              <p className="text-ink/70 text-center mb-10 font-medium">
                Tell us how you'll be participating in the community.
              </p>
              <div className="grid gap-4">
                <button
                  onClick={() => handleRoleSelection("neighbor")}
                  className="group p-6 border-2 border-sage rounded-3xl flex items-center gap-6 hover:bg-sage hover:text-paper transition-all text-left"
                >
                  <div className="p-4 bg-sand rounded-2xl group-hover:bg-paper/20"><User className="text-forest group-hover:text-paper" size={32} /></div>
                  <div>
                    <div className="font-serif text-xl font-bold">Neighbor</div>
                    <div className="text-xs opacity-70 uppercase tracking-wider">Find resources & help</div>
                  </div>
                </button>
                <button
                  onClick={() => handleRoleSelection("business")}
                  className="group p-6 border-2 border-forest rounded-3xl flex items-center gap-6 hover:bg-forest hover:text-paper transition-all text-left"
                >
                  <div className="p-4 bg-sand rounded-2xl group-hover:bg-paper/20"><Building2 className="text-forest group-hover:text-paper" size={32} /></div>
                  <div>
                    <div className="font-serif text-xl font-bold">Business</div>
                    <div className="text-xs opacity-70 uppercase tracking-wider">List & offer resources</div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-serif text-forest mb-6 text-center">Customize Profile</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-sage font-bold mb-2 block">Anonymous Username (Optional)</label>
                  <input
                    type="text"
                    placeholder="Enter a username"
                    value={profileData.anonymousName}
                    onChange={(e) => setProfileData({ ...profileData, anonymousName: e.target.value })}
                    className="w-full p-4 rounded-2xl border-2 border-sage bg-sand/20 font-medium focus:outline-none focus:border-forest transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-sage font-bold mb-4 block">Choose Your Nature Icon</label>
                  <div className="grid grid-cols-3 gap-4">
                    {NATURE_ICONS.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => setProfileData({ ...profileData, natureIcon: item.name })}
                        className={`p-4 rounded-2xl border-2 flex items-center justify-center transition-all ${profileData.natureIcon === item.name ? 'border-forest bg-forest text-paper shadow-lg' : 'border-sage text-forest hover:bg-sand'}`}
                      >
                        <item.icon size={32} />
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={completeOnboarding}
                  disabled={isProcessing}
                  className="w-full py-4 bg-forest text-paper rounded-full font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-lg"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : "Complete Setup"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Already part of the Trails? Sign In Helper */}
      {step === "login" && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 mb-20 text-center px-6 w-full max-w-md"
        >
          <button 
            onClick={handleLogin}
            className="text-ink text-[10px] md:text-sm uppercase tracking-[0.2em] font-medium hover:opacity-70 transition-opacity"
          >
            Already part of the Trails? <span className="font-bold underline underline-offset-4 decoration-2">Sign In</span>
          </button>
        </motion.div>
      )}

      {/* Getting Started Guide */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-4xl w-full pb-20"
      >
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-forest mb-4 italic">Getting Started</h2>
          <p className="text-ink/60 font-medium tracking-wide text-sm md:text-base max-w-lg mx-auto">
            Welcome to the Trails! We're glad you're here. Here's how to jump into the Auburn Lake Trails community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div className="flex gap-6 items-start group">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-paper flex items-center justify-center shadow-sm border border-sand group-hover:scale-110 transition-transform">
              <UserPlus className="text-[#8A9A5B]" size={24} />
            </div>
            <div>
              <h3 className="font-serif text-xl text-forest mb-2">Step 1: Join the Trails</h3>
              <p className="text-ink/70 text-sm leading-relaxed">
                Sign up and share your ALT street name so neighbors know you’re a local. 
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start group">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-paper flex items-center justify-center shadow-sm border border-sand group-hover:scale-110 transition-transform">
              <Handshake className="text-[#8A9A5B]" size={24} />
            </div>
            <div>
              <h3 className="font-serif text-xl text-forest mb-2">Step 2: Give or Get</h3>
              <p className="text-ink/70 text-sm leading-relaxed">
                Post a 'Help Offer' if you have a moment to spare, or a 'Help Request' if you need a hand.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start group">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-paper flex items-center justify-center shadow-sm border border-sand group-hover:scale-110 transition-transform">
              <Store className="text-[#8A9A5B]" size={24} />
            </div>
            <div>
              <h3 className="font-serif text-xl text-forest mb-2">Step 3: Grow Local</h3>
              <p className="text-ink/70 text-sm leading-relaxed">
                Are you an ALT business owner? Share your products or professional services with a service-first mindset.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start group">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-paper flex items-center justify-center shadow-sm border border-sand group-hover:scale-110 transition-transform">
              <MessageCircle className="text-[#8A9A5B]" size={24} />
            </div>
            <div>
              <h3 className="font-serif text-xl text-forest mb-2">Step 4: Build Connections</h3>
              <p className="text-ink/70 text-sm leading-relaxed">
                Use the 'Connect' button to coordinate with neighbors and support local pros.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      
      <div className="fixed inset-0 pointer-events-none border-[20px] md:border-[30px] border-sand z-50 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)]"></div>
    </div>
  );
}
