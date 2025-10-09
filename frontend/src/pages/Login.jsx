import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from '@/components/ui/carousel';
import { BookOpen, Brain } from 'lucide-react';

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="flex flex-col lg:flex-row items-center justify-center w-full">\
        <div className="hidden md:flex h-screen w-1/2 bg-white border-r relative flex-col justify-center items-center">
          <div className="absolute left-0 bottom-0 w-[300px] aspect-square opacity-40">
            <div className="w-full h-full bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-full blur-3xl" />
          </div>
          
          <Carousel
            className="w-full"
            opts={{
              align: "center",
              loop: true,
            }}
          >
            <CarouselContent>
              <CarouselItem>
                <div className="relative h-full w-full flex flex-col items-center justify-center">
                  <div className="flex shadow rounded-3xl flex-col w-full max-w-[450px] border">
                    <div className="flex gap-2 items-center border-b py-5 px-5">
                    <BookOpen className="w-6 h-6 text-[#081735]" />
                      <span className="font-bold text-xl text-[#081735]">
                        AI-Powered Learning Platform
                      </span>
                    </div>
                    <div className="flex gap-3 justify-between items-center py-6 px-6">
                      <div className="flex flex-col items-center text-[#081735]">
                        <span className="font-bold">1000+</span>
                        <span className="text-sm">Quizzes</span>
                      </div>
                      <div className="flex flex-col items-center text-[#081735]">
                        <span className="font-bold">5K+</span>
                        <span className="text-sm">Learners</span>
                      </div>
                      <div className="flex flex-col items-center text-[#081735]">
                        <span className="font-bold">95%</span>
                        <span className="text-sm">Success Rate</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex rounded-3xl shadow flex-col gap-2 p-4 px-8 translate-x-[46%] -translate-y-[15px] bg-white border">
                    <div className="flex justify-between min-w-48">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center border">
                        <Brain className="w-7 h-7" />
                      </div>
                      <div className="flex flex-col text-[#081735]">
                        <div className="flex items-center text-[#0049c6] font-bold">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <path d="M12 4L12 20M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>28%</span>
                        </div>
                        <div className="font-normal text-xs">This week</div>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">Knowledge Gained</span>
                        <span className="text-2xl font-medium">250K+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>

        <div className="flex flex-col items-center justify-center w-full lg:w-1/2 h-screen px-4 sm:px-6 lg:px-10">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="border p-3 rounded-full">
                  <Brain className="w-7 h-7" />
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Welcome to Quizly
                </h1>
                <p className="text-gray-600">
                 Learn smarter with AI quizzes and interactive chats.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <Button
                onClick={login}
                className="cursor-pointer w-full bg-[#1570EF] hover:bg-[#1258CC] text-white font-semibold py-4 text-lg rounded-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </div>
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                By signing in, you agree to our{" "}
                <a
                  href="#"
                  className="font-medium text-[#1570EF] hover:text-[#1258CC] underline underline-offset-2 transition-colors"
                >
                  Terms of Service
                </a>
              </p>
              <p className="text-sm text-gray-600">
                Need help?{" "}
                <a
                  href="#"
                  className="font-medium text-[#1570EF] hover:text-[#1258CC] underline underline-offset-2 transition-colors"
                >
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;