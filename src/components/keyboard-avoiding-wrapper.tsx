import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

interface KeyboardAvoidingWrapperProps {
  children: ReactNode;
  headerOffset?: number;
  extraScrollHeight?: number;
}

const DEFAULT_HEADER_OFFSET = Platform.OS === 'ios' ? 90 : 0;

export function KeyboardAvoidingWrapper({
  children,
  headerOffset = DEFAULT_HEADER_OFFSET,
  extraScrollHeight = 0,
}: KeyboardAvoidingWrapperProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={headerOffset + extraScrollHeight}
      style={styles.wrapper}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});
