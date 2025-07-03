
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Menu, X, User, LogOut, Bell } from "lucide-react";
import { getDashboardLink } from "../utils/auth-utils";
import { useNotifications } from "@/hooks/useNotifications";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { unreadCount } = useNotifications();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navbarClass = `fixed top-0 left-0 right-0 z-50 ${
    scrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
  } transition-all duration-300`;

  return (
    <nav className={navbarClass}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              FreelanceConnect
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/project-search" className="text-sm font-medium hover:text-primary transition-colors">
              Find Freelancers
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to={user ? getDashboardLink(user.role) : "/"} 
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/notifications" 
                  className="text-sm font-medium hover:text-primary transition-colors relative"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <div className="relative group">
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-1"
                    onClick={() => {}}
                  >
                    <User size={16} />
                    <span className="text-sm">{user?.name?.split(' ')[0]}</span>
                  </Button>
                  <div className="absolute right-0 mt-2 w-48 p-2 bg-white rounded-md shadow-lg hidden group-hover:block animate-fade-in">
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      Logged in as <span className="font-medium">{user?.role}</span>
                    </div>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={() => logout()}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-md flex items-center space-x-2"
                    >
                      <LogOut size={14} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/auth?mode=login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-md animate-slide-in">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link
              to="/"
              className="block py-2 text-base font-medium hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              to="/project-search"
              className="block py-2 text-base font-medium hover:text-primary transition-colors"
            >
              Find Freelancers
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link
                  to={user ? getDashboardLink(user.role) : "/"}
                  className="block py-2 text-base font-medium hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/notifications"
                  className="flex py-2 text-base font-medium hover:text-primary transition-colors items-center gap-2"
                >
                  <Bell size={18} />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <div className="border-t border-gray-100 my-2"></div>
                <div className="py-2 text-sm text-muted-foreground">
                  Logged in as <span className="font-medium">{user?.role}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="w-full text-left py-2 text-base font-medium text-red-600 flex items-center space-x-2"
                >
                  <LogOut size={18} />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 mt-4">
                <Link to="/auth?mode=login">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
