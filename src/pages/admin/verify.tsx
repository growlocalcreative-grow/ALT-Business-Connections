/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { siteConfig } from "../../config/site-config";
import { ShieldCheck, XCircle, Loader2, Camera, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminVerify() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualUid, setManualUid] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, []);

  async function onScanSuccess(decodedText: string) {
    if (status === "loading") return;
    
    setScanResult(decodedText);
    setStatus("loading");
    
    try {
      // Assuming the QR code contains the User ID
      const userDocRef = doc(db, "users", decodedText);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          status: "verified",
          verifiedAt: new Date().toISOString(),
          verifiedBy: "admin" // In a real app, this would be the logged-in admin's ID
        });
        setStatus("success");
      } else {
        throw new Error("User not found in database.");
      }
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Verification failed.");
    }
  }

  function onScanFailure(error: any) {
    // Silently ignore scan failures (they happen every frame if no QR is found)
  }

  const resetScanner = () => {
    setScanResult(null);
    setStatus("idle");
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center p-4">
      <header className="w-full max-w-md flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 bg-paper border border-forest/10 rounded-xl text-forest hover:bg-forest hover:text-paper transition-all">
            <LayoutDashboard size={18} />
          </Link>
          <div className="text-forest font-serif text-xl font-bold tracking-widest">{siteConfig.shortName} Admin</div>
        </div>
        <div className="px-3 py-1 bg-forest text-paper text-[10px] uppercase tracking-widest rounded-full font-bold">
          Handshake
        </div>
      </header>

      <main className="w-full max-w-md flex-1 flex flex-col items-center">
        <div className="w-full aspect-square bg-paper rounded-[40px] shadow-2xl overflow-hidden relative border-[12px] border-ink">
          <div className="absolute top-0 left-0 w-full p-6 text-center border-b border-black/5 z-20 bg-paper">
            <span className="text-[12px] uppercase tracking-[2px] text-sage font-bold">Admin Handshake</span>
          </div>
          
          <div className="w-full h-full pt-16 relative">
            <div id="reader" className="w-full h-full"></div>
            
            {/* QR Frame Overlays from Design */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-60 h-60 border-2 border-sage rounded-3xl relative">
                {/* Corner Accents */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-forest rounded-tl-xl"></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-forest rounded-tr-xl"></div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-forest rounded-bl-xl"></div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-forest rounded-br-xl"></div>
              </div>
            </div>
          </div>
          
          <AnimatePresence>
            {status !== "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 bg-forest/95 flex flex-col items-center justify-center text-paper p-8 text-center"
              >
                {status === "loading" && (
                  <Loader2 className="animate-spin mb-4" size={48} />
                )}
                {status === "success" && (
                  <>
                    <ShieldCheck className="text-sage mb-4" size={64} />
                    <h2 className="text-2xl font-serif mb-2">Verified</h2>
                    <p className="text-sm opacity-80 mb-6 uppercase tracking-widest">Connection Secured</p>
                  </>
                )}
                {status === "error" && (
                  <>
                    <XCircle className="text-red-400 mb-4" size={64} />
                    <h2 className="text-2xl font-serif mb-2">Failed</h2>
                    <p className="text-sm opacity-80 mb-6">{errorMsg}</p>
                  </>
                )}
                
                {status !== "loading" && (
                  <button
                    onClick={resetScanner}
                    className="px-8 py-3 bg-paper text-forest rounded-full font-bold uppercase text-xs tracking-widest"
                  >
                    Scan Next
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phone Nav Dots from Design */}
          <div className="absolute bottom-0 left-0 w-full h-16 bg-white border-t border-black/5 flex justify-around items-center px-20">
            <div className="w-2.5 h-2.5 bg-sand rounded-full"></div>
            <div className="w-2.5 h-2.5 bg-forest rounded-full scale-125"></div>
            <div className="w-2.5 h-2.5 bg-sand rounded-full"></div>
          </div>
        </div>

        <div className="mt-8 text-center w-full">
          <p className="text-sm text-forest/70 max-w-[220px] mx-auto font-medium mb-6">
            Position the member's QR code within the frame to verify connection.
          </p>

          <div className="bg-paper p-6 rounded-3xl border-2 border-sage/20 shadow-sm">
            <span className="text-[10px] uppercase tracking-widest text-sage font-bold mb-3 block">Manual Bypass (Testing)</span>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Enter User UID"
                value={manualUid}
                onChange={(e) => setManualUid(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border-2 border-sand bg-sand/10 text-xs font-medium focus:outline-none focus:border-forest"
              />
              <button 
                onClick={() => onScanSuccess(manualUid)}
                disabled={!manualUid || status === "loading"}
                className="px-4 py-2 bg-forest text-paper rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-opacity-90 disabled:opacity-50 transition-all"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-md py-8 text-center text-[10px] uppercase tracking-[0.3em] text-forest/40 font-bold">
        ALT Business Connections • Admin
      </footer>
    </div>
  );
}
