import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function QuestionInput({ label, value, onChange }) {
  return (
    <View>
      <Text>{label}:</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    marginBottom: 10,
  },
});
