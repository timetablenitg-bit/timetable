import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import axiosInstance from "../lib/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "react-toastify";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import CustomLoader from "../ui/CustomLoader";

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const { setAuthUser } = useAuthStore();

  const [status, setStatus] = useState("verifying"); // "verifying" | "ready" | "error"
  const [inviteInfo, setInviteInfo] = useState(null); // { email, name }
  const [message, setMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false); // Loader for Google sign-in

  // Step 1 — verify the invite token as soon as page loads
  useEffect(() => {
    if (!token) {
      setMessage("No invite token found in the link.");
      setStatus("error");
      return;
    }

    const verifyToken = async () => {
      try {
        const { data } = await axiosInstance.post(
          API_PATHS.AUTH.ACCEPT_INVITE,
          { token },
        );
        setInviteInfo({ email: data.email, name: data.name });
        setStatus("ready");
      } catch (err) {
        setMessage(
          err.response?.data?.message || "Invalid or expired invite link.",
        );
        setStatus("error");
      }
    };

    verifyToken();
  }, [token]);

  // Step 2 — Google sign-in completes the setup
  const handleGoogleLogin = useGoogleLogin({
    hosted_domain: "nitgoa.ac.in",
    onSuccess: async (tokenResponse) => {
      setIsSigningIn(true);
      try {
        const res = await axiosInstance.post(API_PATHS.AUTH.GOOGLE_LOGIN, {
          credential: tokenResponse.access_token,
        });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setAuthUser(res.data.user);

        toast.success("Welcome! Your faculty account is ready.");
        navigate("/faculty");
      } catch (err) {
        toast.error(err.response?.data?.message || "Google sign-in failed.");
      } finally {
        setIsSigningIn(false);
      }
    },
    onError: () => {
      toast.error("Google sign-in failed. Try again.");
      setIsSigningIn(false);
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl text-center">
        {/* Verifying */}
        {status === "verifying" && (
          <>
            <CustomLoader variant="green" />
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              Verifying your invite…
            </p>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <AlertCircle size={40} className="text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              Invalid Invite
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {message}
            </p>
          </>
        )}

        {/* Ready to sign in */}
        {status === "ready" && (
          <>
            <ShieldCheck size={40} className="text-emerald-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              You're invited!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
              Sign in with your institute Google account to activate your
              faculty profile.
            </p>
            {inviteInfo?.email && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-6 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg inline-block">
                {inviteInfo.email}
              </p>
            )}

            <button
              onClick={() => handleGoogleLogin()}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-all font-medium text-slate-700 dark:text-white disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSigningIn ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    width={20}
                    height={20}
                  />
                  Sign in with Google
                </>
              )}
            </button>

            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              Make sure to sign in with your <strong>@nitgoa.ac.in</strong>{" "}
              account.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
