import { Notification, Icon } from "@ledgerhq/react-ui";
import { CustomContentProps } from "notistack";
import React from "react";

// NOTE: https://notistack.com/features/customization#custom-variant-(typescript)
declare module "notistack" {
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
  const { id, errorType, message } = props;

  return (
    <div ref={ref} key={id}>
      <Notification
        badge={warningBadge}
        hasBackground={true}
        height={16}
        title={errorType}
        description={message?.toString() ?? ""}
        role="alert"
      />
    </div>
  );
});

ErrorNotification.displayName = "ErrorNotification";
