import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerService } from "../api/auth";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerService({ username, password });
      navigate("/login");
    } catch (err) {
      setError("Register gagal. Username mungkin sudah digunakan.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
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
        <button type="submit" className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800">
          Register
        </button>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-blue-700 hover:underline">Sudah punya akun? Login</Link>
        </div>
      </form>
    </div>
  );
}