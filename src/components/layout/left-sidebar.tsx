import Link from "next/link";

const links = [
  { href: "/patient", label: "Patient" },
  { href: "/nurse", label: "Nurse" },
  { href: "/doctor", label: "Doctor" },
];

export function LeftSidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-4">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-500">
        Workspaces
      </p>
      <nav className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
