const size = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
};

export const device = {
  mobile: `(max-width: ${size.mobile}px)`,
  tablet: `(min-width: ${size.mobile + 1}px) and (max-width: ${size.tablet}px)`,
  desktop: `(min-width: ${size.tablet + 1}px)`,
};
