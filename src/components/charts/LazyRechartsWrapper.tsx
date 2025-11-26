/**
 * Lazy Recharts Wrapper Component
 * Charge Recharts de manière lazy et expose les composants nécessaires
 */

import { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load Recharts
const RechartsComponents = lazy(() => import('recharts'));

interface LazyRechartsWrapperProps {
  children: (recharts: typeof import('recharts')) => ReactNode;
}

const ChartsLoadingFallback = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-[300px] w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Wrapper pour utiliser Recharts de manière lazy
 * Usage:
 * <LazyRechartsWrapper>
 *   {(recharts) => (
 *     <recharts.LineChart data={data}>
 *       <recharts.Line dataKey="value" />
 *     </recharts.LineChart>
 *   )}
 * </LazyRechartsWrapper>
 */
export const LazyRechartsWrapper = ({ children }: LazyRechartsWrapperProps) => {
  return (
    <Suspense fallback={<ChartsLoadingFallback />}>
      <RechartsComponents>
        {(recharts: typeof import('recharts')) => children(recharts)}
      </RechartsComponents>
    </Suspense>
  );
};

// HOC pour wrapper un composant avec lazy recharts
export function withLazyRecharts<P extends object>(
  Component: ComponentType<P & { recharts: typeof import('recharts') }>
): ComponentType<P> {
  return function LazyRechartsHOC(props: P) {
    return (
      <LazyRechartsWrapper>
        {(recharts) => <Component {...props} recharts={recharts} />}
      </LazyRechartsWrapper>
    );
  };
}

