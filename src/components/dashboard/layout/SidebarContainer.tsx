
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarLinks } from "@/components/dashboard/SidebarLinks";
import { supabase } from "@/integrations/supabase/client";

export function SidebarContainer() {
  const [isOpen, setIsOpen] = useState(false);
  const [pharmacyName, setPharmacyName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPharmacyName = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("pharmacy_name")
            .eq("id", user.id)
            .single();
          
          if (profile?.pharmacy_name) {
            setPharmacyName(profile.pharmacy_name);
          } else {
            setPharmacyName("My Pharmacy");
          }
        } else {
          setPharmacyName("My Pharmacy");
        }
      } catch (error) {
        console.error("Error fetching pharmacy name:", error);
        setPharmacyName("My Pharmacy");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPharmacyName();
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white shadow-md"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                {isLoading ? (
                  <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <h1 className="pharmacy-name text-lg font-semibold text-gray-900" title={pharmacyName}>
                    {pharmacyName}
                  </h1>
                )}
                <p className="text-xs text-gray-500 mt-1">Victure</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <SidebarLinks onNavigate={() => setIsOpen(false)} />
          </div>
        </div>
      </div>

      <style>{`
        .pharmacy-name {
          max-width: 180px;
          word-wrap: break-word;
          hyphens: auto;
          line-height: 1.2;
          max-height: 2.4em;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </>
  );
}
