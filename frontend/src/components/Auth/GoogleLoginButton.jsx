// import { useGoogleLogin } from "@react-oauth/google";
// import axiosInstance from "../../lib/axiosInstance";
// import { API_PATHS } from "../../utils/apiPaths";
// import { useNavigate } from "react-router-dom";
// import { useAuthStore } from "../../store/useAuthStore";
// import { toast } from "react-toastify";

// const GoogleLoginButton = ({ className, onClick }) => {
//   const navigate = useNavigate();
//   const { setAuthUser } = useAuthStore();

//   const login = useGoogleLogin({
//     hosted_domain: "nitgoa.ac.in",
//     onSuccess: async (tokenResponse) => {
//       try {
//         const res = await axiosInstance.post(API_PATHS.AUTH.GOOGLE_LOGIN, {
//           credential: tokenResponse.access_token,
//         });

//         if (res.data?.message?.includes("nitgoa.ac.in")) {
//           toast.error("Only @nitgoa.ac.in accounts are allowed");
//           return;
//         }

//         localStorage.setItem("token", res.data.token);
//         localStorage.setItem("user", JSON.stringify(res.data.user));
//         localStorage.setItem("needsProfileSetup", res.data.needsProfileSetup);
//         setAuthUser(res.data.user);

//         if (res.data.user.role === "student") navigate("/student");
//         else if (res.data.user.role === "faculty") navigate("/faculty");
//         else navigate("/admin");
//       } catch (error) {
//         if (error.response?.status === 403) {
//           toast.error(
//             "Only @nitgoa.ac.in Google accounts are allowed to sign in",
//           );
//         } else {
//           console.error(error);
//         }
//       }
//     },
//     onError: () => {
//       console.log("Google Login Failed");
//     },
//   });

//   const handleButtonClick = () => {
//     if (onClick) onClick(); // This triggers setIsLoading(true) in Login.jsx
//     login();
//   };

//   return (
//     <button onClick={handleButtonClick} className={className}>
//       <img
//         src="https://www.svgrepo.com/show/475656/google-color.svg"
//         alt="Google"
//         width={20}
//         height={20}
//       />
//       <p className="ml-2">Sign in with Google</p>
//     </button>
//   );
// };

// export default GoogleLoginButton;

//new
import { useGoogleLogin } from "@react-oauth/google";
import axiosInstance from "../../lib/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "react-toastify";

const GoogleLoginButton = ({ className, onLoadingStart, onLoadingEnd }) => {
  const navigate = useNavigate();
  const { setAuthUser } = useAuthStore();

  const login = useGoogleLogin({
    hosted_domain: "nitgoa.ac.in",
    onSuccess: async (tokenResponse) => {
      try {
        const res = await axiosInstance.post(API_PATHS.AUTH.GOOGLE_LOGIN, {
          credential: tokenResponse.access_token,
        });

        if (res.data?.message?.includes("nitgoa.ac.in")) {
          toast.error("Only @nitgoa.ac.in accounts are allowed");
          if (onLoadingEnd) onLoadingEnd();
          return;
        }

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("needsProfileSetup", res.data.needsProfileSetup);
        setAuthUser(res.data.user);

        if (res.data.user.role === "student") navigate("/student");
        else if (res.data.user.role === "faculty") navigate("/faculty");
        else navigate("/admin");

        if (onLoadingEnd) onLoadingEnd();
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error(
            "Only @nitgoa.ac.in Google accounts are allowed to sign in",
          );
        } else {
          console.error(error);
          toast.error("Authentication failed. Please try again.");
        }
        if (onLoadingEnd) onLoadingEnd();
      }
    },
    onError: () => {
      console.log("Google Login Failed");
      toast.error("Google login failed. Please try again.");
      if (onLoadingEnd) onLoadingEnd();
    },
  });

  const handleButtonClick = () => {
    if (onLoadingStart) onLoadingStart(); // This triggers setIsLoading(true)
    login();
  };

  return (
    <button onClick={handleButtonClick} className={className}>
      <img
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        alt="Google"
        width={20}
        height={20}
      />
      <p className="ml-2">Sign in with Google</p>
    </button>
  );
};

export default GoogleLoginButton;
