import Link from "next/link";

const links = [
  { href: "/patient", label: "Patient" },
  { href: "/nurse", label: "Nurse" },
  { href: "/doctor", label: "Doctor" },
];

export function LeftSidebar() {
  return (
    <aside className="w-64 shrink-0 bg-white p-4 shadow-sm">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-500">
        Workspaces
      </p>
      <nav className="space-y-0.5">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-lg px-3 py-2.5 text-sm text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
