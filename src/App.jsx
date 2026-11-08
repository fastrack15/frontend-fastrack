import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Defect = lazy(() => import("./pages/Defects"));
const Login = lazy(() => import("./pages/Login"));

function NotFound() {
  return (
    <div className="mx-auto mt-16 max-w-sm text-center">
      <h1 className="text-lg font-semibold text-gray-800">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Alamat yang Anda buka tidak tersedia.
      </p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* "/" langsung diarahkan ke dashboard */}
      <Route path="/" element={<Navigate to="/defects/dashboard" replace />} />

      {/* Halaman login berdiri sendiri, tanpa sidebar dan navbar */}
      <Route
        path="/login"
        element={
          <Suspense fallback={<div className="min-h-dvh bg-gray-900" />}>
            <Login />
          </Suspense>
        }
      />

      <Route element={<AppLayout />}>
        <Route path="defects/dashboard" element={<Dashboard />} />
        <Route path="defects/map" element={<Defect />} />

        {/* URL lain tampil di dalam layout, jadi sidebar tetap ada */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
