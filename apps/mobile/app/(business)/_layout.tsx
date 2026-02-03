import { BusinessProvider } from '@/src/providers/business-context';
import { Stack } from 'expo-router';

export default function BusinessLayout() {
    return (
        <BusinessProvider>
            <Stack screenOptions={{ headerShown: false }} />
        </BusinessProvider>
    );
}
