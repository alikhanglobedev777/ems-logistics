import { createFileRoute } from '@tanstack/react-router';
import { RoutePricingEstimatePage } from '../features/pricing';

export const Route = createFileRoute('/pricing/route-estimate')({
  component: RoutePricingEstimatePage,
});
