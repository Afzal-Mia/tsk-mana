import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // Axios instance with token
  const api = axios.create({
    baseURL: "http://localhost:1200",
    headers: { Authorization: `Bearer ${token}` },
  });

  const login = async (email, password) => {
    const res = await axios.post("http://localhost:1200/user/login", {
      email,
      password,
    });
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const register = async (userName, email, password) => {
    const res = await axios.post("http://localhost:1200/user/register", {
      userName,
      email,
      password,
    });
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    setToken("");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, api, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
