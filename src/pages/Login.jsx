import React, { useState } from "react";
import { loginService } from "../api/auth";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 px-3 py-2 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
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