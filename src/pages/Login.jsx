import React, { useState } from "react";
import { loginService } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth(); // Menggunakan AuthContext untuk mendapatkan fungsi login

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginService({ username, password });
      login(res.data.token, res.data.refreshToken);
      navigate("/dashboard");
    } catch (err) {
      setError("Login gagal. Cek username/password.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-200">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <input
          type="text"
          placeholder="Username"
          className="w-full mb-4 px-3 py-2 border rounded"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="login_password">
          Password
        </label>
        <div className="relative mb-6">
          <input
            id="login_password"
            type={showPassword ? "text" : "password"}
            placeholder="Your password"
            className="w-full px-3 py-2 border rounded pr-10"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-3 flex items-center text-gray-400"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ?
              // Icon Mata Terbuka (Visible)
              (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>)
              :
              // Icon Mata Tertutup (Hidden)
              (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 1l22 22" strokeLinecap="round"/>
                <path d="M17.94 17.94A10.001 10.001 0 012 12s4-7 10-7 10 7 10 7a9.96 9.96 0 01-4.06 5.94" />
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              </svg>)
            }
          </button>
        </div>
        <button type="submit" className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
          Login
        </button>
        <div className="mt-4 text-center">
          <Link to="/register" className="text-red-600 hover:underline">Belum punya akun? Register</Link>
        </div>
      </form>
    </div>
  );
}