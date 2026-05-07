import { Link } from "react-router-dom";
import GoogleLoginButton from "../components/Auth/GoogleLoginButton";

const Login = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-200 dark:bg-gray-950 transition-colors duration-300 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 space-y-6 transition-colors duration-300 border border-gray-100 dark:border-gray-800 content-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Please use your college email to sign in.
          </p>
        </div>
        <GoogleLoginButton
          className={
            "flex bg-blue-400 p-2 rounded-3xl  w-full items-center justify-center text-white font-semibold hover:bg-blue-500 transition-colors duration-300"
          }
        />
      </div>
    </div>
  );
};

export default Login;
