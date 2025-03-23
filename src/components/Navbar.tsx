import React from 'react';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed w-full bg-secondary/80 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-accent" />
            <span className="font-montserrat font-bold text-xl">Orato</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="px-4 py-2 rounded-md text-white hover:text-accent transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-md bg-accent text-white hover:bg-accent/90 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;