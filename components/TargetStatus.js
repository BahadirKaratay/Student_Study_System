import React from 'react';
import { Text } from 'react-native';

export default function TargetStatus({ total, target }) {
  return (
    <Text style={{
      marginTop: 10,
      fontWeight: 'bold',
      color: total >= target ? 'green' : 'red',
    }}>
      Toplam: {total} / Hedef: {target}
    </Text>
  );
}
