import { createFileRoute } from '@tanstack/react-router';
import { DriverSettlementsPage } from '../features/driver-settlements';

export const Route = createFileRoute('/driver-settlements')({ component: () => <DriverSettlementsPage mode="list" /> });
