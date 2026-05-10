import { BottomNav } from '@/components/ui/BottomNav'

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}
