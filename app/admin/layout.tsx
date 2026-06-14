import { requireInternalAdmin } from "@/lib/admin/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

export const metadata = {
  title: "Admin — ZapComanda",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireInternalAdmin();

  return (
    <div className="min-h-screen bg-surface text-on-surface" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
      />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
      />

      <AdminSidebar userEmail={user.email ?? ""} />
      <AdminTopBar />

      <main className="lg:ml-[280px] pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}
