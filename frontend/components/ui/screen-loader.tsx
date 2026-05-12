import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type ScreenLoaderProps = {
  label?: string;
};

export function ScreenLoader({ label = 'Loading...' }: ScreenLoaderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color="#1565c0" size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#f4f8fc',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    padding: 24,
  },
  label: {
    color: '#475569',
    fontSize: 15,
  },
});
