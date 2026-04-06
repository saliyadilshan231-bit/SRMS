import { Link, Stack } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
	return (
		<SafeAreaView style={styles.container}>
			<Stack.Screen options={{ title: 'Home' }} />
			<Text style={styles.title}>Home</Text>
			<Text style={styles.subtitle}>This screen is ready for your content.</Text>
			
			<Link href="/admin-register" asChild>
				<TouchableOpacity style={styles.button}>
					<Text style={styles.buttonText}>Go to Admin Register</Text>
				</TouchableOpacity>
			</Link>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#0A0A5C',
		paddingHorizontal: 20,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		color: '#FFFFFF',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: '#D1D5DB',
		textAlign: 'center',
		marginBottom: 30,
	},
	button: {
		backgroundColor: '#FFFFFF',
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		marginTop: 20,
	},
	buttonText: {
		color: '#0A0A5C',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
