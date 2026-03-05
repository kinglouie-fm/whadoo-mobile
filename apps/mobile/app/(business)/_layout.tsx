import { BusinessProvider } from '@/src/providers/business-context';
import { Stack } from 'expo-router';

/**
 * Defines layout and navigation for (business)/_layout routes.
 */
export default function BusinessLayout() {
    return (
        <BusinessProvider>
            <Stack screenOptions={{ headerShown: false }} />
        </BusinessProvider>
    );
}
