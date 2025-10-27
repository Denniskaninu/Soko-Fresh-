import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isFarmer, isBuyer } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-primary-700">
              GreenTrust
            </Link>

            {user && (
              <div className="hidden md:flex space-x-4">
                {isFarmer && (
                  <>
                    <Link to="/farmer/dashboard" className="text-gray-700 hover:text-primary-600 font-medium">
                      Dashboard
                    </Link>
                    <Link to="/farmer/batches" className="text-gray-700 hover:text-primary-600 font-medium">
                      My Batches
                    </Link>
                    <Link to="/farmer/listings" className="text-gray-700 hover:text-primary-600 font-medium">
                      My Listings
                    </Link>
                  </>
                )}
                {isBuyer && (
                  <>
                    <Link to="/buyer/dashboard" className="text-gray-700 hover:text-primary-600 font-medium">
                      Dashboard
                    </Link>
                    <Link to="/marketplace" className="text-gray-700 hover:text-primary-600 font-medium">
                      Marketplace
                    </Link>
                    <Link to="/buyer/inquiries" className="text-gray-700 hover:text-primary-600 font-medium">
                      My Inquiries
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-700">
                  {user.name}
                </span>
                <span className="badge badge-success">
                  {user.userType}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-600 font-medium">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
