import { useState, useEffect } from "react";

const REMINDER_HOUR = 16;
const REMINDER_MINUTE = 38;

const NOTIFICATION_TITLE = "Test Message";
const NOTIFICATION_BODY = "Have a great time!";

const REMINDER_CHECK_INTERVAL = 20_000;
const LAST_SENT_REMINDER_STORAGE_KEY = "lastSentReminderKey";

const isIOSDevice = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent);

const isRunningAsInstalledApp = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const getNotificationPermission = () => {
  if (typeof window === "undefined") return "unsupported";

  if (!("Notification" in window)) return "unsupported";

  return Notification.permission;
};

const getNotificationBlockerReason = () => {
  if (typeof window === "undefined") {
    return "Not running in a browser.";
  }

  if (!("Notification" in window)) {
    return "This browser does not support notifications.";
  }

  if (!("serviceWorker" in navigator)) {
    return "This browser does not support Service Workers.";
  }

  if (isIOSDevice() && !isRunningAsInstalledApp()) {
    return "On iPhone or iPad, add this app to the Home Screen first.";
  }

  return null;
};

const getServiceWorkerRegistration = async () => {
  const existingRegistration =
    await navigator.serviceWorker.getRegistration();

  if (existingRegistration) {
    return existingRegistration;
  }

  await navigator.serviceWorker.register("/service-worker.js");

  return await navigator.serviceWorker.ready;
};

const padWithZero = (number) =>String(number).padStart(2, "0");

const formatReminderTime = (hour, minute) => {
  const formattedHour = hour % 12 || 12;
  const formattedMinute = padWithZero(minute);
  const meridiem = hour >= 12 ? "PM" : "AM";

  return `${formattedHour}:${formattedMinute} ${meridiem}`;
};

const createDailyReminderKey = () => {
  const today = new Date().toDateString();
  const reminderTime = `${padWithZero(REMINDER_HOUR)}:${padWithZero(
    REMINDER_MINUTE
  )}`;

  return `${today}-${reminderTime}`;
};

const getLastSentReminderKey = () => {
  try {
    return localStorage.getItem(LAST_SENT_REMINDER_STORAGE_KEY);
  } catch {
    return null;
  }
};

const saveLastSentReminderKey = (reminderKey) => {
  try {
    localStorage.setItem(
      LAST_SENT_REMINDER_STORAGE_KEY,
      reminderKey
    );
  } catch {
    //
  }
};

const removeLastSentReminderKey = () => {
  try {
    localStorage.removeItem(LAST_SENT_REMINDER_STORAGE_KEY);
  } catch {
    //
  }
};

const NotificationPermission = () => {
  const [permission, setPermission] = useState(
    getNotificationPermission
  );

  const [statusMessage, setStatusMessage] = useState("");
  const blockerReason = getNotificationBlockerReason();

  const requestNotificationPermission = async () => {
    const blockerReason = getNotificationBlockerReason();

    if (blockerReason) {
      setStatusMessage(blockerReason);
      return;
    }

    try {
      const permissionResult =
        await Notification.requestPermission();

      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        setStatusMessage(
          "Permission denied. Enable notifications in your browser settings."
        );
        return;
      }

      setStatusMessage("Notifications enabled successfully.");
    } catch {
      setStatusMessage("Could not request notification permission.");
    }
  };

  useEffect(() => {
    if (permission !== "granted") return;

    const blockerReason = getNotificationBlockerReason();

    if (blockerReason) return;

    const checkAndSendScheduledReminder = async () => {
      const currentTime = new Date();

      const scheduledReminderTime = new Date();

      scheduledReminderTime.setHours(
        REMINDER_HOUR,
        REMINDER_MINUTE,
        0,
        0
      );

      if (currentTime < scheduledReminderTime) return;

      const dailyReminderKey = createDailyReminderKey();

      if (
        getLastSentReminderKey() === dailyReminderKey
      ) {
        return;
      }

      try {
        const serviceWorkerRegistration =
          await getServiceWorkerRegistration();

        saveLastSentReminderKey(dailyReminderKey);

        await serviceWorkerRegistration.showNotification(
          NOTIFICATION_TITLE,
          {
            body: NOTIFICATION_BODY,
            icon: "/icon-192.png",
            badge: "/badge-72.png",
            tag: `scheduled-reminder-${dailyReminderKey}`,
          }
        );

        setStatusMessage(
          `Reminder sent at ${currentTime.toLocaleTimeString()}.`
        );
      } catch (error) {
        removeLastSentReminderKey();

        setStatusMessage(
          `Could not display the notification: ${error.message}`
        );
      }
    };

    checkAndSendScheduledReminder();

    const intervalId = setInterval(
      checkAndSendScheduledReminder,
      REMINDER_CHECK_INTERVAL
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndSendScheduledReminder();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      clearInterval(intervalId);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [permission]);

  return (
    <div>
      <h1>Reminder</h1>

      <p>
        A notification will appear automatically at{" "}
        {formatReminderTime(
          REMINDER_HOUR,
          REMINDER_MINUTE
        )}{" "}
        every day.
      </p>

      {permission === "default" && (
        <button
          type="button"
          onClick={requestNotificationPermission}
        >
          Allow notifications
        </button>
      )}

      <p>Permission: {permission}</p>

      {(blockerReason || statusMessage) && (
        <p role="status">
          {blockerReason || statusMessage}
        </p>
      )}
    </div>
  );
};

export default NotificationPermission;
