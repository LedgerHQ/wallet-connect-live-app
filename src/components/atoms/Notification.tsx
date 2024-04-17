import { Notification, Icon } from "@ledgerhq/react-ui";
import { CustomContentProps, SnackbarContent } from "notistack";
import React from "react";

// NOTE: https://notistack.com/features/customization#custom-variant-(typescript)
declare module "notistack" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface VariantOverrides {
    errorNotification: {
      errorType: string;
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
>((props, ref) => {
  const { id: _id, errorType, message, ...other } = props;

  return (
    <SnackbarContent ref={ref} role="alert" {...other}>
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
