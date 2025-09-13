import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import {
  Car,
  Users,
  Shield,
  Loader,
  MapPin,
  Clock,
  Star,
  Plus,
  Bell,
  Menu,
  LogOut,
} from "lucide-react";

function MainComponent() {
  const { data: authUser, loading: authLoading } = useUser();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser) return;

      try {
        setProfileLoading(true);
        const response = await fetch("/api/users/profile");

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();

        // If user doesn't have a complete profile, redirect to onboarding
        if (!data.hasProfile) {
          window.location.href = "/onboarding";
          return;
        }

        setProfile(data.profile);
      } catch (error) {
        console.error("Profile fetch error:", error);
        setError(error.message);
      } finally {
        setProfileLoading(false);
      }
    };

    if (!authLoading) {
      if (!authUser) {
        // Not authenticated, redirect to signin
        window.location.href = "/account/signin";
      } else {
        fetchProfile();
      }
    }
  }, [authUser, authLoading]);

  // Show loading screen
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F4F0] to-[#ECEAE7] dark:from-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#8B70F6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#666666] dark:text-[#AAAAAA]">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show error screen
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F4F0] to-[#ECEAE7] dark:from-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 shadow-lg border border-[#E0E0E0] dark:border-[#404040]">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-[#0D0D0D] dark:text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-[#666666] dark:text-[#AAAAAA] mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-2xl text-white font-semibold text-sm transition-all duration-150 hover:bg-[#7E64F2] dark:hover:bg-[#8B70F6]"
              style={{
                background: "linear-gradient(to top, #8B70F6, #9D7DFF)",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Header Component
  const DashboardHeader = ({ profile, onSignOut }) => (
    <header className="bg-white dark:bg-[#1E1E1E] border-b border-[#E0E0E0] dark:border-[#404040] px-6 py-4">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#8B70F6] rounded-2xl flex items-center justify-center">
            <Car size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-[#121212] dark:text-white font-semibold text-lg">
              RideShare
            </h1>
            <p className="text-sm text-[#666666] dark:text-[#AAAAAA] capitalize">
              {profile.role} Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative p-2 rounded-xl hover:bg-[#F5F4F3] dark:hover:bg-[#262626] transition-colors">
            <Bell size={20} className="text-[#666666] dark:text-[#AAAAAA]" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-[#121212] dark:text-white">
                {profile.name}
              </p>
              <p className="text-xs text-[#666666] dark:text-[#AAAAAA] capitalize">
                {profile.role}
              </p>
            </div>
            <button
              onClick={onSignOut}
              className="p-2 rounded-xl hover:bg-[#F5F4F3] dark:hover:bg-[#262626] transition-colors"
              title="Sign Out"
            >
              <LogOut
                size={20}
                className="text-[#666666] dark:text-[#AAAAAA]"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  // Stats Card Component
  const StatsCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl p-6 border border-[#E0E0E0] dark:border-[#404040]">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            color === "blue"
              ? "bg-blue-50 dark:bg-blue-900/30"
              : color === "green"
                ? "bg-green-50 dark:bg-green-900/30"
                : color === "purple"
                  ? "bg-purple-50 dark:bg-purple-900/30"
                  : "bg-gray-50 dark:bg-gray-900/30"
          }`}
        >
          <Icon
            size={24}
            className={
              color === "blue"
                ? "text-blue-600 dark:text-blue-400"
                : color === "green"
                  ? "text-green-600 dark:text-green-400"
                  : color === "purple"
                    ? "text-purple-600 dark:text-purple-400"
                    : "text-gray-600 dark:text-gray-400"
            }
          />
        </div>
        {trend && (
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              trend.type === "up"
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-[#0D0D0D] dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-sm text-[#666666] dark:text-[#AAAAAA]">{title}</p>
    </div>
  );

  const handleSignOut = () => {
    window.location.href = "/account/logout";
  };

  // Render appropriate dashboard based on user role
  if (profile) {
    return (
      <div className="min-h-screen bg-[#F5F4F0] dark:bg-[#121212]">
        <DashboardHeader profile={profile} onSignOut={handleSignOut} />

        {profile.role === "passenger" && (
          <main className="max-w-[1200px] mx-auto p-6">
            {/* Passenger Dashboard */}
            <div className="mb-8">
              <h2
                className="text-3xl font-bold text-[#0D0D0D] dark:text-white mb-2"
                style={{ fontFamily: "Instrument Serif, serif" }}
              >
                Welcome back, {profile.name.split(" ")[0]}!
              </h2>
              <p className="text-[#666666] dark:text-[#AAAAAA]">
                Where would you like to go today?
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard
                title="Total Rides"
                value="12"
                icon={Car}
                color="blue"
                trend={{ type: "up", value: "+3" }}
              />
              <StatsCard
                title="Average Rating"
                value="4.8"
                icon={Star}
                color="green"
              />
              <StatsCard
                title="Money Saved"
                value="$247"
                icon={Users}
                color="purple"
                trend={{ type: "up", value: "+$45" }}
              />
            </div>

            {/* Request Ride Card */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 border border-[#E0E0E0] dark:border-[#404040] mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-[#0D0D0D] dark:text-white">
                  Request a Ride
                </h3>
                <div className="w-12 h-12 bg-[#8B70F6] rounded-2xl flex items-center justify-center">
                  <Plus size={24} className="text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0D0D0D] dark:text-white mb-2">
                    Pickup Location
                  </label>
                  <div className="relative">
                    <MapPin
                      size={20}
                      className="absolute left-3 top-3 text-[#666666] dark:text-[#AAAAAA]"
                    />
                    <input
                      type="text"
                      placeholder="Enter pickup location"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#262626] text-[#0D0D0D] dark:text-white placeholder-[#666666] dark:placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0D0D0D] dark:text-white mb-2">
                    Destination
                  </label>
                  <div className="relative">
                    <MapPin
                      size={20}
                      className="absolute left-3 top-3 text-[#666666] dark:text-[#AAAAAA]"
                    />
                    <input
                      type="text"
                      placeholder="Enter destination"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#262626] text-[#0D0D0D] dark:text-white placeholder-[#666666] dark:placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  className="w-full py-3 px-6 rounded-2xl text-white font-semibold text-[15px] transition-all duration-150 hover:bg-[#7E64F2] dark:hover:bg-[#8B70F6]"
                  style={{
                    background: "linear-gradient(to top, #8B70F6, #9D7DFF)",
                  }}
                >
                  Find a Driver
                </button>
              </div>
            </div>

            {/* Recent Rides */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 border border-[#E0E0E0] dark:border-[#404040]">
              <h3 className="text-2xl font-semibold text-[#0D0D0D] dark:text-white mb-6">
                Recent Rides
              </h3>
              <div className="text-center py-8">
                <Car
                  size={48}
                  className="text-[#666666] dark:text-[#AAAAAA] mx-auto mb-4 opacity-50"
                />
                <p className="text-[#666666] dark:text-[#AAAAAA]">
                  No recent rides to show. Request your first ride above!
                </p>
              </div>
            </div>
          </main>
        )}

        {profile.role === "driver" && (
          <main className="max-w-[1200px] mx-auto p-6">
            {/* Driver Dashboard */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    className="text-3xl font-bold text-[#0D0D0D] dark:text-white mb-2"
                    style={{ fontFamily: "Instrument Serif, serif" }}
                  >
                    Driver Dashboard
                  </h2>
                  <p className="text-[#666666] dark:text-[#AAAAAA]">
                    {profile.driver?.vehicle_make}{" "}
                    {profile.driver?.vehicle_model} •{" "}
                    {profile.driver?.license_plate}
                  </p>
                </div>
                <div
                  className={`px-4 py-2 rounded-2xl text-sm font-medium ${
                    profile.driver?.is_available
                      ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {profile.driver?.is_available ? "Available" : "Offline"}
                </div>
              </div>
            </div>

            {/* Driver Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Rating"
                value={profile.driver?.rating?.toFixed(1) || "5.0"}
                icon={Star}
                color="green"
              />
              <StatsCard
                title="Total Rides"
                value={profile.driver?.total_rides?.toString() || "0"}
                icon={Car}
                color="blue"
              />
              <StatsCard
                title="Today's Earnings"
                value="$124"
                icon={Users}
                color="purple"
                trend={{ type: "up", value: "+$45" }}
              />
              <StatsCard
                title="Active Requests"
                value="3"
                icon={Bell}
                color="blue"
              />
            </div>

            {/* Availability Toggle */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 border border-[#E0E0E0] dark:border-[#404040] mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#0D0D0D] dark:text-white">
                    Driver Status
                  </h3>
                  <p className="text-sm text-[#666666] dark:text-[#AAAAAA]">
                    Turn on to receive ride requests
                  </p>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    profile.driver?.is_available
                      ? "bg-[#8B70F6]"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profile.driver?.is_available
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Incoming Requests */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 border border-[#E0E0E0] dark:border-[#404040]">
              <h3 className="text-2xl font-semibold text-[#0D0D0D] dark:text-white mb-6">
                Incoming Ride Requests
              </h3>
              <div className="text-center py-8">
                <Clock
                  size={48}
                  className="text-[#666666] dark:text-[#AAAAAA] mx-auto mb-4 opacity-50"
                />
                <p className="text-[#666666] dark:text-[#AAAAAA]">
                  No incoming requests. Make sure you're online to receive
                  rides.
                </p>
              </div>
            </div>
          </main>
        )}

        {profile.role === "admin" && (
          <main className="max-w-[1200px] mx-auto p-6">
            {/* Admin Dashboard */}
            <div className="mb-8">
              <h2
                className="text-3xl font-bold text-[#0D0D0D] dark:text-white mb-2"
                style={{ fontFamily: "Instrument Serif, serif" }}
              >
                Admin Dashboard
              </h2>
              <p className="text-[#666666] dark:text-[#AAAAAA]">
                Monitor platform activity and manage users
              </p>
            </div>

            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Active Rides"
                value="24"
                icon={Car}
                color="green"
                trend={{ type: "up", value: "+5" }}
              />
              <StatsCard
                title="Total Users"
                value="1,847"
                icon={Users}
                color="blue"
                trend={{ type: "up", value: "+12" }}
              />
              <StatsCard
                title="Online Drivers"
                value="156"
                icon={Shield}
                color="purple"
              />
              <StatsCard
                title="Rides Today"
                value="342"
                icon={Clock}
                color="green"
                trend={{ type: "up", value: "+28" }}
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 border border-[#E0E0E0] dark:border-[#404040]">
              <h3 className="text-2xl font-semibold text-[#0D0D0D] dark:text-white mb-6">
                Real-time Activity
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F5F4F3] dark:bg-[#262626] rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Car
                        size={16}
                        className="text-green-600 dark:text-green-400"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0D0D0D] dark:text-white">
                        New ride completed
                      </p>
                      <p className="text-xs text-[#666666] dark:text-[#AAAAAA]">
                        John Driver → Alice Passenger
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#666666] dark:text-[#AAAAAA]">
                    2 min ago
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F5F4F3] dark:bg-[#262626] rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <Users
                        size={16}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0D0D0D] dark:text-white">
                        New user registered
                      </p>
                      <p className="text-xs text-[#666666] dark:text-[#AAAAAA]">
                        sarah.wilson@email.com as Passenger
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#666666] dark:text-[#AAAAAA]">
                    5 min ago
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F5F4F3] dark:bg-[#262626] rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <Shield
                        size={16}
                        className="text-purple-600 dark:text-purple-400"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0D0D0D] dark:text-white">
                        Driver verification approved
                      </p>
                      <p className="text-xs text-[#666666] dark:text-[#AAAAAA]">
                        Mike Thompson - Honda Civic
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#666666] dark:text-[#AAAAAA]">
                    10 min ago
                  </span>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    );
  }

  return null;
}

export default MainComponent;
