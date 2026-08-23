import ThinkingView from './_components/ThinkingView';

export const metadata = {
  title: 'Dashboard | Thinking',
};

export default function ThinkingPage() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ThinkingView />
    </div>
  );
}
