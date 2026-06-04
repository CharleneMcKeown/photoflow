import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About Me",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Hero */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start mb-12">
        <div className="relative h-40 w-40 shrink-0 rounded-full overflow-hidden">
          <Image
            src="/avatar.jpg"
            alt="Profile photo"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            About Me
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Hi, I&rsquo;m a hobbiest photographer based in Buckinghamshire with a
            passion for improving my photography skills. I love taking photos of birds and cats, and I
            am keen to explore more types of photography, like street and architecture.
          </p>
        </div>
      </div>

      {/* What I Shoot */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          What I Shoot
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: "🦌", label: "Wildlife" },
            { icon: "🐦", label: "Birds" },
            { icon: "🐱", label: "Cats" },
            { icon: "🏙️", label: "Street" }
          ].map(({ icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-4 py-3"
            >
              <span className="text-lg">{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
