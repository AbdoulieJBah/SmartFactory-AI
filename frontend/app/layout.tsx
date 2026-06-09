import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

export const metadata = {
  title: "SmartFactory AI",
  description: "AI-powered MES and ERP platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ProtectedRoute>{children}</ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}