import { useState } from "react";
import useAuth from "@/utils/useAuth";
import { Car, Users, Shield } from "lucide-react";

function MainComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signInWithCredentials } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      await signInWithCredentials({
        email,
        password,
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      const errorMessages = {
        CredentialsSignin: "Invalid email or password. Please try again.",
        AccessDenied: "You don't have permission to sign in.",
        Configuration: "Sign-in isn't working right now. Please try again later.",
      };

      setError(
        errorMessages[err.message] || "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F4F0] to-[#ECEAE7] dark:from-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-[#8B70F6] rounded-2xl flex items-center justify-center">
              <Car size={24} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#0D0D0D] dark:text-white mb-2" style={{fontFamily: "Instrument Serif, serif"}}>
            Welcome Back
          </h1>
          <p className="text-[#555555] dark:text-[#C0C0C0]">
            Sign in to your RideShare account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 shadow-lg border border-[#E0E0E0] dark:border-[#404040]">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#0D0D0D] dark:text-white mb-2">
                Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-2xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#262626] text-[#0D0D0D] dark:text-white placeholder-[#666666] dark:placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0D0D0D] dark:text-white mb-2">
                Password
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-2xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#262626] text-[#0D0D0D] dark:text-white placeholder-[#666666] dark:placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-2xl text-white font-semibold text-[15px] transition-all duration-150 hover:bg-[#7E64F2] dark:hover:bg-[#8B70F6] focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:ring-offset-2 disabled:opacity-50"
              style={{
                background: loading ? "#9CA3AF" : "linear-gradient(to top, #8B70F6, #9D7DFF)",
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="text-center">
              <p className="text-[#666666] dark:text-[#AAAAAA] text-sm">
                Don't have an account?{" "}
                <a
                  href={`/account/signup${typeof window !== "undefined" ? window.location.search : ""}`}
                  className="text-[#8B70F6] hover:text-[#7E64F2] font-medium"
                >
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </form>

        {/* Demo Accounts */}
        <div className="mt-8 bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 shadow-lg border border-[#E0E0E0] dark:border-[#404040]">
          <h3 className="text-lg font-semibold text-[#0D0D0D] dark:text-white mb-4">Demo Accounts</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-2 mx-auto">
                <Users size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs font-medium text-[#0D0D0D] dark:text-white">Passenger</p>
              <p className="text-xs text-[#666666] dark:text-[#AAAAAA]">bob.passenger@email.com</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-2 mx-auto">
                <Car size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs font-medium text-[#0D0D0D] dark:text-white">Driver</p>
              <p className="text-xs text-[#666666] dark:text-[#AAAAAA]">john.driver@email.com</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-2 mx-auto">
                <Shield size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs font-medium text-[#0D0D0D] dark:text-white">Admin</p>
              <p className="text-xs text-[#666666] dark:text-[#AAAAAA]">admin@rideapp.com</p>
            </div>
          </div>
          <p className="text-xs text-center text-[#666666] dark:text-[#AAAAAA] mt-4">
            Password for all demo accounts: <span className="font-mono">password123</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;