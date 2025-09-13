import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import { Car, Users, Shield, MapPin, Clock, Star, ArrowRight, Play } from "lucide-react";

function MainComponent() {
  const { data: user, loading } = useUser();
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!loading && user) {
      // This will be handled by the onboarding/dashboard logic later
      window.location.href = "/dashboard";
    }
  }, [user, loading]);

  const features = [
    {
      id: "instant-matching",
      icon: Clock,
      title: "Instant Matching",
      description: "Advanced algorithm matches you with nearby drivers in seconds",
      isActive: true,
    },
    {
      id: "real-time-tracking",
      icon: MapPin,
      title: "Real-time Tracking",
      description: "Track your ride from pickup to destination with live updates",
    },
    {
      id: "trusted-community",
      icon: Star,
      title: "Trusted Community",
      description: "Verified drivers and passengers with ratings and reviews",
    },
    {
      id: "student-friendly",
      icon: Users,
      title: "Student Friendly",
      description: "Affordable rides designed for students and young professionals",
    },
  ];

  const stats = [
    { label: "Active Rides", value: "1,250+" },
    { label: "Verified Drivers", value: "850+" },
    { label: "Happy Passengers", value: "12,400+" },
    { label: "Cities", value: "15+" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F4F0] to-[#ECEAE7] dark:from-[#1A1A1A] dark:to-[#0F0F0F] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#8B70F6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212]">
      {/* Header */}
      <header className="bg-[#FAF9F7] dark:bg-[#1E1E1E] px-6 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#8B70F6] rounded-2xl flex items-center justify-center">
              <Car size={20} className="text-white" />
            </div>
            <span className="text-[#121212] dark:text-white font-semibold text-lg" style={{fontFamily: "Instrument Sans, sans-serif"}}>
              RideShare
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="/account/signin"
              className="px-6 py-3 rounded-2xl border border-[#D9D9DE] dark:border-[#3A3A3A] text-[#121212] dark:text-white font-semibold text-sm hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] transition-shadow duration-150"
            >
              Sign In
            </a>
            <a
              href="/account/signup"
              className="px-6 py-3 rounded-2xl bg-[#8E7BFF] hover:bg-[#7A67F5] dark:bg-[#9D7DFF] dark:hover:bg-[#8B70F6] text-white font-semibold text-sm transition-colors duration-150"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-6 bg-gradient-to-b from-[#F5F4F0] to-[#ECEAE7] dark:from-[#1A1A1A] dark:to-[#0F0F0F]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h1
              className="text-4xl md:text-[64px] leading-tight md:leading-[1.1] text-[#0D0D0D] dark:text-white mb-6 max-w-4xl mx-auto"
              style={{fontFamily: "Instrument Serif, serif"}}
            >
              Smart ride matching for the <em className="font-medium">modern</em> commuter
            </h1>

            <p className="text-base md:text-lg text-[#555555] dark:text-[#C0C0C0] opacity-80 mb-8 max-w-[55ch] mx-auto">
              Connect with nearby drivers instantly. Safe, affordable, and designed for students and professionals.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mb-18">
              <button className="group flex items-center gap-3 px-6 py-3 bg-white dark:bg-[#262626] border border-[#E0E0E0] dark:border-[#404040] rounded-2xl hover:border-[#C5C5C5] dark:hover:border-[#606060] transition-colors duration-150">
                <div className="flex items-center justify-center w-6 h-6 border border-[#E0E0E0] dark:border-[#404040] rounded-full">
                  <Play size={10} className="text-[#0D0D0D] dark:text-white opacity-70 ml-[1px]" />
                </div>
                <span className="text-[#0D0D0D] dark:text-white font-semibold text-[15px]">
                  How it works
                </span>
              </button>

              <a
                href="/account/signup"
                className="px-6 py-3 rounded-2xl text-white font-semibold text-[15px] transition-all duration-150 hover:bg-[#7E64F2] dark:hover:bg-[#8B70F6]"
                style={{background: "linear-gradient(to top, #8B70F6, #9D7DFF)"}}
              >
                Start Riding Today
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-[#0D0D0D] dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-[#666666] dark:text-[#AAAAAA]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* App Preview */}
          <div className="relative max-w-[800px] mx-auto">
            <div className="relative rounded-3xl border-2 border-[#0B0B0C] dark:border-[#404040] overflow-hidden bg-white dark:bg-[#1A1A1A] p-6 shadow-2xl">
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-[#0D0D0D] dark:text-white mb-2">
                  Ride Dashboard
                </h3>
                <p className="text-sm text-[#666666] dark:text-[#AAAAAA]">
                  Request rides, track drivers, and manage your trips
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-3">
                    <Users size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-[#0D0D0D] dark:text-white mb-1">Request Ride</h4>
                  <p className="text-sm text-[#666666] dark:text-[#AAAAAA]">Enter pickup and destination</p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mb-3">
                    <Car size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-semibold text-[#0D0D0D] dark:text-white mb-1">Get Matched</h4>
                  <p className="text-sm text-[#666666] dark:text-[#AAAAAA]">AI finds the best driver</p>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-3">
                    <MapPin size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-[#0D0D0D] dark:text-white mb-1">Track Live</h4>
                  <p className="text-sm text-[#666666] dark:text-[#AAAAAA]">Monitor your ride progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 px-6 bg-[#F1F0EC] dark:bg-[#1A1A1A]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2
              className="text-4xl md:text-[64px] leading-tight md:leading-[1.1] text-black dark:text-white mb-6 md:mb-12"
              style={{fontFamily: "Libre Caslon Text, serif"}}
            >
              Why choose <em className="font-bold">RideShare</em>?
            </h2>
            <p className="text-base md:text-lg text-[#646461] dark:text-[#B0B0B0]">
              Experience the future of transportation with our intelligent matching system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              const active = feature.isActive || hoveredFeature === feature.id;

              return (
                <div
                  key={feature.id}
                  className={`
                    relative p-6 md:p-8 rounded-3xl border transition-all duration-200 ease-out cursor-pointer
                    ${active
                      ? "bg-[#0E0E0E] dark:bg-[#2A2A2A] border-transparent"
                      : "bg-white dark:bg-[#1E1E1E] border-[#E8E7E4] dark:border-[#404040] hover:bg-gray-50 dark:hover:bg-[#262626]"
                    }
                  `}
                  onMouseEnter={() => setHoveredFeature(feature.id)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 transition-all duration-200 ease-out
                    ${active
                      ? "bg-[#0E0E0E] dark:bg-[#2A2A2A] border-transparent"
                      : "bg-white dark:bg-[#1E1E1E] border-[#E8E7E4] dark:border-[#404040]"
                    }`}>
                    <IconComponent
                      size={24}
                      strokeWidth={1.5}
                      className={`transition-all duration-200 ease-out ${
                        active ? "text-white opacity-80" : "text-black dark:text-white"
                      }`}
                    />
                  </div>

                  <h3 className={`text-xl mb-2 transition-all duration-200 ease-out
                    ${active ? "text-white" : "text-black dark:text-white"}`}>
                    {feature.title}
                  </h3>

                  <p className={`text-base leading-relaxed transition-all duration-200 ease-out
                    ${active ? "text-[#C2C2C1]" : "text-[#6F6E6B] dark:text-[#B0B0B0]"}`}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white dark:bg-[#121212]">
        <div className="max-w-[800px] mx-auto text-center">
          <h2
            className="text-3xl md:text-5xl font-bold text-[#0D0D0D] dark:text-white mb-6"
            style={{fontFamily: "Instrument Serif, serif"}}
          >
            Ready to get started?
          </h2>
          <p className="text-lg text-[#666666] dark:text-[#AAAAAA] mb-8">
            Join thousands of users who trust RideShare for their daily commute
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <a
              href="/account/signup"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-lg transition-all duration-150 hover:bg-[#7E64F2] dark:hover:bg-[#8B70F6]"
              style={{background: "linear-gradient(to top, #8B70F6, #9D7DFF)"}}
            >
              Get Started Now
              <ArrowRight size={20} />
            </a>
            <a
              href="/account/signin"
              className="px-8 py-4 rounded-2xl border border-[#D9D9DE] dark:border-[#3A3A3A] text-[#121212] dark:text-white font-semibold text-lg hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] transition-shadow duration-150"
            >
              Sign In
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F7F7F7] dark:bg-[#1A1A1A] border-t border-[#EDEDED] dark:border-[#404040] py-12 px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-[#8B70F6] rounded-2xl flex items-center justify-center">
              <Car size={16} className="text-white" />
            </div>
            <span className="text-[#111111] dark:text-white text-lg font-semibold">
              RideShare
            </span>
          </div>
          
          <div className="text-[#6B6B6B] dark:text-[#B0B0B0] text-sm">
            © 2024 RideShare. Connecting communities through smart transportation.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MainComponent;