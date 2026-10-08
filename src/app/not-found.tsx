import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-4xl text-navy">Page not found</h1>
      <p className="mt-3 text-muted">That address is not part of Rising.</p>
      <Link className="mt-4 inline-block font-semibold text-water" href="/">
        Return to the overview
      </Link>
    </div>
  );
}
