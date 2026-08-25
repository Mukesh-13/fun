import Link from 'next/link';

export default function ThinkingCard({ title, description, href }: { title: string, description: string, href: string }) {
  return (
    <Link href={href} className="block p-6 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors">
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-white">{title}</h2>
      <p className="font-normal text-gray-400">{description}</p>
    </Link>
  );
}
