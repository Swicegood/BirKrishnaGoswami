import { Text, TextProps } from './Themed';

// This is an example of a component that is not used anywhere in the app. It is only here to

export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'SpaceMono' }]} />;
}
