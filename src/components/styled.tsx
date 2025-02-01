// components/styled.tsx
import React from 'react';

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  mt?: number;
  mb?: number;
  p?: number;
  flex?: boolean;
  grid?: boolean;
  cols?: number;
  gap?: number;
  center?: boolean;
}

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(({
  mt,
  mb,
  p,
  flex,
  grid,
  cols,
  gap,
  center,
  style,
  ...props
}, ref) => {
  const computedStyle: React.CSSProperties = {
    ...(mt && { marginTop: `${mt * 0.25}rem` }),
    ...(mb && { marginBottom: `${mb * 0.25}rem` }),
    ...(p && { padding: `${p * 0.25}rem` }),
    ...(flex && { display: 'flex' }),
    ...(grid && { 
      display: 'grid',
      gridTemplateColumns: `repeat(${cols || 1}, minmax(0, 1fr))`,
      gap: gap ? `${gap * 0.25}rem` : undefined
    }),
    ...(center && { 
      alignItems: 'center',
      justifyContent: 'center'
    }),
    ...style
  };

  return <div ref={ref} style={computedStyle} {...props} />;
});

// Usage:
const MyComponent = () => {
  return (
    <Box flex center p={4} mt={2}>
      <Box grid cols={2} gap={4}>
        <div>Column 1</div>
        <div>Column 2</div>
      </Box>
    </Box>
  );
};