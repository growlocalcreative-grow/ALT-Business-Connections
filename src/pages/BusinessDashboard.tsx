/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../contexts/UserContext";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { siteConfig } from "../config/site-config";
import { Building2, Plus, Trash2, Save, Loader2, Camera, Phone, Mail, Globe, ArrowLeft, Image as ImageIcon, Upload } from "lucide-react";
import GlobalNav from "../components/GlobalNav";
import { Link } from "react-router-dom";
import { resizeImage, MAX_IMAGE_DIMENSION, LOGO_DIMENSION, DEFAULT_QUALITY } from "../lib/image-utils";

export default function BusinessDashboard() {
  const { user } = useUser();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newService, setNewService] = useState("");

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "businesses"), where("ownerUid", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setBusiness({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setBusiness(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      if (business?.id) {
        await updateDoc(doc(db, "businesses", business.id), business);
      } else {
        const newDocRef = doc(collection(db, "businesses"));
        const data = {
          ...business,
          id: newDocRef.id,
          ownerUid: user.uid,
          verified: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(newDocRef, data);
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addService = () => {
    if (!newService.trim()) return;
    const services = business?.services || [];
    setBusiness({ ...business, services: [...services, newService.trim()] });
    setNewService("");
  };

  const removeService = (index: number) => {
    const services = [...(business?.services || [])];
    services.splice(index, 1);
    setBusiness({ ...business, services });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-sand"><Loader2 className="animate-spin text-forest" size={48} /></div>;

  return (
    <div className="min-h-screen bg-sand flex flex-col p-[32px] md:p-[60px]">
      <GlobalNav />
      
      <div className="flex-1 p-2 md:p-12">
        <div className="max-w-4xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="p-3 bg-paper border-2 border-forest/10 rounded-2xl text-forest hover:bg-forest hover:text-paper transition-all">
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-4xl font-serif text-forest">Business Dashboard</h1>
                <p className="text-sage font-medium uppercase tracking-widest text-xs mt-2">Manage your ALT presence</p>
              </div>
            </div>
            {!business?.verified && (
              <div className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-200">
                Pending Verification
              </div>
            )}
          </header>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Info */}
          <div className="bg-paper p-8 rounded-[40px] border-4 border-ink shadow-xl space-y-6">
            <h2 className="font-serif text-2xl text-forest mb-4">Listing Details</h2>
            
            <div className="space-y-4">
              <Input label="Business Name" value={business?.name || ""} onChange={(v) => setBusiness({ ...business, name: v })} />
              <Input label="Category" value={business?.category || ""} onChange={(v) => setBusiness({ ...business, category: v })} />
              
              <div>
                <label className="text-[10px] uppercase tracking-widest text-sage font-bold mb-2 block">Business Logo</label>
                <div className="flex items-center gap-4">
                  {business?.logo ? (
                    <div className="relative group">
                      <img src={business.logo} alt="Logo" className="w-20 h-20 rounded-2xl object-cover border-2 border-forest ring-4 ring-sand shadow-lg" referrerPolicy="no-referrer" />
                      <button 
                        type="button" 
                        onClick={() => setBusiness({ ...business, logo: "" })}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <ImageUpload 
                      onUpload={(url) => setBusiness({ ...business, logo: url })}
                      maxWidth={LOGO_DIMENSION}
                      maxHeight={LOGO_DIMENSION}
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-[10px] text-sage font-medium leading-tight">Recommended: 400x400px</p>
                    <p className="text-[8px] text-sage/70 uppercase tracking-tighter mt-1">Files under 2MB accepted</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-sage font-bold mb-2 block">Description</label>
                <textarea
                  value={business?.description || ""}
                  onChange={(e) => setBusiness({ ...business, description: e.target.value })}
                  className="w-full p-4 rounded-2xl border-2 border-sage bg-sand/10 font-medium focus:outline-none focus:border-forest h-32"
                />
              </div>
            </div>
          </div>

          {/* Contact & Media */}
          <div className="space-y-8">
            <div className="bg-paper p-8 rounded-[40px] border-4 border-ink shadow-xl space-y-6">
              <h2 className="font-serif text-2xl text-forest mb-4">Contact Info</h2>
              <div className="space-y-4">
                <Input label="Phone" icon={<Phone size={16} />} value={business?.phone || ""} onChange={(v) => setBusiness({ ...business, phone: v })} />
                <Input label="Email" icon={<Mail size={16} />} value={business?.email || ""} onChange={(v) => setBusiness({ ...business, email: v })} />
                <Input label="Website" icon={<Globe size={16} />} value={business?.website || ""} onChange={(v) => setBusiness({ ...business, website: v })} />
              </div>
            </div>

            <div className="bg-paper p-8 rounded-[40px] border-4 border-ink shadow-xl space-y-6">
              <h2 className="font-serif text-2xl text-forest mb-4">Services Offered</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a service..."
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="flex-1 p-3 rounded-xl border-2 border-sage bg-sand/10 font-medium focus:outline-none focus:border-forest text-sm"
                />
                <button type="button" onClick={addService} className="p-3 bg-forest text-paper rounded-xl hover:bg-opacity-90 transition-all">
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {business?.services?.map((s: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-sand text-forest rounded-full text-xs font-bold flex items-center gap-2">
                    {s} <button type="button" onClick={() => removeService(i)}><Trash2 size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Photos Section */}
          <div className="md:col-span-2 bg-paper p-8 rounded-[40px] border-4 border-ink shadow-xl">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="font-serif text-2xl text-forest">Showcase Photos</h2>
                <p className="text-[10px] text-sage font-bold uppercase tracking-widest">Max 3 photos • Best with {MAX_IMAGE_DIMENSION}px width</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => {
                const photoUrl = business?.photos?.[i];
                return (
                  <div key={i} className="group aspect-video bg-sand/20 rounded-3xl border-2 border-dashed border-sage flex flex-col items-center justify-center text-sage relative overflow-hidden transition-all hover:border-forest/50">
                    {photoUrl ? (
                      <>
                        <img src={photoUrl} alt={`Showcase ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-forest/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => {
                              const newPhotos = [...(business.photos || [])];
                              newPhotos.splice(i, 1);
                              setBusiness({ ...business, photos: newPhotos });
                            }}
                            className="p-3 bg-red-500 text-paper rounded-full shadow-xl hover:scale-110 transition-transform"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                        <ImageUpload 
                          onUpload={(url) => {
                            const newPhotos = [...(business?.photos || [])];
                            newPhotos[i] = url;
                            setBusiness({ ...business, photos: newPhotos });
                          }}
                          maxWidth={MAX_IMAGE_DIMENSION}
                          label={`Slot ${i + 1}`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-[9px] text-sage font-bold uppercase tracking-[0.2em] text-center max-w-lg mx-auto leading-relaxed">
              Showcase your local charm. Photos appear in the community directory. Files are automatically resized for web performance.
            </p>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-12 py-4 bg-forest text-paper rounded-full font-bold uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-opacity-90 transition-all shadow-xl"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>

      <div className="fixed inset-0 pointer-events-none border-[20px] md:border-[30px] border-sand z-50 shadow-[inset_0_0_40px_rgba(0,0,0,0.05)]"></div>
    </div>
  );
}

function ImageUpload({ 
  onUpload, 
  maxWidth = MAX_IMAGE_DIMENSION, 
  maxHeight = MAX_IMAGE_DIMENSION,
  label = "Upload Image"
}: { 
  onUpload: (url: string) => void, 
  maxWidth?: number, 
  maxHeight?: number,
  label?: string
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (2MB limit for sanity)
    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Please select an image under 2MB.");
      return;
    }

    setIsUploading(true);
    try {
      const resizedBase64 = await resizeImage(file, {
        maxWidth,
        maxHeight,
        quality: DEFAULT_QUALITY
      });
      onUpload(resizedBase64);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to process image. Try a different file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <button
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-forest ring-4 ring-sand bg-paper text-forest hover:bg-forest hover:text-paper transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isUploading ? (
          <Loader2 className="animate-spin" size={24} />
        ) : (
          <>
            <Upload size={24} className="mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
          </>
        )}
      </button>
    </div>
  );
}

function Input({ label, value, onChange, icon, placeholder }: { label: string, value: string, onChange: (v: string) => void, icon?: React.ReactNode, placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-sage font-bold mb-2 block">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sage">{icon}</div>}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-4 rounded-2xl border-2 border-sage bg-sand/10 font-medium focus:outline-none focus:border-forest transition-all ${icon ? 'pl-12' : ''}`}
        />
      </div>
    </div>
  );
}
