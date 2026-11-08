import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../services/authServices";
import {
  alertError,
  btnPrimary,
  label as labelClass,
} from "../components/ui/styles";
import logoText from "../assets/logo-ft.png";
import loginBackground from "../assets/background.jpg";

const fieldBase =
  "h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:ring-3 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";
const fieldOk =
  "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10";
const fieldInvalid =
  "border-error-500 focus:border-error-500 focus:ring-error-500/10";

function getErrorMessage(error) {
  if (error.response) {
    return (
      error.response.data?.message ||
      (error.response.status === 401
        ? "Username atau kata sandi salah."
        : "Login gagal. Silakan coba lagi.")
    );
  }

  if (error.request) {
    return "Tidak dapat terhubung ke server. Periksa koneksi Anda.";
  }

  return error.message || "Login gagal. Silakan coba lagi.";
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  // Setelah masuk, kembali ke halaman yang tadinya dituju (bila ada).
  const redirectTo = location.state?.from?.pathname ?? "/defects/dashboard";

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    const name = username.trim();

    if (!name || !password) {
      const field = !name ? "username" : "password";
      setInvalidField(field);
      setError(
        !name && !password
          ? "Username dan kata sandi wajib diisi."
          : !name
            ? "Username wajib diisi."
            : "Kata sandi wajib diisi.",
      );
      (field === "username" ? usernameRef : passwordRef).current?.focus();
      return;
    }

    setLoading(true);
    setError("");
    setInvalidField("");

    try {
      const session = await login({ username: name, password });
      localStorage.setItem("auth_token", session.token);
      localStorage.setItem("auth_user", JSON.stringify(session.user));
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // Perbarui layar lebih dulu: kolom kata sandi baru bisa difokus setelah
      // tidak lagi dinonaktifkan oleh state loading.
      flushSync(() => {
        setError(getErrorMessage(err));
        setPassword("");
        setLoading(false);
      });
      passwordRef.current?.focus();
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gray-900 px-4 py-8">
      {/* Latar: gambar di-blur; scale-110 menutup tepi yang memudar akibat blur. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-110 bg-cover bg-center blur-[6px]"
        style={{ backgroundImage: `url(${loginBackground})` }}
      />
      {/* Lapisan gelap tipis agar kartu dan teks tetap kontras. */}
      <div aria-hidden="true" className="absolute inset-0 bg-gray-900/40" />

      <main className="relative w-full max-w-md rounded-2xl border border-white/40 bg-white/85 p-6 shadow-theme-lg backdrop-blur-none sm:p-8">
        <div className="flex items-center justify-center">
          <img
            src={logoText}
            alt="Defect Monitor"
            className="h-auto w-full max-w-64 object-contain"
          />
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-3 space-y-4">
          {error && (
            <div className={alertError} role="alert" id="login-error">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className={labelClass}>
              Username
            </label>
            <input
              ref={usernameRef}
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              aria-invalid={invalidField === "username"}
              aria-describedby={error ? "login-error" : undefined}
              placeholder="Masukkan username"
              className={`${fieldBase} ${invalidField === "username" ? fieldInvalid : fieldOk}`}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              Kata sandi
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                aria-invalid={invalidField === "password"}
                aria-describedby={error ? "login-error" : undefined}
                placeholder="Masukkan kata sandi"
                className={`${fieldBase} pr-11 ${invalidField === "password" ? fieldInvalid : fieldOk}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
                aria-pressed={showPassword}
                disabled={loading}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-gray-500 transition-colors hover:text-gray-700 focus-visible:ring-3 focus-visible:ring-brand-500/25 focus-visible:outline-none disabled:opacity-50"
              >
                <i
                  className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={`${btnPrimary} h-11! w-full`}
          >
            {loading ? (
              <>
                <span
                  className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

export default Login;
