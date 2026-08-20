import FlashbacksView from '@/components/dashboard/FlashbacksView';

export const metadata = {
  title: 'Dashboard | Flashbacks',
};

export default function FlashbacksPage() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <FlashbacksView />
    </div>
  );
}
