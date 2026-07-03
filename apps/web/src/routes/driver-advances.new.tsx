import { createFileRoute } from '@tanstack/react-router';
import { DriverAdvancesPage } from '../features/driver-advances';

export const Route = createFileRoute('/driver-advances/new')({ component: () => <DriverAdvancesPage mode="create" /> });
