// src/declarations.d.ts
import 'react-native';

declare module 'react-native' {
  interface ViewProps {  className?: string }
  interface TextProps {  className?: string }
  interface TextInputProps {  className?: string }
  interface ScrollViewProps {  className?: string }
  interface TouchableOpacityProps {  className?: string }
}

declare module 'react-native-vector-icons/MaterialCommunityIcons';
