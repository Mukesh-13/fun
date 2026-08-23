import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect users from the root '/' to the new '/dashboard' path
  redirect('/dashboard');
}
