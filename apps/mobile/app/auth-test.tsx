import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Alert, Button, Text, View } from 'react-native';

export default function AuthTestScreen() {
    const testEmailPassword = async () => {
        try {
            const email = `test${Date.now()}@example.com`;
            const password = 'Test123456!';
            const auth = getAuth();

            await createUserWithEmailAndPassword(auth, email, password);
            console.log('Email user created');
            Alert.alert('Success', `Created user: ${email}`);
        } catch (e: any) {
            console.error('Email/Password error:', e);
            Alert.alert('Email/Password error', e?.message ?? String(e));
        }
    };

    const testGoogle = async () => {
        try {
            // For iOS this usually just returns true, but it's safe to keep
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            const res = await GoogleSignin.signIn();

            // Different versions/types expose the token differently; handle both safely
            const idToken =
                (res as any)?.idToken ??
                (res as any)?.data?.idToken ??
                null;

            if (!idToken) {
                throw new Error(
                    'Google Sign-In did not return an idToken. ' +
                    'Check that GoogleSignin.configure({ iosClientId: ... }) is set and ' +
                    'that your GoogleService-Info.plist contains CLIENT_ID.'
                );
            }

            const auth = getAuth();
            const credential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, credential);

            const user = getAuth().currentUser;
            console.log('Google sign-in success:', user?.uid, user?.email);
            Alert.alert('Success', `Google signed in: ${user?.email ?? user?.uid}`);
        } catch (e: any) {
            console.error('Google sign-in error:', e);
            Alert.alert('Google sign-in error', e?.message ?? String(e));
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', gap: 16, padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '600' }}>Firebase Auth Test</Text>

            <Button title="Test Email/Password" onPress={testEmailPassword} />
            <Button title="Test Google Sign-In" onPress={testGoogle} />
        </View>
    );
}