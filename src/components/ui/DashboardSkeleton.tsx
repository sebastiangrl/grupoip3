import { KPISkeleton, CardSkeleton, TableSkeleton, Skeleton } from '@/components/ui/Skeleton';

export function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton height={32} width="250px" className="mb-2" />
          <Skeleton height={16} width="180px" />
        </div>
        <div className="flex space-x-3">
          <Skeleton height={40} width={120} />
          <Skeleton height={40} width={100} />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <KPISkeleton key={index} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <Skeleton height={24} width="40%" className="mb-6" />
          <Skeleton height={300} width="100%" />
        </div>

        {/* Chart 2 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <Skeleton height={24} width="35%" className="mb-6" />
          <Skeleton height={300} width="100%" />
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Table 1 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <Skeleton height={24} width="30%" className="mb-4" />
          <TableSkeleton rows={5} cols={3} />
        </div>

        {/* Table 2 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <Skeleton height={24} width="35%" className="mb-4" />
          <TableSkeleton rows={5} cols={3} />
        </div>
      </div>
    </div>
  );
}

export function ModuleSkeleton({ title }: { title: string }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton height={16} width="120px" />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      
      {/* Main metric */}
      <div className="mb-2">
        <Skeleton height={32} width="180px" />
      </div>
      
      {/* Secondary info */}
      <Skeleton height={14} width="140px" />
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Date filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <Skeleton height={20} width="100px" className="mb-3" />
        <div className="space-y-3">
          <div>
            <Skeleton height={14} width="80px" className="mb-1" />
            <Skeleton height={36} width="100%" />
          </div>
          <div>
            <Skeleton height={14} width="80px" className="mb-1" />
            <Skeleton height={36} width="100%" />
          </div>
          <Skeleton height={36} width="100%" />
        </div>
      </div>

      {/* Quick stats */}
      <div className="bg-white p-4 rounded-lg shadow">
        <Skeleton height={20} width="120px" className="mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex justify-between items-center">
              <Skeleton height={14} width="60%" />
              <Skeleton height={14} width="30%" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
