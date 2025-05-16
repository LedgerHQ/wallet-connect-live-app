import { Notification, Icon, Alert, Box } from "@ledgerhq/react-ui";
import { CustomContentProps, SnackbarContent, closeSnackbar } from "notistack";
import React from "react";

// NOTE: https://notistack.com/features/customization#custom-variant-(typescript)
declare module "notistack" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface VariantOverrides {
    errorNotification: {
      errorType: string;
    };
    connectionNotification: {
      connected: boolean;
    };
  }
}

const warningBadge = (
  <Notification.Badge
    color="warning.c50"
    backgroundColor="warning.c100"
    size={26}
    icon={<Icon name="Warning" size={20} />}
  />
);

type ErrorNotificationProps = CustomContentProps & {
  errorType: string;
};

export const ErrorNotification = React.forwardRef<
  HTMLDivElement,
  ErrorNotificationProps
>((myProps, ref) => {
  // Using myProps here as using props triggers an eslint false positive
  // https://github.com/jsx-eslint/eslint-plugin-react/issues/3796
  const { id, errorType, message, ...other } = myProps;

  if (typeof message !== "string") {
    throw new Error("We don't support sending ReactNode as a message");
  }

  return (
    <SnackbarContent
      ref={ref}
      role="alert"
      {...other}
      onClick={() => closeSnackbar(id)}
    >
      <Notification
        badge={warningBadge}
        hasBackground={true}
        title={errorType}
        description={message?.toString() ?? ""}
        role="alert"
      />
    </SnackbarContent>
  );
});

ErrorNotification.displayName = "ErrorNotification";

type ConnectionNotificationProps = CustomContentProps & {
  connected: boolean;
};

export const ConnectionNotification = React.forwardRef<
  HTMLDivElement,
  ConnectionNotificationProps
>((myProps, ref) => {
  // Using myProps here as using props triggers an eslint false positive
  // https://github.com/jsx-eslint/eslint-plugin-react/issues/3796
  const { id, connected, message, ...other } = myProps;

  if (typeof message !== "string") {
    throw new Error("We don't support sending ReactNode as a message");
  }

  return (
    <SnackbarContent
      ref={ref}
      role="alert"
      {...other}
      onClick={() => closeSnackbar(id)}
    >
      <Box width="100%">
        <Alert
          type={connected ? "success" : "error"}
          title={message?.toString() ?? ""}
        />
      </Box>
    </SnackbarContent>
  );
});

ConnectionNotification.displayName = "ErrorNotification";
