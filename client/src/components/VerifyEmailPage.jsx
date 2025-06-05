import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const VerifyEmailPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");

    if (token) {
      fetch("http://localhost:5500/auth/google/verify-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            localStorage.setItem("appToken", data.appToken);
            navigate("/profile"); // ✅ Redirect here after success
          } else {
            alert("Verification failed: " + data.error);
          }
        })
        .catch(() => {
          alert("An error occurred during verification.");
        });
    }
  }, [navigate]);

  return <p>Verifying your email...</p>;
};

export default VerifyEmailPage;
