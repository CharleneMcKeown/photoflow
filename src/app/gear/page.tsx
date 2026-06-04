import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Gear",
};

const categories = [
  {
    title: "Cameras",
    items: [

      {
        name: "Fujifilm X-T5",
        description:
          "My main and only camera right now.",
      },
      {
        name: "Olympus OM-D E-M10 Mark II (retired)",
        description:
          "My first proper camera. I sold it and instantly regretted it. I may get it back one day.",
      }
    ],
  },
  {
    title: "Lenses",
    items: [
      {
        name: "Fujifilm XF 33mm F1.4 R LM WR",
        description:
          "Prime lens with a classic focal length, perfect for cat portraits and low-light shots.",
      },
      {
        name: "Fujifilm XF 16-50mm F2.8-4.8 R LM WR",
        description:
          "Kit lens that is nice and lightweight, and covers a useful focal length range for everyday shooting.",
      },
      {
        name: " Fujifilm XF 23mm F2.8 R WR",
        description:
          "Pancake lens that is compact and lightweight.",
      },
      {
        name: "Fujifilm XF 70-300mm F4-5.6 R LM OIS WR",
        description:
          "Telephoto zoom lens that allows me to capture distant subjects, great for bird photography. Also fun for sneaking photos of my cats and getting up close with insects.",
      }
    ],
  },
  {
    title: "Accessories",
    items: [
      {
        name: "Bellroy Venture Camera Sling - 9L",
        description:
          "Crossbody camera bag that is compact and comfortable to wear, with enough space for my camera and a couple of lenses. I also use it as a regular day bag when I don't have my camera with me.",
      }
    ],
  },
];

export default function GearPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">My Gear</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-10">
        Here&rsquo;s what&rsquo;s in my camera bag.
      </p>

      <div className="space-y-10">
        {categories.map((category) => (
          <section key={category.title}>
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              {category.title}
            </h2>
            <ul className="grid gap-4">
              {category.items.map((item) => (
                <li
                  key={item.name}
                  className="rounded-lg bg-neutral-100 dark:bg-neutral-800 px-5 py-4"
                >
                  <p className="font-medium mb-1">{item.name}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
