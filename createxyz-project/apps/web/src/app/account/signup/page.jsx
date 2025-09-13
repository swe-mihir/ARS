import { useState } from "react";
import useAuth from "@/utils/useAuth";
import { Car, Users, Shield, ArrowLeft } from "lucide-react";

function MainComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: role selection, 2: form
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    role: "",
    // Driver specific fields
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    licensePlate: "",
  });

  const { signUpWithCredentials } = useAuth();

  const roles = [
    {
      id: "passenger",
      title: "Passenger",
      description: "Request rides and get to your destination",
      icon: Users,
      color: "blue",
    },
    {
      id: "driver",
      title: "Driver",
      description: "Accept ride requests and earn money",
      icon: Car,
      color: "green",
    },
    {
      id: "admin",
      title: "Admin",
      description: "Manage the platform and monitor activity",
      icon: Shield,
      color: "purple",
    },
  ];

  const handleRoleSelect = (roleId) => {
    setFormData({ ...formData, role: roleId });
    setStep(2);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { email, password, name, phone, role } = formData;

    if (!email || !password || !name || !phone || !role) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (role === "driver") {
      const { vehicleMake, vehicleModel, vehicleYear, licensePlate } = formData;
      if (!vehicleMake || !vehicleModel || !vehicleYear || !licensePlate) {
        setError("Please fill in all vehicle information");
        setLoading(false);
        return;
      }
    }

    try {
      // First create the auth account
      await signUpWithCredentials({
        email,
        password,
        callbackUrl: "/onboarding",
        redirect: false,
      });

      // Store additional profile data in localStorage for the onboarding process
      localStorage.setItem('pendingProfile', JSON.stringify(formData));
      
      // Redirect to onboarding
      window.location.href = "/onboarding";
    } catch (err) {
      const errorMessages = {
        EmailCreateAccount: "This email is already registered. Try signing in instead.",
        CredentialsSignin: "Invalid email or password.",
        AccessDenied: "You don't have permission to sign up.",
        Configuration: "Sign-up isn't working right now. Please try again later.",
      };

      setError(
        errorMessages[err.message] || "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F4F0] to-[#ECEAE7] dark:from-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-[#8B70F6] rounded-2xl flex items-center justify-center">
                <Car size={24} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-[#0D0D0D] dark:text-white mb-2" style={{fontFamily: "Instrument Serif, serif"}}>
              Join RideShare
            </h1>
            <p className="text-[#555555] dark:text-[#C0C0C0]">
              Choose your role to get started
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role) => {
              const IconComponent = role.icon;
              const colorClasses = {
                blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600",
                green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600",
                purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600",
              };
              const iconClasses = {
                blue: "text-blue-600 dark:text-blue-400",
                green: "text-green-600 dark:text-green-400",
                purple: "text-purple-600 dark:text-purple-400",
              };

              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`p-8 rounded-3xl border-2 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:ring-offset-2 ${colorClasses[role.color]}`}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white dark:bg-[#262626] flex items-center justify-center">
                      <IconComponent size={32} className={iconClasses[role.color]} />
                    </div>
                    <h3 className="text-xl font-semibold text-[#0D0D0D] dark:text-white mb-2">
                      {role.title}
                    </h3>
                    <p className="text-[#666666] dark:text-[#AAAAAA] text-sm">
                      {role.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <p className="text-[#666666] dark:text-[#AAAAAA] text-sm">
              Already have an account?{" "}
              <a
                href="/account/signin"
                className="text-[#8B70F6] hover:text-[#7E64F2] font-medium"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F4F0] to-[#ECEAE7] dark:from-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-2 text-[#666666] dark:text-[#AAAAAA] hover:text-[#0D0D0D] dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to role selection</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0D0D0D] dark:text-white mb-2" style={{fontFamily: "Instrument Serif, serif"}}>
            Create Your Account
          </h1>
          <p className="text-[#555555] dark:text-[#C0C0C0]">
            Complete your {formData.role} profile
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="bg-white dark:bg-[#1E1E1E] rounded-3xl p-8 shadow-lg border border-[#E0E0E0] dark:border-[#404040]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-[#0D0D0D] dark:text-white mb-2">
                Full Name
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-2xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#262626] text-[#0D0D0D] dark:text-white placeholder-[#666666] dark:placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0D0D0D] dark:text-white mb-2">
                Email
              </label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-2xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#262626] text-[#0D0D0D] dark:text-white placeholder-[#666666] dark:placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0D0D0D] dark:text-white mb-2">
                Phone Number
              </label>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter your phone number"
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
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Create a password"
                className="w-full px-4 py-3 rounded-2xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#262626] text-[#0D0D0D] dark:text-white placeholder-[#666666] dark:placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent transition-colors"
              />
            </div>

            {/* Driver-specific fields */}
            {formData.role === "driver" && (
              <>
                <div className="border-t border-[#E0E0E0] dark:border-[#404040] pt-6">
                  <h3 className="text-lg font-semibold text-[#0D0D0D] dark:text-white mb-4">
                    Vehicle Information
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0D0D0D] dark:text-white mb-2">
                      Make
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.vehicleMake}
                      onChange={(e) => handleInputChange("vehicleMake", e.target.value)}
                      placeholder="Toyota"
                      className="w-full px-4 py-3 rounded-2xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#262626] text-[#0D0D0D] dark:text-white placeholder-[#666666] dark:placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0D0D0D] dark:text-white mb-2">
                      Model
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.vehicleModel}
                      onChange={(e) => handleInputChange("vehicleModel", e.target.value)}
                      placeholder="Camry"
                      className="w-full px-4 py-3 rounded-2xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#262626] text-[#0D0D0D] dark:text-white placeholder-[#666666] dark:placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0D0D0D] dark:text-white mb-2">
                      Year
                    </label>
                    <input
                      required
                      type="number"
                      min="2000"
                      max="2025"
                      value={formData.vehicleYear}
                      onChange={(e) => handleInputChange("vehicleYear", e.target.value)}
                      placeholder="2020"
                      className="w-full px-4 py-3 rounded-2xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#262626] text-[#0D0D0D] dark:text-white placeholder-[#666666] dark:placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0D0D0D] dark:text-white mb-2">
                      License Plate
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.licensePlate}
                      onChange={(e) => handleInputChange("licensePlate", e.target.value)}
                      placeholder="ABC123"
                      className="w-full px-4 py-3 rounded-2xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#262626] text-[#0D0D0D] dark:text-white placeholder-[#666666] dark:placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#8B70F6] focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

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
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MainComponent;