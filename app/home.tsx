import { Stack } from 'expo-router';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

export default function HomeScreen() {
	return (
		<SafeAreaView style={styles.container}>
			<Stack.Screen options={{ title: 'Home' }} />
			<Text style={styles.title}>Home</Text>
			<Text style={styles.subtitle}>This screen is ready for your content.</Text>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FDE7B5',
		paddingHorizontal: 20,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		color: '#1a1a1a',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: '#555',
		textAlign: 'center',
	},
});
