"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { useClickOutside } from "@/hooks/useClickOutside";
import {
  LayoutDashboard,
  ClipboardList,
  Search,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown
} from "lucide-react";

export default function Navbar() {
  const { user, userData, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setMenuOpen(false));

  const navLinks = userData?.isAdmin
    ? [
      { href: "/admin", label: "Admin", icon: Settings },
      { href: "/needs", label: "Needs Board", icon: ClipboardList },
      { href: "/search", label: "Search", icon: Search },
    ]
    : [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/needs", label: "Needs Board", icon: ClipboardList },
      { href: "/search", label: "Search", icon: Search },
    ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-6 z-50 mx-4 lg:mx-auto max-w-7xl glass-panel transition-[background-color,backdrop-filter,shadow] duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link
              href={userData?.isAdmin ? "/admin" : "/dashboard"}
              className="group"
            >
              <Logo
                size="header"
                showText={true}
                className="group-hover:scale-105 transition-transform duration-300 ease-out"
              />
            </Link>
            <div className="hidden md:flex ml-10 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ease-out flex items-center gap-2 ${isActive(link.href)
                    ? "bg-[#00245D] text-white shadow-md scale-105 border border-white/10"
                    : "text-[#00245D] hover:bg-white/40 hover:scale-105 border border-transparent"
                    }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#00245D] hover:bg-[#99D6EA]/30 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[#99D6EA]/20 transition-colors duration-200"
              >
                <div className="w-9 h-9 bg-[#00245D] rounded-xl flex items-center justify-center text-white font-semibold shadow-lg shadow-[#00245D]/20 overflow-hidden">
                  {userData?.profilePhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userData.profilePhoto} alt={userData?.displayName || "Profile"} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(userData?.displayName?.[0] || user?.email?.[0] || "U").toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-[#00245D]">
                    {userData?.displayName || "User"}
                  </div>
                  <div className="text-xs text-[#00245D]/60 truncate max-w-[120px]">
                    {user?.email}
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#00245D]/60 hidden md:block transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-4 w-64 glass-panel py-2 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden bg-white/95 origin-top-right ring-1 ring-black/5">
                  <div className="px-5 py-4 border-b border-[#D4C4A8]/30">
                    <div className="text-sm font-bold text-[#00245D]">
                      {userData?.displayName || "User"}
                    </div>
                    <div className="text-xs text-[#00245D]/60 truncate">
                      {user?.email}
                    </div>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#00245D] hover:bg-[#99D6EA]/20 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User className="w-4 h-4" /> Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 glass-panel p-4 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive(link.href)
                    ? "bg-[#00245D] text-white shadow-lg shadow-[#00245D]/20"
                    : "text-[#00245D] hover:bg-white/40"
                    }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
