// import original module declarations
import { ColorPalette } from "@ledgerhq/react-ui/styles/index";
import "styled-components";

// and extend them!
declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends ColorPalette {}
}
