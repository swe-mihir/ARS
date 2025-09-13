import { useEffect } from "react";
import useAuth from "@/utils/useAuth";
import { Car, LogOut } from "lucide-react";

function MainComponent() {
  const { signOut } = useAuth();

  useEffect(() => {
    // Auto sign out when page loads
    handleSignOut();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback redirect
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F4F0] to-[#ECEAE7] dark:from-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-[#8B70F6] rounded-2xl flex items-center justify-center">
              <Car size={24} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#0D0D0D] dark:text-white mb-2" style={{fontFamily: "Instrument Serif, serif"}}>
            Signing Out
          </h1>
          <p className="text-[#555555] dark:text-[#C0C0C0]">
            You are being signed out of your RideShare account
          </p>
        </div>

        {/* Loading Animation */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 shadow-lg border border-[#E0E0E0] dark:border-[#404040]">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 border-4 border-[#8B70F6] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-[#666666] dark:text-[#AAAAAA] text-sm">
            Please wait while we sign you out...
          </p>
        </div>

        {/* Manual Sign Out Button */}
        <div className="mt-6">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 mx-auto py-3 px-6 rounded-2xl text-white font-semibold text-[15px] transition-all duration-150 hover:bg-[#7E64F2] dark:hover:bg-[#8B70F6] focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:ring-offset-2"
            style={{
              background: "linear-gradient(to top, #8B70F6, #9D7DFF)",
            }}
          >
            <LogOut size={16} />
            Sign Out Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;