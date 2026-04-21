import React from "react";
import { Link } from "react-router-dom";
import { 
  LogOut, Users, Shield, TreePine, Leaf, Flower2, Bird, Mountain, Waves, LucideIcon 
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { siteConfig } from "../config/site-config";

const NATURE_ICONS: Record<string, any> = {
  TreePine, Leaf, Flower2, Bird, Mountain, Waves
};

export default function GlobalNav() {
  const { user, profile } = useUser();

  const UserIcon = profile?.natureIcon ? NATURE_ICONS[profile.natureIcon] : null;

  return (
    <header className="px-6 py-4 md:px-12 flex justify-between items-center bg-paper border-b border-black/5 sticky top-0 z-[60] shadow-sm rounded-b-[24px]">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="font-serif text-2xl font-bold text-forest tracking-widest hover:text-sage transition-colors">
          {siteConfig.shortName}
        </Link>
        {(profile?.role === "admin" || user?.email === "growlocalcreative@gmail.com") && (
          <Link to="/admin/portal" className="p-2 bg-forest text-paper rounded-xl hover:bg-opacity-90 transition-all shadow-md" title="Admin Portal">
            <Shield size={18} />
          </Link>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-forest">{profile?.anonymousName || profile?.displayName}</span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-sage">{profile?.role} • {profile?.streetName}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-sand border-2 border-forest flex items-center justify-center text-forest overflow-hidden shadow-inner">
          {UserIcon ? React.createElement(UserIcon as LucideIcon, { size: 24 }) : <Users size={24} />}
        </div>
        <button 
          onClick={() => signOut(auth)}
          className="p-2 text-forest hover:bg-sand rounded-xl transition-all"
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
