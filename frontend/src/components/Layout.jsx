import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, MessageSquare, BarChart3, LogOut, Home, Brain, FileText, LineChart } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/quiz', label: 'Quiz', icon: BookOpen },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    { path: '/progress', label: 'Progress', icon: BarChart3 },
    { path: '/resume', label: 'Resume Insights', icon: FileText },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-50 border-b fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Quizly</h1>
            </div>

            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <div className="flex items-center space-x-2">
                    {user.avatar && (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    size="sm"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b fixed top-[65px] left-0 right-0 z-40">
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex flex-wrap justify-between sm:justify-start">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>


      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 mt-[73px] pt-[53px] flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;