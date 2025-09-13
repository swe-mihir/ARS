import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import { Car, Users, Shield, CheckCircle, Loader } from "lucide-react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    // Get profile data from localStorage (set during signup)
    const pendingProfile = localStorage.getItem('pendingProfile');
    if (pendingProfile) {
      try {
        const data = JSON.parse(pendingProfile);
        setProfileData(data);
      } catch (error) {
        console.error('Error parsing profile data:', error);
        // If no profile data, redirect to signup
        window.location.href = "/account/signup";
      }
    } else {
      // If no profile data, redirect to signup
      window.location.href = "/account/signup";
    }
  }, []);

  useEffect(() => {
    // If user is not authenticated, redirect to signin
    if (!userLoading && !user) {
      window.location.href = "/account/signin";
    }
  }, [user, userLoading]);

  const completeProfile = async () => {
    if (!profileData || !user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authUserId: user.id,
          email: user.email || profileData.email,
          name: profileData.name,
          phone: profileData.phone,
          role: profileData.role,
          // Driver specific fields
          vehicleMake: profileData.vehicleMake,
          vehicleModel: profileData.vehicleModel,
          vehicleYear: profileData.vehicleYear,
          licensePlate: profileData.licensePlate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create profile');
      }

      // Clear the pending profile data
      localStorage.removeItem('pendingProfile');
      setSuccess(true);

      // Redirect to dashboard after success
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);

    } catch (error) {
      console.error('Profile creation error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'driver': return Car;
      case 'admin': return Shield;
      default: return Users;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'driver': return 'green';
      case 'admin': return 'purple';
      default: return 'blue';
    }
  };

  if (userLoading || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F4F0] to-[#ECEAE7] dark:from-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#8B70F6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F4F0] to-[#ECEAE7] dark:from-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 shadow-lg border border-[#E0E0E0] dark:border-[#404040]">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-[#0D0D0D] dark:text-white mb-4" style={{fontFamily: "Instrument Serif, serif"}}>
              Welcome to RideShare!
            </h1>
            <p className="text-[#666666] dark:text-[#AAAAAA] mb-6">
              Your profile has been created successfully. Redirecting to your dashboard...
            </p>
            <div className="w-6 h-6 border-4 border-[#8B70F6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const IconComponent = getRoleIcon(profileData.role);
  const roleColor = getRoleColor(profileData.role);
  
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
    green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700", 
    purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700",
  };

  const iconClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
    purple: "text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F4F0] to-[#ECEAE7] dark:from-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-[#8B70F6] rounded-2xl flex items-center justify-center">
              <Car size={24} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#0D0D0D] dark:text-white mb-2" style={{fontFamily: "Instrument Serif, serif"}}>
            Complete Your Profile
          </h1>
          <p className="text-[#555555] dark:text-[#C0C0C0]">
            Review your information and complete your RideShare setup
          </p>
        </div>

        {/* Profile Preview */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 shadow-lg border border-[#E0E0E0] dark:border-[#404040] mb-6">
          {/* Role Badge */}
          <div className={`p-6 rounded-2xl border-2 mb-6 ${colorClasses[roleColor]}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white dark:bg-[#262626] rounded-xl flex items-center justify-center">
                <IconComponent size={24} className={iconClasses[roleColor]} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#0D0D0D] dark:text-white capitalize">
                  {profileData.role}
                </h3>
                <p className="text-sm text-[#666666] dark:text-[#AAAAAA]">
                  {profileData.role === 'driver' ? 'Accept ride requests and earn money' : 
                   profileData.role === 'admin' ? 'Manage the platform and monitor activity' :
                   'Request rides and get to your destination'}
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4 mb-6">
            <h4 className="text-lg font-semibold text-[#0D0D0D] dark:text-white">Personal Information</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#666666] dark:text-[#AAAAAA] mb-1">
                  Full Name
                </label>
                <div className="text-[#0D0D0D] dark:text-white font-medium">
                  {profileData.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#666666] dark:text-[#AAAAAA] mb-1">
                  Email
                </label>
                <div className="text-[#0D0D0D] dark:text-white font-medium">
                  {user?.email || profileData.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#666666] dark:text-[#AAAAAA] mb-1">
                  Phone Number
                </label>
                <div className="text-[#0D0D0D] dark:text-white font-medium">
                  {profileData.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Information (for drivers) */}
          {profileData.role === 'driver' && (
            <div className="space-y-4 border-t border-[#E0E0E0] dark:border-[#404040] pt-6">
              <h4 className="text-lg font-semibold text-[#0D0D0D] dark:text-white">Vehicle Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#666666] dark:text-[#AAAAAA] mb-1">
                    Make & Model
                  </label>
                  <div className="text-[#0D0D0D] dark:text-white font-medium">
                    {profileData.vehicleMake} {profileData.vehicleModel}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#666666] dark:text-[#AAAAAA] mb-1">
                    Year
                  </label>
                  <div className="text-[#0D0D0D] dark:text-white font-medium">
                    {profileData.vehicleYear}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#666666] dark:text-[#AAAAAA] mb-1">
                    License Plate
                  </label>
                  <div className="text-[#0D0D0D] dark:text-white font-medium">
                    {profileData.licensePlate}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-4 mt-6">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Complete Profile Button */}
          <button
            onClick={completeProfile}
            disabled={loading}
            className="w-full py-3 px-6 rounded-2xl text-white font-semibold text-[15px] transition-all duration-150 hover:bg-[#7E64F2] dark:hover:bg-[#8B70F6] focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:ring-offset-2 disabled:opacity-50 mt-6"
            style={{
              background: loading ? "#9CA3AF" : "linear-gradient(to top, #8B70F6, #9D7DFF)",
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader size={16} className="animate-spin" />
                Creating Profile...
              </div>
            ) : (
              "Complete Profile & Continue"
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-[#666666] dark:text-[#AAAAAA] text-sm">
            Need to make changes?{" "}
            <a
              href="/account/signup"
              className="text-[#8B70F6] hover:text-[#7E64F2] font-medium"
            >
              Go back to signup
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;